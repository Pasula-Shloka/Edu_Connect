import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  ClipboardList,
  Calendar,
  BookOpen,
  Loader2,
  X,
  Upload,
  CheckCircle,
  ExternalLink,
  Save,
  User,
  FileText,
} from 'lucide-react';

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  faculty_id: number;
};

type Assignment = {
  assignment_id: number;
  course_id: number;
  unit_name: string | null;
  title: string;
  description: string | null;
  due_date: string;
  max_marks: number;
  faculty_id?: number;
};

type Submission = {
  submission_id: number;
  assignment_id: number;
  student_id: number;
  submission_url: string;
  submitted_at: string;
  marks: number | null;
  feedback: string | null;
};

type FacultySubmission = {
  submission_id: number;
  assignment_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  submission_url: string;
  submitted_at: string;
  marks: number | null;
  feedback: string | null;
  assignment_title: string;
  max_marks: number;
  course_id: number;
  course_code: string;
  course_name: string;
  unit_name: string | null;
};

export default function AssignmentsPage() {
  const { profile } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [submissions, setSubmissions] = useState<
    Record<number, Submission | null>
  >({});

  const [facultySubmissions, setFacultySubmissions] = useState<
    FacultySubmission[]
  >([]);

  const [studentId, setStudentId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [facultyLoading, setFacultyLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [evaluating, setEvaluating] = useState<number | null>(null);

  const [courseId, setCourseId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('20');

  const [submissionFiles, setSubmissionFiles] = useState<
    Record<number, File | null>
  >({});

  const [marksInputs, setMarksInputs] = useState<
    Record<number, string>
  >({});

  const [feedbackInputs, setFeedbackInputs] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    if (!profile) return;

    fetchCourses();
    fetchAssignments();

    if (profile.role === 'student' && profile.email) {
      fetchStudentId();
    }

    if (profile.role === 'faculty') {
      const fId = Number(profile.user_id || profile.id);
      fetchFacultySubmissions(fId);
    }
  }, [profile]);

  const API_URL = 'http://localhost:5001';

  /* =========================================================
     COURSES
  ========================================================= */

  async function fetchCourses() {
    try {
      const fId = Number(profile?.user_id || profile?.id);
      let url = `${API_URL}/api/courses`;

      if (profile?.role === 'faculty' && fId) {
        url = `${API_URL}/api/courses?facultyId=${fId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      let data: Course[] = await response.json();
      if (profile?.role === 'faculty' && fId) {
        data = (Array.isArray(data) ? data : []).filter(c => Number(c.faculty_id) === fId);
      } else {
        data = Array.isArray(data) ? data : [];
      }

      setCourses(data);

      if (data.length > 0) {
        setCourseId(String(data[0].course_id));
      } else {
        setCourseId('');
      }
    } catch (error) {
      console.error('Unable to load courses:', error);
      setCourses([]);
      setCourseId('');
    }
  }

  /* =========================================================
     ASSIGNMENTS
  ========================================================= */

  async function fetchAssignments() {
    try {
      setLoading(true);

      const fId = Number(profile?.user_id || profile?.id);
      let url = `${API_URL}/api/assignments`;

      if (profile?.role === 'faculty' && fId) {
        url = `${API_URL}/api/assignments?facultyId=${fId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.error || 'Failed to fetch assignments'
        );
      }

      let data = await response.json();
      if (profile?.role === 'faculty' && fId && Array.isArray(data)) {
        data = data.filter((a: any) => Number(a.faculty_id) === fId || courses.some(c => c.course_id === a.course_id));
      }

      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Unable to load assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     STUDENT
  ========================================================= */

  async function fetchStudentId() {
    if (!profile?.email) return;

    try {
      const response = await fetch(
        `http://localhost:5001/api/user-id?email=${encodeURIComponent(
          profile.email
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Student not found'
        );
      }

      setStudentId(data.user_id);

      await fetchStudentSubmissions(data.user_id);
    } catch (error) {
      console.error(
        'Unable to identify student:',
        error
      );
    }
  }

  async function fetchStudentSubmissions(id: number) {
    try {
      const response = await fetch(
        `http://localhost:5001/api/submissions/${id}`
      );

      if (!response.ok) return;

      const data = await response.json();

      const submissionMap: Record<
        number,
        Submission | null
      > = {};

      data.forEach((submission: Submission) => {
        submissionMap[submission.assignment_id] =
          submission;
      });

      setSubmissions(submissionMap);
    } catch (error) {
      console.error(
        'Unable to load submissions:',
        error
      );
    }
  }

  /* =========================================================
     FACULTY SUBMISSIONS
  ========================================================= */

  async function fetchFacultySubmissions(
    facultyId?: number
  ) {
    try {
      setFacultyLoading(true);

      const url = facultyId
        ? `http://localhost:5001/api/faculty/submissions?facultyId=${facultyId}`
        : `http://localhost:5001/api/faculty/submissions`;

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to fetch student submissions'
        );
      }

      setFacultySubmissions(data);

      const marksMap: Record<number, string> = {};
      const feedbackMap: Record<number, string> = {};

      data.forEach((submission: FacultySubmission) => {
        if (submission.marks !== null) {
          marksMap[submission.submission_id] =
            String(submission.marks);
        }

        feedbackMap[submission.submission_id] =
          submission.feedback || '';
      });

      setMarksInputs(marksMap);
      setFeedbackInputs(feedbackMap);
    } catch (error) {
      console.error(
        'Unable to load faculty submissions:',
        error
      );
    } finally {
      setFacultyLoading(false);
    }
  }

  /* =========================================================
     OPEN CREATE FORM
  ========================================================= */

  function openCreateForm() {
    setShowForm(true);

    if (!courseId && courses.length > 0) {
      setCourseId(String(courses[0].course_id));
    }
  }

  /* =========================================================
     CREATE ASSIGNMENT
  ========================================================= */

  async function createAssignment() {
    if (
      !courseId ||
      !unitName.trim() ||
      !title.trim() ||
      !dueDate ||
      !maxMarks
    ) {
      alert('Please fill all required fields');
      return;
    }

    if (
      profile?.role !== 'faculty' &&
      profile?.role !== 'admin'
    ) {
      alert(
        'Only faculty or admin can create assignments'
      );
      return;
    }

    if (!profile?.user_id) {
      alert('User account not found');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        'http://localhost:5001/api/assignments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_id: Number(courseId),
            unit_name: unitName.trim(),
            title: title.trim(),
            description: description.trim(),
            due_date: dueDate,
            max_marks: Number(maxMarks),
            faculty_id:
              profile.role === 'faculty'
                ? profile.user_id
                : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to create assignment'
        );
      }

      alert('Assignment created successfully');

      setUnitName('');
      setTitle('');
      setDescription('');
      setDueDate('');
      setMaxMarks('20');

      setShowForm(false);

      await fetchAssignments();

      if (
        profile.role === 'faculty' &&
        profile.user_id
      ) {
        await fetchFacultySubmissions(
          profile.user_id
        );
      }
    } catch (error) {
      console.error(
        'Assignment creation error:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to create assignment'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     FILE SELECTION
  ========================================================= */

  function updateSubmissionFile(
    assignmentId: number,
    file: File | null
  ) {
    if (!file) {
      setSubmissionFiles((previous) => ({
        ...previous,
        [assignmentId]: null,
      }));
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    const allowedExtensions = [
      '.pdf',
      '.doc',
      '.docx',
      '.ppt',
      '.pptx',
    ];

    const extension = file.name
      .substring(file.name.lastIndexOf('.'))
      .toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(extension)
    ) {
      alert(
        'Please select a PDF, Word document, or PowerPoint file.'
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert('File size must be less than 10 MB.');
      return;
    }

    setSubmissionFiles((previous) => ({
      ...previous,
      [assignmentId]: file,
    }));
  }

  /* =========================================================
     CONVERT FILE TO DATA URL
  ========================================================= */

  function fileToDataUrl(
    file: File
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(
            new Error('Unable to read selected file')
          );
        }
      };

      reader.onerror = () => {
        reject(
          new Error('Unable to read selected file')
        );
      };

      reader.readAsDataURL(file);
    });
  }

  /* =========================================================
     STUDENT SUBMISSION
  ========================================================= */

  async function submitAssignment(
    assignmentId: number
  ) {
    if (!studentId) {
      alert(
        'Student account could not be identified'
      );
      return;
    }

    const selectedFile =
      submissionFiles[assignmentId];

    if (!selectedFile) {
      alert('Please choose your assignment file');
      return;
    }

    try {
      setSubmitting(assignmentId);

      const fileData =
        await fileToDataUrl(selectedFile);

      const response = await fetch(
        'http://localhost:5001/api/submissions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignment_id: assignmentId,
            student_id: studentId,
            submission_url: fileData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to submit assignment'
        );
      }

      alert(
        'Assignment submitted successfully'
      );

      setSubmissionFiles((previous) => ({
        ...previous,
        [assignmentId]: null,
      }));

      await fetchStudentSubmissions(studentId);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to submit assignment'
      );
    } finally {
      setSubmitting(null);
    }
  }

  /* =========================================================
     OPEN SUBMISSION
  ========================================================= */

  function openSubmission(
    submissionUrl: string
  ) {
    if (!submissionUrl) {
      alert('Submission file is not available');
      return;
    }

    const newWindow = window.open(
      submissionUrl,
      '_blank'
    );

    if (!newWindow) {
      alert(
        'Please allow pop-ups in your browser to view the submission.'
      );
    }
  }

  /* =========================================================
     EVALUATION
  ========================================================= */

  function updateMarks(
    submissionId: number,
    value: string
  ) {
    setMarksInputs((previous) => ({
      ...previous,
      [submissionId]: value,
    }));
  }

  function updateFeedback(
    submissionId: number,
    value: string
  ) {
    setFeedbackInputs((previous) => ({
      ...previous,
      [submissionId]: value,
    }));
  }

  async function evaluateSubmission(
    submission: FacultySubmission
  ) {
    if (!profile?.user_id) {
      alert('Faculty account not found');
      return;
    }

    const marks =
      marksInputs[submission.submission_id];

    if (
      marks === undefined ||
      marks.trim() === ''
    ) {
      alert('Please enter marks');
      return;
    }

    const numericMarks = Number(marks);

    if (
      !Number.isFinite(numericMarks) ||
      numericMarks < 0
    ) {
      alert('Please enter valid marks');
      return;
    }

    if (
      numericMarks > submission.max_marks
    ) {
      alert(
        `Marks cannot be greater than ${submission.max_marks}`
      );
      return;
    }

    try {
      setEvaluating(
        submission.submission_id
      );

      const response = await fetch(
        `http://localhost:5001/api/faculty/submissions/${submission.submission_id}/evaluate`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            facultyId: profile.user_id,
            marks: numericMarks,
            feedback:
              feedbackInputs[
                submission.submission_id
              ] || '',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to evaluate submission'
        );
      }

      alert(
        'Marks and feedback saved successfully'
      );

      await fetchFacultySubmissions(
        profile.user_id
      );
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to evaluate submission'
      );
    } finally {
      setEvaluating(null);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Assignments
          </h1>

          <p className="text-gray-500">
            {profile?.role === 'faculty'
              ? 'Create, manage and evaluate assignments'
              : 'View and submit your academic assignments'}
          </p>
        </div>

        {(profile?.role === 'faculty' ||
          profile?.role === 'admin') &&
          courses.length > 0 && (
            <div className="flex items-center gap-3">

              {profile?.role === 'faculty' && (
                <button
                  onClick={() =>
                    setShowSubmissions(
                      !showSubmissions
                    )
                  }
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {showSubmissions
                    ? 'Hide Submissions'
                    : 'Student Submissions'}
                </button>
              )}

              <button
                onClick={openCreateForm}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Assignment
              </button>
            </div>
          )}
      </div>

      {/* CREATE ASSIGNMENT FORM */}
      {showForm &&
        (profile?.role === 'faculty' ||
          profile?.role === 'admin') && (
          <div className="bg-white border rounded-xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-xl font-semibold">
                Create Assignment
              </h2>

              <button
                onClick={() =>
                  setShowForm(false)
                }
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* COURSE */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Course
                </label>

                <select
                  value={courseId}
                  onChange={(e) =>
                    setCourseId(e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
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
              </div>

              {/* UNIT */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Unit
                </label>

                <input
                  type="text"
                  value={unitName}
                  onChange={(e) =>
                    setUnitName(e.target.value)
                  }
                  placeholder="Enter unit name or number"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* TITLE */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Assignment Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Enter assignment title"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Enter assignment description"
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* DUE DATE */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* MAX MARKS */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Marks
                </label>

                <input
                  type="number"
                  min="1"
                  value={maxMarks}
                  onChange={(e) =>
                    setMaxMarks(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() =>
                  setShowForm(false)
                }
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={createAssignment}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? 'Creating...'
                  : 'Create Assignment'}
              </button>

            </div>

          </div>
        )}

      {/* FACULTY SUBMISSIONS */}
      {profile?.role === 'faculty' &&
        showSubmissions && (
          <div className="bg-white border rounded-xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-xl font-semibold">
                  Student Submissions
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Review submissions and give marks and feedback
                </p>
              </div>

              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {facultySubmissions.length}{' '}
                Submission
                {facultySubmissions.length !== 1
                  ? 's'
                  : ''}
              </span>

            </div>

            {facultyLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
            ) : facultySubmissions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">

                <ClipboardList className="w-12 h-12 mx-auto text-gray-400" />

                <p className="mt-3">
                  No student submissions yet.
                </p>

              </div>
            ) : (
              <div className="space-y-5">

                {facultySubmissions.map(
                  (submission) => (
                    <div
                      key={
                        submission.submission_id
                      }
                      className="border rounded-xl p-5"
                    >

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                        <div>

                          <div className="flex items-center gap-2">

                            <User className="w-5 h-5 text-blue-600" />

                            <h3 className="font-semibold text-lg">
                              {
                                submission.student_name
                              }
                            </h3>

                          </div>

                          <p className="text-sm text-gray-500 mt-1">
                            {
                              submission.student_email
                            }
                          </p>

                          <p className="text-sm font-medium mt-3">
                            {
                              submission.assignment_title
                            }
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {
                              submission.course_code
                            }{' '}
                            -{' '}
                            {
                              submission.course_name
                            }
                          </p>

                          {submission.unit_name && (
                            <p className="text-sm text-gray-500">
                              Unit:{' '}
                              {
                                submission.unit_name
                              }
                            </p>
                          )}

                          <p className="text-sm text-gray-500 mt-2">
                            Submitted:{' '}
                            {new Date(
                              submission.submitted_at
                            ).toLocaleString()}
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openSubmission(
                              submission.submission_url
                            )
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Submission
                        </button>

                      </div>

                      {/* EVALUATION */}
                      <div className="mt-5 pt-5 border-t">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                          <div>

                            <label className="block text-sm font-medium mb-2">
                              Marks /{' '}
                              {
                                submission.max_marks
                              }
                            </label>

                            <input
                              type="number"
                              min="0"
                              max={
                                submission.max_marks
                              }
                              value={
                                marksInputs[
                                  submission
                                    .submission_id
                                ] || ''
                              }
                              onChange={(e) =>
                                updateMarks(
                                  submission.submission_id,
                                  e.target.value
                                )
                              }
                              placeholder="Enter marks"
                              className="w-full border rounded-lg px-3 py-2"
                            />

                          </div>

                          <div className="md:col-span-2">

                            <label className="block text-sm font-medium mb-2">
                              Feedback
                            </label>

                            <textarea
                              value={
                                feedbackInputs[
                                  submission
                                    .submission_id
                                ] || ''
                              }
                              onChange={(e) =>
                                updateFeedback(
                                  submission.submission_id,
                                  e.target.value
                                )
                              }
                              placeholder="Enter feedback for the student"
                              rows={3}
                              className="w-full border rounded-lg px-3 py-2"
                            />

                          </div>

                        </div>

                        <div className="flex items-center justify-between mt-4">

                          <div>
                            {submission.marks !==
                            null ? (
                              <span className="text-sm text-green-600 font-medium">
                                Previously evaluated:{' '}
                                {
                                  submission.marks
                                }{' '}
                                /{' '}
                                {
                                  submission.max_marks
                                }
                              </span>
                            ) : (
                              <span className="text-sm text-yellow-600 font-medium">
                                Not evaluated yet
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              evaluateSubmission(
                                submission
                              )
                            }
                            disabled={
                              evaluating ===
                              submission.submission_id
                            }
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >

                            {evaluating ===
                            submission.submission_id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save Evaluation
                              </>
                            )}

                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

      {/* ASSIGNMENT LIST */}
      {assignments.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center">

          <ClipboardList className="w-12 h-12 mx-auto text-gray-400" />

          <p className="mt-3 text-gray-500">
            {profile?.role === 'faculty'
              ? 'No assignments created for your courses'
              : 'No assignments available'}
          </p>

        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {assignments.map((assignment) => {

            const submission =
              submissions[
                assignment.assignment_id
              ];

            return (
              <div
                key={
                  assignment.assignment_id
                }
                className="bg-white border rounded-xl p-5 shadow-sm"
              >

                <div className="flex items-start justify-between">

                  <div className="p-3 bg-blue-100 rounded-lg">

                    <ClipboardList className="w-6 h-6 text-blue-600" />

                  </div>

                  <span className="text-sm font-medium text-gray-500">
                    {assignment.max_marks} Marks
                  </span>

                </div>

                <h2 className="mt-4 text-lg font-semibold">
                  {assignment.title}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {assignment.description ||
                    'No description available'}
                </p>

                <div className="mt-5 space-y-2 text-sm text-gray-500">

                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Course ID:{' '}
                    {assignment.course_id}
                  </div>

                  {assignment.unit_name && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Unit:{' '}
                      {assignment.unit_name}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due:{' '}
                    {assignment.due_date}
                  </div>

                </div>

                {/* STUDENT SUBMISSION */}
                {profile?.role === 'student' && (
                  <div className="mt-5 border-t pt-5">

                    {submission ? (
                      <div className="space-y-3">

                        <div className="flex items-center gap-2 text-green-600 font-medium">

                          <CheckCircle className="w-5 h-5" />

                          Assignment Submitted

                        </div>

                        <div className="text-sm text-gray-500">
                          Submitted on:{' '}
                          {new Date(
                            submission.submitted_at
                          ).toLocaleString()}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openSubmission(
                              submission.submission_url
                            )
                          }
                          className="flex items-center gap-2 text-blue-600 text-sm hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Submission
                        </button>

                        {submission.marks !==
                          null && (
                          <div className="p-3 bg-green-50 rounded-lg">

                            <p className="font-semibold text-green-700">
                              Marks:{' '}
                              {
                                submission.marks
                              }{' '}
                              /{' '}
                              {
                                assignment.max_marks
                              }
                            </p>

                            {submission.feedback && (
                              <p className="mt-1 text-sm text-gray-600">
                                Feedback:{' '}
                                {
                                  submission.feedback
                                }
                              </p>
                            )}

                          </div>
                        )}

                        {submission.marks ===
                          null && (
                          <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                            Waiting for faculty evaluation
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="space-y-3">

                        <div className="flex items-center gap-2 font-medium text-gray-700">

                          <Upload className="w-5 h-5" />

                          Submit Assignment

                        </div>

                        <label className="flex items-center gap-3 border-2 border-dashed rounded-lg px-4 py-4 cursor-pointer hover:bg-gray-50">

                          <FileText className="w-6 h-6 text-blue-600" />

                          <div className="flex-1">

                            <p className="text-sm font-medium text-gray-700">
                              {submissionFiles[
                                assignment.assignment_id
                              ]
                                ? submissionFiles[
                                    assignment.assignment_id
                                  ]!.name
                                : 'Choose PDF, Word or PowerPoint file'}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              Maximum file size: 10 MB
                            </p>

                          </div>

                          <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">
                            Choose File
                          </span>

                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                            className="hidden"
                            onChange={(e) =>
                              updateSubmissionFile(
                                assignment.assignment_id,
                                e.target.files?.[0] ||
                                  null
                              )
                            }
                          />

                        </label>

                        <button
                          onClick={() =>
                            submitAssignment(
                              assignment.assignment_id
                            )
                          }
                          disabled={
                            submitting ===
                            assignment.assignment_id
                          }
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitting ===
                          assignment.assignment_id
                            ? 'Uploading...'
                            : 'Submit Assignment'}
                        </button>

                      </div>
                    )}

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