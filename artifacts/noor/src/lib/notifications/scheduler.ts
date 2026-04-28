/**
 * Prayer notification scheduler.
 *
 * On every login (or whenever the user changes their preferences) we:
 *   1. Fetch a full month of prayer times from the Aladhan API for the user's
 *      governorate (lat/lng).
 *   2. Cancel every previously-scheduled prayer notification.
 *   3. Schedule a fresh local notification for each prayer time in the next
 *      30 days, using the per-prayer mode the user picked.
 *
 * Local notifications are stored in the OS scheduler (AlarmManager on Android),
 * so they fire even when the app is closed and the device has no internet.
 */

import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type ScheduleOptions,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications';
import { PRAYER_KEYS, PRAYER_NAMES_AR, loadPrefs, type PrayerKey } from './prefs';

export const PRAYER_NOTIF_CHANNEL = 'noor_prayer_athan';
export const PRAYER_NOTIF_CHANNEL_TEXT = 'noor_prayer_text';

interface ScheduleParams {
  lat: number;
  lng: number;
  /** Number of days ahead to schedule. Default = 30. */
  days?: number;
}

/** A stable numeric id per (date, prayer) so we can cancel the previous batch. */
function notifIdFor(date: Date, prayer: PrayerKey): number {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const prayerIndex = PRAYER_KEYS.indexOf(prayer);
  // year (last 2 digits) * 10000 + dayOfYear * 10 + prayerIndex
  return (date.getFullYear() % 100) * 100_000 + dayOfYear * 10 + prayerIndex;
}

/** Fetch the prayer-time table for one calendar month from Aladhan. */
async function fetchMonthTimings(
  lat: number,
  lng: number,
  year: number,
  month: number /* 1-12 */
): Promise<Array<{ date: Date; timings: Record<string, string> }>> {
  const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch monthly prayer times');
  const json = await res.json();
  const arr = json.data as Array<{
    timings: Record<string, string>;
    date: { gregorian: { day: string; month: { number: number }; year: string } };
  }>;
  return arr.map(item => {
    const day = parseInt(item.date.gregorian.day, 10);
    const m = item.date.gregorian.month.number;
    const y = parseInt(item.date.gregorian.year, 10);
    return {
      date: new Date(y, m - 1, day),
      timings: item.timings,
    };
  });
}

/** Build the full list of prayer events (date + Date object for the prayer) for `days` ahead. */
async function buildSchedule(
  lat: number,
  lng: number,
  days: number
): Promise<Array<{ when: Date; prayer: PrayerKey }>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const months = new Set<string>();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
  }

  const monthData: Record<string, Awaited<ReturnType<typeof fetchMonthTimings>>> = {};
  await Promise.all(
    Array.from(months).map(async key => {
      const [y, m] = key.split('-').map(Number);
      monthData[key] = await fetchMonthTimings(lat, lng, y, m);
    })
  );

  const events: Array<{ when: Date; prayer: PrayerKey }> = [];
  const now = Date.now();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const dayEntry = monthData[key]?.find(
      e => e.date.getDate() === d.getDate() && e.date.getMonth() === d.getMonth()
    );
    if (!dayEntry) continue;

    for (const prayer of PRAYER_KEYS) {
      const t = dayEntry.timings[prayer];
      if (!t) continue;
      // Strip timezone suffix like "(EET)" or "(EEST)".
      const clean = t.replace(/\s*\(.+\)\s*$/, '').trim();
      const [hh, mm] = clean.split(':').map(Number);
      if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

      const when = new Date(d);
      when.setHours(hh, mm, 0, 0);
      if (when.getTime() <= now + 30_000) continue; // skip past prayers

      events.push({ when, prayer });
    }
  }

  return events;
}

async function ensureChannels(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await LocalNotifications.createChannel({
      id: PRAYER_NOTIF_CHANNEL,
      name: 'Athan',
      description: 'Prayer time call (athan)',
      importance: 5, // IMPORTANCE_HIGH
      visibility: 1, // PUBLIC
      sound: 'athan.mp3',
      vibration: true,
      lights: true,
    });
    await LocalNotifications.createChannel({
      id: PRAYER_NOTIF_CHANNEL_TEXT,
      name: 'Prayer Reminder',
      description: 'Silent text prayer notification',
      importance: 4,
      visibility: 1,
      vibration: true,
    });
  } catch (e) {
    console.warn('[notif] createChannel failed', e);
  }
}

export async function ensurePermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // On web, browser Notification API is best-effort.
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const r = await Notification.requestPermission();
    return r === 'granted';
  }
  const status = await LocalNotifications.checkPermissions();
  if (status.display === 'granted') return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === 'granted';
}

/** Cancel every prayer notification we previously scheduled (today + next 60 days). */
async function cancelPrevious(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const ids = pending.notifications
      .filter(n => typeof n.id === 'number')
      .map(n => ({ id: n.id as number }));
    if (ids.length) await LocalNotifications.cancel({ notifications: ids });
  } catch (e) {
    console.warn('[notif] cancelPrevious failed', e);
  }
}

/**
 * Schedule the next `days` of prayer notifications for the given coordinates.
 * Returns the number of notifications actually scheduled.
 */
export async function scheduleMonthOfPrayers(
  params: ScheduleParams
): Promise<{ scheduled: number; events: number }> {
  const { lat, lng, days = 30 } = params;
  const prefs = loadPrefs();
  if (!prefs.enabled) return { scheduled: 0, events: 0 };

  const events = await buildSchedule(lat, lng, days);

  if (!Capacitor.isNativePlatform()) {
    // Web preview: we can't schedule real OS alarms, so just store the next-up
    // event and let the in-app foreground watcher fire it.
    try {
      localStorage.setItem(
        'noor.next_prayer_events',
        JSON.stringify(
          events.slice(0, 50).map(e => ({ when: e.when.toISOString(), prayer: e.prayer }))
        )
      );
    } catch {}
    return { scheduled: 0, events: events.length };
  }

  await ensureChannels();
  await cancelPrevious();

  const notifications: LocalNotificationSchema[] = [];
  for (const ev of events) {
    const mode = prefs.modes[ev.prayer];
    if (mode === 'silent') continue;

    const isAthan = mode === 'athan';
    const arName = PRAYER_NAMES_AR[ev.prayer];

    notifications.push({
      id: notifIdFor(ev.when, ev.prayer),
      title: isAthan ? `موعد أذان ${arName}` : 'تنبيه الصلاة',
      body: `حان الآن موعد أذان ${arName}`,
      schedule: { at: ev.when, allowWhileIdle: true },
      channelId: isAthan ? PRAYER_NOTIF_CHANNEL : PRAYER_NOTIF_CHANNEL_TEXT,
      sound: isAthan ? 'athan.mp3' : undefined,
      smallIcon: 'ic_stat_notify',
      iconColor: '#C19A6B',
      autoCancel: true,
      ongoing: false,
      extra: {
        kind: isAthan ? 'athan' : 'text',
        prayer: ev.prayer,
        prayerNameAr: arName,
        whenIso: ev.when.toISOString(),
      },
    });
  }

  // Capacitor will reject very large batches (> ~500). We chunk just in case.
  const CHUNK = 50;
  let scheduled = 0;
  for (let i = 0; i < notifications.length; i += CHUNK) {
    const slice = notifications.slice(i, i + CHUNK);
    const opts: ScheduleOptions = { notifications: slice };
    try {
      await LocalNotifications.schedule(opts);
      scheduled += slice.length;
    } catch (e) {
      console.warn('[notif] schedule chunk failed', e);
    }
  }

  return { scheduled, events: events.length };
}

/** Fire a one-off test notification ~5 seconds from now. */
export async function scheduleTestNotification(prayer: PrayerKey = 'Dhuhr'): Promise<void> {
  const prefs = loadPrefs();
  const mode = prefs.modes[prayer];
  if (mode === 'silent') return;
  const isAthan = mode === 'athan';
  const arName = PRAYER_NAMES_AR[prayer];
  const when = new Date(Date.now() + 5_000);

  if (!Capacitor.isNativePlatform()) {
    // Web: just dispatch the in-app event right away so the popup shows.
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('noor:athan-fire', {
          detail: { prayer, prayerNameAr: arName, kind: mode },
        })
      );
    }, 800);
    return;
  }

  await ensureChannels();
  await ensurePermission();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 999_001,
        title: isAthan ? `(تجربة) أذان ${arName}` : '(تجربة) تنبيه الصلاة',
        body: `حان الآن موعد أذان ${arName}`,
        schedule: { at: when, allowWhileIdle: true },
        channelId: isAthan ? PRAYER_NOTIF_CHANNEL : PRAYER_NOTIF_CHANNEL_TEXT,
        sound: isAthan ? 'athan.mp3' : undefined,
        smallIcon: 'ic_stat_notify',
        iconColor: '#C19A6B',
        extra: { kind: isAthan ? 'athan' : 'text', prayer, prayerNameAr: arName },
      },
    ],
  });
}

/**
 * In-app foreground watcher: every 20 seconds we check if any of the next-up
 * prayer events should fire and trigger the popup. This covers the case where
 * the app is open in the foreground (where OS notifications get suppressed by
 * Capacitor on some Android versions) and also handles the web preview.
 */
let _watcherTimer: ReturnType<typeof setInterval> | null = null;
const _firedKeys = new Set<string>();

export function startForegroundWatcher(): void {
  if (_watcherTimer) return;
  const tick = () => {
    try {
      const prefs = loadPrefs();
      if (!prefs.enabled) return;
      const raw = localStorage.getItem('noor.next_prayer_events');
      if (!raw) return;
      const events = JSON.parse(raw) as Array<{ when: string; prayer: PrayerKey }>;
      const now = Date.now();
      for (const ev of events) {
        const t = new Date(ev.when).getTime();
        const key = `${ev.prayer}:${ev.when}`;
        if (_firedKeys.has(key)) continue;
        if (t <= now && now - t < 90_000) {
          _firedKeys.add(key);
          const mode = prefs.modes[ev.prayer];
          if (mode === 'silent') continue;
          window.dispatchEvent(
            new CustomEvent('noor:athan-fire', {
              detail: {
                prayer: ev.prayer,
                prayerNameAr: PRAYER_NAMES_AR[ev.prayer],
                kind: mode,
              },
            })
          );
        }
      }
    } catch (e) {
      console.warn('[notif] watcher tick failed', e);
    }
  };
  _watcherTimer = setInterval(tick, 20_000);
  tick();
}

export function stopForegroundWatcher(): void {
  if (_watcherTimer) {
    clearInterval(_watcherTimer);
    _watcherTimer = null;
  }
}
