import { useEffect, useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '@/contexts/AuthContext';
import {
  Video,
  Plus,
  Play,
  Square,
  Users,
  Calendar,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const API_URL = 'http://localhost:5001';

type LiveClass = {
  live_class_id: number;
  course_id: number;
  faculty_id: number;
  title: string;
  description: string | null;
  room_name: string;
  start_time: string;
  end_time: string | null;
  status: 'scheduled' | 'live' | 'ended';
  created_at: string;
  course_code?: string;
  course_name?: string;
  faculty_name?: string;
};

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
};

export default function LiveClassesPage() {
  const { profile } = useAuth();

  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeClass, setActiveClass] = useState<LiveClass | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [startTime, setStartTime] = useState('');

  const isFaculty =
    profile?.role?.toLowerCase() === 'faculty';

  useEffect(() => {
    loadPage();
  }, [profile]);

  async function loadPage() {
    setLoading(true);
    setError('');

    await fetchClasses();

    if (isFaculty && profile?.user_id) {
      await fetchCourses();
    }

    setLoading(false);
  }

  async function fetchClasses() {
    try {
      const response = await fetch(
        `${API_URL}/api/live-classes`
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Backend returned invalid JSON: ${text.substring(0, 200)}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || 'Failed to fetch live classes'
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          'Live classes response is not an array'
        );
      }

      setClasses(data);
    } catch (err) {
      console.error('Live classes loading error:', err);

      setClasses([]);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load live classes'
      );
    }
  }

  async function fetchCourses() {
    try {
      const response = await fetch(
        `${API_URL}/api/courses?facultyId=${profile?.user_id}`
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Courses endpoint returned invalid JSON: ${text.substring(
            0,
            200
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || 'Failed to fetch courses'
        );
      }

      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Courses loading error:', err);
      setCourses([]);
    }
  }

  function generateRoomName() {
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 10);

    return `KLEduConnect-${Date.now()}-${randomPart}`;
  }

  async function createLiveClass(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!profile?.user_id) {
      alert('User information not available');
      return;
    }

    if (!courseId) {
      alert('Please select a course');
      return;
    }

    if (!title.trim()) {
      alert('Please enter a class title');
      return;
    }

    try {
      const roomName = generateRoomName();

      const response = await fetch(
        `${API_URL}/api/live-classes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_id: Number(courseId),
            faculty_id: Number(profile.user_id),
            title: title.trim(),
            description: description.trim(),
            room_name: roomName,
            start_time: startTime
              ? new Date(startTime).toISOString()
              : new Date().toISOString(),
          }),
        }
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Backend returned invalid JSON: ${text.substring(0, 200)}`
        );
      }

      if (!response.ok) {
        alert(
          data?.error || 'Failed to create live class'
        );
        return;
      }

      alert('Live class created successfully');

      setTitle('');
      setDescription('');
      setCourseId('');
      setStartTime('');
      setShowCreateForm(false);

      await fetchClasses();
    } catch (err) {
      console.error('Create live class error:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Cannot connect to the backend'
      );
    }
  }

  async function startClass(
    liveClass: LiveClass
  ) {
    try {
      const response = await fetch(
        `${API_URL}/api/live-classes/${liveClass.live_class_id}/start`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Backend returned invalid JSON: ${text.substring(0, 200)}`
        );
      }

      if (!response.ok) {
        alert(
          data?.error || 'Failed to start class'
        );
        return;
      }

      setActiveClass(data.liveClass);

      await fetchClasses();
    } catch (err) {
      console.error('Start class error:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Cannot connect to the backend'
      );
    }
  }

  async function endClass(
    liveClass: LiveClass
  ) {
    try {
      const response = await fetch(
        `${API_URL}/api/live-classes/${liveClass.live_class_id}/end`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Backend returned invalid JSON: ${text.substring(0, 200)}`
        );
      }

      if (!response.ok) {
        alert(
          data?.error || 'Failed to end class'
        );
        return;
      }

      setActiveClass(null);

      await fetchClasses();
    } catch (err) {
      console.error('End class error:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Cannot connect to the backend'
      );
    }
  }

  function joinClass(liveClass: LiveClass) {
    setActiveClass(liveClass);
  }

  function closeMeeting() {
    setActiveClass(null);
  }

  function formatDate(date: string) {
    if (!date) {
      return 'Date not available';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Invalid date';
    }

    return parsedDate.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-4" />

          <p className="text-slate-500">
            Loading live classes...
          </p>
        </div>
      </div>
    );
  }

  if (activeClass) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {activeClass.title}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                {activeClass.course_code || 'Course'}{' '}
                {activeClass.course_name
                  ? `· ${activeClass.course_name}`
                  : ''}
              </p>
            </div>

            <div className="flex items-center gap-3">

              {isFaculty &&
                activeClass.status === 'live' && (
                  <button
                    onClick={() =>
                      endClass(activeClass)
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
                  >
                    <Square className="w-4 h-4" />
                    End Class
                  </button>
                )}

              <button
                onClick={closeMeeting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
                Close
              </button>

            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <JitsiMeeting
              domain="meet.jit.si"
              roomName={activeClass.room_name}
              userInfo={{
                displayName:
                  profile?.full_name ||
                  'KL EduConnect User',
                email: profile?.email || '',
              }}
              configOverwrite={{
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                enableWelcomePage: false,
              }}
              interfaceConfigOverwrite={{
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
              }}
              getIFrameRef={(iframeRef) => {
                iframeRef.style.height = '700px';
                iframeRef.style.width = '100%';
                iframeRef.style.border = '0';
              }}
            />
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center">
              <Video className="w-6 h-6 text-brand-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Live Classes
              </h1>

              <p className="text-sm text-slate-500">
                Attend and conduct live classes
              </p>
            </div>

          </div>

          {isFaculty && (
            <button
              onClick={() =>
                setShowCreateForm(true)
              }
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Create Live Class
            </button>
          )}

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5">

            <div className="flex items-start gap-3">

              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />

              <div className="flex-1">

                <h3 className="font-semibold text-red-700">
                  Unable to load live classes
                </h3>

                <p className="text-sm text-red-600 mt-1">
                  {error}
                </p>

              </div>

              <button
                onClick={loadPage}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>

            </div>

          </div>
        )}

        {/* Create Form */}
        {showCreateForm && isFaculty && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Create Live Class
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Schedule a live class for your students
                </p>
              </div>

              <button
                onClick={() =>
                  setShowCreateForm(false)
                }
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

            </div>

            <form
              onSubmit={createLiveClass}
              className="space-y-5"
            >

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Course
                </label>

                <select
                  value={courseId}
                  onChange={(e) =>
                    setCourseId(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="">
                    Select Course
                  </option>

                  {courses.map((course) => (
                    <option
                      key={course.course_id}
                      value={course.course_id}
                    >
                      {course.course_code} -{' '}
                      {course.course_name}
                    </option>
                  ))}
                </select>

                {courses.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    No courses are available for your faculty account.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Example: Introduction to SQL"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Enter class description..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Time
                </label>

                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateForm(false)
                  }
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={courses.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Live Class
                </button>

              </div>

            </form>
          </div>
        )}

        {/* Empty State */}
        {classes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">

            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <Video className="w-8 h-8 text-slate-400" />
            </div>

            <h3 className="text-lg font-semibold text-slate-700">
              No live classes yet
            </h3>

            <p className="text-sm text-slate-400 mt-2">
              {isFaculty
                ? 'Create your first live class for students.'
                : 'Your faculty has not created any live classes yet.'}
            </p>

            {isFaculty && !showCreateForm && (
              <button
                onClick={() =>
                  setShowCreateForm(true)
                }
                className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-700"
              >
                <Plus className="w-5 h-5" />
                Create Live Class
              </button>
            )}

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {classes.map((liveClass) => (
              <div
                key={liveClass.live_class_id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >

                <div className="flex items-center justify-between mb-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      liveClass.status === 'live'
                        ? 'bg-red-100 text-red-600'
                        : liveClass.status === 'scheduled'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {liveClass.status === 'live'
                      ? '● LIVE NOW'
                      : liveClass.status.toUpperCase()}
                  </span>

                  <Video className="w-5 h-5 text-slate-400" />

                </div>

                <h3 className="text-lg font-semibold text-slate-900">
                  {liveClass.title}
                </h3>

                <p className="text-sm text-brand-600 font-medium mt-1">
                  {liveClass.course_code ||
                    'Course'}
                  {liveClass.course_name
                    ? ` · ${liveClass.course_name}`
                    : ''}
                </p>

                {liveClass.description && (
                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                    {liveClass.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  {formatDate(
                    liveClass.start_time
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Users className="w-4 h-4" />
                  {liveClass.faculty_name ||
                    'Faculty'}
                </div>

                <div className="mt-5">

                  {liveClass.status === 'live' ? (
                    <button
                      onClick={() =>
                        joinClass(liveClass)
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition"
                    >
                      <Video className="w-4 h-4" />
                      Join Live Class
                    </button>
                  ) : liveClass.status ===
                      'scheduled' &&
                    isFaculty &&
                    Number(liveClass.faculty_id) ===
                      Number(profile?.user_id) ? (
                    <button
                      onClick={() =>
                        startClass(liveClass)
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
                    >
                      <Play className="w-4 h-4" />
                      Start Class
                    </button>
                  ) : liveClass.status ===
                    'scheduled' ? (
                    <div className="text-center text-sm text-slate-400 py-2">
                      Waiting for faculty to start
                    </div>
                  ) : (
                    <div className="text-center text-sm text-slate-400 py-2">
                      Class ended
                    </div>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}