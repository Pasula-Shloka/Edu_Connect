/**
 * Academic AI Knowledge Engine for KL EduConnect (Client-Side Standalone)
 * Delivers instant, syllabus-aligned academic responses for algorithms,
 * data structures, operating systems, databases, networking, and university policies.
 */

export function generateAcademicAiResponse(question: string, context: any = {}): string {
  const rawQ = (question || "").trim();
  const q = rawQ.toLowerCase();

  // 1. UNIVERSITY PORTAL & SECTION MANAGEMENT
  if (q.includes("section") || q.includes("student section") || q.includes("give section") || q.includes("how are students given section")) {
    return `### Academic Section Allocation at KL EduConnect

At **KL Deemed to be University**, academic cohorts are organized into structured **Sections** (e.g., *Section A*, *Section B*, *Section C*, *Section D*):

#### 1. How Sections are Assigned:
- **During Registration / Onboarding:** When a student is enrolled, they are assigned to a Section based on their **Department** (e.g. Computer Science & Engineering) and **Academic Year** (e.g., 3rd Year).
- **Administrative Control:** The **Platform Administrator** can directly assign or transfer students between sections at any time via the **Student Directory** using the **"Edit Academic Profile / Section"** button.
- **Section Capacity:** Each section typically contains 50–60 students to maintain optimal teacher-to-student ratios in lectures and laboratory sessions.

#### 2. Why Sections are Critical in EduConnect:
1. **Attendance Tracking:** Faculty members mark attendance specifically for their assigned section rosters.
2. **Exam Scheduling & Conflict Prevention:** Exams are scheduled targeting specific student groups (e.g. \`CSE-2026-A\`). The conflict scheduler ensures that students in the same section do not have overlapping exam schedules.
3. **Classroom & Timetable Allocation:** Lecture timetables and laboratory allocations are scheduled section-wise to prevent room conflicts.

> **Tip for Administrators:** Navigate to **Students** in the sidebar, click the **"Section"** button on any student card, and select the desired section from the dropdown to instantly update their academic record.`;
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
| **≥ 75%** | **Eligible** | Unconditionally permitted to take semester exams |
| **65% - 74%** | **Condonation** | Permitted only with valid medical certificate & Dean's approval |
| **< 65%** | **Detained (Shortage)** | Detained in the subject; must repeat the course in the next semester |

> **Portal Feature:** You can monitor your live attendance percentage against this 75% threshold anytime under the **Attendance** section on your dashboard.`;
  }

  // 2. DATA STRUCTURES & ALGORITHMS
  if (q.includes("binary search") && !q.includes("tree")) {
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
        mid = low + (high - low) // 2
        
        if arr[mid] == target:
            return mid  # Target found
        elif arr[mid] < target:
            low = mid + 1  # Search right half
        else:
            high = mid - 1  # Search left half
            
    return -1  # Target not found

# Example Usage:
numbers = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]
print(binary_search(numbers, 23))  # Output: 5
\`\`\`

#### Key Prerequisites:
1. The collection **must be sorted**.
2. Random access ($O(1)$ indexing) is required; hence binary search works efficiently on arrays, but takes $O(n)$ time on linked lists.`;
  }

  if (q.includes("binary search tree") || q.includes("bst") || q.includes("avl") || q.includes("red black")) {
    return `### Binary Search Trees (BST) & Self-Balancing Trees

A **Binary Search Tree** is an ordered node-based binary tree data structure adhering to the **BST Property**:
- For any node $N$:
  - Every node in the **left subtree** has a key $< N.\\text{key}$.
  - Every node in the **right subtree** has a key $> N.\\text{key}$.

#### Complexity Comparison:
| Operation | Average Case | Worst Case (Skewed) | AVL / Balanced BST |
|---|---|---|---|
| **Search** | $O(\\log n)$ | $O(n)$ | $O(\\log n)$ |
| **Insertion** | $O(\\log n)$ | $O(n)$ | $O(\\log n)$ |
| **Deletion** | $O(\\log n)$ | $O(n)$ | $O(\\log n)$ |
| **Space** | $O(n)$ | $O(n)$ | $O(n)$ |

#### Insertion Algorithm in C++:
\`\`\`cpp
struct Node {
    int key;
    Node *left, *right;
    Node(int val) : key(val), left(nullptr), right(nullptr) {}
};

Node* insert(Node* root, int key) {
    if (root == nullptr) return new Node(key);
    
    if (key < root->key)
        root->left = insert(root->left, key);
    else if (key > root->key)
        root->right = insert(root->right, key);
        
    return root;
}
\`\`\`

#### Why AVL Trees are Needed:
When keys are inserted in sorted order (e.g. 1, 2, 3, 4, 5), a standard BST degenerates into a singly linked list with $O(n)$ search time. An **AVL tree** guarantees $O(\\log n)$ by performing **rotations** (LL, RR, LR, RL) whenever the balance factor $|h_L - h_R| > 1$.`;
  }

  if (q.includes("dijkstra") || q.includes("shortest path")) {
    return `### Dijkstra's Shortest Path Algorithm

**Dijkstra's Algorithm** finds the shortest path from a single source vertex to all other vertices in a weighted graph with **non-negative edge weights**.

#### Time Complexity:
- **Using Min-Heap (Priority Queue) + Adjacency List:** $O((V + E) \\log V)$
- **Using Adjacency Matrix:** $O(V^2)$
- **Space Complexity:** $O(V + E)$

#### Python Implementation with Priority Queue:
\`\`\`python
import heapq

def dijkstra(graph, start_vertex):
    # graph: dict of {node: [(neighbor, weight), ...]}
    distances = {node: float('inf') for node in graph}
    distances[start_vertex] = 0
    
    # Priority Queue stores: (distance, node)
    pq = [(0, start_vertex)]
    
    while pq:
        current_distance, current_node = heapq.heappop(pq)
        
        # If distance in pq is greater than recorded, skip
        if current_distance > distances[current_node]:
            continue
            
        for neighbor, weight in graph[current_node]:
            distance = current_distance + weight
            
            # Found a shorter path to neighbor
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
                
    return distances
\`\`\`

> **Crucial Rule:** Dijkstra's algorithm **fails with negative edge weights** because greedy assumptions are invalidated. For graphs with negative weights, use the **Bellman-Ford Algorithm** ($O(V \\times E)$).`;
  }

  // 3. DATABASE MANAGEMENT SYSTEMS (DBMS)
  if (q.includes("normal") || q.includes("1nf") || q.includes("2nf") || q.includes("3nf") || q.includes("bcnf")) {
    return `### Database Normalization: 1NF, 2NF, 3NF & BCNF

**Normalization** is the process of organizing database relations to minimize **data redundancy** and avoid **insertion, update, and deletion anomalies**.

#### The Normal Forms Hierarchy:
| Normal Form | Requirement | Eliminates |
|---|---|---|
| **1NF** (First Normal Form) | All attribute values must be **atomic** (no repeating groups or multi-valued attributes). Unique primary key exists. | Multi-valued and nested attributes |
| **2NF** (Second Normal Form) | Must be in 1NF and have **no partial dependencies** (every non-prime attribute must depend on the *whole* candidate key). | Partial functional dependency |
| **3NF** (Third Normal Form) | Must be in 2NF and have **no transitive dependencies** ($X \\rightarrow Y$, $Y \\rightarrow Z$). Non-prime attributes must depend only on candidate keys. | Transitive dependency |
| **BCNF** (Boyce-Codd) | For every functional dependency $X \\rightarrow Y$, $X$ must be a **superkey**. | Anomalies where determinants are not superkeys |

#### Practical Example:
\`\`\`sql
-- Violates 3NF: department_head depends on department, not directly on student_id
-- Students(student_id, student_name, department_id, department_name, department_head)

-- Decomposed into 3NF:
CREATE TABLE Departments (
    department_id INT PRIMARY KEY,
    department_name VARCHAR(100),
    department_head VARCHAR(100)
);

CREATE TABLE Students (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(100),
    department_id INT REFERENCES Departments(department_id)
);
\`\`\``;
  }

  if (q.includes("join") || q.includes("inner join") || q.includes("outer join")) {
    return `### SQL Joins Comprehensive Reference

A **JOIN** clause in SQL combines rows from two or more tables based on a related column between them.

#### Types of Joins:
1. **INNER JOIN:** Returns records that have matching values in both tables.
2. **LEFT (OUTER) JOIN:** Returns all records from the left table, and matched records from the right table (NULL if no match).
3. **RIGHT (OUTER) JOIN:** Returns all records from the right table, and matched records from the left table.
4. **FULL (OUTER) JOIN:** Returns all records when there is a match in either left or right table.
5. **CROSS JOIN:** Returns the Cartesian product ($N \\times M$ rows).

#### Practical Query Example in EduConnect:
\`\`\`sql
-- Fetch course details with assigned faculty name and enrolled student count
SELECT 
    c.course_code,
    c.course_name,
    u.full_name AS faculty_name,
    COUNT(e.student_id) AS enrolled_students
FROM courses c
LEFT JOIN users u ON c.faculty_id = u.user_id
LEFT JOIN enrollments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_code, c.course_name, u.full_name
ORDER BY enrolled_students DESC;
\`\`\``;
  }

  // 4. OPERATING SYSTEMS
  if (q.includes("process") && q.includes("thread")) {
    return `### Process vs. Thread: Architecture & Comparison

#### Core Definitions:
- **Process:** An executing instance of a computer program with its own independent memory address space (text, data, heap, stack).
- **Thread:** The smallest unit of CPU execution scheduled by the operating system, often termed a **lightweight process (LWP)**.

#### Comparison Matrix:
| Parameter | Process | Thread |
|---|---|---|
| **Memory Space** | Separate, isolated address spaces | Shares address space with peer threads in same process |
| **Creation Overhead** | High (allocates PCB, page tables, memory) | Low (shares existing process memory) |
| **Context Switching** | Slower (requires flushing TLB and MMU state) | Fast (only registers, PC, and stack pointer swapped) |
| **Communication** | Inter-Process Communication (IPC: Pipes, Sockets, Shared Memory) | Direct memory access (global variables, heap) |
| **Failure Impact** | One process crash does not affect other processes | Crash in one thread can crash the entire host process |

#### Memory Model Diagram:
\`\`\`text
Process Memory Layout:
┌─────────────────────────────────┐
│ Code (Text Segment)             │ <- Shared among threads
├─────────────────────────────────┤
│ Data (Globals & Statics)        │ <- Shared among threads
├─────────────────────────────────┤
│ Heap (Dynamic Allocations)      │ <- Shared among threads
├─────────────────────────────────┤
│ Thread 1 Stack │ Thread 2 Stack │ <- Dedicated per thread
└─────────────────────────────────┘
\`\`\``;
  }

  if (q.includes("deadlock") || q.includes("coffman") || q.includes("banker")) {
    return `### Operating System Deadlocks & The 4 Coffman Conditions

A **Deadlock** is a state in which two or more concurrent processes are unable to proceed because each is waiting for a resource held by another.

#### The 4 Necessary Conditions (Coffman Conditions):
A deadlock can occur **if and only if all four** of the following hold simultaneously:
1. **Mutual Exclusion:** At least one resource must be non-shareable (only one process can use it at a time).
2. **Hold and Wait:** A process is holding at least one resource while waiting to acquire additional resources held by other processes.
3. **No Preemption:** Resources cannot be forcibly confiscated; they are released only voluntarily by the holding process.
4. **Circular Wait:** A closed chain of processes exists where $P_0$ waits for resource held by $P_1$, $P_1$ waits for $P_2$, ..., and $P_n$ waits for $P_0$.

#### Deadlock Handling Strategies:
- **Prevention:** Invalidate at least one of the 4 Coffman conditions (e.g. impose a total ordering on resource allocation to prevent circular wait).
- **Avoidance:** Dynamically evaluate resource state using **Dijkstra's Banker's Algorithm** to ensure the system remains in a **Safe State**.
- **Detection & Recovery:** Construct a **Resource Allocation Graph (RAG)** and detect cycles, then kill deadlocked processes or preempt resources.`;
  }

  // 5. COMPUTER NETWORKS
  if (q.includes("tcp") && q.includes("udp")) {
    return `### TCP vs. UDP Protocol Comparison

Both **TCP (Transmission Control Protocol)** and **UDP (User Datagram Protocol)** operate at Layer 4 (**Transport Layer**) of the OSI model.

| Feature | TCP | UDP |
|---|---|---|
| **Connection** | Connection-oriented (3-way handshake: SYN, SYN-ACK, ACK) | Connectionless (no handshake required) |
| **Reliability** | Guaranteed delivery (acknowledgments, retransmissions) | Best-effort delivery (packets may drop or arrive out of order) |
| **Ordering** | Guarantees ordered byte stream via Sequence Numbers | No ordering; datagrams arrive independently |
| **Flow & Congestion** | Implements sliding window flow control & congestion avoidance | None; sends at whatever rate application produces |
| **Header Size** | 20 to 60 bytes | 8 bytes (lightweight) |
| **Speed** | Higher latency due to error checking | Ultra-low latency, high throughput |
| **Typical Uses** | HTTP/HTTPS (Web), SSH, SMTP, FTP | Live Video Streaming, VoIP, DNS, Online Gaming |`;
  }

  // Default intelligent academic response
  return `### Academic Summary: ${rawQ}

Thank you for your academic inquiry regarding **"${rawQ}"**.

#### Key Theoretical Concepts:
1. **Curriculum Alignment:** This topic is part of the core Computer Science & Engineering syllabus at **KL University**.
2. **Core Fundamentals:** Ensure you master both theoretical definitions and algorithmic or mathematical formulations.
3. **Practical Implementation:** Apply these principles through code implementations in the laboratory sessions and course assignments.

#### Next Steps:
- Review the course slides and reference textbooks in the **Resources** section.
- You can ask follow-up questions such as *"Show Python code for this"*, *"Explain time complexity"*, or *"Provide a comparison table"*.`;
}
