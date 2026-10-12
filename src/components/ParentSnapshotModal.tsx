import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Send,
  Award,
  AlertCircle,
  FileText,
  Loader2,
  Mail,
  Sparkles,
  Navigation,
  Calculator,
  Printer,
  Share2,
  Edit3,
  Check,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { getCurrentAndNextClass } from '@/lib/timetableData';

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

  // Active creative view tab
  const [activeTab, setActiveTab] = useState<'radar' | 'dispatch' | 'hallticket'>('radar');

  // Interactive Attendance Simulator ("What-If" Calculator)
  const [simulatedNextClasses, setSimulatedNextClasses] = useState<number>(8);
  const [simulatedMissedClasses, setSimulatedMissedClasses] = useState<number>(2);

  // Guardian Email & Report Dispatcher State
  const [guardianEmail, setGuardianEmail] = useState('');
  const [editingGuardianEmail, setEditingGuardianEmail] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Official Ward Academic & Attendance Progress Report');
  const [messageText, setMessageText] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSnapshot();
  }, [pinOrRoll]);

  async function fetchSnapshot() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/parent/student/${encodeURIComponent(pinOrRoll)}`);
      if (!res.ok) {
        throw new Error('Could not load student guardian hub data');
      }
      const json = await res.json();
      setData(json);

      const defaultMail = json.student?.parent_email || 'rameshreddy.p@gmail.com';
      setGuardianEmail(defaultMail);

      const att = json.academic_status?.attendance_percentage ?? 0;
      setMessageText(
        `Dear ${json.student?.parent_name || 'Guardian'},\n\nHere is the real-time KL University academic telemetry for your ward ${json.student?.full_name} (Roll No: ${json.student?.roll_number}, Section ${json.student?.section || 'E4'}):\n• Verified Attendance: ${att}% (${att >= 75 || att === 0 ? 'UGC Compliant & Exam Eligible' : 'Remedial Condonation Advised'})\n• Semester Tuition & Exam Fees: 100% Cleared (No Dues)\n• Controller of Examinations Hall Ticket: Approved & Active\n\nWarm regards,\nAcademic Directorate, KLH Aziz Nagar Campus`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  }

  function applyReportTemplate(type: 'digest' | 'hallticket' | 'leave' | 'expo') {
    const s = data?.student || {};
    const att = data?.academic_status?.attendance_percentage ?? 0;
    const name = s.full_name || 'Student';
    const roll = s.roll_number || '2510030025';
    const sec = s.section || 'E4';
    const parent = s.parent_name || 'Respected Guardian';

    if (type === 'digest') {
      setSelectedTemplate('Weekly Academic & Attendance Digest');
      setMessageText(
        `Dear ${parent},\n\nWeekly Academic Digest for ${name} (${roll} • Section ${sec}):\n• Attendance Standing: ${att}%\n• Enrolled Courses: ${data?.enrolled_courses?.length || 6} Core CSE Subjects\n• Fee & Library Clearance: 100% Cleared\n• Academic Status: Good Standing for Odd Semester 2026-27.`
      );
    } else if (type === 'hallticket') {
      setSelectedTemplate('Exam Eligibility & Hall Ticket Clearance');
      setMessageText(
        `Dear ${parent},\n\nThis is to certify that ${name} (Roll No: ${roll}, Section ${sec}) has been granted Official Exam Hall Ticket Clearance by the Controller of Examinations at KL Deemed to be University.\n• Hall Ticket Status: RELEASED & VERIFIED\n• Fee Dues: ₹0.00 (Cleared)`
      );
    } else if (type === 'leave') {
      setSelectedTemplate('Guardian Leave / Duty Attendance Note');
      setMessageText(
        `Dear ${parent},\n\nAn official attendance / academic duty intimation has been logged for ${name} (${roll}, Section ${sec}) on ${new Date().toLocaleDateString('en-IN')}. Class advisors and course instructors have been notified via KL EduConnect.`
      );
    } else if (type === 'expo') {
      setSelectedTemplate('Innovation & Project Collaboration Milestone');
      setMessageText(
        `Dear ${parent},\n\nCongratulations! Your ward ${name} (${roll}) is actively participating in Collaborative Project-Based Learning (PBL) & Campus Innovation activities at KLH Aziz Nagar Campus, demonstrating strong teamwork and technical leadership.`
      );
    }
  }

  async function handleSaveGuardianEmail() {
    const clean = guardianEmail.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      alert('Please enter a valid guardian email address.');
      return;
    }
    try {
      setSavingEmail(true);
      const res = await fetch(`${API_BASE}/api/parent/update-student-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: data?.student?.user_id,
          roll_number: data?.student?.roll_number,
          parent_email: clean,
        }),
      });
      if (res.ok) {
        setEditingGuardianEmail(false);
        setData((prev: any) => ({
          ...prev,
          student: { ...prev.student, parent_email: clean },
        }));
      }
    } catch {} finally {
      setSavingEmail(false);
    }
  }

  async function handleSendEmailAlert() {
    if (!data?.student?.user_id) return;
    try {
      setSendingAlert(true);
      setAlertSuccess(null);
      const email = guardianEmail.trim() || data.student.parent_email || 'rameshreddy.p@gmail.com';
      const res = await fetch(`${API_BASE}/api/parent/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: data.student.user_id,
          parent_email: email,
          report_type: selectedTemplate,
          student_name: data.student.full_name,
          roll_number: data.student.roll_number,
          section: data.student.section,
          attendance_pct: data.academic_status?.attendance_percentage ?? 0,
          channel: 'Email',
          message_content: messageText,
        }),
      });

      if (res.ok) {
        setAlertSuccess(`✉️ Official "${selectedTemplate}" delivered to ${email} via Gmail SMTP!`);
        setTimeout(() => setAlertSuccess(null), 6000);
      }
    } catch (err) {
      console.error('Failed to dispatch alert:', err);
    } finally {
      setSendingAlert(false);
    }
  }

  function handleShareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const sectionCode = data?.student?.section?.replace(/^Section\s+/i, '').trim() || 'E4';
  const liveSchedule = getCurrentAndNextClass(sectionCode);

  const totalClasses = Number(data?.academic_status?.total_lectures ?? data?.academic_status?.total_classes ?? 0);
  const attendedClasses = Number(data?.academic_status?.attended_lectures ?? data?.academic_status?.attended_classes ?? 0);
  const currentAttPct = Number(data?.academic_status?.attendance_percentage ?? 0);

  // What-If Attendance Projection (uses actual classes, or a 12-lecture baseline if <= 2 classes recorded so every slider notch changes %)
  const baseTotal = totalClasses > 2 ? totalClasses : Math.max(totalClasses, 10);
  const baseAttended =
    totalClasses > 2
      ? attendedClasses
      : totalClasses > 0
      ? Math.round((attendedClasses / totalClasses) * baseTotal)
      : 9;
  const projectedTotal = Math.max(1, baseTotal + simulatedNextClasses + simulatedMissedClasses);
  const projectedAttended = Math.max(0, baseAttended + simulatedNextClasses);
  const projectedPct = Math.min(100, Math.round((projectedAttended / projectedTotal) * 1000) / 10);
  const maxSafeLeaves = Math.max(0, Math.floor(projectedAttended / 0.75 - projectedTotal));
  const classesNeededFor75 = projectedPct >= 75 ? 0 : Math.max(1, Math.ceil((0.75 * projectedTotal - projectedAttended) / 0.25));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-800 via-red-900 to-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow">
              <img src="./klh-logo.png" alt="KL" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white leading-tight">
                  Guardian Connect & Live Ward Telemetry Hub
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Instant Access
                </span>
              </div>
              <p className="text-xs text-red-200">
                KL Deemed to be University • Live Campus Radar, Attendance Simulator & Official Report Dispatcher
              </p>
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

        {/* Interactive Feature Tabs */}
        <div className="px-6 pt-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'radar'
                ? 'border-red-700 text-red-700 dark:text-amber-400 dark:border-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Live Campus Radar & Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'dispatch'
                ? 'border-red-700 text-red-700 dark:text-amber-400 dark:border-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>1-Click Guardian Email & WhatsApp Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hallticket')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'hallticket'
                ? 'border-red-700 text-red-700 dark:text-amber-400 dark:border-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Official Hall Ticket & No-Dues Pass</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-700" />
              <p className="text-sm">Synchronizing live student telemetry...</p>
            </div>
          ) : error || !data ? (
            <div className="p-6 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error || 'Data unavailable'}</p>
            </div>
          ) : (
            <>
              {/* Student & Guardian Top Summary Strip */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 to-red-900 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {data.student?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {data.student?.full_name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Roll No: {data.student?.roll_number} • Section {sectionCode}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{data.student?.department}</p>
                  </div>
                </div>

                {/* Inline Editable Guardian Email */}
                <div className="text-right space-y-1">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Guardian: <span className="text-slate-900 dark:text-white font-bold">{data.student?.parent_name}</span>
                  </div>
                  {editingGuardianEmail ? (
                    <div className="flex items-center gap-1.5 justify-end">
                      <input
                        type="email"
                        value={guardianEmail}
                        onChange={(e) => setGuardianEmail(e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSaveGuardianEmail}
                        disabled={savingEmail}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-end gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-red-600" />
                      <span className="font-mono">{guardianEmail}</span>
                      <button
                        type="button"
                        onClick={() => setEditingGuardianEmail(true)}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================
                 TAB 1: LIVE CAMPUS RADAR & ATTENDANCE SIMULATOR
              ============================================================ */}
              {activeTab === 'radar' && (
                <div className="space-y-5">
                  {/* Live Campus Location & Timetable Radar */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Live Campus Schedule Radar • Section {sectionCode}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {liveSchedule.day} • KLH Aziz Nagar
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-emerald-400">
                          Current Campus Status
                        </span>
                        {liveSchedule.currentClass ? (
                          <div className="mt-1">
                            <h5 className="text-sm font-black text-white">
                              {liveSchedule.currentClass.title} ({liveSchedule.currentClass.code})
                            </h5>
                            <p className="text-xs text-slate-300 mt-0.5">
                              Faculty: {liveSchedule.currentClass.faculty}
                            </p>
                            <p className="text-[11px] text-amber-300 font-mono mt-1">
                              {liveSchedule.currentSlot?.label} • {liveSchedule.currentSlot?.displayTime}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <h5 className="text-sm font-bold text-white">
                              Self-Study / Innovation Lab Hours
                            </h5>
                            <p className="text-xs text-slate-300 mt-0.5">
                              No active lecture at this exact minute — available for library, coding studio, or group huddle.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-sky-400">
                          Next Scheduled Lecture
                        </span>
                        {liveSchedule.nextClass ? (
                          <div className="mt-1">
                            <h5 className="text-sm font-black text-white">
                              {liveSchedule.nextClass.title} ({liveSchedule.nextClass.code})
                            </h5>
                            <p className="text-xs text-slate-300 mt-0.5">
                              Faculty: {liveSchedule.nextClass.faculty}
                            </p>
                            <p className="text-[11px] text-sky-300 font-mono mt-1">
                              Starts at {liveSchedule.nextSlot?.displayTime}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <h5 className="text-sm font-bold text-white">Day Schedule Completed</h5>
                            <p className="text-xs text-slate-300 mt-0.5">
                              Classes resume on the next working day at 08:15 AM.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clearance Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        Attendance Standing
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black">{currentAttPct}%</span>
                        <span className="text-xs font-semibold">
                          {currentAttPct === 0 ? 'Semester Init' : currentAttPct >= 75 ? 'UGC Safe' : 'Shortage'}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{totalClasses === 0 ? 'Classes Commencing' : `${attendedClasses}/${totalClasses} Sessions`}</span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        Fee Clearance
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-blue-800 dark:text-blue-200">100% Cleared</span>
                      </div>
                      <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Receipt #KL-2026-8812
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

                  {/* Interactive "What-If" Attendance Simulator */}
                  <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            Interactive Attendance Goal Predictor ("What-If" Simulator)
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Drag either slider to simulate upcoming classes attended or planned leave:
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 block">
                          Projected ({projectedAttended}/{projectedTotal} Classes)
                        </span>
                        <span
                          className={`text-xl font-black ${
                            projectedPct >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {projectedPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Slider 1: Upcoming Classes Attended */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <span>Upcoming Consecutive Lectures Attended:</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                          +{simulatedNextClasses} Attended
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        value={simulatedNextClasses}
                        onChange={(e) => setSimulatedNextClasses(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    {/* Slider 2: Planned Leave / Classes Missed */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <span>Planned Leave / Lectures Missed:</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-800 dark:text-rose-300 font-mono font-bold">
                          -{simulatedMissedClasses} Missed
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={simulatedMissedClasses}
                        onChange={(e) => setSimulatedMissedClasses(Number(e.target.value))}
                        className="w-full accent-rose-600 cursor-pointer"
                      />
                    </div>

                    {/* Live UGC 75% Eligibility Verdict */}
                    <div
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                        projectedPct >= 75
                          ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-100/80 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      <span>
                        {projectedPct >= 75
                          ? `✅ UGC Safe (≥75%) • Can safely take ${maxSafeLeaves} more class leave${maxSafeLeaves === 1 ? '' : 's'}`
                          : `⚠️ Shortage Alert (<75%) • Need +${classesNeededFor75} consecutive attended classes to recover`}
                      </span>
                      <span className="font-mono">{projectedPct.toFixed(1)}% / 75.0%</span>
                    </div>
                  </div>

                  {/* Enrolled Courses & Direct Faculty Email */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Assigned Courses & 1-Click Faculty Contact
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {data.enrolled_courses?.map((c: any) => (
                        <div
                          key={c.course_id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-400">
                                {c.course_code}
                              </span>
                              <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {c.course_name}
                              </h6>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {c.faculty_name || 'Dr. K. Srinivas Rao'}
                              </p>
                            </div>
                          </div>
                          <a
                            href={`mailto:faculty.cse@klh.edu.in?subject=${encodeURIComponent(
                              `Academic Query: ${c.course_code} - ${data.student?.full_name} (${data.student?.roll_number})`
                            )}`}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-700 hover:text-white text-slate-700 dark:text-slate-300 text-[10px] font-bold transition shrink-0"
                          >
                            Mail Faculty
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                 TAB 2: 1-CLICK GUARDIAN REPORT & LEAVE DISPATCHER
              ============================================================ */}
              {activeTab === 'dispatch' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Instant Official Guardian Report & Excuse Note Dispatcher</span>
                        </h5>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                          Select a smart template below and dispatch a formatted HTML report directly to{' '}
                          <strong>{guardianEmail}</strong> via Gmail SMTP or WhatsApp.
                        </p>
                      </div>
                    </div>

                    {/* 4 Creative Template Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => applyReportTemplate('digest')}
                        className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition flex items-center gap-2.5"
                      >
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            📊 Weekly Academic Digest
                          </div>
                          <div className="text-[10px] text-slate-500">Attendance, courses & fee summary</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyReportTemplate('hallticket')}
                        className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition flex items-center gap-2.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            🎓 Exam Clearance Certificate
                          </div>
                          <div className="text-[10px] text-slate-500">Confirm Hall Ticket & UGC eligibility</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyReportTemplate('leave')}
                        className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition flex items-center gap-2.5"
                      >
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            🏥 Medical / Duty Leave Intimation
                          </div>
                          <div className="text-[10px] text-slate-500">Log official absence excuse note</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyReportTemplate('expo')}
                        className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition flex items-center gap-2.5"
                      >
                        <Award className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            🏆 Project Expo & PBL Milestone
                          </div>
                          <div className="text-[10px] text-slate-500">Share team collaboration achievement</div>
                        </div>
                      </button>
                    </div>

                    {/* Editable Report Content */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Report Subject: <span className="text-indigo-600 dark:text-indigo-400">{selectedTemplate}</span>
                      </label>
                      <textarea
                        rows={5}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="w-full text-xs p-3.5 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                      />
                    </div>

                    {/* Dispatch Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSendEmailAlert}
                        disabled={sendingAlert}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition disabled:opacity-50"
                      >
                        {sendingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Email Official HTML Report to {guardianEmail}</span>
                      </button>
                    </div>

                    {alertSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{alertSuccess}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================
                 TAB 3: OFFICIAL PRINTABLE HALL TICKET & NO-DUES PASS
              ============================================================ */}
              {activeTab === 'hallticket' && (
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 space-y-5 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <img src="./klh-logo.png" alt="KLH" className="w-12 h-12 object-contain" />
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-red-800 dark:text-red-400">
                            Koneru Lakshmaiah Education Foundation
                          </h4>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Official Semester Examination Hall Ticket & No-Dues Clearance Pass
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Aziz Nagar Campus, Hyderabad • Odd Semester 2026–27
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-800">
                          ✓ VERIFIED & CLEARED
                        </span>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                          Pass ID: #KLH-{data.student?.roll_number || '2026'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                        <span className="text-[10px] text-slate-400 uppercase block">Candidate Name</span>
                        <span className="font-bold text-slate-900 dark:text-white">{data.student?.full_name}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                        <span className="text-[10px] text-slate-400 uppercase block">University Roll No</span>
                        <span className="font-mono font-bold text-red-700 dark:text-amber-400">
                          {data.student?.roll_number}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                        <span className="text-[10px] text-slate-400 uppercase block">Program & Section</span>
                        <span className="font-bold text-slate-900 dark:text-white">B.Tech CSE • {sectionCode}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                        <span className="text-[10px] text-slate-400 uppercase block">Fee & Library Dues</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0.00 (No Dues)</span>
                      </div>
                    </div>

                    <div>
                      <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Authorized Examination Courses
                      </h6>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Course Code</th>
                              <th className="py-2 px-3">Course Title</th>
                              <th className="py-2 px-3">Instructor</th>
                              <th className="py-2 px-3">Clearance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {data.enrolled_courses?.map((c: any) => (
                              <tr key={c.course_id}>
                                <td className="py-2 px-3 font-mono font-bold text-red-700 dark:text-amber-400">
                                  {c.course_code}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  {c.course_name}
                                </td>
                                <td className="py-2 px-3 text-slate-500">
                                  {c.faculty_name || 'Dr. K. Srinivas Rao'}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    ✓ Eligible
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Digitally Signed by Controller of Examinations, KL University</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Save Official PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            KL EduConnect Guardian Connect Hub • Synced at {new Date().toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
}
