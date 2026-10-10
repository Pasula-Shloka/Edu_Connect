/**
 * KL University - Hyderabad (Aziz Nagar Campus)
 * Department of Computer Science & Engineering
 * AY 2025-2026 Odd Semester • II Yr Time Table (Y25 Batch)
 */

export interface PeriodSlot {
  slotIndex: number;
  periodName: string;
  startTime: string; // e.g. "08:15"
  endTime: string;   // e.g. "09:05"
  displayTime: string;
  isBreak?: boolean;
}

export const PERIOD_SLOTS: PeriodSlot[] = [
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

export interface TimetableClass {
  code: string;
  title: string;
  type: 'Lecture' | 'Practical' | 'Skill' | 'Break' | 'Library' | 'Coding';
  faculty: string;
  room?: string;
}

export interface SectionTimetable {
  section: string;
  facultyMapping: Record<string, string>;
  days: Record<string, (string | null)[]>; // Day (MON..SAT) -> array of 10 slots
}

export const TIMETABLE_SECTIONS: Record<string, SectionTimetable> = {
  E1: {
    section: 'E1',
    facultyMapping: {
      ML: 'Dr. Sai Sudha Gadde',
      DSA: 'Mr. V. Punna Rao',
      OSSP: 'Mr. K.L. Narasimha Rao',
      ES: 'Dr. K.V. Prasanth',
      DBMS: 'Dr. Md. Rafeeq',
      FL: 'Mrs. Sandhya Deshmukh',
      CODING: 'Dept. Technical Trainers',
      LIBRARY: 'Central Library Staff',
    },
    days: {
      MON: ['FL', 'FL', 'BREAK', 'DBMS(L)', 'DBMS(L)', 'LUNCH', 'OSSP(L)', 'OSSP(L)', 'ES(L)', 'ES(L)'],
      TUE: ['ML(L)', 'ML(L)', 'BREAK', 'OSSP(P)', 'OSSP(P)', 'LUNCH', 'DSA(L)', 'DSA(L)', 'ML(P)', 'ML(P)'],
      WED: ['ES(S)', 'ES(S)', 'BREAK', 'DSA(P)', 'DSA(P)', 'LUNCH', 'ML(S)', 'ML(S)', 'DBMS(P)', 'DBMS(P)'],
      THR: ['DBMS(S)', 'DBMS(S)', 'BREAK', 'ES(S)', 'ES(S)', 'LUNCH', 'OSSP(S)', 'OSSP(S)', 'DSA(S)', 'DSA(S)'],
      FRI: ['OSSP(S)', 'OSSP(S)', 'BREAK', 'DSA(S)', 'DSA(S)', 'LUNCH', 'ML(S)', 'ML(S)', 'ES(S)', 'ES(S)'],
      SAT: ['ES(S)', 'ES(S)', 'BREAK', 'CODING', 'CODING', 'LUNCH', 'DBMS(S)', 'DBMS(S)', 'LIBRARY', 'LIBRARY'],
    },
  },
  E2: {
    section: 'E2',
    facultyMapping: {
      ML: 'Dr. Subhranginee Das',
      DSA: 'Dr. M Saidi Reddy',
      OSSP: 'Dr. P. Pavan Kumar',
      ES: 'Dr. Jitendra Sharma & Dr. K.V. Prashanth',
      DBMS: 'Dr. P. Lalitha Kumari',
      FL: 'Mrs. Sandhya Deshmukh',
      CODING: 'Dept. Technical Trainers',
      LIBRARY: 'Central Library Staff',
    },
    days: {
      MON: ['ES(L)', 'ES(L)', 'BREAK', 'DSA(L)', 'DSA(L)', 'LUNCH', 'ML(L)', 'ML(L)', 'DBMS(L)', 'DBMS(L)'],
      TUE: ['ML(P)', 'ML(P)', 'BREAK', 'OSSP(L)', 'OSSP(L)', 'LUNCH', 'ES(S)', 'ES(S)', 'CODING', 'CODING'],
      WED: ['ES(S)', 'ES(S)', 'BREAK', 'DSA(P)', 'DSA(P)', 'LUNCH', 'ML(S)', 'ML(S)', 'OSSP(P)', 'OSSP(P)'],
      THR: ['OSSP(S)', 'OSSP(S)', 'BREAK', 'DBMS(P)', 'DBMS(P)', 'LUNCH', 'DSA(S)', 'DSA(S)', 'ES(S)', 'ES(S)'],
      FRI: ['DBMS(S)', 'DBMS(S)', 'BREAK', 'DSA(S)', 'DSA(S)', 'LUNCH', 'ES(S)', 'ES(S)', 'LIBRARY', 'LIBRARY'],
      SAT: ['FL', 'FL', 'BREAK', 'OSSP(S)', 'OSSP(S)', 'LUNCH', 'ML(S)', 'ML(S)', 'DBMS(S)', 'DBMS(S)'],
    },
  },
  E3: {
    section: 'E3',
    facultyMapping: {
      ML: 'Dr. Sai Sudha Gadde',
      DSA: 'Mr. V. Punna Rao',
      OSSP: 'Dr. A. Seenu',
      ES: 'Dr. Janardhan',
      DBMS: 'Dr. Md. Rafeeq',
      FL: 'Mrs. Sandhya Deshmukh',
      CODING: 'Dept. Technical Trainers',
      LIBRARY: 'Central Library Staff',
    },
    days: {
      MON: ['DBMS(L)', 'DBMS(L)', 'BREAK', 'DSA(L)', 'DSA(L)', 'LUNCH', 'ML(L)', 'ML(L)', 'OSSP(L)', 'OSSP(L)'],
      TUE: ['ES(L)', 'ES(L)', 'BREAK', 'DSA(P)', 'DSA(P)', 'LUNCH', 'DBMS(P)', 'DBMS(P)', 'CODING', 'CODING'],
      WED: ['ES(S)', 'ES(S)', 'BREAK', 'OSSP(P)', 'OSSP(P)', 'LUNCH', 'DSA(S)', 'DSA(S)', 'ML(P)', 'ML(P)'],
      THR: ['ML(S)', 'ML(S)', 'BREAK', 'ES(S)', 'ES(S)', 'LUNCH', 'DBMS(S)', 'DBMS(S)', 'OSSP(S)', 'OSSP(S)'],
      FRI: ['FL', 'FL', 'BREAK', 'ML(S)', 'ML(S)', 'LUNCH', 'DSA(S)', 'DSA(S)', 'ES(S)', 'ES(S)'],
      SAT: ['DBMS(S)', 'DBMS(S)', 'BREAK', 'ES(S)', 'ES(S)', 'LUNCH', 'OSSP(S)', 'OSSP(S)', 'LIBRARY', 'LIBRARY'],
    },
  },
  E4: {
    section: 'E4',
    facultyMapping: {
      ML: 'Dr. Subhranginee Das',
      DSA: 'Dr. M Saidi Reddy',
      OSSP: 'Dr. P. Pavan Kumar',
      ES: 'Dr. Chandrasekhar',
      DBMS: 'Dr. P. Lalitha Kumari',
      FL: 'Mrs. Sandhya Deshmukh',
      CODING: 'Dept. Technical Trainers',
      LIBRARY: 'Central Library Staff',
    },
    days: {
      MON: ['DBMS(L)', 'DBMS(L)', 'BREAK', 'ML(L)', 'ML(L)', 'LUNCH', 'FL', 'FL', 'ES(L)', 'ES(L)'],
      TUE: ['ES(S)', 'ES(S)', 'BREAK', 'DBMS(P)', 'DBMS(P)', 'LUNCH', 'ML(P)', 'ML(P)', 'DSA(L)', 'DSA(L)'],
      WED: ['ML(S)', 'ML(S)', 'BREAK', 'OSSP(L)', 'OSSP(L)', 'LUNCH', 'DSA(P)', 'DSA(P)', 'CODING', 'CODING'],
      THR: ['ES(S)', 'ES(S)', 'BREAK', 'DSA(S)', 'DSA(S)', 'LUNCH', 'DBMS(S)', 'DBMS(S)', 'LIBRARY', 'LIBRARY'],
      FRI: ['ES(S)', 'ES(S)', 'BREAK', 'OSSP(S)', 'OSSP(S)', 'LUNCH', 'DBMS(S)', 'DBMS(S)', 'OSSP', 'OSSP'],
      SAT: ['DSA(S)', 'DSA(S)', 'BREAK', 'ML(S)', 'ML(S)', 'LUNCH', 'OSSP(S)', 'OSSP(S)', 'ES(S)', 'ES(S)'],
    },
  },
  E5: {
    section: 'E5',
    facultyMapping: {
      ML: 'Dr. Mousmi Ajay Chaurasia',
      DSA: 'Mr. Aftab Yaseen',
      OSSP: 'Mr. K.L. Narasimha Rao',
      ES: 'Dr. Janardhan Reddy',
      DBMS: 'Dr. Sasidhar Kothuru',
      FL: 'Mrs. Sandhya Deshmukh',
      CODING: 'Dept. Technical Trainers',
      LIBRARY: 'Central Library Staff',
    },
    days: {
      MON: ['DSA(L)', 'DSA(L)', 'BREAK', 'OSSP(L)', 'OSSP(L)', 'LUNCH', 'ML(L)', 'ML(L)', 'DBMS(L)', 'DBMS(L)'],
      TUE: ['DSA(P)', 'DSA(P)', 'BREAK', 'OSSP(P)', 'OSSP(P)', 'LUNCH', 'ML(P)', 'ML(P)', 'ES(L)', 'ES(L)'],
      WED: ['DSA(S)', 'DSA(S)', 'BREAK', 'ES(S)', 'ES(S)', 'LUNCH', 'OSSP(S)', 'OSSP(S)', 'CODING', 'CODING'],
      THR: ['ES(S)', 'ES(S)', 'BREAK', 'OSSP(S)', 'OSSP(S)', 'LUNCH', 'DSA(S)', 'DSA(S)', 'DBMS(P)', 'DBMS(P)'],
      FRI: ['DBMS(S)', 'DBMS(S)', 'BREAK', 'ML(S)', 'ML(S)', 'LUNCH', 'LIBRARY', 'LIBRARY', 'ES(S)', 'ES(S)'],
      SAT: ['ES(S)', 'ES(S)', 'BREAK', 'DBMS(S)', 'DBMS(S)', 'LUNCH', 'ML(S)', 'ML(S)', 'FL', 'FL'],
    },
  },
  E6: {
    section: 'E6',
    facultyMapping: {
      ML: 'Dr. Sushama Rani Dutta',
      DSA: 'Dr. Anitha Patil',
      OSSP: 'Dr. Malladi Srinivas',
      ES: 'Dr. Madhu Organti',
      DBMS: 'Dr. Edamadaka Gayathri',
      FL: 'Mrs. Sandhya Deshmukh',
      CODING: 'Dept. Technical Trainers',
      LIBRARY: 'Central Library Staff',
    },
    days: {
      MON: ['DBMS(L)', 'DBMS(L)', 'BREAK', 'OSSP(L)', 'OSSP(L)', 'LUNCH', 'ML(L)', 'ML(L)', 'DSA(L)', 'DSA(L)'],
      TUE: ['DSA(P)', 'DSA(P)', 'BREAK', 'DBMS(P)', 'DBMS(P)', 'LUNCH', 'OSSP(P)', 'OSSP(P)', 'ES(L)', 'ES(L)'],
      WED: ['DSA(S)', 'DSA(S)', 'BREAK', 'ML(P)', 'ML(P)', 'LUNCH', 'OSSP(S)', 'OSSP(S)', 'ES(S)', 'ES(S)'],
      THR: ['DBMS(S)', 'DBMS(S)', 'BREAK', 'FL', 'FL', 'LUNCH', 'ES(S)', 'ES(S)', 'ML(S)', 'ML(S)'],
      FRI: ['DBMS(S)', 'DBMS(S)', 'BREAK', 'CODING', 'CODING', 'LUNCH', 'DSA(S)', 'DSA(S)', 'ES(S)', 'ES(S)'],
      SAT: ['ML(S)', 'ML(S)', 'BREAK', 'OSSP(S)', 'OSSP(S)', 'LUNCH', 'ES(S)', 'ES(S)', 'LIBRARY', 'LIBRARY'],
    },
  },
  E7: {
    section: 'E7',
    facultyMapping: {
      ML: 'Dr. Mousmi / Dr. Sushama Rani Dutta',
      DSA: 'Mr. Aftab Yaseen',
      OSSP: 'Dr. P. Kalpana',
      ES: 'Dr. Jitendra Sharma',
      DBMS: 'Dr. Sasidhar Kothuru',
      FL: 'Mrs. Sandhya Deshmukh',
      CODING: 'Dept. Technical Trainers',
      LIBRARY: 'Central Library Staff',
    },
    days: {
      MON: ['DBMS(L)', 'DBMS(L)', 'BREAK', 'OSSP(L)', 'OSSP(L)', 'LUNCH', 'DSA(L)', 'DSA(L)', 'ES(L)', 'ES(L)'],
      TUE: ['ES(S)', 'ES(S)', 'BREAK', 'ML(Skill)', 'ML(Skill)', 'LUNCH', 'DBMS(P)', 'DBMS(P)', 'DSA(L)', 'DSA(L)'],
      WED: ['DBMS(S)', 'DBMS(S)', 'BREAK', 'OSSP(S)', 'OSSP(S)', 'LUNCH', 'ML(P)', 'ML(P)', 'ES(S)', 'ES(S)'],
      THR: ['DSA(S)', 'DSA(S)', 'BREAK', 'CODING', 'CODING', 'LUNCH', 'OSSP', 'OSSP', 'LIBRARY', 'LIBRARY'],
      FRI: ['ES(S)', 'ES(S)', 'BREAK', 'ML(Skill)', 'ML(Skill)', 'LUNCH', 'DBMS(S)', 'DBMS(S)', 'FL', 'FL'],
      SAT: ['ML(L)', 'ML(L)', 'BREAK', 'DSA(S)', 'DSA(S)', 'LUNCH', 'OSSP(S)', 'OSSP(S)', 'ES(S)', 'ES(S)'],
    },
  },
};

// Aliases for A1..A7 -> E1..E7 mapping
export function normalizeSection(sec?: string): string {
  if (!sec) return 'E4';
  const clean = sec.toUpperCase().replace('SECTION', '').replace('SEC', '').trim();
  if (clean.startsWith('E')) return clean;
  if (clean.startsWith('A')) return 'E' + clean.slice(1);
  return 'E' + clean;
}

export function parseSubjectDetails(rawCode: string, sectionFaculty: Record<string, string>): TimetableClass {
  if (!rawCode || rawCode === 'BREAK' || rawCode === 'LUNCH') {
    return {
      code: rawCode || 'FREE',
      title: rawCode === 'LUNCH' ? 'Lunch Break' : rawCode === 'BREAK' ? 'Tea Break' : 'Free Hour / Self Study',
      type: 'Break',
      faculty: 'N/A',
    };
  }

  let type: TimetableClass['type'] = 'Lecture';
  if (rawCode.includes('(P)')) type = 'Practical';
  else if (rawCode.includes('(S)') || rawCode.includes('(Skill)')) type = 'Skill';
  else if (rawCode === 'CODING') type = 'Coding';
  else if (rawCode === 'LIBRARY') type = 'Library';

  const baseSubject = rawCode.replace(/\(.\)/g, '').replace(/\(Skill\)/g, '').trim();

  const titleMap: Record<string, string> = {
    DBMS: 'Database Management Systems',
    DSA: 'Data Structures and Algorithms',
    OSSP: 'Open Source Software Practices',
    ML: 'Machine Learning',
    ES: 'Embedded Systems & IoT',
    FL: 'Foreign Language: Japanese',
    CODING: 'Algorithmic Coding & Problem Solving',
    LIBRARY: 'Central Library Knowledge Hours',
  };

  const faculty = sectionFaculty[baseSubject] || 'Department Faculty';
  const room = type === 'Practical' || type === 'Coding' ? 'Lab C-204 (CSE Computing Center)' : 'Block B - Room 304';

  return {
    code: rawCode,
    title: titleMap[baseSubject] || baseSubject,
    type,
    faculty,
    room,
  };
}

export function getCurrentAndNextClass(sectionInput?: string) {
  const sec = normalizeSection(sectionInput);
  const data = TIMETABLE_SECTIONS[sec] || TIMETABLE_SECTIONS.E4;

  const now = new Date();
  const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'];
  const currentDay = dayNames[dayIndex] || 'MON';

  // If Sunday, default to Monday
  const dayKey = currentDay === 'SUN' ? 'MON' : currentDay;
  const daySlots = data.days[dayKey] || data.days.MON;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let activeSlotIndex = -1;
  let nextSlotIndex = -1;

  for (let i = 0; i < PERIOD_SLOTS.length; i++) {
    const slot = PERIOD_SLOTS[i];
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (nowMinutes >= startTotal && nowMinutes < endTotal) {
      activeSlotIndex = i;
      nextSlotIndex = i + 1 < PERIOD_SLOTS.length ? i + 1 : -1;
      break;
    } else if (nowMinutes < startTotal) {
      nextSlotIndex = i;
      break;
    }
  }

  // Fallback for off-hours
  if (activeSlotIndex === -1 && nextSlotIndex === -1) {
    nextSlotIndex = 0; // next morning
  }

  const activeRaw = activeSlotIndex >= 0 ? daySlots[activeSlotIndex] : null;
  const nextRaw = nextSlotIndex >= 0 ? daySlots[nextSlotIndex] : null;

  return {
    section: sec,
    day: dayKey,
    currentSlot: activeSlotIndex >= 0 ? PERIOD_SLOTS[activeSlotIndex] : null,
    currentClass: activeRaw ? parseSubjectDetails(activeRaw, data.facultyMapping) : null,
    nextSlot: nextSlotIndex >= 0 ? PERIOD_SLOTS[nextSlotIndex] : null,
    nextClass: nextRaw ? parseSubjectDetails(nextRaw, data.facultyMapping) : null,
  };
}

export interface FacultyDirectoryEntry {
  id: string;
  name: string;
  displayTitle: string;
  department: string;
  subject: string;
  aliases: string[];
}

export const FACULTY_DIRECTORY: FacultyDirectoryEntry[] = [
  {
    id: 'subhranginee-das',
    name: 'Dr. Subhranginee Das',
    displayTitle: 'Dr. Subhranginee Das • Machine Learning (ML - E2/E4)',
    department: 'Computer Science & Engineering',
    subject: 'ML',
    aliases: ['subhranginee', 'das', 'dr. subhranginee das'],
  },
  {
    id: 'saidi-reddy',
    name: 'Dr. M Saidi Reddy',
    displayTitle: 'Dr. M Saidi Reddy • Data Structures & Algorithms (DSA - E2/E4)',
    department: 'Computer Science & Engineering',
    subject: 'DSA',
    aliases: ['saidi', 'reddy', 'm saidi reddy', 'priya', 'priya sharma', 'dr. priya sharma'],
  },
  {
    id: 'pavan-kumar',
    name: 'Dr. P. Pavan Kumar',
    displayTitle: 'Dr. P. Pavan Kumar • Operating Systems & Linux (OSSP - E2/E4)',
    department: 'Computer Science & Engineering',
    subject: 'OSSP',
    aliases: ['pavan', 'pavan kumar', 'dr. p. pavan kumar', 'rajesh', 'verma', 'dr. rajesh verma'],
  },
  {
    id: 'lalitha-kumari',
    name: 'Dr. P. Lalitha Kumari',
    displayTitle: 'Dr. P. Lalitha Kumari • Database Management Systems (DBMS - E2/E4)',
    department: 'Computer Science & Engineering',
    subject: 'DBMS',
    aliases: ['lalitha', 'lalitha kumari', 'dr.lalitha', 'dr. p. lalitha kumari'],
  },
  {
    id: 'chandrasekhar',
    name: 'Dr. Chandrasekhar',
    displayTitle: 'Dr. Chandrasekhar • Embedded Systems & IoT (ES - E4)',
    department: 'Computer Science & Engineering',
    subject: 'ES',
    aliases: ['chandrasekhar', 'satyanarayana', 'm. satyanarayana', 'dr. m. satyanarayana'],
  },
  {
    id: 'sandhya-deshmukh',
    name: 'Mrs. Sandhya Deshmukh',
    displayTitle: 'Mrs. Sandhya Deshmukh • Foreign Language: Japanese (FL - All Sections)',
    department: 'Department of Foreign Languages',
    subject: 'FL',
    aliases: ['sandhya', 'deshmukh', 'kenji', 'tanaka', 'sensei kenji tanaka'],
  },
  {
    id: 'sai-sudha',
    name: 'Dr. Sai Sudha Gadde',
    displayTitle: 'Dr. Sai Sudha Gadde • Machine Learning (ML - E1/E3)',
    department: 'Computer Science & Engineering',
    subject: 'ML',
    aliases: ['sai sudha', 'gadde', 'dr. sai sudha gadde'],
  },
  {
    id: 'punna-rao',
    name: 'Mr. V. Punna Rao',
    displayTitle: 'Mr. V. Punna Rao • Data Structures & Algorithms (DSA - E1/E3)',
    department: 'Computer Science & Engineering',
    subject: 'DSA',
    aliases: ['punna', 'punna rao', 'mr. v. punna rao'],
  },
  {
    id: 'narasimha-rao',
    name: 'Mr. K.L. Narasimha Rao',
    displayTitle: 'Mr. K.L. Narasimha Rao • OSSP (OSSP - E1/E5)',
    department: 'Computer Science & Engineering',
    subject: 'OSSP',
    aliases: ['narasimha', 'narasimha rao'],
  },
  {
    id: 'rafeeq',
    name: 'Dr. Md. Rafeeq',
    displayTitle: 'Dr. Md. Rafeeq • Database Systems (DBMS - E1/E3)',
    department: 'Computer Science & Engineering',
    subject: 'DBMS',
    aliases: ['rafeeq', 'md. rafeeq', 'srinivas rao', 'k. srinivas rao', 'fac10342'],
  },
  {
    id: 'jitendra-sharma',
    name: 'Dr. Jitendra Sharma',
    displayTitle: 'Dr. Jitendra Sharma • Embedded Systems & IoT (ES - E2/E7)',
    department: 'Computer Science & Engineering',
    subject: 'ES',
    aliases: ['jitendra', 'jitendra sharma'],
  },
  {
    id: 'aftab-yaseen',
    name: 'Mr. Aftab Yaseen',
    displayTitle: 'Mr. Aftab Yaseen • Data Structures & Algorithms (DSA - E5/E7)',
    department: 'Computer Science & Engineering',
    subject: 'DSA',
    aliases: ['aftab', 'yaseen', 'mr. aftab yaseen'],
  },
  {
    id: 'mousmi-chaurasia',
    name: 'Dr. Mousmi Ajay Chaurasia',
    displayTitle: 'Dr. Mousmi Ajay Chaurasia • Machine Learning (ML - E5/E7)',
    department: 'Computer Science & Engineering',
    subject: 'ML',
    aliases: ['mousmi', 'chaurasia'],
  },
  {
    id: 'sushama-rani',
    name: 'Dr. Sushama Rani Dutta',
    displayTitle: 'Dr. Sushama Rani Dutta • Machine Learning (ML - E6/E7)',
    department: 'Computer Science & Engineering',
    subject: 'ML',
    aliases: ['sushama', 'dutta'],
  },
  {
    id: 'anitha-patil',
    name: 'Dr. Anitha Patil',
    displayTitle: 'Dr. Anitha Patil • Data Structures & Algorithms (DSA - E6)',
    department: 'Computer Science & Engineering',
    subject: 'DSA',
    aliases: ['anitha', 'patil'],
  },
  {
    id: 'gayathri',
    name: 'Dr. Edamadaka Gayathri',
    displayTitle: 'Dr. Edamadaka Gayathri • Database Systems (DBMS - E6)',
    department: 'Computer Science & Engineering',
    subject: 'DBMS',
    aliases: ['gayathri', 'edamadaka'],
  },
];

export interface FacultyScheduleSlot {
  blockIndex: number;
  periodName: string;
  timeRange: string;
  isBreak?: boolean;
  class: TimetableClass | null;
  section?: string | null;
}

export interface FacultyWeeklySchedule {
  facultyName: string;
  department: string;
  subjectTitle: string;
  totalWeeklyClasses: number;
  totalWeeklyHours: number;
  assignedSections: string[];
  days: Record<string, FacultyScheduleSlot[]>;
}

export function findFacultyFromProfile(profile: any): FacultyDirectoryEntry {
  if (!profile) return FACULTY_DIRECTORY[0];
  const query = `${profile.full_name || ''} ${profile.email || ''}`.toLowerCase().trim();

  for (const entry of FACULTY_DIRECTORY) {
    if (query.includes(entry.name.toLowerCase()) || entry.name.toLowerCase().includes(query)) {
      return entry;
    }
    for (const alias of entry.aliases) {
      if (query.includes(alias.toLowerCase())) {
        return entry;
      }
    }
  }

  return FACULTY_DIRECTORY[0];
}

const FACULTY_PERIOD_BLOCKS = [
  { blockIndex: 0, periodName: 'Periods 1 & 2', timeRange: '8:15 AM – 9:55 AM' },
  { blockIndex: 3, periodName: 'Periods 3 & 4', timeRange: '10:10 AM – 11:50 AM' },
  { blockIndex: 6, periodName: 'Periods 5 & 6', timeRange: '12:45 PM – 2:20 PM' },
  { blockIndex: 8, periodName: 'Periods 7 & 8', timeRange: '2:20 PM – 4:00 PM' },
];

export function getFacultyWeeklySchedule(facultyIdentifier: string): FacultyWeeklySchedule {
  let targetEntry = FACULTY_DIRECTORY.find(
    (f) => f.id === facultyIdentifier || f.name.toLowerCase() === facultyIdentifier.toLowerCase()
  );

  if (!targetEntry) {
    targetEntry = findFacultyFromProfile({ full_name: facultyIdentifier });
  }

  const daysList = ['MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'];
  const daysResult: Record<string, FacultyScheduleSlot[]> = {};
  const sectionsSet = new Set<string>();
  let totalClasses = 0;

  for (const d of daysList) {
    daysResult[d] = [];

    for (const pb of FACULTY_PERIOD_BLOCKS) {
      let matchedClass: TimetableClass | null = null;
      let matchedSection: string | null = null;

      // Scan all 7 sections (E1..E7) for this block
      for (const [sec, sData] of Object.entries(TIMETABLE_SECTIONS)) {
        const raw = sData.days[d]?.[pb.blockIndex];
        if (!raw || raw === 'BREAK' || raw === 'LUNCH') continue;

        const details = parseSubjectDetails(raw, sData.facultyMapping);
        const profName = (details.faculty || '').toLowerCase();
        const targetName = targetEntry.name.toLowerCase();

        const isNameMatch =
          profName.includes(targetName) ||
          targetName.includes(profName) ||
          targetEntry.aliases.some((a) => profName.includes(a.toLowerCase()));

        if (isNameMatch) {
          matchedClass = details;
          matchedSection = sec;
          sectionsSet.add(sec);
          totalClasses++;
          break; // Teacher can only be in one section per block
        }
      }

      daysResult[d].push({
        blockIndex: pb.blockIndex,
        periodName: pb.periodName,
        timeRange: pb.timeRange,
        class: matchedClass,
        section: matchedSection,
      });
    }
  }

  const assignedSections = Array.from(sectionsSet);

  return {
    facultyName: targetEntry.name,
    department: targetEntry.department,
    subjectTitle: targetEntry.subject,
    totalWeeklyClasses: totalClasses,
    totalWeeklyHours: totalClasses * 2,
    assignedSections: assignedSections.length > 0 ? assignedSections : ['E2', 'E4'],
    days: daysResult,
  };
}

export function getFacultyLiveClass(facultyIdentifier: string) {
  const schedule = getFacultyWeeklySchedule(facultyIdentifier);

  const now = new Date();
  const dayIndex = now.getDay();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'];
  const currentDay = dayNames[dayIndex] || 'MON';
  const dayKey = currentDay === 'SUN' ? 'MON' : currentDay;

  const todaySlots = schedule.days[dayKey] || schedule.days.MON;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Block time spans
  const blockSpans = [
    { start: 8 * 60 + 15, end: 9 * 60 + 55, displayTime: '8:15 AM - 9:55 AM' },
    { start: 10 * 60 + 10, end: 11 * 60 + 50, displayTime: '10:10 AM - 11:50 AM' },
    { start: 12 * 60 + 45, end: 14 * 60 + 20, displayTime: '12:45 PM - 2:20 PM' },
    { start: 14 * 60 + 20, end: 16 * 60, displayTime: '2:20 PM - 4:00 PM' },
  ];

  let currentBlockIndex = -1;
  let nextBlockIndex = -1;

  for (let i = 0; i < blockSpans.length; i++) {
    const span = blockSpans[i];
    if (nowMinutes >= span.start && nowMinutes < span.end) {
      currentBlockIndex = i;
      nextBlockIndex = i + 1 < blockSpans.length ? i + 1 : -1;
      break;
    } else if (nowMinutes < span.start) {
      nextBlockIndex = i;
      break;
    }
  }

  const activeSlot = currentBlockIndex >= 0 ? todaySlots[currentBlockIndex] : null;
  const nextSlotCandidate = nextBlockIndex >= 0 ? todaySlots[nextBlockIndex] : null;

  return {
    day: dayKey,
    currentSlot: activeSlot?.class ? activeSlot : null,
    currentClass: activeSlot?.class || null,
    currentSection: activeSlot?.section || null,
    nextSlot: nextSlotCandidate?.class ? nextSlotCandidate : null,
    nextClass: nextSlotCandidate?.class || null,
    nextSection: nextSlotCandidate?.section || null,
    assignedSections: schedule.assignedSections,
    facultyName: schedule.facultyName,
  };
}
