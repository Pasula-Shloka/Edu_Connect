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
  ExternalLink,
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
  const userId = Number(profile?.user_id || profile?.id);

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

  const isFaculty = profile?.role?.toLowerCase() === 'faculty' || profile?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    loadPage();
  }, [profile]);

  async function loadPage() {
    setLoading(true);
    setError('');

    await fetchClasses();

    if (isFaculty) {
      await fetchCourses();
    }

    setLoading(false);
  }

  async function fetchClasses() {
    try {
      const response = await fetch(`${API_URL}/api/live-classes`);
      const text = await response.text();

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Backend returned invalid JSON: ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch live classes');
      }

      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Live classes loading error:', err);
      setClasses([]);
      setError(err instanceof Error ? err.message : 'Unable to load live classes');
    }
  }

  async function fetchCourses() {
    try {
      let res = await fetch(`${API_URL}/api/courses?facultyId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
          return;
        }
      }

      // Fallback: fetch all university courses
      const allRes = await fetch(`${API_URL}/api/courses`);
      if (allRes.ok) {
        const allData = await allRes.json();
        setCourses(Array.isArray(allData) ? allData : []);
      }
    } catch (err) {
      console.error('Courses loading error:', err);
      setCourses([]);
    }
  }

  function generateRoomName() {
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `KLEduConnect-${Date.now()}-${randomPart}`;
  }

  async function createLiveClass(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
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

      const response = await fetch(`${API_URL}/api/live-classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: Number(courseId),
          faculty_id: userId,
          title: title.trim(),
          description: description.trim(),
          room_name: roomName,
          start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || 'Failed to create live class');
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
      alert(err instanceof Error ? err.message : 'Cannot connect to backend');
    }
  }

  async function startClass(liveClass: LiveClass) {
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

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || 'Failed to start class');
        return;
      }

      setActiveClass(data.liveClass || { ...liveClass, status: 'live' });
      await fetchClasses();
    } catch (err) {
      console.error('Start class error:', err);
      // Still allow joining session
      setActiveClass({ ...liveClass, status: 'live' });
    }
  }

  async function endClass(liveClass: LiveClass) {
    try {
      await fetch(`${API_URL}/api/live-classes/${liveClass.live_class_id}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setActiveClass(null);
      await fetchClasses();
    } catch (err) {
      console.error('End class error:', err);
      setActiveClass(null);
    }
  }

  function joinClass(liveClass: LiveClass) {
    setActiveClass(liveClass);
  }

  function closeMeeting() {
    setActiveClass(null);
  }

  function formatDate(date: string) {
    if (!date) return 'Date not available';
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'Scheduled';
    return parsedDate.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6 text-slate-900 dark:text-slate-100">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading virtual classrooms...</p>
        </div>
      </div>
    );
  }

  // Active Interactive Meeting Screen
  if (activeClass) {
    return (
      <div className="p-4 sm:p-6 text-slate-900 dark:text-slate-100 animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 animate-pulse">
                  ● LIVE SESSION
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {activeClass.room_name}
                </span>
              </div>
              <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1">
                {activeClass.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeClass.course_code || 'Course'} {activeClass.course_name ? `· ${activeClass.course_name}` : ''}
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <a
                href={`https://meet.jit.si/${encodeURIComponent(activeClass.room_name)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>

              {isFaculty && (
                <button
                  onClick={() => endClass(activeClass)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Square className="w-3.5 h-3.5" />
                  End Class
                </button>
              )}

              <button
                onClick={closeMeeting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition"
              >
                <X className="w-3.5 h-3.5" />
                Close View
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
            <JitsiMeeting
              domain="meet.jit.si"
              roomName={activeClass.room_name}
              userInfo={{
                displayName: profile?.full_name || 'KL EduConnect User',
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
                iframeRef.style.height = '680px';
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
    <div className="p-4 sm:p-6 text-slate-900 dark:text-slate-100 animate-fade-in space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <Video className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
                Live Classes
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time interactive virtual lecture rooms with audio, video, and screen sharing
              </p>
            </div>
          </div>

          {isFaculty && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Schedule Live Class
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <h3 className="font-bold text-red-700 dark:text-red-300">Live Class Synchronization Note</h3>
              <p className="text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
            <button
              onClick={loadPage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && isFaculty && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Schedule New Live Lecture
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create an encrypted Jitsi room for student lectures and lab demonstrations
                </p>
              </div>

              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={createLiveClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select Academic Course</option>
                  {courses.map((course) => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lecture Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3: Normalization & Query Tuning Discussion"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Agenda / Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Topics covered, problem sets, and questions to be addressed..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Scheduled Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs shadow-sm transition"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State */}
        {classes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Video className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No live classes currently scheduled
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {isFaculty
                ? 'Create a virtual classroom to interact with your enrolled students.'
                : 'Your faculty has not scheduled any live lectures right now. Check back during class hours.'}
            </p>

            {isFaculty && !showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Schedule Class
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {classes.map((liveClass) => (
              <div
                key={liveClass.live_class_id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        liveClass.status === 'live'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 animate-pulse border border-red-200 dark:border-red-900/60'
                          : liveClass.status === 'scheduled'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {liveClass.status === 'live' ? '● LIVE NOW' : liveClass.status.toUpperCase()}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-500">
                      {liveClass.course_code || 'CS'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {liveClass.title}
                  </h3>

                  <p className="text-xs text-red-700 dark:text-red-400 font-semibold mt-1">
                    {liveClass.course_name || 'Academic Course'}
                  </p>

                  {liveClass.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {liveClass.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(liveClass.start_time)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Instructor: {liveClass.faculty_name || 'Faculty Member'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  {liveClass.status === 'live' ? (
                    <button
                      onClick={() => joinClass(liveClass)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      <Video className="w-4 h-4" />
                      Join Live Meeting
                    </button>
                  ) : liveClass.status === 'scheduled' && isFaculty ? (
                    <button
                      onClick={() => startClass(liveClass)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-sm transition"
                    >
                      <Play className="w-4 h-4" />
                      Start Class Room
                    </button>
                  ) : liveClass.status === 'scheduled' ? (
                    <div className="text-center text-xs font-semibold text-slate-400 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      Waiting for faculty to start
                    </div>
                  ) : (
                    <div className="text-center text-xs font-semibold text-slate-400 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      Lecture concluded
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