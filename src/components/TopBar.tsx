import { useState } from 'react';
import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  Bot,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Server,
  X,
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
  const { profile, jwtToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showJwtModal, setShowJwtModal] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyJwt() {
    if (!jwtToken) return;
    navigator.clipboard.writeText(jwtToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

        {/* JWT & Microservices Inspector Button */}
        <button
          type="button"
          onClick={() => setShowJwtModal(true)}
          className="flex h-9 items-center gap-1.5 px-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 shadow-sm transition hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-semibold"
          title="Inspect active JWT Token & Python Microservices (FastAPI / Flask)"
          aria-label="JWT & Microservices"
        >
          <KeyRound className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">JWT & APIs</span>
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

      {/* JWT & Microservices Modal */}
      {showJwtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Authentication & Microservices Architecture
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live JWT token verification, FastAPI AI endpoints, and Flask report services.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJwtModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Section 1: Active JWT Token */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Active Signed JWT Token (Bearer)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyJwt}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Token'}</span>
                  </button>
                  <a
                    href="https://jwt.io"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-[11px] font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                  >
                    <span>Inspect on jwt.io</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Token String Box */}
              <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] break-all border border-slate-800 max-h-24 overflow-y-auto select-all leading-relaxed">
                {jwtToken || 'No active JWT token found. Sign in to generate.'}
              </div>

              {/* Decoded Claims Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <span className="block text-[10px] text-slate-400">Algorithm</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">HS256 (HMAC)</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <span className="block text-[10px] text-slate-400">Subject / User ID</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{profile?.id || '1'}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <span className="block text-[10px] text-slate-400">Role Claim</span>
                  <span className="font-semibold capitalize text-emerald-600 dark:text-emerald-400 font-mono">{profile?.role || 'student'}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <span className="block text-[10px] text-slate-400">Expiration</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">7 Days</span>
                </div>
              </div>
            </div>

            {/* Section 2: Microservices Overview */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Configured Backend Microservices
              </span>

              <div className="space-y-2.5">
                {/* FastAPI Card */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 mt-0.5">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">FastAPI Microservice</h4>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">Port 8000</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Powers Academic AI reasoning, code execution sandbox, and live Swagger API docs.
                      </p>
                    </div>
                  </div>
                  <a
                    href="http://localhost:8000/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shrink-0 ml-2"
                  >
                    <span>Swagger /docs</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Flask Card */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 mt-0.5">
                      <Server className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Flask Microservice</h4>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">Port 5002</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Powers student grade transcripts and UGC 75% attendance audit calculations.
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 shrink-0 ml-2">
                    POST /api/reports/*
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowJwtModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}