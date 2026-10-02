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
          : email.includes('faculty') || email.includes('prof') || email.includes('teacher') || email.endsWith('@faculty.edu.in')
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
      : email.endsWith('@faculty.edu.in')
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
    return jsonResponse(faculty);
  }

  // 3. COURSES
  if (path.includes('/api/courses')) {
    if (method === 'POST') {
      const created = standaloneDB.saveCourse(body);
      return jsonResponse(created);
    }
    return jsonResponse(standaloneDB.getCourses());
  }

  // 4. EXAMS & SUBMISSIONS
  if (path.includes('/api/exams')) {
    if (path.includes('/submit') && method === 'POST') {
      return jsonResponse({
        success: true,
        message: 'Exam submitted successfully and recorded.',
        marks_obtained: 46,
        total_marks: 50,
        percentage: 92,
        grade: 'A+',
      });
    }

    if (method === 'POST') {
      const newExam = standaloneDB.saveExam(body);
      return jsonResponse(newExam);
    }

    return jsonResponse(standaloneDB.getExams());
  }

  // 5. ASSIGNMENTS & ATTENDANCE
  if (path.includes('/api/assignments')) {
    if (method === 'POST') {
      const item = standaloneDB.saveAssignment(body);
      return jsonResponse(item);
    }
    return jsonResponse(standaloneDB.getAssignments());
  }

  if (path.includes('/api/submissions')) {
    return jsonResponse({ success: true, message: 'Submission uploaded successfully.' });
  }

  if (path.includes('/api/faculty/submissions')) {
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
        { user_id: 6, full_name: 'Rahul Varma', role: 'Member' },
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
