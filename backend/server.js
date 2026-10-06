const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const OpenAI = require("openai");
const pool = require("./db");
const { generateAcademicAiResponse } = require("./academicAiEngine");
const { generateToken, verifyToken, authMiddleware, requireRole } = require("./jwtHelper");

const app = express();
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "20mb" }));
app.use(require("./examAndManagementRoutes"));

const PORT = 5001;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "sk-academic-assistant-key"
});

/* =========================================================
   BASIC TEST
========================================================= */

app.get("/", (req, res) => {
    res.send("KL EduConnect Backend is running");
});

/* =========================================================
   AUTHENTICATION
========================================================= */

app.post("/api/auth/signup", async (req, res) => {
    try {
        const { email, password, full_name, role } = req.body;

        if (!email || !password || !full_name || !role) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedRole = role.trim().toLowerCase();

        if (normalizedRole === "admin" || normalizedEmail.includes("admin")) {
            return res.status(403).json({
                error: "Administrator registration is disabled. Administrator access is restricted to the single authorized institutional account."
            });
        }

        if (normalizedRole === "student") {
            const rollMatch = normalizedEmail.match(/^(\d+)(@klh\.edu\.in)?$/);
            if (!rollMatch) {
                return res.status(400).json({
                    error: "Student email must follow the institutional roll number format: rollnumber@klh.edu.in (e.g. 2200030001@klh.edu.in)"
                });
            }
        }

        if (normalizedRole === "faculty") {
            if (!normalizedEmail.startsWith("fac") && !normalizedEmail.startsWith("emp") && !normalizedEmail.endsWith("@faculty.edu.in")) {
                return res.status(400).json({
                    error: "Faculty email must follow the institutional pattern: fac[EmpID]@klh.edu.in (e.g. fac10342@klh.edu.in)"
                });
            }
        }

        const existingUser = await pool.query(
            "SELECT user_id FROM users WHERE LOWER(email) = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let rollNumber = null;
        if (normalizedRole === "student") {
            const rollMatch = normalizedEmail.match(/^(\d+)/);
            if (rollMatch) rollNumber = rollMatch[1];
        }

        const result = await pool.query(
            `INSERT INTO users
            (email, password_hash, full_name, role, status, roll_number, department, year, section)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING user_id, email, full_name, role, roll_number, created_at`,
            [
                normalizedEmail,
                hashedPassword,
                full_name,
                normalizedRole,
                'active',
                rollNumber,
                req.body.department || 'Computer Science & Engineering',
                req.body.year || '3rd Year',
                req.body.section || 'Section A'
            ]
        );

        const createdUser = result.rows[0];
        const token = generateToken(createdUser);

        res.status(201).json({
            message: "Signup successful",
            token,
            token_type: "Bearer",
            user: createdUser
        });

    } catch (error) {
        console.error("Signup error:", error);

        res.status(500).json({
            error: "Signup failed"
        });
    }
});

app.post("/api/auth/signin", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        let result = await pool.query(
            "SELECT * FROM users WHERE LOWER(email) = $1",
            [cleanEmail]
        );

        if (result.rows.length === 0) {
            if (cleanEmail === "admin@admin.edu.in" || cleanEmail === "admin@klh.edu.in") {
                result = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
            } else if (cleanEmail === "shloka@klh.edu.in" || cleanEmail === "shloka@klh.edu") {
                result = await pool.query("SELECT * FROM users WHERE roll_number = '2200030001' OR roll_number = '230002' LIMIT 1");
            } else if (cleanEmail === "faculty@faculty.edu.in") {
                result = await pool.query("SELECT * FROM users WHERE email = 'fac10342@klh.edu.in' OR role = 'faculty' LIMIT 1");
            }
        }

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        let validPassword = false;
        if (
            user.password_hash &&
            (user.password_hash.startsWith("$2a$") ||
             user.password_hash.startsWith("$2b$") ||
             user.password_hash.startsWith("$2y$"))
        ) {
            validPassword = await bcrypt.compare(password, user.password_hash);
        } else {
            validPassword = (password === user.password_hash);
            if (validPassword) {
                // Automatically upgrade plain-text passwords created in pgAdmin to bcrypt hashes
                try {
                    const newHash = await bcrypt.hash(password, 10);
                    await pool.query(
                        "UPDATE users SET password_hash = $1 WHERE user_id = $2",
                        [newHash, user.user_id]
                    );
                } catch (e) {
                    console.error("Failed to auto-upgrade password hash:", e.message);
                }
            }
        }

        if (!validPassword) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const token = generateToken(user);

        res.json({
            message: "Login successful",
            token,
            token_type: "Bearer",
            user: {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Signin error:", error);

        res.status(500).json({
            error: "Signin failed"
        });
    }
});

// JWT Verification and Token Info Endpoints for Viva / Review
app.get("/api/auth/verify", authMiddleware, (req, res) => {
    res.json({
        valid: true,
        message: "JWT token verified successfully",
        user: req.user
    });
});

app.get("/api/auth/token-info", authMiddleware, (req, res) => {
    res.json({
        status: "authenticated",
        algorithm: "HS256",
        issuer: req.user.issuer || "KL-EduConnect-Auth-Service",
        expiresIn: "7 days",
        claims: req.user
    });
});

/* =========================================================
   USER ID / PROFILE
========================================================= */

app.get("/api/user-id", async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                error: "Email is required"
            });
        }

        const result = await pool.query(
            `SELECT
                user_id,
                email,
                full_name,
                role,
                created_at
             FROM users
             WHERE LOWER(email) = LOWER($1)`,
            [email.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("User profile error:", error);

        res.status(500).json({
            error: "Failed to get user"
        });
    }
});

/* =========================================================
   COURSES
========================================================= */

app.get("/api/courses", async (req, res) => {
    try {
        const { facultyId } = req.query;

        let query = `
            SELECT
                c.course_id,
                c.course_code,
                c.course_name,
                c.description,
                c.faculty_id,
                u.full_name AS faculty_name
            FROM courses c
            LEFT JOIN users u
                ON c.faculty_id = u.user_id
        `;

        const values = [];

        if (facultyId) {
            query += " WHERE c.faculty_id = $1";
            values.push(Number(facultyId));
        }

        query += " ORDER BY c.course_id";

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("Courses error:", error);

        res.status(500).json({
            error: "Failed to fetch courses"
        });
    }
});

app.post("/api/courses", async (req, res) => {
    try {
        const {
            course_code,
            course_name,
            description,
            faculty_id
        } = req.body;

        if (!course_code || !course_name || !faculty_id) {
            return res.status(400).json({
                error: "Course code, course name and faculty are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO courses
            (course_code, course_name, description, faculty_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                course_code,
                course_name,
                description || null,
                Number(faculty_id)
            ]
        );

        res.status(201).json({
            message: "Course created successfully",
            course: result.rows[0]
        });

    } catch (error) {
        console.error("Create course error:", error);

        res.status(500).json({
            error: "Failed to create course"
        });
    }
});

/* =========================================================
   ENROLLMENTS
========================================================= */

app.get("/api/enrollments/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        const result = await pool.query(
            `SELECT
                e.enrollment_id,
                e.student_id,
                e.course_id
             FROM enrollments e
             WHERE e.student_id = $1`,
            [studentId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Enrollment fetch error:", error);

        res.status(500).json({
            error: "Failed to fetch enrollments"
        });
    }
});

/* Compatibility route for existing DashboardPage */

app.get("/api/enrollments/student/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        const result = await pool.query(
            `SELECT
                e.enrollment_id,
                e.student_id,
                e.course_id
             FROM enrollments e
             WHERE e.student_id = $1`,
            [studentId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Student enrollment fetch error:", error);

        res.status(500).json({
            error: "Failed to fetch student enrollments"
        });
    }
});

app.post("/api/enrollments", async (req, res) => {
    try {
        const {
            student_id,
            course_id
        } = req.body;

        if (!student_id || !course_id) {
            return res.status(400).json({
                error: "Student ID and course ID are required"
            });
        }

        const existing = await pool.query(
            `SELECT enrollment_id
             FROM enrollments
             WHERE student_id = $1
             AND course_id = $2`,
            [
                Number(student_id),
                Number(course_id)
            ]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                error: "Already enrolled"
            });
        }

        const result = await pool.query(
            `INSERT INTO enrollments
            (student_id, course_id)
            VALUES ($1, $2)
            RETURNING *`,
            [
                Number(student_id),
                Number(course_id)
            ]
        );

        res.status(201).json({
            message: "Enrolled successfully",
            enrollment: result.rows[0]
        });

    } catch (error) {
        console.error("Enrollment error:", error);

        res.status(500).json({
            error: "Failed to enroll"
        });
    }
});

/* =========================================================
   COURSE UNITS
========================================================= */

app.get("/api/course-units/:courseId", async (req, res) => {
    try {
        const courseId = Number(req.params.courseId);

        const result = await pool.query(
            `SELECT
                unit_id,
                course_id,
                unit_number,
                unit_title AS unit_name,
                description
             FROM course_units
             WHERE course_id = $1
             ORDER BY unit_number`,
            [courseId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Course units error:", error);

        res.status(500).json({
            error: "Failed to fetch course units"
        });
    }
});

/* =========================================================
   RESOURCES
========================================================= */

app.get("/api/resources/:courseId", async (req, res) => {
    try {
        const courseId = Number(req.params.courseId);

        const result = await pool.query(
            `SELECT
                resource_id,
                course_id,
                unit_id,
                title,
                description,
                resource_type,
                url,
                uploaded_by,
                created_at
             FROM resources
             WHERE course_id = $1
             ORDER BY resource_id DESC`,
            [courseId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Resources error:", error);

        res.status(500).json({
            error: "Failed to fetch resources"
        });
    }
});

app.get("/api/resources", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                resource_id,
                course_id,
                unit_id,
                title,
                description,
                resource_type,
                url,
                uploaded_by,
                created_at
             FROM resources
             ORDER BY resource_id DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error("All resources error:", error);

        res.status(500).json({
            error: "Failed to fetch resources"
        });
    }
});

app.post("/api/resources", async (req, res) => {
    try {
        const {
            course_id,
            unit_id,
            title,
            description,
            resource_type,
            url,
            uploaded_by
        } = req.body;

        if (!course_id || !title || !uploaded_by) {
            return res.status(400).json({
                error: "Course, title and uploader are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO resources
            (
                course_id,
                unit_id,
                title,
                description,
                resource_type,
                url,
                uploaded_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                Number(course_id),
                unit_id ? Number(unit_id) : null,
                title,
                description || null,
                resource_type || null,
                url || null,
                Number(uploaded_by)
            ]
        );

        res.status(201).json({
            message: "Resource created successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error("Resource creation error:", error);

        res.status(500).json({
            error: "Failed to create resource"
        });
    }
});

/* =========================================================
   ASSIGNMENTS
========================================================= */

app.get("/api/assignments", async (req, res) => {
    try {
        const {
            courseId,
            facultyId
        } = req.query;

        let query = `
            SELECT
                a.assignment_id,
                a.course_id,
                c.course_code,
                c.course_name,
                a.unit_name,
                a.title,
                a.description,
                a.due_date,
                a.max_marks,
                a.created_at
            FROM assignments a
            JOIN courses c
                ON a.course_id = c.course_id
        `;

        const conditions = [];
        const values = [];

        if (courseId) {
            values.push(Number(courseId));
            conditions.push(`a.course_id = $${values.length}`);
        }

        if (facultyId) {
            values.push(Number(facultyId));
            conditions.push(`c.faculty_id = $${values.length}`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY a.assignment_id DESC";

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("Assignments error:", error);

        res.status(500).json({
            error: "Failed to fetch assignments"
        });
    }
});

app.post("/api/assignments", async (req, res) => {
    try {
        const {
            course_id,
            unit_name,
            title,
            description,
            due_date,
            max_marks,
            faculty_id
        } = req.body;

        if (
            !course_id ||
            !unit_name ||
            !title ||
            !due_date ||
            !max_marks
        ) {
            return res.status(400).json({
                error: "Course, unit, title, due date and max marks are required"
            });
        }

        if (faculty_id) {
            const courseCheck = await pool.query(
                `SELECT course_id
                 FROM courses
                 WHERE course_id = $1
                 AND faculty_id = $2`,
                [
                    Number(course_id),
                    Number(faculty_id)
                ]
            );

            if (courseCheck.rows.length === 0) {
                return res.status(403).json({
                    error: "You can only create assignments for your own courses"
                });
            }
        }

        const result = await pool.query(
            `INSERT INTO assignments
            (
                course_id,
                unit_name,
                title,
                description,
                due_date,
                max_marks
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                Number(course_id),
                unit_name,
                title,
                description || null,
                due_date,
                Number(max_marks)
            ]
        );

        res.status(201).json({
            message: "Assignment created successfully",
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error("Assignment creation error:", error);

        res.status(500).json({
            error: "Failed to create assignment"
        });
    }
});

/* =========================================================
   SUBMISSIONS
========================================================= */

app.get("/api/submissions/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        const result = await pool.query(
            `SELECT
                s.submission_id,
                s.assignment_id,
                s.student_id,
                s.submission_url,
                s.submitted_at,
                s.marks,
                s.feedback,
                a.title,
                a.unit_name,
                a.max_marks,
                c.course_code,
                c.course_name
             FROM submissions s
             JOIN assignments a
                ON s.assignment_id = a.assignment_id
             JOIN courses c
                ON a.course_id = c.course_id
             WHERE s.student_id = $1
             ORDER BY s.submission_id DESC`,
            [studentId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Student submissions error:", error);

        res.status(500).json({
            error: "Failed to fetch submissions"
        });
    }
});

app.post("/api/submissions", async (req, res) => {
    try {
        const {
            assignment_id,
            student_id,
            submission_url
        } = req.body;

        if (!assignment_id || !student_id || !submission_url) {
            return res.status(400).json({
                error: "Assignment, student and submission are required"
            });
        }

        const existing = await pool.query(
            `SELECT submission_id
             FROM submissions
             WHERE assignment_id = $1
             AND student_id = $2`,
            [
                Number(assignment_id),
                Number(student_id)
            ]
        );

        if (existing.rows.length > 0) {
            const updateResult = await pool.query(
                `UPDATE submissions
                 SET submission_url = $1,
                     submitted_at = CURRENT_TIMESTAMP,
                     status = 'submitted'
                 WHERE submission_id = $2
                 RETURNING *`,
                [submission_url, existing.rows[0].submission_id]
            );
            return res.status(200).json({
                message: "Assignment re-submitted successfully",
                submission: updateResult.rows[0]
            });
        }

        const result = await pool.query(
            `INSERT INTO submissions
            (
                assignment_id,
                student_id,
                submission_url,
                submitted_at,
                status
            )
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'submitted')
            RETURNING *`,
            [
                Number(assignment_id),
                Number(student_id),
                submission_url
            ]
        );

        res.status(201).json({
            message: "Assignment submitted successfully",
            submission: result.rows[0]
        });

    } catch (error) {
        console.error("Submission error:", error);

        res.status(500).json({
            error: "Failed to submit assignment"
        });
    }
});

/* =========================================================
   FACULTY SUBMISSIONS
========================================================= */

app.get("/api/faculty/submissions", async (req, res) => {
    try {
        const { facultyId } = req.query;

        const baseQuery = `
            SELECT
                s.submission_id,
                s.assignment_id,
                s.student_id,
                s.submission_url,
                s.submitted_at,
                s.marks,
                s.feedback,
                COALESCE(s.status, CASE WHEN s.marks IS NOT NULL THEN 'graded' ELSE 'submitted' END) AS status,
                u.full_name AS student_name,
                u.email AS student_email,
                u.roll_number,
                a.title AS assignment_title,
                a.unit_name,
                a.max_marks,
                c.course_id,
                c.course_code,
                c.course_name
            FROM submissions s
            JOIN users u
                ON s.student_id = u.user_id
            JOIN assignments a
                ON s.assignment_id = a.assignment_id
            JOIN courses c
                ON a.course_id = c.course_id
        `;

        if (facultyId) {
            const facResult = await pool.query(
                baseQuery + " WHERE c.faculty_id = $1 ORDER BY s.submission_id DESC",
                [Number(facultyId)]
            );
            if (facResult.rows.length > 0) {
                return res.json(facResult.rows);
            }
            // Fallback: if this faculty does not have course-specific submissions, return departmental submissions
            const allResult = await pool.query(baseQuery + " ORDER BY s.submission_id DESC");
            return res.json(allResult.rows);
        }

        const result = await pool.query(baseQuery + " ORDER BY s.submission_id DESC");
        res.json(result.rows);

    } catch (error) {
        console.error("Faculty submissions error:", error);

        res.status(500).json({
            error: "Failed to fetch faculty submissions"
        });
    }
});

app.put("/api/faculty/submissions/:submissionId/evaluate", async (req, res) => {
    try {
        const submissionId = Number(req.params.submissionId);
        const { marks, feedback } = req.body;

        const result = await pool.query(
            `UPDATE submissions
             SET marks = $1,
                 feedback = $2,
                 status = 'graded'
             WHERE submission_id = $3
             RETURNING *`,
            [
                marks !== undefined && marks !== null ? Number(marks) : null,
                feedback || null,
                submissionId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Submission not found"
            });
        }

        res.json({
            message: "Submission evaluated successfully",
            submission: result.rows[0]
        });

    } catch (error) {
        console.error("Evaluation error:", error);
        res.status(500).json({
            error: "Failed to evaluate submission"
        });
    }
});

app.put("/api/submissions/:submissionId/grade", async (req, res) => {
    try {
        const submissionId = Number(req.params.submissionId);

        const {
            marks,
            feedback
        } = req.body;

        const result = await pool.query(
            `UPDATE submissions
             SET marks = $1,
                 feedback = $2,
                 status = 'graded'
             WHERE submission_id = $3
             RETURNING *`,
            [
                marks !== undefined ? Number(marks) : null,
                feedback || null,
                submissionId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Submission not found"
            });
        }

        res.json({
            message: "Marks updated successfully",
            submission: result.rows[0]
        });

    } catch (error) {
        console.error("Grade error:", error);

        res.status(500).json({
            error: "Failed to update marks"
        });
    }
});

/* =========================================================
   DISCUSSIONS
========================================================= */

app.get("/api/discussions", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                d.discussion_id,
                d.course_id,
                d.created_by,
                d.title,
                d.content,
                d.created_at,
                u.full_name
             FROM discussions d
             JOIN users u
                ON d.created_by = u.user_id
             ORDER BY d.created_at DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Discussions error:", error);

        res.status(500).json({
            error: "Failed to fetch discussions"
        });
    }
});

app.post("/api/discussions", async (req, res) => {
    try {
        const {
            course_id,
            user_id,
            title,
            content
        } = req.body;

        if (!course_id || !user_id || !title || !content) {
            return res.status(400).json({
                error: "Course, user, title and content are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO discussions
            (
                course_id,
                created_by,
                title,
                content
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                Number(course_id),
                Number(user_id),
                title,
                content
            ]
        );

        res.status(201).json({
            message: "Discussion created successfully",
            discussion: result.rows[0]
        });

    } catch (error) {
        console.error("Discussion creation error:", error);

        res.status(500).json({
            error: "Failed to create discussion"
        });
    }
});

/* =========================================================
   DISCUSSION REPLIES
========================================================= */

app.get("/api/discussions/:discussionId/replies", async (req, res) => {
    try {
        const discussionId = Number(req.params.discussionId);

        const result = await pool.query(
            `SELECT
                r.reply_id,
                r.discussion_id,
                r.user_id,
                r.content,
                r.created_at,
                u.full_name
             FROM discussion_replies r
             JOIN users u
                ON r.user_id = u.user_id
             WHERE r.discussion_id = $1
             ORDER BY r.created_at ASC`,
            [discussionId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Replies error:", error);

        res.status(500).json({
            error: "Failed to fetch replies"
        });
    }
});

app.post("/api/discussions/:discussionId/replies", async (req, res) => {
    try {
        const discussionId = Number(req.params.discussionId);

        const {
            user_id,
            content
        } = req.body;

        if (!user_id || !content) {
            return res.status(400).json({
                error: "User and content are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO discussion_replies
            (
                discussion_id,
                user_id,
                content
            )
            VALUES ($1, $2, $3)
            RETURNING *`,
            [
                discussionId,
                Number(user_id),
                content
            ]
        );

        res.status(201).json({
            message: "Reply added successfully",
            reply: result.rows[0]
        });

    } catch (error) {
        console.error("Reply error:", error);

        res.status(500).json({
            error: "Failed to add reply"
        });
    }
});

/* =========================================================
   GROUPS
========================================================= */

app.get("/api/groups", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                g.group_id,
                g.course_id,
                g.group_name AS name,
                g.group_name,
                c.course_code,
                c.course_name
             FROM groups g
             LEFT JOIN courses c ON g.course_id = c.course_id
             ORDER BY g.group_id DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Groups error:", error);

        res.status(500).json({
            error: "Failed to fetch groups"
        });
    }
});

app.get("/api/groups/user/:userId", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                g.group_id,
                g.course_id,
                g.group_name AS name,
                g.group_name,
                c.course_code,
                c.course_name
             FROM groups g
             LEFT JOIN courses c ON g.course_id = c.course_id
             ORDER BY g.group_id DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Groups by user error:", error);

        res.status(500).json({
            error: "Failed to fetch groups for user"
        });
    }
});

app.post("/api/groups", async (req, res) => {
    try {
        const {
            course_id,
            group_name,
            name,
            created_by,
            student_id
        } = req.body;

        const effectiveName = (group_name || name || "").trim();

        if (!course_id || !effectiveName) {
            return res.status(400).json({
                error: "Course ID and group name are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO groups
            (
                course_id,
                group_name
            )
            VALUES ($1, $2)
            RETURNING *`,
            [
                Number(course_id),
                effectiveName
            ]
        );

        const newGroup = result.rows[0];
        const creatorId = Number(created_by || student_id);

        if (creatorId && !isNaN(creatorId)) {
            try {
                await pool.query(
                    `INSERT INTO group_members
                    (group_id, student_id, joined_at)
                    VALUES ($1, $2, CURRENT_TIMESTAMP)`,
                    [newGroup.group_id, creatorId]
                );
            } catch (memberErr) {
                console.warn("Could not insert creator into group_members:", memberErr.message);
            }
        }

        res.status(201).json({
            message: "Group created successfully",
            group: {
                group_id: newGroup.group_id,
                course_id: newGroup.course_id,
                name: newGroup.group_name,
                group_name: newGroup.group_name
            }
        });

    } catch (error) {
        console.error("Group creation error:", error);

        res.status(500).json({
            error: "Failed to create group: " + error.message
        });
    }
});

app.get("/api/groups/:groupId/members", async (req, res) => {
    try {
        const groupId = Number(req.params.groupId);

        const result = await pool.query(
            `SELECT 
                gm.group_member_id,
                gm.group_id,
                gm.student_id AS user_id,
                'Member' AS role,
                u.full_name,
                u.email
             FROM group_members gm
             JOIN users u ON gm.student_id = u.user_id
             WHERE gm.group_id = $1
             ORDER BY gm.joined_at ASC`,
            [groupId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Group members error:", error);

        res.status(500).json({
            error: "Failed to fetch group members"
        });
    }
});

app.get("/api/groups/:groupId/contributions", async (req, res) => {
    try {
        const groupId = Number(req.params.groupId);

        const result = await pool.query(
            `SELECT 
                c.contribution_id,
                c.group_id,
                c.student_id AS user_id,
                c.activity_type AS contribution_type,
                c.description,
                c.contribution_date AS created_at,
                u.full_name,
                CASE 
                    WHEN c.activity_type = 'task' THEN 3
                    WHEN c.activity_type = 'meeting' THEN 2
                    WHEN c.activity_type = 'research' THEN 5
                    ELSE 1
                END AS points
             FROM contributions c
             JOIN users u ON c.student_id = u.user_id
             WHERE c.group_id = $1
             ORDER BY c.contribution_date DESC`,
            [groupId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Contributions error:", error);

        res.status(500).json({
            error: "Failed to fetch contributions"
        });
    }
});

app.post("/api/groups/:groupId/contributions", async (req, res) => {
    try {
        const groupId = Number(req.params.groupId);
        const { user_id, contribution_type, description } = req.body;

        if (!user_id || !description) {
            return res.status(400).json({
                error: "User ID and description are required"
            });
        }

        const studentId = Number(user_id);
        const actType = contribution_type || 'comment';

        // Auto-join member if not yet in group
        try {
            const memberCheck = await pool.query(
                "SELECT group_member_id FROM group_members WHERE group_id = $1 AND student_id = $2",
                [groupId, studentId]
            );
            if (memberCheck.rows.length === 0) {
                await pool.query(
                    "INSERT INTO group_members (group_id, student_id, joined_at) VALUES ($1, $2, CURRENT_TIMESTAMP)",
                    [groupId, studentId]
                );
            }
        } catch (mErr) {
            console.warn("Auto-member check warning:", mErr.message);
        }

        const result = await pool.query(
            `INSERT INTO contributions 
             (group_id, student_id, activity_type, description, contribution_date)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING *`,
            [groupId, studentId, actType, description]
        );

        res.status(201).json({
            message: "Contribution recorded successfully",
            contribution: result.rows[0]
        });

    } catch (error) {
        console.error("Add contribution error:", error);

        res.status(500).json({
            error: "Failed to add contribution: " + error.message
        });
    }
});

/* =========================================================
   NOTIFICATIONS
========================================================= */

app.get("/api/notifications/:userId", async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        const result = await pool.query(
            `SELECT *
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Notifications error:", error);

        res.status(500).json({
            error: "Failed to fetch notifications"
        });
    }
});

app.put("/api/notifications/:id/read", async (req, res) => {
    try {
        const notificationId = Number(req.params.id);

        const result = await pool.query(
            `UPDATE notifications
             SET is_read = true
             WHERE notification_id = $1
             RETURNING *`,
            [notificationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Notification not found"
            });
        }

        res.json({
            message: "Notification marked as read",
            notification: result.rows[0]
        });

    } catch (error) {
        console.error("Mark notification read error:", error);

        res.status(500).json({
            error: "Failed to update notification"
        });
    }
});

app.put("/api/notifications/user/:userId/read-all", async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        await pool.query(
            `UPDATE notifications
             SET is_read = true
             WHERE user_id = $1`,
            [userId]
        );

        res.json({
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error("Mark all notifications read error:", error);

        res.status(500).json({
            error: "Failed to mark all as read"
        });
    }
});

app.delete("/api/notifications/:id", async (req, res) => {
    try {
        const notificationId = Number(req.params.id);

        await pool.query(
            `DELETE FROM notifications
             WHERE notification_id = $1`,
            [notificationId]
        );

        res.json({
            message: "Notification deleted"
        });

    } catch (error) {
        console.error("Delete notification error:", error);

        res.status(500).json({
            error: "Failed to delete notification"
        });
    }
});

/* =========================================================
   LEARNING PROGRESS
========================================================= */

app.get("/api/learning-progress/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        const result = await pool.query(
            `SELECT *
             FROM learning_progress
             WHERE student_id = $1
             ORDER BY progress_id DESC`,
            [studentId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Learning progress error:", error);

        res.status(500).json({
            error: "Failed to fetch learning progress"
        });
    }
});

/* =========================================================
   AI ACADEMIC ASSISTANT
========================================================= */

function generateAcademicFallback(question) {
    const q = (question || "").toLowerCase();

    if (q.includes("binary search") || q.includes("bst") || q.includes("tree")) {
        return `### Binary Search Trees (BST) Explained

A **Binary Search Tree** is an ordered binary tree node-based data structure where:
- The left subtree contains only nodes with keys **less than** the node's key.
- The right subtree contains only nodes with keys **greater than** the node's key.
- Both subtrees must also be binary search trees.

#### Time Complexity:
| Operation | Average | Worst Case |
|---|---|---|
| Search | $O(\\log n)$ | $O(n)$ (unbalanced) |
| Insertion | $O(\\log n)$ | $O(n)$ |
| Deletion | $O(\\log n)$ | $O(n)$ |

\`\`\`python
class Node:
    def __init__(self, key):
        self.left = None
        self.right = None
        self.val = key

def insert(root, key):
    if root is None:
        return Node(key)
    if key < root.val:
        root.left = insert(root.left, key)
    else:
        root.right = insert(root.right, key)
    return root
\`\`\`

> **Tip for exams:** To keep BST operations guaranteed at $O(\\log n)$, use self-balancing trees like AVL or Red-Black trees.`;
    }

    if (q.includes("normalization") || q.includes("dbms") || q.includes("acid") || q.includes("sql") || q.includes("join")) {
        return `### Database Concepts & Normalization

#### Database Normalization:
1. **1NF (First Normal Form):** Every cell holds atomic (indivisible) values, and each record is unique.
2. **2NF (Second Normal Form):** Meets 1NF, and all non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies).
3. **3NF (Third Normal Form):** Meets 2NF, and no non-key attribute is transitively dependent on the primary key (no transitive dependencies).
4. **BCNF (Boyce-Codd Normal Form):** Stricter version of 3NF where for every functional dependency $X \\rightarrow Y$, $X$ must be a super key.

#### ACID Properties in PostgreSQL:
- **Atomicity:** All statements in a transaction succeed or all roll back.
- **Consistency:** Data remains valid according to constraints.
- **Isolation:** Concurrent transactions don't interfere with each other.
- **Durability:** Committed transactions persist even across system crashes.`;
    }

    if (q.includes("react") || q.includes("hook") || q.includes("state") || q.includes("props")) {
        return `### React Core Principles & Best Practices

In modern React:
1. **State vs Props:**
   - **Props:** Read-only inputs passed from parent components to child components.
   - **State:** Internal mutable data managed within the component using \`useState\` or \`useReducer\`.

2. **Common Hooks:**
   - \`useState\`: Declare local reactive state variables.
   - \`useEffect\`: Perform side-effects (e.g. data fetching, subscriptions, DOM manipulation).
   - \`useMemo\` & \`useCallback\`: Memoize expensive computations and callback references.

\`\`\`tsx
import { useState, useEffect } from 'react';

export function CourseWidget({ courseId }: { courseId: number }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(\`/api/courses/\${courseId}\`)
      .then(res => res.json())
      .then(setData);
  }, [courseId]);

  return <div>{data ? data.course_name : 'Loading...'}</div>;
}
\`\`\``;
    }

    if (q.includes("study") || q.includes("exam") || q.includes("revision") || q.includes("tips")) {
        return `### Academic Study & Exam Preparation Strategy

1. **Active Recall & Testing:**
   - Instead of passively re-reading slides, quiz yourself using flashcards or write summary outlines from memory.
2. **Spaced Repetition:**
   - Review difficult engineering and mathematical concepts at increasing intervals (Day 1, Day 3, Day 7, Day 14).
3. **The Feynman Technique:**
   - Explain the concept aloud in plain terms as if teaching a first-year student. Pinpoint any gaps in reasoning and consult lecture notes.
4. **Solve Past University Exam Papers:**
   - Practice writing out code, diagrams, and formulas under timed conditions.`;
    }

    return `### Academic Guidance & Clarification

Thank you for your question: **"${question}"**

Here are the fundamental concepts and structured steps to approach this:

1. **Core Understanding:**
   - Break the problem into its foundational components and definitions.
   - Identify the primary input, expected output, and underlying constraints.

2. **Step-by-Step Methodology:**
   - Formulate a clear theoretical model before jumping directly to implementation.
   - For mathematical or algorithmic problems, trace with small example inputs.
   - For system design or architecture questions, separate data layer, logic layer, and presentation.

3. **Key University References:**
   - Review your course syllabus and lecture modules under **Study Resources**.
   - Check the **Course Units** section for textbook citations and practice problem sets.

Feel free to ask a specific follow-up question or share a code snippet you'd like me to review!`;
}

app.get("/api/ai/chats/:userId", async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        const result = await pool.query(
            `SELECT 
                chat_id,
                user_id,
                course_id,
                question,
                answer,
                created_at
             FROM ai_chats
             WHERE user_id = $1
             ORDER BY created_at ASC`,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get AI chats error:", error);

        res.status(500).json({
            error: "Failed to fetch chat history"
        });
    }
});

app.delete("/api/ai/chats/:userId", async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        await pool.query(
            "DELETE FROM ai_chats WHERE user_id = $1",
            [userId]
        );

        res.json({
            message: "Chat history cleared"
        });

    } catch (error) {
        console.error("Clear AI chats error:", error);

        res.status(500).json({
            error: "Failed to clear chat history"
        });
    }
});

app.post("/api/ai/chat", async (req, res) => {
    try {
        const {
            message,
            user_id,
            course_id
        } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        let reply = "";

        // Attempt OpenAI Completion
        try {
            if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")) {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are the AI Academic Assistant for KL Deemed to be University (KL EduConnect).
Provide concise, academically rigorous, and helpful explanations for university students in Computer Science, Engineering, and Science disciplines.
Use Markdown formatting, LaTeX formulas where appropriate, and clean code snippets.`
                        },
                        {
                            role: "user",
                            content: message.trim()
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 1200
                });

                reply = completion.choices[0]?.message?.content || "";
            }
        } catch (apiErr) {
            console.warn("OpenAI API call failed, using academic fallback:", apiErr.message);
        }

        // Use dedicated comprehensive academic AI engine if OpenAI returned nothing or failed
        if (!reply) {
            reply = generateAcademicAiResponse(message.trim(), { user_id, course_id });
        }

        // Persist to ai_chats table
        if (user_id) {
            try {
                await pool.query(
                    `INSERT INTO ai_chats
                    (
                        user_id,
                        course_id,
                        question,
                        answer,
                        created_at
                    )
                    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
                    [
                        Number(user_id),
                        course_id ? Number(course_id) : null,
                        message.trim(),
                        reply
                    ]
                );
            } catch (dbError) {
                console.error("AI chat save error:", dbError.message);
            }
        }

        res.json({
            reply
        });

    } catch (error) {
        console.error("AI error:", error);

        res.status(500).json({
            error: "AI assistant failed: " + error.message
        });
    }
});

/* =========================================================
   ADMINISTRATIVE METRICS & SYSTEM AUDIT
========================================================= */

app.get("/api/admin/stats", async (req, res) => {
    try {
        const [
            studentsRes,
            facultyRes,
            adminsRes,
            coursesRes,
            enrollmentsRes,
            submissionsRes,
            resourcesRes
        ] = await Promise.all([
            pool.query("SELECT COUNT(*) AS count FROM users WHERE LOWER(role) = 'student'"),
            pool.query("SELECT COUNT(*) AS count FROM users WHERE LOWER(role) = 'faculty'"),
            pool.query("SELECT COUNT(*) AS count FROM users WHERE LOWER(role) = 'admin'"),
            pool.query("SELECT COUNT(*) AS count FROM courses"),
            pool.query("SELECT COUNT(*) AS count FROM enrollments"),
            pool.query("SELECT COUNT(*) AS count FROM submissions"),
            pool.query("SELECT COUNT(*) AS count FROM resources"),
        ]);

        res.json({
            total_students: Number(studentsRes.rows[0]?.count || 0),
            total_faculty: Number(facultyRes.rows[0]?.count || 0),
            total_admins: Number(adminsRes.rows[0]?.count || 0),
            total_courses: Number(coursesRes.rows[0]?.count || 0),
            total_enrollments: Number(enrollmentsRes.rows[0]?.count || 0),
            total_submissions: Number(submissionsRes.rows[0]?.count || 0),
            total_resources: Number(resourcesRes.rows[0]?.count || 0),
            database_status: "online",
            server_uptime: process.uptime()
        });

    } catch (error) {
        console.error("Admin stats error:", error);

        res.status(500).json({
            error: "Failed to fetch administrative metrics"
        });
    }
});

app.get("/api/admin/users", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                user_id,
                full_name,
                email,
                role,
                created_at
             FROM users
             ORDER BY user_id DESC
             LIMIT 50`
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Admin users error:", error);

        res.status(500).json({
            error: "Failed to fetch users list"
        });
    }
});

/* =========================================================
   LIVE CLASSES
========================================================= */

app.post("/api/live-classes", async (req, res) => {
    try {
        const {
            course_id,
            faculty_id,
            title,
            description,
            room_name,
            start_time
        } = req.body;

        if (
            !course_id ||
            !faculty_id ||
            !title ||
            !room_name
        ) {
            return res.status(400).json({
                error: "Course, faculty, title and room name are required"
            });
        }

        const courseCheck = await pool.query(
            `SELECT course_id
             FROM courses
             WHERE course_id = $1
             AND faculty_id = $2`,
            [
                Number(course_id),
                Number(faculty_id)
            ]
        );

        if (courseCheck.rows.length === 0) {
            return res.status(403).json({
                error: "You can only create live classes for your own courses"
            });
        }

        const result = await pool.query(
            `INSERT INTO live_classes
            (
                course_id,
                faculty_id,
                title,
                description,
                room_name,
                start_time,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
            RETURNING *`,
            [
                Number(course_id),
                Number(faculty_id),
                title,
                description || null,
                room_name,
                start_time || new Date()
            ]
        );

        res.status(201).json({
            message: "Live class created successfully",
            liveClass: result.rows[0]
        });

    } catch (error) {
        console.error("Create live class error:", error);

        res.status(500).json({
            error: "Failed to create live class"
        });
    }
});

app.get("/api/live-classes", async (req, res) => {
    try {
        const {
            courseId,
            facultyId,
            status
        } = req.query;

        let query = `
            SELECT
                l.live_class_id,
                l.course_id,
                l.faculty_id,
                l.title,
                l.description,
                l.room_name,
                l.start_time,
                l.end_time,
                l.status,
                l.created_at,
                c.course_code,
                c.course_name,
                u.full_name AS faculty_name
            FROM live_classes l
            JOIN courses c
                ON l.course_id = c.course_id
            JOIN users u
                ON l.faculty_id = u.user_id
        `;

        const conditions = [];
        const values = [];

        if (courseId) {
            values.push(Number(courseId));

            conditions.push(
                `l.course_id = $${values.length}`
            );
        }

        if (facultyId) {
            values.push(Number(facultyId));

            conditions.push(
                `l.faculty_id = $${values.length}`
            );
        }

        if (status) {
            values.push(status);

            conditions.push(
                `l.status = $${values.length}`
            );
        }

        if (conditions.length > 0) {
            query +=
                " WHERE " +
                conditions.join(" AND ");
        }

        query += " ORDER BY l.start_time DESC";

        const result = await pool.query(
            query,
            values
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get live classes error:", error);

        res.status(500).json({
            error: "Failed to fetch live classes"
        });
    }
});

app.put("/api/live-classes/:id/start", async (req, res) => {
    try {
        const liveClassId = Number(req.params.id);

        const result = await pool.query(
            `UPDATE live_classes
             SET status = 'live',
                 start_time = CURRENT_TIMESTAMP
             WHERE live_class_id = $1
             RETURNING *`,
            [liveClassId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Live class not found"
            });
        }

        res.json({
            message: "Live class started",
            liveClass: result.rows[0]
        });

    } catch (error) {
        console.error("Start live class error:", error);

        res.status(500).json({
            error: "Failed to start live class"
        });
    }
});

app.put("/api/live-classes/:id/end", async (req, res) => {
    try {
        const liveClassId = Number(req.params.id);

        const result = await pool.query(
            `UPDATE live_classes
             SET status = 'ended',
                 end_time = CURRENT_TIMESTAMP
             WHERE live_class_id = $1
             RETURNING *`,
            [liveClassId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Live class not found"
            });
        }

        res.json({
            message: "Live class ended",
            liveClass: result.rows[0]
        });

    } catch (error) {
        console.error("End live class error:", error);

        res.status(500).json({
            error: "Failed to end live class"
        });
    }
});

/* =========================================================
   SERVER
========================================================= */

app.listen(PORT, () => {
    console.log(
        `KL EduConnect Backend running on http://localhost:${PORT}`
    );
});