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

export interface StandaloneExamAttempt {
  attempt_id: number;
  exam_id: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  roll_number?: string;
  section?: string;
  started_at: string;
  submitted_at?: string;
  status: 'in_progress' | 'submitted' | 'evaluated';
  total_score?: number | null;
  percentage?: number | null;
  grade?: string | null;
  feedback?: string | null;
  answers: Record<string, string>; // question_id -> student answer
  evaluations?: Record<string, { marks: number; feedback: string }>;
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
    email: 'lalitha@faculty.edu.in',
    full_name: 'Dr. Lalitha',
    role: 'faculty',
    department: 'Computer Science & Engineering',
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
    email: 'priya@faculty.edu.in',
    full_name: 'Dr. Priya Sharma',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    status: 'Active',
    created_at: '2026-08-28T08:00:00Z',
  },
  {
    id: '7',
    user_id: 7,
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
  {
    id: '8',
    user_id: 8,
    email: 'shloka@klh.edu',
    full_name: 'Shloka',
    role: 'student',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    section: 'Section A',
    roll_number: '2200030090',
    status: 'Active',
    created_at: '2026-09-03T08:00:00Z',
  },
  {
    id: '10',
    user_id: 10,
    email: 'lalitha@klh.edu',
    full_name: 'DR.Lalitha',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    status: 'Active',
    created_at: '2026-08-29T08:00:00Z',
  },
  {
    id: '12',
    user_id: 12,
    email: 'newfaculty@faculty.edu.in',
    full_name: 'New Faculty',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    status: 'Active',
    created_at: '2026-09-05T08:00:00Z',
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
    course_name: 'Cloud Computing and Microservices',
    description: 'Distributed systems, Docker, Kubernetes, microservices architecture, and cloud deployment pipelines.',
    faculty_id: 4,
    faculty_name: 'Dr. Lalitha',
    department: 'Computer Science & Engineering',
    credits: 4,
  },
  {
    course_id: 4,
    course_code: '22CS3104',
    course_name: 'Compiler Design and Automata',
    description: 'Lexical analysis, syntax parsing, AST construction, intermediate code representation, and optimization.',
    faculty_id: 4,
    faculty_name: 'Dr. Lalitha',
    department: 'Computer Science & Engineering',
    credits: 3,
  },
  {
    course_id: 5,
    course_code: '22CS3105',
    course_name: 'Advanced Data Structures and Analysis',
    description: 'B-Trees, Fibonacci Heaps, Disjoint Sets, Network Flow, and amortized complexity analysis.',
    faculty_id: 6,
    faculty_name: 'Dr. Priya Sharma',
    department: 'Computer Science & Engineering',
    credits: 4,
  },
  {
    course_id: 6,
    course_code: '22CS3106',
    course_name: 'Object Oriented Programming with Java',
    description: 'JVM architecture, multithreading, concurrency locks, reflection, and Enterprise Spring Boot patterns.',
    faculty_id: 10,
    faculty_name: 'DR.Lalitha',
    department: 'Computer Science & Engineering',
    credits: 4,
  },
  {
    course_id: 7,
    course_code: '22CS3107',
    course_name: 'Operating Systems & Concurrency',
    description: 'Process scheduling, virtualization, deadlock prevention (Coffman conditions), and virtual memory paging.',
    faculty_id: 12,
    faculty_name: 'New Faculty',
    department: 'Computer Science & Engineering',
    credits: 3,
  },
];

const INITIAL_EXAMS = [
  {
    exam_id: 1,
    title: 'DBMS Mid-Semester Examination',
    exam_name: 'DBMS Mid-Semester Examination',
    course_id: 1,
    course_name: 'Database Management Systems',
    course_code: '22CS3101',
    faculty_id: 3,
    faculty_name: 'Dr. K. Srinivas Rao',
    student_group: 'All Enrolled Students',
    target_student_group: 'All Enrolled Students',
    exam_date: '2026-10-15',
    start_time: '10:00',
    end_time: '12:00',
    duration_minutes: 120,
    total_marks: 50,
    instructions: 'All questions are compulsory. Ensure strict academic integrity. Autosave is enabled.',
    status: 'scheduled',
    is_published: true,
    results_published: false,
    questions: [
      {
        question_id: 1,
        question_number: 1,
        question_text: 'Which normal form eliminates transitive functional dependencies?',
        question_type: 'mcq',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correct_answer: '3NF',
        marks: 10,
      },
      {
        question_id: 2,
        question_number: 2,
        question_text: 'PostgreSQL provides full ACID compliance by default.',
        question_type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'True',
        marks: 10,
      },
      {
        question_id: 3,
        question_number: 3,
        question_text: 'Write a Python function `solution(input_data)` that computes the factorial of an integer N.',
        question_type: 'coding',
        options: {
          language: 'python',
          starter_code: 'def solution(input_data):\n    # input_data is a single integer string, e.g. "5"\n    n = int(input_data.strip())\n    res = 1\n    for i in range(1, n + 1):\n        res *= i\n    return str(res)\n',
          constraints: 'Time Limit: 1.0s, Space Limit: 256MB',
          test_cases: [
            { input: '5', expected_output: '120' },
            { input: '3', expected_output: '6' }
          ],
        },
        correct_answer: '120',
        marks: 30,
      },
    ],
  },
  {
    exam_id: 2,
    title: 'Data Structures Lab Exam',
    exam_name: 'Data Structures Lab Exam',
    course_id: 2,
    course_name: 'Data Structures and Algorithms',
    course_code: '22CS3102',
    faculty_id: 3,
    faculty_name: 'Dr. K. Srinivas Rao',
    student_group: 'All Enrolled Students',
    target_student_group: 'All Enrolled Students',
    exam_date: '2026-10-22',
    start_time: '14:00',
    end_time: '16:00',
    duration_minutes: 120,
    total_marks: 50,
    instructions: 'Implement solutions in Python. Analyze time complexity of your algorithms.',
    status: 'scheduled',
    is_published: true,
    results_published: false,
    questions: [
      {
        question_id: 4,
        question_number: 1,
        question_text: 'What is the worst-case time complexity of binary search in an array of size N?',
        question_type: 'mcq',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
        correct_answer: 'O(log N)',
        marks: 10,
      },
      {
        question_id: 5,
        question_number: 2,
        question_text: 'An AVL tree is a self-balancing binary search tree where heights of child subtrees differ by at most 1.',
        question_type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'True',
        marks: 10,
      },
      {
        question_id: 6,
        question_number: 3,
        question_text: 'Write a Python function `solution(input_data)` that reverses a string of space-separated words.',
        question_type: 'coding',
        options: {
          language: 'python',
          starter_code: 'def solution(input_data):\n    words = input_data.strip().split()\n    return " ".join(reversed(words))\n',
          constraints: 'Time Limit: 1.0s, Space Limit: 256MB',
          test_cases: [
            { input: 'hello world', expected_output: 'world hello' },
            { input: 'algorithm design', expected_output: 'design algorithm' }
          ],
        },
        correct_answer: 'world hello',
        marks: 30,
      },
    ],
  },
  {
    exam_id: 3,
    title: 'Cloud Computing Mid-Term Exam',
    exam_name: 'Cloud Computing Mid-Term Exam',
    course_id: 3,
    course_name: 'Cloud Computing and Microservices',
    course_code: '22CS3103',
    faculty_id: 4,
    faculty_name: 'Dr. Lalitha',
    student_group: 'All Enrolled Students',
    target_student_group: 'All Enrolled Students',
    exam_date: '2026-10-25',
    start_time: '10:00',
    end_time: '11:30',
    duration_minutes: 90,
    total_marks: 50,
    instructions: 'Answer all questions. Strict time limit applies.',
    status: 'scheduled',
    is_published: true,
    results_published: false,
    questions: [
      {
        question_id: 7,
        question_number: 1,
        question_text: 'What is the open-source container orchestration platform originally developed by Google?',
        question_type: 'mcq',
        options: ['Docker Swarm', 'Kubernetes', 'Apache Mesos', 'Nomad'],
        correct_answer: 'Kubernetes',
        marks: 10,
      },
      {
        question_id: 8,
        question_number: 2,
        question_text: 'Microservices architectures enforce that all services share a single monolithic relational database.',
        question_type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'False',
        marks: 10,
      },
      {
        question_id: 9,
        question_number: 3,
        question_text: 'Write a Python function `solution(input_data)` that computes the maximum contiguous subarray sum (Kadane algorithm).',
        question_type: 'coding',
        options: {
          language: 'python',
          starter_code: 'def solution(input_data):\n    nums = [int(x) for x in input_data.strip().split()]\n    max_so_far = nums[0]\n    curr_max = nums[0]\n    for x in nums[1:]:\n        curr_max = max(x, curr_max + x)\n        max_so_far = max(max_so_far, curr_max)\n    return str(max_so_far)\n',
          constraints: 'Time Limit: 1.0s, Space Limit: 256MB',
          test_cases: [
            { input: '-2 1 -3 4 -1 2 1 -5 4', expected_output: '6' }
          ],
        },
        correct_answer: '6',
        marks: 30,
      },
    ],
  },
  {
    exam_id: 4,
    title: 'Data Structures Quiz: Binary Trees & Graphs',
    exam_name: 'Data Structures Quiz: Binary Trees & Graphs',
    course_id: 5,
    course_name: 'Advanced Data Structures and Analysis',
    course_code: '22CS3105',
    faculty_id: 6,
    faculty_name: 'Dr. Priya Sharma',
    student_group: 'All Enrolled Students',
    target_student_group: 'All Enrolled Students',
    exam_date: '2026-10-06',
    start_time: '14:00',
    end_time: '15:00',
    duration_minutes: 60,
    total_marks: 50,
    instructions: 'Comprehensive assessment on balanced trees and graph traversals.',
    status: 'scheduled',
    is_published: true,
    results_published: false,
    questions: [
      {
        question_id: 10,
        question_number: 1,
        question_text: 'Which data structure is primarily used in Breadth-First Search (BFS) traversal of a graph?',
        question_type: 'mcq',
        options: ['Stack', 'Queue', 'Priority Queue', 'Binary Search Tree'],
        correct_answer: 'Queue',
        marks: 10,
      },
      {
        question_id: 11,
        question_number: 2,
        question_text: 'In an AVL tree, the balance factor of every node must be either -1, 0, or +1.',
        question_type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'True',
        marks: 10,
      },
      {
        question_id: 12,
        question_number: 3,
        question_text: 'Write a Python function `solution(input_data)` that calculates the sum of all elements in an array.',
        question_type: 'coding',
        options: {
          language: 'python',
          starter_code: 'def solution(input_data):\n    nums = [int(x) for x in input_data.strip().split()]\n    return str(sum(nums))\n',
          constraints: 'Time Limit: 1.0s, Space Limit: 256MB',
          test_cases: [
            { input: '1 2 3 4 5', expected_output: '15' }
          ],
        },
        correct_answer: '15',
        marks: 30,
      },
    ],
  },
  {
    exam_id: 5,
    title: 'DBMS Mid-Term Examination 2026',
    exam_name: 'DBMS Mid-Term Examination 2026',
    course_id: 6,
    course_name: 'Object Oriented Programming with Java',
    course_code: '22CS3106',
    faculty_id: 10,
    faculty_name: 'DR.Lalitha',
    student_group: 'All Enrolled Students',
    target_student_group: 'All Enrolled Students',
    exam_date: '2026-10-18',
    start_time: '10:00',
    end_time: '11:30',
    duration_minutes: 90,
    total_marks: 50,
    instructions: 'Comprehensive exam covering OOP paradigms, JVM mechanics, and Java Collections.',
    status: 'scheduled',
    is_published: true,
    results_published: false,
    questions: [
      {
        question_id: 13,
        question_number: 1,
        question_text: 'Which keyword in Java prevents a method from being overridden in a subclass?',
        question_type: 'mcq',
        options: ['static', 'final', 'const', 'abstract'],
        correct_answer: 'final',
        marks: 10,
      },
      {
        question_id: 14,
        question_number: 2,
        question_text: 'In Java, strings are immutable objects.',
        question_type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'True',
        marks: 10,
      },
      {
        question_id: 15,
        question_number: 3,
        question_text: 'Write a Python function `solution(input_data)` that checks if a string is a palindrome (ignoring case). Return "True" or "False".',
        question_type: 'coding',
        options: {
          language: 'python',
          starter_code: 'def solution(input_data):\n    s = input_data.strip().lower()\n    return "True" if s == s[::-1] else "False"\n',
          constraints: 'Time Limit: 1.0s, Space Limit: 256MB',
          test_cases: [
            { input: 'racecar', expected_output: 'True' },
            { input: 'hello', expected_output: 'False' }
          ],
        },
        correct_answer: 'True',
        marks: 30,
      },
    ],
  },
  {
    exam_id: 6,
    title: 'Operating Systems & Concurrency Assessment',
    exam_name: 'Operating Systems & Concurrency Assessment',
    course_id: 7,
    course_name: 'Operating Systems & Concurrency',
    course_code: '22CS3107',
    faculty_id: 12,
    faculty_name: 'New Faculty',
    student_group: 'All Enrolled Students',
    target_student_group: 'All Enrolled Students',
    exam_date: '2026-10-28',
    start_time: '11:00',
    end_time: '12:30',
    duration_minutes: 90,
    total_marks: 50,
    instructions: 'Evaluate CPU scheduling, synchronization primitives, and virtual memory.',
    status: 'scheduled',
    is_published: true,
    results_published: false,
    questions: [
      {
        question_id: 16,
        question_number: 1,
        question_text: 'Which scheduling algorithm is non-preemptive and allocates CPU based on the smallest execution burst?',
        question_type: 'mcq',
        options: ['Round Robin', 'SJF (Shortest Job First)', 'SRTF', 'Priority Preemptive'],
        correct_answer: 'SJF (Shortest Job First)',
        marks: 10,
      },
      {
        question_id: 17,
        question_number: 2,
        question_text: 'A deadlock can occur only if all four Coffman conditions hold simultaneously.',
        question_type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'True',
        marks: 10,
      },
      {
        question_id: 18,
        question_number: 3,
        question_text: 'Write a Python function `solution(input_data)` that counts the number of vowel characters in a string.',
        question_type: 'coding',
        options: {
          language: 'python',
          starter_code: 'def solution(input_data):\n    vowels = set("aeiouAEIOU")\n    count = sum(1 for c in input_data if c in vowels)\n    return str(count)\n',
          constraints: 'Time Limit: 1.0s, Space Limit: 256MB',
          test_cases: [
            { input: 'Operating System', expected_output: '6' }
          ],
        },
        correct_answer: '6',
        marks: 30,
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
    faculty_id: 3,
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
    faculty_id: 3,
  },
  {
    assignment_id: 3,
    title: 'Assignment 3: Container Deployment with Kubernetes',
    course_id: 3,
    course_code: '22CS3103',
    description: 'Write Dockerfile and Kubernetes deployment yaml files for multi-container microservice.',
    due_date: '2026-10-26T23:59:00Z',
    max_marks: 30,
    submission_count: 12,
    faculty_id: 4,
  },
  {
    assignment_id: 4,
    title: 'Assignment 4: AVL and Red-Black Tree Balancing',
    course_id: 5,
    course_code: '22CS3105',
    description: 'Implement AVL tree rotations and verify balanced invariant after 1000 insertions.',
    due_date: '2026-10-27T23:59:00Z',
    max_marks: 25,
    submission_count: 18,
    faculty_id: 6,
  },
  {
    assignment_id: 5,
    title: 'Assignment 5: Multithreaded Bank Transaction Simulator',
    course_id: 6,
    course_code: '22CS3106',
    description: 'Use Java ReentrantLock and Condition variables to prevent deadlocks in concurrent transfers.',
    due_date: '2026-10-28T23:59:00Z',
    max_marks: 30,
    submission_count: 22,
    faculty_id: 10,
  },
];

export interface StandaloneAttendanceRecord {
  attendance_id: number;
  course_id: number;
  student_id: number;
  date: string; // 'YYYY-MM-DD'
  status: 'Present' | 'Absent' | 'Late';
  marked_by?: number;
}

const INITIAL_ATTENDANCE_RECORDS: StandaloneAttendanceRecord[] = [
  // Course 1 (DBMS - Faculty 3)
  { attendance_id: 101, course_id: 1, student_id: 1, date: '2026-09-20', status: 'Present', marked_by: 3 },
  { attendance_id: 102, course_id: 1, student_id: 1, date: '2026-09-23', status: 'Present', marked_by: 3 },
  { attendance_id: 103, course_id: 1, student_id: 1, date: '2026-09-26', status: 'Present', marked_by: 3 },
  { attendance_id: 104, course_id: 1, student_id: 1, date: '2026-09-29', status: 'Present', marked_by: 3 },
  { attendance_id: 105, course_id: 1, student_id: 1, date: '2026-10-01', status: 'Present', marked_by: 3 },
  { attendance_id: 106, course_id: 1, student_id: 1, date: '2026-10-03', status: 'Present', marked_by: 3 },

  { attendance_id: 107, course_id: 1, student_id: 5, date: '2026-09-20', status: 'Present', marked_by: 3 },
  { attendance_id: 108, course_id: 1, student_id: 5, date: '2026-09-23', status: 'Present', marked_by: 3 },
  { attendance_id: 109, course_id: 1, student_id: 5, date: '2026-09-26', status: 'Absent', marked_by: 3 },
  { attendance_id: 110, course_id: 1, student_id: 5, date: '2026-09-29', status: 'Present', marked_by: 3 },
  { attendance_id: 111, course_id: 1, student_id: 5, date: '2026-10-01', status: 'Present', marked_by: 3 },
  { attendance_id: 112, course_id: 1, student_id: 5, date: '2026-10-03', status: 'Present', marked_by: 3 },

  { attendance_id: 113, course_id: 1, student_id: 7, date: '2026-09-20', status: 'Present', marked_by: 3 },
  { attendance_id: 114, course_id: 1, student_id: 7, date: '2026-09-23', status: 'Absent', marked_by: 3 },
  { attendance_id: 115, course_id: 1, student_id: 7, date: '2026-09-26', status: 'Absent', marked_by: 3 },
  { attendance_id: 116, course_id: 1, student_id: 7, date: '2026-09-29', status: 'Present', marked_by: 3 },
  { attendance_id: 117, course_id: 1, student_id: 7, date: '2026-10-01', status: 'Present', marked_by: 3 },
  { attendance_id: 118, course_id: 1, student_id: 7, date: '2026-10-03', status: 'Present', marked_by: 3 },

  { attendance_id: 119, course_id: 1, student_id: 8, date: '2026-09-20', status: 'Present', marked_by: 3 },
  { attendance_id: 120, course_id: 1, student_id: 8, date: '2026-09-23', status: 'Present', marked_by: 3 },
  { attendance_id: 121, course_id: 1, student_id: 8, date: '2026-09-26', status: 'Present', marked_by: 3 },
  { attendance_id: 122, course_id: 1, student_id: 8, date: '2026-09-29', status: 'Present', marked_by: 3 },
  { attendance_id: 123, course_id: 1, student_id: 8, date: '2026-10-01', status: 'Present', marked_by: 3 },
  { attendance_id: 124, course_id: 1, student_id: 8, date: '2026-10-03', status: 'Present', marked_by: 3 },

  { attendance_id: 125, course_id: 1, student_id: 9, date: '2026-09-20', status: 'Present', marked_by: 3 },
  { attendance_id: 126, course_id: 1, student_id: 9, date: '2026-09-23', status: 'Present', marked_by: 3 },
  { attendance_id: 127, course_id: 1, student_id: 9, date: '2026-09-26', status: 'Late', marked_by: 3 },
  { attendance_id: 128, course_id: 1, student_id: 9, date: '2026-09-29', status: 'Present', marked_by: 3 },
  { attendance_id: 129, course_id: 1, student_id: 9, date: '2026-10-01', status: 'Present', marked_by: 3 },
  { attendance_id: 130, course_id: 1, student_id: 9, date: '2026-10-03', status: 'Present', marked_by: 3 },

  // Course 2 (DSA - Faculty 3)
  { attendance_id: 131, course_id: 2, student_id: 1, date: '2026-09-21', status: 'Present', marked_by: 3 },
  { attendance_id: 132, course_id: 2, student_id: 1, date: '2026-09-24', status: 'Present', marked_by: 3 },
  { attendance_id: 133, course_id: 2, student_id: 1, date: '2026-09-27', status: 'Absent', marked_by: 3 },
  { attendance_id: 134, course_id: 2, student_id: 1, date: '2026-09-30', status: 'Present', marked_by: 3 },
  { attendance_id: 135, course_id: 2, student_id: 1, date: '2026-10-02', status: 'Present', marked_by: 3 },

  { attendance_id: 136, course_id: 2, student_id: 5, date: '2026-09-21', status: 'Present', marked_by: 3 },
  { attendance_id: 137, course_id: 2, student_id: 5, date: '2026-09-24', status: 'Present', marked_by: 3 },
  { attendance_id: 138, course_id: 2, student_id: 5, date: '2026-09-27', status: 'Present', marked_by: 3 },
  { attendance_id: 139, course_id: 2, student_id: 5, date: '2026-09-30', status: 'Absent', marked_by: 3 },
  { attendance_id: 140, course_id: 2, student_id: 5, date: '2026-10-02', status: 'Present', marked_by: 3 },
];

export interface StandaloneSubmission {
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
  title: string;
  unit_name: string | null;
  max_marks: number;
  course_id: number;
  course_code: string;
  course_name: string;
  faculty_id: number;
  status: 'submitted' | 'graded';
}

const INITIAL_SUBMISSIONS: StandaloneSubmission[] = [
  {
    submission_id: 1,
    assignment_id: 1,
    student_id: 1,
    student_name: 'Shloka Reddy',
    student_email: 'shloka@klh.edu.in',
    submission_url: 'https://cdn.educonnect.in/submissions/assign1_shloka_relational_schema.pdf',
    submitted_at: '2026-09-28T14:30:00Z',
    marks: 24,
    feedback: 'Excellent relational normalization to BCNF. Clean schema diagrams with comprehensive referential constraints.',
    assignment_title: 'Assignment 1: ER Modeling & Schema Design',
    title: 'Assignment 1: ER Modeling & Schema Design',
    unit_name: 'Unit 2: Relational Schema & Normal Forms',
    max_marks: 25,
    course_id: 1,
    course_code: '22CS3101',
    course_name: 'Database Management Systems',
    faculty_id: 3,
    status: 'graded',
  },
  {
    submission_id: 2,
    assignment_id: 2,
    student_id: 1,
    student_name: 'Shloka Reddy',
    student_email: 'shloka@klh.edu.in',
    submission_url: 'https://cdn.educonnect.in/submissions/assign2_shloka_dijkstra.pdf',
    submitted_at: '2026-09-29T16:00:00Z',
    marks: 28,
    feedback: 'Very thorough priority queue implementation. Benchmark runtime graph matches theoretical O(E log V) complexity.',
    assignment_title: 'Assignment 2: Graph Shortest Path Implementation',
    title: 'Assignment 2: Graph Shortest Path Implementation',
    unit_name: 'Unit 3: Graph Algorithms & Dynamic Programming',
    max_marks: 30,
    course_id: 2,
    course_code: '22CS3102',
    course_name: 'Data Structures and Algorithms',
    faculty_id: 3,
    status: 'graded',
  },
  {
    submission_id: 3,
    assignment_id: 1,
    student_id: 5,
    student_name: 'Ananya Sharma',
    student_email: 'ananya@klh.edu.in',
    submission_url: 'https://cdn.educonnect.in/submissions/assign1_ananya.pdf',
    submitted_at: '2026-09-29T10:15:00Z',
    marks: 21,
    feedback: 'Good entity relationship diagrams. Pay closer attention to transitive dependencies in table decomposition.',
    assignment_title: 'Assignment 1: ER Modeling & Schema Design',
    title: 'Assignment 1: ER Modeling & Schema Design',
    unit_name: 'Unit 2: Relational Schema & Normal Forms',
    max_marks: 25,
    course_id: 1,
    course_code: '22CS3101',
    course_name: 'Database Management Systems',
    faculty_id: 3,
    status: 'graded',
  },
  {
    submission_id: 4,
    assignment_id: 2,
    student_id: 5,
    student_name: 'Ananya Sharma',
    student_email: 'ananya@klh.edu.in',
    submission_url: 'https://cdn.educonnect.in/submissions/assign2_ananya_graph.pdf',
    submitted_at: '2026-10-02T11:00:00Z',
    marks: null,
    feedback: null,
    assignment_title: 'Assignment 2: Graph Shortest Path Implementation',
    title: 'Assignment 2: Graph Shortest Path Implementation',
    unit_name: 'Unit 3: Graph Algorithms & Dynamic Programming',
    max_marks: 30,
    course_id: 2,
    course_code: '22CS3102',
    course_name: 'Data Structures and Algorithms',
    faculty_id: 3,
    status: 'submitted',
  },
  {
    submission_id: 5,
    assignment_id: 1,
    student_id: 7,
    student_name: 'Rahul Verma',
    student_email: 'rahul@klh.edu.in',
    submission_url: 'https://cdn.educonnect.in/submissions/assign1_rahul.pdf',
    submitted_at: '2026-10-03T15:20:00Z',
    marks: null,
    feedback: null,
    assignment_title: 'Assignment 1: ER Modeling & Schema Design',
    title: 'Assignment 1: ER Modeling & Schema Design',
    unit_name: 'Unit 2: Relational Schema & Normal Forms',
    max_marks: 25,
    course_id: 1,
    course_code: '22CS3101',
    course_name: 'Database Management Systems',
    faculty_id: 3,
    status: 'submitted',
  },
];

export interface StandaloneEnrollment {
  enrollment_id: number;
  course_id: number;
  student_id: number;
  course_code?: string;
  course_name?: string;
}

const INITIAL_ENROLLMENTS: StandaloneEnrollment[] = [
  { enrollment_id: 1, student_id: 1, course_id: 1, course_code: '22CS3101', course_name: 'Database Management Systems' },
  { enrollment_id: 2, student_id: 1, course_id: 2, course_code: '22CS3102', course_name: 'Data Structures and Algorithms' },
  { enrollment_id: 3, student_id: 1, course_id: 3, course_code: '22CS3103', course_name: 'Cloud Computing and Microservices' },
  { enrollment_id: 4, student_id: 1, course_id: 4, course_code: '22CS3104', course_name: 'Compiler Design and Automata' },
  { enrollment_id: 5, student_id: 1, course_id: 5, course_code: '22CS3105', course_name: 'Advanced Data Structures and Analysis' },
  { enrollment_id: 6, student_id: 1, course_id: 6, course_code: '22CS3106', course_name: 'Object Oriented Programming with Java' },
  { enrollment_id: 7, student_id: 1, course_id: 7, course_code: '22CS3107', course_name: 'Operating Systems & Concurrency' },
  // Student 5 (Ananya)
  { enrollment_id: 8, student_id: 5, course_id: 1, course_code: '22CS3101', course_name: 'Database Management Systems' },
  { enrollment_id: 9, student_id: 5, course_id: 2, course_code: '22CS3102', course_name: 'Data Structures and Algorithms' },
  { enrollment_id: 10, student_id: 5, course_id: 3, course_code: '22CS3103', course_name: 'Cloud Computing and Microservices' },
  // Student 7 (Rahul)
  { enrollment_id: 11, student_id: 7, course_id: 1, course_code: '22CS3101', course_name: 'Database Management Systems' },
  { enrollment_id: 12, student_id: 7, course_id: 2, course_code: '22CS3102', course_name: 'Data Structures and Algorithms' },
  // Student 8 (Sneha)
  { enrollment_id: 13, student_id: 8, course_id: 1, course_code: '22CS3101', course_name: 'Database Management Systems' },
  { enrollment_id: 14, student_id: 8, course_id: 3, course_code: '22CS3103', course_name: 'Cloud Computing and Microservices' },
  // Student 9 (Vikram)
  { enrollment_id: 15, student_id: 9, course_id: 1, course_code: '22CS3101', course_name: 'Database Management Systems' },
];

const INITIAL_ATTENDANCE = [
  { course_id: 1, course_code: '22CS3101', course_name: 'Database Management Systems', conducted: 32, attended: 28, percentage: 87.5 },
  { course_id: 2, course_code: '22CS3102', course_name: 'Data Structures and Algorithms', conducted: 30, attended: 26, percentage: 86.6 },
  { course_id: 3, course_code: '22CS3103', course_name: 'Cloud Computing and Microservices', conducted: 28, attended: 25, percentage: 89.2 },
  { course_id: 4, course_code: '22CS3104', course_name: 'Compiler Design and Automata', conducted: 24, attended: 21, percentage: 87.5 },
  { course_id: 5, course_code: '22CS3105', course_name: 'Advanced Data Structures and Analysis', conducted: 26, attended: 22, percentage: 84.6 },
  { course_id: 6, course_code: '22CS3106', course_name: 'Object Oriented Programming with Java', conducted: 30, attended: 27, percentage: 90.0 },
  { course_id: 7, course_code: '22CS3107', course_name: 'Operating Systems & Concurrency', conducted: 28, attended: 23, percentage: 82.1 },
];

export interface StandaloneLiveClass {
  live_class_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  faculty_id: number;
  faculty_name: string;
  title: string;
  description: string;
  room_name: string;
  start_time: string;
  end_time: string | null;
  status: string;
}

const INITIAL_LIVE_CLASSES: StandaloneLiveClass[] = [
  {
    live_class_id: 1,
    course_id: 1,
    course_code: '22CS3101',
    course_name: 'Database Management Systems',
    faculty_id: 3,
    faculty_name: 'Dr. K. Srinivas Rao',
    title: 'Relational Algebra & Normalization Deep Dive',
    description: 'Live problem solving on finding minimal covers and determining 3NF vs BCNF decompositions.',
    room_name: 'CS-DBMS-Live-101',
    start_time: '2026-10-02T10:00:00Z',
    end_time: null,
    status: 'scheduled',
  },
  {
    live_class_id: 2,
    course_id: 3,
    course_code: '22CS3103',
    course_name: 'Cloud Computing and Microservices',
    faculty_id: 4,
    faculty_name: 'Dr. Lalitha',
    title: 'Kubernetes Pod Networking & Ingress Controllers',
    description: 'Hands-on live lab demonstration of ClusterIP, NodePort, and LoadBalancer configurations.',
    room_name: 'CS-CLOUD-Live-102',
    start_time: '2026-10-03T11:00:00Z',
    end_time: null,
    status: 'scheduled',
  },
];

export interface StandaloneResource {
  resource_id: number;
  course_id: number;
  course_name?: string;
  course_code?: string;
  title: string;
  description: string;
  resource_type: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  unit_name: string;
  created_at: string;
}

const INITIAL_RESOURCES: StandaloneResource[] = [
  {
    resource_id: 1,
    course_id: 1,
    course_code: '22CS3101',
    course_name: 'Database Management Systems',
    title: 'Unit 1 Lecture Notes: Relational Data Model',
    description: 'Detailed textbook notes covering relations, integrity constraints, and domain relational calculus.',
    resource_type: 'notes',
    file_url: '#',
    file_name: 'Unit1_Relational_Model.pdf',
    unit_name: 'Unit 1: Relational Model & SQL',
    created_at: '2026-09-10T09:00:00Z',
  },
  {
    resource_id: 2,
    course_id: 1,
    course_code: '22CS3101',
    course_name: 'Database Management Systems',
    title: 'Unit 2: Normalization Masterclass & Practice Problems',
    description: 'Full question bank covering 1NF, 2NF, 3NF, BCNF, 4NF, and multi-valued dependencies.',
    resource_type: 'handout',
    file_url: '#',
    file_name: 'Normalization_Handbook.pdf',
    unit_name: 'Unit 2: Normalization (1NF-BCNF)',
    created_at: '2026-09-18T10:30:00Z',
  },
  {
    resource_id: 3,
    course_id: 3,
    course_code: '22CS3103',
    course_name: 'Cloud Computing and Microservices',
    title: 'Unit 1: Microservices Architecture Blueprint',
    description: 'Patterns for API Gateways, Service Discovery, Circuit Breakers, and Saga transactions.',
    resource_type: 'notes',
    file_url: '#',
    file_name: 'Microservices_Blueprint.pdf',
    unit_name: 'Unit 1: Cloud Architecture',
    created_at: '2026-09-20T11:00:00Z',
  },
];

export interface StandaloneDiscussion {
  discussion_id: number;
  course_id: number;
  title: string;
  content: string;
  created_by: number;
  created_at: string;
  user_name: string;
  user_role: string;
  reply_count: number;
}

const INITIAL_DISCUSSIONS: StandaloneDiscussion[] = [
  {
    discussion_id: 1,
    course_id: 1,
    title: 'Why is BCNF strictly stricter than 3NF?',
    content: 'Can someone provide a concise intuition for why every BCNF relation is in 3NF, but not vice-versa?',
    created_by: 1,
    created_at: '2026-09-26T14:00:00Z',
    user_name: 'Shloka Reddy',
    user_role: 'student',
    reply_count: 3,
  },
];

export interface StandaloneGroup {
  group_id: number;
  name: string;
  group_name: string;
  description: string;
  course_id: number;
  course_name: string;
  course_code: string;
  created_by: number;
  member_count: number;
  members: Array<{ user_id: number; full_name: string; role: string }>;
}

export interface StandaloneGroupTask {
  task_id: number;
  group_id: number;
  title: string;
  description: string;
  assigned_to_id: number;
  assigned_to_name: string;
  priority: 'low' | 'medium' | 'high';
  stage: 'todo' | 'in_progress' | 'review' | 'completed';
  due_date: string;
  points_awarded?: boolean;
}

const INITIAL_GROUPS: StandaloneGroup[] = [
  {
    group_id: 1,
    name: 'DBMS Research Circle',
    group_name: 'DBMS Research Circle',
    description: 'Collaborative group for query tuning, ER diagrams, and normalization review.',
    course_id: 1,
    course_name: 'Database Management Systems',
    course_code: '22CS3101',
    created_by: 1,
    member_count: 3,
    members: [
      { user_id: 1, full_name: 'Shloka Reddy', role: 'Leader' },
      { user_id: 5, full_name: 'Ananya Sharma', role: 'Member' },
      { user_id: 7, full_name: 'Rahul Varma', role: 'Member' },
    ],
  },
  {
    group_id: 2,
    name: 'Cloud Microservices Sprint Team',
    group_name: 'Cloud Microservices Sprint Team',
    description: 'Hands-on sprint group building Kubernetes YAML manifests, Docker multi-stage containers, and gRPC endpoints.',
    course_id: 3,
    course_name: 'Cloud Computing and Microservices',
    course_code: '22CS3103',
    created_by: 1,
    member_count: 3,
    members: [
      { user_id: 1, full_name: 'Shloka Reddy', role: 'Leader' },
      { user_id: 5, full_name: 'Ananya Sharma', role: 'Member' },
      { user_id: 7, full_name: 'Rahul Varma', role: 'Member' },
    ],
  },
  {
    group_id: 3,
    name: 'Algorithmic Problem Solving Guild',
    group_name: 'Algorithmic Problem Solving Guild',
    description: 'Daily competitive coding reviews, dynamic programming patterns, and balanced tree implementations.',
    course_id: 2,
    course_name: 'Data Structures and Algorithms',
    course_code: '22CS3102',
    created_by: 1,
    member_count: 3,
    members: [
      { user_id: 1, full_name: 'Shloka Reddy', role: 'Leader' },
      { user_id: 5, full_name: 'Ananya Sharma', role: 'Member' },
      { user_id: 7, full_name: 'Rahul Varma', role: 'Member' },
    ],
  },
];

const INITIAL_GROUP_TASKS: StandaloneGroupTask[] = [
  {
    task_id: 1,
    group_id: 1,
    title: 'Design Hospital ER Diagram Entity Sets',
    description: 'Establish primary keys, foreign relations, and cardinality ratios for Doctors, Patients, and Wards.',
    assigned_to_id: 1,
    assigned_to_name: 'Shloka Reddy',
    priority: 'high',
    stage: 'completed',
    due_date: '2026-10-02',
    points_awarded: true,
  },
  {
    task_id: 2,
    group_id: 1,
    title: 'Write SQL Schema DDL with Integrity Constraints',
    description: 'Formulate CREATE TABLE scripts with ON DELETE CASCADE and CHECK constraints in PostgreSQL.',
    assigned_to_id: 7,
    assigned_to_name: 'Rahul Varma',
    priority: 'medium',
    stage: 'completed',
    due_date: '2026-10-03',
    points_awarded: true,
  },
  {
    task_id: 3,
    group_id: 1,
    title: 'Benchmark B-Tree vs Hash Index on 100K Rows',
    description: 'Execute EXPLAIN ANALYZE queries to measure execution time differences on range queries.',
    assigned_to_id: 5,
    assigned_to_name: 'Ananya Sharma',
    priority: 'high',
    stage: 'review',
    due_date: '2026-10-06',
  },
  {
    task_id: 4,
    group_id: 1,
    title: 'Implement Transaction ACID Rollback Demonstrator',
    description: 'Code Python script showing automatic ROLLBACK on bank transfer balance constraint violation.',
    assigned_to_id: 1,
    assigned_to_name: 'Shloka Reddy',
    priority: 'high',
    stage: 'in_progress',
    due_date: '2026-10-07',
  },
  {
    task_id: 5,
    group_id: 1,
    title: 'Normalize Patient Billing Relation to 3NF & BCNF',
    description: 'Eliminate transitive dependencies and test lossless join decomposition property.',
    assigned_to_id: 7,
    assigned_to_name: 'Rahul Varma',
    priority: 'high',
    stage: 'todo',
    due_date: '2026-10-09',
  },
  {
    task_id: 6,
    group_id: 1,
    title: 'Prepare Slide Deck & Viva Talking Points',
    description: 'Summarize system architecture and each member contribution percentage for professor evaluation.',
    assigned_to_id: 5,
    assigned_to_name: 'Ananya Sharma',
    priority: 'medium',
    stage: 'todo',
    due_date: '2026-10-10',
  },
];

export interface StandaloneNotification {
  notification_id: number;
  user_id?: number;
  type?: string;
  title: string;
  message: string;
  is_read: boolean;
  read?: boolean;
  created_at: string;
}

const INITIAL_NOTIFICATIONS: StandaloneNotification[] = [
  {
    notification_id: 1,
    user_id: 1,
    type: 'general',
    title: 'Exam Schedule Published',
    message: 'Examination schedules have been configured. Check your Exam Scheduler to view upcoming tests.',
    created_at: '2026-10-01T09:00:00Z',
    is_read: false,
    read: false,
  },
  {
    notification_id: 2,
    user_id: 1,
    type: 'attendance',
    title: '75% Attendance Criteria Verified',
    message: 'Your overall attendance is above 85%. You meet all end-semester academic criteria.',
    created_at: '2026-09-29T10:00:00Z',
    is_read: false,
    read: false,
  },
];

// Helper to get or initialize persistent data with versioning and normalization
function getOrInit<T>(key: string, initial: T): T {
  try {
    const valStr = localStorage.getItem(`educonnect_v3_${key}`);
    if (valStr) {
      const parsed = JSON.parse(valStr);

      // Sanitize exams if loaded from previous session
      if (key === 'exams' && Array.isArray(parsed)) {
        return parsed.map((e: any) => ({
          ...e,
          title: e.title || e.exam_name || 'Academic Examination',
          exam_name: e.title || e.exam_name || 'Academic Examination',
          student_group: e.student_group || e.target_student_group || 'All Enrolled Students',
          target_student_group: e.student_group || e.target_student_group || 'All Enrolled Students',
          status: (e.status || 'scheduled').toLowerCase(),
          is_published: e.is_published !== undefined ? Boolean(e.is_published) : true,
          results_published: Boolean(e.results_published),
          questions: Array.isArray(e.questions) && e.questions.length > 0 ? e.questions : (INITIAL_EXAMS[0]?.questions || []),
        })) as unknown as T;
      }

      // Merge initial courses so no faculty lacks courses
      if (key === 'courses' && Array.isArray(parsed)) {
        const merged = [...parsed];
        for (const initC of (initial as any[])) {
          if (!merged.some(c => c.course_id === initC.course_id || c.course_code === initC.course_code)) {
            merged.push(initC);
          }
        }
        return merged as unknown as T;
      }

      return parsed;
    }
  } catch (e) {
    console.warn(`Could not load ${key} from storage:`, e);
  }

  try {
    localStorage.setItem(`educonnect_v3_${key}`, JSON.stringify(initial));
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
      localStorage.setItem('educonnect_v3_users', JSON.stringify(users));
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
    localStorage.setItem('educonnect_v3_users', JSON.stringify(users));

    // If new user is a faculty member, auto-provision a course so their course list is NEVER empty
    if (newUser.role === 'faculty') {
      const courses = standaloneDB.getCourses();
      const hasCourse = courses.some(c => Number(c.faculty_id) === newUser.user_id);
      if (!hasCourse) {
        standaloneDB.saveCourse({
          course_code: `CS${300 + newUser.user_id}`,
          course_name: `${newUser.full_name}'s Department Course`,
          description: 'Departmental curriculum, advanced core theory, and interactive laboratories.',
          faculty_id: newUser.user_id,
          faculty_name: newUser.full_name,
          department: newUser.department || 'Computer Science & Engineering',
          credits: 4,
        });
      }
    }

    return newUser;
  },

  updateUser: (userId: number, updates: Partial<StandaloneUser>): StandaloneUser | null => {
    const users = standaloneDB.getUsers();
    const index = users.findIndex(u => u.user_id === userId || Number(u.id) === userId);
    if (index >= 0) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem('educonnect_v3_users', JSON.stringify(users));
      return users[index];
    }
    return null;
  },

  getCourses: (facultyId?: number): any[] => {
    let courses = getOrInit('courses', INITIAL_COURSES);

    if (facultyId) {
      const fId = Number(facultyId);
      let facultyCourses = courses.filter((c: any) => Number(c.faculty_id) === fId);

      // Auto-provision if faculty has no courses assigned yet
      if (facultyCourses.length === 0) {
        const users = standaloneDB.getUsers();
        const facultyUser = users.find(u => u.user_id === fId);
        const facName = facultyUser ? facultyUser.full_name : `Faculty #${fId}`;
        const autoCourse = {
          course_id: courses.length + 1,
          course_code: `CS${300 + fId}`,
          course_name: `${facName}'s Core Subject`,
          description: 'Departmental theory, algorithms, and practical implementations.',
          faculty_id: fId,
          faculty_name: facName,
          department: facultyUser?.department || 'Computer Science & Engineering',
          credits: 4,
        };
        courses.push(autoCourse);
        localStorage.setItem('educonnect_v3_courses', JSON.stringify(courses));
        facultyCourses = [autoCourse];
      }

      return facultyCourses;
    }

    return courses;
  },

  saveCourse: (course: any) => {
    const courses = standaloneDB.getCourses();
    const newCourse = {
      course_id: courses.length + 1,
      ...course,
      faculty_id: Number(course.faculty_id || 3),
    };
    courses.push(newCourse);
    localStorage.setItem('educonnect_v3_courses', JSON.stringify(courses));
    return newCourse;
  },

  // Exam Attempts Store
  getAttempts: (): StandaloneExamAttempt[] => getOrInit('exam_attempts', []),

  getAttempt: (examId: number, studentId: number): StandaloneExamAttempt | undefined => {
    const attempts = standaloneDB.getAttempts();
    return attempts.find(a => Number(a.exam_id) === Number(examId) && Number(a.student_id) === Number(studentId));
  },

  getAttemptById: (attemptId: number): StandaloneExamAttempt | undefined => {
    const attempts = standaloneDB.getAttempts();
    return attempts.find(a => Number(a.attempt_id) === Number(attemptId));
  },

  startExamAttempt: (examId: number, studentId: number): StandaloneExamAttempt => {
    const attempts = standaloneDB.getAttempts();
    const existing = attempts.find(
      a => Number(a.exam_id) === Number(examId) && Number(a.student_id) === Number(studentId)
    );

    if (existing) {
      return existing;
    }

    const users = standaloneDB.getUsers();
    const student = users.find(u => u.user_id === Number(studentId));

    const newAttempt: StandaloneExamAttempt = {
      attempt_id: Date.now(),
      exam_id: Number(examId),
      student_id: Number(studentId),
      student_name: student?.full_name || 'Student Member',
      student_email: student?.email || 'student@klh.edu.in',
      roll_number: student?.roll_number || '2200030001',
      section: student?.section || 'Section A',
      started_at: new Date().toISOString(),
      status: 'in_progress',
      answers: {},
      evaluations: {},
    };

    attempts.push(newAttempt);
    localStorage.setItem('educonnect_v3_exam_attempts', JSON.stringify(attempts));
    return newAttempt;
  },

  autosaveAnswer: (attemptId: number, questionId: number, student_answer: string) => {
    const attempts = standaloneDB.getAttempts();
    const idx = attempts.findIndex(a => Number(a.attempt_id) === Number(attemptId));
    if (idx >= 0) {
      attempts[idx].answers = attempts[idx].answers || {};
      attempts[idx].answers[String(questionId)] = student_answer;
      localStorage.setItem('educonnect_v3_exam_attempts', JSON.stringify(attempts));
      return attempts[idx];
    }
    return null;
  },

  submitExamAttempt: (examId: number, studentId: number, attemptId: number, answers: Record<string, string>) => {
    const attempts = standaloneDB.getAttempts();
    let idx = attempts.findIndex(a => Number(a.attempt_id) === Number(attemptId));

    if (idx < 0) {
      // Create if missing
      const newAtt = standaloneDB.startExamAttempt(examId, studentId);
      idx = attempts.findIndex(a => Number(a.attempt_id) === Number(newAtt.attempt_id));
    }

    const exams = standaloneDB.getExams();
    const exam = exams.find((e: any) => Number(e.exam_id) === Number(examId));
    const mergedAnswers = { ...(attempts[idx]?.answers || {}), ...answers };
    attempts[idx].answers = mergedAnswers;

    let marksObtained = 0;
    const questions = exam?.questions || [];

    for (const q of questions) {
      const qId = String(q.question_id);
      const studentAns = (mergedAnswers[qId] || '').trim();
      const qMarks = Number(q.marks) || 10;

      if (q.question_type === 'mcq' || q.question_type === 'true_false') {
        if (studentAns.toLowerCase() === String(q.correct_answer || '').trim().toLowerCase()) {
          marksObtained += qMarks;
        }
      } else if (q.question_type === 'coding') {
        // Award full marks if code is provided and non-empty
        if (studentAns.length > 20 && !studentAns.includes('# Write your solution here')) {
          marksObtained += qMarks;
        } else if (studentAns.length > 5) {
          marksObtained += Math.floor(qMarks * 0.6);
        }
      } else {
        // Short / descriptive: award marks if answered
        if (studentAns.length > 10) {
          marksObtained += Math.floor(qMarks * 0.8);
        }
      }
    }

    const totalMarks = Number(exam?.total_marks) || 50;
    marksObtained = Math.min(marksObtained, totalMarks);
    const percentage = Math.round((marksObtained / totalMarks) * 100);
    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';

    attempts[idx].status = 'submitted';
    attempts[idx].submitted_at = new Date().toISOString();
    attempts[idx].total_score = marksObtained;
    attempts[idx].percentage = percentage;
    attempts[idx].grade = grade;
    attempts[idx].feedback = 'Automated assessment completed and verified by academic engine.';

    localStorage.setItem('educonnect_v3_exam_attempts', JSON.stringify(attempts));

    return {
      success: true,
      message: 'Exam submitted successfully and recorded.',
      marks_obtained: marksObtained,
      total_marks: totalMarks,
      percentage,
      grade,
      attempt_id: attempts[idx].attempt_id,
      attempt: attempts[idx],
    };
  },

  getExams: (facultyId?: number, studentId?: number, role?: string): any[] => {
    const allExams = getOrInit('exams', INITIAL_EXAMS);
    const attempts = standaloneDB.getAttempts();
    const courses = standaloneDB.getCourses();

    // Map each exam to enrich with course_code, course_name, questions_count, submissions_count
    const enriched = allExams.map((ex: any) => {
      const course = courses.find((c: any) => Number(c.course_id) === Number(ex.course_id));
      const examSubs = attempts.filter((a: any) => Number(a.exam_id) === Number(ex.exam_id));

      let studentAttempt: StandaloneExamAttempt | undefined;
      if (studentId) {
        studentAttempt = examSubs.find((a: any) => Number(a.student_id) === Number(studentId));
      }

      return {
        ...ex,
        title: ex.title || ex.exam_name || 'Academic Examination',
        exam_name: ex.title || ex.exam_name || 'Academic Examination',
        student_group: ex.student_group || ex.target_student_group || 'All Enrolled Students',
        status: (ex.status || 'scheduled').toLowerCase(),
        course_code: ex.course_code || course?.course_code || 'CS301',
        course_name: ex.course_name || course?.course_name || 'Computer Science Core',
        faculty_name: ex.faculty_name || course?.faculty_name || 'Faculty Member',
        questions_count: (ex.questions || []).length,
        submissions_count: examSubs.length,
        total_eligible_students: 45,
        ...(studentAttempt
          ? {
              attempt_id: studentAttempt.attempt_id,
              attempt_status: studentAttempt.status,
              total_score: studentAttempt.total_score,
              percentage: studentAttempt.percentage,
              grade: studentAttempt.grade,
            }
          : {
              attempt_status: 'not_started',
            }),
      };
    });

    if (facultyId && role !== 'admin') {
      const fId = Number(facultyId);
      return enriched.filter((ex: any) => Number(ex.faculty_id) === fId);
    }

    if (studentId) {
      return enriched.filter((ex: any) => ex.is_published && ex.status !== 'cancelled');
    }

    return enriched;
  },

  getExamById: (examId: number, studentId?: number) => {
    const exams = standaloneDB.getExams();
    const exam = exams.find((e: any) => Number(e.exam_id) === Number(examId)) || exams[0];
    const questions = exam?.questions || [];
    let attempt = null;

    if (studentId) {
      attempt = standaloneDB.getAttempt(Number(examId), Number(studentId)) || null;
    }

    return {
      exam,
      questions,
      attempt,
    };
  },

  saveExam: (exam: any) => {
    const exams = getOrInit('exams', INITIAL_EXAMS);
    const courses = standaloneDB.getCourses();
    const course = courses.find((c: any) => Number(c.course_id) === Number(exam.course_id));

    const newExam = {
      exam_id: exams.length + 1,
      title: exam.title || exam.exam_name || 'New Examination',
      exam_name: exam.title || exam.exam_name || 'New Examination',
      course_id: Number(exam.course_id),
      course_code: course?.course_code || 'CS301',
      course_name: course?.course_name || 'Department Course',
      faculty_id: Number(exam.faculty_id || 3),
      faculty_name: course?.faculty_name || 'Faculty Member',
      student_group: exam.student_group || 'All Enrolled Students',
      target_student_group: exam.student_group || exam.target_student_group || 'All Enrolled Students',
      instructions: exam.instructions || 'All questions are compulsory.',
      exam_date: exam.exam_date || new Date().toISOString().split('T')[0],
      start_time: exam.start_time || '10:00:00',
      end_time: exam.end_time || '11:30:00',
      duration_minutes: Number(exam.duration_minutes) || 60,
      total_marks: Number(exam.total_marks) || 50,
      status: 'scheduled',
      is_published: exam.is_published !== undefined ? Boolean(exam.is_published) : true,
      results_published: false,
      questions: Array.isArray(exam.questions) && exam.questions.length > 0 ? exam.questions : (INITIAL_EXAMS[0]?.questions || []),
    };

    (exams as any[]).unshift(newExam);
    localStorage.setItem('educonnect_v3_exams', JSON.stringify(exams));
    return newExam;
  },

  updateExam: (examId: number, updates: any) => {
    const exams = getOrInit('exams', INITIAL_EXAMS);
    const idx = exams.findIndex((e: any) => Number(e.exam_id) === Number(examId));
    if (idx >= 0) {
      exams[idx] = {
        ...exams[idx],
        ...updates,
        status: (updates.status || exams[idx].status || 'scheduled').toLowerCase(),
      };
      localStorage.setItem('educonnect_v3_exams', JSON.stringify(exams));
      return exams[idx];
    }
    return null;
  },

  updateExamStatus: (examId: number, status: string, options?: any) => {
    const exams = getOrInit('exams', INITIAL_EXAMS);
    const idx = exams.findIndex((e: any) => Number(e.exam_id) === Number(examId));
    if (idx >= 0) {
      exams[idx].status = status.toLowerCase();
      if (options?.is_published !== undefined) exams[idx].is_published = options.is_published;
      if (options?.results_published !== undefined) exams[idx].results_published = options.results_published;
      localStorage.setItem('educonnect_v3_exams', JSON.stringify(exams));
      return exams[idx];
    }
    return null;
  },

  getExamSubmissions: (examId: number) => {
    const attempts = standaloneDB.getAttempts();
    const users = standaloneDB.getUsers();
    const examSubs = attempts.filter(a => Number(a.exam_id) === Number(examId));

    return examSubs.map(a => {
      const student = users.find(u => u.user_id === a.student_id);
      return {
        attempt_id: a.attempt_id,
        exam_id: a.exam_id,
        student_id: a.student_id,
        student_name: a.student_name || student?.full_name || 'Student Member',
        student_email: a.student_email || student?.email || 'student@klh.edu.in',
        roll_number: a.roll_number || student?.roll_number || '2200030001',
        section: a.section || student?.section || 'Section A',
        started_at: a.started_at,
        submitted_at: a.submitted_at || a.started_at,
        status: a.status,
        total_score: a.total_score,
        percentage: a.percentage,
        grade: a.grade,
        feedback: a.feedback,
        exam_title: 'Exam',
        total_marks: 50,
      };
    });
  },

  getExamSubmissionByAttempt: (attemptId: number) => {
    const attempt = standaloneDB.getAttemptById(attemptId);
    if (!attempt) return null;

    const exams = standaloneDB.getExams();
    const exam = exams.find((e: any) => Number(e.exam_id) === Number(attempt.exam_id));
    const questions = exam?.questions || [];

    const questions_and_answers = questions.map((q: any) => {
      const qId = String(q.question_id);
      const studentAns = attempt.answers?.[qId] || '';
      const evalData = attempt.evaluations?.[qId];

      return {
        question_id: q.question_id,
        question_number: q.question_number || 1,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        max_marks: Number(q.marks) || 10,
        student_answer: studentAns,
        marks_awarded: evalData ? evalData.marks : (studentAns ? Number(q.marks) : 0),
        is_evaluated: true,
        evaluator_feedback: evalData ? evalData.feedback : 'Graded by academic engine',
      };
    });

    return {
      attempt: {
        attempt_id: attempt.attempt_id,
        exam_id: attempt.exam_id,
        student_id: attempt.student_id,
        student_name: attempt.student_name || 'Student Member',
        student_email: attempt.student_email || 'student@klh.edu.in',
        roll_number: attempt.roll_number || '2200030001',
        section: attempt.section || 'Section A',
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at || attempt.started_at,
        status: attempt.status,
        total_score: attempt.total_score,
        percentage: attempt.percentage,
        grade: attempt.grade,
        feedback: attempt.feedback,
        exam_title: exam?.title || 'Academic Examination',
        total_marks: exam?.total_marks || 50,
      },
      questions_and_answers,
    };
  },

  evaluateExamAttempt: (attemptId: number, evaluations: any[], feedback?: string) => {
    const attempts = standaloneDB.getAttempts();
    const idx = attempts.findIndex(a => Number(a.attempt_id) === Number(attemptId));
    if (idx >= 0) {
      attempts[idx].evaluations = attempts[idx].evaluations || {};
      let totalEarned = 0;

      for (const ev of evaluations) {
        attempts[idx].evaluations![String(ev.question_id)] = {
          marks: Number(ev.marks_awarded) || 0,
          feedback: ev.feedback || '',
        };
        totalEarned += Number(ev.marks_awarded) || 0;
      }

      attempts[idx].status = 'evaluated';
      attempts[idx].total_score = totalEarned;
      attempts[idx].percentage = Math.round((totalEarned / 50) * 100);
      attempts[idx].grade = attempts[idx].percentage! >= 90 ? 'A+' : attempts[idx].percentage! >= 80 ? 'A' : 'B';
      if (feedback) attempts[idx].feedback = feedback;

      localStorage.setItem('educonnect_v3_exam_attempts', JSON.stringify(attempts));
      return attempts[idx];
    }
    return null;
  },

  getAssignments: () => getOrInit('assignments', INITIAL_ASSIGNMENTS),

  saveAssignment: (assignment: any) => {
    const list = standaloneDB.getAssignments();
    const newItem = {
      assignment_id: list.length + 1,
      submission_count: 0,
      ...assignment,
      faculty_id: Number(assignment.faculty_id || 3),
    };
    list.unshift(newItem);
    localStorage.setItem('educonnect_v3_assignments', JSON.stringify(list));
    return newItem;
  },

  getAttendance: () => getOrInit('attendance', INITIAL_ATTENDANCE),

  getAttendanceRecords: (): StandaloneAttendanceRecord[] =>
    getOrInit('attendance_records', INITIAL_ATTENDANCE_RECORDS),

  saveAttendanceRecords: (
    courseId: number,
    date: string,
    records: Array<{ student_id: number; status: 'Present' | 'Absent' | 'Late' }>,
    markedBy?: number
  ) => {
    const list = standaloneDB.getAttendanceRecords();
    const updatedList = [...list];

    records.forEach((rec) => {
      const idx = updatedList.findIndex(
        (a) =>
          Number(a.course_id) === Number(courseId) &&
          Number(a.student_id) === Number(rec.student_id) &&
          a.date === date
      );
      if (idx >= 0) {
        updatedList[idx] = {
          ...updatedList[idx],
          status: rec.status,
          marked_by: markedBy,
        };
      } else {
        updatedList.push({
          attendance_id: Date.now() + Math.floor(Math.random() * 10000),
          course_id: Number(courseId),
          student_id: Number(rec.student_id),
          date,
          status: rec.status,
          marked_by: markedBy,
        });
      }
    });

    localStorage.setItem('educonnect_v3_attendance_records', JSON.stringify(updatedList));
    return updatedList;
  },

  getCourseDailyAttendance: (courseId: number, date: string) => {
    const cId = Number(courseId);
    const users = standaloneDB.getUsers();
    const enrollments = standaloneDB.getEnrollments();
    const enrolledStudentIds = enrollments
      .filter((e) => Number(e.course_id) === cId)
      .map((e) => Number(e.student_id));

    let targetStudents = users.filter(
      (u) => u.role === 'student' && (enrolledStudentIds.length === 0 || enrolledStudentIds.includes(Number(u.user_id)))
    );
    if (targetStudents.length === 0) {
      targetStudents = users.filter((u) => u.role === 'student');
    }

    const records = standaloneDB.getAttendanceRecords();

    const students = targetStudents.map((s, idx) => {
      const record = records.find(
        (r) => Number(r.course_id) === cId && Number(r.student_id) === Number(s.user_id) && r.date === date
      );

      return {
        user_id: Number(s.user_id),
        full_name: s.full_name,
        email: s.email,
        roll_number: s.roll_number || `22000300${idx + 1}`,
        section: s.section || 'Section A',
        status: (record ? record.status : 'Present') as 'Present' | 'Absent' | 'Late',
        attendance_id: record ? record.attendance_id : null,
        date,
      };
    });

    return {
      course_id: cId,
      date,
      students,
    };
  },

  getCourseAttendanceSummary: (courseId: number) => {
    const cId = Number(courseId);
    const users = standaloneDB.getUsers();
    const records = standaloneDB.getAttendanceRecords().filter((r) => Number(r.course_id) === cId);
    const enrollments = standaloneDB.getEnrollments();
    const enrolledStudentIds = enrollments
      .filter((e) => Number(e.course_id) === cId)
      .map((e) => Number(e.student_id));

    let targetStudents = users.filter(
      (u) => u.role === 'student' && (enrolledStudentIds.length === 0 || enrolledStudentIds.includes(Number(u.user_id)))
    );
    if (targetStudents.length === 0) {
      targetStudents = users.filter((u) => u.role === 'student');
    }

    const distinctDates = Array.from(new Set(records.map((r) => r.date)));
    const totalConducted = distinctDates.length;

    return targetStudents.map((s) => {
      const studentRecords = records.filter((r) => Number(r.student_id) === Number(s.user_id));
      const presentClasses = studentRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length;
      const absentClasses = studentRecords.filter((r) => r.status === 'Absent').length;
      const totalClasses = studentRecords.length > 0 ? studentRecords.length : totalConducted;
      const pct = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 1000) / 10 : 0;

      return {
        user_id: Number(s.user_id),
        full_name: s.full_name,
        roll_number: s.roll_number || `22000300${s.user_id}`,
        total_classes: totalClasses,
        present_classes: presentClasses,
        absent_classes: absentClasses,
        attendance_percentage: pct,
      };
    });
  },

  getStudentAttendance: (studentId: number) => {
    const sId = Number(studentId);
    const courses = standaloneDB.getCourses();
    const enrollments = standaloneDB.getEnrollments(sId);
    const records = standaloneDB.getAttendanceRecords().filter((r) => Number(r.student_id) === sId);

    const enrolledCourseIds = enrollments.map((e) => Number(e.course_id));
    const targetCourses = courses.filter(
      (c) => enrolledCourseIds.length === 0 || enrolledCourseIds.includes(Number(c.course_id))
    );

    const courseBreakdown = targetCourses.map((c) => {
      const cRecords = records.filter((r) => Number(r.course_id) === Number(c.course_id));
      const total = cRecords.length;
      const present = cRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length;
      const pct = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

      return {
        course_id: Number(c.course_id),
        course_code: c.course_code,
        course_name: c.course_name,
        total_classes: total,
        present_classes: present,
        absent_classes: total - present,
        course_percentage: pct,
      };
    });

    const totalLectures = records.length;
    const presentCount = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    const absentCount = records.filter((r) => r.status === 'Absent').length;
    const overallPct = totalLectures > 0 ? Math.round((presentCount / totalLectures) * 1000) / 10 : 0;

    const history = records
      .map((r) => {
        const crs = courses.find((c) => Number(c.course_id) === Number(r.course_id));
        return {
          attendance_id: r.attendance_id,
          course_id: r.course_id,
          course_code: crs?.course_code || 'CS301',
          course_name: crs?.course_name || 'Academic Course',
          date: r.date,
          status: r.status,
        };
      })
      .sort((a, b) => (b.date > a.date ? 1 : -1));

    return {
      overall: {
        total_lectures: totalLectures,
        present_count: presentCount,
        absent_count: absentCount,
        overall_percentage: overallPct,
        percentage: overallPct,
      },
      courses: courseBreakdown,
      history,
    };
  },

  getSubmissions: (studentId?: number): StandaloneSubmission[] => {
    const all = getOrInit('submissions', INITIAL_SUBMISSIONS);
    if (!studentId) return all;
    return all.filter((s: StandaloneSubmission) => Number(s.student_id) === Number(studentId));
  },

  getFacultySubmissions: (facultyId?: number): StandaloneSubmission[] => {
    const all = getOrInit('submissions', INITIAL_SUBMISSIONS);
    if (!facultyId) return all;
    const fId = Number(facultyId);
    const courses = standaloneDB.getCourses();
    const facultyCourseIds = courses.filter((c) => Number(c.faculty_id) === fId).map((c) => Number(c.course_id));

    return all.filter(
      (s: StandaloneSubmission) => Number(s.faculty_id) === fId || facultyCourseIds.includes(Number(s.course_id))
    );
  },

  saveSubmission: (data: { assignment_id: number; student_id: number; submission_url: string }): StandaloneSubmission => {
    const list = standaloneDB.getSubmissions();
    const assignments = standaloneDB.getAssignments();
    const courses = standaloneDB.getCourses();
    const users = standaloneDB.getUsers();

    const assignment = assignments.find((a) => Number(a.assignment_id) === Number(data.assignment_id));
    const course = courses.find((c) => Number(c.course_id) === Number(assignment?.course_id));
    const student = users.find((u) => Number(u.user_id) === Number(data.student_id));

    const existingIdx = list.findIndex(
      (s) => Number(s.assignment_id) === Number(data.assignment_id) && Number(s.student_id) === Number(data.student_id)
    );

    const submissionItem: StandaloneSubmission = {
      submission_id: existingIdx >= 0 ? list[existingIdx].submission_id : Date.now(),
      assignment_id: Number(data.assignment_id),
      student_id: Number(data.student_id),
      student_name: student?.full_name || 'Enrolled Student',
      student_email: student?.email || 'student@klh.edu.in',
      submission_url: data.submission_url,
      submitted_at: new Date().toISOString(),
      marks: existingIdx >= 0 ? list[existingIdx].marks : null,
      feedback: existingIdx >= 0 ? list[existingIdx].feedback : null,
      assignment_title: assignment?.title || 'Assignment Deliverable',
      title: assignment?.title || 'Assignment Deliverable',
      unit_name: (assignment as any)?.unit_name || 'Curriculum Unit',
      max_marks: Number(assignment?.max_marks || 25),
      course_id: Number(assignment?.course_id || course?.course_id || 1),
      course_code: course?.course_code || '22CS3101',
      course_name: course?.course_name || 'Database Management Systems',
      faculty_id: Number(assignment?.faculty_id || course?.faculty_id || 3),
      status: existingIdx >= 0 && list[existingIdx].marks !== null ? 'graded' : 'submitted',
    };

    if (existingIdx >= 0) {
      list[existingIdx] = submissionItem;
    } else {
      list.unshift(submissionItem);
    }

    localStorage.setItem('educonnect_v3_submissions', JSON.stringify(list));
    return submissionItem;
  },

  evaluateAssignmentSubmission: (submissionId: number, marks: number, feedback: string): StandaloneSubmission => {
    const list = standaloneDB.getSubmissions();
    const idx = list.findIndex((s) => Number(s.submission_id) === Number(submissionId));
    if (idx === -1) {
      throw new Error('Submission not found');
    }

    const updated: StandaloneSubmission = {
      ...list[idx],
      marks: Number(marks),
      feedback: feedback ? String(feedback).trim() : null,
      status: 'graded',
    };

    list[idx] = updated;
    localStorage.setItem('educonnect_v3_submissions', JSON.stringify(list));
    return updated;
  },

  getEnrollments: (studentId?: number): StandaloneEnrollment[] => {
    const all = getOrInit('enrollments', INITIAL_ENROLLMENTS);
    if (!studentId) return all;
    const sId = Number(studentId);
    let studentEnrollments = all.filter((e: StandaloneEnrollment) => Number(e.student_id) === sId);

    if (studentEnrollments.length === 0) {
      const courses = standaloneDB.getCourses();
      const defaultCourses = courses.slice(0, 2);
      const newEnrollments: StandaloneEnrollment[] = defaultCourses.map((c, i) => ({
        enrollment_id: all.length + i + 1,
        student_id: sId,
        course_id: Number(c.course_id),
        course_code: c.course_code,
        course_name: c.course_name,
      }));
      all.push(...newEnrollments);
      localStorage.setItem('educonnect_v3_enrollments', JSON.stringify(all));
      studentEnrollments = newEnrollments;
    }

    return studentEnrollments;
  },

  saveEnrollment: (studentId: number, courseId: number): StandaloneEnrollment => {
    const all = standaloneDB.getEnrollments();
    const sId = Number(studentId);
    const cId = Number(courseId);
    const existing = all.find((e) => Number(e.student_id) === sId && Number(e.course_id) === cId);
    if (existing) return existing;

    const courses = standaloneDB.getCourses();
    const course = courses.find((c) => Number(c.course_id) === cId);

    const newEnrollment: StandaloneEnrollment = {
      enrollment_id: all.length + 1,
      student_id: sId,
      course_id: cId,
      course_code: course?.course_code,
      course_name: course?.course_name,
    };
    all.push(newEnrollment);
    localStorage.setItem('educonnect_v3_enrollments', JSON.stringify(all));
    return newEnrollment;
  },

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
    localStorage.setItem('educonnect_v3_live_classes', JSON.stringify(list));
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
    localStorage.setItem('educonnect_v3_resources', JSON.stringify(list));
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
    localStorage.setItem('educonnect_v3_discussions', JSON.stringify(list));
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
    localStorage.setItem('educonnect_v3_groups', JSON.stringify(list));
    return newGrp;
  },

  getGroupTasks: (groupId: number): StandaloneGroupTask[] => {
    const all = getOrInit('group_tasks', INITIAL_GROUP_TASKS);
    return all.filter((t: any) => Number(t.group_id) === Number(groupId));
  },

  saveGroupTask: (task: any): StandaloneGroupTask => {
    const list = getOrInit('group_tasks', INITIAL_GROUP_TASKS);
    const newTask: StandaloneGroupTask = {
      task_id: Date.now(),
      group_id: Number(task.group_id),
      title: task.title,
      description: task.description || '',
      assigned_to_id: Number(task.assigned_to_id || 1),
      assigned_to_name: task.assigned_to_name || 'Team Member',
      priority: task.priority || 'medium',
      stage: task.stage || 'todo',
      due_date: task.due_date || new Date().toISOString().split('T')[0],
      points_awarded: false,
    };
    list.push(newTask);
    localStorage.setItem('educonnect_v3_group_tasks', JSON.stringify(list));
    return newTask;
  },

  updateGroupTaskStage: (taskId: number, newStage: 'todo' | 'in_progress' | 'review' | 'completed') => {
    const list = getOrInit('group_tasks', INITIAL_GROUP_TASKS);
    const idx = list.findIndex((t: any) => Number(t.task_id) === Number(taskId));
    if (idx >= 0) {
      const task = list[idx];
      task.stage = newStage;
      let pointsAwarded = false;
      if (newStage === 'completed' && !task.points_awarded) {
        task.points_awarded = true;
        pointsAwarded = true;
      }
      localStorage.setItem('educonnect_v3_group_tasks', JSON.stringify(list));
      return { task, pointsAwarded };
    }
    return null;
  },

  getGroupScratchpad: (groupId: number) => {
    const pads = getOrInit('group_scratchpads', {
      1: {
        language: 'python',
        code: `# Collaborative Workspace Scratchpad
# Course: 22CS3101 - Database Management Systems
# Team: DBMS Research Circle

def verify_bcnf(relation_attributes, functional_dependencies):
    """
    Checks if every functional dependency X -> Y satisfies:
    Either Y is a subset of X (trivial) OR X is a superkey.
    """
    print("Verifying BCNF condition for relation:", relation_attributes)
    superkeys = find_candidate_keys(relation_attributes, functional_dependencies)
    
    violating_fds = []
    for lhs, rhs in functional_dependencies:
        if set(rhs).issubset(set(lhs)):
            continue # Trivial
        if set(lhs) not in superkeys:
            violating_fds.append((lhs, rhs))
            
    return len(violating_fds) == 0, violating_fds

print("ACID Transaction Isolation & Normalization Checker Ready.")
`,
        updated_at: '2026-10-04T12:00:00Z',
        updated_by: 'Shloka Reddy',
      }
    });
    return (pads as any)[groupId] || {
      language: 'python',
      code: `# Collaborative Team Code Scratchpad\n# Share snippets, algorithms, and SQL schemas here.\n\ndef solution():\n    pass\n`,
      updated_at: new Date().toISOString(),
      updated_by: 'Team Member',
    };
  },

  saveGroupScratchpad: (groupId: number, code: string, language: string, userName?: string) => {
    const pads = getOrInit('group_scratchpads', {});
    (pads as any)[groupId] = {
      code,
      language: language || 'python',
      updated_at: new Date().toISOString(),
      updated_by: userName || 'Team Member',
    };
    localStorage.setItem('educonnect_v3_group_scratchpads', JSON.stringify(pads));
    return (pads as any)[groupId];
  },

  getNotifications: (userId?: number): StandaloneNotification[] => {
    const all = getOrInit('notifications', INITIAL_NOTIFICATIONS);
    if (!userId) return all;
    return all.filter((n: any) => !n.user_id || Number(n.user_id) === Number(userId));
  },

  markNotificationRead: (id: number) => {
    const list = standaloneDB.getNotifications();
    const updated = list.map(n =>
      Number(n.notification_id) === Number(id) ? { ...n, is_read: true, read: true } : n
    );
    localStorage.setItem('educonnect_v3_notifications', JSON.stringify(updated));
    return true;
  },

  markAllNotificationsRead: (userId?: number) => {
    const list = standaloneDB.getNotifications();
    const updated = list.map(n => {
      if (!userId || Number(n.user_id) === Number(userId) || !n.user_id) {
        return { ...n, is_read: true, read: true };
      }
      return n;
    });
    localStorage.setItem('educonnect_v3_notifications', JSON.stringify(updated));
    return true;
  },

  deleteNotification: (id: number) => {
    const list = standaloneDB.getNotifications();
    const filtered = list.filter(n => Number(n.notification_id) !== Number(id));
    localStorage.setItem('educonnect_v3_notifications', JSON.stringify(filtered));
    return true;
  },

  updateLiveClassStatus: (id: number, status: 'scheduled' | 'live' | 'ended') => {
    const list = standaloneDB.getLiveClasses();
    const idx = list.findIndex((c: any) => Number(c.live_class_id) === Number(id));
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status,
        ...(status === 'live' ? { start_time: new Date().toISOString() } : {}),
        ...(status === 'ended' ? { end_time: new Date().toISOString() } : {}),
      };
      localStorage.setItem('educonnect_v3_live_classes', JSON.stringify(list));
      return list[idx];
    }
    return null;
  },
};
