const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://pasulashlokareddy:123@localhost:5432/digital_learning_db' });

function createPdf(title, author, roll, section, subject, contentLines) {
  const streamContent = [
    'BT',
    '/F1 16 Tf',
    '50 730 Td',
    '(' + title.replace(/[()\\\\]/g, '\\$&') + ') Tj',
    '/F1 11 Tf',
    '0 -25 Td',
    '(Student: ' + author.replace(/[()\\\\]/g, '\\$&') + ' | Roll: ' + roll + ' | Section: ' + section + ') Tj',
    '0 -18 Td',
    '(Course: ' + subject.replace(/[()\\\\]/g, '\\$&') + ' | KL Deemed to be University) Tj',
    '0 -25 Td',
    ...contentLines.map(line => '(' + line.replace(/[()\\\\]/g, '\\$&') + ') Tj 0 -16 Td'),
    'ET'
  ].join('\n');

  const streamLength = Buffer.byteLength(streamContent);

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '5 0 obj\n<< /Length ' + streamLength + ' >>\nstream\n' + streamContent + '\nendstream\nendobj'
  ];

  let body = '%PDF-1.4\n';
  const offsets = [];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body));
    body += obj + '\n';
  }

  const xrefOffset = Buffer.byteLength(body);
  body += 'xref\n0 6\n0000000000 65535 f \n';
  for (const off of offsets) {
    body += String(off).padStart(10, '0') + ' 00000 n \n';
  }

  body += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';
  return 'data:application/pdf;base64,' + Buffer.from(body).toString('base64');
}

async function run() {
  console.log('--- 1. Update Existing Submissions with Valid PDFs ---');
  const dbmsPdf1 = createPdf(
    'DBMS Fundamentals Assignment: Relational Schemas & ER Modeling',
    'PASULA SHLOKA', '2510030025', 'A4', 'CS2101 - DBMS',
    [
      'Executive Summary: Designed a comprehensive relational database schema for university LMS.',
      'Entity Definitions: Identified Student, Faculty, Course, Enrollment, Assignment and Submission entities.',
      'Primary Keys & Foreign Keys: Established relational integrity constraints and cascading deletions.',
      'ER Diagram Notation: Chen notation and Crow Foot notation cross-verified.',
      'Verification: Checked against Codd 12 Rules for Relational Database Management Systems.'
    ]
  );
  await pool.query('UPDATE submissions SET submission_url = $1 WHERE submission_id = 2', [dbmsPdf1]);

  const dbmsPdf2 = createPdf(
    'SQL Queries Assignment: Complex Joins & Query Optimization',
    'PASULA SHLOKA', '2510030025', 'A4', 'CS2101 - DBMS',
    [
      'Problem Statement: Write optimized SQL queries using INNER JOIN, LEFT JOIN, and window functions.',
      'Query 1: SELECT student_name, AVG(marks) OVER (PARTITION BY section) FROM exam_submissions;',
      'Query 2: EXPLAIN ANALYZE SELECT * FROM users u JOIN attendance a ON u.user_id = a.student_id;',
      'Optimization Result: Created B-Tree index on attendance(student_id, lecture_date), dropping query time from 42ms to 1.8ms.',
      'Conclusion: Verified against PostgreSQL execution engine with zero full-table scans.'
    ]
  );
  await pool.query('UPDATE submissions SET submission_url = $1 WHERE submission_id = 5', [dbmsPdf2]);
  console.log('Submissions 2 and 5 updated to valid Base64 PDFs!');

  console.log('--- 2. Ensure Assignments exist across all 6 courses ---');
  const newAssignments = [
    // Course 2: DSA 3 (Priya Sharma)
    {
      course_id: 2,
      title: 'AVL Tree Balancing & Rotations Lab',
      description: 'Implement AVL Tree insertion, deletion, and LL/RR/LR/RL rotation algorithms in C++ or Python with height verification.',
      max_marks: 25,
      unit_name: 'Unit 2: Self-Balancing Trees (AVL, Red-Black & B+ Trees)',
      due_date: '2026-10-15 23:59:00'
    },
    {
      course_id: 2,
      title: 'Dijkstra & Prim Graph Algorithms',
      description: 'Find shortest paths on dense graphs using Min-Heap priority queues and adjacency list representations.',
      max_marks: 20,
      unit_name: 'Unit 3: Graph Algorithms, Disjoint Sets & Flow Networks',
      due_date: '2026-10-20 23:59:00'
    },
    // Course 3: OSSP (Rajesh Verma)
    {
      course_id: 3,
      title: 'CPU Scheduling Simulation: Round Robin & MLFQ',
      description: 'Simulate preemptive Round Robin and Multi-Level Feedback Queue CPU schedulers with average turnaround and waiting times.',
      max_marks: 30,
      unit_name: 'Unit 2: Process Scheduling & Multithreading',
      due_date: '2026-10-14 23:59:00'
    },
    {
      course_id: 3,
      title: 'POSIX Semaphore Producer-Consumer Problem',
      description: 'Solve the bounded-buffer producer-consumer problem using sem_wait, sem_post, and pthread mutex locks in C.',
      max_marks: 20,
      unit_name: 'Unit 3: Synchronization, Semaphores & Deadlock Avoidance',
      due_date: '2026-10-22 23:59:00'
    },
    // Course 4: ML (DR. Lalitha)
    {
      course_id: 4,
      title: 'Linear & Polynomial Regression Modeling',
      description: 'Train gradient descent linear regression models with L1 (Lasso) and L2 (Ridge) regularization on real-world datasets.',
      max_marks: 25,
      unit_name: 'Unit 2: Supervised Learning (Regression & Classification)',
      due_date: '2026-10-16 23:59:00'
    },
    {
      course_id: 4,
      title: 'Decision Tree & Random Forest Classification',
      description: 'Build decision tree classifiers using Gini Impurity and Information Gain, evaluating ROC-AUC and Confusion Matrix.',
      max_marks: 25,
      unit_name: 'Unit 3: Decision Trees & Ensemble Architectures',
      due_date: '2026-10-24 23:59:00'
    },
    // Course 5: Japanese (Kenji Tanaka)
    {
      course_id: 5,
      title: 'Hiragana & Katakana Calligraphy & Translation',
      description: 'Transcribe 50 essential vocabulary words, write proper stroke orders, and complete conversational self-introduction (Jikoshoukai).',
      max_marks: 20,
      unit_name: 'Unit 1: Writing Systems (Hiragana & Katakana)',
      due_date: '2026-10-12 23:59:00'
    },
    {
      course_id: 5,
      title: 'Kanji Radicals & Japanese Sentence Markers',
      description: 'Practice JLPT N5 kanji compounds and identify subject/object particle markers (wa, ga, o, ni, de).',
      max_marks: 20,
      unit_name: 'Unit 2: Essential Kanji & Daily Greetings',
      due_date: '2026-10-19 23:59:00'
    },
    // Course 6: Embedded Systems (M. Satyanarayana)
    {
      course_id: 6,
      title: 'ARM Cortex-M GPIO & Interrupt Handling',
      description: 'Configure hardware timer interrupts and debounced pushbuttons to drive a 7-segment display on STM32 / ARM microcontroller.',
      max_marks: 25,
      unit_name: 'Unit 2: Digital I/O, Timers & Hardware Interrupts',
      due_date: '2026-10-17 23:59:00'
    },
    {
      course_id: 6,
      title: 'ESP32 I2C Sensor Interfacing & MQTT Telemetry',
      description: 'Read temperature and humidity from DHT22/BME280 sensor via I2C protocol and transmit telemetry packets via WiFi/MQTT.',
      max_marks: 25,
      unit_name: 'Unit 5: Sensor Interfacing & Low-Power IoT Nodes',
      due_date: '2026-10-25 23:59:00'
    }
  ];

  for (const a of newAssignments) {
    const exists = await pool.query('SELECT assignment_id FROM assignments WHERE course_id = $1 AND title = $2', [a.course_id, a.title]);
    if (exists.rows.length === 0) {
      await pool.query(
        `INSERT INTO assignments (course_id, title, description, max_marks, unit_name, due_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [a.course_id, a.title, a.description, a.max_marks, a.unit_name, a.due_date]
      );
      console.log('Added assignment:', a.title);
    }
  }

  console.log('--- 3. Seed Realistic Student Submissions for All Courses ---');
  const allAssignRes = await pool.query(`
    SELECT a.assignment_id, a.course_id, a.title, a.max_marks, c.course_code, c.course_name
    FROM assignments a
    JOIN courses c ON a.course_id = c.course_id
    ORDER BY a.course_id, a.assignment_id
  `);

  const studentsRes = await pool.query(`
    SELECT user_id, full_name, roll_number, section
    FROM users
    WHERE role = 'student'
    ORDER BY user_id
    LIMIT 30
  `);

  let addedSubmissions = 0;
  for (const assign of allAssignRes.rows) {
    for (let i = 0; i < 3; i++) {
      const student = studentsRes.rows[(assign.assignment_id * 3 + i) % studentsRes.rows.length];
      
      const subExists = await pool.query(
        'SELECT submission_id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
        [assign.assignment_id, student.user_id]
      );

      if (subExists.rows.length === 0) {
        const studentPdf = createPdf(
          assign.title + ' - Student Report',
          student.full_name,
          student.roll_number,
          student.section,
          assign.course_code + ' ' + assign.course_name,
          [
            'Objective: Implementation and verification of ' + assign.title + '.',
            'Architecture: Developed modular codebase meeting all technical rubric requirements.',
            'Algorithm Complexity: Time Complexity O(log N) average, Space Complexity O(N).',
            'Unit Tests: Successfully passed 15 automated test suites with 100% test coverage.',
            'Conclusion: All deliverables compiled cleanly with comprehensive documentation.'
          ]
        );

        const isGraded = (student.user_id + assign.assignment_id) % 2 === 0;
        const marks = isGraded ? Math.round(assign.max_marks * (0.8 + ((student.user_id % 20) / 100))) : null;
        const feedback = isGraded ? 'Good submission. Logic and test cases verified successfully.' : null;
        const status = isGraded ? 'graded' : 'submitted';

        await pool.query(
          `INSERT INTO submissions (assignment_id, student_id, submission_url, submitted_at, marks, feedback, status)
           VALUES ($1, $2, $3, NOW() - INTERVAL '1 day' * $4, $5, $6, $7)`,
          [assign.assignment_id, student.user_id, studentPdf, (i + 1), marks, feedback, status]
        );
        addedSubmissions++;
      }
    }
  }

  console.log(`Successfully added ${addedSubmissions} new submissions across courses!`);
  await pool.end();
}

run().catch(console.error);
