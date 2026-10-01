import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

type TopBarProps = {
  page: string;
  onMenuClick?: () => void;
  onNavigate?: (page: any) => void;
};

const pageTitles: Record<
  string,
  {
    title: string;
    subtitle: string;
  }
> = {
  dashboard: {
    title: 'Academic Dashboard',
    subtitle: 'Overview of courses, deliverables and progress',
  },
  students: {
    title: 'Student Directory & Management',
    subtitle: 'Academic records, enrollment rosters and student telemetry',
  },
  faculty: {
    title: 'Faculty Staff & Workload',
    subtitle: 'Department faculty members, course allocations and profiles',
  },
  exams: {
    title: 'Examination Management & Testing',
    subtitle: 'Conflict-aware scheduler, student testing engine & evaluations',
  },
  attendance: {
    title: 'Attendance Register & Eligibility',
    subtitle: 'Daily student attendance records and UGC 75% eligibility monitor',
  },
  courses: {
    title: 'Course Management',
    subtitle: 'Curriculum modules, syllabus and course enrollments',
  },
  mycourses: {
    title: 'My Courses',
    subtitle: 'Enrolled academic subjects and learning tracks',
  },
  'my-courses': {
    title: 'My Courses',
    subtitle: 'Enrolled academic subjects and learning tracks',
  },
  assignments: {
    title: 'Assignments & Submissions',
    subtitle: 'Course assignments, deadlines and grading feedback',
  },
  marks: {
    title: 'Marks & Academic Records',
    subtitle: 'Evaluations, marks breakdown and faculty comments',
  },
  discussions: {
    title: 'Discussion Forums',
    subtitle: 'Subject forums, peer queries and academic discussions',
  },
  groups: {
    title: 'Group Workspaces',
    subtitle: 'Project teams, shared files and collaboration boards',
  },
  resources: {
    title: 'Study Resources & Library',
    subtitle: 'Lecture slides, reference material and question papers',
  },
  'live-classes': {
    title: 'Live Lectures & Sessions',
    subtitle: 'Online classroom sessions and interactive meetings',
  },
  liveclasses: {
    title: 'Live Lectures & Sessions',
    subtitle: 'Online classroom sessions and interactive meetings',
  },
  notifications: {
    title: 'Campus Notifications',
    subtitle: 'Official announcements, assignment reminders and notices',
  },
  analytics: {
    title: 'Academic Analytics',
    subtitle: 'Course performance, attendance telemetry and score tracking',
  },
  assistant: {
    title: 'AI Academic Assistant',
    subtitle: 'Interactive concept clarification and academic query solver',
  },
};

export default function TopBar({
  page,
  onMenuClick,
  onNavigate,
}: TopBarProps) {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const pageInfo =
    pageTitles[page] || {
      title: 'Academic Portal',
      subtitle: 'KL Deemed to be University',
    };

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleBadgeMap: Record<string, { label: string; bg: string }> = {
    student: { label: 'Student', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
    faculty: { label: 'Faculty', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
    admin: { label: 'Administrator', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
  };

  const roleInfo = roleBadgeMap[profile?.role?.toLowerCase() || 'student'] || roleBadgeMap.student;

  return (
    <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-colors duration-200">
      {/* Left: Mobile trigger & Page Identity */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {pageInfo.title}
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              AY 2026–27
            </span>
          </div>

          <p className="mt-0.5 hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Search, Theme Switcher, Notifications, Profile Capsule */}
      <div className="ml-3 flex items-center gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses, assignments..."
            className="h-9 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-8 text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-600/10 lg:w-60"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1 text-[9px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* Theme Switcher Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>

        {/* AI Assistant Quick Button */}
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('assistant')}
          className="flex h-9 items-center gap-1.5 px-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 shadow-sm transition hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-semibold"
          title="Open AI Academic Assistant"
          aria-label="AI Academic Assistant"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden md:inline">AI Tutor</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700"
          title="Campus Notifications"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600" />
        </button>

        {/* User Capsule */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-1.5 pr-3 shadow-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-700 text-[11px] font-bold text-white">
            {initials}
          </div>

          <div className="hidden min-w-0 sm:block text-left">
            <p className="max-w-[120px] truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
              {profile?.full_name || 'Academic User'}
            </p>
            <span className={`inline-block px-1.5 py-0.1 rounded text-[9px] font-medium border ${roleInfo.bg}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}