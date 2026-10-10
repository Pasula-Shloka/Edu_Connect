import React, { useEffect, useState } from 'react';
import { Zap, Coffee, BookOpen, Moon, Sparkles, Filter, Users, RefreshCw } from 'lucide-react';

interface FacultyVibeMeterProps {
  initialSection?: string;
}

export default function FacultyVibeMeter({ initialSection = 'all' }: FacultyVibeMeterProps) {
  const [section, setSection] = useState(initialSection);
  const [vibeData, setVibeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVibes();
  }, [section]);

  async function fetchVibes() {
    try {
      setLoading(true);
      const url = `http://localhost:5001/api/vibes/summary${section !== 'all' ? `?section=${encodeURIComponent(section)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setVibeData(json);
      }
    } catch (err) {
      console.error('Failed to load vibe summary:', err);
    } finally {
      setLoading(false);
    }
  }

  const percentages = vibeData?.percentages || {
    high_voltage: 50,
    coffee_needed: 33,
    exam_panic: 17,
    sleep_deprived: 0,
  };

  const total = vibeData?.total_checkins || 6;
  const insight = vibeData?.insight || 'Class energy is high today! Great time for interactive challenges.';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      {/* Header with Section Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Classroom Sentiment & Vibe Meter
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Live Pulse
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Student sentiment analysis for today ({total} check-ins)
            </p>
          </div>
        </div>

        {/* Section Segmented Controls */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All' },
            { id: 'A1', label: 'A1' },
            { id: 'A2', label: 'A2' },
            { id: 'A3', label: 'A3' },
            { id: 'A4', label: 'A4' },
            { id: 'A5', label: 'A5' },
            { id: 'A6', label: 'A6' },
            { id: 'A7', label: 'A7' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                section === s.id
                  ? 'bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* High Voltage */}
        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>⚡ High Voltage</span>
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {percentages.high_voltage}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
              style={{ width: `${percentages.high_voltage}%` }}
            />
          </div>
        </div>

        {/* Coffee Needed */}
        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>☕ Coffee Needed</span>
            </span>
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {percentages.coffee_needed}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
              style={{ width: `${percentages.coffee_needed}%` }}
            />
          </div>
        </div>

        {/* Exam Panic */}
        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>📚 Exam Panic</span>
            </span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {percentages.exam_panic}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 transition-all duration-500"
              style={{ width: `${percentages.exam_panic}%` }}
            />
          </div>
        </div>

        {/* Sleep Deprived */}
        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>😴 Sleep Deprived</span>
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {percentages.sleep_deprived}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-slate-500 transition-all duration-500"
              style={{ width: `${percentages.sleep_deprived}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Pedagogical Insight */}
      <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
          <strong className="font-bold">Faculty Teaching Tip:</strong> {insight}
        </p>
      </div>
    </div>
  );
}
