import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  Loader2,
  X,
} from 'lucide-react';

type BackendCourse = {
  course_id: number;
  course_code: string;
  course_name: string;
  description: string | null;
  faculty_id: number;
  created_at?: string;
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

      let url = `${API_URL}/api/courses`;

      if (profile?.role === 'faculty' && profile.user_id) {
        url = `${API_URL}/api/courses?facultyId=${profile.user_id}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();

      setCourses(Array.isArray(data) ? data : []);
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
          faculty_id: Number(profile.user_id),
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
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Institutional Course • KLH</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Active Academic Semester</span>
                    </div>
                  </div>
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
    </div>
  );
}