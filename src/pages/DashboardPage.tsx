import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PageKey } from '@/components/Sidebar';
import StudentIDCard from '@/components/StudentIDCard';
import VibeCheckInModal from '@/components/VibeCheckInModal';
import FacultyVibeMeter from '@/components/FacultyVibeMeter';
import CampusEventPosterModal, { type EventPoster } from '@/components/CampusEventPosterModal';
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
  Bell,
  Calculator,
  MessageSquare,
  Send,
  Check,
  Loader2,
  Smartphone,
  Radio,
  Megaphone,
  Flame,
} from 'lucide-react';
import { getCurrentAndNextClass, normalizeSection, TIMETABLE_SECTIONS } from '@/lib/timetableData';
import { triggerImmediateMobileAlertTest } from '@/services/scheduleNotifier';

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
  const { profile } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [facultySubmissions, setFacultySubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [attendancePercent, setAttendancePercent] = useState<number | null>(null);
  const [attendanceTotalLectures, setAttendanceTotalLectures] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Campus Event Posters Spotlight & Admin Studio state
  const [showEventPosterModal, setShowEventPosterModal] = useState(false);
  const [eventModalAdminMode, setEventModalAdminMode] = useState(false);
  const [eventPosters, setEventPosters] = useState<EventPoster[]>([]);

  // Real-time Class Alert state
  const [classAlertLoading, setClassAlertLoading] = useState(false);
  const [classAlertStatus, setClassAlertStatus] = useState<{
    success: boolean;
    message: string;
    phone?: string;
    alert_text?: string;
    whatsapp_link?: string;
    sms_link?: string;
  } | null>(null);

  // Academic Attendance Compliance state
  const [calcAttended, setCalcAttended] = useState<number>(0);
  const [calcTotal, setCalcTotal] = useState<number>(0);

  const role = profile?.role?.toLowerCase() || 'student';
  const userId = Number(profile?.user_id || profile?.id);

  // Load event posters & auto-trigger popup on student login
  async function loadEventPosters() {
    try {
      const res = await fetch(`${API_URL}/api/event-posters${role === 'admin' ? '' : '?activeOnly=true'}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEventPosters(data);
        }
      }
    } catch {
      // Fallback handled inside CampusEventPosterModal
    }
  }

  useEffect(() => {
    if (!profile) return;
    loadEventPosters();

    // Auto-open Campus Event Poster Spotlight popup when a student logs into the portal
    if (role === 'student') {
      const alreadyShown = sessionStorage.getItem('kl_event_spotlight_shown');
      if (!alreadyShown) {
        sessionStorage.setItem('kl_event_spotlight_shown', 'true');
        const timer = setTimeout(() => {
          setEventModalAdminMode(false);
          setShowEventPosterModal(true);
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [profile?.email, role]);

  // Sync calculator defaults when attendance records change
  useEffect(() => {
    if (attendanceTotalLectures > 0) {
      const rate = attendancePercent || 0;
      const attended = Math.round((rate / 100) * attendanceTotalLectures);
      setCalcAttended(attended);
      setCalcTotal(attendanceTotalLectures);
    } else {
      setCalcAttended(0);
      setCalcTotal(0);
    }
  }, [attendanceTotalLectures, attendancePercent]);

  // Timetable computation for student section (E1 to E7)
  const studentSection = normalizeSection(profile?.section || (profile as any)?.class_section || 'E4');
  const classStatus = getCurrentAndNextClass(studentSection);

  async function handleSendNextClassAlert() {
    const targetClass = classStatus.nextClass || classStatus.currentClass;
    const targetSlot = classStatus.nextSlot || classStatus.currentSlot;
    if (!targetClass) return;

    try {
      setClassAlertLoading(true);
      setClassAlertStatus(null);
      const res = await fetch(`${API_URL}/api/timetable/send-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: userId,
          student_name: profile?.full_name || 'Student',
          student_email: profile?.email || 'shloka.p@klh.edu.in',
          class_details: {
            title: targetClass.title,
            code: targetClass.code,
            faculty: targetClass.faculty,
            room: targetClass.room,
            time: targetSlot?.displayTime || 'Upcoming Period',
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setClassAlertStatus(data);
      } else {
        setClassAlertStatus({
          success: false,
          message: data.error || 'Failed to dispatch class notification.',
        });
      }
    } catch (err: any) {
      setClassAlertStatus({
        success: false,
        message: err.message || 'Network error triggering alert',
      });
    } finally {
      setClassAlertLoading(false);
    }
  }

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
            let facultyCourses: Course[] = await coursesRes.json();
            if (Array.isArray(facultyCourses)) {
              facultyCourses = facultyCourses.filter((c: any) => Number(c.faculty_id) === userId);
            }
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
            const total = Number(attData.overall?.total_lectures ?? 0);
            const rate = attData.overall?.overall_percentage ?? attData.overall?.percentage;
            setAttendanceTotalLectures(total);
            setAttendancePercent(rate !== null && rate !== undefined ? Number(rate) : (total > 0 ? 0 : null));
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
        {/* Admin Event Poster Management & Spotlight Preview Modal */}
        <CampusEventPosterModal
          isOpen={showEventPosterModal}
          onClose={() => {
            setShowEventPosterModal(false);
            loadEventPosters();
          }}
          isAdmin={true}
          initialAdminMode={eventModalAdminMode}
        />

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
                onClick={() => {
                  setEventModalAdminMode(true);
                  setShowEventPosterModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all"
              >
                <Megaphone className="h-4 w-4" />
                <span>Manage Event Posters</span>
              </button>
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

        {/* Admin Campus Event Banners & Login Popup Studio Card */}
        <div className="card p-6 border-2 border-rose-500/20 dark:border-rose-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/80 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Student Login Popup Spotlight
              </div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Campus Event Banners & Hackathon Posters Studio
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                These promotional event posters automatically pop up whenever a student logs into the portal. Upload new event flyers, edit details, or toggle visibility anytime.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setEventModalAdminMode(false);
                  setShowEventPosterModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Preview Student Popup</span>
              </button>
              <button
                onClick={() => {
                  setEventModalAdminMode(true);
                  setShowEventPosterModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add / Update Event Posters</span>
              </button>
            </div>
          </div>

          {eventPosters.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {eventPosters.slice(0, 3).map((poster) => (
                <div
                  key={poster.poster_id}
                  onClick={() => {
                    setEventModalAdminMode(true);
                    setShowEventPosterModal(true);
                  }}
                  className="group cursor-pointer rounded-xl bg-slate-950/70 border border-white/10 hover:border-amber-400/50 p-3 flex items-center gap-3.5 transition-all"
                >
                  <img
                    src={poster.image_url}
                    alt={poster.title}
                    className="w-16 h-20 object-cover rounded-lg border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {poster.category}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          poster.is_active
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {poster.is_active ? 'Active on Login' : 'Hidden'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{poster.title}</h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{poster.event_date}</p>
                    <p className="text-[10px] text-amber-400 font-semibold mt-1">
                      🔥 {poster.rsvp_count || 0} Students Interested
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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

        {/* Real-Time Classroom Sentiment & Vibe Meter */}
        <FacultyVibeMeter />

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
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                ✓ {sub.marks} Marks
                              </span>
                              {sub.feedback && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5 max-w-xs truncate" title={sub.feedback}>
                                  "{sub.feedback}"
                                </p>
                              )}
                            </div>
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

  // Academic Attendance Compliance & Recovery Calculations
  const calcPct = calcTotal > 0 ? (calcAttended / calcTotal) * 100 : 0;
  const bufferLectures = calcTotal > 0 && calcPct >= 75 ? Math.floor((4 * calcAttended - 3 * calcTotal) / 3) : 0;
  const classesNeeded = calcTotal > 0 && calcPct < 75 ? Math.max(0, Math.ceil(3 * calcTotal - 4 * calcAttended)) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Campus Event Posters Login Spotlight Popup for Student */}
      <CampusEventPosterModal
        isOpen={showEventPosterModal}
        onClose={() => {
          setShowEventPosterModal(false);
          loadEventPosters();
        }}
        isAdmin={false}
      />

      {/* Daily Vibe Check-in Pop-up for Student */}
      <VibeCheckInModal studentId={userId} studentName={profile?.full_name?.split(' ')[0]} />

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

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEventModalAdminMode(false);
                setShowEventPosterModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all"
            >
              <Flame className="h-4 w-4" />
              <span>Campus Events ({eventPosters.length || 3})</span>
            </button>
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

      {/* Live Campus Event Banners & Hackathons Spotlight Strip */}
      {eventPosters.length > 0 && (
        <div className="card p-4 sm:p-5 border border-rose-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/80 text-white">
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shrink-0 shadow">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Campus Event Spotlight — Hackathons, Workshops & Auditions</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Click any poster to view full size
                  </span>
                </h2>
              </div>
            </div>
            <button
              onClick={() => {
                setEventModalAdminMode(false);
                setShowEventPosterModal(true);
              }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
            >
              <span>Open Poster Carousel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {eventPosters.slice(0, 3).map((poster) => (
              <div
                key={poster.poster_id}
                onClick={() => {
                  setEventModalAdminMode(false);
                  setShowEventPosterModal(true);
                }}
                className="group cursor-pointer rounded-xl bg-slate-950/75 border border-white/10 hover:border-amber-400/60 p-3 flex items-center gap-3.5 transition-all hover:shadow-lg"
              >
                <img
                  src={poster.image_url}
                  alt={poster.title}
                  className="w-14 h-18 object-cover rounded-lg border border-white/15 shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-1">
                    {poster.category}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {poster.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{poster.event_date}</p>
                  <p className="text-[10px] text-amber-400 font-semibold mt-1">
                    🔥 {poster.rsvp_count || 0} Interested • View Poster →
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3D Holographic Student Badge & Metric Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: 3D Flip Student Badge (4 cols) */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <StudentIDCard user={profile || {}} />
        </div>

        {/* Right: Student Metric Cards in 2x2 Grid (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {attendanceTotalLectures === 0
                ? '0%'
                : attendancePercent !== null
                ? `${attendancePercent}%`
                : '0%'}
            </p>
            <p
              className={`text-[11px] mt-0.5 font-semibold ${
                attendanceTotalLectures === 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : (attendancePercent ?? 0) >= 75
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {attendanceTotalLectures === 0
                ? 'ℹ️ New Student • No sessions recorded yet'
                : (attendancePercent ?? 0) >= 75
                ? '✓ UGC 75% Eligibility Met'
                : '⚠️ Shortage (< 75% Threshold)'}
            </p>
          </div>
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

          {/* Real-time Live Class & Next Lecture Alert Card */}
          <div className="card p-6 border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Live Period & Schedule
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    KL CSE Section {studentSection} • Today ({classStatus.day})
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('timetable')}
                className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <span>Full Timetable</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Current Class / Status */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 mb-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Current Session
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {classStatus.currentSlot ? classStatus.currentSlot.displayTime : 'Campus Off-Hours'}
                </span>
              </div>
              {classStatus.currentClass ? (
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {classStatus.currentClass.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 shrink-0">
                      {classStatus.currentClass.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate">Faculty: {classStatus.currentClass.faculty}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">
                      {classStatus.currentClass.room || 'Room 304'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No active lecture currently running. Scheduled classes resume at 8:15 AM.
                </p>
              )}
            </div>

            {/* Next Class Banner & 1-Click Alert Button */}
            <div className="p-3.5 rounded-xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Upcoming Next Class
                </span>
                <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300">
                  {classStatus.nextSlot ? classStatus.nextSlot.displayTime : 'Next Working Period'}
                </span>
              </div>

              {classStatus.nextClass ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {classStatus.nextClass.title}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      {classStatus.nextClass.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate">Faculty: {classStatus.nextClass.faculty}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium shrink-0">
                      {classStatus.nextClass.room || 'Block B - 304'}
                    </span>
                  </div>

                  {/* Autonomous Schedule-Time Mobile Alert Status */}
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
                        <span>Autonomous Mobile Alerts Active</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Schedule Basis
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Alerts dispatch automatically to your mobile 5 minutes before each lecture slot without clicking.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setClassAlertLoading(true);
                          const res = await triggerImmediateMobileAlertTest(profile);
                          setClassAlertStatus({
                            success: true,
                            message: `Auto-alert verified for ${res.title}! Bell sounded and mobile notified.`,
                          });
                          setTimeout(() => setClassAlertStatus(null), 6000);
                        } finally {
                          setClassAlertLoading(false);
                        }
                      }}
                      disabled={classAlertLoading}
                      className="w-full py-2 px-3 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-98 disabled:opacity-50"
                    >
                      {classAlertLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5" />
                      )}
                      <span>Test Mobile Alert & Bell Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Day schedule completed. All periods cleared.</p>
              )}

              {/* Status Alert Banner */}
              {classAlertStatus && (
                <div
                  className={`mt-2.5 p-2.5 rounded-lg border text-xs space-y-1.5 ${
                    classAlertStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {classAlertStatus.success ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                    <span>{classAlertStatus.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive UGC 75% Exam Clearance Compliance Engine */}
          <div className="card p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    UGC 75% Exam Clearance Compliance Engine
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Official UGC & KL University Examination Clearance Calculator
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  calcTotal === 0
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                    : calcPct >= 75
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {calcTotal === 0 ? 'Fresh Semester' : calcPct >= 75 ? 'Hall Ticket Cleared' : 'Shortage'}
              </span>
            </div>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Attended Classes
                </label>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCalcAttended((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={calcAttended}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setCalcAttended(val);
                      if (val > calcTotal) setCalcTotal(val);
                    }}
                    className="w-16 text-center font-bold text-base bg-transparent text-slate-900 dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCalcAttended((prev) => prev + 1);
                      if (calcAttended + 1 > calcTotal) setCalcTotal(calcAttended + 1);
                    }}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Total Conducted
                </label>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCalcTotal((prev) => Math.max(calcAttended, prev - 1))}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={calcAttended}
                    value={calcTotal}
                    onChange={(e) => {
                      const val = Math.max(calcAttended, parseInt(e.target.value) || 0);
                      setCalcTotal(val);
                    }}
                    className="w-16 text-center font-bold text-base bg-transparent text-slate-900 dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCalcTotal((prev) => prev + 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar & Percentage */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Current Ratio: {calcAttended} / {calcTotal} Lectures
                </span>
                <span
                  className={`font-black text-sm ${
                    calcTotal === 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : calcPct >= 75
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {calcTotal === 0 ? '0.0%' : `${calcPct.toFixed(1)}%`}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    calcTotal === 0
                      ? 'bg-blue-500'
                      : calcPct >= 75
                      ? 'bg-emerald-500'
                      : calcPct >= 65
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, calcPct))}%` }}
                />
                {/* 75% indicator line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900/60 dark:bg-white/60 z-10"
                  style={{ left: '75%' }}
                  title="75% UGC Minimum Requirement"
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                <span>0%</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">75% UGC Threshold</span>
                <span>100%</span>
              </div>
            </div>

            {/* Smart Output Analysis */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
              {calcTotal === 0 ? (
                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  🌟 <strong>Semester Initialization:</strong> No classes recorded yet. Maintain your attendance above 85% by attending upcoming periods to stay in the dean&apos;s honors list.
                </div>
              ) : calcPct >= 75 ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Permissible Buffer: {bufferLectures} Lectures</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {bufferLectures > 0
                      ? `Your attendance safely satisfies UGC norms with a compliance cushion of ${bufferLectures} lecture${bufferLectures > 1 ? 's' : ''} while maintaining at least 75% attendance for examination hall ticket eligibility.`
                      : 'You are right at the 75% threshold! Missing the next class will put you into attendance shortage.'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Attendance Shortage: Attend Next {classesNeeded} Lectures</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    You must attend the next <strong>{classesNeeded}</strong> consecutive class{classesNeeded > 1 ? 'es' : ''} without any absence to recover to 75% exam clearance eligibility.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 text-right">
              <button
                onClick={() => onNavigate('attendance')}
                className="text-xs font-bold text-red-700 dark:text-red-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Full Attendance Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}