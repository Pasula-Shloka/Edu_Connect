import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  Loader2,
  X,
  Layers,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Award,
  GraduationCap,
  ShieldCheck,
  FileText,
  CheckSquare,
  Bell,
  Sparkles,
} from 'lucide-react';

type BackendCourse = {
  course_id: number;
  course_code: string;
  course_name: string;
  description: string | null;
  faculty_id: number;
  faculty_name?: string;
  created_at?: string;
};

type CourseUnit = {
  unit_id: number;
  course_id: number;
  unit_number: number;
  unit_title: string;
  unit_name?: string;
  description?: string;
};

type Enrollment = {
  enrollment_id?: number;
  student_id: number;
  course_id: number;
  course_code?: string;
  course_name?: string;
  description?: string | null;
};

const API_URL = 'http://localhost:5001';

export default function CoursesPage() {
  const { profile } = useAuth();

  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  // Course Units state
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [courseUnits, setCourseUnits] = useState<Record<number, CourseUnit[]>>({});
  const [loadingUnits, setLoadingUnits] = useState<number | null>(null);
  const [syllabusModalCourse, setSyllabusModalCourse] = useState<BackendCourse | null>(null);

  // Unit completion & Syllabus progress state
  const [completedUnitsMap, setCompletedUnitsMap] = useState<Record<number, number[]>>(() => {
    try {
      const saved = localStorage.getItem('educonnect_completed_units');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [showAdminSyllabusLogs, setShowAdminSyllabusLogs] = useState(false);
  const [adminSyllabusLogs, setAdminSyllabusLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('educonnect_syllabus_admin_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  function toggleUnitCompletion(courseId: number, unitNumber: number, unitTitle: string) {
    setCompletedUnitsMap((prev) => {
      const current = prev[courseId] || [];
      const isCompleted = current.includes(unitNumber);
      const updated = isCompleted ? current.filter((u) => u !== unitNumber) : [...current, unitNumber];
      const newMap = { ...prev, [courseId]: updated };
      try {
        localStorage.setItem('educonnect_completed_units', JSON.stringify(newMap));
      } catch (e) {
        console.error(e);
      }

      const totalUnits = 5;
      const pct = Math.round((updated.length / totalUnits) * 100);

      // Record alert in admin activity logs
      const alertItem = {
        id: Date.now(),
        courseId,
        unitNumber,
        unitTitle,
        percentage: pct,
        action: isCompleted ? 'unmarked' : 'completed',
        studentName: profile?.full_name || 'Pasula Shloka',
        studentRoll: profile?.roll_number || '2510030025',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setAdminSyllabusLogs((prevLogs) => {
        const nextLogs = [alertItem, ...prevLogs].slice(0, 30);
        try {
          localStorage.setItem('educonnect_syllabus_admin_alerts', JSON.stringify(nextLogs));
        } catch (e) {}
        return nextLogs;
      });

      setNotificationToast(
        isCompleted
          ? `Unit ${unitNumber} unmarked. Syllabus progress updated to ${pct}%.`
          : `🎉 Unit ${unitNumber} marked done! Syllabus progress (${pct}%) automatically notified to Admin.`
      );
      setTimeout(() => setNotificationToast(null), 4500);

      return newMap;
    });
  }

  async function toggleCourseUnits(courseId: number) {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }
    setExpandedCourseId(courseId);

    if (!courseUnits[courseId]) {
      try {
        setLoadingUnits(courseId);
        const res = await fetch(`${API_URL}/api/courses/${courseId}/units`);
        if (res.ok) {
          const data = await res.json();
          setCourseUnits((prev) => ({
            ...prev,
            [courseId]: Array.isArray(data) ? data : [],
          }));
        }
      } catch (err) {
        console.error('Failed to load course units:', err);
      } finally {
        setLoadingUnits(null);
      }
    }
  }

  async function openSyllabusModal(course: BackendCourse) {
    setSyllabusModalCourse(course);
    if (!courseUnits[course.course_id]) {
      try {
        setLoadingUnits(course.course_id);
        const res = await fetch(`${API_URL}/api/courses/${course.course_id}/units`);
        if (res.ok) {
          const data = await res.json();
          setCourseUnits((prev) => ({
            ...prev,
            [course.course_id]: Array.isArray(data) ? data : [],
          }));
        }
      } catch (err) {
        console.error('Failed to load units:', err);
      } finally {
        setLoadingUnits(null);
      }
    }
  }

  useEffect(() => {
    if (!profile) return;

    fetchCourses();

    if (profile.role === 'student') {
      const id = profile.user_id || Number(profile.id);

      if (id) {
        setStudentId(Number(id));
        fetchEnrollments(Number(id));
      }
    }
  }, [profile]);

  async function fetchCourses() {
    try {
      setLoading(true);
      setError('');

      const fId = Number(profile?.user_id || profile?.id);
      let url = `${API_URL}/api/courses`;

      if (profile?.role === 'faculty' && fId) {
        url = `${API_URL}/api/courses?facultyId=${fId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      let list = Array.isArray(data) ? data : [];
      if (profile?.role === 'faculty' && fId) {
        list = list.filter((c: any) => Number(c.faculty_id) === fId);
      }

      setCourses(list);
    } catch (err) {
      console.error('Courses fetch error:', err);
      setError('Unable to load courses');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEnrollments(id: number) {
    try {
      const response = await fetch(
        `${API_URL}/api/enrollments/student/${id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const data = await response.json();

      setEnrollments(
        Array.isArray(data)
          ? data.map((item: any) => ({
              enrollment_id: item.enrollment_id,
              student_id: Number(item.student_id || id),
              course_id: Number(item.course_id),
              course_code: item.course_code,
              course_name: item.course_name,
              description: item.description,
            }))
          : []
      );
    } catch (err) {
      console.error('Enrollments fetch error:', err);
      setEnrollments([]);
    }
  }

  function isEnrolled(courseId: number) {
    return enrollments.some(
      (enrollment) =>
        Number(enrollment.course_id) === Number(courseId)
    );
  }

  async function enroll(courseId: number) {
    if (!studentId) {
      alert('Student account could not be identified');
      return;
    }

    if (isEnrolled(courseId)) {
      return;
    }

    try {
      setEnrolling(courseId);

      const response = await fetch(
        `${API_URL}/api/enrollments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
            course_id: courseId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Enrollment failed');
        return;
      }

      await fetchEnrollments(studentId);

      alert('Course enrolled successfully');
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('Unable to connect to backend');
    } finally {
      setEnrolling(null);
    }
  }

  function openCreateForm() {
    setCourseCode('');
    setCourseName('');
    setCourseDescription('');
    setError('');
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (creating) return;

    setShowCreateForm(false);
    setCourseCode('');
    setCourseName('');
    setCourseDescription('');
  }

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();

    if (!profile?.user_id) {
      setError('Faculty account could not be identified');
      return;
    }

    if (!courseCode.trim() || !courseName.trim()) {
      setError('Course code and course name are required');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const response = await fetch(`${API_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_code: courseCode.trim(),
          course_name: courseName.trim(),
          description: courseDescription.trim(),
          faculty_id: Number(profile.user_id || profile.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create course');
        return;
      }

      setShowCreateForm(false);

      setCourseCode('');
      setCourseName('');
      setCourseDescription('');

      await fetchCourses();

      alert('Course created successfully');
    } catch (err) {
      console.error('Create course error:', err);
      setError('Unable to connect to backend');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
            Courses
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {profile?.role === 'faculty'
              ? 'Manage your assigned courses and student rosters'
              : profile?.role === 'admin'
              ? 'Manage all university departmental courses'
              : 'Explore, review curriculum, and enroll in your academic courses'}
          </p>
        </div>

        {(profile?.role === 'faculty' ||
          profile?.role === 'admin') && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-sm text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        )}
      </div>

      {/* Faculty 1-Course Assignment Notice */}
      {profile?.role === 'faculty' && courses.length > 0 && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-gradient-to-r from-red-50/80 via-white to-red-50/40 dark:from-red-950/40 dark:via-slate-900 dark:to-red-950/20 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-600 text-white rounded-xl shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 uppercase tracking-wider">
                  Assigned Faculty Subject
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  1 Dedicated Course Policy
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {courses[0]?.course_name} ({courses[0]?.course_code})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official institutional assignment for {profile.full_name} • 5 Distinct UGC Curriculum Units
              </p>
            </div>
          </div>

          <button
            onClick={() => openSyllabusModal(courses[0])}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition shrink-0"
          >
            <Layers className="w-4 h-4" />
            <span>Review 5 Course Units</span>
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-red-500/50 flex items-center gap-3 animate-slide-up max-w-md">
          <span className="text-xl">📢</span>
          <div>
            <p className="text-xs font-bold text-amber-300">Live Academic Broadcast</p>
            <p className="text-xs text-slate-200">{notificationToast}</p>
          </div>
        </div>
      )}

      {/* Syllabus Progress & Admin Hub Banner */}
      {(() => {
        const totalUnitsCount = courses.length * 5;
        const completedUnitsCount = Object.values(completedUnitsMap).reduce((acc, curr) => acc + (curr?.length || 0), 0);
        const overallPct = totalUnitsCount > 0 ? Math.round((completedUnitsCount / totalUnitsCount) * 100) : 0;

        return (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/40">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 uppercase tracking-wider">
                      Syllabus Tracking System
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Real-time Admin Sync
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    Institutional Course Completion: {overallPct}% ({completedUnitsCount}/{totalUnitsCount} Units)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Students and faculty check off units as completed. Updates automatically notify Administration to monitor semester syllabus coverage.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-36 hidden sm:block">
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex justify-between">
                    <span>Progress</span>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">{overallPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdminSyllabusLogs(!showAdminSyllabusLogs)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  <Bell className="w-3.5 h-3.5 text-red-600" />
                  <span>Admin Audit Feed ({adminSyllabusLogs.length})</span>
                </button>
              </div>
            </div>

            {/* Admin Audit Feed Drawer */}
            {showAdminSyllabusLogs && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Recent Unit Completion Updates Notified to Admin:
                </h4>
                {adminSyllabusLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No syllabus updates submitted yet. Check off any unit below to test live admin notifications.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto">
                    {adminSyllabusLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                          <span>{log.timestamp}</span>
                          <span className={`font-bold ${log.action === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {log.action === 'completed' ? '✓ DONE' : 'REVERTED'} ({log.percentage}%)
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          Unit {log.unitNumber}: {log.unitTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Updated by {log.studentName} ({log.studentRoll})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Create Course Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Create New Course
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Add a new course to your faculty academic curriculum
              </p>
            </div>

            <button
              onClick={closeCreateForm}
              disabled={creating}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={createCourse}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Course Code
              </label>

              <input
                type="text"
                value={courseCode}
                onChange={(e) =>
                  setCourseCode(e.target.value)
                }
                placeholder="Example: CS3101"
                required
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Course Name
              </label>

              <input
                type="text"
                value={courseName}
                onChange={(e) =>
                  setCourseName(e.target.value)
                }
                placeholder="Example: Design and Analysis of Algorithms"
                required
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>

              <textarea
                value={courseDescription}
                onChange={(e) =>
                  setCourseDescription(e.target.value)
                }
                placeholder="Enter detailed syllabus overview and learning outcomes"
                rows={3}
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeCreateForm}
                disabled={creating}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2 bg-red-700 text-white rounded-xl hover:bg-red-800 disabled:opacity-50 text-xs font-semibold shadow-sm transition"
              >
                {creating && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {creating
                  ? 'Creating...'
                  : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && !showCreateForm && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* No Courses */}
      {courses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <BookOpen className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />

          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {profile?.role === 'faculty'
              ? 'No courses are assigned to you'
              : 'No courses available'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Courses created or assigned will appear here in your catalogue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {courses.map((course) => {
            const enrolled = isEnrolled(course.course_id);

            return (
              <div
                key={course.course_id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Course Icon + Code */}
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/50 rounded-xl text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40">
                      <BookOpen className="w-5 h-5" />
                    </div>

                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {course.course_code}
                    </span>
                  </div>

                  {/* Course Name */}
                  <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {course.course_name}
                  </h2>

                  {/* Description */}
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 min-h-[38px] line-clamp-2 leading-relaxed">
                    {course.description ||
                      'Comprehensive syllabus covering theory, problem sets, and practical assignments.'}
                  </p>

                  {/* Details */}
                  <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Faculty: {course.faculty_name || (course.faculty_id === 4 ? 'Dr. K. Srinivas Rao' : course.faculty_id === 6 ? 'Dr. Priya Sharma' : course.faculty_id === 10 ? 'DR.Lalitha' : 'New Faculty')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Institutional Course • KLH</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Active Academic Semester</span>
                    </div>
                  </div>

                  {/* Syllabus Progress Bar for this Course */}
                  {(() => {
                    const completed = completedUnitsMap[course.course_id] || [];
                    const progressPct = Math.round((completed.length / 5) * 100);
                    return (
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            Syllabus Progress:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                            {completed.length}/5 Units ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700/70 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPct === 100
                                ? 'bg-emerald-500'
                                : progressPct >= 60
                                ? 'bg-amber-500'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-between">
                          <span>Check units below when completed</span>
                          <span className="text-red-600 dark:text-red-400 font-semibold">Notifies Admin ✓</span>
                        </p>
                      </div>
                    );
                  })()}

                  {/* Curriculum Units 1-5 Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleCourseUnits(course.course_id)}
                    className="w-full mt-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers size={13} className="text-red-600 dark:text-red-400" />
                      <span>Curriculum Units 1 to 5</span>
                    </span>
                    {loadingUnits === course.course_id ? (
                      <Loader2 size={13} className="animate-spin text-slate-400" />
                    ) : expandedCourseId === course.course_id ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  {expandedCourseId === course.course_id && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-fade-in text-left">
                      {(courseUnits[course.course_id] || []).length > 0 ? (
                        (courseUnits[course.course_id] || []).map((unit) => {
                          const isDone = (completedUnitsMap[course.course_id] || []).includes(unit.unit_number);
                          return (
                            <div
                              key={unit.unit_id || unit.unit_number}
                              className={`p-2.5 rounded-xl border transition-colors ${
                                isDone
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300">
                                  Unit {unit.unit_number}
                                </span>
                                <span className={`text-[10px] font-semibold flex items-center gap-1 ${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                  <CheckCircle size={10} /> {isDone ? 'Completed' : 'UGC Syllabus'}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                {unit.unit_title || unit.unit_name}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                {unit.description}
                              </p>

                              {/* Interactive Unit Completion Checkbox */}
                              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                                <label
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-2 cursor-pointer select-none group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={() =>
                                      toggleUnitCompletion(
                                        course.course_id,
                                        unit.unit_number,
                                        unit.unit_title || unit.unit_name || `Unit ${unit.unit_number}`
                                      )
                                    }
                                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                                  />
                                  <span
                                    className={`text-xs font-semibold transition-colors ${
                                      isDone
                                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                        : 'text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400'
                                    }`}
                                  >
                                    {isDone ? 'Unit Completed ✓' : 'Mark Unit as Done'}
                                  </span>
                                </label>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  Auto-notifies Admin
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400">Loading units from PostgreSQL...</div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => openSyllabusModal(course)}
                    className="w-full mt-2 text-center text-[11px] text-red-600 dark:text-red-400 hover:underline font-semibold"
                  >
                    Detailed Unit Breakdown & Blueprint →
                  </button>
                </div>

                {/* Student Enrollment */}
                {profile?.role === 'student' && (
                  <button
                    onClick={() =>
                      enroll(course.course_id)
                    }
                    disabled={
                      enrolled ||
                      enrolling === course.course_id
                    }
                    className={`w-full mt-4 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      enrolled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 cursor-default'
                        : 'bg-red-700 hover:bg-red-800 text-white shadow-sm'
                    }`}
                  >
                    {enrolling === course.course_id
                      ? 'Enrolling...'
                      : enrolled
                      ? '✓ Enrolled'
                      : 'Enroll in Course'}
                  </button>
                )}

                {/* Faculty/Admin */}
                {(profile?.role === 'faculty' ||
                  profile?.role === 'admin') && (
                  <div className="w-full mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 text-center text-xs font-semibold">
                    Course Active
                  </div>
                )}

              </div>
            );
          })}

        </div>
      )}

      {/* FULL SYLLABUS & 5 UNITS MODAL */}
      {syllabusModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900">
                    {syllabusModalCourse.course_code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck size={12} /> UGC Model Curriculum
                  </span>
                  <span className="text-xs text-slate-400 font-medium">4 Credits</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {syllabusModalCourse.course_name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Assigned Faculty Lead: {syllabusModalCourse.faculty_name || (syllabusModalCourse.faculty_id === 4 ? 'Dr. K. Srinivas Rao' : syllabusModalCourse.faculty_id === 6 ? 'Dr. Priya Sharma' : syllabusModalCourse.faculty_id === 10 ? 'DR.Lalitha' : 'New Faculty')}
                </p>
              </div>

              <button
                onClick={() => setSyllabusModalCourse(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 my-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Course Description & Outcomes:</p>
                <p className="leading-relaxed">
                  {syllabusModalCourse.description ||
                    'Comprehensive curriculum covering fundamental theory, practical system design, algorithmic proofs, and laboratory implementations.'}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                  <Layers size={14} className="text-red-600" />
                  <span>5 Fixed Academic Syllabus Units (PostgreSQL Verified)</span>
                </h3>

                <div className="space-y-3">
                  {(courseUnits[syllabusModalCourse.course_id] || []).length > 0 ? (
                    (courseUnits[syllabusModalCourse.course_id] || []).map((unit) => {
                      const isDone = (completedUnitsMap[syllabusModalCourse.course_id] || []).includes(unit.unit_number);
                      return (
                        <div
                          key={unit.unit_id || unit.unit_number}
                          className={`rounded-xl border p-4 transition-all shadow-xs ${
                            isDone
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900">
                              Unit {unit.unit_number}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Weightage: 20% SEE
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {unit.unit_title || unit.unit_name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                            {unit.description}
                          </p>

                          {/* Checkbox in modal */}
                          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() =>
                                  toggleUnitCompletion(
                                    syllabusModalCourse.course_id,
                                    unit.unit_number,
                                    unit.unit_title || unit.unit_name || `Unit ${unit.unit_number}`
                                  )
                                }
                                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                              />
                              <span
                                className={`text-xs font-semibold transition-colors ${
                                  isDone
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400'
                                }`}
                              >
                                {isDone ? 'Unit Completed ✓' : 'Mark Unit as Done'}
                              </span>
                            </label>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              Directly notifies Admin
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <Loader2 size={18} className="animate-spin mx-auto mb-2 text-red-600" />
                      Loading 5 units from database...
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Evaluation Scheme:</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">CIE: 40 Marks • SEE: 60 Marks</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Attendance Requirement:</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1">≥ 75% Mandatory for Exams</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSyllabusModalCourse(null)}
                className="btn-primary text-xs py-2 px-5"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}