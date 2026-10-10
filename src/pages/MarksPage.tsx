import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Award,
  TrendingUp,
  Star,
  MessageSquare,
} from 'lucide-react';

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  description?: string;
  faculty_id?: number;
};

type Submission = {
  submission_id: number;
  assignment_id: number;
  student_id: number;
  submission_url?: string;
  submitted_at: string;
  marks: number | null;
  feedback: string | null;

  /* Fields returned by backend */
  title?: string;
  assignment_title?: string;
  unit_name?: string;
  max_marks?: number;
  course_code?: string;
  course_name?: string;

  /* Optional fields for compatibility */
  course_id?: number;
  unit_id?: number | null;
};

type Assignment = {
  assignment_id: number;
  course_id: number;
  title: string;
  max_marks: number;
};

type MarkItem = {
  submission: Submission;
  assignment: Assignment;
  course: Course;
  student_name?: string;
  student_email?: string;
};

const API_URL = 'http://localhost:5001';

export default function MarksPage() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [marksData, setMarksData] = useState<MarkItem[]>([]);

  useEffect(() => {
    fetchData();
  }, [profile]);

  async function fetchData() {
    if (!profile) {
      setMarksData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const userId = profile.user_id || Number(profile.id);

      if (!userId) {
        setMarksData([]);
        return;
      }

      /* =====================================================
         FACULTY
      ===================================================== */

      if (profile.role === 'faculty') {
        const response = await fetch(
          `${API_URL}/api/faculty/submissions?facultyId=${userId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch faculty submissions');
        }

        const submissions: Submission[] = await response.json();

        const gradedSubmissions = submissions.filter(
          (submission) =>
            submission.marks !== null &&
            submission.marks !== undefined
        );

        /* Get courses so we can determine course_id from course_code */
        const courseResponse = await fetch(
          `${API_URL}/api/courses`
        );

        if (!courseResponse.ok) {
          throw new Error('Failed to fetch courses');
        }

        const courses: Course[] = await courseResponse.json();

        const courseMap = new Map(
          courses.map((course) => [
            course.course_code,
            course,
          ])
        );

        const combined = gradedSubmissions.map((submission) => {
          const course = (submission.course_code ? courseMap.get(submission.course_code) : undefined)
              || courses.find((c) => Number(c.course_id) === Number(submission.course_id))
              || {
                course_id: submission.course_id || 1,
                course_code: submission.course_code || 'CS301',
                course_name: submission.course_name || 'Academic Course',
              };

            const assignment: Assignment = {
              assignment_id: submission.assignment_id,
              course_id: course.course_id,
              title:
                submission.assignment_title ||
                submission.title ||
                'Assignment',
              max_marks: Number(submission.max_marks || 0),
            };

            return {
              submission,
              assignment,
              course,
              student_name: (submission as any).student_name,
              student_email: (submission as any).student_email,
            };
          })
          .filter((item) => item !== null) as MarkItem[];

        setMarksData(combined);
        return;
      }

      /* =====================================================
         STUDENT
      ===================================================== */

      const response = await fetch(
        `${API_URL}/api/submissions/${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch student submissions');
      }

      const submissions: Submission[] =
        await response.json();

      /*
       * Only show graded submissions.
       */
      const gradedSubmissions = submissions.filter(
        (submission) =>
          submission.marks !== null &&
          submission.marks !== undefined
      );

      if (gradedSubmissions.length === 0) {
        setMarksData([]);
        return;
      }

      /* =====================================================
         GET COURSES
      ===================================================== */

      const courseResponse = await fetch(
        `${API_URL}/api/courses`
      );

      if (!courseResponse.ok) {
        throw new Error('Failed to fetch courses');
      }

      const allCourses: Course[] =
        await courseResponse.json();

      /*
       * Create maps using course_code.
       *
       * The backend submissions API returns course_code
       * but does not return course_id.
       */
      const courseCodeMap = new Map(
        allCourses.map((course) => [
          course.course_code,
          course,
        ])
      );

      /* =====================================================
         BUILD MARKS DATA
      ===================================================== */

      const combined = gradedSubmissions
        .map((submission) => {
          /*
           * Find the course using the course code returned
           * by /api/submissions/:studentId
           */
          const course = (submission.course_code ? courseCodeMap.get(submission.course_code) : undefined)
            || allCourses.find((c) => Number(c.course_id) === Number(submission.course_id))
            || {
              course_id: submission.course_id || 1,
              course_code: submission.course_code || 'CS301',
              course_name: submission.course_name || 'Academic Course',
            };

          /*
           * The backend already gives us:
           *
           * title
           * max_marks
           * course_code
           * course_name
           * marks
           * feedback
           *
           * So there is no need to make another
           * assignment API request.
           */
          const assignment: Assignment = {
            assignment_id: submission.assignment_id,
            course_id: course.course_id,
            title:
              submission.title ||
              submission.assignment_title ||
              'Assignment',
            max_marks: Number(
              submission.max_marks || 0
            ),
          };

          return {
            submission,
            assignment,
            course,
          };
        })
        .filter((item) => item !== null) as MarkItem[];

      setMarksData(combined);
    } catch (error) {
      console.error('Marks fetch error:', error);
      setMarksData([]);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl shimmer-bg animate-shimmer"
          />
        ))}
      </div>
    );
  }

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  if (marksData.length === 0) {
    return (
      <div className="p-6 text-center py-20">
        <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />

        <h3 className="text-lg font-semibold text-slate-700 mb-1">
          No marks yet
        </h3>

        <p className="text-slate-400 text-sm">
          {profile?.role === 'faculty'
            ? 'Evaluated submissions will appear here'
            : 'Your grades will appear here once assignments are graded'}
        </p>
      </div>
    );
  }

  /* =====================================================
     VALID MARKS
  ===================================================== */

  const validMarks = marksData.filter(
    (item) =>
      item.submission.marks !== null &&
      item.submission.marks !== undefined
  );

  /* =====================================================
     OVERALL AVERAGE
  ===================================================== */

  const avgScore =
    validMarks.length > 0
      ? validMarks.reduce((sum, item) => {
          const marks = Number(
            item.submission.marks
          );

          const maxMarks = Number(
            item.assignment.max_marks
          );

          if (!maxMarks) {
            return sum;
          }

          return (
            sum +
            (marks / maxMarks) * 100
          );
        }, 0) / validMarks.length
      : 0;

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="card p-6 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-slate-900 dark:to-slate-900/80 border border-brand-100 dark:border-slate-800">
        <div className="flex items-center gap-6">

          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm">
            <TrendingUp className="w-8 h-8 text-brand-600" />
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Overall Average
            </p>

            <p className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              {Math.round(avgScore)}%
            </p>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Across {validMarks.length}{' '}
              {validMarks.length === 1
                ? 'graded item'
                : 'graded items'}
            </p>
          </div>

        </div>
      </div>

      {/* =====================================================
          MARKS LIST
      ===================================================== */}

      <div className="space-y-4">

        {marksData.map(
          ({
            submission,
            assignment,
            course,
            student_name,
            student_email,
          }) => {

            const score = Number(
              submission.marks
            );

            const maxScore = Number(
              assignment.max_marks
            );

            const percentage =
              maxScore > 0
                ? Math.round(
                    (score / maxScore) * 100
                  )
                : 0;

            const gradeColor =
              percentage >= 90
                ? 'success'
                : percentage >= 70
                ? 'brand'
                : percentage >= 50
                ? 'warning'
                : 'error';

            const colorMap: Record<
              string,
              string
            > = {
              success:
                'bg-success-50 text-success-700 border-success-200',

              brand:
                'bg-brand-50 text-brand-700 border-brand-200',

              warning:
                'bg-warning-50 text-warning-700 border-warning-200',

              error:
                'bg-error-50 text-error-700 border-error-200',
            };

            return (
              <div
                key={submission.submission_id}
                className="card p-5"
              >

                <div className="flex items-start gap-4">

                  {/* =================================================
                      MARK
                  ================================================= */}

                  <div
                    className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 ${colorMap[gradeColor]}`}
                  >
                    <span className="text-lg font-bold">
                      {percentage}%
                    </span>
                  </div>

                  {/* =================================================
                      DETAILS
                  ================================================= */}

                  <div className="flex-1 min-w-0">

                    <h3 className="font-semibold text-slate-900">
                      {assignment.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {course.course_code} •{' '}
                      {course.course_name}
                    </p>

                    {/* =================================================
                        FACULTY STUDENT INFO
                    ================================================= */}

                    {profile?.role === 'faculty' &&
                      student_name && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-slate-700">
                            Student: {student_name}
                          </p>

                          {student_email && (
                            <p className="text-xs text-slate-400">
                              {student_email}
                            </p>
                          )}
                        </div>
                      )}

                    {/* =================================================
                        SCORE
                    ================================================= */}

                    <div className="flex items-center gap-4 mt-3 text-sm">

                      <span className="text-slate-600">
                        <span className="font-semibold">
                          {score}
                        </span>{' '}
                        / {maxScore} marks
                      </span>

                      <span className="text-slate-300">
                        |
                      </span>

                      <span className="text-xs text-slate-400">
                        Submitted:{' '}
                        {submission.submitted_at
                          ? new Date(
                              submission.submitted_at
                            ).toLocaleDateString()
                          : 'N/A'}
                      </span>

                    </div>

                    {/* =================================================
                        FEEDBACK
                    ================================================= */}

                    {submission.feedback && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">

                        <div className="flex items-start gap-2">

                          <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />

                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Faculty Feedback
                            </p>

                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {submission.feedback}
                            </p>
                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                  {/* =================================================
                      STAR
                  ================================================= */}

                  <div className="shrink-0">

                    {percentage >= 90 && (
                      <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
                    )}

                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>
    </div>
  );
}