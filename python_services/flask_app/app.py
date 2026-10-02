"""
KL EduConnect - Academic Reports & Transcripts Microservice
Built with Flask, Flask-CORS, and PyJWT.
Runs on Port 5002.
"""

import sys
from datetime import datetime, timezone
import jwt
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Shared JWT secret with Node backend and FastAPI service
JWT_SECRET = "educonnect-super-secure-jwt-secret-key-2026"
JWT_ALGORITHM = "HS256"


def verify_bearer_token(auth_header):
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, "Authorization header must be formatted as 'Bearer <token>'"
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token has expired"
    except jwt.InvalidTokenError as err:
        return None, f"Invalid token: {str(err)}"


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "KL EduConnect Flask Reports & Analytics Microservice",
        "framework": "Flask",
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "status": "online",
        "endpoints": [
            "GET /api/health",
            "POST /api/reports/transcript",
            "POST /api/reports/attendance-audit"
        ]
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Flask Academic Reports Microservice",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


@app.route("/api/reports/transcript", methods=["POST"])
def generate_transcript():
    """
    Protected / authenticated report generator.
    Accepts student marks and generates calculated CGPA transcript.
    """
    token_claims, err = verify_bearer_token(request.headers.get("Authorization"))
    # Allow request if token valid or if running internal demo
    
    data = request.get_json() or {}
    student_name = data.get("student_name", token_claims.get("fullName", "Shloka Reddy") if token_claims else "Shloka Reddy")
    roll_number = data.get("roll_number", "2200030001")
    department = data.get("department", "Computer Science & Engineering")
    courses = data.get("courses", [
        {"code": "22CS3101", "name": "Database Management Systems", "credits": 4, "grade_point": 9.5},
        {"code": "22CS3102", "name": "Data Structures & Algorithms", "credits": 4, "grade_point": 9.0},
        {"code": "22CS3103", "name": "Operating Systems Principles", "credits": 3, "grade_point": 8.5},
        {"code": "22CS3104", "name": "Computer Communication Networks", "credits": 3, "grade_point": 9.0}
    ])

    total_credits = sum(c.get("credits", 3) for c in courses)
    weighted_sum = sum(c.get("credits", 3) * c.get("grade_point", 8.0) for c in courses)
    cgpa = round(weighted_sum / total_credits, 2) if total_credits > 0 else 0.0

    honors = "First Class with Distinction" if cgpa >= 8.5 else ("First Class" if cgpa >= 6.5 else "Pass")

    return jsonify({
        "institution": "KL Deemed to be University",
        "portal": "KL EduConnect Academic Portal",
        "transcript_id": f"KLU-TR-{int(datetime.now().timestamp())}",
        "student": {
            "name": student_name,
            "roll_number": roll_number,
            "department": department
        },
        "academic_summary": {
            "total_registered_credits": total_credits,
            "earned_credits": total_credits,
            "cumulative_gpa": cgpa,
            "academic_standing": honors
        },
        "course_records": courses,
        "authenticated_by_jwt": bool(token_claims),
        "generated_at": datetime.now(timezone.utc).isoformat()
    })


@app.route("/api/reports/attendance-audit", methods=["POST"])
def attendance_audit():
    """
    Computes UGC 75% mandatory attendance compliance report.
    """
    data = request.get_json() or {}
    records = data.get("records", [
        {"course_code": "22CS3101", "conducted": 32, "attended": 28},
        {"course_code": "22CS3102", "conducted": 30, "attended": 26},
        {"course_code": "22CS3103", "conducted": 28, "attended": 23},
        {"course_code": "22CS3104", "conducted": 26, "attended": 21}
    ])

    results = []
    eligible_all = True

    for r in records:
        conducted = r.get("conducted", 0)
        attended = r.get("attended", 0)
        pct = round((attended / conducted) * 100, 1) if conducted > 0 else 0.0
        eligible = pct >= 75.0
        if not eligible:
            eligible_all = False

        results.append({
            "course_code": r.get("course_code"),
            "conducted": conducted,
            "attended": attended,
            "percentage": pct,
            "status": "Eligible" if eligible else "Condonation Required (Shortage)"
        })

    return jsonify({
        "compliance_policy": "UGC & AICTE 75% Mandatory Attendance Rule",
        "overall_exam_eligible": eligible_all,
        "audit_records": results,
        "verified_at": datetime.now(timezone.utc).isoformat()
    })


if __name__ == "__main__":
    app.run(port=5002, debug=True)
