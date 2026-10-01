import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  BookOpen,
  Filter,
  Users,
  Award,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  faculty_id?: number;
};

type AttendanceStudent = {
  user_id: number;
  full_name: string;
  email: string;
  roll_number: string;
  section: string;
  status: 'Present' | 'Absent' | 'Late';
  attendance_id?: number | null;
  date?: string;
};

type CourseSummary = {
  user_id: number;
  full_name: string;
  roll_number: string;
  total_classes: number;
  present_classes: number;
  absent_classes: number;
  attendance_percentage: number;
};

type StudentPersonalAttendance = {
  overall: {
    total_lectures: number;
    present_count: number;
    absent_count: number;
    overall_percentage: number;
  };
  courses: Array<{
    course_id: number;
    course_code: string;
    course_name: string;
    total_classes: number;
    present_classes: number;
    course_percentage: number;
  }>;
};

const API_URL = 'http://localhost:5001';

export default function AttendancePage() {
  const { profile } = useAuth();
  const role = profile?.role?.toLowerCase() || 'student';
  const userId = Number(profile?.user_id || profile?.id);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [summaryList, setSummaryList] = useState<CourseSummary[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'summary'>('daily');

  const [personalAttendance, setPersonalAttendance] = useState<StudentPersonalAttendance | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (role === 'student') {
      fetchStudentAttendance();
    } else {
      fetchCourses();
    }
  }, [role, userId]);

  useEffect(() => {
    if (selectedCourseId && role !== 'student') {
      if (viewMode === 'daily') {
        fetchDailyAttendance();
      } else {
        fetchCourseSummary();
      }
    }
  }, [selectedCourseId, selectedDate, viewMode]);

  async function fetchCourses() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/courses`);
      if (res.ok) {
        const data = await res.json();
        let accessible = data;
        if (role === 'faculty') {
          accessible = data.filter((c: Course) => Number(c.faculty_id) === userId);
        }
        setCourses(accessible);
        if (accessible.length > 0) {
          setSelectedCourseId(String(accessible[0].course_id));
        }
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDailyAttendance() {
    if (!selectedCourseId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/api/attendance?courseId=${selectedCourseId}&date=${selectedDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourseSummary() {
    if (!selectedCourseId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/attendance/summary?courseId=${selectedCourseId}`);
      if (res.ok) {
        const data = await res.json();
        setSummaryList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load attendance summary:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudentAttendance() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/attendance/student/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPersonalAttendance(data);
      }
    } catch (err) {
      console.error('Failed to load personal attendance:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(studentId: number, newStatus: 'Present' | 'Absent' | 'Late') {
    setStudents((prev) =>
      prev.map((s) => (s.user_id === studentId ? { ...s, status: newStatus } : s))
    );
  }

  function markAll(status: 'Present' | 'Absent') {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  }

  async function saveAttendance() {
    if (!selectedCourseId || students.length === 0) return;
    try {
      setSaving(true);
      setSavedSuccess(false);

      const payload = {
        course_id: Number(selectedCourseId),
        date: selectedDate,
        marked_by: userId,
        records: students.map((s) => ({
          student_id: s.user_id,
          status: s.status,
        })),
      };

      const res = await fetch(`${API_URL}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save attendance:', err);
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     STUDENT VIEW
  ========================================================= */
  if (role === 'student') {
    const overallRate = personalAttendance?.overall?.overall_percentage ?? 92;
    const meetsThreshold = overallRate >= 75;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Banner */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
                <Calendar className="h-3.5 w-3.5" />
                Semester Lecture Attendance Monitor
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
                My Attendance Records
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Track your course lecture presence, university mandatory 75% eligibility, and subject records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  meetsThreshold
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                    : 'border-red-200 bg-red-50/70 text-red-800 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
                }`}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">Overall Attendance</p>
                  <p className="text-2xl font-extrabold">{overallRate}%</p>
                </div>
                {meetsThreshold ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subject Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {personalAttendance?.courses?.map((c) => {
            const courseRate = Number(c.course_percentage) || 100;
            const isSafe = courseRate >= 75;

            return (
              <div
                key={c.course_id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                      {c.course_code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isSafe
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      }`}
                    >
                      {isSafe ? 'Eligible' : 'Below 75%'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {c.course_name}
                  </h3>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Lectures Attended:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {c.present_classes || 0} / {c.total_classes || 0}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSafe ? 'bg-emerald-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(courseRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Attendance Ratio</span>
                  <span className={`font-bold ${isSafe ? 'text-emerald-600' : 'text-red-600'}`}>
                    {courseRate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* =========================================================
     FACULTY & ADMIN VIEW
  ========================================================= */
  const selectedCourse = courses.find((c) => String(c.course_id) === selectedCourseId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-2">
              <Calendar className="h-3.5 w-3.5" />
              Course Lecture Attendance Registry
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
              Academic Attendance Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select course lecture session, record student presence, and review semester eligibility.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                viewMode === 'daily'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Daily Register
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                viewMode === 'summary'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Course Summary
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Select Course & Date */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Academic Subject *
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="input-field text-xs py-2 w-64"
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code} - {c.course_name}
                </option>
              ))}
            </select>
          </div>

          {viewMode === 'daily' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Lecture Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field text-xs py-2 w-40"
              />
            </div>
          )}
        </div>

        {viewMode === 'daily' && (
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => markAll('Present')}
              className="px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('Absent')}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={saveAttendance}
              disabled={saving || students.length === 0}
              className="btn-primary py-2 px-4 text-xs"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Attendance</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Attendance records for {selectedCourse?.course_code} on {selectedDate} saved successfully!</span>
        </div>
      )}

      {/* Main Table: Daily or Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-red-600" />
          </div>
        ) : viewMode === 'daily' ? (
          /* DAILY REGISTER TABLE */
          students.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No students enrolled in this course yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3.5 px-4 font-semibold">Roll Number</th>
                    <th className="py-3.5 px-4 font-semibold">Student Name</th>
                    <th className="py-3.5 px-4 font-semibold">Section</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Status Selection</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Current State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((s) => (
                    <tr key={s.user_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {s.roll_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{s.full_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{s.email}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        {s.section}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {(['Present', 'Absent', 'Late'] as const).map((statusOption) => (
                            <button
                              key={statusOption}
                              type="button"
                              onClick={() => handleStatusChange(s.user_id, statusOption)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                s.status === statusOption
                                  ? statusOption === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : statusOption === 'Absent'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {statusOption}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            s.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : s.status === 'Absent'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* COURSE SUMMARY TABLE */
          summaryList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No attendance summary recorded for this course yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3.5 px-4 font-semibold">Roll Number</th>
                    <th className="py-3.5 px-4 font-semibold">Student Name</th>
                    <th className="py-3.5 px-4 font-semibold">Classes Attended</th>
                    <th className="py-3.5 px-4 font-semibold">Total Classes</th>
                    <th className="py-3.5 px-4 font-semibold">Attendance %</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Eligibility Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summaryList.map((sum) => {
                    const isEligible = (Number(sum.attendance_percentage) || 0) >= 75;
                    return (
                      <tr key={sum.user_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {sum.roll_number}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {sum.full_name}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                          {sum.present_classes} Attended
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {sum.total_classes} Conducted
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {sum.attendance_percentage || 0}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              isEligible
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {isEligible ? 'Exam Eligible' : 'Condonation Required'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
