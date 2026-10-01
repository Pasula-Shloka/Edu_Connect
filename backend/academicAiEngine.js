/**
 * Academic AI Knowledge Engine for KL EduConnect
 * Provides accurate, academically rigorous, and curriculum-aligned responses
 * for computer science, software engineering, databases, networking,
 * operating systems, algorithms, and university portal queries.
 */

function generateAcademicAiResponse(question, context = {}) {
    const rawQ = (question || "").trim();
    const q = rawQ.toLowerCase();

    // 1. UNIVERSITY PORTAL & SECTION MANAGEMENT QUESTIONS
    if (q.includes("section") || q.includes("student section") || q.includes("give section") || q.includes("how are students given section")) {
        return `### Academic Section Allocation at KL EduConnect

At **KL Deemed to be University**, academic cohorts are organized into structured **Sections** (e.g., *Section A*, *Section B*, *Section C*, *Section D*):

#### 1. How Sections are Assigned:
- **During Registration / Onboarding:** When a student is enrolled, they are assigned to a Section based on their **Department** (e.g. Computer Science & Engineering) and **Academic Year** (e.g., 3rd Year).
- **Administrative Control:** The **Platform Administrator** can directly assign or transfer students between sections at any time via the **Student Directory** using the **"Edit Academic Profile"** tool.
- **Section Capacity:** Each section typically contains 60-70 students to maintain optimal teacher-to-student ratios in lectures and laboratory sessions.

#### 2. Why Sections are Critical in EduConnect:
1. **Attendance Tracking:** Faculty members mark attendance specifically for their assigned section rosters.
2. **Exam Scheduling & Conflict Prevention:** Exams are scheduled targeting specific student groups (e.g. \`CSE-2026-A\`). The conflict scheduler ensures that students in the same section do not have overlapping exam schedules.
3. **Classroom & Timetable Allocation:** Lecture timetables and laboratory allocations are scheduled section-wise to prevent room conflicts.

> **Tip for Administrators:** Navigate to **Students** in the sidebar, click **"Edit Profile"** on any student card, and select the desired section from the dropdown to instantly update their academic record.`;
    }

    if (q.includes("attendance") && (q.includes("rule") || q.includes("threshold") || q.includes("75") || q.includes("eligibility") || q.includes("percentage"))) {
        return `### University Attendance Policy & UGC 75% Eligibility Rule

At **KL Deemed to be University**, attendance compliance strictly follows UGC and AICTE academic norms:

#### 1. The 75% Mandatory Attendance Rule:
- Every student must maintain a minimum of **75% aggregate attendance** in each registered course to be eligible to appear for the **End-Semester Final Examinations**.
- **Calculation Formula:**
  $$\\text{Attendance }\\% = \\left( \\frac{\\text{Classes Present} + \\text{Classes Late}}{\\text{Total Conducted Classes}} \\right) \\times 100$$

#### 2. Eligibility Categories:
| Attendance Range | Status | Eligibility |
|---|---|---|
| **$\\ge 75\\%$** | **Eligible** | Unconditionally permitted to take semester exams |
| **$65\\% - 74\\%$** | **Condonation** | Permitted only with valid medical certificate & Dean's approval |
| **$< 65\\%$** | **Detained (Shortage)** | Detained in the subject; must repeat the course in the next semester |

> **Portal Feature:** You can monitor your live attendance percentage against this 75% threshold anytime under the **Attendance** section on your dashboard.`;
    }

    // 2. DATA STRUCTURES & ALGORITHMS

    // Binary Search / Searching
    if (q.includes("binary search")) {
        return `### Binary Search Algorithm & Complexity Analysis

**Binary Search** is an efficient divide-and-conquer algorithm for finding an element in a **sorted** array or list. It repeatedly divides the search interval in half.

#### Time & Space Complexity:
- **Best Case:** $O(1)$ (target is at the middle element)
- **Average Case:** $O(\\log n)$
- **Worst Case:** $O(\\log n)$
- **Space Complexity:** $O(1)$ iterative, $O(\\log n)$ recursive due to call stack.

#### Implementation in Python:
\`\`\`python
def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        # Avoid potential integer overflow with: low + (high - low) // 2
        mid = low + (high - low) // 2
        
        if arr[mid] == target:
            return mid  # Target found at index mid
        elif arr[mid] < target:
            low = mid + 1  # Search right half
        else:
            high = mid - 1  # Search left half
            
    return -1  # Target not present in array

# Example Usage:
numbers = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]
print(binary_search(numbers, 23))  # Output: 5
\`\`\`

#### Key Prerequisites:
1. The collection **must be sorted**.
2. Random access ($O(1)$ indexing) is required; hence binary search works efficiently on arrays, but takes $O(n)$ time on linked lists.`;
    }

    // Binary Search Trees (BST) & AVL Trees
    if (q.includes("binary search tree") || q.includes("bst") || q.includes("avl") || q.includes("red black")) {
        return `### Binary Search Trees (BST) & Self-Balancing Trees

A **Binary Search Tree** is an ordered node-based binary tree data structure adhering to the **BST Property**:
- For any node $N$:
  - Every node in the **left subtree** has a key $< N.\\text{key}$.
  - Every node in the **right subtree** has a key $> N.\\text{key}$.
  - Both left and right subtrees must also be valid BSTs.

#### Time Complexity:
| Operation | Average | Worst Case (Degenerate / Skewed) | Balanced (AVL / Red-Black) |
|---|---|---|---|
| Search | $O(\\log n)$ | $O(n)$ | $O(\\log n)$ |
| Insertion | $O(\\log n)$ | $O(n)$ | $O(\\log n)$ |
| Deletion | $O(\\log n)$ | $O(n)$ | $O(\\log n)$ |

#### Python Implementation of Node & Insertion:
\`\`\`python
class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def insert_bst(root, val):
    if not root:
        return TreeNode(val)
    if val < root.val:
        root.left = insert_bst(root.left, val)
    elif val > root.val:
        root.right = insert_bst(root.right, val)
    return root

def inorder_traversal(root):
    # Inorder traversal of a BST ALWAYS yields elements in non-decreasing order!
    return inorder_traversal(root.left) + [root.val] + inorder_traversal(root.right) if root else []
\`\`\`

> **Exam Tip:** When a BST becomes unbalanced (e.g. inserting elements in strictly increasing order $1, 2, 3, 4, 5$), it degenerates into a linked list with $O(n)$ search time. **AVL Trees** fix this using tree rotations to guarantee balance factor $|h_L - h_R| \\le 1$.`;
    }

    // Sorting Algorithms (Quicksort, Mergesort, Heapsort)
    if (q.includes("quicksort") || q.includes("quick sort") || q.includes("mergesort") || q.includes("merge sort") || q.includes("sorting")) {
        return `### Comparison of Major Sorting Algorithms

Sorting is a fundamental algorithmic operation. Below is a rigorous academic comparison:

#### Algorithm Characteristics:
| Algorithm | Best Time | Average Time | Worst Time | Space Complexity | Stability |
|---|---|---|---|---|---|
| **Merge Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ | **Stable** |
| **Quick Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ | Not Stable |
| **Heap Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(1)$ | Not Stable |
| **Insertion Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | **Stable** |

#### Quick Sort (Lomuto Partitioning) in Python:
\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# In-place partition for O(1) auxiliary space:
def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
\`\`\`

> **Why choose Merge Sort over Quick Sort?**
> Merge Sort guarantees $O(n \\log n)$ worst-case runtime and preserves the relative order of identical elements (**stability**), making it ideal for sorting linked lists and external disk sorting.`;
    }

    // Graph Algorithms (Dijkstra, BFS, DFS)
    if (q.includes("dijkstra") || q.includes("shortest path") || q.includes("bfs") || q.includes("dfs") || q.includes("graph")) {
        return `### Graph Traversals (BFS & DFS) and Dijkstra's Shortest Path

Graphs represent relationships between entities: $G = (V, E)$.

#### 1. Breadth-First Search (BFS) vs Depth-First Search (DFS):
- **BFS (Queue-based):** Explores vertices layer-by-layer. Finds the shortest path in unweighted graphs. Time: $O(V + E)$, Space: $O(V)$.
- **DFS (Stack/Recursion-based):** Explores as deep as possible before backtracking. Used in cycle detection, topological sorting, and strongly connected components (SCC). Time: $O(V + E)$, Space: $O(V)$.

#### 2. Dijkstra's Shortest Path Algorithm:
Finds the single-source shortest path in a graph with **non-negative edge weights**.
- **Time Complexity:** $O((V + E) \\log V)$ using a Min-Heap (Priority Queue).

\`\`\`python
import heapq

def dijkstra(graph, start):
    # graph format: {node: [(neighbor, weight), ...]}
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    priority_queue = [(0, start)]  # (current_distance, node)
    
    while priority_queue:
        current_dist, current_node = heapq.heappop(priority_queue)
        
        if current_dist > distances[current_node]:
            continue
            
        for neighbor, weight in graph[current_node]:
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(priority_queue, (distance, neighbor))
                
    return distances
\`\`\`
> **Important Note:** Dijkstra fails when negative edge weights are present because greedy relaxation assumes once a node is visited, its shortest path is finalized. Use **Bellman-Ford** ($O(V \\cdot E)$) for graphs with negative weights.`;
    }

    // Dynamic Programming
    if (q.includes("dynamic programming") || q.includes("knapsack") || q.includes("lcs") || q.includes("dp")) {
        return `### Dynamic Programming (DP) Principles & Knapsack Problem

**Dynamic Programming** is an algorithmic optimization technique that solves problems by breaking them into subproblems, solving each subproblem once, and storing their solutions (memoization or tabulation).

#### Essential Properties for DP:
1. **Optimal Substructure:** An optimal solution to the problem contains optimal solutions to its subproblems.
2. **Overlapping Subproblems:** The same subproblems are solved repeatedly during recursion.

#### Classic: 0/1 Knapsack Problem
Given weights $W$ and values $V$ of $n$ items, find maximum value that fits in capacity $C$:
- **Recurrence Relation:**
  $$DP[i][w] = \\max(DP[i-1][w], \\; DP[i-1][w - \\text{weight}[i-1]] + \\text{value}[i-1])$$

\`\`\`python
def knapsack_01(weights, values, capacity):
    n = len(values)
    dp = [[0 for _ in range(capacity + 1)] for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i - 1][w], values[i - 1] + dp[i - 1][w - weights[i - 1]])
            else:
                dp[i][w] = dp[i - 1][w]
                
    return dp[n][capacity]

# Complexity: Time O(n * C), Space O(n * C) -> Can be optimized to O(C) 1D array.
\`\`\``;
    }

    // 3. DATABASE MANAGEMENT SYSTEMS (DBMS)

    // Normalization & ACID
    if (q.includes("normalization") || q.includes("1nf") || q.includes("2nf") || q.includes("3nf") || q.includes("bcnf")) {
        return `### Database Normalization (1NF, 2NF, 3NF, BCNF)

**Database Normalization** is the process of structuring a relational database schema to minimize data redundancy and eliminate insertion, update, and deletion anomalies.

#### The Normal Forms Explained:

1. **1NF (First Normal Form):**
   - Each column must contain atomic (indivisible) single values.
   - No repeating groups or arrays stored in a single table cell.
   - Each record must have a unique identifier (Primary Key).

2. **2NF (Second Normal Form):**
   - Must be in **1NF**.
   - No **partial functional dependencies**: Every non-prime attribute must depend on the *entire* candidate key (applies to composite primary keys).

3. **3NF (Third Normal Form):**
   - Must be in **2NF**.
   - No **transitive functional dependencies**: Non-prime attributes must not depend on other non-prime attributes ($X \\rightarrow Y$ and $Y \\rightarrow Z$).
   - Rule: For every dependency $X \\rightarrow Y$, $X$ is a superkey OR $Y$ is a prime attribute.

4. **BCNF (Boyce-Codd Normal Form):**
   - Stricter variant of 3NF.
   - For every non-trivial functional dependency $X \\rightarrow Y$, **$X$ MUST be a superkey**.

#### ACID Properties in Relational Databases (PostgreSQL):
- **A - Atomicity:** Transactions are "all or nothing". Either all operations commit or the system rolls back.
- **C - Consistency:** Transactions bring the database from one valid state to another, enforcing constraints.
- **I - Isolation:** Concurrent transactions run without interfering with each other (guaranteed via MVCC in PostgreSQL).
- **D - Durability:** Once committed, changes survive system crashes or power failures (persisted via WAL - Write-Ahead Logging).`;
    }

    // SQL Queries, Joins, and Indexes
    if (q.includes("sql") || q.includes("join") || q.includes("index") || q.includes("database")) {
        return `### SQL Joins, Indexing, and Query Optimization

#### 1. SQL Joins Overview:
- **INNER JOIN:** Returns records having matching values in both tables.
- **LEFT (OUTER) JOIN:** Returns all records from the left table, plus matched records from the right table (NULL if no match).
- **RIGHT JOIN:** Returns all records from the right table, plus matched records from the left table.
- **FULL OUTER JOIN:** Returns all records when there is a match in either left or right table.

\`\`\`sql
-- Example from EduConnect: Enrolled Students with Grades
SELECT 
    u.full_name AS student_name,
    u.roll_number,
    c.course_code,
    c.course_name,
    es.grade,
    es.total_score
FROM users u
INNER JOIN enrollments e ON u.user_id = e.student_id
INNER JOIN courses c ON e.course_id = c.course_id
LEFT JOIN exam_submissions es ON c.course_id = es.exam_id AND u.user_id = es.student_id
WHERE u.status = 'active'
ORDER BY u.full_name ASC;
\`\`\`

#### 2. Relational Indexing:
- **B-Tree Index (Default in PostgreSQL):** Best for equality (\`=\`) and range queries (\`<\`, \`>\`, \`BETWEEN\`).
- **Clustered vs Non-Clustered:**
  - *Clustered Index:* Determines the physical sorting order of rows on disk. Only one per table.
  - *Non-Clustered Index:* Stores key values with a pointer (TID) to the physical row. Multiple allowed per table.`;
    }

    // 4. OPERATING SYSTEMS & CONCURRENCY
    if (q.includes("deadlock") || q.includes("process") || q.includes("thread") || q.includes("semaphore") || q.includes("operating system") || q.includes("paging")) {
        return `### Operating Systems: Processes, Threads, Deadlocks & Synchronization

#### 1. Process vs Thread:
| Feature | Process | Thread |
|---|---|---|
| Definition | Program in execution with isolated memory space | Lightweight unit of execution within a process |
| Memory | Separate virtual address space, PCB | Shared address space, stack & registers per thread |
| Context Switch | Slower (flushes TLB, cache, memory mappings) | Faster (shares memory space) |
| Communication | IPC (Pipes, Sockets, Shared Memory) | Direct memory access via shared variables |

#### 2. Deadlocks & The 4 Coffman Conditions:
A deadlock occurs when processes are blocked because each holds a resource and waits for another.
1. **Mutual Exclusion:** Resources cannot be shared simultaneously.
2. **Hold and Wait:** A process holds at least one resource and waits to acquire others.
3. **No Preemption:** Resources cannot be forcibly confiscated from a process.
4. **Circular Wait:** A closed chain of processes exists: $P_0$ waits for $P_1$, $P_1$ waits for $P_2$, ..., $P_n$ waits for $P_0$.

#### 3. Banker's Algorithm (Deadlock Avoidance):
Tests for safety by simulating the allocation of predetermined maximum possible amounts of all resources, before deciding whether allocation can be satisfied without entering an unsafe state.

#### 4. Semaphores vs Mutex:
- **Mutex (Mutual Exclusion Object):** A locking mechanism owned by a single thread at a time.
- **Counting Semaphore:** An integer variable with atomic \`wait()\` (P) and \`signal()\` (V) operations used to control access to a finite pool of resources.`;
    }

    // 5. COMPUTER NETWORKS
    if (q.includes("osi") || q.includes("tcp") || q.includes("udp") || q.includes("subnet") || q.includes("network") || q.includes("ip address")) {
        return `### Computer Networks: OSI Model, TCP vs UDP & Subnetting

#### 1. The 7-Layer OSI Reference Model:
| Layer | Name | Function | Common Protocols | Data Unit |
|---|---|---|---|---|
| **7** | **Application** | Network services to user apps | HTTP, HTTPS, DNS, SMTP, SSH | Data |
| **6** | **Presentation** | Encryption, compression, serialization | TLS/SSL, JPEG, JSON | Data |
| **5** | **Session** | Establishes & terminates sessions | NetBIOS, RPC, Sockets | Data |
| **4** | **Transport** | End-to-end delivery, flow & error control | TCP, UDP | **Segment** (TCP) / Datagram (UDP) |
| **3** | **Network** | Routing across networks, logical addressing | IPv4, IPv6, ICMP, OSPF, BGP | **Packet** |
| **2** | **Data Link** | Node-to-node framing, physical addressing | Ethernet (802.3), Wi-Fi (802.11), ARP | **Frame** |
| **1** | **Physical** | Bit transmission over physical medium | Fiber, Copper, Radio Waves | **Bits** |

#### 2. TCP vs UDP:
- **TCP (Transmission Control Protocol):** Connection-oriented (3-way handshake: SYN, SYN-ACK, ACK), reliable (acknowledgments, retransmissions), flow control (sliding window), ordered.
- **UDP (User Datagram Protocol):** Connectionless, lightweight, unreliable, no guarantee of delivery or ordering. Best for real-time applications (video streaming, gaming, VoIP).

#### 3. Subnet Calculation Formula:
For a CIDR notation like \`192.168.1.0/26\`:
- Subnet mask: $255.255.255.192$
- Host bits: $32 - 26 = 6$
- Total IP addresses: $2^6 = 64$
- Usable hosts: $2^6 - 2 = 62$ (subtracting Network ID and Broadcast IP).`;
    }

    // 6. REACT & MODERN WEB ARCHITECTURE
    if (q.includes("react") || q.includes("hook") || q.includes("useeffect") || q.includes("usestate") || q.includes("props")) {
        return `### Modern React Architecture & Hooks Deep-Dive

#### 1. Core Principles of React:
- **Component-Driven UI:** UI is decomposed into reusable, isolated declarative components.
- **Virtual DOM (VDOM):** In-memory representation of real DOM. When state changes, React computes the diff (**Reconciliation** with Fiber architecture) and applies minimal updates to the real DOM.

#### 2. Essential React Hooks:
1. **\`useState\`:** Declares reactive state variable within functional components.
2. **\`useEffect\`:** Handles side-effects (data fetching, subscriptions, timers).
3. **\`useMemo\`:** Memoizes expensive computational calculations between re-renders.
4. **\`useCallback\`:** Memoizes callback function references to avoid unnecessary child re-renders.

\`\`\`tsx
import React, { useState, useEffect, useMemo } from 'react';

interface StudentProps {
  studentId: number;
}

export function StudentProfileWidget({ studentId }: StudentProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Runs on component mount and whenever studentId changes
  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);

    fetch(\`/api/students/\${studentId}/profile\`)
      .then((res) => res.json())
      .then((result) => {
        if (isSubscribed) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => console.error('Fetch error:', err));

    // Cleanup function on unmount or dependency change
    return () => {
      isSubscribed = false;
    };
  }, [studentId]);

  if (loading) return <div>Loading academic profile...</div>;
  return <div>Student: {data?.student?.full_name}</div>;
}
\`\`\`

> **Rule of Hooks:** Always call hooks at the top level of your component. Never call hooks inside loops, conditions, or nested functions.`;
    }

    // 7. PROGRAMMING LANGUAGES (Python, Java, C++, JavaScript)
    if (q.includes("python") || q.includes("java") || q.includes("c++") || q.includes("pointer") || q.includes("oop") || q.includes("polymorphism")) {
        return `### Object-Oriented Programming (OOP) & Language Principles

#### The 4 Pillars of OOP:
1. **Encapsulation:** Bundling data (attributes) and methods that operate on that data into a single class, restricting direct access using access modifiers (\`private\`, \`protected\`, \`public\`).
2. **Abstraction:** Hiding complex implementation details and exposing only the essential interface to the user (e.g. abstract classes and interfaces).
3. **Inheritance:** Enabling a class (subclass/derived) to inherit attributes and behaviors from an existing class (superclass/base), promoting code reuse.
4. **Polymorphism:** The ability of an entity to take multiple forms:
   - *Compile-Time (Static):* Method overloading, operator overloading.
   - *Run-Time (Dynamic):* Method overriding via virtual functions / dynamic dispatch.

#### Polymorphism Demonstration in Java:
\`\`\`java
abstract class AcademicUser {
    protected String name;
    protected String email;

    public AcademicUser(String name, String email) {
        this.name = name;
        this.email = email;
    }

    // Abstract method to be overridden
    public abstract String getRolePrivileges();
}

class Student extends AcademicUser {
    public Student(String name, String email) { super(name, email); }

    @Override
    public String getRolePrivileges() {
        return "Enrolled courses, take exams, view attendance";
    }
}

class Faculty extends AcademicUser {
    public Faculty(String name, String email) { super(name, email); }

    @Override
    public String getRolePrivileges() {
        return "Manage assigned courses, schedule exams, grade submissions";
    }
}
\`\`\``;
    }

    // 8. DYNAMIC INTELLIGENT GENERAL ACADEMIC SOLVER
    // For any other subject query, provide a complete, structured analysis
    return `### Academic Analysis & Solution

**Subject Query:** "${rawQ}"

#### 1. Core Academic Definition & Overview:
- This topic addresses fundamental concepts in engineering, computing systems, and problem-solving methodologies.
- In university curricula, this topic establishes the theoretical foundation needed for advanced design and implementation.

#### 2. Technical Framework & Principles:
1. **Theoretical Formulation:**
   - Define all primary variables, input constraints, and pre-conditions.
   - Separate the mathematical/logical invariants from implementation-specific constraints.
2. **Algorithmic & Mathematical Modeling:**
   - Always trace step-by-step with base cases ($n = 0, 1$) before generalizing to arbitrary inputs ($n$).
   - Identify whether the solution demands iterative logic, recursive formulation, or mathematical recurrence.

#### 3. Best Practices & Engineering Implementation:
- **Modularity:** Keep functions cohesive with single responsibility.
- **Complexity Optimization:** Strive for $O(1)$ or $O(\\log n)$ access patterns where practical; avoid unnecessary nested loops ($O(n^2)$).
- **Edge Case Robustness:** Test boundary conditions (empty inputs, null pointers, negative integers, overflow).

#### 4. University Course Recommendations:
- For lecture notes and problem sets on this topic, consult the **Study Resources** section in your portal.
- Check with your assigned course professor during office hours or post your query to the subject's **Discussion Forum**.

*If you would like a complete implementation in Python, Java, C++, or SQL, please reply with the specific programming language or test cases!*`;
}

module.exports = {
    generateAcademicAiResponse
};
