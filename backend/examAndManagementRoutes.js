const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("./db");

const router = express.Router();

/* =========================================================
   1. STUDENT MANAGEMENT ROUTES (Admin & Faculty)
========================================================= */

// Admin: View all students with academic telemetry
router.get("/api/admin/students", async (req, res) => {
    try {
        const { search, department, year, section } = req.query;

        let query = `
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.role,
                COALESCE(u.status, 'active') AS status,
                COALESCE(u.department, 'Computer Science & Engineering') AS department,
                COALESCE(u.year, '3rd Year') AS year,
                COALESCE(u.section, 'Section A') AS section,
                COALESCE(u.roll_number, '23000' || u.user_id) AS roll_number,
                u.created_at,
                (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = u.user_id) AS enrolled_courses_count,
                (SELECT COUNT(*) FROM submissions s WHERE s.student_id = u.user_id) AS submissions_count,
                (SELECT ROUND(AVG(marks), 1) FROM submissions s WHERE s.student_id = u.user_id AND s.marks IS NOT NULL) AS avg_assignment_score,
                (SELECT COUNT(*) FROM attendance a WHERE a.student_id = u.user_id AND a.status = 'Present') AS attendance_present_count,
                (SELECT COUNT(*) FROM attendance a WHERE a.student_id = u.user_id) AS attendance_total_count,
                (SELECT COUNT(*) FROM exam_submissions es WHERE es.student_id = u.user_id) AS exams_attempted_count
            FROM users u
            WHERE LOWER(u.role) = 'student'
        `;

        const values = [];
        const conditions = [];

        if (search && search.trim()) {
            values.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(u.full_name) LIKE $${values.length} OR LOWER(u.email) LIKE $${values.length} OR LOWER(COALESCE(u.roll_number, '')) LIKE $${values.length})`);
        }

        if (department && department !== 'all') {
            values.push(department);
            conditions.push(`u.department = $${values.length}`);
        }

        if (year && year !== 'all') {
            values.push(year);
            conditions.push(`u.year = $${values.length}`);
        }

        if (section && section !== 'all') {
            values.push(section);
            conditions.push(`u.section = $${values.length}`);
        }

        if (conditions.length > 0) {
            query += " AND " + conditions.join(" AND ");
        }

        query += " ORDER BY u.user_id ASC";

        const result = await pool.query(query, values);

        res.json(result.rows);
    } catch (error) {
        console.error("Admin students fetch error:", error);
        res.status(500).json({ error: "Failed to fetch student directory" });
    }
});

// Comprehensive Student Profile (Courses, Attendance, Submissions, Exams)
router.get("/api/students/:id/profile", async (req, res) => {
    try {
        const studentId = Number(req.params.id);

        const userRes = await pool.query(
            `SELECT 
                user_id, full_name, email, role,
                COALESCE(status, 'active') AS status,
                COALESCE(department, 'Computer Science & Engineering') AS department,
                COALESCE(year, '3rd Year') AS year,
                COALESCE(section, 'Section A') AS section,
                COALESCE(roll_number, '23000' || user_id) AS roll_number,
                created_at
             FROM users WHERE user_id = $1`,
            [studentId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const student = userRes.rows[0];

        // 1. Enrolled courses
        const coursesRes = await pool.query(
            `SELECT 
                c.course_id, c.course_code, c.course_name, c.description,
                u.full_name AS faculty_name, e.enrolled_at
             FROM enrollments e
             JOIN courses c ON e.course_id = c.course_id
             LEFT JOIN users u ON c.faculty_id = u.user_id
             WHERE e.student_id = $1
             ORDER BY c.course_code`,
            [studentId]
        );

        // 2. Attendance summary and records
        const attStatsRes = await pool.query(
            `SELECT 
                COUNT(*) AS total_classes,
                COUNT(CASE WHEN status = 'Present' THEN 1 END) AS present_count,
                COUNT(CASE WHEN status = 'Absent' THEN 1 END) AS absent_count,
                COUNT(CASE WHEN status = 'Late' THEN 1 END) AS late_count
             FROM attendance WHERE student_id = $1`,
            [studentId]
        );

        const attRecordsRes = await pool.query(
            `SELECT 
                a.attendance_id, a.course_id, c.course_code, c.course_name,
                TO_CHAR(a.date, 'YYYY-MM-DD') AS date, a.status,
                u.full_name AS marked_by_name
             FROM attendance a
             JOIN courses c ON a.course_id = c.course_id
             LEFT JOIN users u ON a.marked_by = u.user_id
             WHERE a.student_id = $1
             ORDER BY a.date DESC
             LIMIT 30`,
            [studentId]
        );

        // 3. Assignment submissions
        const subsRes = await pool.query(
            `SELECT 
                s.submission_id, s.assignment_id, s.submitted_at, s.marks, s.feedback,
                a.title AS assignment_title, a.max_marks, c.course_code, c.course_name
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.assignment_id
             JOIN courses c ON a.course_id = c.course_id
             WHERE s.student_id = $1
             ORDER BY s.submitted_at DESC`,
            [studentId]
        );

        // 4. Exam history and results
        const examsRes = await pool.query(
            `SELECT 
                es.attempt_id, es.exam_id, es.status AS attempt_status,
                es.total_score, es.percentage, es.grade, es.feedback,
                es.submitted_at, ex.title AS exam_title, ex.total_marks,
                ex.results_published, c.course_code, c.course_name
             FROM exam_submissions es
             JOIN exams ex ON es.exam_id = ex.exam_id
             JOIN courses c ON ex.course_id = c.course_id
             WHERE es.student_id = $1
             ORDER BY es.submitted_at DESC`,
            [studentId]
        );

        res.json({
            student,
            courses: coursesRes.rows,
            attendance: {
                stats: attStatsRes.rows[0],
                records: attRecordsRes.rows
            },
            submissions: subsRes.rows,
            exams: examsRes.rows
        });
    } catch (error) {
        console.error("Student profile error:", error);
        res.status(500).json({ error: "Failed to load student profile" });
    }
});

// Admin: Toggle student active/inactive status
router.patch("/api/students/:id/status", async (req, res) => {
    try {
        const studentId = Number(req.params.id);
        const { status } = req.body;

        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: "Valid status ('active' or 'inactive') is required" });
        }

        const result = await pool.query(
            `UPDATE users
             SET status = $1
             WHERE user_id = $2 AND LOWER(role) = 'student'
             RETURNING user_id, full_name, email, role, status`,
            [status, studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json({
            message: `Student account ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
            student: result.rows[0]
        });
    } catch (error) {
        console.error("Student status update error:", error);
        res.status(500).json({ error: "Failed to update student account status" });
    }
});

// Admin: Create new Student account
router.post("/api/admin/students", async (req, res) => {
    try {
        let { full_name, email, password, department, year, section, roll_number, status } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: "Full Name, Email, and Password are required" });
        }

        let normalizedEmail = email.trim().toLowerCase();
        const rollMatch = normalizedEmail.match(/^(\d+)(@klh\.edu\.in)?$/);
        if (rollMatch) {
            normalizedEmail = `${rollMatch[1]}@klh.edu.in`;
            if (!roll_number) roll_number = rollMatch[1];
        } else if (!normalizedEmail.endsWith("@klh.edu.in")) {
            return res.status(400).json({ error: "Student email must follow the institutional roll number format: rollnumber@klh.edu.in (e.g. 2200030001@klh.edu.in)" });
        }

        const existing = await pool.query("SELECT user_id FROM users WHERE LOWER(email) = $1", [normalizedEmail]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "An account with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        const finalDept = department || "Computer Science & Engineering";
        const finalYear = year || "3rd Year";
        const finalSection = section || "Section A";
        const finalStatus = status || "active";

        const insertRes = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, status, department, year, section, roll_number)
             VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, $8)
             RETURNING user_id, full_name, email, role, status, department, year, section, roll_number, created_at`,
            [
                normalizedEmail,
                hashedPassword,
                full_name.trim(),
                finalStatus,
                finalDept,
                finalYear,
                finalSection,
                roll_number ? roll_number.trim() : null
            ]
        );

        const newStudent = insertRes.rows[0];
        if (!newStudent.roll_number) {
            const genRoll = `23000${newStudent.user_id}`;
            await pool.query("UPDATE users SET roll_number = $1 WHERE user_id = $2", [genRoll, newStudent.user_id]);
            newStudent.roll_number = genRoll;
        }

        res.status(201).json({
            message: "Student account created successfully",
            student: newStudent
        });
    } catch (error) {
        console.error("Create student error:", error);
        res.status(500).json({ error: "Failed to create student: " + error.message });
    }
});

// Admin: Update Student Academic Profile (assign section, department, year, roll_number, name)
router.put("/api/admin/students/:id", async (req, res) => {
    try {
        const studentId = Number(req.params.id);
        const { full_name, section, department, year, roll_number, status } = req.body;

        const updateRes = await pool.query(
            `UPDATE users
             SET full_name = COALESCE($1, full_name),
                 section = COALESCE($2, section),
                 department = COALESCE($3, department),
                 year = COALESCE($4, year),
                 roll_number = COALESCE($5, roll_number),
                 status = COALESCE($6, status)
             WHERE user_id = $7 AND LOWER(role) = 'student'
             RETURNING user_id, full_name, email, role, status, department, year, section, roll_number`,
            [
                full_name ? full_name.trim() : null,
                section ? section.trim() : null,
                department ? department.trim() : null,
                year ? year.trim() : null,
                roll_number ? roll_number.trim() : null,
                status ? status.trim() : null,
                studentId
            ]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json({
            message: "Student academic profile and section updated successfully",
            student: updateRes.rows[0]
        });
    } catch (error) {
        console.error("Update student profile error:", error);
        res.status(500).json({ error: "Failed to update student academic profile: " + error.message });
    }
});

// Faculty: View students enrolled in faculty's assigned courses only
router.get("/api/faculty/students", async (req, res) => {
    try {
        const { facultyId, courseId, search } = req.query;

        if (!facultyId) {
            return res.status(400).json({ error: "Faculty ID is required" });
        }

        let query = `
            SELECT DISTINCT
                u.user_id,
                u.full_name,
                u.email,
                COALESCE(u.roll_number, '23000' || u.user_id) AS roll_number,
                COALESCE(u.department, 'Computer Science & Engineering') AS department,
                COALESCE(u.year, '3rd Year') AS year,
                COALESCE(u.section, 'Section A') AS section,
                COALESCE(u.status, 'active') AS status,
                c.course_id,
                c.course_code,
                c.course_name,
                (SELECT ROUND(AVG(s.marks), 1) 
                 FROM submissions s 
                 JOIN assignments a ON s.assignment_id = a.assignment_id 
                 WHERE s.student_id = u.user_id AND a.course_id = c.course_id AND s.marks IS NOT NULL) AS avg_assignment_score,
                (SELECT COUNT(*) FROM attendance att WHERE att.student_id = u.user_id AND att.course_id = c.course_id AND att.status = 'Present') AS attendance_present,
                (SELECT COUNT(*) FROM attendance att WHERE att.student_id = u.user_id AND att.course_id = c.course_id) AS attendance_total,
                (SELECT es.grade 
                 FROM exam_submissions es 
                 JOIN exams ex ON es.exam_id = ex.exam_id 
                 WHERE es.student_id = u.user_id AND ex.course_id = c.course_id AND ex.results_published = true 
                 ORDER BY es.submitted_at DESC LIMIT 1) AS latest_exam_grade
            FROM users u
            JOIN enrollments e ON u.user_id = e.student_id
            JOIN courses c ON e.course_id = c.course_id
            WHERE c.faculty_id = $1
        `;

        const values = [Number(facultyId)];

        if (courseId && courseId !== 'all') {
            values.push(Number(courseId));
            query += ` AND c.course_id = $${values.length}`;
        }

        if (search && search.trim()) {
            values.push(`%${search.trim().toLowerCase()}%`);
            query += ` AND (LOWER(u.full_name) LIKE $${values.length} OR LOWER(u.email) LIKE $${values.length} OR LOWER(COALESCE(u.roll_number, '')) LIKE $${values.length})`;
        }

        query += " ORDER BY u.full_name ASC";

        const result = await pool.query(query, values);
        let rows = result.rows;

        // If faculty has no specific courses assigned yet or 0 enrollments in their section,
        // provide the university student cohort so faculty can view rosters and academic profiles
        if (rows.length === 0) {
            const generalResult = await pool.query(`
                SELECT DISTINCT
                    u.user_id,
                    u.full_name,
                    u.email,
                    COALESCE(u.roll_number, '23000' || u.user_id) AS roll_number,
                    COALESCE(u.department, 'Computer Science & Engineering') AS department,
                    COALESCE(u.year, '3rd Year') AS year,
                    COALESCE(u.section, 'Section A') AS section,
                    COALESCE(u.status, 'active') AS status,
                    COALESCE(c.course_id, 1) AS course_id,
                    COALESCE(c.course_code, 'CS101') AS course_code,
                    COALESCE(c.course_name, 'Database Management Systems') AS course_name,
                    (SELECT ROUND(AVG(s.marks), 1) 
                     FROM submissions s 
                     WHERE s.student_id = u.user_id AND s.marks IS NOT NULL) AS avg_assignment_score,
                    (SELECT COUNT(*) FROM attendance att WHERE att.student_id = u.user_id AND att.status = 'Present') AS attendance_present,
                    (SELECT COUNT(*) FROM attendance att WHERE att.student_id = u.user_id) AS attendance_total,
                    (SELECT es.grade 
                     FROM exam_submissions es 
                     WHERE es.student_id = u.user_id 
                     ORDER BY es.submitted_at DESC LIMIT 1) AS latest_exam_grade
                FROM users u
                LEFT JOIN enrollments e ON u.user_id = e.student_id
                LEFT JOIN courses c ON e.course_id = c.course_id
                WHERE u.role = 'student'
                ORDER BY u.full_name ASC
            `);
            rows = generalResult.rows;
        }

        res.json(rows);
    } catch (error) {
        console.error("Faculty students error:", error);
        res.status(500).json({ error: "Failed to fetch course students" });
    }
});

/* =========================================================
   2. FACULTY MANAGEMENT ROUTES (Admin)
========================================================= */

// Admin: View all faculty with assigned courses and workload
router.get("/api/admin/faculty", async (req, res) => {
    try {
        const { search, department } = req.query;

        let query = `
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.role,
                COALESCE(u.status, 'active') AS status,
                COALESCE(u.department, 'Computer Science & Engineering') AS department,
                u.created_at,
                (SELECT COUNT(*) FROM courses c WHERE c.faculty_id = u.user_id) AS courses_count,
                (SELECT COUNT(DISTINCT e.student_id) 
                 FROM courses c 
                 JOIN enrollments e ON c.course_id = e.course_id 
                 WHERE c.faculty_id = u.user_id) AS total_students_count,
                (SELECT COUNT(*) FROM exams ex WHERE ex.faculty_id = u.user_id) AS exams_conducted_count,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT('course_id', c.course_id, 'course_code', c.course_code, 'course_name', c.course_name))
                     FROM courses c WHERE c.faculty_id = u.user_id),
                    '[]'::json
                ) AS assigned_courses
            FROM users u
            WHERE LOWER(u.role) = 'faculty'
        `;

        const values = [];
        const conditions = [];

        if (search && search.trim()) {
            values.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(u.full_name) LIKE $${values.length} OR LOWER(u.email) LIKE $${values.length})`);
        }

        if (department && department !== 'all') {
            values.push(department);
            conditions.push(`u.department = $${values.length}`);
        }

        if (conditions.length > 0) {
            query += " AND " + conditions.join(" AND ");
        }

        query += " ORDER BY u.user_id ASC";

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error("Admin faculty fetch error:", error);
        res.status(500).json({ error: "Failed to fetch faculty list" });
    }
});

// Admin: Toggle faculty active/inactive status
router.patch("/api/faculty/:id/status", async (req, res) => {
    try {
        const facultyId = Number(req.params.id);
        const { status } = req.body;

        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: "Valid status ('active' or 'inactive') is required" });
        }

        const result = await pool.query(
            `UPDATE users
             SET status = $1
             WHERE user_id = $2 AND LOWER(role) = 'faculty'
             RETURNING user_id, full_name, email, role, status`,
            [status, facultyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Faculty member not found" });
        }

        res.json({
            message: `Faculty member ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
            faculty: result.rows[0]
        });
    } catch (error) {
        console.error("Faculty status update error:", error);
        res.status(500).json({ error: "Failed to update faculty status" });
    }
});

// Admin: Assign course to a faculty member
router.post("/api/faculty/assign-course", async (req, res) => {
    try {
        const { course_id, faculty_id } = req.body;

        if (!course_id || !faculty_id) {
            return res.status(400).json({ error: "Course ID and Faculty ID are required" });
        }

        const courseCheck = await pool.query("SELECT * FROM courses WHERE course_id = $1", [Number(course_id)]);
        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        const facultyCheck = await pool.query("SELECT * FROM users WHERE user_id = $1 AND LOWER(role) = 'faculty'", [Number(faculty_id)]);
        if (facultyCheck.rows.length === 0) {
            return res.status(404).json({ error: "Faculty member not found" });
        }

        const result = await pool.query(
            `UPDATE courses
             SET faculty_id = $1
             WHERE course_id = $2
             RETURNING course_id, course_code, course_name, faculty_id`,
            [Number(faculty_id), Number(course_id)]
        );

        res.json({
            message: "Course successfully assigned to faculty",
            course: result.rows[0]
        });
    } catch (error) {
        console.error("Course assignment error:", error);
        res.status(500).json({ error: "Failed to assign course" });
    }
});

// Admin: Create new Faculty account
router.post("/api/admin/faculty", async (req, res) => {
    try {
        let { full_name, email, password, department, status, assigned_course_id } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: "Full Name, Email, and Password are required" });
        }

        let normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail.startsWith("fac") && !normalizedEmail.startsWith("emp") && !normalizedEmail.endsWith("@faculty.edu.in")) {
            return res.status(400).json({ error: "Faculty email must follow the institutional pattern: fac[EmpID]@klh.edu.in (e.g. fac10342@klh.edu.in)" });
        }
        if (!normalizedEmail.includes("@")) {
            normalizedEmail += "@klh.edu.in";
        }

        const existing = await pool.query("SELECT user_id FROM users WHERE LOWER(email) = $1", [normalizedEmail]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "An account with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        const finalDept = department || "Computer Science & Engineering";
        const finalStatus = status || "active";

        const insertRes = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, status, department)
             VALUES ($1, $2, $3, 'faculty', $4, $5)
             RETURNING user_id, full_name, email, role, status, department, created_at`,
            [
                normalizedEmail,
                hashedPassword,
                full_name.trim(),
                finalStatus,
                finalDept
            ]
        );

        const newFaculty = insertRes.rows[0];

        // If an initial course was assigned, assign it immediately
        if (assigned_course_id) {
            await pool.query("UPDATE courses SET faculty_id = $1 WHERE course_id = $2", [newFaculty.user_id, Number(assigned_course_id)]);
        }

        res.status(201).json({
            message: "Faculty account created successfully",
            faculty: newFaculty
        });
    } catch (error) {
        console.error("Create faculty error:", error);
        res.status(500).json({ error: "Failed to create faculty: " + error.message });
    }
});

/* =========================================================
   3. EXAM MANAGEMENT & SCHEDULER (Conflict Detection)
========================================================= */

// Helper: Conflict detection for exam scheduling
async function checkExamConflict({ exam_date, start_time, end_time, course_id, student_group, exclude_exam_id }) {
    let query = `
        SELECT 
            ex.exam_id, ex.title, 
            TO_CHAR(ex.exam_date, 'YYYY-MM-DD') AS exam_date, 
            ex.start_time, ex.end_time, ex.student_group,
            c.course_code, c.course_name
        FROM exams ex
        JOIN courses c ON ex.course_id = c.course_id
        WHERE ex.exam_date = $1::date
          AND ex.status NOT IN ('cancelled', 'completed')
          AND (
            ex.course_id = $2 OR
            ex.student_group = $3 OR
            $3 = 'All Enrolled Students' OR
            ex.student_group = 'All Enrolled Students'
          )
          AND (
            (ex.start_time <= $4 AND ex.end_time > $4) OR
            (ex.start_time < $5 AND ex.end_time >= $5) OR
            (ex.start_time >= $4 AND ex.end_time <= $5)
          )
    `;

    const values = [exam_date, Number(course_id), student_group || 'All Enrolled Students', start_time, end_time];

    if (exclude_exam_id) {
        values.push(Number(exclude_exam_id));
        query += ` AND ex.exam_id != $${values.length}`;
    }

    const res = await pool.query(query, values);
    return res.rows.length > 0 ? res.rows[0] : null;
}

// Get Exams list with role filtering
router.get("/api/exams", async (req, res) => {
    try {
        const { facultyId, studentId, role } = req.query;

        let query = "";
        let values = [];

        if (studentId) {
            // Student: Only published exams for courses they are enrolled in
            query = `
                SELECT 
                    ex.exam_id,
                    ex.course_id,
                    ex.faculty_id,
                    ex.title,
                    ex.student_group,
                    ex.instructions,
                    TO_CHAR(ex.exam_date, 'YYYY-MM-DD') AS exam_date,
                    ex.start_time,
                    ex.end_time,
                    ex.duration_minutes,
                    ex.total_marks,
                    ex.status,
                    ex.is_published,
                    ex.results_published,
                    c.course_code,
                    c.course_name,
                    u.full_name AS faculty_name,
                    (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = ex.exam_id) AS questions_count,
                    sub.attempt_id,
                    COALESCE(sub.status, 'not_started') AS attempt_status,
                    sub.total_score,
                    sub.percentage,
                    sub.grade
                FROM exams ex
                JOIN courses c ON ex.course_id = c.course_id
                LEFT JOIN users u ON ex.faculty_id = u.user_id
                JOIN enrollments e ON ex.course_id = e.course_id AND e.student_id = $1
                LEFT JOIN exam_submissions sub ON ex.exam_id = sub.exam_id AND sub.student_id = $1
                WHERE ex.is_published = true AND ex.status != 'cancelled'
                ORDER BY ex.exam_date ASC, ex.start_time ASC
            `;
            values = [Number(studentId)];
        } else if (facultyId && role !== 'admin') {
            // Faculty: Exams for their courses
            query = `
                SELECT 
                    ex.exam_id,
                    ex.course_id,
                    ex.faculty_id,
                    ex.title,
                    ex.student_group,
                    ex.instructions,
                    TO_CHAR(ex.exam_date, 'YYYY-MM-DD') AS exam_date,
                    ex.start_time,
                    ex.end_time,
                    ex.duration_minutes,
                    ex.total_marks,
                    ex.status,
                    ex.is_published,
                    ex.results_published,
                    c.course_code,
                    c.course_name,
                    u.full_name AS faculty_name,
                    (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = ex.exam_id) AS questions_count,
                    (SELECT COUNT(*) FROM exam_submissions es WHERE es.exam_id = ex.exam_id) AS submissions_count,
                    (SELECT COUNT(*) FROM enrollments en WHERE en.course_id = ex.course_id) AS total_eligible_students
                FROM exams ex
                JOIN courses c ON ex.course_id = c.course_id
                LEFT JOIN users u ON ex.faculty_id = u.user_id
                WHERE ex.faculty_id = $1 OR c.faculty_id = $1
                ORDER BY ex.exam_date ASC, ex.start_time ASC
            `;
            values = [Number(facultyId)];
        } else {
            // Admin: All platform exams
            query = `
                SELECT 
                    ex.exam_id,
                    ex.course_id,
                    ex.faculty_id,
                    ex.title,
                    ex.student_group,
                    ex.instructions,
                    TO_CHAR(ex.exam_date, 'YYYY-MM-DD') AS exam_date,
                    ex.start_time,
                    ex.end_time,
                    ex.duration_minutes,
                    ex.total_marks,
                    ex.status,
                    ex.is_published,
                    ex.results_published,
                    c.course_code,
                    c.course_name,
                    u.full_name AS faculty_name,
                    (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = ex.exam_id) AS questions_count,
                    (SELECT COUNT(*) FROM exam_submissions es WHERE es.exam_id = ex.exam_id) AS submissions_count,
                    (SELECT COUNT(*) FROM enrollments en WHERE en.course_id = ex.course_id) AS total_eligible_students
                FROM exams ex
                JOIN courses c ON ex.course_id = c.course_id
                LEFT JOIN users u ON ex.faculty_id = u.user_id
                ORDER BY ex.exam_date DESC, ex.start_time DESC
            `;
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error("Exams fetch error:", error);
        res.status(500).json({ error: "Failed to fetch exams list" });
    }
});

// Get single Exam details with questions
router.get("/api/exams/:id", async (req, res) => {
    try {
        const examId = Number(req.params.id);
        const { studentId } = req.query;

        const examRes = await pool.query(
            `SELECT 
                ex.exam_id, ex.course_id, ex.faculty_id, ex.title, ex.student_group,
                ex.instructions, TO_CHAR(ex.exam_date, 'YYYY-MM-DD') AS exam_date,
                ex.start_time, ex.end_time, ex.duration_minutes, ex.total_marks,
                ex.status, ex.is_published, ex.results_published, ex.created_at,
                c.course_code, c.course_name, u.full_name AS faculty_name
             FROM exams ex
             JOIN courses c ON ex.course_id = c.course_id
             LEFT JOIN users u ON ex.faculty_id = u.user_id
             WHERE ex.exam_id = $1`,
            [examId]
        );

        if (examRes.rows.length === 0) {
            return res.status(404).json({ error: "Exam not found" });
        }

        const exam = examRes.rows[0];

        // Fetch questions
        const questionsRes = await pool.query(
            `SELECT question_id, exam_id, question_number, question_text, question_type, options, marks, correct_answer
             FROM exam_questions
             WHERE exam_id = $1
             ORDER BY question_number ASC`,
            [examId]
        );

        let questions = questionsRes.rows;

        // Check if student has already submitted
        let attempt = null;
        if (studentId) {
            const attRes = await pool.query(
                `SELECT attempt_id, exam_id, student_id, started_at, submitted_at, status, total_score, percentage, grade, feedback
                 FROM exam_submissions
                 WHERE exam_id = $1 AND student_id = $2`,
                [examId, Number(studentId)]
            );
            attempt = attRes.rows[0] || null;

            // If student is taking the exam and results are not published, hide correct answers!
            if (!exam.results_published && (!attempt || attempt.status === 'in_progress')) {
                questions = questions.map(q => {
                    const { correct_answer, ...safeQ } = q;
                    return safeQ;
                });
            }
        }

        res.json({
            exam,
            questions,
            attempt
        });
    } catch (error) {
        console.error("Exam detail error:", error);
        res.status(500).json({ error: "Failed to fetch exam details" });
    }
});

// Create new Exam with schedule conflict checking
router.post("/api/exams", async (req, res) => {
    try {
        const {
            course_id,
            faculty_id,
            title,
            student_group,
            instructions,
            exam_date,
            start_time,
            end_time,
            duration_minutes,
            total_marks,
            questions,
            is_published
        } = req.body;

        if (!course_id || !title || !exam_date || !start_time || !end_time) {
            return res.status(400).json({
                error: "Course, Title, Exam Date, Start Time and End Time are required"
            });
        }

        // 1. Conflict Check
        const conflict = await checkExamConflict({
            exam_date,
            start_time,
            end_time,
            course_id,
            student_group: student_group || 'All Enrolled Students'
        });

        if (conflict) {
            return res.status(409).json({
                conflict: true,
                error: `Schedule Conflict: This student group already has an exam during this time (${conflict.title} [${conflict.course_code}] from ${conflict.start_time} to ${conflict.end_time}).`
            });
        }

        // 2. Insert Exam
        const examRes = await pool.query(
            `INSERT INTO exams 
            (course_id, faculty_id, title, student_group, instructions, exam_date, start_time, end_time, duration_minutes, total_marks, status, is_published)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                Number(course_id),
                faculty_id ? Number(faculty_id) : null,
                title.trim(),
                student_group || 'All Enrolled Students',
                instructions || 'Read all instructions carefully before starting.',
                exam_date,
                start_time,
                end_time,
                Number(duration_minutes) || 60,
                Number(total_marks) || 100,
                is_published ? 'scheduled' : 'draft',
                Boolean(is_published)
            ]
        );

        const newExam = examRes.rows[0];

        // 3. Insert questions if provided
        if (Array.isArray(questions) && questions.length > 0) {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                await pool.query(
                    `INSERT INTO exam_questions
                    (exam_id, question_number, question_text, question_type, options, correct_answer, marks)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        newExam.exam_id,
                        i + 1,
                        q.question_text || `Question ${i + 1}`,
                        q.question_type || 'mcq',
                        q.options ? JSON.stringify(q.options) : null,
                        q.correct_answer || null,
                        Number(q.marks) || 5
                    ]
                );
            }
        }

        res.status(201).json({
            message: "Exam created and scheduled successfully",
            exam: newExam
        });
    } catch (error) {
        console.error("Create exam error:", error);
        res.status(500).json({ error: "Failed to create exam: " + error.message });
    }
});

// Update Exam with conflict checking
router.put("/api/exams/:id", async (req, res) => {
    try {
        const examId = Number(req.params.id);
        const {
            title,
            student_group,
            instructions,
            exam_date,
            start_time,
            end_time,
            duration_minutes,
            total_marks,
            status,
            is_published,
            course_id,
            questions
        } = req.body;

        // Conflict check if time/date changed
        if (exam_date && start_time && end_time && course_id) {
            const conflict = await checkExamConflict({
                exam_date,
                start_time,
                end_time,
                course_id,
                student_group: student_group || 'All Enrolled Students',
                exclude_exam_id: examId
            });

            if (conflict) {
                return res.status(409).json({
                    conflict: true,
                    error: `Schedule Conflict: This student group already has an exam during this time (${conflict.title} [${conflict.course_code}] from ${conflict.start_time} to ${conflict.end_time}).`
                });
            }
        }

        const updateRes = await pool.query(
            `UPDATE exams
             SET title = COALESCE($1, title),
                 student_group = COALESCE($2, student_group),
                 instructions = COALESCE($3, instructions),
                 exam_date = COALESCE($4, exam_date),
                 start_time = COALESCE($5, start_time),
                 end_time = COALESCE($6, end_time),
                 duration_minutes = COALESCE($7, duration_minutes),
                 total_marks = COALESCE($8, total_marks),
                 status = COALESCE($9, status),
                 is_published = COALESCE($10, is_published)
             WHERE exam_id = $11
             RETURNING *`,
            [
                title, student_group, instructions, exam_date,
                start_time, end_time, duration_minutes, total_marks,
                status, is_published, examId
            ]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ error: "Exam not found" });
        }

        // Update questions if provided
        if (Array.isArray(questions)) {
            await pool.query("DELETE FROM exam_questions WHERE exam_id = $1", [examId]);
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                await pool.query(
                    `INSERT INTO exam_questions
                    (exam_id, question_number, question_text, question_type, options, correct_answer, marks)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        examId,
                        i + 1,
                        q.question_text || `Question ${i + 1}`,
                        q.question_type || 'mcq',
                        q.options ? JSON.stringify(q.options) : null,
                        q.correct_answer || null,
                        Number(q.marks) || 5
                    ]
                );
            }
        }

        res.json({
            message: "Exam updated successfully",
            exam: updateRes.rows[0]
        });
    } catch (error) {
        console.error("Update exam error:", error);
        res.status(500).json({ error: "Failed to update exam: " + error.message });
    }
});

// Publish Exam
router.put("/api/exams/:id/publish", async (req, res) => {
    try {
        const examId = Number(req.params.id);
        const result = await pool.query(
            `UPDATE exams 
             SET is_published = true, status = 'scheduled'
             WHERE exam_id = $1
             RETURNING *`,
            [examId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Exam not found" });
        res.json({ message: "Exam published to students", exam: result.rows[0] });
    } catch (error) {
        console.error("Publish exam error:", error);
        res.status(500).json({ error: "Failed to publish exam" });
    }
});

// Cancel Exam
router.put("/api/exams/:id/cancel", async (req, res) => {
    try {
        const examId = Number(req.params.id);
        const result = await pool.query(
            `UPDATE exams 
             SET status = 'cancelled'
             WHERE exam_id = $1
             RETURNING *`,
            [examId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Exam not found" });
        res.json({ message: "Exam cancelled", exam: result.rows[0] });
    } catch (error) {
        console.error("Cancel exam error:", error);
        res.status(500).json({ error: "Failed to cancel exam" });
    }
});

// Publish Exam Results
router.put("/api/exams/:id/publish-results", async (req, res) => {
    try {
        const examId = Number(req.params.id);
        const result = await pool.query(
            `UPDATE exams 
             SET results_published = true, status = 'completed'
             WHERE exam_id = $1
             RETURNING *`,
            [examId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Exam not found" });
        res.json({ message: "Exam results published to students", exam: result.rows[0] });
    } catch (error) {
        console.error("Publish results error:", error);
        res.status(500).json({ error: "Failed to publish results" });
    }
});

/* =========================================================
   4. STUDENT EXAM TAKING & SUBMISSION FLOW
========================================================= */

// Start Exam Attempt
router.post("/api/exams/:id/start", async (req, res) => {
    try {
        const examId = Number(req.params.id);
        const { student_id } = req.body;

        if (!student_id) return res.status(400).json({ error: "Student ID is required" });

        const studentId = Number(student_id);

        // Check if student already submitted
        const existingAttempt = await pool.query(
            "SELECT * FROM exam_submissions WHERE exam_id = $1 AND student_id = $2",
            [examId, studentId]
        );

        if (existingAttempt.rows.length > 0) {
            const att = existingAttempt.rows[0];
            if (att.status === 'submitted' || att.status === 'evaluated') {
                return res.status(400).json({
                    error: "You have already submitted this exam.",
                    already_submitted: true,
                    attempt: att
                });
            }
            return res.json({ message: "Resuming in-progress exam attempt", attempt: att });
        }

        // Create new attempt
        const newAttempt = await pool.query(
            `INSERT INTO exam_submissions 
            (exam_id, student_id, started_at, status)
            VALUES ($1, $2, CURRENT_TIMESTAMP, 'in_progress')
            RETURNING *`,
            [examId, studentId]
        );

        res.status(201).json({
            message: "Exam attempt started",
            attempt: newAttempt.rows[0]
        });
    } catch (error) {
        console.error("Start exam error:", error);
        res.status(500).json({ error: "Failed to start exam attempt" });
    }
});

// Autosave Question Answer
router.post("/api/exams/:id/autosave", async (req, res) => {
    try {
        const { attempt_id, question_id, student_answer } = req.body;

        if (!attempt_id || !question_id) {
            return res.status(400).json({ error: "Attempt ID and Question ID are required" });
        }

        const result = await pool.query(
            `INSERT INTO exam_answers (attempt_id, question_id, student_answer)
             VALUES ($1, $2, $3)
             ON CONFLICT (attempt_id, question_id) 
             DO UPDATE SET student_answer = EXCLUDED.student_answer, created_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [Number(attempt_id), Number(question_id), student_answer || '']
        );

        res.json({ message: "Answer saved", answer: result.rows[0] });
    } catch (error) {
        console.error("Autosave error:", error);
        res.status(500).json({ error: "Failed to autosave answer" });
    }
});

// Final Submit Exam Attempt (Auto-evaluates MCQs & True/False)
router.post("/api/exams/:id/submit", async (req, res) => {
    try {
        const examId = Number(req.params.id);
        const { attempt_id, student_id, answers } = req.body;

        if (!attempt_id || !student_id) {
            return res.status(400).json({ error: "Attempt ID and Student ID are required" });
        }

        const attemptCheck = await pool.query(
            "SELECT * FROM exam_submissions WHERE attempt_id = $1 AND student_id = $2",
            [Number(attempt_id), Number(student_id)]
        );

        if (attemptCheck.rows.length === 0) {
            return res.status(404).json({ error: "Exam attempt not found" });
        }

        const currentAtt = attemptCheck.rows[0];
        if (currentAtt.status === 'submitted' || currentAtt.status === 'evaluated') {
            return res.status(400).json({ error: "Exam has already been submitted." });
        }

        // Fetch questions
        const questionsRes = await pool.query(
            "SELECT question_id, question_type, correct_answer, marks FROM exam_questions WHERE exam_id = $1",
            [examId]
        );
        const questions = questionsRes.rows;

        let autoGradedScore = 0;
        let totalPossibleAutoMarks = 0;
        let hasManualQuestions = false;

        // Process answers and save
        const answersMap = answers || {};

        for (const q of questions) {
            const givenAnswer = (answersMap[q.question_id] || "").trim();
            const isAutoGradable = ['mcq', 'true_false', 'multiple_choice'].includes(q.question_type);

            let marksAwarded = 0;
            let isEvaluated = false;

            if (isAutoGradable && q.correct_answer) {
                totalPossibleAutoMarks += Number(q.marks);
                if (givenAnswer.toLowerCase() === q.correct_answer.trim().toLowerCase()) {
                    marksAwarded = Number(q.marks);
                } else {
                    marksAwarded = 0;
                }
                isEvaluated = true;
                autoGradedScore += marksAwarded;
            } else {
                hasManualQuestions = true;
                marksAwarded = 0;
                isEvaluated = false;
            }

            // Save to exam_answers
            await pool.query(
                `INSERT INTO exam_answers (attempt_id, question_id, student_answer, marks_awarded, is_evaluated)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (attempt_id, question_id)
                 DO UPDATE SET 
                    student_answer = EXCLUDED.student_answer,
                    marks_awarded = EXCLUDED.marks_awarded,
                    is_evaluated = EXCLUDED.is_evaluated`,
                [Number(attempt_id), q.question_id, givenAnswer, marksAwarded, isEvaluated]
            );
        }

        // Fetch exam total marks
        const examInfo = await pool.query("SELECT total_marks FROM exams WHERE exam_id = $1", [examId]);
        const examTotalMarks = Number(examInfo.rows[0]?.total_marks) || 100;

        const percentage = Math.round((autoGradedScore / examTotalMarks) * 100);
        let grade = 'A';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else grade = 'F';

        const finalStatus = hasManualQuestions ? 'submitted' : 'evaluated';

        const updateAttempt = await pool.query(
            `UPDATE exam_submissions
             SET submitted_at = CURRENT_TIMESTAMP,
                 status = $1,
                 total_score = $2,
                 percentage = $3,
                 grade = $4
             WHERE attempt_id = $5
             RETURNING *`,
            [finalStatus, autoGradedScore, percentage, grade, Number(attempt_id)]
        );

        res.json({
            message: "Exam submitted successfully",
            status: finalStatus,
            attempt: updateAttempt.rows[0]
        });
    } catch (error) {
        console.error("Submit exam error:", error);
        res.status(500).json({ error: "Failed to submit exam: " + error.message });
    }
});

// View all submissions for an exam (for Faculty / Admin)
router.get("/api/exams/:id/submissions", async (req, res) => {
    try {
        const examId = Number(req.params.id);

        const result = await pool.query(
            `SELECT 
                es.attempt_id,
                es.exam_id,
                es.student_id,
                es.started_at,
                es.submitted_at,
                es.status,
                es.total_score,
                es.percentage,
                es.grade,
                es.feedback,
                u.full_name AS student_name,
                u.email AS student_email,
                COALESCE(u.roll_number, '23000' || u.user_id) AS roll_number,
                COALESCE(u.section, 'Section A') AS section,
                ex.title AS exam_title,
                ex.total_marks
             FROM exam_submissions es
             JOIN users u ON es.student_id = u.user_id
             JOIN exams ex ON es.exam_id = ex.exam_id
             WHERE es.exam_id = $1
             ORDER BY es.submitted_at DESC NULLS LAST`,
            [examId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Exam submissions fetch error:", error);
        res.status(500).json({ error: "Failed to fetch exam submissions" });
    }
});

// View single student submission details with answers & questions
router.get("/api/exams/submissions/:attemptId", async (req, res) => {
    try {
        const attemptId = Number(req.params.attemptId);

        const attemptRes = await pool.query(
            `SELECT 
                es.attempt_id, es.exam_id, es.student_id, es.started_at,
                es.submitted_at, es.status, es.total_score, es.percentage,
                es.grade, es.feedback, es.evaluated_at,
                u.full_name AS student_name, u.email AS student_email,
                COALESCE(u.roll_number, '23000' || u.user_id) AS roll_number,
                ex.title AS exam_title, ex.total_marks, ex.results_published,
                c.course_code, c.course_name
             FROM exam_submissions es
             JOIN users u ON es.student_id = u.user_id
             JOIN exams ex ON es.exam_id = ex.exam_id
             JOIN courses c ON ex.course_id = c.course_id
             WHERE es.attempt_id = $1`,
            [attemptId]
        );

        if (attemptRes.rows.length === 0) {
            return res.status(404).json({ error: "Attempt not found" });
        }

        const attempt = attemptRes.rows[0];

        // Fetch questions and answers
        const qaRes = await pool.query(
            `SELECT 
                eq.question_id, eq.question_number, eq.question_text,
                eq.question_type, eq.options, eq.correct_answer, eq.marks AS max_marks,
                ea.student_answer, ea.marks_awarded, ea.is_evaluated, ea.evaluator_feedback
             FROM exam_questions eq
             LEFT JOIN exam_answers ea ON eq.question_id = ea.question_id AND ea.attempt_id = $1
             WHERE eq.exam_id = $2
             ORDER BY eq.question_number ASC`,
            [attemptId, attempt.exam_id]
        );

        res.json({
            attempt,
            questions_and_answers: qaRes.rows
        });
    } catch (error) {
        console.error("Attempt review error:", error);
        res.status(500).json({ error: "Failed to fetch attempt details" });
    }
});

// Evaluate Exam Submission (Manual grading and feedback)
router.post("/api/exams/submissions/:attemptId/evaluate", async (req, res) => {
    try {
        const attemptId = Number(req.params.attemptId);
        const { evaluated_by, overall_feedback, question_evaluations } = req.body;

        if (Array.isArray(question_evaluations)) {
            for (const qe of question_evaluations) {
                await pool.query(
                    `UPDATE exam_answers
                     SET marks_awarded = $1,
                         is_evaluated = true,
                         evaluator_feedback = $2
                     WHERE attempt_id = $3 AND question_id = $4`,
                    [Number(qe.marks_awarded) || 0, qe.feedback || '', attemptId, Number(qe.question_id)]
                );
            }
        }

        // Sum all awarded marks for this attempt
        const sumRes = await pool.query(
            "SELECT SUM(marks_awarded) AS total FROM exam_answers WHERE attempt_id = $1",
            [attemptId]
        );
        const totalScore = Number(sumRes.rows[0]?.total || 0);

        // Fetch total exam marks
        const examRes = await pool.query(
            "SELECT ex.total_marks FROM exams ex JOIN exam_submissions es ON ex.exam_id = es.exam_id WHERE es.attempt_id = $1",
            [attemptId]
        );
        const maxMarks = Number(examRes.rows[0]?.total_marks) || 100;
        const percentage = Math.round((totalScore / maxMarks) * 100);

        let grade = 'A';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else grade = 'F';

        const updatedAttempt = await pool.query(
            `UPDATE exam_submissions
             SET status = 'evaluated',
                 total_score = $1,
                 percentage = $2,
                 grade = $3,
                 feedback = $4,
                 evaluated_by = $5,
                 evaluated_at = CURRENT_TIMESTAMP
             WHERE attempt_id = $6
             RETURNING *`,
            [totalScore, percentage, grade, overall_feedback || null, evaluated_by ? Number(evaluated_by) : null, attemptId]
        );

        res.json({
            message: "Submission evaluated successfully",
            attempt: updatedAttempt.rows[0]
        });
    } catch (error) {
        console.error("Evaluation error:", error);
        res.status(500).json({ error: "Failed to evaluate submission" });
    }
});

/* =========================================================
   5. ATTENDANCE MANAGEMENT ROUTES
========================================================= */

// Get attendance for a course on a date
router.get("/api/attendance", async (req, res) => {
    try {
        const { courseId, date } = req.query;

        if (!courseId) {
            return res.status(400).json({ error: "Course ID is required" });
        }

        const effectiveDate = date || new Date().toISOString().split('T')[0];

        const result = await pool.query(
            `SELECT 
                u.user_id,
                u.full_name,
                u.email,
                COALESCE(u.roll_number, '23000' || u.user_id) AS roll_number,
                COALESCE(u.section, 'Section A') AS section,
                COALESCE(a.status, 'Present') AS status,
                a.attendance_id,
                TO_CHAR(COALESCE(a.date, $2::date), 'YYYY-MM-DD') AS date
             FROM enrollments e
             JOIN users u ON e.student_id = u.user_id
             LEFT JOIN attendance a ON e.course_id = a.course_id AND e.student_id = a.student_id AND a.date = $2::date
             WHERE e.course_id = $1
             ORDER BY u.full_name ASC`,
            [Number(courseId), effectiveDate]
        );

        res.json({
            course_id: Number(courseId),
            date: effectiveDate,
            students: result.rows
        });
    } catch (error) {
        console.error("Attendance fetch error:", error);
        res.status(500).json({ error: "Failed to fetch attendance records" });
    }
});

// Mark / Update Attendance in Batch
router.post("/api/attendance", async (req, res) => {
    try {
        const { course_id, date, records, marked_by } = req.body;

        if (!course_id || !date || !Array.isArray(records)) {
            return res.status(400).json({ error: "Course ID, Date and records array are required" });
        }

        for (const r of records) {
            await pool.query(
                `INSERT INTO attendance (course_id, student_id, date, status, marked_by)
                 VALUES ($1, $2, $3::date, $4, $5)
                 ON CONFLICT (course_id, student_id, date)
                 DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by`,
                [Number(course_id), Number(r.student_id), date, r.status || 'Present', marked_by ? Number(marked_by) : null]
            );
        }

        res.json({ message: "Attendance records saved successfully" });
    } catch (error) {
        console.error("Save attendance error:", error);
        res.status(500).json({ error: "Failed to save attendance" });
    }
});

// Course Attendance Summary
router.get("/api/attendance/summary", async (req, res) => {
    try {
        const { courseId } = req.query;
        if (!courseId) return res.status(400).json({ error: "Course ID is required" });

        const result = await pool.query(
            `SELECT 
                u.user_id,
                u.full_name,
                COALESCE(u.roll_number, '23000' || u.user_id) AS roll_number,
                COUNT(a.attendance_id) AS total_classes,
                COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_classes,
                COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) AS absent_classes,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'Present' THEN 1 END)::numeric / NULLIF(COUNT(a.attendance_id), 0)) * 100, 
                    1
                ) AS attendance_percentage
             FROM enrollments e
             JOIN users u ON e.student_id = u.user_id
             LEFT JOIN attendance a ON e.course_id = a.course_id AND e.student_id = a.student_id
             WHERE e.course_id = $1
             GROUP BY u.user_id, u.full_name, u.roll_number
             ORDER BY u.full_name ASC`,
            [Number(courseId)]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Attendance summary error:", error);
        res.status(500).json({ error: "Failed to fetch attendance summary" });
    }
});

// Student Individual Attendance Records
router.get("/api/attendance/student/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        const statsRes = await pool.query(
            `SELECT 
                COUNT(*) AS total_lectures,
                COUNT(CASE WHEN status = 'Present' THEN 1 END) AS present_count,
                COUNT(CASE WHEN status = 'Absent' THEN 1 END) AS absent_count,
                ROUND(
                    (COUNT(CASE WHEN status = 'Present' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
                    1
                ) AS overall_percentage
             FROM attendance
             WHERE student_id = $1`,
            [studentId]
        );

        const coursesRes = await pool.query(
            `SELECT 
                c.course_id, c.course_code, c.course_name,
                COUNT(a.attendance_id) AS total_classes,
                COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_classes,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'Present' THEN 1 END)::numeric / NULLIF(COUNT(a.attendance_id), 0)) * 100,
                    1
                ) AS course_percentage
             FROM enrollments e
             JOIN courses c ON e.course_id = c.course_id
             LEFT JOIN attendance a ON e.course_id = a.course_id AND a.student_id = $1
             WHERE e.student_id = $1
             GROUP BY c.course_id, c.course_code, c.course_name
             ORDER BY c.course_code ASC`,
            [studentId]
        );

        const rawOverall = statsRes.rows[0];
        const totalLectures = Number(rawOverall?.total_lectures || 0);
        const presentCount = Number(rawOverall?.present_count || 0);
        const absentCount = Number(rawOverall?.absent_count || 0);
        const overallPct = totalLectures > 0 ? Number(rawOverall?.overall_percentage || 0) : 0;

        const historyRes = await pool.query(
            `SELECT a.attendance_id, a.course_id, c.course_code, c.course_name, TO_CHAR(a.date, 'YYYY-MM-DD') AS date, a.status
             FROM attendance a
             JOIN courses c ON a.course_id = c.course_id
             WHERE a.student_id = $1
             ORDER BY a.date DESC`,
            [studentId]
        );

        res.json({
            overall: {
                total_lectures: totalLectures,
                present_count: presentCount,
                absent_count: absentCount,
                overall_percentage: overallPct,
                percentage: overallPct,
            },
            courses: coursesRes.rows.map(r => ({
                ...r,
                course_percentage: Number(r.course_percentage || 0),
                total_classes: Number(r.total_classes || 0),
                present_classes: Number(r.present_classes || 0)
            })),
            history: historyRes.rows
        });
    } catch (error) {
        console.error("Student attendance error:", error);
        res.status(500).json({ error: "Failed to fetch student attendance" });
    }
});

/* =========================================================
   6. FACULTY DASHBOARD TELEMETRY & AGGREGATION
========================================================= */

router.get("/api/faculty/dashboard", async (req, res) => {
    try {
        const { facultyId } = req.query;
        if (!facultyId) return res.status(400).json({ error: "Faculty ID is required" });

        const fid = Number(facultyId);

        // 1. Assigned Courses with telemetry
        const coursesRes = await pool.query(
            `SELECT 
                c.course_id, c.course_code, c.course_name, c.description,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.course_id) AS students_count,
                (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.course_id) AS assignments_count,
                (SELECT COUNT(*) FROM exams ex WHERE ex.course_id = c.course_id) AS exams_count,
                (SELECT ROUND(AVG(s.marks), 1) 
                 FROM submissions s 
                 JOIN assignments a ON s.assignment_id = a.assignment_id 
                 WHERE a.course_id = c.course_id AND s.marks IS NOT NULL) AS avg_performance,
                (SELECT a.title FROM assignments a WHERE a.course_id = c.course_id ORDER BY a.due_date DESC LIMIT 1) AS latest_assignment_title,
                (SELECT ex.title FROM exams ex WHERE ex.course_id = c.course_id AND ex.status = 'scheduled' ORDER BY ex.exam_date ASC LIMIT 1) AS upcoming_exam_title,
                (SELECT TO_CHAR(ex.exam_date, 'YYYY-MM-DD') FROM exams ex WHERE ex.course_id = c.course_id AND ex.status = 'scheduled' ORDER BY ex.exam_date ASC LIMIT 1) AS upcoming_exam_date
             FROM courses c
             WHERE c.faculty_id = $1
             ORDER BY c.course_code ASC`,
            [fid]
        );

        // 2. Total unique students taught
        const studentsCountRes = await pool.query(
            `SELECT COUNT(DISTINCT e.student_id) AS total_students
             FROM courses c
             JOIN enrollments e ON c.course_id = e.course_id
             WHERE c.faculty_id = $1`,
            [fid]
        );

        // 3. Pending assignments to grade
        const pendingSubsRes = await pool.query(
            `SELECT 
                s.submission_id, s.assignment_id, s.student_id, s.submitted_at,
                u.full_name AS student_name, a.title AS assignment_title, c.course_code
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.assignment_id
             JOIN courses c ON a.course_id = c.course_id
             JOIN users u ON s.student_id = u.user_id
             WHERE c.faculty_id = $1 AND s.marks IS NULL
             ORDER BY s.submitted_at ASC`,
            [fid]
        );

        // 4. Upcoming scheduled exams
        const upcomingExamsRes = await pool.query(
            `SELECT 
                ex.exam_id, ex.title, TO_CHAR(ex.exam_date, 'YYYY-MM-DD') AS exam_date,
                ex.start_time, ex.end_time, ex.duration_minutes, ex.student_group,
                c.course_code, c.course_name
             FROM exams ex
             JOIN courses c ON ex.course_id = c.course_id
             WHERE (ex.faculty_id = $1 OR c.faculty_id = $1)
               AND ex.status = 'scheduled'
               AND ex.is_published = true
             ORDER BY ex.exam_date ASC, ex.start_time ASC
             LIMIT 5`,
            [fid]
        );

        // 5. Overall course attendance rate
        const attendanceRateRes = await pool.query(
            `SELECT 
                COUNT(*) AS total_records,
                COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_records,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'Present' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 
                    1
                ) AS attendance_rate
             FROM attendance a
             JOIN courses c ON a.course_id = c.course_id
             WHERE c.faculty_id = $1`,
            [fid]
        );

        // 6. Recent Announcements
        const announcementsRes = await pool.query(
            `SELECT 
                an.announcement_id, an.title, an.message, an.created_at,
                c.course_code, c.course_name
             FROM announcements an
             JOIN courses c ON an.course_id = c.course_id
             WHERE an.created_by = $1 OR c.faculty_id = $1
             ORDER BY an.created_at DESC
             LIMIT 5`,
            [fid]
        );

        res.json({
            courses: coursesRes.rows,
            total_students: Number(studentsCountRes.rows[0]?.total_students || 0),
            pending_evaluations: pendingSubsRes.rows,
            upcoming_exams: upcomingExamsRes.rows,
            attendance_rate: Number(attendanceRateRes.rows[0]?.attendance_rate || 92),
            recent_announcements: announcementsRes.rows
        });
    } catch (error) {
        console.error("Faculty dashboard error:", error);
        res.status(500).json({ error: "Failed to fetch faculty dashboard data" });
    }
});

module.exports = router;
