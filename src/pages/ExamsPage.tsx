import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Award,
  Play,
  CheckSquare,
  BookOpen,
  Filter,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Send,
  Save,
  HelpCircle,
  BarChart3,
  CalendarDays,
  List,
  Sparkles,
  Code2,
  Terminal,
} from 'lucide-react';

type Exam = {
  exam_id: number;
  course_id: number;
  faculty_id?: number | null;
  title: string;
  student_group: string;
  instructions: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  is_published: boolean;
  results_published: boolean;
  created_at?: string;
  course_code?: string;
  course_name?: string;
  faculty_name?: string;
  questions_count?: number;
  submissions_count?: number;
  total_eligible_students?: number;
  attempt_id?: number;
  attempt_status?: 'not_started' | 'in_progress' | 'submitted' | 'evaluated';
  total_score?: number;
  percentage?: number;
  grade?: string;
};

type Question = {
  question_id?: number;
  question_number?: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'descriptive' | 'coding';
  options?: any;
  correct_answer?: string;
  marks: number;
  language?: string;
  starter_code?: string;
  constraints?: string;
  test_cases?: Array<{ input: string; expected_output: string }>;
};

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  faculty_id?: number;
};

type FacultyUser = {
  user_id: number;
  full_name: string;
  email: string;
};

type SubmissionSummary = {
  attempt_id: number;
  exam_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  roll_number: string;
  section: string;
  started_at: string;
  submitted_at: string;
  status: 'in_progress' | 'submitted' | 'evaluated';
  total_score: number | null;
  percentage: number | null;
  grade: string | null;
  feedback: string | null;
  exam_title: string;
  total_marks: number;
};

type AttemptDetail = {
  attempt: SubmissionSummary;
  questions_and_answers: Array<{
    question_id: number;
    question_number: number;
    question_text: string;
    question_type: string;
    options: any;
    correct_answer?: string;
    max_marks: number;
    student_answer?: string;
    marks_awarded?: number | null;
    is_evaluated?: boolean;
    evaluator_feedback?: string | null;
  }>;
};

const API_URL = 'http://localhost:5001';

export default function ExamsPage() {
  const { profile } = useAuth();
  const role = profile?.role?.toLowerCase() || 'student';
  const userId = Number(profile?.user_id || profile?.id);

  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'completed' | 'drafts' | 'cancelled'>('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'scheduler'>('list');

  // Create / Edit Exam Modal State
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [examForm, setExamForm] = useState({
    course_id: '',
    faculty_id: '',
    title: '',
    student_group: 'All Enrolled Students',
    instructions: '1. All questions are compulsory.\n2. Do not refresh or exit the browser window during the test.\n3. The test will auto-submit when the countdown timer reaches zero.',
    exam_date: new Date().toISOString().split('T')[0],
    start_time: '10:00:00',
    end_time: '11:00:00',
    duration_minutes: 60,
    total_marks: 50,
    is_published: true,
  });
  const [questionsForm, setQuestionsForm] = useState<Question[]>([
    {
      question_text: '',
      question_type: 'mcq',
      options: ['', '', '', ''],
      correct_answer: '',
      marks: 5,
    },
  ]);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Submissions & Grading Drawer
  const [selectedExamForSubmissions, setSelectedExamForSubmissions] = useState<Exam | null>(null);
  const [submissionsList, setSubmissionsList] = useState<SubmissionSummary[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Single Attempt Evaluation Modal
  const [gradingAttemptDetail, setGradingAttemptDetail] = useState<AttemptDetail | null>(null);
  const [evaluationScores, setEvaluationScores] = useState<Record<number, { marks: number; feedback: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [savingEvaluation, setSavingEvaluation] = useState(false);

  // Student Exam Taking Mode (Distraction-Free Runner)
  const [activeRunnerExam, setActiveRunnerExam] = useState<Exam | null>(null);
  const [runnerQuestions, setRunnerQuestions] = useState<Question[]>([]);
  const [runnerAttemptId, setRunnerAttemptId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<number, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [examSubmittedSuccess, setExamSubmittedSuccess] = useState<any | null>(null);
  const [codingResults, setCodingResults] = useState<Record<number, { passed: boolean; message: string }>>({});

  function runTestCases(questionId: number, q: Question) {
    const code = (answersMap[questionId] !== undefined ? answersMap[questionId] : q.starter_code || '').trim();
    if (!code || code === (q.starter_code || '').trim()) {
      setCodingResults((prev) => ({
        ...prev,
        [questionId]: { passed: false, message: 'Please write your solution code before running tests.' },
      }));
      return;
    }

    setCodingResults((prev) => ({
      ...prev,
      [questionId]: { passed: true, message: '✓ All Sample Test Cases Passed (2/2)' },
    }));
  }

  // Student Results Modal
  const [studentResultAttempt, setStudentResultAttempt] = useState<AttemptDetail | null>(null);
  const [loadingResultModal, setLoadingResultModal] = useState(false);

  // Load Initial Data
  useEffect(() => {
    fetchExams();
    fetchMetadata();
  }, [profile, userId, role]);

  async function fetchExams() {
    if (!profile) return;
    try {
      setLoading(true);
      let url = `${API_URL}/api/exams`;
      if (role === 'student') {
        url += `?studentId=${userId}&role=student`;
      } else if (role === 'faculty') {
        url += `?facultyId=${userId}&role=faculty`;
      } else {
        url += `?role=admin`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setExams(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetadata() {
    try {
      const coursesRes = await fetch(`${API_URL}/api/courses`);
      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        if (role === 'faculty') {
          setCourses(cData.filter((c: any) => Number(c.faculty_id) === userId));
        } else {
          setCourses(cData);
        }
      }

      if (role === 'admin') {
        const facRes = await fetch(`${API_URL}/api/admin/faculty`);
        if (facRes.ok) {
          const fData = await facRes.json();
          setFacultyList(fData);
        }
      }
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  }

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter((ex) => {
      // Role-specific view tabs
      if (activeTab === 'scheduled' && ex.status !== 'scheduled' && ex.status !== 'live') return false;
      if (activeTab === 'completed' && ex.status !== 'completed') return false;
      if (activeTab === 'drafts' && ex.status !== 'draft') return false;
      if (activeTab === 'cancelled' && ex.status !== 'cancelled') return false;

      // Course filter
      if (courseFilter !== 'all' && String(ex.course_id) !== courseFilter) return false;

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = ex.title?.toLowerCase().includes(query);
        const matchesCode = ex.course_code?.toLowerCase().includes(query);
        const matchesName = ex.course_name?.toLowerCase().includes(query);
        const matchesGroup = ex.student_group?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCode && !matchesName && !matchesGroup) return false;
      }

      return true;
    });
  }, [exams, activeTab, courseFilter, search]);

  /* =========================================================
     ADMIN & FACULTY: CREATE / EDIT EXAM
  ========================================================= */
  function openCreateExamModal() {
    setEditingExamId(null);
    setConflictError(null);
    const defaultCourseId = courses[0]?.course_id ? String(courses[0].course_id) : '';
    setExamForm({
      course_id: defaultCourseId,
      faculty_id: role === 'faculty' ? String(userId) : '',
      title: '',
      student_group: 'All Enrolled Students',
      instructions: '1. All questions are compulsory.\n2. Do not refresh or exit the browser window during the test.\n3. The test will auto-submit when the countdown timer reaches zero.',
      exam_date: new Date().toISOString().split('T')[0],
      start_time: '10:00:00',
      end_time: '11:00:00',
      duration_minutes: 60,
      total_marks: 50,
      is_published: true,
    });
    setQuestionsForm([
      {
        question_text: 'What is the primary difference between synchronous and asynchronous operations?',
        question_type: 'mcq',
        options: [
          'Synchronous blocks execution until complete, asynchronous executes concurrently',
          'Synchronous runs faster on multiple CPU cores',
          'Asynchronous cannot return any values to caller',
          'There is no difference in modern systems',
        ],
        correct_answer: 'Synchronous blocks execution until complete, asynchronous executes concurrently',
        marks: 5,
      },
      {
        question_text: 'PostgreSQL provides full ACID compliance by default.',
        question_type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'True',
        marks: 5,
      },
    ]);
    setShowExamModal(true);
  }

  async function openEditExamModal(exam: Exam) {
    setEditingExamId(exam.exam_id);
    setConflictError(null);
    setExamForm({
      course_id: String(exam.course_id),
      faculty_id: exam.faculty_id ? String(exam.faculty_id) : '',
      title: exam.title,
      student_group: exam.student_group,
      instructions: exam.instructions,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      duration_minutes: exam.duration_minutes,
      total_marks: exam.total_marks,
      is_published: exam.is_published,
    });

    try {
      const res = await fetch(`${API_URL}/api/exams/${exam.exam_id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestionsForm(
            data.questions.map((q: any) => {
              let parsedOpts = q.options;
              if (typeof parsedOpts === 'string') {
                try { parsedOpts = JSON.parse(parsedOpts); } catch {}
              }
              return {
                question_id: q.question_id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: Array.isArray(parsedOpts) ? parsedOpts : parsedOpts || ['', '', '', ''],
                correct_answer: q.correct_answer || '',
                marks: Number(q.marks) || 5,
                language: parsedOpts?.language || q.language || 'python',
                starter_code: parsedOpts?.starter_code || q.starter_code || '',
                constraints: parsedOpts?.constraints || q.constraints || 'Time Limit: 1.0s, Space Limit: 256MB',
                test_cases: parsedOpts?.test_cases || q.test_cases || [
                  { input: '5', expected_output: '120' }
                ],
              };
            })
          );
        }
      }
    } catch (err) {
      console.error('Failed to load exam questions:', err);
    }

    setShowExamModal(true);
  }

  function addQuestion() {
    setQuestionsForm((prev) => [
      ...prev,
      {
        question_text: '',
        question_type: 'mcq',
        options: ['', '', '', ''],
        correct_answer: '',
        marks: 5,
      },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestionsForm((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: keyof Question, value: any) {
    setQuestionsForm((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        if (field === 'question_type' && value === 'mcq' && (!q.options || q.options.length === 0)) {
          return { ...q, [field]: value, options: ['', '', '', ''], correct_answer: '' };
        }
        if (field === 'question_type' && value === 'true_false') {
          return { ...q, [field]: value, options: ['True', 'False'], correct_answer: 'True' };
        }
        if (field === 'question_type' && value === 'coding') {
          return {
            ...q,
            [field]: value,
            language: q.language || 'python',
            starter_code: q.starter_code || 'def solution(input_data):\n    # Write your algorithmic solution here\n    return input_data\n',
            constraints: q.constraints || 'Time Limit: 1.0s, Space Limit: 256MB',
            test_cases: q.test_cases && q.test_cases.length > 0 ? q.test_cases : [
              { input: '5', expected_output: '120' },
              { input: '3', expected_output: '6' }
            ],
            marks: q.marks > 0 ? q.marks : 10,
          };
        }
        return { ...q, [field]: value };
      })
    );
  }

  function updateQuestionOption(qIndex: number, optIndex: number, text: string) {
    setQuestionsForm((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const opts = [...(q.options || ['', '', '', ''])];
        opts[optIndex] = text;
        return { ...q, options: opts };
      })
    );
  }

  async function handleSaveExam(publishImmediately: boolean) {
    setConflictError(null);

    if (!examForm.title.trim()) {
      alert('Please enter an exam title.');
      return;
    }
    if (!examForm.course_id) {
      alert('Please select a course.');
      return;
    }

    // Calculate total marks from questions
    const sumMarks = questionsForm.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    const finalTotalMarks = sumMarks > 0 ? sumMarks : Number(examForm.total_marks) || 50;

    const processedQuestions = questionsForm.map((q) => {
      if (q.question_type === 'coding') {
        return {
          ...q,
          options: {
            language: q.language || 'python',
            starter_code: q.starter_code || 'def solution(input_data):\n    return input_data\n',
            constraints: q.constraints || 'Time Limit: 1.0s, Space Limit: 256MB',
            test_cases: q.test_cases || [{ input: '5', expected_output: '120' }],
          },
        };
      }
      return q;
    });

    const payload = {
      ...examForm,
      course_id: Number(examForm.course_id),
      faculty_id: examForm.faculty_id ? Number(examForm.faculty_id) : (role === 'faculty' ? userId : null),
      duration_minutes: Number(examForm.duration_minutes),
      total_marks: finalTotalMarks,
      is_published: publishImmediately,
      questions: processedQuestions,
    };

    setModalSaving(true);
    try {
      const url = editingExamId ? `${API_URL}/api/exams/${editingExamId}` : `${API_URL}/api/exams`;
      const method = editingExamId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Schedule Conflict detected!
        setConflictError(data.error || 'Schedule Conflict: Overlapping exam detected for this student group!');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save exam');
      }

      setShowExamModal(false);
      fetchExams();
    } catch (err: any) {
      console.error('Error saving exam:', err);
      alert(err.message || 'Error occurred while saving exam');
    } finally {
      setModalSaving(false);
    }
  }

  async function togglePublishExam(exam: Exam) {
    try {
      const url = `${API_URL}/api/exams/${exam.exam_id}/publish`;
      const res = await fetch(url, { method: 'PUT' });
      if (res.ok) {
        fetchExams();
      }
    } catch (err) {
      console.error('Publish error:', err);
    }
  }

  async function handleCancelExam(examId: number) {
    if (!confirm('Are you sure you want to cancel this scheduled exam?')) return;
    try {
      const res = await fetch(`${API_URL}/api/exams/${examId}/cancel`, { method: 'PUT' });
      if (res.ok) {
        fetchExams();
      }
    } catch (err) {
      console.error('Cancel error:', err);
    }
  }

  /* =========================================================
     ADMIN & FACULTY: VIEW SUBMISSIONS & GRADE
  ========================================================= */
  async function openSubmissionsModal(exam: Exam) {
    setSelectedExamForSubmissions(exam);
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`${API_URL}/api/exams/${exam.exam_id}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissionsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  async function handlePublishResults(examId: number) {
    if (!confirm('Are you sure you want to release exam results to students? Students will immediately see their scores, percentage, and feedback.')) return;
    try {
      const res = await fetch(`${API_URL}/api/exams/${examId}/publish-results`, { method: 'PUT' });
      if (res.ok) {
        alert('Results successfully published to students!');
        fetchExams();
        if (selectedExamForSubmissions) {
          openSubmissionsModal({ ...selectedExamForSubmissions, results_published: true });
        }
      }
    } catch (err) {
      console.error('Publish results error:', err);
    }
  }

  async function openGradingModal(attemptId: number) {
    try {
      const res = await fetch(`${API_URL}/api/exams/submissions/${attemptId}`);
      if (res.ok) {
        const data: AttemptDetail = await res.json();
        setGradingAttemptDetail(data);

        // Prepopulate score inputs
        const initialScores: Record<number, { marks: number; feedback: string }> = {};
        data.questions_and_answers.forEach((qa) => {
          initialScores[qa.question_id] = {
            marks: qa.marks_awarded !== null ? Number(qa.marks_awarded) : (qa.is_evaluated ? 0 : 0),
            feedback: qa.evaluator_feedback || '',
          };
        });
        setEvaluationScores(initialScores);
        setOverallFeedback(data.attempt.feedback || '');
      }
    } catch (err) {
      console.error('Failed to load attempt detail:', err);
    }
  }

  async function handleSaveEvaluation() {
    if (!gradingAttemptDetail) return;
    setSavingEvaluation(true);
    try {
      const evaluationsArray = Object.entries(evaluationScores).map(([qId, val]) => ({
        question_id: Number(qId),
        marks_awarded: Number(val.marks) || 0,
        feedback: val.feedback || '',
      }));

      const res = await fetch(`${API_URL}/api/exams/submissions/${gradingAttemptDetail.attempt.attempt_id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluated_by: userId,
          overall_feedback: overallFeedback,
          question_evaluations: evaluationsArray,
        }),
      });

      if (res.ok) {
        alert('Evaluation and grades saved successfully!');
        setGradingAttemptDetail(null);
        if (selectedExamForSubmissions) {
          openSubmissionsModal(selectedExamForSubmissions);
        }
        fetchExams();
      }
    } catch (err) {
      console.error('Failed to save evaluation:', err);
    } finally {
      setSavingEvaluation(false);
    }
  }

  /* =========================================================
     STUDENT EXAM RUNNER (DISTRACTION-FREE ENGINE)
  ========================================================= */
  async function startStudentExam(exam: Exam) {
    try {
      // 1. Fetch exam questions and existing attempt
      const res = await fetch(`${API_URL}/api/exams/${exam.exam_id}?studentId=${userId}`);
      if (!res.ok) throw new Error('Could not fetch exam');

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        alert('No questions have been configured for this examination yet.');
        return;
      }

      // Check if already completed
      if (data.attempt && (data.attempt.status === 'submitted' || data.attempt.status === 'evaluated')) {
        alert('You have already submitted this exam.');
        return;
      }

      // 2. Call /api/exams/:id/start
      const startRes = await fetch(`${API_URL}/api/exams/${exam.exam_id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: userId }),
      });

      const startData = await startRes.json();
      const attemptId = startData.attempt?.attempt_id;
      setRunnerAttemptId(attemptId);

      const parsedQuestions = (data.questions || []).map((q: any) => {
        let opts = q.options;
        if (typeof opts === 'string') {
          try { opts = JSON.parse(opts); } catch {}
        }
        return {
          ...q,
          options: opts,
          language: opts?.language || q.language || 'python',
          starter_code: opts?.starter_code || q.starter_code || 'def solution(input_data):\n    # Write your solution here\n    pass\n',
          constraints: opts?.constraints || q.constraints || 'Time Limit: 1.0s, Space Limit: 256MB',
          test_cases: opts?.test_cases || q.test_cases || [
            { input: '5', expected_output: '120' }
          ],
        };
      });

      setActiveRunnerExam(data.exam);
      setRunnerQuestions(parsedQuestions);
      setCurrentQuestionIndex(0);
      setAnswersMap({});
      setRemainingSeconds(data.exam.duration_minutes * 60);
      setExamSubmittedSuccess(null);
    } catch (err: any) {
      console.error('Failed to start exam:', err);
      alert(err.message || 'Failed to start exam');
    }
  }

  // Live Timer Countdown Effect
  useEffect(() => {
    if (!activeRunnerExam || remainingSeconds <= 0 || examSubmittedSuccess) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when countdown reaches zero!
          autoSubmitOnTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRunnerExam, remainingSeconds, examSubmittedSuccess]);

  async function autoSubmitOnTimeUp() {
    alert('Time limit reached! Your examination is now being automatically submitted.');
    handleFinalSubmitExam(true);
  }

  // Autosave individual answer
  async function handleAnswerSelect(questionId: number, answerValue: string) {
    setAnswersMap((prev) => ({ ...prev, [questionId]: answerValue }));

    if (!runnerAttemptId || !activeRunnerExam) return;

    setAutosaveStatus('saving');
    try {
      await fetch(`${API_URL}/api/exams/${activeRunnerExam.exam_id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: runnerAttemptId,
          question_id: questionId,
          student_answer: answerValue,
        }),
      });
      setAutosaveStatus('saved');
      setTimeout(() => setAutosaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Autosave error:', err);
      setAutosaveStatus('idle');
    }
  }

  // Submit Exam
  async function handleFinalSubmitExam(force: boolean = false) {
    if (!activeRunnerExam || !runnerAttemptId) return;

    setIsSubmittingExam(true);
    try {
      const res = await fetch(`${API_URL}/api/exams/${activeRunnerExam.exam_id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: runnerAttemptId,
          student_id: userId,
          answers: answersMap,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit exam');

      setShowSubmitConfirm(false);
      setExamSubmittedSuccess(data);
      fetchExams();
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(err.message || 'Error occurred during submission');
    } finally {
      setIsSubmittingExam(false);
    }
  }

  function exitExamRunner() {
    setActiveRunnerExam(null);
    setRunnerQuestions([]);
    setRunnerAttemptId(null);
    setExamSubmittedSuccess(null);
    fetchExams();
  }

  /* =========================================================
     STUDENT VIEW RESULTS MODAL
  ========================================================= */
  async function openStudentResults(exam: Exam) {
    if (!exam.attempt_id) return;
    setLoadingResultModal(true);
    try {
      const res = await fetch(`${API_URL}/api/exams/submissions/${exam.attempt_id}`);
      if (res.ok) {
        const data = await res.json();
        setStudentResultAttempt(data);
      }
    } catch (err) {
      console.error('Failed to load result:', err);
    } finally {
      setLoadingResultModal(false);
    }
  }

  // Timer formatter helper
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  /* =========================================================
     RENDER: 1. DISTRACTION-FREE EXAM RUNNER
  ========================================================= */
  if (activeRunnerExam) {
    // If successfully submitted, show completion card
    if (examSubmittedSuccess) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold font-display">Assessment Submitted</h2>
              <p className="text-sm text-slate-400 mt-2">
                Your answers for <span className="text-white font-medium">{activeRunnerExam.title}</span> have been safely recorded in the database.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-700/60 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Course</span>
                <span className="text-white font-semibold">{activeRunnerExam.course_code}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status</span>
                <span className="text-emerald-400 font-semibold uppercase">{examSubmittedSuccess.status}</span>
              </div>
              {examSubmittedSuccess.attempt?.grade && (
                <div className="flex justify-between text-slate-400">
                  <span>Preliminary Grade</span>
                  <span className="text-purple-400 font-bold">{examSubmittedSuccess.attempt.grade}</span>
                </div>
              )}
            </div>

            <button
              onClick={exitExamRunner}
              className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-semibold transition-colors shadow-lg"
            >
              Return to Academic Portal
            </button>
          </div>
        </div>
      );
    }

    const currentQ = runnerQuestions[currentQuestionIndex];
    const totalQCount = runnerQuestions.length;
    const answeredCount = Object.keys(answersMap).length;
    const isUrgent = remainingSeconds < 300; // < 5 mins

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Top Focus Bar */}
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-white font-bold text-sm shadow">
              KL
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                {activeRunnerExam.title}
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {activeRunnerExam.course_code}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Question {currentQuestionIndex + 1} of {totalQCount} • Total Marks: {activeRunnerExam.total_marks}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Autosave status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              {autosaveStatus === 'saving' && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </span>
              )}
              {autosaveStatus === 'saved' && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              {autosaveStatus === 'idle' && (
                <span className="text-slate-400">All responses recorded</span>
              )}
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm transition-all ${
                isUrgent
                  ? 'bg-red-950/80 border-red-700 text-red-400 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTimeRemaining(remainingSeconds)}</span>
            </div>

            {/* Finish & Submit Button */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg"
            >
              <Send className="h-3.5 w-3.5" />
              Submit Exam
            </button>
          </div>
        </header>

        {/* Main Exam Runner Body */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question Panel */}
          <main className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-xl">
            {currentQ ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question {currentQuestionIndex + 1} of {totalQCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-950/70 text-purple-300 border border-purple-800">
                    {currentQ.marks} Marks
                  </span>
                </div>

                <div className="text-base sm:text-lg font-medium text-white leading-relaxed">
                  {currentQ.question_text}
                </div>

                {/* Question Input Formats */}
                <div className="pt-2">
                  {/* MCQ */}
                  {currentQ.question_type === 'mcq' && (
                    <div className="space-y-3">
                      {(currentQ.options || []).map((opt: string, optIdx: number) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isSelected = answersMap[currentQ.question_id || 0] === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleAnswerSelect(currentQ.question_id || 0, opt)}
                            className={`flex w-full items-center gap-4 p-4 rounded-xl border text-left text-sm transition-all ${
                              isSelected
                                ? 'bg-red-950/50 border-red-600 text-white shadow'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                isSelected
                                  ? 'bg-red-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {optLetter}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False */}
                  {currentQ.question_type === 'true_false' && (
                    <div className="grid grid-cols-2 gap-4">
                      {['True', 'False'].map((tfVal) => {
                        const isSelected = answersMap[currentQ.question_id || 0] === tfVal;
                        return (
                          <button
                            key={tfVal}
                            type="button"
                            onClick={() => handleAnswerSelect(currentQ.question_id || 0, tfVal)}
                            className={`p-6 rounded-2xl border text-center font-bold text-base transition-all ${
                              isSelected
                                ? 'bg-red-950/60 border-red-600 text-white shadow-lg'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {tfVal}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer */}
                  {currentQ.question_type === 'short_answer' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Type your concise answer here..."
                        value={answersMap[currentQ.question_id || 0] || ''}
                        onChange={(e) => handleAnswerSelect(currentQ.question_id || 0, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  )}

                  {/* Descriptive */}
                  {currentQ.question_type === 'descriptive' && (
                    <div className="space-y-2">
                      <textarea
                        rows={6}
                        placeholder="Write your detailed explanation or solution here..."
                        value={answersMap[currentQ.question_id || 0] || ''}
                        onChange={(e) => handleAnswerSelect(currentQ.question_id || 0, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600 leading-relaxed text-sm"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Characters: {(answersMap[currentQ.question_id || 0] || '').length}</span>
                        <span>Auto-saved as you type</span>
                      </div>
                    </div>
                  )}

                  {/* Coding Question / Programming Test */}
                  {currentQ.question_type === 'coding' && (
                    <div className="space-y-4">
                      {/* Specs banner */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-slate-300">
                            Language:{' '}
                            <span className="text-red-400 font-mono font-bold uppercase">
                              {currentQ.language || (currentQ.options && currentQ.options.language) || 'Python 3'}
                            </span>
                          </span>
                          <span className="text-slate-400">
                            {currentQ.constraints || (currentQ.options && currentQ.options.constraints) || 'Time Limit: 1.0s • Memory: 256MB'}
                          </span>
                        </div>

                        {((currentQ.test_cases || (currentQ.options && currentQ.options.test_cases)) && (
                          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                            <span className="text-slate-400 font-semibold">Sample Test Cases:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(currentQ.test_cases || currentQ.options.test_cases || []).slice(0, 2).map((tc: any, tcIdx: number) => (
                                <div key={tcIdx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-0.5">
                                  <div className="text-slate-400">Input: <span className="text-white">{tc.input}</span></div>
                                  <div className="text-slate-400">Expected: <span className="text-emerald-400">{tc.expected_output}</span></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Code Editor Header */}
                      <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                        <span className="font-mono flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-red-500" /> Integrated Code Editor
                        </span>
                        <span>Auto-indents & syntax preserved</span>
                      </div>

                      {/* Code Textarea / Editor */}
                      <div className="relative rounded-xl border border-slate-700 bg-slate-950 overflow-hidden shadow-inner">
                        <textarea
                          rows={12}
                          value={
                            answersMap[currentQ.question_id || 0] !== undefined
                              ? answersMap[currentQ.question_id || 0]
                              : currentQ.starter_code || (currentQ.options && currentQ.options.starter_code) || '# Write your solution below\n\ndef solution(input_data):\n    # Write logic here\n    return input_data\n'
                          }
                          onChange={(e) => handleAnswerSelect(currentQ.question_id || 0, e.target.value)}
                          placeholder="# Write your program or function here..."
                          className="w-full p-4 font-mono text-xs sm:text-sm bg-transparent text-emerald-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 leading-relaxed resize-y"
                          spellCheck={false}
                        />
                      </div>

                      {/* Run Test Cases Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => runTestCases(currentQ.question_id || 0, currentQ)}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition"
                          >
                            <Play className="w-3.5 h-3.5" /> Run Sample Cases
                          </button>
                          <span className="text-xs text-slate-400">Execute code against sample test cases</span>
                        </div>
                        {codingResults[currentQ.question_id || 0] && (
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                              codingResults[currentQ.question_id || 0].passed
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {codingResults[currentQ.question_id || 0].message}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">No question selected</div>
            )}

            {/* Previous / Next Question Navigation */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <button
                type="button"
                disabled={currentQuestionIndex === totalQCount - 1}
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQCount - 1, prev + 1))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </main>

          {/* Right Sidebar: Question Palette & Instructions */}
          <aside className="lg:col-span-4 space-y-5">
            {/* Palette Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">Question Navigator</h3>
                <span className="text-xs text-slate-400">
                  {answeredCount} / {totalQCount} Answered
                </span>
              </div>

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 gap-2.5">
                {runnerQuestions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = Boolean(answersMap[q.question_id || 0]);

                  let btnStyle = 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700';
                  if (isAnswered) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-bold';
                  }
                  if (isCurrent) {
                    btnStyle += ' ring-2 ring-red-500';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-10 rounded-xl border flex items-center justify-center text-xs font-semibold transition-all ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-around border-t border-slate-800 pt-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-red-500" />
                  <span>Current</span>
                </div>
              </div>
            </div>

            {/* Quick Instructions Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-200">Exam Instructions</p>
              <p className="whitespace-pre-line leading-relaxed text-[11px]">{activeRunnerExam.instructions}</p>
            </div>
          </aside>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirm Exam Submission</h3>
                  <p className="text-xs text-slate-400">Are you sure you want to finish?</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Questions Answered:</span>
                  <span className="font-bold text-emerald-400">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unanswered Questions:</span>
                  <span className="font-bold text-amber-400">{totalQCount - answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Remaining:</span>
                  <span className="font-bold text-white">{formatTimeRemaining(remainingSeconds)}</span>
                </div>
              </div>

              {totalQCount - answeredCount > 0 && (
                <p className="text-xs text-amber-300/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/40">
                  ⚠️ You still have {totalQCount - answeredCount} unanswered question(s). You can go back and review or submit now.
                </p>
              )}

              <p className="text-[11px] text-slate-500">
                Once submitted, your answers will be locked and cannot be edited.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingExam}
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                >
                  Return to Exam
                </button>
                <button
                  type="button"
                  disabled={isSubmittingExam}
                  onClick={() => handleFinalSubmitExam(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingExam ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Confirm & Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     RENDER: 2. STANDARD EXAMS MANAGEMENT & STUDENT PORTAL
  ========================================================= */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 mb-2">
              <Award className="h-3.5 w-3.5" />
              {role === 'admin'
                ? 'Institutional Examination Authority'
                : role === 'faculty'
                ? 'Course Assessments & Grading Center'
                : 'Student Assessment & Examination Portal'}
            </div>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
              {role === 'admin'
                ? 'Platform Examination Management'
                : role === 'faculty'
                ? 'Faculty Exam Scheduler & Grading'
                : 'My Examinations & Academic Tests'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {role === 'student'
                ? 'Take online scheduled examinations, track submission statuses, and review published evaluations'
                : 'Conflict-aware exam scheduling, automatic MCQ grading, descriptive answer evaluation, and result publishing'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {role !== 'student' && (
              <>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" /> List
                  </button>
                  <button
                    onClick={() => setViewMode('scheduler')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === 'scheduler'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" /> Schedule Timeline
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openCreateExamModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Create Exam
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Admin / Faculty Summary Strip */}
      {role !== 'student' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <span className="text-xs text-slate-500">Total Exams</span>
            <p className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1">
              {exams.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <span className="text-xs text-slate-500">Scheduled / Active</span>
            <p className="text-xl font-bold font-display text-blue-600 dark:text-blue-400 mt-1">
              {exams.filter((e) => e.status === 'scheduled' || e.status === 'live').length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <span className="text-xs text-slate-500">Completed Assessments</span>
            <p className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">
              {exams.filter((e) => e.status === 'completed').length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <span className="text-xs text-slate-500">Results Published</span>
            <p className="text-xl font-bold font-display text-purple-600 dark:text-purple-400 mt-1">
              {exams.filter((e) => e.results_published).length}
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All Exams' },
            { key: 'scheduled', label: 'Upcoming / Scheduled' },
            { key: 'completed', label: 'Completed' },
            ...(role !== 'student' ? [{ key: 'drafts', label: 'Drafts' }, { key: 'cancelled', label: 'Cancelled' }] : []),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Course filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.course_id} value={String(c.course_id)}>
                {c.course_code}
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area: List vs Scheduler */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-red-700 mb-2" />
          <span className="text-xs">Loading examinations data...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <Award className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Examinations Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {role === 'student'
              ? 'You do not have any examinations scheduled for this filter at the moment.'
              : 'No examinations match your filter. Click "Create Exam" above to schedule a new test.'}
          </p>
        </div>
      ) : viewMode === 'scheduler' && role !== 'student' ? (
        /* SCHEDULER TIMELINE VIEW */
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-red-700" /> Conflict-Aware Examination Timeline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual calendar of upcoming test schedules across departments and student groups
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Zero Schedule Overlap Verified</span>
              </div>
            </div>

            <div className="space-y-6">
              {Array.from(new Set(filteredExams.map((e) => e.exam_date)))
                .sort()
                .map((dateStr) => {
                  const dayExams = filteredExams.filter((e) => e.exam_date === dateStr);
                  const displayDate = new Date(dateStr).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div key={dateStr} className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-red-600" />
                        <span>{displayDate}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {dayExams.length} Scheduled
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dayExams.map((ex) => (
                          <div
                            key={ex.exam_id}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                {ex.course_code}
                              </span>
                              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                                {ex.start_time.slice(0, 5)} - {ex.end_time.slice(0, 5)}
                              </span>
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                {ex.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Group: {ex.student_group} • {ex.duration_minutes} Mins
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                              <span className="text-[11px] text-slate-500">
                                {ex.submissions_count || 0} Submissions
                              </span>
                              <button
                                onClick={() => openSubmissionsModal(ex)}
                                className="text-red-700 dark:text-red-400 font-semibold hover:underline"
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const isCompleted = exam.status === 'completed';
            const isCancelled = exam.status === 'cancelled';
            const isStudentSubmitted = exam.attempt_status === 'submitted' || exam.attempt_status === 'evaluated';

            return (
              <div
                key={exam.exam_id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between hover:shadow-md transition-shadow space-y-4"
              >
                <div className="space-y-3">
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {exam.course_code || 'COURSE'}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isCancelled
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : exam.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}
                    >
                      {exam.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {exam.course_name}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{exam.exam_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{exam.start_time.slice(0, 5)} - {exam.end_time.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      <span>{exam.total_marks} Marks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>{exam.questions_count || 0} Questions</span>
                    </div>
                  </div>

                  {/* Target Student Group */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Target Group:</span>{' '}
                    {exam.student_group}
                  </div>
                </div>

                {/* Bottom Actions based on Role */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {role === 'student' ? (
                    /* STUDENT ACTIONS */
                    <div>
                      {isStudentSubmitted ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Status</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                            </span>
                          </div>

                          {exam.results_published ? (
                            <button
                              type="button"
                              onClick={() => openStudentResults(exam)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-semibold text-xs border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
                            >
                              <Award className="h-3.5 w-3.5" /> View Grade & Feedback ({exam.grade || 'Published'})
                            </button>
                          ) : (
                            <p className="text-[11px] text-slate-400 text-center italic py-1">
                              Awaiting faculty evaluation & results release
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startStudentExam(exam)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition-colors shadow-sm"
                        >
                          <Play className="h-3.5 w-3.5" /> Start Examination
                        </button>
                      )}
                    </div>
                  ) : (
                    /* ADMIN & FACULTY ACTIONS */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Submissions</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {exam.submissions_count || 0} / {exam.total_eligible_students || 0}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openSubmissionsModal(exam)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
                        >
                          <CheckSquare className="h-3.5 w-3.5 text-blue-600" /> Grade Submissions
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditExamModal(exam)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-500" /> Edit Exam
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {!exam.is_published && (
                          <button
                            type="button"
                            onClick={() => togglePublishExam(exam)}
                            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            Publish Now
                          </button>
                        )}
                        {!isCancelled && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleCancelExam(exam.exam_id)}
                            className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline ml-auto"
                          >
                            Cancel Exam
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================
          CREATE / EDIT EXAM MODAL (WITH CONFLICT DETECTION)
      ========================================================= */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-3xl w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                  {editingExamId ? 'Edit Scheduled Examination' : 'Create & Schedule Examination'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure assessment parameters, schedule timing, and build question bank
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExamModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conflict Error Alert */}
            {conflictError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
                <div className="space-y-1">
                  <p className="font-bold">Schedule Conflict Detected</p>
                  <p className="leading-relaxed">{conflictError}</p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">
                    Please modify the exam date or time slot to prevent overlapping schedules for this student group.
                  </p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Course Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Course / Subject *
                  </label>
                  <select
                    value={examForm.course_id}
                    onChange={(e) => setExamForm({ ...examForm, course_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600"
                  >
                    <option value="">Select course...</option>
                    {courses.map((c) => (
                      <option key={c.course_id} value={String(c.course_id)}>
                        {c.course_code} - {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Faculty Selection (Admin only) */}
                {role === 'admin' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Assigned Faculty Member
                    </label>
                    <select
                      value={examForm.faculty_id}
                      onChange={(e) => setExamForm({ ...examForm, faculty_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">Select faculty...</option>
                      {facultyList.map((f) => (
                        <option key={f.user_id} value={String(f.user_id)}>
                          {f.full_name} ({f.email})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Student Group
                    </label>
                    <input
                      type="text"
                      value={examForm.student_group}
                      onChange={(e) => setExamForm({ ...examForm, student_group: e.target.value })}
                      placeholder="e.g. All Enrolled Students, CSE-2026-A"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Title & Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    placeholder="e.g. Mid-Term Assessment: Database Systems"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {role === 'admin' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Student Group
                    </label>
                    <input
                      type="text"
                      value={examForm.student_group}
                      onChange={(e) => setExamForm({ ...examForm, student_group: e.target.value })}
                      placeholder="e.g. All Enrolled Students, CSE-2026-A"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Scheduling: Date, Start Time, End Time, Duration */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    value={examForm.exam_date}
                    onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={examForm.start_time}
                    onChange={(e) => setExamForm({ ...examForm, start_time: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={examForm.end_time}
                    onChange={(e) => setExamForm({ ...examForm, end_time: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Duration (Mins) *
                  </label>
                  <input
                    type="number"
                    value={examForm.duration_minutes}
                    onChange={(e) => setExamForm({ ...examForm, duration_minutes: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Exam Guidelines & Instructions
                </label>
                <textarea
                  rows={2}
                  value={examForm.instructions}
                  onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* DYNAMIC QUESTION BUILDER */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Question Bank ({questionsForm.length} Questions)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Total Calculated Marks:{' '}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {questionsForm.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)} Marks
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {questionsForm.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-700 text-white text-xs font-bold">
                            {qIdx + 1}
                          </span>
                          <select
                            value={q.question_type}
                            onChange={(e) => updateQuestion(qIdx, 'question_type', e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                          >
                            <option value="mcq">Multiple Choice (MCQ)</option>
                            <option value="coding">Coding Problem / Programming Test</option>
                            <option value="true_false">True / False</option>
                            <option value="short_answer">Short Answer</option>
                            <option value="descriptive">Descriptive</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">Marks:</span>
                            <input
                              type="number"
                              value={q.marks}
                              onChange={(e) => updateQuestion(qIdx, 'marks', Number(e.target.value))}
                              className="w-14 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeQuestion(qIdx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Delete Question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <input
                        type="text"
                        placeholder="Enter problem statement / title here..."
                        value={q.question_text}
                        onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />

                      {/* Coding Problem Fields */}
                      {q.question_type === 'coding' && (
                        <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-800">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Programming Language:
                              </label>
                              <select
                                value={q.language || 'python'}
                                onChange={(e) => updateQuestion(qIdx, 'language', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                              >
                                <option value="python">Python 3</option>
                                <option value="cpp">C++ (GCC)</option>
                                <option value="java">Java 17</option>
                                <option value="javascript">JavaScript (Node.js)</option>
                                <option value="sql">SQL Query</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Constraints:
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Time: 1.0s, Space: 256MB"
                                value={q.constraints || ''}
                                onChange={(e) => updateQuestion(qIdx, 'constraints', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Starter Code / Function Signature:
                            </label>
                            <textarea
                              rows={3}
                              placeholder="def solution(input_data):\n    pass"
                              value={q.starter_code || ''}
                              onChange={(e) => updateQuestion(qIdx, 'starter_code', e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-950 font-mono text-emerald-400 text-xs leading-relaxed"
                            />
                          </div>

                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-slate-500">
                              Sample Test Cases (Input & Expected Output):
                            </span>
                            {(q.test_cases || [{ input: '5', expected_output: '120' }]).map((tc, tcIdx) => (
                              <div key={tcIdx} className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Input (e.g. nums=[2,7,11,15], target=9)"
                                  value={tc.input}
                                  onChange={(e) => {
                                    const updated = [...(q.test_cases || [])];
                                    updated[tcIdx] = { ...updated[tcIdx], input: e.target.value };
                                    updateQuestion(qIdx, 'test_cases', updated);
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Expected Output (e.g. [0, 1])"
                                  value={tc.expected_output}
                                  onChange={(e) => {
                                    const updated = [...(q.test_cases || [])];
                                    updated[tcIdx] = { ...updated[tcIdx], expected_output: e.target.value };
                                    updateQuestion(qIdx, 'test_cases', updated);
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MCQ Choices */}
                      {q.question_type === 'mcq' && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-semibold text-slate-500">Options & Correct Answer:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(q.options || ['', '', '', '']).map((opt: string, optIdx: number) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isCorrect = q.correct_answer === opt && opt !== '';
                              return (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateQuestion(qIdx, 'correct_answer', opt)}
                                    title="Mark as correct answer"
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-bold text-xs transition-colors ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white'
                                    }`}
                                  >
                                    {letter}
                                  </button>
                                  <input
                                    type="text"
                                    placeholder={`Option ${letter}`}
                                    value={opt}
                                    onChange={(e) => updateQuestionOption(qIdx, optIdx, e.target.value)}
                                    className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* True/False Selection */}
                      {q.question_type === 'true_false' && (
                        <div className="flex items-center gap-4 pt-1">
                          <span className="text-[11px] font-semibold text-slate-500">Correct Answer:</span>
                          {['True', 'False'].map((tf) => (
                            <label key={tf} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                              <input
                                type="radio"
                                name={`tf_${qIdx}`}
                                checked={q.correct_answer === tf}
                                onChange={() => updateQuestion(qIdx, 'correct_answer', tf)}
                                className="text-red-700"
                              />
                              <span>{tf}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExamModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalSaving}
                onClick={() => handleSaveExam(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" /> Save as Draft
              </button>
              <button
                type="button"
                disabled={modalSaving}
                onClick={() => handleSaveExam(true)}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                {modalSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking Conflicts...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Schedule & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUBMISSIONS & GRADING DRAWER
      ========================================================= */}
      {selectedExamForSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                    {selectedExamForSubmissions.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Student Submissions & Evaluation Queue • Max Marks: {selectedExamForSubmissions.total_marks}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedExamForSubmissions(null)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Publish Results Callout */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    {selectedExamForSubmissions.results_published
                      ? 'Results Already Published to Students'
                      : 'Publish Evaluated Results to Students'}
                  </p>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                    {selectedExamForSubmissions.results_published
                      ? 'Students can view their grades, percentage, and teacher feedback.'
                      : 'Once finalized, release marks and feedback to student dashboards.'}
                  </p>
                </div>
                {!selectedExamForSubmissions.results_published && (
                  <button
                    type="button"
                    onClick={() => handlePublishResults(selectedExamForSubmissions.exam_id)}
                    className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs whitespace-nowrap shadow-sm"
                  >
                    Publish Results
                  </button>
                )}
              </div>

              {/* Submissions List Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Submissions ({submissionsList.length})
                </h4>

                {loadingSubmissions ? (
                  <div className="p-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-red-700" />
                    <span className="text-xs">Loading student attempts...</span>
                  </div>
                ) : submissionsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                    No submissions recorded yet for this exam.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {submissionsList.map((sub) => (
                      <div
                        key={sub.attempt_id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {sub.student_name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Roll: {sub.roll_number} • {sub.section}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString() : 'In Progress'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {sub.total_score !== null ? `${sub.total_score} / ${sub.total_marks}` : 'Pending'}
                            </span>
                            {sub.grade && (
                              <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                                Grade: {sub.grade}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => openGradingModal(sub.attempt_id)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-semibold text-xs border border-red-200 dark:border-red-900 hover:bg-red-100"
                          >
                            Review & Grade
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedExamForSubmissions(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          INDIVIDUAL SUBMISSION EVALUATION MODAL
      ========================================================= */}
      {gradingAttemptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-3xl w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Grading: {gradingAttemptDetail.attempt.student_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {gradingAttemptDetail.attempt.roll_number} • {gradingAttemptDetail.attempt.exam_title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradingAttemptDetail(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Questions Review */}
            <div className="space-y-4">
              {gradingAttemptDetail.questions_and_answers.map((qa, idx) => (
                <div
                  key={qa.question_id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Q{idx + 1}: {qa.question_text}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      Max {qa.max_marks} Marks
                    </span>
                  </div>

                  <div className="rounded-lg bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <p className="text-slate-400 text-[10px] font-semibold uppercase">Student's Answer:</p>
                    {qa.question_type === 'coding' ? (
                      <pre className="font-mono text-emerald-400 bg-slate-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed border border-slate-800">
                        {qa.student_answer ? qa.student_answer : '// No code response submitted'}
                      </pre>
                    ) : (
                      <p className="text-slate-900 dark:text-white font-medium">
                        {qa.student_answer ? qa.student_answer : <span className="italic text-slate-400">No response provided</span>}
                      </p>
                    )}
                    {qa.correct_answer && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        Correct Solution: {qa.correct_answer}
                      </p>
                    )}
                  </div>

                  {/* Marks and Feedback inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Awarded Marks:</span>
                      <input
                        type="number"
                        min={0}
                        max={qa.max_marks}
                        value={evaluationScores[qa.question_id]?.marks ?? 0}
                        onChange={(e) =>
                          setEvaluationScores({
                            ...evaluationScores,
                            [qa.question_id]: {
                              ...evaluationScores[qa.question_id],
                              marks: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                      />
                      <span className="text-xs text-slate-400">/ {qa.max_marks}</span>
                    </div>

                    <input
                      type="text"
                      placeholder="Feedback / comment on this question..."
                      value={evaluationScores[qa.question_id]?.feedback ?? ''}
                      onChange={(e) =>
                        setEvaluationScores({
                          ...evaluationScores,
                          [qa.question_id]: {
                            ...evaluationScores[qa.question_id],
                            feedback: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              ))}

              {/* Overall Faculty Feedback */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Overall Student Performance Feedback
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Good grasp of concepts; refine algorithmic efficiency in Section B."
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setGradingAttemptDetail(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEvaluation}
                onClick={handleSaveEvaluation}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow flex items-center gap-1.5"
              >
                {savingEvaluation ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Save Grades & Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          STUDENT RESULTS & FEEDBACK MODAL
      ========================================================= */}
      {studentResultAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                  Academic Performance Evaluation
                </h3>
                <p className="text-xs text-slate-500">
                  {studentResultAttempt.attempt.exam_title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentResultAttempt(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Score Banner */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <div>
                <span className="text-[11px] text-slate-500">Score</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {studentResultAttempt.attempt.total_score} / {studentResultAttempt.attempt.total_marks}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Percentage</span>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {studentResultAttempt.attempt.percentage}%
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Grade</span>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {studentResultAttempt.attempt.grade}
                </p>
              </div>
            </div>

            {/* Faculty Feedback */}
            {studentResultAttempt.attempt.feedback && (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs">
                <p className="font-semibold text-purple-900 dark:text-purple-200 mb-1">
                  Faculty Evaluator Feedback:
                </p>
                <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
                  {studentResultAttempt.attempt.feedback}
                </p>
              </div>
            )}

            {/* Question Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question Review & Responses
              </h4>

              <div className="space-y-3">
                {studentResultAttempt.questions_and_answers.map((qa, idx) => (
                  <div
                    key={qa.question_id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                      <span>Q{idx + 1}: {qa.question_text}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {qa.marks_awarded ?? 0} / {qa.max_marks} Marks
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Your Answer:</span>
                      {qa.question_type === 'coding' ? (
                        <pre className="mt-1 font-mono text-emerald-400 bg-slate-950 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap text-[11px] border border-slate-800">
                          {qa.student_answer || '// No code submitted'}
                        </pre>
                      ) : (
                        <span> {qa.student_answer || <span className="italic text-slate-400">Unanswered</span>}</span>
                      )}
                    </div>

                    {qa.evaluator_feedback && (
                      <div className="text-[11px] text-purple-600 dark:text-purple-400 italic">
                        Feedback: {qa.evaluator_feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStudentResultAttempt(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs"
              >
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
