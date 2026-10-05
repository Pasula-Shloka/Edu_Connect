import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Plus,
  BookOpen,
  Users,
  Award,
  Calendar,
  X,
  Loader2,
  UserCheck,
  UserX,
  FileText,
  TrendingUp,
} from 'lucide-react';

type FacultyMember = {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  department: string;
  created_at: string;
  courses_count: number;
  total_students_count: number;
  exams_conducted_count: number;
  assigned_courses: Array<{
    course_id: number;
    course_code: string;
    course_name: string;
  }>;
};

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  faculty_id?: number | null;
};

const API_URL = 'http://localhost:5001';

export default function FacultyPage() {
  const { profile } = useAuth();
  const role = profile?.role?.toLowerCase() || 'student';

  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Assign Course Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  // Add Faculty Modal State
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [addFacultyForm, setAddFacultyForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department: 'Computer Science & Engineering',
    assigned_course_id: '',
    status: 'active',
  });
  const [creatingFaculty, setCreatingFaculty] = useState(false);

  useEffect(() => {
    fetchFacultyData();
    fetchCourses();
  }, []);

  async function fetchFacultyData() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/faculty`);
      if (res.ok) {
        const data = await res.json();
        setFaculty(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load faculty:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourses() {
    try {
      const res = await fetch(`${API_URL}/api/courses`);
      if (res.ok) {
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  }

  async function toggleStatus(id: number, currentStatus: string) {
    if (role !== 'admin') return;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_URL}/api/faculty/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setFaculty((prev) =>
          prev.map((f) => (f.user_id === id ? { ...f, status: newStatus as any } : f))
        );
      }
    } catch (err) {
      console.error('Failed to toggle faculty status:', err);
    }
  }

  async function handleAssignCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFacultyId || !selectedCourseId) return;

    try {
      setAssigning(true);
      const res = await fetch(`${API_URL}/api/faculty/assign-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: Number(selectedCourseId),
          faculty_id: selectedFacultyId,
        }),
      });

      if (res.ok) {
        setShowAssignModal(false);
        setSelectedCourseId('');
        fetchFacultyData();
        fetchCourses();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to assign course');
      }
    } catch (err) {
      console.error('Course assignment failed:', err);
    } finally {
      setAssigning(false);
    }
  }

  async function handleCreateFaculty(e: React.FormEvent) {
    e.preventDefault();
    if (!addFacultyForm.full_name.trim() || !addFacultyForm.email.trim() || !addFacultyForm.password.trim()) {
      alert('Full Name, Email, and Password are required.');
      return;
    }

    setCreatingFaculty(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFacultyForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register faculty member');
      }

      alert('Faculty member registered successfully!');
      setShowAddFacultyModal(false);
      setAddFacultyForm({
        full_name: '',
        email: '',
        password: '',
        department: 'Computer Science & Engineering',
        assigned_course_id: '',
        status: 'active',
      });
      fetchFacultyData();
      fetchCourses();
    } catch (err: any) {
      console.error('Error creating faculty:', err);
      alert(err.message || 'Error occurred while creating faculty member');
    } finally {
      setCreatingFaculty(false);
    }
  }

  const filteredFaculty = useMemo(() => {
    return faculty.filter((f) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = f.full_name?.toLowerCase().includes(q);
        const matchesEmail = f.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }
      if (deptFilter !== 'all' && f.department !== deptFilter) return false;
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      return true;
    });
  }, [faculty, search, deptFilter, statusFilter]);

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
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
              <GraduationCap className="h-3.5 w-3.5" />
              University Faculty & Teaching Department
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
              Faculty Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Oversee academic faculty profiles, assign teaching curriculum, monitor classroom workloads, and manage access privileges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
              {faculty.length} Faculty Members
            </span>
            {role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowAddFacultyModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Faculty
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
              placeholder="Search faculty by professor name or institutional email..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-xs py-2 w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFaculty.map((f) => (
          <div
            key={f.user_id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div>
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  {f.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      f.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    }`}
                  >
                    {f.status === 'active' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {f.status}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                {f.full_name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{f.email}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                {f.department}
              </p>

              {/* Workload Metric Pills */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Courses</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {f.courses_count || 0}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Students</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {f.total_students_count || 0}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Exams</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {f.exams_conducted_count || 0}
                  </p>
                </div>
              </div>

              {/* Assigned Subjects */}
              <div className="mt-4 space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned Teaching Subjects:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {f.assigned_courses && f.assigned_courses.length > 0 ? (
                    f.assigned_courses.map((c) => (
                      <span
                        key={c.course_id}
                        className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50"
                      >
                        {c.course_code}: {c.course_name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No courses currently assigned.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setSelectedFacultyId(f.user_id);
                  setShowAssignModal(true);
                }}
                className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Assign Course</span>
              </button>

              <button
                onClick={() => toggleStatus(f.user_id, f.status)}
                className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-colors ${
                  f.status === 'active'
                    ? 'border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                {f.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Course Modal */}
      {showAssignModal && selectedFacultyId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Assign Teaching Course
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a curriculum course to assign to this faculty member
                </p>
              </div>

              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select University Course *
                </label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose course to assign</option>
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_code} — {c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedCourseId}
                  className="btn-primary"
                >
                  {assigning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm Assignment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          ADD FACULTY MODAL (ADMIN ONLY)
      ========================================================= */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Add Faculty Member
                </h3>
                <p className="text-xs text-slate-500">
                  Register university teaching staff and assign initial course
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFacultyModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ananya Sen"
                  value={addFacultyForm.full_name}
                  onChange={(e) => setAddFacultyForm({ ...addFacultyForm, full_name: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Institutional Email (fac[EmpID]@klh.edu.in) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="fac10342@klh.edu.in"
                  value={addFacultyForm.email}
                  onChange={(e) => setAddFacultyForm({ ...addFacultyForm, email: e.target.value })}
                  className="input-field text-xs py-2"
                />
                <span className="text-[10px] text-slate-400">Pattern: fac[EmpID]@klh.edu.in (e.g. fac10342@klh.edu.in)</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={addFacultyForm.password}
                  onChange={(e) => setAddFacultyForm({ ...addFacultyForm, password: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={addFacultyForm.department}
                  onChange={(e) => setAddFacultyForm({ ...addFacultyForm, department: e.target.value })}
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
                  Initial Course Allocation (Optional)
                </label>
                <select
                  value={addFacultyForm.assigned_course_id}
                  onChange={(e) => setAddFacultyForm({ ...addFacultyForm, assigned_course_id: e.target.value })}
                  className="input-field text-xs py-2"
                >
                  <option value="">None (assign later)</option>
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_code} - {c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFaculty}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow flex items-center gap-1.5"
                >
                  {creatingFaculty ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Register Faculty
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
