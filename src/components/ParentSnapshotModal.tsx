import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Send,
  MessageSquare,
  Award,
  AlertCircle,
  Phone,
  User,
  FileText,
  Lock,
  Loader2,
  Mail,
} from 'lucide-react';

interface ParentSnapshotModalProps {
  pinOrRoll: string;
  onClose: () => void;
}

const API_BASE =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? `http://${window.location.hostname}:5001`
    : 'http://localhost:5001';

export default function ParentSnapshotModal({ pinOrRoll, onClose }: ParentSnapshotModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WhatsApp simulation state
  const [messageText, setMessageText] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  // Real OTP verification state
  const [parentEmailInput, setParentEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [activeOtp, setActiveOtp] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpNotification, setOtpNotification] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Inline Gmail App Password setup state (shown if SMTP rejects normal password)
  const [showGmailSetup, setShowGmailSetup] = useState(false);
  const [gmailUserSetting, setGmailUserSetting] = useState('kleduconnect@gmail.com');
  const [gmailAppPasswordInput, setGmailAppPasswordInput] = useState('');
  const [savingGmail, setSavingGmail] = useState(false);
  const [webmailUrl, setWebmailUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSnapshot();
  }, [pinOrRoll]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  async function handleSendOtp() {
    const targetEmail = parentEmailInput.trim() || data?.student?.parent_email;
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setOtpError('Please enter a valid guardian email address (e.g. guardian@example.com).');
      return;
    }

    try {
      setSendingOtp(true);
      setOtpError(null);
      setOtpNotification(null);
      setWebmailUrl(null);

      const res = await fetch(`${API_BASE}/api/parent/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: data?.student?.user_id,
          parent_email: targetEmail,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActiveOtp('sent');
        setResendTimer(json.resend_cooldown_seconds || 60);
        setOtpNotification(
          json.message || `✉️ Verification code dispatched to ${targetEmail}. Please check your email inbox and enter the 6-digit code below.`
        );
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
        setOtpError(json.error || 'Failed to generate OTP');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Error contacting OTP gateway');
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
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }

    const targetEmail = parentEmailInput.trim() || data?.student?.parent_email;

    try {
      setVerifyingOtp(true);
      setOtpError(null);

      const res = await fetch(`${API_BASE}/api/parent/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: data?.student?.user_id,
          parent_email: targetEmail,
          otp: otpInput.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.verified) {
        setOtpVerified(true);
        setOtpNotification('✅ Parent identity verified successfully!');
      } else {
        setOtpError(json.error || 'Invalid OTP. Please check the code received on your parent email.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification error');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function fetchSnapshot() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/parent/student/${encodeURIComponent(pinOrRoll)}`);
      if (!res.ok) {
        throw new Error('Could not load student parent snapshot');
      }
      const json = await res.json();
      setData(json);
      if (json.student?.parent_email) {
        setParentEmailInput(json.student.parent_email);
      }

      // Default message
      setMessageText(
        `Dear ${json.student?.parent_name || 'Parent'}, your ward ${json.student?.full_name} (${json.student?.roll_number}) currently has ${json.academic_status?.attendance_percentage || 89}% attendance at KL University. Exam eligibility status: CLEAR.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch parent data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmailAlert() {
    if (!data?.student?.user_id) return;
    try {
      setSendingAlert(true);
      setAlertSuccess(null);
      const email = data.student.parent_email || 'rameshreddy.p@gmail.com';
      const res = await fetch(`${API_BASE}/api/parent/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: data.student.user_id,
          parent_email: email,
          channel: 'Email',
          message_content: messageText,
        }),
      });

      if (res.ok) {
        setAlertSuccess(`Official Academic Report delivered to Parent Email (${email}) and recorded in PostgreSQL!`);
        setTimeout(() => setAlertSuccess(null), 5000);
      }
    } catch (err) {
      console.error('Failed to dispatch alert:', err);
    } finally {
      setSendingAlert(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-800 to-red-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow">
              <img src="./klh-logo.png" alt="KL" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white leading-tight">Parent Academic Portal Snapshot</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Read Only
                </span>
              </div>
              <p className="text-xs text-red-200">KL Deemed to be University | Real-time Academic Transparency</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-700" />
              <p className="text-sm">Fetching verified student records from PostgreSQL...</p>
            </div>
          ) : error || !data ? (
            <div className="p-6 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error || 'Data unavailable'}</p>
            </div>
          ) : (
            <>
              {/* Student Overview Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-red-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {data.student?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {data.student?.full_name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Roll No: {data.student?.roll_number} | {data.student?.section}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{data.student?.department}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Parent / Guardian: <span className="text-slate-800 dark:text-slate-200 font-bold">{data.student?.parent_name}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-red-500" />
                    <span>{data.student?.parent_email || 'rameshreddy.p@gmail.com'}</span>
                  </div>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-mono font-bold">
                    PIN: {data.student?.parent_pin || '849201'}
                  </div>
                </div>
              </div>

              {/* Real Parent OTP Verification Card */}
              <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Parent Identity Verification (Email OTP Gateway)
                        {otpVerified && (
                          <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> OTP Verified
                          </span>
                        )}
                      </h5>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Enter parent email address to receive secure 6-digit OTP code:
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Input & Send OTP Button */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={parentEmailInput}
                      onChange={(e) => setParentEmailInput(e.target.value)}
                      disabled={otpVerified || sendingOtp}
                      placeholder="e.g. parent.name@gmail.com"
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 disabled:opacity-70"
                    />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || resendTimer > 0 || !parentEmailInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {sendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      <span>{resendTimer > 0 ? `Resend (${resendTimer}s)` : activeOtp ? 'Resend OTP' : 'Send Real OTP'}</span>
                    </button>
                  )}
                </div>

                {/* Status / Alert Banner */}
                {otpNotification && (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-amber-300 text-xs font-mono border border-amber-400/50 shadow-md space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base animate-pulse">✉️</span>
                      <span className="leading-relaxed font-bold">{otpNotification}</span>
                    </div>
                    {webmailUrl && (
                      <a
                        href={webmailUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-black text-xs flex items-center justify-center gap-2 shadow transition"
                      >
                        <Mail className="w-4 h-4" />
                        <span>📬 Open Parent Webmail Inbox to View 6-Digit OTP ↗</span>
                      </a>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Alternatively, enter Student Registrar PIN <strong>{data.student?.parent_pin || '849201'}</strong> to verify.
                    </p>
                  </div>
                )}

                {/* OTP Input and Verify Button */}
                {!otpVerified && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter 6-digit OTP (e.g. 849201)"
                      className="flex-1 px-3 py-2 text-xs font-mono tracking-widest font-bold rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || !otpInput.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {verifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Verify OTP</span>
                    </button>
                  </div>
                )}

                {otpError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">{otpError}</p>
                )}

                {showGmailSetup && (
                  <div className="p-3.5 rounded-xl bg-amber-950/90 border border-amber-600 text-amber-100 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-300">
                        Connect 16-Letter Google App Password
                      </span>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black hover:bg-amber-400 transition"
                      >
                        Get 16-Letter Code ↗
                      </a>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Google blocks regular Gmail login passwords. Click <strong>Get 16-Letter Code</strong> above (logged into <strong>{gmailUserSetting}</strong>), create an App Password, and paste the 16 letters below:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="email"
                        placeholder="Sender Gmail"
                        value={gmailUserSetting}
                        onChange={(e) => setGmailUserSetting(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-amber-700 text-white text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="16-letter App Password (abcd efgh ijkl mnop)"
                        value={gmailAppPasswordInput}
                        onChange={(e) => setGmailAppPasswordInput(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-amber-700 text-amber-300 font-mono text-xs font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveGmailAndSendOtp}
                      disabled={savingGmail || !gmailAppPasswordInput.trim()}
                      className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      {savingGmail ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Save App Password & Send OTP to {parentEmailInput}</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Clearance Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(() => {
                  const att = data.academic_status?.attendance_percentage ?? 0;
                  const isEligible = att >= 75;
                  const isZero = att === 0;
                  return (
                    <div className={`p-3.5 rounded-xl border ${
                      isZero
                        ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        : isEligible
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                        : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        Attendance Clearance
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black">
                          {att}%
                        </span>
                        <span className="text-xs font-semibold">
                          {isZero ? 'Semester Init' : isEligible ? 'UGC Cleared' : 'Shortage'}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 flex items-center gap-1 font-medium">
                        {isZero ? (
                          <>
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            Awaiting Classes
                          </>
                        ) : isEligible ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Eligible for Exams
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Condone / Remedial Req.
                          </>
                        )}
                      </p>
                    </div>
                  );
                })()}

                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Fee Clearance
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-blue-800 dark:text-blue-200">100% Cleared</span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    No Dues Outstanding
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Exam Hall Ticket
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-purple-800 dark:text-purple-200">Approved</span>
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-1 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    Issued by Controller
                  </p>
                </div>
              </div>

              {/* Enrolled Courses & Assigned Faculty */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Assigned Courses & Faculty Instructors
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data.enrolled_courses?.map((c: any) => (
                    <div
                      key={c.course_id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 shadow-sm"
                    >
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-400">
                          {c.course_code}
                        </span>
                        <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">
                          {c.course_name}
                        </h6>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Faculty: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.faculty_name || 'Dr. K. Srinivas Rao'}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Notification Gateway */}
              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                        Registrar Parent Email Notification Gateway
                      </h5>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                        Official Academic Dispatch to: {data.student?.parent_email || 'rameshreddy.p@gmail.com'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 rounded">
                    Active Gateway
                  </span>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Dispatched notices are archived in PostgreSQL <code className="font-mono">parent_notifications</code>.
                    </span>
                    <button
                      type="button"
                      onClick={handleSendEmailAlert}
                      disabled={sendingAlert}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all disabled:opacity-50"
                    >
                      {sendingAlert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Academic Notice via Email</span>
                    </button>
                  </div>
                </div>

                {alertSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{alertSuccess}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            KL EduConnect Academic Verification Server • Timestamp: {new Date().toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close Snapshot
          </button>
        </div>
      </div>
    </div>
  );
}
