/**
 * OpenAPI 3.0 Specification for KL EduConnect Academic Platform
 */

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "KL EduConnect Institutional API",
    version: "2.4.0",
    description: "Production REST API for KL University Digital Learning, Real-time Submissions, Proctored Examinations, and Academic RBAC Management.",
    contact: {
      name: "KL University Academic Tech Operations",
      email: "admin@klh.edu.in"
    }
  },
  servers: [
    {
      url: "http://localhost:5001",
      description: "Node.js Express & PostgreSQL Core LMS API (Port 5001)"
    },
    {
      url: "http://localhost:8000",
      description: "FastAPI Academic AI & Code Sandbox Microservice (Port 8000)"
    },
    {
      url: "http://localhost:5002",
      description: "Flask Academic Reports & Transcripts Microservice (Port 5002)"
    }
  ],
  tags: [
    { name: "Authentication", description: "Institutional SSO & RBAC token management" },
    { name: "Courses", description: "Course catalog, syllabus and faculty assignments" },
    { name: "Assignments", description: "Coursework creation, file submissions & evaluation" },
    { name: "Attendance", description: "Individual lecture session attendance tracking" },
    { name: "Examinations", description: "Proctored exams, questions & automated grading" },
    { name: "Collaboration", description: "Kanban task boards, fair-share analytics & workspaces" },
    { name: "Administration", description: "Student/Faculty roster and institutional analytics" }
  ],
  paths: {
    "/api/auth/signin": {
      post: {
        tags: ["Authentication"],
        summary: "Institutional User Sign In",
        description: "Authenticates Students (rollnumber@klh.edu.in), Faculty (fac[EmpID]@klh.edu.in), or the single Administrator (admin@klh.edu.in).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "2200030001@klh.edu.in" },
                  password: { type: "string", example: "student123" }
                },
                required: ["email", "password"]
              }
            }
          }
        },
        responses: {
          200: {
            description: "Authentication successful, returns JWT bearer token and user object",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Login successful" },
                    token: { type: "string" },
                    user: {
                      type: "object",
                      properties: {
                        user_id: { type: "integer", example: 2 },
                        email: { type: "string", example: "2200030001@klh.edu.in" },
                        full_name: { type: "string", example: "Shloka Reddy" },
                        role: { type: "string", example: "student" }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Invalid email or password" }
        }
      }
    },
    "/api/auth/signup": {
      post: {
        tags: ["Authentication"],
        summary: "Register Student or Faculty Account",
        description: "Registers new student or faculty. Disallows admin self-registration (Admin is strictly single pre-existing account).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "2200030999@klh.edu.in" },
                  password: { type: "string", example: "student123" },
                  full_name: { type: "string", example: "Ananya Sharma" },
                  role: { type: "string", enum: ["student", "faculty"], example: "student" }
                },
                required: ["email", "password", "full_name", "role"]
              }
            }
          }
        },
        responses: {
          201: { description: "User account created successfully in PostgreSQL" },
          403: { description: "Administrator registration is restricted" }
        }
      }
    },
    "/api/auth/verify": {
      get: {
        tags: ["Authentication"],
        summary: "Verify JWT Bearer Token",
        description: "Validates JWT token and returns authenticated user claims. You can paste token in the parameter below OR use the Authorize button at top right.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "token",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Paste your JWT token here to verify directly",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          }
        ],
        responses: {
          200: { description: "Token is cryptographically valid and active" },
          401: { description: "Missing, invalid, or expired JWT token" }
        }
      }
    },
    "/api/auth/token-info": {
      get: {
        tags: ["Authentication"],
        summary: "Inspect JWT Claims & Cryptographic Metadata",
        description: "Returns HS256 algorithm details, issuer, and decoded token claims. You can paste token in parameter below OR use Authorize button.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "token",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Paste your JWT token here to inspect metadata",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          }
        ],
        responses: {
          200: { description: "Token metadata and payload claims returned" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/user-id": {
      get: {
        tags: ["Authentication"],
        summary: "Get User Profile by Email",
        parameters: [
          { name: "email", in: "query", required: true, schema: { type: "string" }, example: "2200030001@klh.edu.in" }
        ],
        responses: {
          200: { description: "User profile record returned" },
          404: { description: "User not found" }
        }
      }
    },
    "/api/courses": {
      get: {
        tags: ["Courses"],
        summary: "List Academic Courses",
        parameters: [
          { name: "facultyId", in: "query", required: false, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Array of courses" }
        }
      }
    },
    "/api/assignments": {
      get: {
        tags: ["Assignments"],
        summary: "Get Coursework Assignments",
        parameters: [
          { name: "facultyId", in: "query", required: false, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "List of assignments" }
        }
      },
      post: {
        tags: ["Assignments"],
        summary: "Create New Assignment (Faculty)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  course_id: { type: "integer", example: 1 },
                  title: { type: "string", example: "Normalization & BCNF Implementation" },
                  description: { type: "string", example: "Decompose tables into 3NF and BCNF" },
                  due_date: { type: "string", format: "date-time" },
                  max_marks: { type: "integer", example: 25 },
                  unit_name: { type: "string", example: "Unit 2: Relational Schema Design" }
                },
                required: ["course_id", "title"]
              }
            }
          }
        },
        responses: {
          201: { description: "Assignment created successfully" }
        }
      }
    },
    "/api/submissions": {
      post: {
        tags: ["Assignments"],
        summary: "Submit or Re-Submit Assignment (Student)",
        description: "Uploads an assignment file or link. If previously submitted, updates the existing record with new submission URL.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  assignment_id: { type: "integer", example: 1 },
                  student_id: { type: "integer", example: 2 },
                  submission_url: { type: "string", example: "https://cdn.educonnect.in/submissions/relational_schema.pdf" }
                },
                required: ["assignment_id", "student_id", "submission_url"]
              }
            }
          }
        },
        responses: {
          200: { description: "Assignment re-submitted & updated successfully" },
          201: { description: "Assignment submitted successfully" }
        }
      }
    },
    "/api/submissions/{studentId}": {
      get: {
        tags: ["Assignments"],
        summary: "Get Submissions for a Student",
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "integer" }, example: 2 }
        ],
        responses: {
          200: { description: "List of student submissions with marks and faculty feedback" }
        }
      }
    },
    "/api/faculty/submissions": {
      get: {
        tags: ["Assignments"],
        summary: "Get Submissions for Faculty Review & Grading",
        description: "Returns all submissions belonging to the courses taught by this faculty member (or departmental submissions).",
        parameters: [
          { name: "facultyId", in: "query", required: false, schema: { type: "integer" }, example: 4 }
        ],
        responses: {
          200: { description: "Array of student submissions ready for evaluation" }
        }
      }
    },
    "/api/faculty/submissions/{submissionId}/evaluate": {
      put: {
        tags: ["Assignments"],
        summary: "Grade Submission with Marks and Feedback (Faculty)",
        parameters: [
          { name: "submissionId", in: "path", required: true, schema: { type: "integer" }, example: 2 }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  marks: { type: "number", example: 19 },
                  feedback: { type: "string", example: "Excellent schema diagrams and normal form decomposition." }
                },
                required: ["marks"]
              }
            }
          }
        },
        responses: {
          200: { description: "Submission evaluated and marked as graded in PostgreSQL" }
        }
      }
    },
    "/api/attendance": {
      get: {
        tags: ["Attendance"],
        summary: "Get Lecture Attendance",
        parameters: [
          { name: "courseId", in: "query", required: false, schema: { type: "integer" } },
          { name: "date", in: "query", required: false, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Attendance records for lecture" }
        }
      },
      post: {
        tags: ["Attendance"],
        summary: "Mark Lecture Attendance Session (Faculty)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  course_id: { type: "integer", example: 1 },
                  date: { type: "string", example: "2026-10-06" },
                  attendance_records: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        student_id: { type: "integer", example: 2 },
                        status: { type: "string", enum: ["present", "absent", "late"], example: "present" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Attendance session saved" }
        }
      }
    },
    "/api/attendance/student/{studentId}": {
      get: {
        tags: ["Attendance"],
        summary: "Get Individual Student Attendance Percentage & Logs",
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "integer" }, example: 2 }
        ],
        responses: {
          200: { description: "Computed attendance percentage and historical session records" }
        }
      }
    },
    "/api/exams": {
      get: {
        tags: ["Examinations"],
        summary: "List Proctored Examinations",
        responses: {
          200: { description: "List of examinations" }
        }
      }
    },
    "/api/admin/students": {
      get: {
        tags: ["Administration"],
        summary: "List All Enrolled Students (Admin)",
        responses: {
          200: { description: "Student directory with roll numbers, sections and attendance" }
        }
      },
      post: {
        tags: ["Administration"],
        summary: "Add New Student (Admin)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  full_name: { type: "string", example: "Kavya Reddy" },
                  email: { type: "string", example: "2200030077@klh.edu.in" },
                  password: { type: "string", example: "student123" },
                  roll_number: { type: "string", example: "2200030077" },
                  department: { type: "string", example: "Computer Science & Engineering" },
                  year: { type: "string", example: "3rd Year" },
                  section: { type: "string", example: "Section A" }
                },
                required: ["full_name", "email", "password"]
              }
            }
          }
        },
        responses: {
          201: { description: "Student created successfully in PostgreSQL" }
        }
      }
    },
    "/api/admin/stats": {
      get: {
        tags: ["Administration"],
        summary: "Get Institutional Platform Analytics",
        responses: {
          200: { description: "High-level metrics: total users, courses, assignments, attendance rate" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter the JWT Bearer token obtained from POST /api/auth/signin"
      }
    }
  }
};

module.exports = swaggerDocument;
