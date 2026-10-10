const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function run() {
  console.log("=== STARTING IMPORT OF 2ND YEAR STUDENTS & 6 CSE COURSES ===");

  // 1. Setup the 6 Faculty members (1 faculty per course)
  console.log("\n1. Ensuring 6 Faculty members exist...");

  // Existing:
  // user_id 4: Dr. K. Srinivas Rao -> DBMS
  // user_id 6: Dr. Priya Sharma -> DSA 3
  // user_id 10: DR.Lalitha -> Machine Learning
  // user_id 12: Dr. Rajesh Verma (currently 'New Faculty') -> OSSP
  const facultyPassword = await bcrypt.hash('faculty123', 10);

  // Update user_id 12 name to Dr. Rajesh Verma
  await pool.query(`UPDATE users SET full_name = 'Dr. Rajesh Verma' WHERE user_id = 12`);

  // Widen section column to varchar(50) to allow any section names
  await pool.query(`ALTER TABLE users ALTER COLUMN section TYPE VARCHAR(50)`);

  // Ensure Sensei Kenji Tanaka (Japanese)
  let fJapanese = await pool.query(`SELECT user_id FROM users WHERE email = 'kenji.tanaka@klh.edu.in'`);
  let fJapaneseId;
  if (fJapanese.rows.length === 0) {
    const res = await pool.query(`
      INSERT INTO users (full_name, email, password_hash, role, department, status, year, section)
      VALUES ('Sensei Kenji Tanaka', 'kenji.tanaka@klh.edu.in', $1, 'faculty', 'Department of Foreign Languages', 'active', 'Faculty', 'Japanese')
      RETURNING user_id
    `, [facultyPassword]);
    fJapaneseId = res.rows[0].user_id;
  } else {
    fJapaneseId = fJapanese.rows[0].user_id;
  }

  // Ensure Dr. M. Satyanarayana (Embedded Systems)
  let fEmbedded = await pool.query(`SELECT user_id FROM users WHERE email = 'm.satyanarayana@klh.edu.in'`);
  let fEmbeddedId;
  if (fEmbedded.rows.length === 0) {
    const res = await pool.query(`
      INSERT INTO users (full_name, email, password_hash, role, department, status, year, section)
      VALUES ('Dr. M. Satyanarayana', 'm.satyanarayana@klh.edu.in', $1, 'faculty', 'Computer Science & Engineering', 'active', 'Faculty', 'Embedded')
      RETURNING user_id
    `, [facultyPassword]);
    fEmbeddedId = res.rows[0].user_id;
  } else {
    fEmbeddedId = fEmbedded.rows[0].user_id;
  }

  console.log(`Faculty IDs:
  - DBMS: 4 (Dr. K. Srinivas Rao)
  - DSA 3: 6 (Dr. Priya Sharma)
  - Machine Learning: 10 (DR.Lalitha)
  - OSSP: 12 (Dr. Rajesh Verma)
  - Japanese: ${fJapaneseId} (Sensei Kenji Tanaka)
  - Embedded Systems: ${fEmbeddedId} (Dr. M. Satyanarayana)`);

  // 2. Setup the 6 Courses with 1 faculty per course
  console.log("\n2. Configuring exactly 6 CSE Subjects...");

  const targetCourses = [
    {
      course_id: 1,
      code: 'CS2101',
      name: 'Database Management Systems (DBMS)',
      desc: 'Relational data modeling, schema normalization (1NF-BCNF), advanced SQL query optimization, transaction processing, and ACID concurrency guarantees.',
      faculty_id: 4
    },
    {
      course_id: 2,
      code: 'CS2102',
      name: 'Data Structures and Algorithms 3 (DSA 3)',
      desc: 'Advanced non-linear data structures, self-balancing trees (AVL, Red-Black, B+ Trees), flow networks, dynamic programming paradigms, and amortized complexity analysis.',
      faculty_id: 6
    },
    {
      course_id: 3,
      code: 'CS2103',
      name: 'Operating Systems & System Programming (OSSP)',
      desc: 'Monolithic and microkernel architectures, system call interfaces, POSIX threads, synchronization primitives (mutex, semaphores), virtual memory paging, and UNIX system programming.',
      faculty_id: 12
    },
    {
      course_id: 4,
      code: 'CS2104',
      name: 'Machine Learning (ML)',
      desc: 'Mathematical foundations of machine learning, supervised classification and regression, ensemble methods, unsupervised clustering, PCA dimensionality reduction, and neural architectures.',
      faculty_id: 10
    },
    {
      course_id: 5,
      code: 'LAN2105',
      name: 'Foreign Language: Japanese (Nihongo)',
      desc: 'Comprehensive Japanese language curriculum covering Hiragana, Katakana, basic Kanji, everyday conversational vocabulary, sentence grammar patterns, and cultural business etiquette.',
      faculty_id: fJapaneseId
    },
    {
      course_id: 6,
      code: 'CS2106',
      name: 'Embedded Systems & IoT Architecture',
      desc: 'Microcontroller architectures (ARM Cortex-M), peripheral interfacing (GPIO, Timers, PWM), communication buses (I2C, SPI, UART, CAN), and FreeRTOS task scheduling.',
      faculty_id: fEmbeddedId
    }
  ];

  for (const c of targetCourses) {
    const exists = await pool.query('SELECT course_id FROM courses WHERE course_id = $1', [c.course_id]);
    if (exists.rows.length === 0) {
      await pool.query(`
        INSERT INTO courses (course_id, course_code, course_name, description, faculty_id, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [c.course_id, c.code, c.name, c.desc, c.faculty_id]);
    } else {
      await pool.query(`
        UPDATE courses 
        SET course_code = $1, course_name = $2, description = $3, faculty_id = $4
        WHERE course_id = $5
      `, [c.code, c.name, c.desc, c.faculty_id, c.course_id]);
    }
  }

  // Clean up any old references to courses outside 1-6
  await pool.query(`DELETE FROM enrollments WHERE course_id NOT IN (1, 2, 3, 4, 5, 6)`);
  await pool.query(`DELETE FROM attendance WHERE course_id NOT IN (1, 2, 3, 4, 5, 6)`);
  await pool.query(`DELETE FROM assignments WHERE course_id NOT IN (1, 2, 3, 4, 5, 6)`);
  await pool.query(`DELETE FROM groups WHERE course_id NOT IN (1, 2, 3, 4, 5, 6)`);
  await pool.query(`DELETE FROM course_units WHERE course_id NOT IN (1, 2, 3, 4, 5, 6)`);
  await pool.query(`DELETE FROM courses WHERE course_id NOT IN (1, 2, 3, 4, 5, 6)`);

  console.log("6 Courses configured in PostgreSQL successfully.");

  // 3. Setup Distinct 5 Units for every one of the 6 courses
  console.log("\n3. Seeding Distinct Units 1 to 5 for each course...");
  await pool.query('DELETE FROM course_units');

  const courseUnitsData = [
    // Course 1: DBMS
    { cid: 1, unum: 1, title: 'Unit 1: Relational Data Models & ER Schemas', desc: 'Entity-relationship diagrams, schema translation, relational algebra operators, and domain integrity constraints.' },
    { cid: 1, unum: 2, title: 'Unit 2: Advanced SQL & Query Optimization', desc: 'Complex multi-table joins, correlated subqueries, B-Tree index tuning, and PostgreSQL query execution plans.' },
    { cid: 1, unum: 3, title: 'Unit 3: Schema Normalization & BCNF', desc: 'Functional dependencies, minimal cover, 1NF, 2NF, 3NF, Boyce-Codd Normal Form, and lossless decomposition algorithms.' },
    { cid: 1, unum: 4, title: 'Unit 4: Transaction Processing & ACID Guarantees', desc: 'Atomicity, Consistency, Isolation, Durability, write-ahead logging (WAL), checkpoints, and crash recovery states.' },
    { cid: 1, unum: 5, title: 'Unit 5: Concurrency Control & NoSQL Paradigms', desc: 'Two-phase locking (2PL), deadlock prevention, multi-version concurrency control (MVCC), and distributed document stores.' },

    // Course 2: DSA 3
    { cid: 2, unum: 1, title: 'Unit 1: Non-Linear Structures, Advanced Trees & Trie', desc: 'Multi-way trees, Prefix Trees (Tries), Compressed Tries, Suffix Trees, and string pattern searching.' },
    { cid: 2, unum: 2, title: 'Unit 2: Self-Balancing Trees (AVL, Red-Black & B+ Trees)', desc: 'Height-balanced AVL rotations, Red-Black color invariant balancing, B-Trees, and disk-oriented B+ Tree index structures.' },
    { cid: 2, unum: 3, title: 'Unit 3: Graph Algorithms, Disjoint Sets & Flow Networks', desc: 'Disjoint-set union find with path compression, maximum network flow (Ford-Fulkerson, Edmonds-Karp), and bipartite matching.' },
    { cid: 2, unum: 4, title: 'Unit 4: Dynamic Programming & Greedy Paradigms', desc: 'Matrix chain multiplication, optimal binary search trees, subset sum, 0/1 knapsack, and amortized complexity bounds.' },
    { cid: 2, unum: 5, title: 'Unit 5: Intractability, NP-Completeness & Approximation', desc: 'P vs NP classes, polynomial-time reductions, Vertex Cover, Clique, Traveling Salesperson, and approximation algorithms.' },

    // Course 3: OSSP
    { cid: 3, unum: 1, title: 'Unit 1: OS Architecture, Kernel Design & System Calls', desc: 'Monolithic vs microkernel architecture, dual-mode execution (User/Kernel), traps, system call mechanics, and process control blocks.' },
    { cid: 3, unum: 2, title: 'Unit 2: Process Scheduling & Multithreading', desc: 'Preemptive vs non-preemptive algorithms, Multi-Level Feedback Queues (MLFQ), POSIX pthreads, and multicore scheduling.' },
    { cid: 3, unum: 3, title: 'Unit 3: Synchronization, Semaphores & Deadlock Avoidance', desc: 'Critical section problem, Peterson algorithm, hardware atomic operations, counting semaphores, and Banker algorithm.' },
    { cid: 3, unum: 4, title: 'Unit 4: Virtual Memory Management & Paging Systems', desc: 'Address translation, page tables, Translation Lookaside Buffer (TLB), page replacement policies (LRU, Clock), and thrashing.' },
    { cid: 3, unum: 5, title: 'Unit 5: UNIX System Programming & File Subsystems', desc: 'Inodes, ext4 file layout, disk scheduling (SCAN, C-LOOK), IPC channels (pipes, FIFOs, message queues), and signal handling.' },

    // Course 4: Machine Learning
    { cid: 4, unum: 1, title: 'Unit 1: Foundations of ML & Mathematical Preliminaries', desc: 'Linear algebra, vector spaces, gradient descent optimization variants, bias-variance tradeoff, and data preprocessing pipelines.' },
    { cid: 4, unum: 2, title: 'Unit 2: Supervised Learning (Regression & Classification)', desc: 'Ordinary Least Squares, Ridge/Lasso regularization, Logistic Regression, Support Vector Machines (SVM), and kernel tricks.' },
    { cid: 4, unum: 3, title: 'Unit 3: Decision Trees & Ensemble Architectures', desc: 'Information gain, Gini impurity, CART algorithms, Bagging, Random Forests, AdaBoost, and Gradient Boosting Machines (XGBoost).' },
    { cid: 4, unum: 4, title: 'Unit 4: Unsupervised Learning & Dimensionality Reduction', desc: 'K-Means clustering, hierarchical clustering, Gaussian Mixture Models, Principal Component Analysis (PCA), and t-SNE projection.' },
    { cid: 4, unum: 5, title: 'Unit 5: Neural Networks & Model Validation', desc: 'Multilayer Perceptrons, backpropagation mathematics, activation functions, cross-validation methods, ROC-AUC, and hyperparameter tuning.' },

    // Course 5: Japanese Language
    { cid: 5, unum: 1, title: 'Unit 1: Writing Systems (Hiragana & Katakana)', desc: 'Phonetic alphabets, character stroke order, dakuten/handakuten modifications, and Katakana foreign loanwords pronunciation.' },
    { cid: 5, unum: 2, title: 'Unit 2: Essential Kanji & Daily Greetings', desc: 'Foundational 50 N5 Kanji radicals, numbers, time, days, basic introductions (Jikoshoukai), and formal classroom greetings.' },
    { cid: 5, unum: 3, title: 'Unit 3: Sentence Grammar & Particle Markers', desc: 'SOV word order, topic marker (wa), direct object (o), location markers (de, ni), and verb classifications (U-verbs, Ru-verbs).' },
    { cid: 5, unum: 4, title: 'Unit 4: Adjectives, Time Expressions & Requests', desc: 'I-adjectives and Na-adjectives conjugation, past tense forms, Te-form verb usage for making requests, and giving directions.' },
    { cid: 5, unum: 5, title: 'Unit 5: Conversational Fluency & Japanese Work Culture', desc: 'Everyday campus and office dialogue, polite honorific speech (Keigo introduction), and JLPT N5 listening practice.' },

    // Course 6: Embedded Systems
    { cid: 6, unum: 1, title: 'Unit 1: Microcontroller Hardware & ARM Cortex-M Architecture', desc: 'Harvard vs von Neumann architectures, ARM Cortex-M core registers, memory map, reset sequence, and embedded C programming.' },
    { cid: 6, unum: 2, title: 'Unit 2: Digital I/O, Timers & Hardware Interrupts', desc: 'GPIO configuration (push-pull, open-drain), hardware timer counter modules, PWM waveform generation, and NVIC interrupt controller.' },
    { cid: 6, unum: 3, title: 'Unit 3: Synchronous & Asynchronous Serial Protocols', desc: 'UART asynchronous frame structure, SPI master-slave bus topologies, and I2C two-wire arbitration with start/stop conditions.' },
    { cid: 6, unum: 4, title: 'Unit 4: Real-Time Operating Systems (RTOS)', desc: 'Preemptive priority task scheduling in FreeRTOS, task states, task delays, semaphores, queues, and priority inversion mitigation.' },
    { cid: 6, unum: 5, title: 'Unit 5: Sensor Interfacing & Low-Power IoT Nodes', desc: 'Analog-to-Digital Converter (ADC) sampling, sensor calibration (I2C temp/IMU), low-power sleep modes, and MQTT protocol basics.' }
  ];

  for (const u of courseUnitsData) {
    await pool.query(`
      INSERT INTO course_units (course_id, unit_number, unit_title, description)
      VALUES ($1, $2, $3, $4)
    `, [u.cid, u.unum, u.title, u.desc]);
  }
  console.log("30 distinct course units successfully seeded across all 6 courses.");

  // 4. Parse and import 426 Second Year Students
  console.log("\n4. Reading second_year_students.csv and importing students...");
  const csvPath = path.join(__dirname, 'second_year_students.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim().length > 0);

  // Headers: S.No,Roll No,Name,Section
  const studentRows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length >= 4) {
      const sno = parts[0].trim();
      const rollNo = parts[1].trim();
      const name = parts.slice(2, parts.length - 1).join(',').replace(/\s+/g, ' ').trim();
      const section = parts[parts.length - 1].trim();
      studentRows.push({ sno, rollNo, name, section });
    }
  }

  console.log(`Parsed ${studentRows.length} students from CSV.`);

  const studentDefaultPasswordHash = await bcrypt.hash('student123', 10);
  let importedCount = 0;
  let updatedCount = 0;

  for (const student of studentRows) {
    const email = `${student.rollNo}@klh.edu.in`;
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const parentName = `Parent of ${student.name.split(' ')[0]}`;
    const parentPhone = `+91 98480 ${Math.floor(10000 + Math.random() * 90000)}`;

    const check = await pool.query('SELECT user_id FROM users WHERE roll_number = $1 OR email = $2', [student.rollNo, email]);

    let studentUserId;
    if (check.rows.length === 0) {
      const res = await pool.query(`
        INSERT INTO users (
          full_name, email, password_hash, role, department, year, section, 
          roll_number, parent_pin, parent_phone, parent_name, status, created_at
        ) VALUES (
          $1, $2, $3, 'student', 'Computer Science & Engineering', '2nd Year', $4,
          $5, $6, $7, $8, 'active', CURRENT_TIMESTAMP
        ) RETURNING user_id
      `, [
        student.name, email, studentDefaultPasswordHash, student.section,
        student.rollNo, pin, parentPhone, parentName
      ]);
      studentUserId = res.rows[0].user_id;
      importedCount++;
    } else {
      studentUserId = check.rows[0].user_id;
      await pool.query(`
        UPDATE users 
        SET full_name = $1, section = $2, year = '2nd Year', department = 'Computer Science & Engineering'
        WHERE user_id = $3
      `, [student.name, student.section, studentUserId]);
      updatedCount++;
    }

    // Enroll student in all 6 courses
    for (let cId = 1; cId <= 6; cId++) {
      const enrCheck = await pool.query(
        'SELECT enrollment_id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [studentUserId, cId]
      );
      if (enrCheck.rows.length === 0) {
        await pool.query(`
          INSERT INTO enrollments (student_id, course_id, enrolled_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [studentUserId, cId]);
      }
    }
  }

  console.log(`\nImport Summary:
  - New Students Inserted: ${importedCount}
  - Existing Students Updated: ${updatedCount}
  - Total 2nd Year Students Processed: ${importedCount + updatedCount}
  - Enrolled in All 6 CSE Courses: Yes (Courses 1 to 6)`);

  // Print section distribution
  const secDist = await pool.query(`
    SELECT section, count(*) as count 
    FROM users 
    WHERE year = '2nd Year' AND role = 'student'
    GROUP BY section 
    ORDER BY section
  `);
  console.log("\n2nd Year Students Section Breakdown in Database:");
  secDist.rows.forEach(r => console.log(`  - Section ${r.section}: ${r.count} students`));

  console.log("\n=== 2ND YEAR DATA & 6 SUBJECTS MIGRATION COMPLETED SUCCESSFULLY ===");
  pool.end();
}

run().catch(err => {
  console.error("Migration error:", err);
  pool.end();
});
