/**
 * Automated Schedule-Time Class Alert Engine for KL University
 * Dispatches automated alerts to students' mobile devices on a timetable schedule
 * without requiring any manual clicking.
 */

const pool = require("./db");
const nodemailer = require("nodemailer");

// Period schedule slots
const PERIOD_SLOTS = [
  { slotIndex: 0, periodName: 'Period 1', startTime: '08:15', endTime: '09:05', displayTime: '8:15 AM - 9:05 AM' },
  { slotIndex: 1, periodName: 'Period 2', startTime: '09:05', endTime: '09:55', displayTime: '9:05 AM - 9:55 AM' },
  { slotIndex: 2, periodName: 'Tea Break', startTime: '09:55', endTime: '10:10', displayTime: '9:55 AM - 10:10 AM', isBreak: true },
  { slotIndex: 3, periodName: 'Period 3', startTime: '10:10', endTime: '11:00', displayTime: '10:10 AM - 11:00 AM' },
  { slotIndex: 4, periodName: 'Period 4', startTime: '11:00', endTime: '11:50', displayTime: '11:00 AM - 11:50 AM' },
  { slotIndex: 5, periodName: 'Lunch Break', startTime: '11:50', endTime: '12:45', displayTime: '11:50 AM - 12:45 PM', isBreak: true },
  { slotIndex: 6, periodName: 'Period 5', startTime: '12:45', endTime: '13:30', displayTime: '12:45 PM - 1:30 PM' },
  { slotIndex: 7, periodName: 'Period 6', startTime: '13:30', endTime: '14:20', displayTime: '1:30 PM - 2:20 PM' },
  { slotIndex: 8, periodName: 'Period 7', startTime: '14:20', endTime: '15:10', displayTime: '2:20 PM - 3:10 PM' },
  { slotIndex: 9, periodName: 'Period 8', startTime: '15:10', endTime: '16:00', displayTime: '3:10 PM - 4:00 PM' },
];

const SUBJECT_TITLES = {
  DBMS: 'Database Management Systems',
  DSA: 'Data Structures and Algorithms',
  OSSP: 'Open Source Software Practices',
  ML: 'Machine Learning',
  ES: 'Embedded Systems & IoT',
  FL: 'Foreign Language: Japanese',
  CODING: 'Algorithmic Coding & Problem Solving',
  LIBRARY: 'Central Library Knowledge Hours',
};

// Section E4 (Default cohort)
const E4_FACULTY = {
  ML: 'Dr. Subhranginee Das',
  DSA: 'Dr. M Saidi Reddy',
  OSSP: 'Dr. P. Pavan Kumar',
  ES: 'Dr. Chandrasekhar',
  DBMS: 'Dr. P. Lalitha Kumari',
  FL: 'Mrs. Sandhya Deshmukh',
  CODING: 'Dept. Technical Trainers',
  LIBRARY: 'Central Library Staff',
};

const E4_SCHEDULE = {
  MON: ['DBMS(L)', 'DBMS(L)', 'BREAK', 'ML(L)', 'ML(L)', 'LUNCH', 'FL', 'FL', 'ES(L)', 'ES(L)'],
  TUE: ['ES(S)', 'ES(S)', 'BREAK', 'DBMS(P)', 'DBMS(P)', 'LUNCH', 'ML(P)', 'ML(P)', 'DSA(L)', 'DSA(L)'],
  WED: ['ML(S)', 'ML(S)', 'BREAK', 'OSSP(L)', 'OSSP(L)', 'LUNCH', 'DSA(P)', 'DSA(P)', 'CODING', 'CODING'],
  THR: ['ES(S)', 'ES(S)', 'BREAK', 'DSA(S)', 'DSA(S)', 'LUNCH', 'DBMS(S)', 'DBMS(S)', 'LIBRARY', 'LIBRARY'],
  FRI: ['ES(S)', 'ES(S)', 'BREAK', 'OSSP(S)', 'OSSP(S)', 'LUNCH', 'DBMS(S)', 'DBMS(S)', 'OSSP', 'OSSP'],
  SAT: ['DSA(S)', 'DSA(S)', 'BREAK', 'ML(S)', 'ML(S)', 'LUNCH', 'OSSP(S)', 'OSSP(S)', 'ES(S)', 'ES(S)'],
};

// Memory cache to prevent duplicate alerts for the same slot on the same day
const dispatchedAlertsCache = new Set();
const alertHistory = [];

let mailTransporter = null;
function getMailTransporter() {
  if (!mailTransporter) {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      mailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      mailTransporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
  return mailTransporter;
}

function parseSubjectDetails(rawCode, facultyMapping) {
  if (!rawCode || rawCode === 'BREAK' || rawCode === 'LUNCH') return null;
  const match = rawCode.match(/^([A-Z]+)(\(([LPS])\))?$/);
  const base = match ? match[1] : rawCode;
  const typeChar = match && match[3] ? match[3] : 'L';

  let type = 'Lecture';
  if (typeChar === 'P') type = 'Practical';
  if (typeChar === 'S') type = 'Skill';
  if (base === 'CODING') type = 'Coding';
  if (base === 'LIBRARY') type = 'Library';

  const faculty = (facultyMapping && facultyMapping[base]) || 'Department Faculty';
  const room = type === 'Practical' || type === 'Coding' ? 'Lab C-204 (Computing Center)' : 'Block B - Room 304';

  return {
    raw: rawCode,
    code: base,
    title: SUBJECT_TITLES[base] || base,
    type,
    faculty,
    room,
  };
}

function getCurrentScheduleContext() {
  const now = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'];
  const currentDay = dayNames[now.getDay()] || 'MON';
  const dayKey = currentDay === 'SUN' ? 'MON' : currentDay;
  const daySlots = E4_SCHEDULE[dayKey] || E4_SCHEDULE.MON;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let currentSlot = null;
  let currentClass = null;
  let nextSlot = null;
  let nextClass = null;
  let minutesUntilNext = null;

  for (let i = 0; i < PERIOD_SLOTS.length; i++) {
    const slot = PERIOD_SLOTS[i];
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (nowMinutes >= startTotal && nowMinutes < endTotal) {
      currentSlot = slot;
      currentClass = parseSubjectDetails(daySlots[i], E4_FACULTY);
      // Next slot
      for (let j = i + 1; j < PERIOD_SLOTS.length; j++) {
        const nextRaw = daySlots[j];
        if (nextRaw && nextRaw !== 'BREAK' && nextRaw !== 'LUNCH') {
          nextSlot = PERIOD_SLOTS[j];
          nextClass = parseSubjectDetails(nextRaw, E4_FACULTY);
          const [nStartH, nStartM] = nextSlot.startTime.split(':').map(Number);
          minutesUntilNext = (nStartH * 60 + nStartM) - nowMinutes;
          break;
        }
      }
      break;
    } else if (nowMinutes < startTotal) {
      const candidateRaw = daySlots[i];
      if (candidateRaw && candidateRaw !== 'BREAK' && candidateRaw !== 'LUNCH') {
        nextSlot = slot;
        nextClass = parseSubjectDetails(candidateRaw, E4_FACULTY);
        minutesUntilNext = startTotal - nowMinutes;
        break;
      }
    }
  }

  // Fallback if after hours: wrap around to first class of next morning
  if (!nextSlot) {
    nextSlot = PERIOD_SLOTS[0];
    nextClass = parseSubjectDetails(daySlots[0], E4_FACULTY);
    minutesUntilNext = null;
  }

  return {
    now,
    dayKey,
    nowMinutes,
    currentSlot,
    currentClass,
    nextSlot,
    nextClass,
    minutesUntilNext,
  };
}

/**
 * Dispatch automated alert for a class to mobile push, database notification, and email
 */
async function dispatchClassAlert(student, targetClass, targetSlot, leadMinutes = 5) {
  if (!student || !targetClass || !targetSlot) return null;

  const roll = student.roll_number || '2510030025';
  const name = student.full_name || 'Student';
  const email = student.email || '2510030025@klh.edu.in';
  const userId = student.user_id || 2;

  const title = `⏰ Upcoming Class: ${targetClass.title}`;
  const message = `Hello ${name}, your scheduled ${targetClass.type} for ${targetClass.title} (${targetClass.code}) begins ${leadMinutes > 0 ? `in ${leadMinutes} mins` : 'now'} at ${targetSlot.startTime} in ${targetClass.room} with ${targetClass.faculty}.`;

  const alertEntry = {
    id: Date.now(),
    student_id: userId,
    student_name: name,
    roll_number: roll,
    class_title: targetClass.title,
    room: targetClass.room,
    faculty: targetClass.faculty,
    time: targetSlot.displayTime,
    dispatched_at: new Date().toISOString(),
    channels: ['Mobile Push (ntfy)', 'In-App Notifications', 'Email'],
  };

  alertHistory.unshift(alertEntry);
  if (alertHistory.length > 30) alertHistory.pop();

  // 1. Insert into PostgreSQL notifications table (Fixed schema without 'type')
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, is_read, created_at)
       VALUES ($1, $2, $3, false, NOW())`,
      [userId, title, message]
    );
    console.log(`[Scheduler] Logged automated alert in PostgreSQL notifications for User ${userId}`);
  } catch (dbErr) {
    console.error('[Scheduler] DB notification insert error:', dbErr.message);
  }

  // 2. Dispatch Mobile Push Notification via ntfy.sh (direct mobile phone lockscreen alert)
  try {
    const pushUrls = [
      `https://ntfy.sh/kl-student-${roll}`,
      `https://ntfy.sh/kl-student-2510030025`,
    ];

    for (const url of pushUrls) {
      fetch(url, {
        method: 'POST',
        headers: {
          'Title': `⏰ KL University: ${targetClass.title}`,
          'Priority': '4',
          'Tags': 'alarm,bell,mortarboard',
          'Click': `http://${process.env.LAN_IP || 'localhost'}:5173`,
        },
        body: `${message}\nVenue: ${targetClass.room} | Time: ${targetSlot.displayTime}`,
      }).catch(() => {});
    }
  } catch (pushErr) {
    console.error('[Scheduler] Mobile push dispatch error:', pushErr.message);
  }

  // 3. Automated period email dispatch paused per user request (only Parent OTP emails use Gmail SMTP)

  return alertEntry;
}

/**
 * Scheduled Heartbeat / Periodic Check (Paused per user request)
 */
async function checkScheduleAndDispatchAlerts() {
  // Paused: Do not mass-send upcoming period emails to all students
  return;
}

// Start continuous autonomous scheduler (paused per user request)
let intervalHandle = null;
function startScheduler() {
  // Paused: Upcoming period alerts disabled for now
  return;
}

module.exports = {
  startScheduler,
  getCurrentScheduleContext,
  dispatchClassAlert,
  getAlertHistory: () => alertHistory,
  PERIOD_SLOTS,
  E4_SCHEDULE,
};
