import React, { useState, useEffect } from 'react';
import {
  Bell,
  Smartphone,
  Volume2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Radio,
  Loader2,
  Vibrate,
} from 'lucide-react';
import {
  requestMobileNotificationPermission,
  triggerImmediateMobileAlertTest,
  AutoAlertPayload,
} from '@/services/scheduleNotifier';
import { getCurrentAndNextClass, normalizeSection } from '@/lib/timetableData';

interface AutoClassAlertManagerProps {
  user: any;
  compact?: boolean;
}

export default function AutoClassAlertManager({ user, compact = false }: AutoClassAlertManagerProps) {
  const [permission, setPermission] = useState<string>('default');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AutoAlertPayload | null>(null);

  const section = normalizeSection(user?.section || 'E4');
  const scheduleInfo = getCurrentAndNextClass(section);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function handleEnablePush() {
    const res = await requestMobileNotificationPermission();
    setPermission(res);
  }

  async function handleTestAlert() {
    try {
      setTesting(true);
      const res = await triggerImmediateMobileAlertTest(user);
      setTestResult(res);
      setTimeout(() => setTestResult(null), 8000);
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  }

  const rollNumber = user?.roll_number || '2510030025';
  const pushUrl = `https://ntfy.sh/kl-student-${rollNumber}`;

  if (compact) {
    return (
      <div className="p-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-xs">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Auto Mobile Schedule Alerts Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Auto-dispatches 5 mins before period start without clicking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permission !== 'granted' && (
            <button
              type="button"
              onClick={handleEnablePush}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition shadow-xs"
            >
              Allow Mobile Push
            </button>
          )}
          <button
            type="button"
            onClick={handleTestAlert}
            disabled={testing}
            className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-[11px] flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
            <span>Test Mobile Alert</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-red-200 dark:border-red-900/60 bg-gradient-to-br from-red-50/70 via-white to-amber-50/50 dark:from-red-950/30 dark:via-slate-900 dark:to-slate-900 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Autonomous Mobile Class Alert Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live on Schedule
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dispatches alerts to your mobile 5 minutes prior to every scheduled lecture without clicking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permission !== 'granted' && (
            <button
              type="button"
              onClick={handleEnablePush}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Enable Device Push</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleTestAlert}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
            <span>Test Mobile Alert Now</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900 dark:text-white">Mobile Lockscreen</div>
            <div className="text-[10px] text-slate-400">Native push notification</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900 dark:text-white">Campus Bell Chime</div>
            <div className="text-[10px] text-slate-400">Harmonic audio gong</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900 dark:text-white">Schedule Basis</div>
            <div className="text-[10px] text-slate-400">5-min lead countdown</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900 dark:text-white">Zero Click Setup</div>
            <div className="text-[10px] text-slate-400">100% Autonomous</div>
          </div>
        </div>
      </div>

      {/* Target Up Next Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-slate-400">Next Scheduled Lecture: </span>
            <strong className="text-white font-bold">
              {scheduleInfo.nextClass?.title || 'Embedded Systems & IoT'}
            </strong>{' '}
            <span className="text-slate-400">
              ({scheduleInfo.nextSlot?.displayTime || '8:15 AM - 9:05 AM'} • {scheduleInfo.nextClass?.room || 'Room C-321'})
            </span>
          </div>
        </div>

        <a
          href={pushUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition"
        >
          <span>Open Direct Mobile Push Feed</span>
          <ExternalLink className="w-3 h-3 text-slate-300" />
        </a>
      </div>

      {/* Test Success Banner */}
      {testResult && (
        <div className="p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <strong>Mobile Alert Dispatched!</strong> Campus bell sounded, mobile vibrated, and notification pushed for{' '}
            <strong>{testResult.title}</strong> ({testResult.time}).
          </div>
        </div>
      )}
    </div>
  );
}
