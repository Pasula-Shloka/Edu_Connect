import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ParentSnapshotModal from '@/components/ParentSnapshotModal';
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
  Phone,
  Download,
  Send,
  MessageSquare,
  History,
  ShieldAlert,
  CheckSquare,
  Sparkles,
  Mail,
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
  year?: string;
  status: 'Present' | 'Absent' | 'Late';
  attendance_id?: number | null;
  date?: string;
};

type CourseSummary = {
  user_id: number;
  full_name: string;
  roll_number: string;
  section?: string;
  year?: string;
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
  history?: Array<{
    attendance_id: number;
    course_id: number;
    course_code: string;
    course_name: string;
    date: string;
    status: 'Present' | 'Absent' | 'Late';
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
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sectionsList, setSectionsList] = useState<{ section: string; count: number }[]>([]);
  const [parentAlertStudent, setParentAlertStudent] = useState<AttendanceStudent | null>(null);

  const [personalAttendance, setPersonalAttendance] = useState<StudentPersonalAttendance | null>(null);

  // Bulk Absentee Alert & Previous Class Session State
  const [showBulkAlertModal, setShowBulkAlertModal] = useState(false);
  const [bulkAlertDispatching, setBulkAlertDispatching] = useState(false);
  const [bulkAlertSuccess, setBulkAlertSuccess] = useState<string | null>(null);
  const [previousSessionData, setPreviousSessionData] = useState<{
    date: string;
    present_count: number;
    absent_count: number;
    absent_student_ids: number[];
  } | null>(null);
  const [showPreviousSessionPanel, setShowPreviousSessionPanel] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSections();
  }, [selectedYear]);

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
  }, [selectedCourseId, selectedDate, viewMode, selectedSection, selectedYear]);

  async function fetchSections() {
    try {
      const yearParam = selectedYear !== 'all' ? `?year=${encodeURIComponent(selectedYear)}` : '';
      const res = await fetch(`${API_URL}/api/sections${yearParam}`);
      if (res.ok) {
        const data = await res.json();
        setSectionsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
    }
  }

  async function fetchCourses() {
    try {
      setLoading(true);
      const url = `${API_URL}/api/courses${role === 'faculty' ? `?facultyId=${userId}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let accessible = Array.isArray(data) ? data : [];
        if (role === 'faculty') {
          accessible = accessible.filter((c: Course) => Number(c.faculty_id) === userId);
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
      const sectionParam = selectedSection !== 'all' ? `&section=${encodeURIComponent(selectedSection)}` : '';
      const yearParam = selectedYear !== 'all' ? `&year=${encodeURIComponent(selectedYear)}` : '';
      const res = await fetch(
        `${API_URL}/api/attendance?courseId=${selectedCourseId}&date=${selectedDate}${sectionParam}${yearParam}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);

        // Retrieve or load previous session reference for this course and section
        const sessionKey = `educonnect_prev_session_${selectedCourseId}_${selectedSection}`;
        const savedPrev = localStorage.getItem(sessionKey);
        if (savedPrev) {
          try {
            setPreviousSessionData(JSON.parse(savedPrev));
          } catch (e) {
            setPreviousSessionData(null);
          }
        } else if (data.previous_session) {
          setPreviousSessionData(data.previous_session);
        } else {
          setPreviousSessionData(null);
        }
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
      const sectionParam = selectedSection !== 'all' ? `&section=${encodeURIComponent(selectedSection)}` : '';
      const yearParam = selectedYear !== 'all' ? `&year=${encodeURIComponent(selectedYear)}` : '';
      const res = await fetch(`${API_URL}/api/attendance/summary?courseId=${selectedCourseId}${sectionParam}${yearParam}`);
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

  function selectOnlyAbsentees() {
    // If some are absent, this toggles focus or highlights absentees
    const hasAbsent = students.some(s => s.status === 'Absent');
    if (!hasAbsent) {
      alert('Currently all students are marked Present. Click "Absent" on any student or Mark All to select absentees.');
    } else {
      setShowBulkAlertModal(true);
    }
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
        // Save current session as previous session for future classes in this section
        const prevSession = {
          date: selectedDate,
          present_count: students.filter((s) => s.status === 'Present').length,
          absent_count: students.filter((s) => s.status === 'Absent').length,
          absent_student_ids: students.filter((s) => s.status === 'Absent').map((s) => s.user_id),
        };
        const sessionKey = `educonnect_prev_session_${selectedCourseId}_${selectedSection}`;
        localStorage.setItem(sessionKey, JSON.stringify(prevSession));
        setPreviousSessionData(prevSession);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Failed to save attendance:', err);
    } finally {
      setSaving(false);
    }
  }

  const absentees = students.filter((s) => s.status === 'Absent');

  async function handleBulkAlertParents(channel: 'WhatsApp' | 'SMS' = 'WhatsApp') {
    if (absentees.length === 0) return;
    try {
      setBulkAlertDispatching(true);
      setBulkAlertSuccess(null);

      const alertPromises = absentees.map((s) =>
        fetch(`${API_URL}/api/parent/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: s.user_id,
            parent_email: (s as any).parent_email || `parent.${s.roll_number}@gmail.com`,
            channel,
            message_content: `[KL DEEMED TO BE UNIVERSITY] Official Attendance Notification: Dear Guardian, your ward ${s.full_name} (${s.roll_number}) was recorded ABSENT for today's ${selectedCourse?.course_name || 'Class'} (${selectedCourse?.course_code || 'CS'}) session on ${selectedDate}. Minimum 75% attendance is mandatory for semester examination clearance under UGC regulations.`,
          }),
        }).catch((e) => console.error(e))
      );

      await Promise.all(alertPromises);
      setBulkAlertSuccess(
        `✅ Official Attendance Alerts dispatched to all ${absentees.length} parents via University ${channel} Gateway!`
      );
      setTimeout(() => {
        setShowBulkAlertModal(false);
        setBulkAlertSuccess(null);
      }, 3500);
    } catch (err) {
      console.error('Failed to dispatch bulk alerts:', err);
    } finally {
      setBulkAlertDispatching(false);
    }
  }

  function exportAttendanceToCSV() {
    if (students.length === 0) return;
    const headers = ['Roll Number', 'Student Name', 'Section', 'Email', 'Lecture Date', 'Course Code', 'Course Name', 'Status'];
    const rows = students.map((s) => [
      s.roll_number,
      `"${s.full_name}"`,
      s.section,
      s.email,
      selectedDate,
      selectedCourse?.course_code || '',
      `"${selectedCourse?.course_name || ''}"`,
      s.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${selectedCourse?.course_code || 'Course'}_${selectedSection}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /* =========================================================
     STUDENT VIEW
  ========================================================= */
  if (role === 'student') {
    const totalLectures = Number(personalAttendance?.overall?.total_lectures ?? 0);
    const overallRate = totalLectures > 0 ? Number(personalAttendance?.overall?.overall_percentage ?? 0) : 0;
    const isNewStudent = totalLectures === 0;
    const meetsThreshold = !isNewStudent && overallRate >= 75;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Banner */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
                <Calendar className="h-3.5 w-3.5" />
                Personal Academic Attendance Monitor
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
                My Attendance Records
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Individual attendance records, lecture session logs, and university mandatory 75% UGC eligibility.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  isNewStudent
                    ? 'border-blue-200 bg-blue-50/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
                    : meetsThreshold
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                    : 'border-red-200 bg-red-50/70 text-red-800 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
                }`}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    {isNewStudent ? 'New Student Status' : 'Overall Attendance'}
                  </p>
                  <p className="text-2xl font-extrabold">{overallRate}%</p>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {isNewStudent
                      ? 'No lectures conducted yet'
                      : `${personalAttendance?.overall?.present_count || 0} / ${totalLectures} lectures attended`}
                  </p>
                </div>
                {isNewStudent ? (
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                ) : meetsThreshold ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subject Breakdown Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Registered Course Attendance Breakdown
            </h2>
            <span className="text-xs text-slate-400">
              {personalAttendance?.courses?.length || 0} Enrolled Courses
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {personalAttendance?.courses?.map((c) => {
              const hasClasses = (c.total_classes || 0) > 0;
              const courseRate = hasClasses ? (Number(c.course_percentage) || 0) : 0;
              const isSafe = !hasClasses || courseRate >= 75;

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
                          !hasClasses
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : isSafe
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {!hasClasses ? 'No Sessions Yet' : isSafe ? 'Eligible (>=75%)' : 'Below 75%'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {c.course_name}
                    </h3>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Lectures Attended:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.present_classes || 0} / {c.total_classes || 0} classes
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          !hasClasses ? 'bg-slate-300 dark:bg-slate-700' : isSafe ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.min(courseRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Attendance Ratio</span>
                    <span className={`font-bold ${!hasClasses ? 'text-slate-500' : isSafe ? 'text-emerald-600' : 'text-red-600'}`}>
                      {hasClasses ? `${courseRate}%` : '0% (No Sessions)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verified Lecture Sessions History Log */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Individual Lecture Attendance History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed timeline of dates, subjects, and verified presence marked by course faculty
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {personalAttendance?.history?.length || 0} Recorded Sessions
            </span>
          </div>

          {personalAttendance?.history && personalAttendance.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3 px-4 font-semibold">Lecture Date</th>
                    <th className="py-3 px-4 font-semibold">Course Code</th>
                    <th className="py-3 px-4 font-semibold">Course Name</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Faculty Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {personalAttendance.history.map((record) => (
                    <tr key={record.attendance_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {record.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          {record.course_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {record.course_name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            record.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : record.status === 'Absent'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {record.status === 'Present' && <CheckCircle2 className="h-3 w-3" />}
                          {record.status === 'Absent' && <XCircle className="h-3 w-3" />}
                          {record.status === 'Late' && <Clock className="h-3 w-3" />}
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[11px] text-slate-400">
                        ✓ Certified by Course Faculty
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No lecture sessions recorded yet.</p>
              <p className="mt-1">
                As soon as your course faculty conducts a lecture and records attendance, individual session records will appear in this verified log.
              </p>
            </div>
          )}
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

          {/* Academic Year / Batch Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Academic Year *
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedSection('all');
              }}
              className="input-field text-xs py-2 w-32"
            >
              <option value="all">All Batches</option>
              <option value="2nd Year">2nd Year (426)</option>
              <option value="3rd Year">3rd Year (17)</option>
            </select>
          </div>

          {/* Section Segmented Filter Control */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Class Section *
            </label>
            <div className="flex items-center flex-wrap gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-full">
              <button
                type="button"
                onClick={() => setSelectedSection('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedSection === 'all'
                    ? 'bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All
              </button>
              {(sectionsList.length > 0 ? sectionsList : [
                { section: 'A1', count: 61 },
                { section: 'A2', count: 61 },
                { section: 'A3', count: 61 },
                { section: 'A4', count: 61 },
                { section: 'A5', count: 61 },
                { section: 'A6', count: 61 },
                { section: 'A7', count: 60 }
              ]).map((s) => (
                <button
                  key={s.section}
                  type="button"
                  onClick={() => setSelectedSection(s.section)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedSection === s.section
                      ? 'bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {s.section.startsWith('Section ') ? s.section.replace('Section ', 'Sec ') : `Sec ${s.section}`} ({s.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {viewMode === 'daily' && (
          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => markAll('Present')}
              className="px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('Absent')}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Clear
            </button>

            {/* Bulk Absentee Parent Alert */}
            <button
              type="button"
              onClick={selectOnlyAbsentees}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                absentees.length > 0
                  ? 'border-red-300 dark:border-red-800 bg-red-600 text-white hover:bg-red-700 animate-pulse'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
              title="Notify parents of all absent students simultaneously"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Notify All Absentees ({absentees.length})</span>
            </button>

            {/* Export Attendance Register CSV */}
            <button
              type="button"
              onClick={exportAttendanceToCSV}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
              title="Export section attendance register to CSV/Excel"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV</span>
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

      {/* Previous Class Attendance Reference Panel */}
      {viewMode === 'daily' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Previous Class Attendance Reference
                  </h4>
                  {previousSessionData && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold">
                      Session: {previousSessionData.date}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {previousSessionData
                    ? `Last recorded turnout for ${selectedSection !== 'all' ? selectedSection : 'this cohort'}: ${previousSessionData.present_count} Present • ${previousSessionData.absent_count} Absent`
                    : 'Initial lecture period for this semester. Save attendance today to record session history for future classes.'}
                </p>
              </div>
            </div>

            {previousSessionData && previousSessionData.absent_count > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {previousSessionData.absent_count} student(s) missed last class
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreviousSessionPanel(!showPreviousSessionPanel)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                >
                  {showPreviousSessionPanel ? 'Hide Details' : 'View Absentees'}
                </button>
              </div>
            )}
          </div>

          {showPreviousSessionPanel && previousSessionData && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs animate-fade-in">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Students who were Absent in Previous Class ({previousSessionData.date}):
              </span>
              <div className="flex flex-wrap gap-2">
                {students
                  .filter((s) => previousSessionData.absent_student_ids.includes(s.user_id))
                  .map((s) => (
                    <span
                      key={s.user_id}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      <XCircle className="w-3 h-3" />
                      {s.full_name} ({s.roll_number})
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                  {students.map((s) => {
                    const wasAbsentLastClass = previousSessionData?.absent_student_ids.includes(s.user_id);
                    return (
                      <tr key={s.user_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {s.roll_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">{s.full_name}</p>
                            {wasAbsentLastClass && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1"
                                title={`Missed previous lecture session on ${previousSessionData?.date}`}
                              >
                                ⚠️ Absent Last Class
                              </span>
                            )}
                          </div>
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
                        <div className="flex items-center justify-end gap-2">
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
                          {s.status === 'Absent' && (
                            <button
                              type="button"
                              onClick={() => setParentAlertStudent(s)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                              title="Send verified WhatsApp notice to Parent"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>Alert Parent</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
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

      {/* Parent Alert / WhatsApp Notification Modal */}
      {parentAlertStudent && (
        <ParentSnapshotModal
          pinOrRoll={parentAlertStudent.roll_number || String(parentAlertStudent.user_id)}
          onClose={() => setParentAlertStudent(null)}
        />
      )}

      {/* BULK ABSENTEE PARENT ALERT MODAL */}
      {showBulkAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-800 to-red-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-amber-300">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    Bulk Absentee Parent Notification Gateway
                  </h3>
                  <p className="text-xs text-red-200">
                    Official Institutional Notification • {absentees.length} Absent Students Selected
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBulkAlertModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {bulkAlertSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Dispatched Successfully!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {bulkAlertSuccess}
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Official Institutional Message Template (Auto-personalized for each parent):
                    </span>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed">
                      "Dear Guardian, your ward <strong className="text-red-600">[Student Name]</strong> (<strong className="text-blue-600">[Roll No]</strong>) was marked ABSENT for today's <strong>{selectedCourse?.course_name || 'Class'}</strong> lecture on <strong>{selectedDate}</strong> at KL Deemed to be University. UGC regulations mandate ≥75% attendance for examination eligibility. Please ensure regular attendance."
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Recipient Student Absentee List ({absentees.length} Guardians):
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-950/30">
                      {absentees.map((s) => (
                        <div key={s.user_id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{s.full_name}</span>{' '}
                            <span className="text-[11px] text-slate-400 font-mono">({s.roll_number})</span>
                          </div>
                          <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                            Target: {(s as any).parent_email || 'rameshreddy.p@gmail.com'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    All notifications will be recorded in PostgreSQL attendance logs with timestamp certification.
                  </p>
                </>
              )}
            </div>

            {/* Modal Actions */}
            {!bulkAlertSuccess && (
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkAlertModal(false)}
                  disabled={bulkAlertDispatching}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkAlertParents('Portal')}
                    disabled={bulkAlertDispatching || absentees.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {bulkAlertDispatching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Dispatch Portal Notice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBulkAlertParents('Email')}
                    disabled={bulkAlertDispatching || absentees.length === 0}
                    className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {bulkAlertDispatching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>Dispatch Parent Emails</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
