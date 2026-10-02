# KL EduConnect — Digital Academic & Learning Management Portal

EduConnect is a comprehensive digital academic and learning management platform designed for students, faculty, and administrators. Built with React, TypeScript, Tailwind CSS, and Express.

---

## 🚀 Quick Start (For Friends & Reviewers)

EduConnect includes an intelligent standalone client-side engine with persistent storage. **It runs instantly on any laptop or operating system without requiring PostgreSQL or database setup!**

### 1. Clone the repository
```bash
git clone https://github.com/Pasula-Shloka/Edu_Connect.git
cd Edu_Connect
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open your browser at **`http://localhost:5173`** (or the port shown in your terminal).

---

## 🔑 Demo Accounts (Quick Sign-In)

You can sign in with any of these pre-configured institutional accounts (or register a new one):

| Role | Email Address | Password | Features / Dashboard |
|---|---|---|---|
| **Student** | `shloka@klh.edu.in` | `password123` | Course enrollment, coding & MCQ exams, 75% attendance tracker, AI academic assistant, live classes |
| **Faculty** | `faculty@faculty.edu.in` | `password123` | Course creation, student roster & grading, create coding tests & MCQs, schedule live lectures |
| **Administrator** | `admin@admin.edu.in` | `password123` | Institutional analytics, student/faculty directory management, section allocation, system logs |

> **Note:** The sign-in screen automatically detects the user's role from their email and opens the corresponding dashboard directly.

---

## ✨ Key Features

- **Automatic Role Detection on Login:** No manual role selector needed on sign in. The system identifies Student, Faculty, or Admin from registered credentials.
- **Coding & MCQ Exam Engine:**
  - Create and take online exams with multiple-choice questions or coding challenges.
  - Multi-language coding playground (Python, Java, C++, JavaScript, SQL) with sample test case runners.
  - Faculty evaluation interface with code syntax highlighting and automated score tabulation.
- **Academic AI Assistant:**
  - Instant curriculum-aligned explanations with time/space complexity analysis ($O(n)$, $O(\log n)$).
  - Runnable code solutions for Data Structures, Algorithms, DBMS, Operating Systems, and Computer Networks.
- **Live Classes (Jitsi Meet):**
  - Integrated interactive video classrooms with screen sharing, chat, and an "Open in Tab" fallback link.
- **Role-Separated Analytics:**
  - Distinct analytics dashboards for Admin (campus-wide stats & CGPA distribution), Faculty (course performance & class attendance), and Student (personal GPA & 75% attendance threshold).
- **Dark & Light Mode:**
  - Fully cohesive dark theme styling across all course cards, modals, exams, and dashboards.
- **Persistent Notifications:**
  - Real-time updates with persistent read and delete synchronization.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Video Conferencing:** Jitsi Meet React SDK
- **Backend:** Node.js, Express, PostgreSQL, bcryptjs, CORS
- **Offline / Multi-device Support:** Standalone persistent localStorage database with API interceptor fallback
