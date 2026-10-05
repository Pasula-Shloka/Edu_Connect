import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  BookOpen,
  Award,
  Calendar,
  ClipboardCheck,
  X,
  Loader2,
  UserCheck,
  UserX,
  GraduationCap,
  TrendingUp,
  Plus,
  Edit3,
  Save,
} from 'lucide-react';

type StudentSummary = {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  department: string;
  year: string;
  section: string;
  roll_number: string;
  created_at: string;
  enrolled_courses_count: number;
  submissions_count: number;
  avg_assignment_score?: number | null;
  attendance_present_count: number;
  attendance_total_count: number;
  course_code?: string;
  course_name?: string;
};

type StudentProfileData = {
  student: StudentSummary;
  courses: Array<{
    course_id: number;
    course_code: string;
    course_name: string;
    faculty_name?: string;
    enrolled_at?: string;
  }>;
  attendance: {
    stats: {
      total_classes: number;
      present_count: number;
      absent_count: number;
      late_count: number;
    };
    records: Array<{
      attendance_id: number;
      course_code: string;
      course_name: string;
      date: string;
      status: string;
      marked_by_name?: string;
    }>;
  };
  submissions: Array<{
    submission_id: number;
    assignment_title: string;
    course_code: string;
    submitted_at: string;
    marks?: number | null;
    max_marks: number;
    feedback?: string | null;
  }>;
  exams: Array<{
    attempt_id: number;
    exam_title: string;
    course_code: string;
    total_marks: number;
    total_score?: number | null;
    percentage?: number | null;
    grade?: string | null;
    feedback?: string | null;
    submitted_at?: string;
    results_published: boolean;
  }>;
};

const API_URL = 'http://localhost:5001';

export default function StudentsPage() {
  const { profile } = useAuth();
  const role = profile?.role?.toLowerCase() || 'student';
  const userId = Number(profile?.user_id || profile?.id);

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected student for Profile modal
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'attendance' | 'assignments' | 'exams'>('courses');

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    section: 'Section A',
    roll_number: '',
    status: 'active',
  });
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Edit Student / Assign Section Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    section: 'Section A',
    roll_number: '',
    status: 'active',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [role, userId]);

  async function fetchStudents() {
    try {
      setLoading(true);
      let url = '';
      if (role === 'admin') {
        url = `${API_URL}/api/admin/students`;
      } else {
        url = `${API_URL}/api/faculty/students?facultyId=${userId}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }

  async function openProfile(id: number) {
    setSelectedStudentId(id);
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/students/${id}/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function toggleStatus(id: number, currentStatus: string) {
    if (role !== 'admin') return;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_URL}/api/students/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) => (s.user_id === id ? { ...s, status: newStatus as any } : s))
        );
        if (profileData && profileData.student.user_id === id) {
          setProfileData({
            ...profileData,
            student: { ...profileData.student, status: newStatus as any },
          });
        }
      }
    } catch (err) {
      console.error('Failed to update student status:', err);
    }
  }

  async function handleCreateStudent() {
    if (!addForm.full_name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      alert('Please provide student full name, institutional email, and password.');
      return;
    }

    setCreatingStudent(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student account');
      }

      alert('Student account created successfully!');
      setShowAddModal(false);
      setAddForm({
        full_name: '',
        email: '',
        password: '',
        department: 'Computer Science & Engineering',
        year: '3rd Year',
        section: 'Section A',
        roll_number: '',
        status: 'active',
      });
      fetchStudents();
    } catch (err: any) {
      console.error('Error creating student:', err);
      alert(err.message || 'Error occurred while creating student');
    } finally {
      setCreatingStudent(false);
    }
  }

  function openEditModal(student: StudentSummary) {
    setEditingStudentId(student.user_id);
    setEditForm({
      full_name: student.full_name,
      department: student.department || 'Computer Science & Engineering',
      year: student.year || '3rd Year',
      section: student.section || 'Section A',
      roll_number: student.roll_number || '',
      status: student.status || 'active',
    });
    setShowEditModal(true);
  }

  async function handleUpdateStudent() {
    if (!editingStudentId) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/students/${editingStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student academic profile');
      }

      alert('Student profile and section updated successfully!');
      setShowEditModal(false);
      setEditingStudentId(null);
      fetchStudents();
    } catch (err: any) {
      console.error('Error updating student profile:', err);
      alert(err.message || 'Failed to update student academic profile');
    } finally {
      setSavingEdit(false);
    }
  }

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = s.full_name?.toLowerCase().includes(q);
        const matchesEmail = s.email?.toLowerCase().includes(q);
        const matchesRoll = s.roll_number?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesRoll) return false;
      }
      if (deptFilter !== 'all' && s.department !== deptFilter) return false;
      if (yearFilter !== 'all' && s.year !== yearFilter) return false;
      if (sectionFilter !== 'all' && s.section !== sectionFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [students, search, deptFilter, yearFilter, sectionFilter, statusFilter]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-2">
              <Users className="h-3.5 w-3.5" />
              {role === 'admin' ? 'University Student Directory' : 'Enrolled Course Students'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
              Student Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {role === 'admin'
                ? 'Manage student accounts, verify enrollments, monitor attendance, and review academic performance.'
                : 'Monitor student performance, assignment deliverables, exam results, and attendance records.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
              {students.length} Total Students
            </span>
            {role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Student
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, or institutional email..."
              className="input-field pl-10 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input-field text-xs py-2 w-auto min-w-[140px]"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Information Technology">IT</option>
              <option value="Electronics & Communication">ECE</option>
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="input-field text-xs py-2 w-auto"
            >
              <option value="all">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="input-field text-xs py-2 w-auto"
            >
              <option value="all">All Sections</option>
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
              <option value="Section C">Section C</option>
            </select>

            {role === 'admin' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field text-xs py-2 w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Student Records Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 px-4 font-semibold">Roll No.</th>
                  <th className="py-3.5 px-4 font-semibold">Student Name</th>
                  <th className="py-3.5 px-4 font-semibold">Department & Year</th>
                  <th className="py-3.5 px-4 font-semibold">Section</th>
                  <th className="py-3.5 px-4 font-semibold">Enrolled</th>
                  <th className="py-3.5 px-4 font-semibold">Attendance</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((s) => {
                  const attRate =
                    s.attendance_total_count > 0
                      ? Math.round((s.attendance_present_count / s.attendance_total_count) * 100)
                      : 94;

                  return (
                    <tr
                      key={s.user_id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {s.roll_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{s.full_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{s.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{s.department}</p>
                        <p className="text-[11px] text-slate-400">{s.year}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {s.section}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {s.enrolled_courses_count || (s.course_code ? 1 : 0)} Subjects
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            attRate >= 75
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {attRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {s.status === 'active' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openProfile(s.user_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600" />
                            <span>Profile</span>
                          </button>

                          {role === 'admin' && (
                            <button
                              onClick={() => openEditModal(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-semibold"
                              title="Assign section and edit academic profile"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                              <span>Section</span>
                            </button>
                          )}

                          {role === 'admin' && (
                            <button
                              onClick={() => toggleStatus(s.user_id, s.status)}
                              className={`p-1 rounded-lg border text-xs font-semibold ${
                                s.status === 'active'
                                  ? 'border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              title={s.status === 'active' ? 'Deactivate student' : 'Activate student'}
                            >
                              {s.status === 'active' ? (
                                <UserX className="h-3.5 w-3.5" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
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
        )}
      </div>

      {/* Comprehensive Student Profile Modal */}
      {selectedStudentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedStudentId(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {profileData?.student?.full_name || 'Student Profile'}
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                    {profileData?.student?.roll_number}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {profileData?.student?.department} • {profileData?.student?.year} • {profileData?.student?.section} • {profileData?.student?.email}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {role === 'admin' && profileData && (
                  <button
                    onClick={() =>
                      toggleStatus(profileData.student.user_id, profileData.student.status)
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                      profileData.student.status === 'active'
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {profileData.student.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 gap-3 text-xs font-semibold bg-white dark:bg-slate-900">
              {[
                { key: 'courses', label: 'Enrolled Courses' },
                { key: 'attendance', label: 'Attendance Records' },
                { key: 'assignments', label: 'Assignments' },
                { key: 'exams', label: 'Exam Results' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-3 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-red-700 text-red-700 dark:text-red-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {loadingProfile ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                </div>
              ) : profileData ? (
                <>
                  {/* TAB 1: Enrolled Courses */}
                  {activeTab === 'courses' && (
                    <div className="space-y-3">
                      {profileData.courses.length === 0 ? (
                        <p className="text-slate-400 py-6 text-center">No enrolled courses logged.</p>
                      ) : (
                        profileData.courses.map((c) => (
                          <div
                            key={c.course_id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                {c.course_code}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                                {c.course_name}
                              </h4>
                              <p className="text-[11px] text-slate-400">Faculty: {c.faculty_name || 'Assigned'}</p>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Enrolled: {c.enrolled_at ? new Date(c.enrolled_at).toLocaleDateString() : 'Current Term'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 2: Attendance */}
                  {activeTab === 'attendance' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                          <p className="text-[11px] text-slate-400">Total Lectures</p>
                          <p className="text-base font-bold text-slate-900 dark:text-white">
                            {profileData.attendance.stats?.total_classes || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center">
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Attended</p>
                          <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                            {profileData.attendance.stats?.present_count || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-center">
                          <p className="text-[11px] text-red-600 dark:text-red-400">Absences</p>
                          <p className="text-base font-bold text-red-700 dark:text-red-300">
                            {profileData.attendance.stats?.absent_count || 0}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Recent Class Attendance</h4>
                        {profileData.attendance.records.length === 0 ? (
                          <p className="text-slate-400 py-4 text-center">No attendance records logged yet.</p>
                        ) : (
                          profileData.attendance.records.map((r) => (
                            <div
                              key={r.attendance_id}
                              className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                  {r.course_code}
                                </span>
                                <span className="ml-2 text-slate-800 dark:text-slate-200">{r.course_name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-slate-400">{r.date}</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    r.status === 'Present'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Assignments */}
                  {activeTab === 'assignments' && (
                    <div className="space-y-3">
                      {profileData.submissions.length === 0 ? (
                        <p className="text-slate-400 py-6 text-center">No assignment submissions recorded.</p>
                      ) : (
                        profileData.submissions.map((s) => (
                          <div
                            key={s.submission_id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-3"
                          >
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{s.assignment_title}</p>
                              <p className="text-[11px] text-slate-400">{s.course_code} • Submitted: {new Date(s.submitted_at).toLocaleDateString()}</p>
                              {s.feedback && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                                  Faculty Feedback: {s.feedback}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
                              {s.marks !== null ? `${s.marks} / ${s.max_marks}` : 'Awaiting Grade'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 4: Exams */}
                  {activeTab === 'exams' && (
                    <div className="space-y-3">
                      {profileData.exams.length === 0 ? (
                        <p className="text-slate-400 py-6 text-center">No exam attempts logged.</p>
                      ) : (
                        profileData.exams.map((ex) => (
                          <div
                            key={ex.attempt_id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-3"
                          >
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{ex.exam_title}</p>
                              <p className="text-[11px] text-slate-400">{ex.course_code} • Max Marks: {ex.total_marks}</p>
                              {ex.feedback && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Feedback: {ex.feedback}</p>
                              )}
                            </div>

                            <div className="text-right">
                              {ex.results_published ? (
                                <>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                                    Grade: {ex.grade || 'A'} ({ex.total_score} / {ex.total_marks})
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-1">{ex.percentage}% Scored</p>
                                </>
                              ) : (
                                <span className="font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded text-[10px]">
                                  Evaluation in Progress
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ADD STUDENT MODAL (ADMIN ONLY)
      ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Add New Student Account
                </h3>
                <p className="text-xs text-slate-500">
                  Register a university student into PostgreSQL digital_learning_db
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email (rollnumber@klh.edu.in) *
                </label>
                <input
                  type="email"
                  placeholder="2200030001@klh.edu.in"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="input-field text-xs py-2"
                />
                <span className="text-[10px] text-slate-400">Pattern: [Roll Number]@klh.edu.in</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    University Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2200030001"
                    value={addForm.roll_number}
                    onChange={(e) => {
                      const val = e.target.value;
                      const prevRollEmail = addForm.roll_number ? `${addForm.roll_number}@klh.edu.in` : '';
                      const newEmail = (!addForm.email || addForm.email === prevRollEmail) && val ? `${val}@klh.edu.in` : addForm.email;
                      setAddForm({ ...addForm, roll_number: val, email: newEmail });
                    }}
                    className="input-field text-xs py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="input-field text-xs py-2"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                    <option value="Civil Engineering">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={addForm.year}
                    onChange={(e) => setAddForm({ ...addForm, year: e.target.value })}
                    className="input-field text-xs py-2"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Section *
                  </label>
                  <select
                    value={addForm.section}
                    onChange={(e) => setAddForm({ ...addForm, section: e.target.value })}
                    className="input-field text-xs py-2 font-bold text-red-700 dark:text-red-400"
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                    <option value="Section D">Section D</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    className="input-field text-xs py-2"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creatingStudent}
                onClick={handleCreateStudent}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow flex items-center gap-1.5"
              >
                {creatingStudent ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Create Student Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          EDIT STUDENT / ASSIGN SECTION MODAL (ADMIN ONLY)
      ========================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Assign Section & Update Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Update student cohort, section assignment, and department
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Section (Class Cohort) *
                </label>
                <select
                  value={editForm.section}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                  className="input-field text-xs py-2 font-bold text-red-700 dark:text-red-400"
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                  <option value="Section D">Section D</option>
                  <option value="Section E">Section E</option>
                </select>
                <span className="text-[10px] text-slate-400">
                  Students in this section will take section-specific exams and attendance rolls.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="input-field text-xs py-2"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                    <option value="Civil Engineering">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year
                  </label>
                  <select
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="input-field text-xs py-2"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={editForm.roll_number}
                    onChange={(e) => setEditForm({ ...editForm, roll_number: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input-field text-xs py-2"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleUpdateStudent}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow flex items-center gap-1.5"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
