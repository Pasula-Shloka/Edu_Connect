import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  ClipboardCheck,
  Award,
  MessageSquare,
  BookOpen,
  Users,
  Megaphone,
  Check,
} from 'lucide-react';

type Notification = {
  notification_id: number;
  user_id: number;
  type?: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const API_URL = 'http://localhost:5001';

const notifIcons: Record<string, typeof Bell> = {
  general: Bell,
  assignment: ClipboardCheck,
  grade: Award,
  discussion: MessageSquare,
  enrollment: BookOpen,
  group: Users,
  announcement: Megaphone,
};

export default function NotificationsPage() {
  const { profile } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [profile]);

  async function fetchNotifications() {
    if (!profile) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userId = profile.user_id || Number(profile.id);
      const response = await fetch(`${API_URL}/api/notifications/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Notifications fetch error:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );

      const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Mark notification read error:', error);
      fetchNotifications();
    }
  }

  async function markAllRead() {
    if (!profile) return;

    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      const userId = profile.user_id || Number(profile.id);
      const response = await fetch(
        `${API_URL}/api/notifications/user/${userId}/read-all`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      fetchNotifications();
    }
  }

  async function deleteNotif(id: number) {
    try {
      // Optimistic delete
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));

      const response = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      fetchNotifications();
    }
  }

  const filtered =
    filter === 'all' ? notifications : notifications.filter((n) => !n.is_read);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Notices ({notifications.length})
          </button>

          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === 'unread'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark all as done</span>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Bell className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            {filter === 'unread'
              ? 'No unread notifications'
              : 'No notifications logged'}
          </h3>
          <p className="text-slate-400 text-xs">
            You are all caught up with university announcements.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const Icon = notifIcons[n.type || 'general'] || Bell;

            return (
              <div
                key={n.notification_id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  !n.is_read
                    ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !n.is_read
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {!n.is_read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 mt-1" />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[11px] text-slate-400">
                      {n.created_at
                        ? new Date(n.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recent notice'}
                    </span>

                    <div className="flex items-center gap-2">
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.notification_id)}
                          className="text-xs text-red-700 dark:text-red-400 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark done</span>
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotif(n.notification_id)}
                        className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}