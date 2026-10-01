import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import AuthPage from '@/pages/AuthPage';

import Sidebar, { type PageKey } from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

import DashboardPage from '@/pages/DashboardPage';
import CoursesPage from '@/pages/CoursesPage';
import ResourcesPage from '@/pages/ResourcesPage';
import AssignmentsPage from '@/pages/AssignmentsPage';
import MarksPage from '@/pages/MarksPage';
import DiscussionsPage from '@/pages/DiscussionsPage';
import GroupsPage from '@/pages/GroupsPage';
import LiveClassesPage from '@/pages/LiveClassesPage';
import NotificationsPage from '@/pages/NotificationsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import AssistantPage from '@/pages/AssistantPage';
import StudentsPage from '@/pages/StudentsPage';
import FacultyPage from '@/pages/FacultyPage';
import AttendancePage from '@/pages/AttendancePage';
import ExamsPage from '@/pages/ExamsPage';

import { Loader2, Bot } from 'lucide-react';

const API_URL = 'http://localhost:5001';

export default function App() {
  const { session, profile, loading } = useAuth();

  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Whenever a new account or session logs in, reset view directly to the dashboard
  useEffect(() => {
    if (profile?.id) {
      setActivePage('dashboard');
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;

    fetchUnread();

    const interval = setInterval(() => {
      fetchUnread();
    }, 25000);

    return () => clearInterval(interval);
  }, [profile]);

  async function fetchUnread() {
    if (!profile) return;

    try {
      const userId = Number(profile.user_id || profile.id);
      const res = await fetch(`${API_URL}/api/notifications/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  }

  function handleNavigate(page: PageKey) {
    setActivePage(page);
    setSidebarOpen(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center text-center p-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-700 text-white shadow-md">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>

          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            KL EduConnect
          </h2>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            KL Deemed to be University • Loading Academic Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <AuthPage />;
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;

      case 'courses':
        return <CoursesPage />;

      case 'students':
        return <StudentsPage />;

      case 'faculty':
        return <FacultyPage />;

      case 'exams':
        return <ExamsPage />;

      case 'attendance':
        return <AttendancePage />;

      case 'resources':
        return <ResourcesPage />;

      case 'assignments':
        return <AssignmentsPage />;

      case 'marks':
        return <MarksPage />;

      case 'discussions':
        return <DiscussionsPage />;

      case 'groups':
        return <GroupsPage />;

      case 'liveclasses':
        return <LiveClassesPage />;

      case 'notifications':
        return <NotificationsPage />;

      case 'analytics':
        return <AnalyticsPage />;

      case 'assistant':
        return <AssistantPage />;

      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          unreadCount={unreadCount}
        />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" />

          <div
            className="absolute bottom-0 left-0 top-0 animate-slide-in"
            onClick={(event) => event.stopPropagation()}
          >
            <Sidebar
              activePage={activePage}
              onNavigate={handleNavigate}
              unreadCount={unreadCount}
            />
          </div>
        </div>
      )}

      {/* Main Application */}
      <div className="lg:ml-64 transition-all duration-200">
        <TopBar
          page={activePage}
          onMenuClick={() => setSidebarOpen(true)}
          onNavigate={handleNavigate}
        />

        <main className="min-h-[calc(100vh-73px)] p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>

      {/* Accessible Floating AI Academic Assistant on Every Page */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => handleNavigate('assistant')}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-red-700 hover:bg-red-800 text-white shadow-xl shadow-red-950/20 border border-red-600 transition-all duration-200 hover:scale-105 active:scale-95 group"
          title="Ask AI Academic Tutor"
          aria-label="Ask AI Academic Tutor"
        >
          <div className="relative">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>
          <span className="text-xs font-bold tracking-wide">
            {activePage === 'assistant' ? 'AI Tutor Open' : 'Ask AI Tutor'}
          </span>
        </button>
      </div>
    </div>
  );
}