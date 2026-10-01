import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Award,
  BookOpen,
  Activity,
} from 'lucide-react';

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  description?: string | null;
  faculty_id: number;
};

type Assignment = {
  assignment_id: number;
  course_id: number;
  title: string;
  max_marks: number;
};

type Submission = {
  submission_id: number;
  assignment_id: number;
  student_id: number;
  marks?: number | null;
  feedback?: string | null;
};

const API_URL = 'http://localhost:5001';

export default function AnalyticsPage() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  async function fetchData() {
    if (!profile) return;

    setLoading(true);

    try {
      const userId = Number(profile.user_id || profile.id);

      // Get all courses
      const coursesResponse = await fetch(
        `${API_URL}/api/courses`
      );

      if (!coursesResponse.ok) {
        throw new Error('Failed to load courses');
      }

      const allCourses: Course[] =
        await coursesResponse.json();

      // Get student's enrolled courses
      const enrollmentResponse = await fetch(
        `${API_URL}/api/enrollments/student/${userId}`
      );

      if (!enrollmentResponse.ok) {
        throw new Error('Failed to load enrollments');
      }

      const enrollmentData =
        await enrollmentResponse.json();

      const courseIds: number[] = Array.isArray(
        enrollmentData
      )
        ? enrollmentData.map((item: any) =>
            Number(item.course_id)
          )
        : [];

      const myCourses = allCourses.filter((course) =>
        courseIds.includes(Number(course.course_id))
      );

      setCourses(myCourses);

      if (courseIds.length === 0) {
        setAssignments([]);
        setSubmissions([]);
        return;
      }

      // Get assignments for enrolled courses
      const assignmentResponse = await fetch(
        `${API_URL}/api/assignments?courseIds=${courseIds.join(',')}`
      );

      let myAssignments: Assignment[] = [];

      if (assignmentResponse.ok) {
        const assignmentData =
          await assignmentResponse.json();

        myAssignments = Array.isArray(assignmentData)
          ? assignmentData
          : [];
      }

      setAssignments(myAssignments);

      // Get student's submissions
      const submissionResponse = await fetch(
        `${API_URL}/api/submissions/${userId}`
      );

      let mySubmissions: Submission[] = [];

      if (submissionResponse.ok) {
        const submissionData =
          await submissionResponse.json();

        mySubmissions = Array.isArray(submissionData)
          ? submissionData
          : [];
      }

      setSubmissions(mySubmissions);
    } catch (error) {
      console.error(
        'Analytics loading failed:',
        error
      );

      setCourses([]);
      setAssignments([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-2xl shimmer-bg animate-shimmer"
          />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-6 text-center py-20">
        <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />

        <h3 className="text-lg font-semibold text-slate-700 mb-1">
          No analytics data yet
        </h3>

        <p className="text-slate-400 text-sm">
          Enroll in courses to start tracking your learning progress
        </p>
      </div>
    );
  }

  // Only evaluated submissions are used for score calculation
  const evaluatedSubmissions =
    submissions.filter(
      (submission) =>
        submission.marks !== null &&
        submission.marks !== undefined
    );

  const avgScore =
    evaluatedSubmissions.length > 0
      ? Math.round(
          evaluatedSubmissions.reduce(
            (sum, submission) => {
              const assignment =
                assignments.find(
                  (a) =>
                    Number(a.assignment_id) ===
                    Number(
                      submission.assignment_id
                    )
                );

              const maxMarks =
                assignment?.max_marks || 0;

              if (maxMarks === 0) {
                return sum;
              }

              return (
                sum +
                (Number(submission.marks) /
                  Number(maxMarks)) *
                  100
              );
            },
            0
          ) / evaluatedSubmissions.length
        )
      : 0;

  const completionRate =
    assignments.length > 0
      ? Math.round(
          (submissions.length /
            assignments.length) *
            100
        )
      : 0;

  const engagementScore = Math.min(
    100,
    Math.round(
      submissions.length * 10 +
        evaluatedSubmissions.length * 5 +
        courses.length * 8
    )
  );

  const stats = [
    {
      label: 'Average Score',
      value: `${avgScore}%`,
      icon: Award,
      bg: 'from-success-500 to-success-600',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: Target,
      bg: 'from-brand-500 to-brand-600',
    },
    {
      label: 'Engagement Score',
      value: `${engagementScore}`,
      icon: Activity,
      bg: 'from-accent-500 to-accent-600',
    },
    {
      label: 'Total Courses',
      value: `${courses.length}`,
      icon: BookOpen,
      bg: 'from-warning-500 to-warning-600',
    },
  ];

  // Per-course performance
  const coursePerformance = courses.map(
    (course) => {
      const courseAssignments =
        assignments.filter(
          (assignment) =>
            Number(assignment.course_id) ===
            Number(course.course_id)
        );

      const courseSubmissions =
        submissions.filter((submission) =>
          courseAssignments.some(
            (assignment) =>
              Number(
                assignment.assignment_id
              ) ===
              Number(
                submission.assignment_id
              )
          )
        );

      const courseEvaluated =
        courseSubmissions.filter(
          (submission) =>
            submission.marks !== null &&
            submission.marks !== undefined
        );

      const courseMarksPercentage =
        courseEvaluated
          .map((submission) => {
            const assignment =
              courseAssignments.find(
                (a) =>
                  Number(
                    a.assignment_id
                  ) ===
                  Number(
                    submission.assignment_id
                  )
              );

            if (
              !assignment ||
              Number(assignment.max_marks) === 0
            ) {
              return null;
            }

            return (
              (Number(submission.marks) /
                Number(assignment.max_marks)) *
              100
            );
          })
          .filter(
            (value): value is number =>
              value !== null
          );

      const avg =
        courseMarksPercentage.length > 0
          ? Math.round(
              courseMarksPercentage.reduce(
                (sum, value) => sum + value,
                0
              ) /
                courseMarksPercentage.length
            )
          : 0;

      const completion =
        courseAssignments.length > 0
          ? Math.round(
              (courseSubmissions.length /
                courseAssignments.length) *
                100
            )
          : 0;

      return {
        course,
        avg,
        completion,
        totalAssignments:
          courseAssignments.length,
        submitted:
          courseSubmissions.length,
      };
    }
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card p-5"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.bg} flex items-center justify-center mb-3`}
            >
              <stat.icon className="w-6 h-6 text-white" />
            </div>

            <p className="text-2xl font-bold font-display text-slate-900">
              {stat.value}
            </p>

            <p className="text-sm text-slate-500 mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Course Progress */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-5">
          Course Progress
        </h3>

        <div className="space-y-5">
          {coursePerformance.map(
            ({
              course,
              avg,
              completion,
              totalAssignments,
              submitted,
            }) => (
              <div key={course.course_id}>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {course.course_code}
                    </span>

                    <span className="text-xs text-slate-400">
                      {course.course_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500">
                      {submitted}/
                      {totalAssignments}{' '}
                      assignments
                    </span>

                    <span
                      className={`font-semibold ${
                        avg >= 70
                          ? 'text-success-600'
                          : avg >= 50
                          ? 'text-warning-600'
                          : 'text-error-600'
                      }`}
                    >
                      {avg > 0
                        ? `${avg}%`
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">

                  {/* Completion */}
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        completion >= 80
                          ? 'bg-success-500'
                          : completion >= 50
                          ? 'bg-brand-500'
                          : 'bg-warning-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          completion,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Score */}
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        avg >= 70
                          ? 'bg-success-500'
                          : avg >= 50
                          ? 'bg-brand-500'
                          : 'bg-error-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          avg,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                </div>

                <div className="flex gap-2 mt-1 text-xs text-slate-400">
                  <span className="flex-1">
                    Completion:{' '}
                    {completion}%
                  </span>

                  <span className="flex-1">
                    Avg Score:{' '}
                    {avg > 0
                      ? `${avg}%`
                      : 'N/A'}
                  </span>
                </div>

              </div>
            )
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Performance Insights */}
        <div className="card p-6">

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-600" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Performance Insights
            </h3>
          </div>

          <div className="space-y-3">

            {avgScore >= 80 && (
              <div className="p-3 rounded-xl bg-success-50 border border-success-100">
                <p className="text-sm text-success-700">
                  Excellent work! You are maintaining a high average across your courses.
                </p>
              </div>
            )}

            {avgScore >= 50 &&
              avgScore < 80 && (
                <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
                  <p className="text-sm text-brand-700">
                    Good progress! Focus on consistent submissions to improve your average.
                  </p>
                </div>
              )}

            {avgScore < 50 &&
              evaluatedSubmissions.length > 0 && (
                <div className="p-3 rounded-xl bg-warning-50 border border-warning-100">
                  <p className="text-sm text-warning-700">
                    Consider reviewing course materials and asking your instructor for help.
                  </p>
                </div>
              )}

            {completionRate < 50 && (
              <div className="p-3 rounded-xl bg-error-50 border border-error-100">
                <p className="text-sm text-error-700">
                  You have unsubmitted assignments. Try to complete them to improve your grades.
                </p>
              </div>
            )}

            {completionRate >= 80 && (
              <div className="p-3 rounded-xl bg-success-50 border border-success-100">
                <p className="text-sm text-success-700">
                  Great submission rate! You are staying on top of your assignments.
                </p>
              </div>
            )}

            {evaluatedSubmissions.length === 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-500">
                  No grades yet. Submit assignments to start tracking your performance.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Study Recommendations */}
        <div className="card p-6">

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent-600" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Study Recommendations
            </h3>
          </div>

          <div className="space-y-3">

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 text-xs font-bold text-brand-700">
                1
              </div>

              <p className="text-sm text-slate-600">
                Review materials before each assignment to improve your scores.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 text-xs font-bold text-brand-700">
                2
              </div>

              <p className="text-sm text-slate-600">
                Participate in course discussions to deepen your understanding.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 text-xs font-bold text-brand-700">
                3
              </div>

              <p className="text-sm text-slate-600">
                Use the AI Assistant for quick concept explanations and practice quizzes.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 text-xs font-bold text-brand-700">
                4
              </div>

              <p className="text-sm text-slate-600">
                Join study groups to collaborate and learn from peers.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}