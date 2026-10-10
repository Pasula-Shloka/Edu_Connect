import React, { useState, useEffect } from 'react';
import { Zap, Coffee, BookOpen, Moon, X, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface VibeCheckInModalProps {
  studentId: number;
  studentName?: string;
}

export default function VibeCheckInModal({ studentId, studentName = 'Student' }: VibeCheckInModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkTodayVibe();
  }, [studentId]);

  async function checkTodayVibe() {
    try {
      const res = await fetch(`http://localhost:5001/api/vibes/student/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        // If not checked in today, open the modal
        if (!data.checked_in) {
          // slight delay so page loads smoothly first
          setTimeout(() => setIsOpen(true), 1200);
        }
      }
    } catch (err) {
      console.warn('Could not check daily vibe:', err);
    }
  }

  async function handleCheckIn() {
    if (!selectedVibe) return;
    try {
      setSubmitting(true);
      const res = await fetch('http://localhost:5001/api/vibes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          vibe_type: selectedVibe,
          vibe_note: note || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
        }, 2200);
      }
    } catch (err) {
      console.error('Failed to submit vibe:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const vibes = [
    {
      id: 'high_voltage',
      title: 'High Voltage',
      sub: 'Ready to write code!',
      icon: Zap,
      color: 'from-amber-400 to-amber-500 text-amber-950',
      border: 'border-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      emoji: '⚡',
    },
    {
      id: 'coffee_needed',
      title: 'Coffee Needed',
      sub: 'Surviving morning lectures',
      icon: Coffee,
      color: 'from-orange-400 to-amber-600 text-amber-950',
      border: 'border-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      emoji: '☕',
    },
    {
      id: 'exam_panic',
      title: 'Exam Panic',
      sub: 'Cramming mode on',
      icon: BookOpen,
      color: 'from-purple-400 to-indigo-500 text-white',
      border: 'border-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      emoji: '📚',
    },
    {
      id: 'sleep_deprived',
      title: 'Sleep Deprived',
      sub: 'Running on 3 hours',
      icon: Moon,
      color: 'from-blue-400 to-slate-600 text-white',
      border: 'border-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      emoji: '😴',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 shadow-lg">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Vibe Logged! +10 XP 🔥</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Your daily energy has been recorded in PostgreSQL. Your instructor can view the class mood meter!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Daily Academic Vibe Check-in</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                How's the energy today, {studentName}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pick your vibe to personalize your dashboard and inform your faculty's teaching pace.
              </p>
            </div>

            {/* 4 Vibe Cards */}
            <div className="grid grid-cols-2 gap-3">
              {vibes.map((vibe) => {
                const isSelected = selectedVibe === vibe.id;
                return (
                  <button
                    key={vibe.id}
                    type="button"
                    onClick={() => setSelectedVibe(vibe.id)}
                    className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between h-28 relative overflow-hidden group ${
                      isSelected
                        ? `${vibe.border} ${vibe.bg} shadow-md scale-[1.02]`
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-2xl">{vibe.emoji}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-red-600 shadow-sm" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {vibe.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {vibe.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Note */}
            <div>
              <input
                type="text"
                placeholder="Add an optional quick comment (e.g. 'Lab demo today!')..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            {/* Submit button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>Earn +10 XP Today</span>
              </span>
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={!selectedVibe || submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Check In My Vibe</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
