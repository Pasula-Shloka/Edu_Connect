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

const INITIAL_LIVE_CLASSES = [
  {
    live_class_id: 1,
    course_id: 1,
    course_code: '22CS3101',
    course_name: 'Database Management Systems',
    faculty_id: 3,
    faculty_name: 'Dr. K. Srinivas Rao',
    title: 'Transaction Management & ACID Implementation',
    description: 'Interactive lecture on two-phase locking, dirty reads, and recovery algorithms.',
    room_name: 'KLEduConnect-DBMS-Lecture-1',
    start_time: new Date(Date.now() - 15 * 60000).toISOString(),
    end_time: null,
    status: 'live',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    live_class_id: 2,
    course_id: 2,
    course_code: '22CS3102',
    course_name: 'Data Structures and Algorithms',
    faculty_id: 3,
    faculty_name: 'Dr. K. Srinivas Rao',
    title: 'Dynamic Programming: 0/1 Knapsack & Bellman-Ford',
    description: 'Upcoming problem-solving session for mid-semester exam preparation.',
    room_name: 'KLEduConnect-DSA-Lecture-2',
    start_time: new Date(Date.now() + 120 * 60000).toISOString(),
    end_time: null,
    status: 'scheduled',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_RESOURCES = [
  {
    resource_id: 1,
    course_id: 1,
    unit_id: 1,
    title: 'Unit 1: Relational Algebra & SQL Query Optimization Slides',
    description: 'Official lecture presentation slides with solved sample queries.',
    resource_type: 'slide',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    resource_id: 2,
    course_id: 1,
    unit_id: 2,
    title: 'Normalization Deep Dive: 1NF to BCNF Cheatsheet',
    description: 'Comprehensive study guide with functional dependency decomposition rules.',
    resource_type: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    created_at: '2026-09-15T11:00:00Z',
  },
  {
    resource_id: 3,
    course_id: 2,
    unit_id: 1,
    title: 'AVL Trees & Red-Black Tree Rotation Visualizations',
    description: 'Visual reference guide detailing left and right rotation cases.',
    resource_type: 'document',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    created_at: '2026-09-18T09:30:00Z',
  },
];

const INITIAL_DISCUSSIONS = [
  {
    discussion_id: 1,
    course_id: 1,
    course_name: 'Database Management Systems',
    course_code: '22CS3101',
    user_id: 1,
    user_name: 'Shloka Reddy',
    user_role: 'student',
    title: 'When to prefer B-Tree Index over Hash Index in PostgreSQL?',
    content: 'In our lab session, we noticed range queries (e.g. BETWEEN or >) were not using Hash indexes. Why is B-Tree preferred for range queries?',
    created_at: '2026-09-27T16:00:00Z',
    reply_count: 2,
  },
  {
    discussion_id: 2,
    course_id: 2,
    course_name: 'Data Structures and Algorithms',
    course_code: '22CS3102',
    user_id: 3,
    user_name: 'Dr. K. Srinivas Rao',
    user_role: 'faculty',
    title: 'Clarification on Dijkstra vs Bellman-Ford for negative edge weights',
    content: 'Please remember that Dijkstra will produce incorrect shortest path trees when negative edge cycles exist. Always check your graph constraints before selecting the algorithm.',
    created_at: '2026-09-28T09:00:00Z',
    reply_count: 4,
  },
];

const INITIAL_GROUPS = [
  {
    group_id: 1,
    name: 'DBMS Research Circle',
    group_name: 'DBMS Research Circle',
    description: 'Collaborative group for query tuning, ER diagrams, and normalization review.',
    course_id: 1,
    course_name: 'Database Management Systems',
    course_code: '22CS3101',
    created_by: 1,
    member_count: 5,
    members: [
      { user_id: 1, full_name: 'Shloka Reddy', role: 'Leader' },
      { user_id: 5, full_name: 'Ananya Sharma', role: 'Member' },
      { user_id: 6, full_name: 'Rahul Varma', role: 'Member' },
    ],
  },
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

  getLiveClasses: () => getOrInit('live_classes', INITIAL_LIVE_CLASSES),
  saveLiveClass: (item: any) => {
    const list = standaloneDB.getLiveClasses();
    const newClass = {
      live_class_id: list.length + 1,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      ...item,
    };
    list.unshift(newClass);
    localStorage.setItem('educonnect_live_classes', JSON.stringify(list));
    return newClass;
  },

  getResources: (courseId?: number) => {
    const all = getOrInit('resources', INITIAL_RESOURCES);
    if (!courseId) return all;
    return all.filter((r: any) => Number(r.course_id) === Number(courseId));
  },
  saveResource: (item: any) => {
    const list = standaloneDB.getResources();
    const newRes = {
      resource_id: list.length + 1,
      created_at: new Date().toISOString(),
      ...item,
    };
    list.unshift(newRes);
    localStorage.setItem('educonnect_resources', JSON.stringify(list));
    return newRes;
  },

  getDiscussions: () => getOrInit('discussions', INITIAL_DISCUSSIONS),
  saveDiscussion: (item: any) => {
    const list = standaloneDB.getDiscussions();
    const newDisc = {
      discussion_id: list.length + 1,
      reply_count: 0,
      created_at: new Date().toISOString(),
      ...item,
    };
    list.unshift(newDisc);
    localStorage.setItem('educonnect_discussions', JSON.stringify(list));
    return newDisc;
  },

  getGroups: () => getOrInit('groups', INITIAL_GROUPS),
  saveGroup: (item: any) => {
    const list = standaloneDB.getGroups();
    const newGrp = {
      group_id: list.length + 1,
      member_count: 1,
      created_at: new Date().toISOString(),
      ...item,
    };
    list.unshift(newGrp);
    localStorage.setItem('educonnect_groups', JSON.stringify(list));
    return newGrp;
  },
};
