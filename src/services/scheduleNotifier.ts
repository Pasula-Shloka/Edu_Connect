/**
 * Autonomous Schedule-Time Mobile Alert Service for KL EduConnect
 * Triggers native mobile notifications, device vibration, and acoustic chimes
 * on a timetable schedule basis without requiring the user to click anything.
 */

import { getCurrentAndNextClass, normalizeSection } from '@/lib/timetableData';

const API_BASE =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? `http://${window.location.hostname}:5001`
    : 'http://localhost:5001';

export interface AutoAlertPayload {
  title: string;
  code: string;
  faculty: string;
  room: string;
  time: string;
  leadMinutes: number;
  timestamp: string;
}

// Memory deduplicator for browser session
const sessionFiredAlerts = new Set<string>();

/**
 * Play a gentle university period chime using Web Audio API
 */
export function playUniversityBellChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // First gong tone (E5: 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 1.2);

    // Second gong tone (A5: 880 Hz) - 250ms later
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 1.4);
    }, 250);
  } catch (e) {
    // Audio context may require initial interaction on some browsers
  }
}

/**
 * Trigger physical mobile device vibration
 */
export function vibrateMobileDevice(pattern: number[] = [250, 150, 250, 150, 400]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Vibration not supported or allowed
  }
}

/**
 * Request native mobile notification permissions
 */
export async function requestMobileNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch (e) {
    return 'denied';
  }
}

/**
 * Show native mobile push notification
 */
export function showNativeMobileNotification(title: string, body: string, tag?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/klh-logo.png',
          badge: '/klh-logo.png',
          tag: tag || 'kl-class-alert',
          vibrate: [250, 150, 250, 150, 400] as any,
          requireInteraction: true,
        });
      }).catch(() => {
        new Notification(title, {
          body,
          icon: '/klh-logo.png',
          tag: tag || 'kl-class-alert',
        });
      });
    } else {
      new Notification(title, {
        body,
        icon: '/klh-logo.png',
        tag: tag || 'kl-class-alert',
      });
    }
  } catch (err) {
    console.error('Notification display error:', err);
  }
}

/**
 * Autonomous Background Schedule Watcher
 * Continuously evaluates current time against class period slots
 * and fires alerts to mobile devices on a schedule time basis.
 */
export function initAutonomousScheduleNotifier(
  user: any,
  onAlertTriggered?: (payload: AutoAlertPayload) => void
): () => void {
  if (!user || user.role === 'admin') return () => {};

  // Auto request permission on mobile
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }

  const section = normalizeSection(user.section || user.class_section || 'E4');

  async function checkAndAlert() {
    const info = getCurrentAndNextClass(section);
    if (!info.nextClass || !info.nextSlot) return;

    const now = new Date();
    const [slotH, slotM] = info.nextSlot.startTime.split(':').map(Number);
    const slotTotal = slotH * 60 + slotM;
    const nowTotal = now.getHours() * 60 + now.getMinutes();
    const diff = slotTotal - nowTotal;

    const todayKey = now.toISOString().slice(0, 10);
    const alertKey = `${todayKey}_slot_${info.nextSlot.slotIndex}_${info.nextClass.code}`;

    // Scheduled trigger condition: 5 minutes before class (or at class start)
    const isWithinWindow = diff >= 0 && diff <= 5;

    if (isWithinWindow && !sessionFiredAlerts.has(alertKey)) {
      sessionFiredAlerts.add(alertKey);

      const payload: AutoAlertPayload = {
        title: info.nextClass.title,
        code: info.nextClass.code,
        faculty: info.nextClass.faculty,
        room: info.nextClass.room || 'Campus',
        time: info.nextSlot.displayTime,
        leadMinutes: Math.max(1, diff),
        timestamp: now.toLocaleTimeString(),
      };

      // 1. Play university bell chime
      playUniversityBellChime();

      // 2. Vibrate mobile phone
      vibrateMobileDevice();

      // 3. Show native OS mobile notification
      showNativeMobileNotification(
        `⏰ Upcoming Class in ${payload.leadMinutes} mins: ${payload.title}`,
        `Venue: ${payload.room} • Faculty: ${payload.faculty} • Time: ${payload.time}`,
        alertKey
      );

      // 4. Callback for UI toast banner
      if (onAlertTriggered) {
        onAlertTriggered(payload);
      }

      // 5. Sync with backend API
      try {
        fetch(`${API_BASE}/api/timetable/send-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: user.user_id || user.id,
            student_email: user.email,
            student_name: user.full_name,
            class_details: {
              title: payload.title,
              code: payload.code,
              faculty: payload.faculty,
              room: payload.room,
              time: payload.time,
            },
          }),
        }).catch(() => {});
      } catch (e) {
        // Non-blocking
      }
    }
  }

  // Initial check
  checkAndAlert();

  // Polling every 20 seconds for precise schedule trigger
  const timer = setInterval(checkAndAlert, 20 * 1000);

  return () => clearInterval(timer);
}

/**
 * Manually test immediate mobile alert (for instant demonstration/verification)
 */
export async function triggerImmediateMobileAlertTest(user: any): Promise<AutoAlertPayload> {
  const section = normalizeSection(user?.section || 'E4');
  const info = getCurrentAndNextClass(section);
  const targetClass = info.nextClass || info.currentClass || {
    title: 'Operating Systems & System Programming',
    code: 'OSSP',
    faculty: 'Dr. P. Pavan Kumar',
    room: 'Block B - Room 304',
    type: 'Lecture' as const,
  };
  const targetSlot = info.nextSlot || info.currentSlot || {
    slotIndex: 0,
    periodName: 'Period 1',
    startTime: '08:15',
    endTime: '09:05',
    displayTime: '8:15 AM - 9:05 AM',
  };

  const payload: AutoAlertPayload = {
    title: targetClass.title,
    code: targetClass.code,
    faculty: targetClass.faculty,
    room: targetClass.room || 'Block B - Room 304',
    time: targetSlot.displayTime,
    leadMinutes: 5,
    timestamp: new Date().toLocaleTimeString(),
  };

  // Play chime
  playUniversityBellChime();

  // Vibrate mobile
  vibrateMobileDevice();

  // Show native notification
  showNativeMobileNotification(
    `⏰ [TEST] Upcoming Class in 5 mins: ${payload.title}`,
    `Venue: ${payload.room} • Faculty: ${payload.faculty} • Time: ${payload.time}`,
    'test-alert'
  );

  // Trigger backend push & notifications
  try {
    await fetch(`${API_BASE}/api/timetable/auto-scheduler/test-now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: user?.user_id || user?.id || 2 }),
    });
  } catch (e) {
    // Non-blocking
  }

  return payload;
}
