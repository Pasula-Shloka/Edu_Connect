# KL EduConnect — Digital Academic & Learning Management Portal

EduConnect is a comprehensive digital academic and learning management platform designed for students, faculty, and administrators. Built with React, TypeScript, Tailwind CSS, and Express.

🌐 **Live Demo Website:** [https://pasula-shloka.github.io/Edu_Connect/](https://pasula-shloka.github.io/Edu_Connect/)

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

## 🛡️ Security & Microservices Architecture (FastAPI, JWT, Flask)

EduConnect incorporates a polyglot microservices architecture designed for enterprise scalability and academic evaluation:

### 1. JWT (JSON Web Token) Security
- All authenticated sessions issue cryptographic **HMAC-SHA256 (`HS256`)** tokens.
- Fully compatible with **[jwt.io](https://jwt.io)** showing decoded claims: `userId`, `email`, `role`, `issuer`, and `exp`.
- Verified via backend security middleware with standard `Authorization: Bearer <token>`.
- Use the **"JWT & APIs"** button in the top navigation bar to copy and inspect your live session token.

### 2. FastAPI Python Microservice (Port 8000)
- Powers the **Academic AI Problem Solver** and **Exam Code Execution Sandbox**.
- Automatic Interactive **Swagger UI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Start command:**
  ```bash
  npm run dev:fastapi
  # or: python3 -m uvicorn python_services.fastapi_app.main:app --port 8000 --reload
  ```

### 3. Flask Python Microservice (Port 5002)
- Powers **Student Academic Transcripts, GPA Calculation, and UGC 75% Attendance Audits**.
- Protected with JWT token validation.
- **Start command:**
  ```bash
  npm run dev:flask
  # or: python3 python_services/flask_app/app.py
  ```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Security:** JSON Web Tokens (JWT), Bcrypt password hashing
- **Python Microservices:** FastAPI (Port 8000), Flask (Port 5002), PyJWT, Pydantic, Uvicorn
- **Core Backend:** Node.js, Express (Port 5001), PostgreSQL (`digital_learning_db`), pgAdmin 4
- **Video Conferencing:** Jitsi Meet React SDK
- **Offline / Multi-device Support:** Standalone persistent database with API interceptor fallback
