import { useAuth } from '@/contexts/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardCheck,
  Award,
  MessageSquare,
  Users,
  Bell,
  BarChart3,
  Bot,
  LogOut,
  Video,
  ChevronRight,
  Database,
  CalendarCheck,
  UserCheck,
  ClipboardList,
  Briefcase,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';

export type PageKey =
  | 'dashboard'
  | 'courses'
  | 'timetable'
  | 'students'
  | 'faculty'
  | 'exams'
  | 'attendance'
  | 'resources'
  | 'assignments'
  | 'marks'
  | 'discussions'
  | 'groups'
  | 'liveclasses'
  | 'notifications'
  | 'analytics'
  | 'assistant';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  unreadCount: number;
}

type NavItem = {
  key: PageKey;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export default function Sidebar({
  activePage,
  onNavigate,
  unreadCount,
}: SidebarProps) {
  const { profile, signOut } = useAuth();
  const role = profile?.role?.toLowerCase() || 'student';

  const navItems: NavItem[] = (() => {
    if (role === 'admin') {
      return [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'timetable', label: 'Section Timetables', icon: CalendarDays, badge: 'Y25' },
        { key: 'students', label: 'Students', icon: UserCheck },
        { key: 'faculty', label: 'Faculty', icon: Briefcase },
        { key: 'courses', label: 'Courses', icon: BookOpen },
        { key: 'resources', label: 'Study Resources', icon: FileText },
        { key: 'exams', label: 'Exam Scheduler', icon: ClipboardList },
        { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { key: 'analytics', label: 'System Analytics', icon: BarChart3 },
        { key: 'assistant', label: 'AI Academic Assistant', icon: Bot, badge: 'AI' },
      ];
    }

    if (role === 'faculty') {
      return [
        { key: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
        { key: 'timetable', label: 'Class Timetable', icon: CalendarDays, badge: 'Y25' },
        { key: 'courses', label: 'My Assigned Courses', icon: BookOpen },
        { key: 'students', label: 'My Students', icon: UserCheck },
        { key: 'resources', label: 'Study Resources', icon: FileText },
        { key: 'exams', label: 'Exams & Grading', icon: ClipboardList },
        { key: 'attendance', label: 'Mark Attendance', icon: CalendarCheck },
        { key: 'assignments', label: 'Assignments', icon: ClipboardCheck },
        { key: 'marks', label: 'Marks & Feedback', icon: Award },
        { key: 'liveclasses', label: 'Live Lectures', icon: Video },
        { key: 'discussions', label: 'Subject Forums', icon: MessageSquare },
        { key: 'analytics', label: 'Class Analytics', icon: BarChart3 },
        { key: 'assistant', label: 'AI Academic Assistant', icon: Bot, badge: 'AI' },
      ];
    }

    // Default: Student
    return [
      { key: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
      { key: 'timetable', label: 'My Timetable', icon: CalendarDays, badge: 'Y25' },
      { key: 'courses', label: 'Enrolled Courses', icon: BookOpen },
      { key: 'assignments', label: 'Assignments', icon: ClipboardCheck },
      { key: 'exams', label: 'Examinations', icon: ClipboardList },
      { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { key: 'marks', label: 'Marks & Records', icon: Award },
      { key: 'resources', label: 'Study Resources', icon: FileText },
      { key: 'liveclasses', label: 'Live Lectures', icon: Video },
      { key: 'discussions', label: 'Discussions', icon: MessageSquare },
      { key: 'groups', label: 'Group Workspaces', icon: Users },
      { key: 'assistant', label: 'AI Tutor Assistant', icon: Bot, badge: 'AI' },
    ];
  })();

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleBadgeMap: Record<string, { label: string; bg: string }> = {
    student: { label: 'Student', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    faculty: { label: 'Faculty', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    admin: { label: 'Admin', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  };

  const roleInfo = roleBadgeMap[profile?.role?.toLowerCase() || 'student'] || roleBadgeMap.student;

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* University Branding Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex w-full items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <img src="./klh-logo.png" alt="KL University" className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0">
            <p className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              KL EduConnect
            </p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              KL Deemed to be University
            </p>
          </div>
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="mb-2 px-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Academic Portal
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activePage === item.key;
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  className={`group relative flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-red-700" />
                  )}

                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />

                  <span className="flex-1 truncate text-left">{item.label}</span>

                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-red-700 dark:text-red-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="mb-2 px-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Communication
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className={`group relative flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activePage === 'notifications'
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {activePage === 'notifications' && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-red-700" />
            )}

            <Bell className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            <span className="flex-1 truncate text-left">Notifications</span>

            {unreadCount > 0 && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Database Status Indicator */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <div className="flex items-center gap-1.5 min-w-0">
              <Database className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                digital_learning_db
              </span>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 pl-4">
            PostgreSQL Connected
          </p>
        </div>
      </div>

      {/* User Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold dark:bg-red-700">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {profile?.full_name || 'Academic User'}
            </p>
            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${roleInfo.bg}`}>
              {roleInfo.label}
            </span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}