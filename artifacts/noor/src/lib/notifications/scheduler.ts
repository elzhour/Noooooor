/**
 * Prayer notification scheduler.
 *
 * On every login (or whenever the user changes their preferences) we:
 *   1. Fetch a full month of prayer times from the Aladhan API for the user's
 *      governorate (lat/lng) — and cache the response in localStorage so the
 *      next session works fully offline.
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
import { requestNotificationsPermission } from './permissions';

export const PRAYER_NOTIF_CHANNEL = 'noor_prayer_athan';
export const PRAYER_NOTIF_CHANNEL_TEXT = 'noor_prayer_text';

interface ScheduleParams {
  lat: number;
  lng: number;
  /** Number of days ahead to schedule. Default = 30. */
  days?: number;
}

interface CachedMonth {
  /** Aladhan timings keyed by gregorian "yyyy-mm-dd" — stored offline. */
  data: Record<string, Record<string, string>>;
  /** Cached timestamp (ms). */
  ts: number;
}

const CACHE_KEY_PREFIX = 'noor.prayer_calendar_v1.';
const CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const TOLERANCE_MS = 90_000;

/** A stable numeric id per (date, prayer) so we can cancel the previous batch. */
function notifIdFor(date: Date, prayer: PrayerKey): number {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const prayerIndex = PRAYER_KEYS.indexOf(prayer);
  return (date.getFullYear() % 100) * 100_000 + dayOfYear * 10 + prayerIndex;
}

function cacheKey(lat: number, lng: number, year: number, month: number): string {
  return `${CACHE_KEY_PREFIX}${lat.toFixed(3)}_${lng.toFixed(3)}_${year}_${month}`;
}

function readCache(
  lat: number,
  lng: number,
  year: number,
  month: number,
): CachedMonth | null {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lng, year, month));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedMonth;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(
  lat: number,
  lng: number,
  year: number,
  month: number,
  data: Record<string, Record<string, string>>,
): void {
  try {
    localStorage.setItem(
      cacheKey(lat, lng, year, month),
      JSON.stringify({ data, ts: Date.now() } satisfies CachedMonth),
    );
  } catch {
    /* quota — ignore */
  }
}

/** Fetch the prayer-time table for one calendar month from Aladhan, with cache fallback. */
async function fetchMonthTimings(
  lat: number,
  lng: number,
  year: number,
  month: number /* 1-12 */,
): Promise<Record<string, Record<string, string>>> {
  const cached = readCache(lat, lng, year, month);
  // Try the network — but on failure use cache.
  try {
    const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=5`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('Bad HTTP ' + res.status);
    const json = await res.json();
    const arr = json.data as Array<{
      timings: Record<string, string>;
      date: { gregorian: { day: string; month: { number: number }; year: string } };
    }>;
    const out: Record<string, Record<string, string>> = {};
    for (const item of arr) {
      const d = item.date.gregorian.day.padStart(2, '0');
      const m = String(item.date.gregorian.month.number).padStart(2, '0');
      const y = item.date.gregorian.year;
      out[`${y}-${m}-${d}`] = item.timings;
    }
    writeCache(lat, lng, year, month, out);
    return out;
  } catch (e) {
    if (cached) {
      console.warn('[notif] using cached calendar (network failed)', e);
      return cached.data;
    }
    throw e;
  }
}

async function buildSchedule(
  lat: number,
  lng: number,
  days: number,
): Promise<Array<{ when: Date; prayer: PrayerKey }>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const months = new Set<string>();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
  }

  const monthData: Record<string, Record<string, Record<string, string>>> = {};
  await Promise.all(
    Array.from(months).map(async (key) => {
      const [y, m] = key.split('-').map(Number);
      monthData[key] = await fetchMonthTimings(lat, lng, y, m);
    }),
  );

  const events: Array<{ when: Date; prayer: PrayerKey }> = [];
  const now = Date.now();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    const dayTimings = monthData[key]?.[dStr];
    if (!dayTimings) continue;

    for (const prayer of PRAYER_KEYS) {
      const t = dayTimings[prayer];
      if (!t) continue;
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
      visibility: 1,
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

/** Backwards-compatible alias. Prefer `requestNotificationsPermission` from `./permissions`. */
export async function ensurePermission(): Promise<boolean> {
  return requestNotificationsPermission();
}

async function cancelPrevious(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const ids = pending.notifications
      .filter((n) => typeof n.id === 'number')
      .map((n) => ({ id: n.id as number }));
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
  params: ScheduleParams,
): Promise<{ scheduled: number; events: number; offline: boolean }> {
  const { lat, lng, days = 30 } = params;
  const prefs = loadPrefs();
  if (!prefs.enabled) return { scheduled: 0, events: 0, offline: false };

  let events: Array<{ when: Date; prayer: PrayerKey }> = [];
  let offline = false;
  try {
    events = await buildSchedule(lat, lng, days);
  } catch (e) {
    offline = true;
    console.warn('[notif] buildSchedule failed', e);
    return { scheduled: 0, events: 0, offline };
  }

  // Always remember the upcoming events for the foreground watcher (web + app).
  try {
    localStorage.setItem(
      'noor.next_prayer_events',
      JSON.stringify(
        events.slice(0, 60).map((e) => ({
          when: e.when.toISOString(),
          prayer: e.prayer,
        })),
      ),
    );
  } catch {}

  if (!Capacitor.isNativePlatform()) {
    return { scheduled: 0, events: events.length, offline: false };
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

  return { scheduled, events: events.length, offline };
}

/** Fire a one-off test notification ~5 seconds from now. */
export async function scheduleTestNotification(prayer: PrayerKey = 'Dhuhr'): Promise<void> {
  const prefs = loadPrefs();
  const mode = prefs.modes[prayer];
  const fireMode = mode === 'silent' ? 'athan' : mode;
  const isAthan = fireMode === 'athan';
  const arName = PRAYER_NAMES_AR[prayer];
  const when = new Date(Date.now() + 5_000);

  if (!Capacitor.isNativePlatform()) {
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('noor:athan-fire', {
          detail: { prayer, prayerNameAr: arName, kind: fireMode },
        }),
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
        if (t <= now && now - t < TOLERANCE_MS) {
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
            }),
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
