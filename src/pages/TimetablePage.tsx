import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarDays,
  Clock,
  User,
  MapPin,
  Download,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Layers,
  Send,
  Loader2,
  Printer,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Users,
} from 'lucide-react';
import {
  TIMETABLE_SECTIONS,
  PERIOD_SLOTS,
  getCurrentAndNextClass,
  normalizeSection,
  parseSubjectDetails,
  FACULTY_DIRECTORY,
  getFacultyWeeklySchedule,
  getFacultyLiveClass,
  findFacultyFromProfile,
} from '@/lib/timetableData';
import AutoClassAlertManager from '@/components/AutoClassAlertManager';

const API_BASE =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? `http://${window.location.hostname}:5001`
    : 'http://localhost:5001';

export default function TimetablePage() {
  const { profile } = useAuth();
  const role = profile?.role?.toLowerCase() || 'student';
  const isStudent = role === 'student';

  const defaultSec = normalizeSection(profile?.section || 'E4');
  const defaultFac = findFacultyFromProfile(profile);

  // For faculty and admins, default to their personal teaching schedule; for students, their section schedule
  const [viewMode, setViewMode] = useState<'personal' | 'section'>(isStudent ? 'section' : 'personal');
  const [selectedSection, setSelectedSection] = useState<string>(defaultSec);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(defaultFac.id);
  const [selectedDay, setSelectedDay] = useState<string>('ALL'); // 'ALL' or 'MON', 'TUE', etc.

  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertStatus, setAlertStatus] = useState<string | null>(null);

  // Sync state whenever profile finishes loading
  useEffect(() => {
    if (profile?.section) {
      setSelectedSection(normalizeSection(profile.section));
    }
    if (!isStudent && profile) {
      const matched = findFacultyFromProfile(profile);
      setSelectedFacultyId(matched.id);
    }
  }, [profile?.section, profile?.full_name, profile?.email, isStudent]);

  // Section data for cohort view
  const secData = TIMETABLE_SECTIONS[selectedSection] || TIMETABLE_SECTIONS.E4;
  const studentLiveInfo = getCurrentAndNextClass(selectedSection);

  // Faculty data for personal teaching view
  const facultySchedule = getFacultyWeeklySchedule(selectedFacultyId);
  const facultyLiveInfo = getFacultyLiveClass(selectedFacultyId);

  const daysList = ['MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'];

  async function handleSendNextClassAlert() {
    let targetTitle = '';
    let targetCode = '';
    let targetFaculty = '';
    let targetRoom = '';
    let targetTime = '';
    let targetSection = selectedSection;

    if (viewMode === 'personal' && !isStudent) {
      const activeObj = facultyLiveInfo.currentSlot || facultyLiveInfo.nextSlot;
      if (!activeObj?.class) {
        setAlertStatus('No upcoming lecture found in personal teaching schedule today.');
        setTimeout(() => setAlertStatus(null), 4000);
        return;
      }
      targetTitle = activeObj.class.title;
      targetCode = activeObj.class.code;
      targetFaculty = activeObj.class.faculty || facultySchedule.facultyName;
      targetRoom = activeObj.class.room || 'Block B - Room 304';
      targetTime = activeObj.timeRange;
      targetSection = activeObj.section || 'E4';
    } else {
      if (!studentLiveInfo.nextClass && !studentLiveInfo.currentClass) return;
      const target = studentLiveInfo.nextClass || studentLiveInfo.currentClass;
      const targetSlot = studentLiveInfo.nextSlot || studentLiveInfo.currentSlot;
      targetTitle = target?.title || '';
      targetCode = target?.code || '';
      targetFaculty = target?.faculty || 'CSE Faculty';
      targetRoom = target?.room || 'Room 304';
      targetTime = targetSlot?.displayTime || '8:15 AM - 4:00 PM';
    }

    try {
      setSendingAlert(true);
      setAlertStatus(null);

      const targetEmail = profile?.email || 'shloka.p@klh.edu.in';
      const targetName = profile?.full_name || 'Academic Scholar';

      const res = await fetch(`${API_BASE}/api/timetable/send-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: profile?.id,
          student_email: targetEmail,
          student_name: targetName,
          section: targetSection,
          class_details: {
            title: targetTitle,
            code: targetCode,
            faculty: targetFaculty,
            room: targetRoom,
            time: targetTime,
            section: targetSection,
          },
        }),
      });

      if (res.ok) {
        setAlertStatus(
          `Class alert dispatched to Section ${targetSection} cohort via University Notification Gateway!`
        );
        setTimeout(() => setAlertStatus(null), 6000);
      }
    } catch (err: any) {
      setAlertStatus('Error sending class notification');
    } finally {
      setSendingAlert(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Lecture':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Practical':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Skill':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Coding':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Library':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 animate-fade-in print:p-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>AY 2025–2026 Odd Semester • II Yr (Y25 Batch)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {!isStudent && viewMode === 'personal'
              ? 'Faculty Teaching Schedule'
              : 'Class Timetable & Schedule'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            KL University - Hyderabad (Aziz Nagar Campus) • Department of Computer Science & Engineering
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Faculty View Switcher */}
          {!isStudent && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'personal'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>My Teaching Schedule</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('section')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'section'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Browse Cohorts</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleSendNextClassAlert}
            disabled={sendingAlert}
            className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            {sendingAlert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
            <span>Send Class Alert</span>
          </button>
        </div>
      </div>

      {alertStatus && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{alertStatus}</span>
        </div>
      )}

      {/* =========================================================
          FACULTY PERSONAL TEACHING VIEW
      ========================================================= */}
      {!isStudent && viewMode === 'personal' && (
        <>
          {/* Faculty Live Banner */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 shadow-xl relative overflow-hidden print:border print:text-black">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {facultyLiveInfo.currentSlot ? 'Active Lecture Right Now' : 'Up Next on Teaching Schedule'}
                  </span>
                  {facultyLiveInfo.currentSection || facultyLiveInfo.nextSection ? (
                    <span className="px-2 py-0.5 rounded-md bg-red-600/30 border border-red-500/50 text-xs font-black text-white">
                      Target Cohort: Section {facultyLiveInfo.currentSection || facultyLiveInfo.nextSection}
                    </span>
                  ) : null}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {facultyLiveInfo.currentClass
                    ? `${facultyLiveInfo.currentClass.title} (${facultyLiveInfo.currentClass.code})`
                    : facultyLiveInfo.nextClass
                    ? `${facultyLiveInfo.nextClass.title} (${facultyLiveInfo.nextClass.code})`
                    : 'No remaining lectures scheduled for today'}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1 font-semibold text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    {facultyLiveInfo.currentSlot?.timeRange ||
                      facultyLiveInfo.nextSlot?.timeRange ||
                      '8:15 AM - 4:00 PM'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                    Instructor: <strong className="text-white">{facultySchedule.facultyName}</strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    {(facultyLiveInfo.currentClass || facultyLiveInfo.nextClass)?.room || 'CSE Block B'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendNextClassAlert}
                  disabled={sendingAlert}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {sendingAlert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                  <span>Alert Section Cohort</span>
                </button>
              </div>
            </div>
          </div>

          {/* Faculty Selector & Workload Details */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Teaching Faculty:
              </label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-red-500"
              >
                {FACULTY_DIRECTORY.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.displayTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Briefcase className="w-3.5 h-3.5 text-red-600" />
                <span className="text-slate-500 dark:text-slate-400">Weekly Workload:</span>
                <strong className="text-slate-900 dark:text-white">
                  {facultySchedule.totalWeeklyHours} Hours ({facultySchedule.totalWeeklyClasses} Sessions)
                </strong>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-500 dark:text-slate-400">Target Cohorts:</span>
                <strong className="text-slate-900 dark:text-white">
                  {facultySchedule.assignedSections.map((s) => `Section ${s}`).join(', ')}
                </strong>
              </div>
            </div>
          </div>

          {/* Day Filter */}
          <div className="flex items-center justify-between gap-3 print:hidden">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Showing personal teaching assignments across all CSE sections.
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDay('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedDay === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Full Week
              </button>
              {daysList.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedDay === d
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Faculty Matrix Table */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Instructor Timetable • {facultySchedule.facultyName} ({facultySchedule.subjectTitle})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Assigned to: {facultySchedule.assignedSections.map((s) => `Section ${s}`).join(' & ')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                    <th className="py-3.5 px-4 w-28 uppercase tracking-wider font-extrabold text-slate-900 dark:text-white">Day</th>
                    <th className="py-3.5 px-4 min-w-[170px]">
                      <div>8:15 AM – 9:55 AM</div>
                      <div className="text-[10px] font-normal text-slate-400">Periods 1 & 2 (100 mins)</div>
                    </th>
                    <th className="py-3.5 px-3 w-20 text-center bg-slate-200/50 dark:bg-slate-800/40 text-[10px] text-slate-400">
                      9:55 - 10:10<br />TEA BREAK
                    </th>
                    <th className="py-3.5 px-4 min-w-[170px]">
                      <div>10:10 AM – 11:50 AM</div>
                      <div className="text-[10px] font-normal text-slate-400">Periods 3 & 4 (100 mins)</div>
                    </th>
                    <th className="py-3.5 px-3 w-20 text-center bg-slate-200/50 dark:bg-slate-800/40 text-[10px] text-slate-400">
                      11:50 - 12:45<br />LUNCH
                    </th>
                    <th className="py-3.5 px-4 min-w-[170px]">
                      <div>12:45 PM – 2:20 PM</div>
                      <div className="text-[10px] font-normal text-slate-400">Periods 5 & 6 (95 mins)</div>
                    </th>
                    <th className="py-3.5 px-4 min-w-[170px]">
                      <div>2:20 PM – 4:00 PM</div>
                      <div className="text-[10px] font-normal text-slate-400">Periods 7 & 8 (100 mins)</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedDay === 'ALL' ? daysList : [selectedDay]).map((d) => {
                    const slots = facultySchedule.days[d] || [];
                    const s1 = slots[0];
                    const s2 = slots[1];
                    const s3 = slots[2];
                    const s4 = slots[3];

                    return (
                      <tr key={d} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-4 font-black text-sm text-slate-900 dark:text-white font-mono bg-slate-50/30 dark:bg-slate-800/20">
                          {d}
                        </td>

                        {/* Block 1 */}
                        <td className="py-3 px-4">
                          {s1?.class ? (
                            <div className="space-y-1.5 p-2 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                              <div className="flex items-center justify-between gap-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-700 text-white shadow-xs">
                                  Section {s1.section}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(s1.class.type)}`}>
                                  {s1.class.type}
                                </span>
                              </div>
                              <p className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                                {s1.class.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="truncate">{s1.class.room}</span>
                              </p>
                            </div>
                          ) : (
                            <div className="py-3 px-2 text-center text-slate-400 dark:text-slate-600 text-[11px] italic bg-slate-50/40 dark:bg-slate-800/20 rounded-xl">
                              — Free Period / Office Hours —
                            </div>
                          )}
                        </td>

                        {/* Tea Break */}
                        <td className="py-3 px-2 text-center bg-slate-50/60 dark:bg-slate-800/30 text-[10px] font-bold text-slate-400">
                          ☕
                        </td>

                        {/* Block 2 */}
                        <td className="py-3 px-4">
                          {s2?.class ? (
                            <div className="space-y-1.5 p-2 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                              <div className="flex items-center justify-between gap-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-700 text-white shadow-xs">
                                  Section {s2.section}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(s2.class.type)}`}>
                                  {s2.class.type}
                                </span>
                              </div>
                              <p className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                                {s2.class.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="truncate">{s2.class.room}</span>
                              </p>
                            </div>
                          ) : (
                            <div className="py-3 px-2 text-center text-slate-400 dark:text-slate-600 text-[11px] italic bg-slate-50/40 dark:bg-slate-800/20 rounded-xl">
                              — Free Period / Office Hours —
                            </div>
                          )}
                        </td>

                        {/* Lunch Break */}
                        <td className="py-3 px-2 text-center bg-slate-50/60 dark:bg-slate-800/30 text-[10px] font-bold text-slate-400">
                          🍱
                        </td>

                        {/* Block 3 */}
                        <td className="py-3 px-4">
                          {s3?.class ? (
                            <div className="space-y-1.5 p-2 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                              <div className="flex items-center justify-between gap-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-700 text-white shadow-xs">
                                  Section {s3.section}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(s3.class.type)}`}>
                                  {s3.class.type}
                                </span>
                              </div>
                              <p className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                                {s3.class.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="truncate">{s3.class.room}</span>
                              </p>
                            </div>
                          ) : (
                            <div className="py-3 px-2 text-center text-slate-400 dark:text-slate-600 text-[11px] italic bg-slate-50/40 dark:bg-slate-800/20 rounded-xl">
                              — Free Period / Office Hours —
                            </div>
                          )}
                        </td>

                        {/* Block 4 */}
                        <td className="py-3 px-4">
                          {s4?.class ? (
                            <div className="space-y-1.5 p-2 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                              <div className="flex items-center justify-between gap-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-700 text-white shadow-xs">
                                  Section {s4.section}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(s4.class.type)}`}>
                                  {s4.class.type}
                                </span>
                              </div>
                              <p className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                                {s4.class.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="truncate">{s4.class.room}</span>
                              </p>
                            </div>
                          ) : (
                            <div className="py-3 px-2 text-center text-slate-400 dark:text-slate-600 text-[11px] italic bg-slate-50/40 dark:bg-slate-800/20 rounded-xl">
                              — Free Period / Office Hours —
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================
          SECTION COHORT TIMETABLE VIEW (FOR STUDENTS OR BROWSING)
      ========================================================= */}
      {(isStudent || viewMode === 'section') && (
        <>
          {/* Student Live Banner */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 shadow-xl relative overflow-hidden print:border print:text-black">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {studentLiveInfo.currentClass ? 'Active Session Right Now' : 'Up Next on Campus'}
                  </span>
                  <span className="text-xs text-slate-400">• Section {selectedSection}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {studentLiveInfo.currentClass
                    ? `${studentLiveInfo.currentClass.title} (${studentLiveInfo.currentClass.code})`
                    : studentLiveInfo.nextClass
                    ? `${studentLiveInfo.nextClass.title} (${studentLiveInfo.nextClass.code})`
                    : 'No more classes today'}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1 font-semibold text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    {studentLiveInfo.currentSlot?.displayTime ||
                      studentLiveInfo.nextSlot?.displayTime ||
                      '8:15 AM - 4:00 PM'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Faculty:{' '}
                    <strong className="text-white">
                      {(studentLiveInfo.currentClass || studentLiveInfo.nextClass)?.faculty || 'CSE Faculty'}
                    </strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    {(studentLiveInfo.currentClass || studentLiveInfo.nextClass)?.room || 'CSE Block B'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendNextClassAlert}
                  disabled={sendingAlert}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {sendingAlert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                  <span>Dispatch Real-time Reminder</span>
                </button>
              </div>
            </div>
          </div>

          {/* Autonomous Schedule-Time Mobile Alert Manager */}
          <AutoClassAlertManager user={profile} />

          {/* Section Selector / Cohort Display */}
          <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
            {isStudent ? (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Assigned Academic Cohort
                </label>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-700 text-white text-xs font-bold shadow-sm">
                  <Layers className="w-4 h-4" />
                  <span>Section {selectedSection} • Official Academic Timetable</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Cohort Section
                </label>
                <div className="flex items-center flex-wrap gap-1.5">
                  {Object.keys(TIMETABLE_SECTIONS).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(sec)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedSection === sec
                          ? 'bg-red-700 text-white shadow-sm scale-105'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Section {sec}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Day Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Filter Day
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDay('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedDay === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Full Week
                </button>
                {daysList.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedDay === d
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Timetable Matrix View */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Official Master Schedule • Section {selectedSection} (Y25 Batch)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Working Hours: 8:15 AM – 4:00 PM</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                    <th className="py-3.5 px-4 w-28 uppercase tracking-wider font-extrabold text-slate-900 dark:text-white">Day</th>
                    <th className="py-3.5 px-4 min-w-[160px]">
                      <div>8:15 AM – 9:55 AM</div>
                      <div className="text-[10px] font-normal text-slate-400">Periods 1 & 2 (100 mins)</div>
                    </th>
                    <th className="py-3.5 px-3 w-20 text-center bg-slate-200/50 dark:bg-slate-800/40 text-[10px] text-slate-400">
                      9:55 - 10:10<br />TEA BREAK
                    </th>
                    <th className="py-3.5 px-4 min-w-[160px]">
                      <div>10:10 AM – 11:50 AM</div>
                      <div className="text-[10px] font-normal text-slate-400">Periods 3 & 4 (100 mins)</div>
                    </th>
                    <th className="py-3.5 px-3 w-20 text-center bg-slate-200/50 dark:bg-slate-800/40 text-[10px] text-slate-400">
                      11:50 - 12:45<br />LUNCH
                    </th>
                    <th className="py-3.5 px-4 min-w-[160px]">
                      <div>12:45 PM – 2:20 PM</div>
                      <div className="text-[10px] font-normal text-slate-400">Periods 5 & 6 (95 mins)</div>
                    </th>
                    <th className="py-3.5 px-4 min-w-[160px]">
                      <div>2:20 PM – 4:00 PM</div>
                      <div className="text-[10px] font-normal text-slate-400">Periods 7 & 8 (100 mins)</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedDay === 'ALL' ? daysList : [selectedDay]).map((d) => {
                    const daySlots = secData.days[d] || [];
                    const block1 = parseSubjectDetails(daySlots[0] || '', secData.facultyMapping);
                    const block2 = parseSubjectDetails(daySlots[3] || '', secData.facultyMapping);
                    const block3 = parseSubjectDetails(daySlots[6] || '', secData.facultyMapping);
                    const block4 = parseSubjectDetails(daySlots[8] || '', secData.facultyMapping);

                    return (
                      <tr key={d} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-4 font-black text-sm text-slate-900 dark:text-white font-mono bg-slate-50/30 dark:bg-slate-800/20">
                          {d}
                        </td>

                        {/* Block 1 */}
                        <td className="py-3 px-4">
                          {block1.code !== 'FREE' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getBadgeColor(block1.type)}`}>
                                  {block1.code}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">({block1.type})</span>
                              </div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{block1.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{block1.faculty}</span>
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">— Free Period —</span>
                          )}
                        </td>

                        {/* Tea Break */}
                        <td className="py-3 px-2 text-center bg-slate-50/60 dark:bg-slate-800/30 text-[10px] font-bold text-slate-400">
                          ☕
                        </td>

                        {/* Block 2 */}
                        <td className="py-3 px-4">
                          {block2.code !== 'FREE' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getBadgeColor(block2.type)}`}>
                                  {block2.code}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">({block2.type})</span>
                              </div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{block2.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{block2.faculty}</span>
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">— Free Period —</span>
                          )}
                        </td>

                        {/* Lunch Break */}
                        <td className="py-3 px-2 text-center bg-slate-50/60 dark:bg-slate-800/30 text-[10px] font-bold text-slate-400">
                          🍱
                        </td>

                        {/* Block 3 */}
                        <td className="py-3 px-4">
                          {block3.code !== 'FREE' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getBadgeColor(block3.type)}`}>
                                  {block3.code}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">({block3.type})</span>
                              </div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{block3.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{block3.faculty}</span>
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">— Free Period —</span>
                          )}
                        </td>

                        {/* Block 4 */}
                        <td className="py-3 px-4">
                          {block4.code !== 'FREE' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getBadgeColor(block4.type)}`}>
                                  {block4.code}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">({block4.type})</span>
                              </div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{block4.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{block4.faculty}</span>
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">— Free Period —</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Faculty Distribution Legend for this Section */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-600" />
              <span>Assigned Department Course Faculty (Section {selectedSection})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(secData.facultyMapping).map(([subj, fac]) => (
                <div
                  key={subj}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-xs flex items-center justify-center font-mono shrink-0">
                    {subj}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{fac}</p>
                    <p className="text-[10px] text-slate-500 truncate">Course Instructor</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
