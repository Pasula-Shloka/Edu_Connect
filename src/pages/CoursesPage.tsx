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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Courses
          </h1>

          <p className="text-gray-500">
            {profile?.role === 'faculty'
              ? 'Manage your assigned courses'
              : profile?.role === 'admin'
              ? 'Manage all courses'
              : 'Explore and enroll in your courses'}
          </p>
        </div>

        {(profile?.role === 'faculty' ||
          profile?.role === 'admin') && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        )}
      </div>

      {/* Create Course Form */}
      {showCreateForm && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">
                Create New Course
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Add a new course to your faculty account
              </p>
            </div>

            <button
              onClick={closeCreateForm}
              disabled={creating}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={createCourse}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Code
              </label>

              <input
                type="text"
                value={courseCode}
                onChange={(e) =>
                  setCourseCode(e.target.value)
                }
                placeholder="Example: CS102"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name
              </label>

              <input
                type="text"
                value={courseName}
                onChange={(e) =>
                  setCourseName(e.target.value)
                }
                placeholder="Example: Data Structures"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>

              <textarea
                value={courseDescription}
                onChange={(e) =>
                  setCourseDescription(e.target.value)
                }
                placeholder="Enter course description"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateForm}
                disabled={creating}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* No Courses */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400" />

          <p className="mt-3 text-gray-500">
            {profile?.role === 'faculty'
              ? 'No courses are assigned to you'
              : 'No courses available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {courses.map((course) => {
            const enrolled = isEnrolled(course.course_id);

            return (
              <div
                key={course.course_id}
                className="bg-white rounded-xl border p-5 shadow-sm"
              >

                {/* Course Icon + Code */}
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>

                  <span className="text-sm font-medium text-gray-500">
                    {course.course_code}
                  </span>
                </div>

                {/* Course Name */}
                <h2 className="mt-4 text-lg font-semibold">
                  {course.course_name}
                </h2>

                {/* Description */}
                <p className="mt-2 text-sm text-gray-500 min-h-[40px]">
                  {course.description ||
                    'No description available'}
                </p>

                {/* Details */}
                <div className="mt-5 space-y-2 text-sm text-gray-500">

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Academic Course
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Available now
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
                    className={`w-full mt-5 px-4 py-2 rounded-lg font-medium ${
                      enrolled
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {enrolling === course.course_id
                      ? 'Enrolling...'
                      : enrolled
                      ? 'Enrolled'
                      : 'Enroll'}
                  </button>
                )}

                {/* Faculty/Admin */}
                {(profile?.role === 'faculty' ||
                  profile?.role === 'admin') && (
                  <div className="w-full mt-5 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-center font-medium">
                    Course Available
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