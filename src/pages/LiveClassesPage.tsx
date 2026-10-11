import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LiveVideoConferenceRoom from '@/components/LiveVideoConferenceRoom';
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
  Radio,
  Sparkles,
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

const DEFAULT_LIVE_CLASSES: LiveClass[] = [
  {
    live_class_id: 101,
    course_id: 1,
    faculty_id: 4,
    title: 'BCNF Normalization, Indexing & Query Optimization Live Lab',
    description: 'Interactive live session covering B-Tree indexing, EXPLAIN ANALYZE query tuning, and ACID transactions.',
    room_name: 'KLEduConnect-DBMS-Live-Room',
    start_time: new Date().toISOString(),
    end_time: null,
    status: 'live',
    created_at: new Date().toISOString(),
    course_code: '22CS3101',
    course_name: 'Database Management Systems',
    faculty_name: 'Dr. K. Srinivas Rao',
  },
  {
    live_class_id: 102,
    course_id: 2,
    faculty_id: 4,
    title: 'Process Synchronization, Semaphores & Deadlock Avoidance',
    description: 'Live demonstration of producer-consumer threads, mutex locks, and Banker’s algorithm in operating systems.',
    room_name: 'KLEduConnect-OS-Live-Room',
    start_time: new Date().toISOString(),
    end_time: null,
    status: 'live',
    created_at: new Date().toISOString(),
    course_code: '22CS3102',
    course_name: 'Operating Systems',
    faculty_name: 'Dr. K. Srinivas Rao',
  },
  {
    live_class_id: 103,
    course_id: 4,
    faculty_id: 6,
    title: 'Full-Stack Microservices & WebRTC Architecture Masterclass',
    description: 'Hands-on walkthrough of React, Node.js, FastAPI, and real-time WebRTC video streaming.',
    room_name: 'KLEduConnect-FullStack-Live-Room',
    start_time: new Date().toISOString(),
    end_time: null,
    status: 'live',
    created_at: new Date().toISOString(),
    course_code: '22CS3104',
    course_name: 'Full-Stack Web Development',
    faculty_name: 'Dr. Priya Sharma',
  },
];

export default function LiveClassesPage() {
  const { profile } = useAuth();
  const userId = Number(profile?.user_id || profile?.id || 1);

  const [classes, setClasses] = useState<LiveClass[]>(DEFAULT_LIVE_CLASSES);
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
    profile?.role?.toLowerCase() === 'faculty' || profile?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    loadPage();
  }, [profile]);

  async function loadPage() {
    setLoading(true);
    setError('');

    await Promise.all([fetchClasses(), fetchCourses()]);

    setLoading(false);
  }

  async function fetchClasses() {
    try {
      const response = await fetch(`${API_URL}/api/live-classes`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setClasses(data);
          return;
        }
      }
      setClasses(DEFAULT_LIVE_CLASSES);
    } catch (err) {
      console.warn('Using default live classes:', err);
      setClasses(DEFAULT_LIVE_CLASSES);
    }
  }

  async function fetchCourses() {
    try {
      const res = await fetch(`${API_URL}/api/courses`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCourses(data);
        }
      }
    } catch (err) {
      console.error('Courses loading error:', err);
    }
  }

  function generateRoomName() {
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `KLEduConnect-${Date.now()}-${randomPart}`;
  }

  async function createLiveClass(e: React.FormEvent) {
    e.preventDefault();

    if (!courseId || !title.trim()) {
      alert('Please select a course and enter a lecture title');
      return;
    }

    const roomName = generateRoomName();
    const selectedCourseObj = courses.find((c) => Number(c.course_id) === Number(courseId));

    try {
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

      if (response.ok) {
        const data = await response.json();
        const created: LiveClass = {
          ...(data.liveClass || {}),
          live_class_id: data.liveClass?.live_class_id || Date.now(),
          course_id: Number(courseId),
          faculty_id: userId,
          title: title.trim(),
          description: description.trim(),
          room_name: roomName,
          start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
          end_time: null,
          status: 'live',
          created_at: new Date().toISOString(),
          course_code: selectedCourseObj?.course_code || 'CSE',
          course_name: selectedCourseObj?.course_name || 'University Course',
          faculty_name: profile?.full_name || 'Faculty Instructor',
        };
        setClasses((prev) => [created, ...prev]);
        setActiveClass(created);
      } else {
        const fallbackClass: LiveClass = {
          live_class_id: Date.now(),
          course_id: Number(courseId),
          faculty_id: userId,
          title: title.trim(),
          description: description.trim(),
          room_name: roomName,
          start_time: new Date().toISOString(),
          end_time: null,
          status: 'live',
          created_at: new Date().toISOString(),
          course_code: selectedCourseObj?.course_code || 'CSE',
          course_name: selectedCourseObj?.course_name || 'University Course',
          faculty_name: profile?.full_name || 'Faculty Instructor',
        };
        setClasses((prev) => [fallbackClass, ...prev]);
        setActiveClass(fallbackClass);
      }

      setTitle('');
      setDescription('');
      setCourseId('');
      setStartTime('');
      setShowCreateForm(false);
    } catch {
      const fallbackClass: LiveClass = {
        live_class_id: Date.now(),
        course_id: Number(courseId),
        faculty_id: userId,
        title: title.trim(),
        description: description.trim(),
        room_name: roomName,
        start_time: new Date().toISOString(),
        end_time: null,
        status: 'live',
        created_at: new Date().toISOString(),
        course_code: selectedCourseObj?.course_code || 'CSE',
        course_name: selectedCourseObj?.course_name || 'University Course',
        faculty_name: profile?.full_name || 'Faculty Instructor',
      };
      setClasses((prev) => [fallbackClass, ...prev]);
      setShowCreateForm(false);
      setActiveClass(fallbackClass);
    }
  }

  async function startClass(liveClass: LiveClass) {
    try {
      await fetch(`${API_URL}/api/live-classes/${liveClass.live_class_id}/start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {}
    const updated = { ...liveClass, status: 'live' as const };
    setClasses((prev) =>
      prev.map((c) => (c.live_class_id === liveClass.live_class_id ? updated : c))
    );
    setActiveClass(updated);
  }

  async function endClass(liveClass: LiveClass) {
    try {
      await fetch(`${API_URL}/api/live-classes/${liveClass.live_class_id}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {}
    setActiveClass(null);
    await fetchClasses();
  }

  function launchInstantSession() {
    const instantRoom: LiveClass = {
      live_class_id: Date.now(),
      course_id: 1,
      faculty_id: userId,
      title: 'KLH Interactive Live Classroom & Doubt Clearing Session',
      description: 'Instant WebRTC live classroom with camera, microphone, screen sharing, and interactive whiteboard.',
      room_name: `KLEduConnect-Instant-Room-${userId}`,
      start_time: new Date().toISOString(),
      end_time: null,
      status: 'live',
      created_at: new Date().toISOString(),
      course_code: '22CS3101',
      course_name: 'Database Management Systems',
      faculty_name: isFaculty ? profile?.full_name || 'Dr. K. Srinivas Rao' : 'Dr. K. Srinivas Rao',
    };
    setActiveClass(instantRoom);
  }

  function formatDate(date: string) {
    if (!date) return 'Live Today';
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'Scheduled Today';
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
                  ● LIVE CLASSROOM
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {activeClass.room_name}
                </span>
              </div>
              <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1">
                {activeClass.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeClass.course_code || 'Course'}{' '}
                {activeClass.course_name ? `· ${activeClass.course_name}` : ''} • Instructor:{' '}
                {activeClass.faculty_name || 'Dr. K. Srinivas Rao'}
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {isFaculty && (
                <button
                  onClick={() => endClass(activeClass)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Square className="w-3.5 h-3.5" />
                  End Class for All
                </button>
              )}

              <button
                onClick={() => setActiveClass(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition"
              >
                <X className="w-3.5 h-3.5" />
                Back to Class List
              </button>
            </div>
          </div>

          <LiveVideoConferenceRoom
            roomName={activeClass.room_name}
            title={activeClass.title}
            subtitle={`${activeClass.course_code || 'CSE'} • ${activeClass.course_name || 'Live Lecture'} • Room: ${activeClass.room_name}`}
            userName={profile?.full_name || 'KL EduConnect User'}
            userEmail={profile?.email || 'student@klh.edu.in'}
            userRole={profile?.role || 'student'}
            mode="lecture"
            onLeave={() => setActiveClass(null)}
          />
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
                Live Virtual Classrooms
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Instant WebRTC video, audio, screen sharing, interactive whiteboard, and live Q&A
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={launchInstantSession}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs shadow-md transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Instant Live Room</span>
            </button>

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
                  Schedule & Launch New Live Lecture
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create an interactive WebRTC & Jitsi room for student lectures and lab demonstrations
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
                  Academic Course
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
                  Scheduled Start Time (Optional — defaults to Live Now)
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
                  Create & Enter Classroom
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {classes.map((liveClass) => {
            const isLive = liveClass.status === 'live';
            return (
              <div
                key={liveClass.live_class_id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-red-300 dark:hover:border-red-800 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isLive
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${isLive ? 'animate-pulse text-red-600' : 'text-emerald-500'}`} />
                      <span>{isLive ? 'LIVE NOW' : 'READY TO JOIN'}</span>
                    </span>

                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {liveClass.course_code || '22CS3101'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {liveClass.title}
                  </h3>

                  <p className="text-xs text-red-700 dark:text-red-400 font-semibold mt-1">
                    {liveClass.course_name || 'Database Management Systems'}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {liveClass.description ||
                      'Interactive live classroom with camera, microphone, screen sharing, and digital whiteboard.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(liveClass.start_time)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Instructor: {liveClass.faculty_name || 'Dr. K. Srinivas Rao'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => startClass(liveClass)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
                  >
                    {isLive ? <Video className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isLive ? 'Join Live Classroom' : 'Launch & Join Classroom'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}