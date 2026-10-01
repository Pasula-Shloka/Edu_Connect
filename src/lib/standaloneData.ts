/**
 * Institutional Data Store for Standalone / Cloud Deployment
 * Enables KL EduConnect to run smoothly on any device or laptop
 * without requiring a local Node.js or PostgreSQL backend.
 */

export interface StandaloneUser {
  id: string;
  user_id: number;
  email: string;
  full_name: string;
  role: 'student' | 'faculty' | 'admin';
  department?: string;
  year?: string;
  section?: string;
  roll_number?: string;
  status: string;
  created_at: string;
}

const INITIAL_USERS: StandaloneUser[] = [
  {
    id: '1',
    user_id: 1,
    email: 'shloka@klh.edu.in',
    full_name: 'Shloka Reddy',
    role: 'student',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    section: 'Section A',
    roll_number: '2200030001',
    status: 'Active',
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '2',
    user_id: 2,
    email: 'admin@admin.edu.in',
    full_name: 'System Administrator',
    role: 'admin',
    department: 'Platform Operations & Academic Affairs',
    status: 'Active',
    created_at: '2026-08-15T08:00:00Z',
  },
  {
    id: '3',
    user_id: 3,
    email: 'faculty@faculty.edu.in',
    full_name: 'Dr. K. Srinivas Rao',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    status: 'Active',
    created_at: '2026-08-20T08:00:00Z',
  },
  {
    id: '4',
    user_id: 4,
    email: 'ramesh@faculty.edu.in',
    full_name: 'Dr. P. Ramesh Kumar',
    role: 'faculty',
    department: 'Electronics & Communication',
    status: 'Active',
    created_at: '2026-08-25T08:00:00Z',
  },
  {
    id: '5',
    user_id: 5,
    email: 'ananya@klh.edu.in',
    full_name: 'Ananya Sharma',
    role: 'student',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    section: 'Section B',
    roll_number: '2200030045',
    status: 'Active',
    created_at: '2026-09-02T08:00:00Z',
  },
  {
    id: '6',
    user_id: 6,
    email: 'rahul@klh.edu.in',
    full_name: 'Rahul Varma',
    role: 'student',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    section: 'Section A',
    roll_number: '2200030089',
    status: 'Active',
    created_at: '2026-09-02T08:00:00Z',
  },
];

const INITIAL_COURSES = [
  {
    course_id: 1,
    course_code: '22CS3101',
    course_name: 'Database Management Systems',
    description: 'Relational algebra, normal forms (1NF-BCNF), SQL query optimization, transaction processing and ACID properties.',
    faculty_id: 3,
    faculty_name: 'Dr. K. Srinivas Rao',
    department: 'Computer Science & Engineering',
    credits: 4,
  },
  {
    course_id: 2,
    course_code: '22CS3102',
    course_name: 'Data Structures and Algorithms',
    description: 'Balanced trees (AVL, Red-Black), graph algorithms (Dijkstra, Bellman-Ford), and dynamic programming paradigms.',
    faculty_id: 3,
    faculty_name: 'Dr. K. Srinivas Rao',
    department: 'Computer Science & Engineering',
    credits: 4,
  },
  {
    course_id: 3,
    course_code: '22CS3103',
    course_name: 'Operating Systems Principles',
    description: 'Process scheduling, virtualization, deadlock prevention (Coffman conditions), and virtual memory paging.',
    faculty_id: 4,
    faculty_name: 'Dr. P. Ramesh Kumar',
    department: 'Computer Science & Engineering',
    credits: 3,
  },
  {
    course_id: 4,
    course_code: '22CS3104',
    course_name: 'Computer Communication Networks',
    description: 'OSI 7-layer reference model, TCP/IP flow control, routing algorithms and socket programming.',
    faculty_id: 4,
    faculty_name: 'Dr. P. Ramesh Kumar',
    department: 'Computer Science & Engineering',
    credits: 3,
  },
];

const INITIAL_EXAMS = [
  {
    exam_id: 1,
    exam_name: 'DBMS Mid-Semester Examination',
    course_id: 1,
    course_name: 'Database Management Systems',
    course_code: '22CS3101',
    faculty_id: 3,
    target_student_group: 'CSE-2026-A',
    exam_date: '2026-10-15',
    start_time: '10:00',
    end_time: '12:00',
    duration_minutes: 120,
    total_marks: 50,
    instructions: 'All questions are compulsory. Ensure strict academic integrity. Autosave is enabled.',
    status: 'Scheduled',
    questions: [
      {
        question_id: 1,
        question_text: 'Which normal form eliminates transitive functional dependencies?',
        question_type: 'mcq',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correct_answer: '3NF',
        marks: 5,
      },
      {
        question_id: 2,
        question_text: 'Explain the difference between a Candidate Key and a Superkey with an example.',
        question_type: 'short',
        marks: 10,
      },
      {
        question_id: 3,
        question_text: 'Describe the 4 ACID properties of transaction management and how the Write-Ahead Log (WAL) guarantees Atomicity and Durability.',
        question_type: 'descriptive',
        marks: 20,
      },
    ],
  },
  {
    exam_id: 2,
    exam_name: 'Data Structures Lab Exam',
    course_id: 2,
    course_name: 'Data Structures and Algorithms',
    course_code: '22CS3102',
    faculty_id: 3,
    target_student_group: 'CSE-2026-A',
    exam_date: '2026-10-22',
    start_time: '14:00',
    end_time: '16:00',
    duration_minutes: 120,
    total_marks: 50,
    instructions: 'Implement solutions in C++ or Python. Analyze time complexity of your algorithms.',
    status: 'Scheduled',
    questions: [
      {
        question_id: 1,
        question_text: 'What is the worst-case time complexity of binary search in an array of size N?',
        question_type: 'mcq',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
        correct_answer: 'O(log N)',
        marks: 5,
      },
      {
        question_id: 2,
        question_text: 'Write the pseudocode for inserting a new node into a Binary Search Tree.',
        question_type: 'short',
        marks: 15,
      },
    ],
  },
];

const INITIAL_ASSIGNMENTS = [
  {
    assignment_id: 1,
    title: 'Assignment 1: ER Modeling & Schema Design',
    course_id: 1,
    course_code: '22CS3101',
    description: 'Design an Entity-Relationship schema for a hospital management database adhering to BCNF.',
    due_date: '2026-10-18T23:59:00Z',
    max_marks: 25,
    submission_count: 34,
  },
  {
    assignment_id: 2,
    title: 'Assignment 2: Graph Shortest Path Implementation',
    course_id: 2,
    course_code: '22CS3102',
    description: 'Implement Dijkstra and Bellman-Ford algorithms and benchmark their runtimes on random sparse graphs.',
    due_date: '2026-10-25T23:59:00Z',
    max_marks: 30,
    submission_count: 28,
  },
];

const INITIAL_ATTENDANCE = [
  { course_id: 1, course_code: '22CS3101', course_name: 'Database Management Systems', conducted: 32, attended: 28, percentage: 87.5 },
  { course_id: 2, course_code: '22CS3102', course_name: 'Data Structures and Algorithms', conducted: 30, attended: 26, percentage: 86.6 },
  { course_id: 3, course_code: '22CS3103', course_name: 'Operating Systems Principles', conducted: 28, attended: 23, percentage: 82.1 },
  { course_id: 4, course_code: '22CS3104', course_name: 'Computer Communication Networks', conducted: 26, attended: 21, percentage: 80.7 },
];

// Helper to get or initialize persistent data
function getOrInit<T>(key: string, initial: T): T {
  try {
    const val = localStorage.getItem(`educonnect_${key}`);
    if (val) return JSON.parse(val);
  } catch (e) {
    console.warn(`Could not load ${key} from storage:`, e);
  }
  try {
    localStorage.setItem(`educonnect_${key}`, JSON.stringify(initial));
  } catch (e) {}
  return initial;
}

export const standaloneDB = {
  getUsers: (): StandaloneUser[] => getOrInit('users', INITIAL_USERS),
  
  saveUser: (user: Partial<StandaloneUser>): StandaloneUser => {
    const users = standaloneDB.getUsers();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === user.email?.toLowerCase());
    
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
      localStorage.setItem('educonnect_users', JSON.stringify(users));
      return users[existingIndex];
    }
    
    const newUser: StandaloneUser = {
      id: String(Date.now()),
      user_id: users.length + 10,
      email: user.email || '',
      full_name: user.full_name || 'New Member',
      role: user.role || 'student',
      department: user.department || 'Computer Science & Engineering',
      year: user.year || '3rd Year',
      section: user.section || 'Section A',
      roll_number: user.roll_number || `2200030${Math.floor(100 + Math.random() * 900)}`,
      status: user.status || 'Active',
      created_at: new Date().toISOString(),
    };
    
    users.push(newUser);
    localStorage.setItem('educonnect_users', JSON.stringify(users));
    return newUser;
  },

  updateUser: (userId: number, updates: Partial<StandaloneUser>): StandaloneUser | null => {
    const users = standaloneDB.getUsers();
    const index = users.findIndex(u => u.user_id === userId || Number(u.id) === userId);
    if (index >= 0) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem('educonnect_users', JSON.stringify(users));
      return users[index];
    }
    return null;
  },

  getCourses: () => getOrInit('courses', INITIAL_COURSES),
  
  saveCourse: (course: any) => {
    const courses = standaloneDB.getCourses();
    const newCourse = {
      course_id: courses.length + 1,
      ...course,
    };
    courses.push(newCourse);
    localStorage.setItem('educonnect_courses', JSON.stringify(courses));
    return newCourse;
  },

  getExams: () => getOrInit('exams', INITIAL_EXAMS),
  
  saveExam: (exam: any) => {
    const exams = standaloneDB.getExams();
    const newExam = {
      exam_id: exams.length + 1,
      status: 'Scheduled',
      ...exam,
    };
    exams.push(newExam);
    localStorage.setItem('educonnect_exams', JSON.stringify(exams));
    return newExam;
  },

  getAssignments: () => getOrInit('assignments', INITIAL_ASSIGNMENTS),
  
  saveAssignment: (assignment: any) => {
    const list = standaloneDB.getAssignments();
    const newItem = {
      assignment_id: list.length + 1,
      submission_count: 0,
      ...assignment,
    };
    list.push(newItem);
    localStorage.setItem('educonnect_assignments', JSON.stringify(list));
    return newItem;
  },

  getAttendance: () => getOrInit('attendance', INITIAL_ATTENDANCE),
};
