/**
 * Universal API Adapter & Standalone Interceptor
 * Ensures KL EduConnect operates seamlessly everywhere:
 * - On GitHub Pages (production standalone mode on any device)
 * - On local development (uses live PostgreSQL backend when running, falls back cleanly if stopped)
 */

import { standaloneDB, type StandaloneUser } from './standaloneData';
import { generateAcademicAiResponse } from './academicAiClient';

const ORIGINAL_FETCH = window.fetch;

export function setupApiInterceptor() {
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Only intercept requests directed to our backend API
    const isBackendApi = urlStr.includes(':5001') || urlStr.includes('/api/');
    if (!isBackendApi) {
      return ORIGINAL_FETCH(input, init);
    }

    // Check if we are running on a remote host like GitHub Pages
    const isRemoteHost =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.startsWith('192.168.') &&
      !window.location.hostname.startsWith('10.') &&
      !window.location.hostname.endsWith('.local');

    // If on a remote host (e.g. pasula-shloka.github.io), browser will block http://localhost:5001
    // so we handle it immediately using the standalone academic engine!
    if (isRemoteHost) {
      return handleStandaloneRequest(urlStr, init);
    }

    // On local environment, attempt the live PostgreSQL backend first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await ORIGINAL_FETCH(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (networkError) {
      console.warn('Local PostgreSQL backend (port 5001) unavailable, falling back to standalone institutional engine:', networkError);
      return handleStandaloneRequest(urlStr, init);
    }
  };
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleStandaloneRequest(urlStr: string, init?: RequestInit): Response {
  const method = (init?.method || 'GET').toUpperCase();
  const url = new URL(urlStr, window.location.origin);
  const path = url.pathname;

  let body: any = {};
  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {}
  }

  // 1. AUTHENTICATION & SESSIONS
  if (path.includes('/api/auth/signin') && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase();
    const users = standaloneDB.getUsers();

    // Match exact or alias
    let matchedUser = users.find(u => u.email.toLowerCase() === email);

    // Aliases for Administrator (strictly single admin user)
    if (!matchedUser && (email === 'admin@klh.edu.in' || email === 'admin@admin.edu.in')) {
      matchedUser = users.find(u => u.role === 'admin');
    }
    // Aliases for legacy student logins
    if (!matchedUser && (email === 'shloka@klh.edu.in' || email === 'shloka@klh.edu')) {
      matchedUser = users.find(u => u.roll_number === '2200030001');
    }
    if (!matchedUser && email === 'ananya@klh.edu.in') {
      matchedUser = users.find(u => u.roll_number === '2200030045');
    }
    if (!matchedUser && email === 'rahul@klh.edu.in') {
      matchedUser = users.find(u => u.roll_number === '2200030089');
    }
    // Aliases for legacy faculty logins
    if (!matchedUser && (email === 'faculty@faculty.edu.in' || email === 'fac10342@klh.edu.in')) {
      matchedUser = users.find(u => u.email === 'fac10342@klh.edu.in') || users.find(u => u.role === 'faculty');
    }
    if (!matchedUser && email === 'lalitha@faculty.edu.in') {
      matchedUser = users.find(u => u.email === 'fac10345@klh.edu.in');
    }

    if (!matchedUser) {
      // Auto-detect institutional role based on email identifier
      // ADMIN: strictly ONLY admin@klh.edu.in or admin@admin.edu.in!
      const role: 'student' | 'faculty' | 'admin' =
        email === 'admin@klh.edu.in' || email === 'admin@admin.edu.in'
          ? 'admin'
          : email.startsWith('fac') || email.startsWith('emp') || email.includes('faculty') || email.includes('prof') || email.endsWith('@faculty.edu.in')
          ? 'faculty'
          : 'student';

      const rollMatch = email.match(/^(\d+)/);
      const studentRoll = role === 'student' ? (rollMatch ? rollMatch[1] : `2200030${Math.floor(100 + Math.random() * 900)}`) : undefined;
      const formattedEmail = role === 'student' ? `${studentRoll}@klh.edu.in` : role === 'admin' ? 'admin@klh.edu.in' : email;

      const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = role === 'student' ? `Student ${studentRoll}` : nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

      matchedUser = standaloneDB.saveUser({
        email: formattedEmail,
        full_name: formattedName || 'KL University Member',
        role,
        roll_number: studentRoll,
        status: 'Active',
      });
    }

    return jsonResponse({
      message: 'Sign in successful',
      user: {
        id: String(matchedUser.user_id),
        user_id: matchedUser.user_id,
        email: matchedUser.email,
        full_name: matchedUser.full_name,
        role: matchedUser.role,
        department: matchedUser.department,
        year: matchedUser.year,
        section: matchedUser.section,
        roll_number: matchedUser.roll_number,
      },
    });
  }

  if (path.includes('/api/auth/signup') && method === 'POST') {
    const rawEmail = (body.email || '').trim().toLowerCase();
    const requestedRole = (body.role || '').toLowerCase();

    // 1. ADMIN REGISTRATION IS STRICTLY DISABLED
    if (requestedRole === 'admin' || rawEmail.includes('admin')) {
      return jsonResponse({
        error: 'Administrator registration is disabled. Administrator access is restricted to the single authorized institutional account.',
      }, 403);
    }

    let finalEmail = rawEmail;
    let finalRole: 'student' | 'faculty' = requestedRole === 'faculty' ? 'faculty' : 'student';
    let rollNumber: string | undefined;

    if (finalRole === 'student') {
      // Must follow rollnumber@klh.edu.in
      const rollMatch = rawEmail.match(/^(\d+)(@klh\.edu\.in)?$/);
      if (!rollMatch) {
        return jsonResponse({
          error: 'Student email must follow the institutional roll number format: rollnumber@klh.edu.in (e.g. 2200030001@klh.edu.in)',
        }, 400);
      }
      rollNumber = rollMatch[1];
      finalEmail = `${rollNumber}@klh.edu.in`;
    } else {
      // Faculty pattern: fac[EmpID]@klh.edu.in
      if (!rawEmail.startsWith('fac') && !rawEmail.startsWith('emp') && !rawEmail.endsWith('@faculty.edu.in')) {
        return jsonResponse({
          error: 'Faculty email must follow the institutional pattern: fac[EmpID]@klh.edu.in (e.g. fac10342@klh.edu.in)',
        }, 400);
      }
      finalEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@klh.edu.in`;
    }

    const saved = standaloneDB.saveUser({
      email: finalEmail,
      full_name: body.full_name || (finalRole === 'student' ? `Student ${rollNumber}` : 'Faculty Member'),
      role: finalRole,
      roll_number: rollNumber,
      status: 'Active',
    });

    return jsonResponse({
      message: 'Account created successfully',
      user_id: saved.user_id,
      email: saved.email,
    });
  }

  if (path.includes('/api/user-id')) {
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    const users = standaloneDB.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email) || users[0];

    return jsonResponse({
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      year: user.year,
      section: user.section,
      roll_number: user.roll_number,
      created_at: user.created_at,
    });
  }

  // 2. ADMIN STATS & USER MANAGEMENT
  if (path.includes('/api/admin/stats')) {
    const users = standaloneDB.getUsers();
    const courses = standaloneDB.getCourses();
    const students = users.filter(u => u.role === 'student');
    const faculty = users.filter(u => u.role === 'faculty');

    return jsonResponse({
      totalStudents: students.length * 15 + 42,
      totalFaculty: faculty.length * 6 + 12,
      totalCourses: courses.length,
      totalSubmissions: 486,
    });
  }

  if (path.includes('/api/admin/users')) {
    return jsonResponse(standaloneDB.getUsers());
  }

  if (path.includes('/api/admin/students')) {
    if (method === 'POST') {
      const newStudent = standaloneDB.saveUser({
        email: body.email,
        full_name: body.full_name,
        role: 'student',
        department: body.department,
        year: body.year,
        section: body.section || 'Section A',
        roll_number: body.roll_number,
        status: body.status || 'Active',
      });
      return jsonResponse({ message: 'Student created successfully', student: newStudent });
    }

    const matchId = path.match(/\/api\/admin\/students\/(\d+)/);
    if (matchId && method === 'PUT') {
      const studentId = Number(matchId[1]);
      const updated = standaloneDB.updateUser(studentId, {
        section: body.section,
        department: body.department,
        year: body.year,
        status: body.status,
        roll_number: body.roll_number,
      });
      return jsonResponse({ message: 'Student profile updated successfully', student: updated });
    }

    const students = standaloneDB.getUsers().filter(u => u.role === 'student');
    return jsonResponse(students);
  }

  // 2b. FACULTY STUDENT ROSTER
  if (path.includes('/api/faculty/students')) {
    const students = standaloneDB.getUsers().filter(u => u.role === 'student');
    const enriched = students.map((s, idx) => {
      const att = standaloneDB.getStudentAttendance(s.user_id);
      const studentSubs = standaloneDB.getSubmissions(s.user_id);
      const studentEnrolls = standaloneDB.getEnrollments(s.user_id);
      const gradedSubs = studentSubs.filter(sub => sub.marks !== null);
      const avgScore = gradedSubs.length > 0
        ? Math.round(gradedSubs.reduce((acc, cur) => acc + ((cur.marks || 0) / (cur.max_marks || 25)) * 100, 0) / gradedSubs.length)
        : 0;

      return {
        user_id: s.user_id,
        full_name: s.full_name,
        email: s.email,
        roll_number: s.roll_number || `22000300${idx + 1}`,
        department: s.department || 'Computer Science & Engineering',
        year: s.year || '3rd Year',
        section: s.section || (idx % 2 === 0 ? 'Section A' : 'Section B'),
        status: (s.status?.toLowerCase() === 'active' ? 'active' : 'active') as 'active' | 'inactive',
        course_id: 1,
        course_code: '22CS3101',
        course_name: 'Database Management Systems',
        enrolled_courses_count: studentEnrolls.length,
        submissions_count: studentSubs.length,
        avg_assignment_score: avgScore,
        attendance_present_count: att.overall.present_count,
        attendance_total_count: att.overall.total_lectures,
      };
    });
    return jsonResponse(enriched);
  }

  // 2c. STUDENT DETAILED PROFILE
  if (path.includes('/api/students/') && path.includes('/profile')) {
    const match = path.match(/\/api\/students\/(\d+)\/profile/);
    const studentId = match ? Number(match[1]) : 0;
    const users = standaloneDB.getUsers();
    const student = users.find(u => Number(u.user_id) === studentId) || users[0];
    const att = standaloneDB.getStudentAttendance(studentId);
    const subs = standaloneDB.getSubmissions(studentId);
    const enrolls = standaloneDB.getEnrollments(studentId);

    return jsonResponse({
      student,
      attendance: {
        stats: att.overall,
        records: att.history,
      },
      submissions: subs,
      enrollments: enrolls,
    });
  }

  if (path.includes('/api/admin/faculty')) {
    if (method === 'POST') {
      const newFaculty = standaloneDB.saveUser({
        email: body.email,
        full_name: body.full_name,
        role: 'faculty',
        department: body.department,
        status: body.status || 'Active',
      });
      return jsonResponse({ message: 'Faculty created successfully', faculty: newFaculty });
    }

    const faculty = standaloneDB.getUsers().filter(u => u.role === 'faculty');
    const courses = standaloneDB.getCourses();
    const exams = standaloneDB.getExams();
    const enriched = faculty.map(f => {
      const facCourses = courses.filter((c: any) => Number(c.faculty_id) === Number(f.user_id));
      const facExams = exams.filter((e: any) => Number(e.faculty_id) === Number(f.user_id));
      return {
        ...f,
        status: (f.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
        courses_count: facCourses.length,
        total_students_count: facCourses.length * 45,
        exams_conducted_count: facExams.length,
        assigned_courses: facCourses.map((c: any) => ({
          course_id: c.course_id,
          course_code: c.course_code,
          course_name: c.course_name,
        })),
      };
    });
    return jsonResponse(enriched);
  }

  if (path.includes('/api/faculty/assign-course') && method === 'POST') {
    const courseId = Number(body.course_id);
    const facultyId = Number(body.faculty_id);
    const courses = standaloneDB.getCourses();
    const users = standaloneDB.getUsers();
    const faculty = users.find(u => u.user_id === facultyId);
    const idx = courses.findIndex((c: any) => Number(c.course_id) === courseId);
    if (idx >= 0) {
      courses[idx].faculty_id = facultyId;
      if (faculty) courses[idx].faculty_name = faculty.full_name;
      localStorage.setItem('educonnect_v3_courses', JSON.stringify(courses));
    }
    return jsonResponse({ message: 'Course assigned to faculty successfully' });
  }

  if (path.match(/\/api\/faculty\/(\d+)\/status/) && (method === 'PATCH' || method === 'PUT')) {
    const matchId = path.match(/\/api\/faculty\/(\d+)\/status/);
    if (matchId) {
      standaloneDB.updateUser(Number(matchId[1]), { status: body.status || 'Active' });
    }
    return jsonResponse({ message: 'Faculty status updated' });
  }

  // 3. COURSES (Strict Faculty Scoping)
  if (path.includes('/api/courses')) {
    if (method === 'POST') {
      const created = standaloneDB.saveCourse(body);
      return jsonResponse(created);
    }
    const facultyId = url.searchParams.get('facultyId');
    return jsonResponse(standaloneDB.getCourses(facultyId ? Number(facultyId) : undefined));
  }

  // 4. EXAMS & SUBMISSION LIFECYCLE
  if (path.includes('/api/exams')) {
    // 4a. Start exam attempt: POST /api/exams/:id/start
    const matchStart = path.match(/\/api\/exams\/(\d+)\/start/);
    if (matchStart && method === 'POST') {
      const examId = Number(matchStart[1]);
      const studentId = Number(body.student_id || 1);
      const attempt = standaloneDB.startExamAttempt(examId, studentId);
      return jsonResponse({ message: 'Exam attempt started', attempt });
    }

    // 4b. Autosave individual answer: POST /api/exams/:id/autosave
    const matchAutosave = path.match(/\/api\/exams\/(\d+)\/autosave/);
    if (matchAutosave && method === 'POST') {
      standaloneDB.autosaveAnswer(Number(body.attempt_id), Number(body.question_id), body.student_answer);
      return jsonResponse({ message: 'Answer saved' });
    }

    // 4c. Submit exam: POST /api/exams/:id/submit
    const matchSubmit = path.match(/\/api\/exams\/(\d+)\/submit/);
    if (matchSubmit && method === 'POST') {
      const examId = Number(matchSubmit[1]);
      const studentId = Number(body.student_id || 1);
      const attemptId = Number(body.attempt_id);
      const result = standaloneDB.submitExamAttempt(examId, studentId, attemptId, body.answers || {});
      return jsonResponse(result);
    }

    // 4d. Faculty: List submissions for exam: GET /api/exams/:id/submissions
    const matchExamSubs = path.match(/\/api\/exams\/(\d+)\/submissions/);
    if (matchExamSubs && method === 'GET') {
      const examId = Number(matchExamSubs[1]);
      return jsonResponse(standaloneDB.getExamSubmissions(examId));
    }

    // 4e. Single attempt detail: GET /api/exams/submissions/:attemptId
    const matchSubDetail = path.match(/\/api\/exams\/submissions\/(\d+)/);
    if (matchSubDetail && method === 'GET') {
      const attemptId = Number(matchSubDetail[1]);
      const detail = standaloneDB.getExamSubmissionByAttempt(attemptId);
      if (!detail) {
        return jsonResponse({ error: 'Submission attempt not found' }, 404);
      }
      return jsonResponse(detail);
    }

    // 4f. Faculty: Save evaluation: POST /api/exams/submissions/:attemptId/evaluate
    const matchEval = path.match(/\/api\/exams\/submissions\/(\d+)\/evaluate/);
    if (matchEval && method === 'POST') {
      const attemptId = Number(matchEval[1]);
      const evals = body.question_evaluations || body.evaluations || [];
      const fb = body.overall_feedback || body.feedback || '';
      standaloneDB.evaluateExamAttempt(attemptId, evals, fb);
      return jsonResponse({ message: 'Evaluation saved successfully' });
    }

    // 4g. Publish exam: PUT /api/exams/:id/publish
    const matchPublish = path.match(/\/api\/exams\/(\d+)\/publish/);
    if (matchPublish && method === 'PUT') {
      const examId = Number(matchPublish[1]);
      const exam = standaloneDB.updateExamStatus(examId, 'scheduled', { is_published: true });
      return jsonResponse({ message: 'Exam published', exam });
    }

    // 4h. Cancel exam: PUT /api/exams/:id/cancel
    const matchCancel = path.match(/\/api\/exams\/(\d+)\/cancel/);
    if (matchCancel && method === 'PUT') {
      const examId = Number(matchCancel[1]);
      const exam = standaloneDB.updateExamStatus(examId, 'cancelled');
      return jsonResponse({ message: 'Exam cancelled', exam });
    }

    // 4i. Publish exam results: PUT /api/exams/:id/publish-results
    const matchPubRes = path.match(/\/api\/exams\/(\d+)\/publish-results/);
    if (matchPubRes && method === 'PUT') {
      const examId = Number(matchPubRes[1]);
      const exam = standaloneDB.updateExamStatus(examId, 'completed', { results_published: true });
      return jsonResponse({ message: 'Exam results published to students', exam });
    }

    // 4j. Single exam details with questions: GET /api/exams/:id
    const matchExamId = path.match(/\/api\/exams\/(\d+)$/);
    if (matchExamId && method === 'GET') {
      const examId = Number(matchExamId[1]);
      const studentId = url.searchParams.get('studentId');
      const data = standaloneDB.getExamById(examId, studentId ? Number(studentId) : undefined);
      return jsonResponse(data);
    }

    // 4k. Edit exam: PUT /api/exams/:id
    if (matchExamId && method === 'PUT') {
      const examId = Number(matchExamId[1]);
      const updated = standaloneDB.updateExam(examId, body);
      return jsonResponse(updated);
    }

    // 4l. Create exam: POST /api/exams
    if (method === 'POST') {
      const newExam = standaloneDB.saveExam(body);
      return jsonResponse(newExam);
    }

    // 4m. List exams: GET /api/exams
    const facultyId = url.searchParams.get('facultyId');
    const studentId = url.searchParams.get('studentId');
    const role = url.searchParams.get('role');
    return jsonResponse(standaloneDB.getExams(
      facultyId ? Number(facultyId) : undefined,
      studentId ? Number(studentId) : undefined,
      role || undefined
    ));
  }

  // 5. ASSIGNMENTS & ATTENDANCE
  if (path.includes('/api/assignments')) {
    if (method === 'POST') {
      const item = standaloneDB.saveAssignment(body);
      return jsonResponse(item);
    }
    const facultyId = url.searchParams.get('facultyId');
    const list = standaloneDB.getAssignments();
    if (facultyId) {
      const fId = Number(facultyId);
      const filtered = list.filter((a: any) => Number(a.faculty_id) === fId);
      return jsonResponse(filtered);
    }
    return jsonResponse(list);
  }

  // 5. SUBMISSIONS & EVALUATIONS
  if (path.includes('/api/faculty/submissions') && path.includes('/evaluate') && method === 'PUT') {
    const match = path.match(/\/api\/faculty\/submissions\/(\d+)\/evaluate/);
    const submissionId = match ? Number(match[1]) : 0;
    const updated = standaloneDB.evaluateAssignmentSubmission(submissionId, body.marks, body.feedback || '');
    return jsonResponse({ message: 'Marks and feedback saved successfully', submission: updated });
  }

  if (path.includes('/api/faculty/submissions')) {
    const facultyId = url.searchParams.get('facultyId');
    return jsonResponse(standaloneDB.getFacultySubmissions(facultyId ? Number(facultyId) : undefined));
  }

  if (path.includes('/api/submissions') && path.includes('/grade') && method === 'PUT') {
    const match = path.match(/\/api\/submissions\/(\d+)\/grade/);
    const submissionId = match ? Number(match[1]) : 0;
    const updated = standaloneDB.evaluateAssignmentSubmission(submissionId, body.marks, body.feedback || '');
    return jsonResponse({ message: 'Submission evaluated successfully', submission: updated });
  }

  if (path.includes('/api/submissions') && method === 'POST') {
    const created = standaloneDB.saveSubmission(body);
    return jsonResponse({ message: 'Assignment submitted successfully', submission: created }, 201);
  }

  if (path.includes('/api/submissions')) {
    const match = path.match(/\/api\/submissions\/(\d+)/);
    const studentId = match ? Number(match[1]) : undefined;
    return jsonResponse(standaloneDB.getSubmissions(studentId));
  }

  // 6. ATTENDANCE (INDIVIDUAL & DAILY REGISTRY)
  if (path.includes('/api/attendance/student/')) {
    const match = path.match(/\/api\/attendance\/student\/(\d+)/);
    const studentId = match ? Number(match[1]) : 0;
    return jsonResponse(standaloneDB.getStudentAttendance(studentId));
  }

  if (path.includes('/api/attendance/summary')) {
    const courseId = Number(url.searchParams.get('courseId') || 1);
    return jsonResponse(standaloneDB.getCourseAttendanceSummary(courseId));
  }

  if (path.includes('/api/attendance') && method === 'POST') {
    standaloneDB.saveAttendanceRecords(Number(body.course_id), body.date, body.records || [], body.marked_by);
    return jsonResponse({ message: 'Attendance records saved successfully' });
  }

  if (path.includes('/api/attendance')) {
    const courseId = Number(url.searchParams.get('courseId') || 1);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    return jsonResponse(standaloneDB.getCourseDailyAttendance(courseId, date));
  }

  if (path.includes('/api/live-classes')) {
    if (path.includes('/start') && method === 'PUT') {
      const matchId = path.match(/\/api\/live-classes\/(\d+)\/start/);
      const classId = matchId ? Number(matchId[1]) : 0;
      const updated = standaloneDB.updateLiveClassStatus(classId, 'live');
      return jsonResponse({ message: 'Live class started', liveClass: updated });
    }
    if (path.includes('/end') && method === 'PUT') {
      const matchId = path.match(/\/api\/live-classes\/(\d+)\/end/);
      const classId = matchId ? Number(matchId[1]) : 0;
      const updated = standaloneDB.updateLiveClassStatus(classId, 'ended');
      return jsonResponse({ message: 'Live class ended', liveClass: updated });
    }
    if (method === 'POST') {
      const created = standaloneDB.saveLiveClass(body);
      return jsonResponse(created);
    }
    return jsonResponse(standaloneDB.getLiveClasses());
  }

  // 6. RESOURCES & COURSE UNITS
  if (path.includes('/api/resources')) {
    if (method === 'POST') {
      const created = standaloneDB.saveResource(body);
      return jsonResponse(created);
    }
    const matchCourse = path.match(/\/api\/resources\/(\d+)/);
    const courseId = matchCourse ? Number(matchCourse[1]) : undefined;
    return jsonResponse(standaloneDB.getResources(courseId));
  }

  if (path.includes('/api/course-units')) {
    return jsonResponse([
      { unit_id: 1, course_id: 1, unit_name: 'Unit 1: Relational Model & SQL' },
      { unit_id: 2, course_id: 1, unit_name: 'Unit 2: Normalization (1NF-BCNF)' },
      { unit_id: 3, course_id: 1, unit_name: 'Unit 3: Transactions & Concurrency' },
    ]);
  }

  // 7. DISCUSSIONS & FORUMS
  if (path.includes('/api/discussions')) {
    if (path.includes('/replies')) {
      if (method === 'POST') {
        return jsonResponse({
          reply_id: Date.now(),
          content: body.content,
          created_at: new Date().toISOString(),
          user_name: 'You',
        });
      }
      return jsonResponse([
        {
          reply_id: 1,
          content: 'In PostgreSQL, B-Trees support <, <=, =, >=, and > queries because values are kept sorted across leaf nodes.',
          created_at: '2026-09-27T17:15:00Z',
          user_name: 'Dr. K. Srinivas Rao',
          user_role: 'faculty',
        },
      ]);
    }
    if (method === 'POST') {
      const created = standaloneDB.saveDiscussion(body);
      return jsonResponse(created);
    }
    return jsonResponse(standaloneDB.getDiscussions());
  }

  // 8. STUDY GROUPS & COLLABORATIVE WORKSPACES
  if (path.includes('/api/groups')) {
    // 8a. Kanban Tasks: /api/groups/:id/tasks
    const matchTaskStage = path.match(/\/api\/groups\/(\d+)\/tasks\/(\d+)\/stage/);
    if (matchTaskStage && (method === 'PUT' || method === 'PATCH')) {
      const taskId = Number(matchTaskStage[2]);
      const res = standaloneDB.updateGroupTaskStage(taskId, body.stage);
      return jsonResponse(res);
    }

    const matchTasks = path.match(/\/api\/groups\/(\d+)\/tasks/);
    if (matchTasks) {
      const groupId = Number(matchTasks[1]);
      if (method === 'POST') {
        const created = standaloneDB.saveGroupTask({ ...body, group_id: groupId });
        return jsonResponse(created);
      }
      return jsonResponse(standaloneDB.getGroupTasks(groupId));
    }

    // 8b. Collaborative Scratchpad: /api/groups/:id/scratchpad
    const matchScratch = path.match(/\/api\/groups\/(\d+)\/scratchpad/);
    if (matchScratch) {
      const groupId = Number(matchScratch[1]);
      if (method === 'POST') {
        const saved = standaloneDB.saveGroupScratchpad(groupId, body.code, body.language, body.user_name);
        return jsonResponse(saved);
      }
      return jsonResponse(standaloneDB.getGroupScratchpad(groupId));
    }

    // 8c. Members list: /api/groups/:id/members
    if (path.includes('/members')) {
      return jsonResponse([
        { group_member_id: 1, user_id: 1, full_name: 'Shloka Reddy', email: '2200030001@klh.edu.in', role: 'Team Lead' },
        { group_member_id: 2, user_id: 5, full_name: 'Ananya Sharma', email: '2200030045@klh.edu.in', role: 'Core Contributor' },
        { group_member_id: 3, user_id: 7, full_name: 'Rahul Varma', email: '2200030089@klh.edu.in', role: 'Research Associate' },
      ]);
    }

    // 8d. Contributions: /api/groups/:id/contributions
    if (path.includes('/contributions')) {
      const matchGroup = path.match(/\/api\/groups\/(\d+)\/contributions/);
      const groupId = matchGroup ? Number(matchGroup[1]) : 1;
      const key = `group_contributions_${groupId}`;
      
      if (method === 'POST') {
        const existing: any[] = JSON.parse(localStorage.getItem(key) || '[]');
        const pointsMap: Record<string, number> = { task: 3, research: 5, file: 1, meeting: 2, comment: 1 };
        const newContrib = {
          contribution_id: Date.now(),
          group_id: groupId,
          user_id: Number(body.user_id || 1),
          contribution_type: body.contribution_type || 'task',
          description: body.description || '',
          points: pointsMap[body.contribution_type] || 3,
          created_at: new Date().toISOString(),
          full_name: body.full_name || 'Shloka Reddy',
        };
        existing.unshift(newContrib);
        localStorage.setItem(key, JSON.stringify(existing));
        return jsonResponse(newContrib);
      }

      const cached = localStorage.getItem(key);
      if (cached) {
        return jsonResponse(JSON.parse(cached));
      }

      const defaults = [
        { contribution_id: 1, group_id: groupId, user_id: 1, full_name: 'Shloka Reddy', contribution_type: 'research', description: 'Drafted complete ER schema & verified minimal cover functional dependencies', points: 5, created_at: '2026-09-29T10:00:00Z' },
        { contribution_id: 2, group_id: groupId, user_id: 5, full_name: 'Ananya Sharma', contribution_type: 'task', description: 'Implemented BCNF decomposition validator in Python algorithm', points: 3, created_at: '2026-09-30T14:30:00Z' },
        { contribution_id: 3, group_id: groupId, user_id: 7, full_name: 'Rahul Varma', contribution_type: 'file', description: 'Uploaded Hospital Patient Database benchmark dataset & DDL queries', points: 1, created_at: '2026-10-01T11:15:00Z' },
        { contribution_id: 4, group_id: groupId, user_id: 1, full_name: 'Shloka Reddy', contribution_type: 'meeting', description: 'Conducted sprint review huddle on ACID transactions and rollback states', points: 2, created_at: '2026-10-02T16:00:00Z' },
      ];
      localStorage.setItem(key, JSON.stringify(defaults));
      return jsonResponse(defaults);
    }

    if (method === 'POST') {
      const created = standaloneDB.saveGroup(body);
      return jsonResponse(created);
    }
    return jsonResponse(standaloneDB.getGroups());
  }

  // 9. ENROLLMENTS
  if (path.includes('/api/enrollments')) {
    if (method === 'POST') {
      const created = standaloneDB.saveEnrollment(Number(body.student_id), Number(body.course_id));
      return jsonResponse({ message: 'Enrolled successfully', enrollment: created }, 201);
    }
    const match = path.match(/\/api\/enrollments\/(?:student\/)?(\d+)/);
    const studentId = match ? Number(match[1]) : undefined;
    return jsonResponse(standaloneDB.getEnrollments(studentId));
  }

  // 10. NOTIFICATIONS
  if (path.includes('/api/notifications')) {
    if (method === 'DELETE') {
      const matchId = path.match(/\/api\/notifications\/(\d+)/);
      if (matchId) {
        standaloneDB.deleteNotification(Number(matchId[1]));
      }
      return jsonResponse({ message: 'Notification deleted successfully' });
    }

    if (method === 'PUT' && path.includes('/read-all')) {
      const matchUser = path.match(/\/api\/notifications\/user\/(\d+)\/read-all/);
      const uid = matchUser ? Number(matchUser[1]) : undefined;
      standaloneDB.markAllNotificationsRead(uid);
      return jsonResponse({ message: 'All notifications marked as read' });
    }

    if (method === 'PUT' && path.includes('/read')) {
      const matchId = path.match(/\/api\/notifications\/(\d+)\/read/);
      if (matchId) {
        standaloneDB.markNotificationRead(Number(matchId[1]));
      }
      return jsonResponse({ message: 'Notification marked as read' });
    }

    const matchUser = path.match(/\/api\/notifications\/(\d+)/);
    const userId = matchUser ? Number(matchUser[1]) : undefined;
    const notifs = standaloneDB.getNotifications(userId);
    return jsonResponse(notifs);
  }

  // 11. ACADEMIC AI ASSISTANT CHAT
  if (path.includes('/api/ai/chat') && method === 'POST') {
    const question = body.message || '';
    const reply = generateAcademicAiResponse(question, body.context);
    return jsonResponse({ reply, source: 'academic_engine' });
  }

  // Safe fallback: Return array for GET requests so .map() or Array.isArray() never crashes
  if (method === 'GET') {
    return jsonResponse([]);
  }

  return jsonResponse({ success: true });
}
