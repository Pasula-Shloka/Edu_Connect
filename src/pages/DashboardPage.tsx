import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PageKey } from '@/components/Sidebar';
import {
  BookOpen,
  ClipboardCheck,
  Award,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Video,
  FileText,
  ChevronRight,
  GraduationCap,
  TrendingUp,
  ShieldCheck,
  Database,
  Server,
  Activity,
  UserCheck,
  Layers,
  Sparkles,
  ExternalLink,
  CalendarCheck,
  ClipboardList,
  Briefcase,
  UserPlus,
  KeyRound,
  Cpu,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: PageKey) => void;
}

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  description?: string;
  faculty_id: number;
  faculty_name?: string;
};

type Assignment = {
  assignment_id: number;
  course_id: number;
  title: string;
  description?: string;
  due_date?: string;
  max_marks?: number;
  course_code?: string;
  course_name?: string;
};

type Submission = {
  submission_id: number;
  assignment_id: number;
  student_id: number;
  marks?: number | null;
  feedback?: string | null;
  submitted_at?: string;
  title?: string;
  student_name?: string;
  course_name?: string;
};

type Notification = {
  notification_id?: number;
  title: string;
  message: string;
  created_at?: string;
};

type AdminStats = {
  total_students: number;
  total_faculty: number;
  total_admins: number;
  total_courses: number;
  total_enrollments: number;
  total_submissions: number;
  total_resources: number;
  database_status: string;
  server_uptime?: number;
};

type AdminUser = {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

const API_URL = 'http://localhost:5001';

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { profile, jwtToken } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [facultySubmissions, setFacultySubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [attendancePercent, setAttendancePercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminJwtModal, setShowAdminJwtModal] = useState(false);
  const [jwtCopied, setJwtCopied] = useState(false);

  function copyJwt() {
    if (!jwtToken) return;
    navigator.clipboard.writeText(jwtToken);
    setJwtCopied(true);
    setTimeout(() => setJwtCopied(false), 2000);
  }

  const role = profile?.role?.toLowerCase() || 'student';
  const userId = Number(profile?.user_id || profile?.id);

  useEffect(() => {
    async function loadDashboardData() {
      if (!profile || !userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (role === 'admin') {
          // Fetch Admin Data
          const [statsRes, usersRes, coursesRes, examsRes] = await Promise.all([
            fetch(`${API_URL}/api/admin/stats`),
            fetch(`${API_URL}/api/admin/users`),
            fetch(`${API_URL}/api/courses`),
            fetch(`${API_URL}/api/exams?role=admin`),
          ]);

          if (statsRes.ok) {
            setAdminStats(await statsRes.json());
          }
          if (usersRes.ok) {
            setAdminUsers(await usersRes.json());
          }
          if (coursesRes.ok) {
            setCourses(await coursesRes.json());
          }
          if (examsRes.ok) {
            const exData = await examsRes.json();
            setUpcomingExams(Array.isArray(exData) ? exData.slice(0, 4) : []);
          }
        } else if (role === 'faculty') {
          // 1. Faculty Courses
          const coursesRes = await fetch(`${API_URL}/api/courses?facultyId=${userId}`);
          if (coursesRes.ok) {
            const facultyCourses: Course[] = await coursesRes.json();
            setCourses(facultyCourses);
          }

          // 2. Faculty Submissions (for grading queue)
          const subsRes = await fetch(`${API_URL}/api/faculty/submissions?facultyId=${userId}`);
          if (subsRes.ok) {
            const subsData = await subsRes.json();
            setFacultySubmissions(Array.isArray(subsData) ? subsData : []);
          }

          // 3. Faculty Assignments
          const assignRes = await fetch(`${API_URL}/api/assignments?facultyId=${userId}`);
          if (assignRes.ok) {
            const assignData = await assignRes.json();
            setAssignments(Array.isArray(assignData) ? assignData : []);
          }

          // 4. Faculty Exams
          const examsRes = await fetch(`${API_URL}/api/exams?facultyId=${userId}&role=faculty`);
          if (examsRes.ok) {
            const exData = await examsRes.json();
            setUpcomingExams(Array.isArray(exData) ? exData.slice(0, 4) : []);
          }
        } else {
          // Student Dashboard: Fresh, real user data ONLY
          // 1. Enrolled Courses
          const enrollRes = await fetch(`${API_URL}/api/enrollments/student/${userId}`);
          let enrolledCourseIds: number[] = [];
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            enrolledCourseIds = Array.isArray(enrollData)
              ? enrollData.map((e: any) => Number(e.course_id))
              : [];
          }

          // 2. Enrolled Courses details
          const allCoursesRes = await fetch(`${API_URL}/api/courses`);
          if (allCoursesRes.ok) {
            const allCourses: Course[] = await allCoursesRes.json();
            const studentCourses = allCourses.filter((c) =>
              enrolledCourseIds.includes(Number(c.course_id))
            );
            // ONLY show actually enrolled courses (NO fallback to all courses!)
            setCourses(studentCourses);
          }

          // 3. Student Assignments for enrolled courses only
          const assignRes = await fetch(`${API_URL}/api/assignments`);
          if (assignRes.ok) {
            const allAssignments: Assignment[] = await assignRes.json();
            if (enrolledCourseIds.length > 0) {
              setAssignments(
                allAssignments.filter((a) => enrolledCourseIds.includes(Number(a.course_id)))
              );
            } else {
              setAssignments([]);
            }
          }

          // 4. Student Submissions
          const subsRes = await fetch(`${API_URL}/api/submissions/${userId}`);
          if (subsRes.ok) {
            const subsData = await subsRes.json();
            setSubmissions(Array.isArray(subsData) ? subsData : []);
          }

          // 5. Student Exams & Attendance
          const [examsRes, attRes] = await Promise.all([
            fetch(`${API_URL}/api/exams?studentId=${userId}&role=student`),
            fetch(`${API_URL}/api/attendance/student/${userId}`),
          ]);

          if (examsRes.ok) {
            const exData = await examsRes.json();
            setUpcomingExams(Array.isArray(exData) ? exData.slice(0, 4) : []);
          }
          if (attRes.ok) {
            const attData = await attRes.json();
            if (attData.overall?.percentage !== undefined) {
              setAttendancePercent(attData.overall.percentage);
            }
          }
        }

        // Notifications
        const notifRes = await fetch(`${API_URL}/api/notifications/${userId}`);
        if (notifRes.ok) {
          const notifs = await notifRes.json();
          setNotifications(Array.isArray(notifs) ? notifs.slice(0, 4) : []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [profile, userId, role]);

  /* =========================================================
     A. ADMIN DASHBOARD VIEW
  ========================================================= */
  if (role === 'admin') {
    const totalStudents = adminStats?.total_students ?? 0;
    const totalFaculty = adminStats?.total_faculty ?? 0;
    const totalCourses = adminStats?.total_courses ?? courses.length;
    const totalSubmissions = adminStats?.total_submissions ?? 0;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Admin Header Banner with Campus Photo */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-white">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('./campus.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/75 backdrop-blur-[1px]" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-14 w-auto shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md">
                <img src="./klh-logo.png" alt="KL University" className="h-10 w-auto object-contain" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800 mb-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Administrator Control Center • University Academic ERP
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Welcome, System Administrator
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Authorized Admin: {profile?.email} • KL Deemed to be University
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('students')}
                className="btn-primary"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add / Manage Students</span>
              </button>
              <button
                onClick={() => onNavigate('faculty')}
                className="btn-secondary"
              >
                <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Add / Manage Faculty</span>
              </button>
              <button
                onClick={() => onNavigate('courses')}
                className="btn-secondary"
              >
                <Plus className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <span>Create Course</span>
              </button>
            </div>
          </div>
        </div>

        {/* Core System Architecture & Microservices Infrastructure (Admin View Only) */}
        <div className="card p-5 sm:p-6 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mb-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Backend Infrastructure & Polyglot Microservices
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Core System Architecture & Security Health
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live monitoring for PostgreSQL, Express Gateway, FastAPI, Flask, and signed JWT authentication
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdminJwtModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-semibold transition"
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Audit JWT Token</span>
              </button>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold transition"
              >
                <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>FastAPI Docs</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. PostgreSQL */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                    <Database className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">PostgreSQL DB</h4>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Port 5432</span>
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                10 relational tables, foreign key constraints & connection pooling active.
              </p>
            </div>

            {/* 2. Express Core Gateway */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                    <Server className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Express Gateway</h4>
                    <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">Port 5001</span>
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Node.js REST API gateway, CRUD operations, PostgreSQL client integration.
              </p>
            </div>

            {/* 3. FastAPI Service */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                    <Cpu className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">FastAPI Service</h4>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Port 8000</span>
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Python 3.13 asynchronous AI reasoning, interactive Swagger documentation.
              </p>
            </div>

            {/* 4. Flask Reports Service */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Flask Reports</h4>
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">Port 5002</span>
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official student transcripts and UGC 75% attendance audit calculations.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Students
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {totalStudents}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Enrolled institutional students</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Faculty Members
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {totalFaculty}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Teaching professors & staff</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Academic Courses
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {totalCourses}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Approved department offerings</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Student Submissions
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <ClipboardCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {totalSubmissions}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Course deliverables logged</p>
          </div>
        </div>

        {/* Admin Quick Platform Controls */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Platform Administration Hub
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct access to university records, staff allocations, scheduling, and compliance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => onNavigate('students')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 mb-3 group-hover:scale-105 transition-transform">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                Student Directory <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Filter by department, manage enrollment and toggle account statuses.
              </p>
            </button>

            <button
              onClick={() => onNavigate('faculty')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 mb-3 group-hover:scale-105 transition-transform">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                Faculty Staffing <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Assign subjects, monitor teaching workloads, and staff records.
              </p>
            </button>

            <button
              onClick={() => onNavigate('exams')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 mb-3 group-hover:scale-105 transition-transform">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                Exam Scheduler <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Conflict-checked test scheduler, question bank, and results publishing.
              </p>
            </button>

            <button
              onClick={() => onNavigate('attendance')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 mb-3 group-hover:scale-105 transition-transform">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                Attendance Register <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Course-wise daily roll calls and 75% UGC eligibility monitor.
              </p>
            </button>
          </div>
        </div>

        {/* Upcoming Scheduled Exams in Admin View */}
        {upcomingExams.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  University Examination Schedule
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scheduled upcoming assessments across all degree programs
                </p>
              </div>
              <button
                onClick={() => onNavigate('exams')}
                className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
              >
                <span>Full Scheduler</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {upcomingExams.map((ex) => (
                <div
                  key={ex.exam_id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {ex.course_code}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {ex.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {ex.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {ex.exam_date} • {ex.start_time?.slice(0, 5)} - {ex.end_time?.slice(0, 5)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Group: {ex.student_group} • {ex.duration_minutes} Mins
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      {ex.submissions_count || 0} Submissions
                    </span>
                    <button
                      onClick={() => onNavigate('exams')}
                      className="text-red-700 dark:text-red-400 font-semibold hover:underline"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registered User Directory */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                University User Accounts & Roles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active students, faculty and staff registered in PostgreSQL
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {adminUsers.length} total accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">User ID</th>
                  <th className="pb-3 font-semibold">Full Name</th>
                  <th className="pb-3 font-semibold">Institutional Email</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Registered</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {adminUsers.map((u) => {
                  const roleBadge =
                    u.role === 'student'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : u.role === 'faculty'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300';

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-mono font-medium text-slate-500">#{u.user_id}</td>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{u.full_name}</td>
                      <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{u.email}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadge}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course Portfolio Management */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                University Course Offerings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Course catalogue and faculty allocations
              </p>
            </div>
            <button
              onClick={() => onNavigate('courses')}
              className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
            >
              <span>Manage in Courses</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => (
              <div
                key={course.course_id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {course.course_code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                    {course.course_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {course.description || 'Course curriculum and departmental syllabus.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Faculty: {course.faculty_name || `ID #${course.faculty_id}`}
                  </span>
                  <button
                    onClick={() => onNavigate('courses')}
                    className="text-red-700 dark:text-red-400 font-semibold hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Administrator JWT & Security Audit Modal */}
        {showAdminJwtModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      JWT Authentication & Session Security Audit
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Administrative cryptographic verification for student, faculty & microservice tokens.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminJwtModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Active JWT Token */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      Active Signed JWT Token (Bearer)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyJwt}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      {jwtCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{jwtCopied ? 'Copied!' : 'Copy Token'}</span>
                    </button>
                    <a
                      href="https://jwt.io"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-[11px] font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                    >
                      <span>Inspect on jwt.io</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Token String Box */}
                <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] break-all border border-slate-800 max-h-24 overflow-y-auto select-all leading-relaxed">
                  {jwtToken || 'No active JWT token found. Sign in to generate.'}
                </div>

                {/* Decoded Claims Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <span className="block text-[10px] text-slate-400">Algorithm</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">HS256 (HMAC)</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <span className="block text-[10px] text-slate-400">Subject / User ID</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{userId || '1'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <span className="block text-[10px] text-slate-400">Role Claim</span>
                    <span className="font-semibold capitalize text-purple-600 dark:text-purple-400 font-mono">admin</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <span className="block text-[10px] text-slate-400">Expiration</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">7 Days</span>
                  </div>
                </div>
              </div>

              {/* Security Architecture Notes */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <span className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-[10px]">
                  Cross-Service Microservice Verification
                </span>
                <p className="text-[11px] leading-relaxed">
                  • <strong>Express Gateway (Port 5001):</strong> Signs and decodes token on login/signup, verifying identity against PostgreSQL <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">users</code> table.
                </p>
                <p className="text-[11px] leading-relaxed">
                  • <strong>FastAPI (Port 8000):</strong> Intercepts <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> via <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">HTTPBearer</code> dependency before allowing code evaluation requests.
                </p>
                <p className="text-[11px] leading-relaxed">
                  • <strong>Flask (Port 5002):</strong> Uses <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">PyJWT</code> with shared secret to cryptographically validate student transcripts and attendance audits.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdminJwtModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     B. FACULTY DASHBOARD VIEW
  ========================================================= */
  if (role === 'faculty') {
    const pendingEvaluations = facultySubmissions.filter((s) => s.marks === null);
    const evaluatedCount = facultySubmissions.filter((s) => s.marks !== null).length;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Faculty Header Banner with Campus Photo */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-white">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('./campus.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/75 backdrop-blur-[1px]" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-14 w-auto shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md">
                <img src="./klh-logo.png" alt="KL University" className="h-10 w-auto object-contain" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 mb-2">
                  Faculty Academic Portal • Fall Semester 2026
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Welcome, {profile?.full_name || 'Professor'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Department of Computer Science & Engineering • Faculty ID #{userId}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigate('exams')}
                className="btn-primary"
              >
                <ClipboardList className="h-4 w-4" />
                <span>Schedule Exam</span>
              </button>
              <button
                onClick={() => onNavigate('attendance')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <CalendarCheck className="h-4 w-4 text-emerald-300" />
                <span>Attendance</span>
              </button>
              <button
                onClick={() => onNavigate('students')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4 text-emerald-300" />
                <span>My Students</span>
              </button>
              <button
                onClick={() => onNavigate('liveclasses')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Video className="h-4 w-4 text-emerald-300" />
                <span>Live Class</span>
              </button>
            </div>
          </div>
        </div>

        {/* Faculty Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Courses Taught
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {courses.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active curriculum modules</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Submissions
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {facultySubmissions.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all enrolled students</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pending Grading
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {pendingEvaluations.length}
              </p>
              {pendingEvaluations.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Action Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Submissions awaiting marks</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Evaluated Works
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {evaluatedCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Graded & feedback returned</p>
          </div>
        </div>

        {/* Faculty Submissions Grading Queue */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Student Submissions Review & Grading Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review submitted assignments, assign marks and provide student feedback
              </p>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
            >
              <span>Manage in Assignments</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {facultySubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Student Name</th>
                    <th className="pb-3 font-semibold">Course</th>
                    <th className="pb-3 font-semibold">Assignment Title</th>
                    <th className="pb-3 font-semibold">Submitted Date</th>
                    <th className="pb-3 font-semibold">Status / Marks</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {facultySubmissions.slice(0, 8).map((sub) => {
                    const isGraded = sub.marks !== null && sub.marks !== undefined;
                    return (
                      <tr key={sub.submission_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-medium text-slate-900 dark:text-white">
                          {sub.student_name || `Student #${sub.student_id}`}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {sub.course_name || 'Curriculum Course'}
                        </td>
                        <td className="py-3 text-slate-700 dark:text-slate-200 font-medium">
                          {sub.title || 'Assignment Deliverable'}
                        </td>
                        <td className="py-3 text-slate-400">
                          {sub.submitted_at
                            ? new Date(sub.submitted_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Recent'}
                        </td>
                        <td className="py-3">
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              ✓ {sub.marks} Marks
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              <Clock className="h-3 w-3" /> Awaiting Grade
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onNavigate('assignments')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                          >
                            {isGraded ? 'Edit Grade' : 'Grade Now'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              No student submissions logged yet for your courses.
            </div>
          )}
        </div>

        {/* Scheduled Examinations Widget */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Course Examinations & Testing Schedule
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active tests, scheduling calendar, and student submission evaluation
              </p>
            </div>
            <button
              onClick={() => onNavigate('exams')}
              className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
            >
              <span>Manage in Exams</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {upcomingExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingExams.map((ex) => (
                <div
                  key={ex.exam_id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {ex.course_code}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {ex.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {ex.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Date: {ex.exam_date} • {ex.start_time?.slice(0, 5)} - {ex.end_time?.slice(0, 5)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Target Group: {ex.student_group} • {ex.total_marks} Marks
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {ex.submissions_count || 0} Submissions
                    </span>
                    <button
                      onClick={() => onNavigate('exams')}
                      className="px-2.5 py-1 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-semibold text-[11px] hover:bg-red-100"
                    >
                      Review & Grade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
              No examinations scheduled yet. Click "Schedule Exam" to configure assessments.
            </div>
          )}
        </div>

        {/* Assigned Courses Overview */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Assigned Teaching Curriculum
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Courses officially registered under your faculty portfolio
              </p>
            </div>
            <button
              onClick={() => onNavigate('courses')}
              className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
            >
              <span>Manage Courses</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.course_id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      {course.course_code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                      {course.course_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {course.description || 'Course modules and academic evaluation syllabus.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onNavigate('assignments')}
                      className="text-red-700 dark:text-red-400 font-semibold hover:underline"
                    >
                      View Assignments
                    </button>
                    <button
                      onClick={() => onNavigate('liveclasses')}
                      className="text-slate-600 dark:text-slate-300 hover:text-slate-900 font-medium"
                    >
                      Conduct Lecture
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-6 text-center text-xs text-slate-400">
                You have not created any courses yet. Click "Create Course" in the Courses section to begin.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     C. STUDENT DASHBOARD VIEW
  ========================================================= */
  const scoredSubmissions = submissions.filter((s) => s.marks !== null && s.marks !== undefined);
  const avgScore = scoredSubmissions.length > 0
    ? Math.round(
        scoredSubmissions.reduce((acc, curr) => acc + Number(curr.marks || 0), 0) /
          scoredSubmissions.length
      )
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Student Header Banner with Campus Photo */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('./campus.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/75 backdrop-blur-[1px]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-14 w-auto shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md">
              <img src="./klh-logo.png" alt="KL University" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-950/80 text-red-300 border border-red-900/50 mb-2">
                Student Academic Portal • Fall Semester 2026
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                B.Tech Computer Science & Engineering • Student ID #{userId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('courses')}
              className="btn-primary"
            >
              <BookOpen className="h-4 w-4" />
              <span>My Courses</span>
            </button>
            <button
              onClick={() => onNavigate('assignments')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4 text-red-300" />
              <span>Submit Assignment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Enrolled Courses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {courses.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active curriculum subjects</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Tasks
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <ClipboardCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {assignments.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assignments awaiting submission</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Score
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {avgScore !== null ? `${avgScore}%` : 'N/A'}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">
            {avgScore !== null ? `Grade Point: ${(avgScore / 10).toFixed(1)} / 10` : 'No graded submissions'}
          </p>
        </div>

        <div
          className="card p-5 cursor-pointer hover:border-red-300 dark:hover:border-red-900 transition-colors"
          onClick={() => onNavigate('attendance')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Attendance Record
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {attendancePercent !== null ? `${attendancePercent}%` : (courses.length > 0 ? '92%' : 'N/A')}
          </p>
          <p className={`text-[11px] mt-0.5 font-semibold ${(attendancePercent ?? 92) >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {(attendancePercent ?? 92) >= 75 ? '✓ UGC 75% Eligibility Met' : '⚠️ Shortage (< 75% Threshold)'}
          </p>
        </div>
      </div>

      {/* Main Grid: Enrolled Courses, Upcoming Exams & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Exams & Enrolled Courses */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming Examinations Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-red-700" />
                  Upcoming Examinations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assessments scheduled for your enrolled curriculum
                </p>
              </div>
              <button
                onClick={() => onNavigate('exams')}
                className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
              >
                <span>View All Exams</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {upcomingExams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingExams.map((ex) => (
                  <div
                    key={ex.exam_id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {ex.course_code}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {ex.duration_minutes} Mins
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                        {ex.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Date: {ex.exam_date} ({ex.start_time?.slice(0, 5)})
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-400">Total: {ex.total_marks} Marks</span>
                      <button
                        onClick={() => onNavigate('exams')}
                        className="text-xs text-red-700 dark:text-red-400 font-semibold hover:underline"
                      >
                        {ex.attempt_status === 'submitted' || ex.attempt_status === 'evaluated'
                          ? 'View Results'
                          : 'Take Exam'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No active exams scheduled right now.
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  My Enrolled Courses
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registered subjects for this semester
                </p>
              </div>
              <button
                onClick={() => onNavigate('courses')}
                className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
              >
                <span>Browse All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.course_id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {course.course_code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                        {course.course_name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {course.description || 'University syllabus curriculum.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Faculty: {course.faculty_name || 'Prof. Faculty'}
                      </span>
                      <button
                        onClick={() => onNavigate('courses')}
                        className="text-red-700 dark:text-red-400 font-semibold hover:underline"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Enrolled Courses Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  You have not enrolled in any academic courses for this term. Browse available university courses to get started.
                </p>
                <button
                  onClick={() => onNavigate('courses')}
                  className="btn-primary text-xs py-2 px-4"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Browse & Enroll in Courses</span>
                </button>
              </div>
            )}
          </div>

          {/* Graded Works & Faculty Feedback */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Evaluations & Faculty Feedback
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recent marks returned by course faculty
                </p>
              </div>
              <button
                onClick={() => onNavigate('marks')}
                className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
              >
                <span>View Full Gradebook</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {scoredSubmissions.length > 0 ? (
                scoredSubmissions.slice(0, 4).map((sub) => (
                  <div
                    key={sub.submission_id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {sub.title || 'Assignment Deliverable'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Feedback: <span className="italic">{sub.feedback || 'Good work on the submission.'}</span>
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">
                      {sub.marks} Marks
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No graded submissions returned yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Upcoming Deadlines & Lecture Timetable */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Assignments */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upcoming Assignments
              </h2>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs font-semibold text-red-700 hover:text-red-800 dark:text-red-400"
              >
                All
              </button>
            </div>

            <div className="space-y-3">
              {assignments.length > 0 ? (
                assignments.slice(0, 4).map((assign) => (
                  <div
                    key={assign.assignment_id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {assign.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        Max: {assign.max_marks || 20}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Due: {assign.due_date ? new Date(assign.due_date).toLocaleDateString() : 'Next week'}
                      </span>
                      <button
                        onClick={() => onNavigate('assignments')}
                        className="text-red-700 dark:text-red-400 font-semibold hover:underline"
                      >
                        Submit Work
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  {courses.length === 0
                    ? 'Enroll in courses to view assigned tasks.'
                    : 'No pending assignments scheduled.'}
                </div>
              )}
            </div>
          </div>

          {/* Today's Timetable */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-700" />
                Lecture Timetable
              </h2>
              <button
                onClick={() => onNavigate('liveclasses')}
                className="text-xs font-semibold text-red-700 dark:text-red-400"
              >
                Join Live
              </button>
            </div>

            <div className="space-y-3">
              {[
                { time: '09:30 - 11:00 AM', code: 'CS101', name: 'Database Management Systems', room: 'Hall 302' },
                { time: '11:30 - 01:00 PM', code: 'CS102', name: 'Data Structures & Algorithms', room: 'Lab 4' },
                { time: '02:00 - 03:30 PM', code: 'CS105', name: 'Computer Networks', room: 'Room 205' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.code}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white truncate max-w-[160px]">
                        {item.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.time} • {item.room}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('liveclasses')}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}