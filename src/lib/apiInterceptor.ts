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
      window.location.hostname !== '127.0.0.1';

    // If on a remote host (e.g. pasula-shloka.github.io), browser will block http://localhost:5001
    // so we handle it immediately using the standalone academic engine!
    if (isRemoteHost) {
      return handleStandaloneRequest(urlStr, init);
    }

    // On localhost, attempt the real backend first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await ORIGINAL_FETCH(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (networkError) {
      console.warn('Local backend unavailable, falling back to standalone institutional engine:', networkError);
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
    let matchedUser = users.find(u => u.email.toLowerCase() === email);

    if (!matchedUser) {
      // Auto-detect institutional role based on email identifier
      const role: 'student' | 'faculty' | 'admin' =
        email.includes('admin') || email.endsWith('@admin.edu.in')
          ? 'admin'
          : email.includes('faculty') || email.includes('prof') || email.includes('teacher') || email.endsWith('@faculty.edu.in') || email.includes('lalitha')
          ? 'faculty'
          : 'student';

      const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      matchedUser = standaloneDB.saveUser({
        email,
        full_name: formattedName || 'KL University Member',
        role,
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
    const email = (body.email || '').trim().toLowerCase();
    const role = email.endsWith('@admin.edu.in')
      ? 'admin'
      : email.endsWith('@faculty.edu.in') || email.includes('faculty')
      ? 'faculty'
      : 'student';

    const saved = standaloneDB.saveUser({
      email,
      full_name: body.full_name || 'New Member',
      role,
      status: 'Active',
    });

    return jsonResponse({
      message: 'Account created successfully',
      user_id: saved.user_id,
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
    const enriched = students.map((s, idx) => ({
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
      enrolled_courses_count: 4,
      submissions_count: 5,
      avg_assignment_score: 84.5 + (idx % 10),
      attendance_present_count: 18 + (idx % 5),
      attendance_total_count: 22,
    }));
    return jsonResponse(enriched);
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
      standaloneDB.evaluateSubmission(attemptId, evals, fb);
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

  if (path.includes('/api/submissions')) {
    return jsonResponse({ success: true, message: 'Submission uploaded successfully.' });
  }

  if (path.includes('/api/faculty/submissions')) {
    const facultyId = url.searchParams.get('facultyId');
    return jsonResponse([
      {
        submission_id: 1,
        assignment_id: 1,
        assignment_title: 'Assignment 1: ER Modeling & Schema Design',
        student_id: 1,
        student_name: 'Shloka Reddy',
        status: 'Submitted',
        submitted_at: '2026-09-28T14:30:00Z',
        marks: 24,
        faculty_id: facultyId ? Number(facultyId) : 3,
      },
    ]);
  }

  if (path.includes('/api/attendance')) {
    return jsonResponse(standaloneDB.getAttendance());
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

  // 8. STUDY GROUPS
  if (path.includes('/api/groups')) {
    if (path.includes('/members')) {
      return jsonResponse([
        { user_id: 1, full_name: 'Shloka Reddy', role: 'Leader' },
        { user_id: 5, full_name: 'Ananya Sharma', role: 'Member' },
        { user_id: 7, full_name: 'Rahul Varma', role: 'Member' },
      ]);
    }
    if (path.includes('/contributions')) {
      return jsonResponse([
        { contribution_id: 1, user_id: 1, user_name: 'Shloka Reddy', type: 'task', description: 'Drafted ER diagram for hospital scenario', points: 3, created_at: '2026-09-29T10:00:00Z' },
      ]);
    }
    if (method === 'POST') {
      const created = standaloneDB.saveGroup(body);
      return jsonResponse(created);
    }
    return jsonResponse(standaloneDB.getGroups());
  }

  // 9. ENROLLMENTS
  if (path.includes('/api/enrollments')) {
    return jsonResponse([
      { enrollment_id: 1, course_id: 1, student_id: 1 },
      { enrollment_id: 2, course_id: 2, student_id: 1 },
      { enrollment_id: 3, course_id: 3, student_id: 1 },
      { enrollment_id: 4, course_id: 4, student_id: 1 },
      { enrollment_id: 5, course_id: 5, student_id: 1 },
      { enrollment_id: 6, course_id: 6, student_id: 1 },
      { enrollment_id: 7, course_id: 7, student_id: 1 },
    ]);
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
