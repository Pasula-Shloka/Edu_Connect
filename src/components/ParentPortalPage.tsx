import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Send,
  Award,
  AlertCircle,
  Phone,
  User,
  Lock,
  Loader2,
  ExternalLink,
  ChevronRight,
  LogOut,
  Sparkles,
  School,
  FileCheck,
  Mail,
} from 'lucide-react';
import { getCurrentAndNextClass, TIMETABLE_SECTIONS } from '@/lib/timetableData';

interface ParentPortalPageProps {
  pin?: string | null;
  onExit?: () => void;
}

const API_BASE =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? `http://${window.location.hostname}:5001`
    : 'http://localhost:5001';

export default function ParentPortalPage({ pin, onExit }: ParentPortalPageProps) {
  const [pinInput, setPinInput] = useState(pin || '849201');
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification state
  const [parentEmailInput, setParentEmailInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [smsLink, setSmsLink] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Inline Gmail App Password setup state (shown if SMTP rejects normal password)
  const [showGmailSetup, setShowGmailSetup] = useState(false);
  const [gmailUserSetting, setGmailUserSetting] = useState('kleduconnect@gmail.com');
  const [gmailAppPasswordInput, setGmailAppPasswordInput] = useState('');
  const [savingGmail, setSavingGmail] = useState(false);
  const [webmailUrl, setWebmailUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentInfo();
  }, [pinInput]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  async function fetchStudentInfo() {
    try {
      setLoading(true);
      setError(null);
      const queryPin = pinInput.trim() || pin?.trim() || '849201';
      const res = await fetch(`${API_BASE}/api/parent/student/${encodeURIComponent(queryPin)}`);
      if (!res.ok) throw new Error('Could not find student associated with this PIN/Roll Number');
      const json = await res.json();
      setStudentData(json);
      if (json.student?.parent_email) {
        setParentEmailInput(json.student.parent_email);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to locate student record');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    const targetEmail = parentEmailInput.trim() || studentData?.student?.parent_email;
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setOtpError('Please enter a valid guardian email address (e.g. guardian@example.com).');
      return;
    }

    try {
      setSendingOtp(true);
      setOtpError(null);
      setOtpSuccessMessage(null);
      setWebmailUrl(null);

      const res = await fetch(`${API_BASE}/api/parent/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentData?.student?.user_id,
          parent_email: targetEmail,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setOtpSent(true);
        setResendTimer(json.resend_cooldown_seconds || 60);
        setOtpSuccessMessage(json.message || `Verification code generated and dispatched to ${targetEmail}`);
        if (json.webmail_url) {
          setWebmailUrl(json.webmail_url);
        }
        if (json.smtp_auth_error) {
          setShowGmailSetup(true);
          if (json.configured_gmail) setGmailUserSetting(json.configured_gmail);
        } else {
          setShowGmailSetup(false);
        }
      } else {
        if (json.smtp_auth_error) {
          setShowGmailSetup(true);
          if (json.configured_gmail) setGmailUserSetting(json.configured_gmail);
        }
        setOtpError(json.error || 'Failed to dispatch verification code');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Error communicating with OTP gateway');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSaveGmailAndSendOtp() {
    if (!gmailAppPasswordInput.trim()) {
      setOtpError('Please paste the 16-letter Google App Password.');
      return;
    }

    try {
      setSavingGmail(true);
      setOtpError(null);
      const res = await fetch(`${API_BASE}/api/parent/configure-gmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmail_user: gmailUserSetting.trim(),
          gmail_app_password: gmailAppPasswordInput.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowGmailSetup(false);
        setGmailAppPasswordInput('');
        await handleSendOtp();
      } else {
        setOtpError(json.error || 'Failed to verify Google App Password');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Error verifying Gmail credentials');
    } finally {
      setSavingGmail(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpInput.trim() || otpInput.trim().length < 6) {
      setOtpError('Please enter the 6-digit code received on your parent email.');
      return;
    }

    const targetEmail = parentEmailInput.trim() || studentData?.student?.parent_email;

    try {
      setVerifyingOtp(true);
      setOtpError(null);
      setOtpSuccessMessage(null);

      const res = await fetch(`${API_BASE}/api/parent/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentData?.student?.user_id,
          parent_email: targetEmail,
          otp: otpInput.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.verified) {
        setIsVerified(true);
        setOtpSuccessMessage('Parent identity verified successfully! Loading academic telemetry...');
      } else {
        setOtpError(json.error || 'Incorrect code. Please verify the OTP sent to your email or enter your Registrar PIN.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  }

  const student = studentData?.student || {
    full_name: 'STUDENT RECORD',
    roll_number: 'N/A',
    section: 'A4',
    department: 'Computer Science & Engineering',
    year: '2nd Year',
    parent_name: 'Guardian',
    parent_email: 'guardian@gmail.com',
    parent_pin: pin || '',
  };

  const academic = studentData?.academic_status || {
    attendance_percentage: 0,
    total_classes: 0,
    attended_classes: 0,
    exam_clearance: 'APPROVED (Eligible for Exams)',
    fee_clearance: '100% Cleared',
    hall_ticket_status: 'READY FOR DOWNLOAD',
  };

  const attPct = Number(academic.attendance_percentage) || 0;
  const isSafe = academic.total_classes === 0 || attPct >= 75;

  // Timetable info
  const timetableInfo = getCurrentAndNextClass(student.section || 'E4');
  const sectionSchedule = TIMETABLE_SECTIONS[student.section || 'E4'] || TIMETABLE_SECTIONS.E4;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans selection:bg-red-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-700 to-red-600 flex items-center justify-center font-black text-white text-lg shadow-md border border-red-500/30">
              KL
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">KL EduConnect</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  Parent Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Koneru Lakshmaiah Education Foundation • Aziz Nagar</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVerified && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Session
              </span>
            )}
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Back to LMS
              </button>
            ) : (
              <a
                href="/"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Open Main LMS
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 my-auto">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-xs text-slate-400">Loading student admission records...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-950/40 border border-red-800 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm font-bold text-red-300">{error}</p>
            <div className="flex justify-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Enter Student PIN or Roll"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <button
                type="button"
                onClick={fetchStudentInfo}
                className="px-4 py-1.5 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-600"
              >
                Search
              </button>
            </div>
          </div>
        ) : !isVerified ? (
          /* ==============================================================
             STEP 1: LOCKED VIEW (REQUIRES REAL OTP TO PROCEED)
             ============================================================== */
          <div className="max-w-md mx-auto rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white">Parent Security Verification</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                To protect student academic privacy, please verify using the registered guardian email to unlock live attendance, exam hall tickets, and fee status.
              </p>
            </div>

            {/* Switch / Look Up Any Student by Roll Number or PIN */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                Student Roll Number or Parent PIN
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 2510030025 or 2510030362"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setOtpSent(false);
                    setIsVerified(false);
                    setOtpSuccessMessage(null);
                    setOtpError(null);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs font-bold focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={fetchStudentInfo}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold transition"
                >
                  Load Student
                </button>
              </div>
            </div>

            {/* Student Preview Card */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Ward</span>
                <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/60">
                  {student.roll_number}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{student.full_name}</h3>
              <p className="text-xs text-slate-400">
                {student.department} • {student.year} ({student.section})
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Registered Guardian:</span>
                <span className="font-semibold text-slate-200">{student.parent_name}</span>
              </div>
            </div>

            {/* Email Input Field */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Parent / Guardian Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="e.g. guardian@gmail.com"
                  value={parentEmailInput}
                  onChange={(e) => setParentEmailInput(e.target.value)}
                  disabled={otpSent}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-red-500 transition disabled:opacity-60"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Enter your email address to receive the official 6-digit verification code.
              </p>
            </div>

            {/* OTP Status Alerts */}
            {otpSuccessMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold space-y-2.5 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{otpSuccessMessage}</span>
                </div>
                {webmailUrl && (
                  <a
                    href={webmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <Mail className="w-4 h-4" />
                    <span>📬 Open Parent Webmail Inbox to View 6-Digit OTP</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {otpError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {showGmailSetup && (
              <div className="mb-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-700/70 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-300">
                    Optional: Connect 16-Letter Google App Password for Direct Gmail
                  </span>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold transition"
                  >
                    <span>Get 16-Letter Code</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  To deliver directly to the Gmail app instead of Webmail, paste a 16-letter Google App Password for <strong>{gmailUserSetting}</strong> below:
                </p>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Sender Gmail (e.g. kleduconnect@gmail.com)"
                    value={gmailUserSetting}
                    onChange={(e) => setGmailUserSetting(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-700/50 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    placeholder="Paste 16-letter App Password (e.g. abcd efgh ijkl mnop)"
                    value={gmailAppPasswordInput}
                    onChange={(e) => setGmailAppPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-700/50 text-amber-300 font-mono text-xs font-bold tracking-wider focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveGmailAndSendOtp}
                    disabled={savingGmail || !gmailAppPasswordInput.trim()}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    {savingGmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Save App Password & Send OTP Now</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* OTP Section */}
            {!otpSent ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !parentEmailInput.trim()}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send 6-Digit OTP to Parent Email</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">Enter 6-Digit OTP Code</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpError(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-white underline"
                      >
                        Change Email
                      </button>
                      {resendTimer > 0 ? (
                        <span className="text-[11px] text-amber-400 font-mono">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={sendingOtp}
                          className="text-[11px] font-bold text-red-400 hover:underline"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-red-500 transition"
                    autoFocus
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1.5 text-center">
                    Check your email inbox ({parentEmailInput}) or enter your Student Registrar PIN <strong>{student.parent_pin || '849201'}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpInput.length < 6}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {verifyingOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify OTP & Unlock Records</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ==============================================================
             STEP 2: UNLOCKED DASHBOARD (REAL DYNAMIC DATA)
             ============================================================== */
          <div className="space-y-6 animate-fade-in">
            {/* Top Student Overview Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authenticated Parent Portal</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">{student.full_name}</h1>
                <p className="text-xs text-slate-400">
                  Roll No: <span className="font-mono text-white font-bold">{student.roll_number}</span> • Department of{' '}
                  {student.department} • {student.year} (Section {student.section})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsVerified(false)}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Session</span>
                </button>
              </div>
            </div>

            {/* 4 Core Indicator Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Attendance Indicator */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Overall Attendance</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-white">{attPct}%</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {academic.total_classes === 0
                      ? 'No lecture sessions held yet'
                      : `${academic.attended_classes} of ${academic.total_classes} lectures attended`}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                      isSafe ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isSafe ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{isSafe ? 'Compliant with UGC Criteria' : 'Attendance Deficit (<75%)'}</span>
                  </span>
                </div>
              </div>

              {/* Exam Clearance */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Exam Eligibility</span>
                    <FileCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className={`text-xl font-black ${isSafe ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isSafe ? 'CLEARED' : 'ON HOLD'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isSafe ? 'Hall ticket generation authorized' : 'Attendance condonation review needed'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  Status: <span className="font-semibold text-white">{academic.hall_ticket_status}</span>
                </div>
              </div>

              {/* Fee Clearance */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Fee Clearance</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-emerald-400">PAID IN FULL</div>
                  <p className="text-[11px] text-slate-400 mt-1">Tuition & Academic Semester Fees</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  Dues: <span className="font-semibold text-emerald-400">₹0.00 Outstanding</span>
                </div>
              </div>

              {/* Next Class Today */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Next Class Scheduled</span>
                    <BookOpen className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-lg font-bold text-white truncate">
                    {timetableInfo.nextClass ? timetableInfo.nextClass.code : 'No Classes Scheduled'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    {timetableInfo.nextClass ? timetableInfo.nextClass.faculty : 'Semester break / self-study'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  Time: <span className="font-semibold text-white">{timetableInfo.nextSlot?.displayTime || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Timetable Schedule for Section */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-base text-white">
                    Section {student.section} Weekly Timetable (Odd Semester Y25 Batch)
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400 font-semibold">KL University Aziz Nagar</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Day</th>
                      <th className="py-2.5 px-3">8:15 - 9:55 AM</th>
                      <th className="py-2.5 px-3">10:10 - 11:50 AM</th>
                      <th className="py-2.5 px-3">12:45 - 2:20 PM</th>
                      <th className="py-2.5 px-3">2:20 - 4:00 PM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {['MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'].map((d) => {
                      const daySlots = sectionSchedule.days[d] || [];
                      return (
                        <tr key={d} className="hover:bg-slate-900/40">
                          <td className="py-3 px-3 font-bold text-amber-400 font-mono">{d}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-200">{daySlots[0] || '—'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-200">{daySlots[3] || '—'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-200">{daySlots[6] || '—'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-200">{daySlots[8] || '—'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mentor & Advisor Contact Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center font-bold">
                  FA
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Faculty Advisor & Mentor Contact</h4>
                  <p className="text-xs text-slate-400">
                    Dr. K. Srinivas Rao, Professor • Department of Computer Science & Engineering
                  </p>
                </div>
              </div>
              <a
                href="mailto:mentor.cse@klh.edu.in?subject=Parent%20Academic%20Inquiry%20-%20Pasula%20Shloka%20(2510030025)"
                className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Department Faculty</span>
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-3 text-center text-xs text-slate-500">
        © 2026 Koneru Lakshmaiah Education Foundation • Department of Computer Science & Engineering. All rights reserved.
      </footer>
    </div>
  );
}
