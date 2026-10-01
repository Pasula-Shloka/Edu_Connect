import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageSquare,
  Plus,
  X,
  Loader2,
  Send,
  CornerDownRight,
  ArrowLeft,
} from 'lucide-react';

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  description?: string;
  faculty_id: number;
};

type Discussion = {
  discussion_id: number;
  course_id: number;
  created_by: number;
  title: string;
  content: string;
  created_at: string;
  full_name?: string;
};

type Reply = {
  reply_id: number;
  discussion_id: number;
  user_id: number;
  content: string;
  created_at: string;
  full_name?: string;
};

const API_URL = 'http://localhost:5001';

export default function DiscussionsPage() {
  const { profile } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedDiscussion, setSelectedDiscussion] =
    useState<Discussion | null>(null);

  const [showCreate, setShowCreate] = useState(false);

  const [createForm, setCreateForm] = useState({
    course_id: '',
    title: '',
    content: '',
  });

  const [creating, setCreating] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  async function fetchData() {
    if (!profile) return;

    try {
      setLoading(true);

      const userId = profile.user_id || Number(profile.id);

      // ---------------------------------------------------------
      // LOAD COURSES
      // ---------------------------------------------------------
      const coursesResponse = await fetch(`${API_URL}/api/courses`);

      if (!coursesResponse.ok) {
        throw new Error('Failed to load courses');
      }

      const allCourses: Course[] = await coursesResponse.json();

      let myCourses: Course[] = [];

      if (profile.role === 'faculty') {
        myCourses = allCourses.filter(
          (course) => course.faculty_id === userId
        );
      } else if (profile.role === 'admin') {
        myCourses = allCourses;
      } else {
        // Backend route is /api/enrollments/:studentId
        const enrollmentResponse = await fetch(
          `${API_URL}/api/enrollments/${userId}`
        );

        if (enrollmentResponse.ok) {
          const enrollments: { course_id: number }[] =
            await enrollmentResponse.json();

          const courseIds = enrollments.map(
            (enrollment) => enrollment.course_id
          );

          myCourses = allCourses.filter((course) =>
            courseIds.includes(course.course_id)
          );
        }
      }

      setCourses(myCourses);

      // ---------------------------------------------------------
      // LOAD DISCUSSIONS
      // ---------------------------------------------------------
      //
      // Your backend GET /api/discussions currently returns all
      // discussions and does not require courseIds in the URL.
      //
      const discussionResponse = await fetch(
        `${API_URL}/api/discussions`
      );

      if (!discussionResponse.ok) {
        throw new Error('Failed to load discussions');
      }

      const discussionData: Discussion[] =
        await discussionResponse.json();

      // Only show discussions belonging to the user's courses.
      const courseIds = myCourses.map((course) => course.course_id);

      const filteredDiscussions = discussionData.filter((discussion) =>
        courseIds.includes(discussion.course_id)
      );

      setDiscussions(filteredDiscussions);
    } catch (error) {
      console.error('Failed to load discussions:', error);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------
  // LOAD REPLIES
  // -------------------------------------------------------------
  async function fetchReplies(discussionId: number) {
    try {
      const response = await fetch(
        `${API_URL}/api/discussions/${discussionId}/replies`
      );

      if (!response.ok) {
        throw new Error('Failed to load replies');
      }

      const data: Reply[] = await response.json();

      setReplies(data);
    } catch (error) {
      console.error('Failed to load replies:', error);
      setReplies([]);
    }
  }

  // -------------------------------------------------------------
  // CREATE DISCUSSION
  // -------------------------------------------------------------
  async function createDiscussion(e: React.FormEvent) {
    e.preventDefault();

    if (!profile) return;

    if (!createForm.course_id) {
      alert('Please select a course');
      return;
    }

    if (!createForm.title.trim()) {
      alert('Please enter a discussion title');
      return;
    }

    if (!createForm.content.trim()) {
      alert('Please enter discussion content');
      return;
    }

    try {
      setCreating(true);

      const userId = profile.user_id || Number(profile.id);

      const response = await fetch(`${API_URL}/api/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: Number(createForm.course_id),

          // Backend expects user_id.
          // It inserts this into discussions.created_by.
          user_id: userId,

          title: createForm.title.trim(),
          content: createForm.content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create discussion');
        return;
      }

      setShowCreate(false);

      setCreateForm({
        course_id: '',
        title: '',
        content: '',
      });

      await fetchData();
    } catch (error) {
      console.error('Create discussion failed:', error);
      alert('Unable to connect to backend');
    } finally {
      setCreating(false);
    }
  }

  // -------------------------------------------------------------
  // SUBMIT REPLY
  // -------------------------------------------------------------
  async function submitReply() {
    if (!profile || !selectedDiscussion || !replyContent.trim()) {
      return;
    }

    try {
      setReplying(true);

      const userId = profile.user_id || Number(profile.id);

      const response = await fetch(
        `${API_URL}/api/discussions/${selectedDiscussion.discussion_id}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Backend expects user_id.
            user_id: userId,
            content: replyContent.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to post reply');
        return;
      }

      setReplyContent('');

      await fetchReplies(selectedDiscussion.discussion_id);
    } catch (error) {
      console.error('Reply failed:', error);
      alert('Unable to connect to backend');
    } finally {
      setReplying(false);
    }
  }

  // -------------------------------------------------------------
  // FILTER DISCUSSIONS
  // -------------------------------------------------------------
  const filtered =
    selectedCourse === 'all'
      ? discussions
      : discussions.filter(
          (discussion) =>
            discussion.course_id === Number(selectedCourse)
        );

  // -------------------------------------------------------------
  // LOADING
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl shimmer-bg animate-shimmer"
          />
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------
  // SELECTED DISCUSSION / REPLIES VIEW
  // -------------------------------------------------------------
  if (selectedDiscussion) {
    const course = courses.find(
      (c) => c.course_id === selectedDiscussion.course_id
    );

    return (
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <button
          onClick={() => {
            setSelectedDiscussion(null);
            setReplies([]);
            setReplyContent('');
          }}
          className="btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discussions
        </button>

        {/* Discussion */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold font-display text-slate-900">
                {selectedDiscussion.title}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {course?.course_code || 'Course'} • by{' '}
                {selectedDiscussion.full_name || 'Unknown'} •{' '}
                {new Date(
                  selectedDiscussion.created_at
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed">
            {selectedDiscussion.content}
          </p>
        </div>

        {/* Replies */}
        <div className="space-y-3 mb-6">
          {replies.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              No replies yet. Be the first to respond!
            </p>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.reply_id}
                className="card p-4 flex items-start gap-3"
              >
                <CornerDownRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />

                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    {reply.full_name || 'Unknown'}
                  </p>

                  <p className="text-sm text-slate-700">
                    {reply.content}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(reply.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Form */}
        <div className="card p-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="input-field min-h-[80px] resize-none mb-3"
          />

          <button
            onClick={submitReply}
            disabled={replying || !replyContent.trim()}
            className="btn-primary"
          >
            {replying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post Reply
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN DISCUSSIONS PAGE
  // -------------------------------------------------------------
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Course filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCourse('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCourse === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>

          {courses.map((course) => (
            <button
              key={course.course_id}
              onClick={() =>
                setSelectedCourse(String(course.course_id))
              }
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCourse === String(course.course_id)
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {course.course_code}
            </button>
          ))}
        </div>

        {/* New Discussion */}
        {courses.length > 0 && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Discussion
          </button>
        )}
      </div>

      {/* Discussions */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />

          <h3 className="text-lg font-semibold text-slate-700 mb-1">
            No discussions yet
          </h3>

          <p className="text-slate-400 text-sm">
            Start a discussion to engage with your class
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((discussion) => {
            const course = courses.find(
              (c) => c.course_id === discussion.course_id
            );

            return (
              <div
                key={discussion.discussion_id}
                onClick={() => {
                  setSelectedDiscussion(discussion);
                  fetchReplies(discussion.discussion_id);
                }}
                className="card card-hover p-5 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-brand-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">
                        {discussion.title}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-2">
                      {discussion.content}
                    </p>

                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      <span>{course?.course_code}</span>

                      <span>•</span>

                      <span>
                        by {discussion.full_name || 'Unknown'}
                      </span>

                      <span>•</span>

                      <span>
                        {new Date(
                          discussion.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Discussion Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">
                New Discussion
              </h3>

              <button
                onClick={() => setShowCreate(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form
              onSubmit={createDiscussion}
              className="space-y-4"
            >
              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Course
                </label>

                <select
                  required
                  value={createForm.course_id}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      course_id: e.target.value,
                    })
                  }
                  className="input-field"
                >
                  <option value="">Select course</option>

                  {courses.map((course) => (
                    <option
                      key={course.course_id}
                      value={course.course_id}
                    >
                      {course.course_name} ({course.course_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title
                </label>

                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      title: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="Discussion topic"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Content
                </label>

                <textarea
                  required
                  value={createForm.content}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      content: e.target.value,
                    })
                  }
                  className="input-field min-h-[120px] resize-none"
                  placeholder="Share your thoughts..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={creating}
                className="btn-primary w-full"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Discussion
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}