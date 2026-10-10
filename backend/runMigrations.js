const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./db");

async function migrate() {
    console.log("--- 1. Assigning 1 Course per Faculty ---");
    // Faculty:
    // 4  -> Dr. K. Srinivas Rao (CS101 DBMS)
    // 6  -> Dr. Priya Sharma (CS102 Data Structures)
    // 10 -> DR.Lalitha (CS201 OOP with Java)
    // 12 -> New Faculty (CS103 Operating Systems)
    await pool.query("UPDATE courses SET faculty_id = 4 WHERE course_id = 1");
    await pool.query("UPDATE courses SET faculty_id = 6 WHERE course_id = 2");
    await pool.query("UPDATE courses SET faculty_id = 10 WHERE course_id = 24");
    await pool.query("UPDATE courses SET faculty_id = 12 WHERE course_id = 25");

    // Remove or unassign excess courses 26 & 27 so each faculty has exactly 1 course
    await pool.query("DELETE FROM enrollments WHERE course_id IN (26, 27)");
    await pool.query("DELETE FROM course_units WHERE course_id IN (26, 27)");
    await pool.query("DELETE FROM assignments WHERE course_id IN (26, 27)");
    await pool.query("DELETE FROM courses WHERE course_id IN (26, 27)");

    console.log("--- 2. Setting up distinct Units 1-5 for each Course ---");
    await pool.query("DELETE FROM course_units");
  
    const units = [
        // Course 1: CS101 DBMS (Faculty: Dr. K. Srinivas Rao)
        { course_id: 1, num: 1, title: "Unit 1: Relational Data Models & ER Schemas", desc: "Entities, relationships, ER diagrams, relational model constraints, mapping ER to relational tables" },
        { course_id: 1, num: 2, title: "Unit 2: Advanced SQL & Query Optimization", desc: "Complex joins, aggregate functions, nested subqueries, views, triggers, and cost-based query optimization" },
        { course_id: 1, num: 3, title: "Unit 3: Schema Normalization & BCNF", desc: "Functional dependencies, 1NF, 2NF, 3NF, Boyce-Codd Normal Form, and lossless decomposition" },
        { course_id: 1, num: 4, title: "Unit 4: Transaction Processing & ACID Guarantees", desc: "Schedules, serializability, conflict serializability, WAL protocols, and recovery systems" },
        { course_id: 1, num: 5, title: "Unit 5: Concurrency Control & NoSQL Paradigms", desc: "Two-phase locking (2PL), deadlock handling, B+ Tree indexing, MongoDB and document-store databases" },

        // Course 2: CS102 Data Structures (Faculty: Dr. Priya Sharma)
        { course_id: 2, num: 1, title: "Unit 1: Linear Structures, Stacks & Queues", desc: "Abstract Data Types, arrays, circular queues, infix-to-postfix conversion, and recursion call stack" },
        { course_id: 2, num: 2, title: "Unit 2: Linked Lists & Dynamic Memory", desc: "Singly, doubly, and circular linked lists, polynomial manipulation, and sparse matrix representations" },
        { course_id: 2, num: 3, title: "Unit 3: Hierarchical Trees & Balanced BSTs", desc: "Binary search trees, AVL self-balancing trees, Red-Black tree properties, and tree traversal algorithms" },
        { course_id: 2, num: 4, title: "Unit 4: Graph Theory & Shortest Path Algorithms", desc: "Adjacency matrix/list representations, BFS, DFS, Dijkstra algorithm, Prim and Kruskal MST algorithms" },
        { course_id: 2, num: 5, title: "Unit 5: Hashing, Collision Resolution & Sorting", desc: "Hash functions, linear probing, quadratic probing, separate chaining, QuickSort, and MergeSort" },

        // Course 24: CS201 OOP with Java (Faculty: Dr. Lalitha)
        { course_id: 24, num: 1, title: "Unit 1: OOP Paradigms & Java Virtual Machine", desc: "Java syntax, byte-code execution, class blueprints, memory allocation (Stack vs Heap), and encapsulation" },
        { course_id: 24, num: 2, title: "Unit 2: Inheritance, Interfaces & Polymorphism", desc: "Abstract classes, interface contracts, dynamic method dispatch, method overloading vs overriding" },
        { course_id: 24, num: 3, title: "Unit 3: Exception Architecture & Multithreading", desc: "Try-catch-finally blocks, custom checked exceptions, Thread lifecycle, synchronization locks, inter-thread comm" },
        { course_id: 24, num: 4, title: "Unit 4: Java Collections & Generics Framework", desc: "List, Set, Map hierarchies, ArrayList, HashMap, LinkedList, Comparator/Comparable, type-safe generics" },
        { course_id: 24, num: 5, title: "Unit 5: Stream APIs, Lambdas & JDBC Connectivity", desc: "Functional programming in Java 8+, stream pipeline filters/maps, JDBC database drivers and prepared statements" },

        // Course 25: CS103 Operating Systems (Faculty: New Faculty)
        { course_id: 25, num: 1, title: "Unit 1: OS Architecture & System Call Interface", desc: "Kernel modes, dual-mode operation, trap mechanisms, process control blocks (PCB), and system calls" },
        { course_id: 25, num: 2, title: "Unit 2: CPU Scheduling & IPC Mechanisms", desc: "FCFS, SJF, Round-Robin, Multi-level feedback queues, shared memory, pipes, and message queues" },
        { course_id: 25, num: 3, title: "Unit 3: Concurrency, Semaphores & Deadlock", desc: "Critical section problem, Peterson algorithm, mutex locks, semaphores, Banker algorithm for deadlock avoidance" },
        { course_id: 25, num: 4, title: "Unit 4: Memory Architecture, Paging & TLB", desc: "Contiguous memory allocation, paging hardware, TLB cache hit/miss, segmentation, and virtual memory page replacement" },
        { course_id: 25, num: 5, title: "Unit 5: Storage Subsystems & File Protection", desc: "Disk scheduling (SCAN, C-SCAN), inode structure, file allocation methods, directory caches, access control lists" }
    ];

    for (const u of units) {
        await pool.query(
            "INSERT INTO course_units (course_id, unit_number, unit_title, description) VALUES ($1, $2, $3, $4)",
            [u.course_id, u.num, u.title, u.desc]
        );
    }

    console.log("--- 3. Segregating Students into Section A & Section B ---");
    // Section A students: Hansikha (1), Shloka (2), Rithika (3), Shloka (7), Suhaanthi (14), Ananya (18)
    await pool.query("UPDATE users SET section = 'Section A' WHERE user_id IN (1, 2, 3, 7, 14, 18)");
    // Section B students: 8, 9, 11, 13, 16, 17
    await pool.query("UPDATE users SET section = 'Section B' WHERE user_id IN (8, 9, 11, 13, 16, 17)");

    console.log("--- 4. Adding Parent Columns to users ---");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_pin VARCHAR(10) DEFAULT '849201'");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20) DEFAULT '+91 98480 22334'");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_name VARCHAR(100) DEFAULT 'P. Ramesh Reddy'");

    // Update demo student Shloka Reddy
    await pool.query(
        "UPDATE users SET parent_pin = '849201', parent_phone = '+91 98480 22334', parent_name = 'P. Ramesh Reddy', roll_number = '2200030001' WHERE user_id = 2 OR email = '2200030001@klh.edu.in'"
    );

    console.log("--- 5. Creating student_vibes and parent_notifications tables ---");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS student_vibes (
            vibe_id SERIAL PRIMARY KEY,
            student_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            vibe_type VARCHAR(50) NOT NULL,
            vibe_note VARCHAR(255),
            checkin_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (student_id, checkin_date)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS parent_notifications (
            notification_id SERIAL PRIMARY KEY,
            student_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            parent_phone VARCHAR(20),
            channel VARCHAR(20) DEFAULT 'WhatsApp',
            message_content TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'Delivered',
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Add role column to group_members
    await pool.query("ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Member'");

    // Seed sample student vibes for today
    await pool.query(`
        INSERT INTO student_vibes (student_id, vibe_type, vibe_note, checkin_date)
        VALUES 
            (1, 'high_voltage', 'Excited for DBMS lab demo!', CURRENT_DATE),
            (3, 'coffee_needed', 'Need coffee before Section A algorithm class', CURRENT_DATE),
            (7, 'high_voltage', 'Ready for code sprint', CURRENT_DATE),
            (9, 'exam_panic', 'Studying for normalization quiz', CURRENT_DATE),
            (11, 'coffee_needed', 'Morning lecture energy', CURRENT_DATE),
            (14, 'high_voltage', 'Sprint goal achieved', CURRENT_DATE)
        ON CONFLICT (student_id, checkin_date) DO UPDATE SET vibe_type = EXCLUDED.vibe_type
    `);

    console.log("Migration executed cleanly and successfully!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
});
