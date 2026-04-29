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
 *
 * Channels are versioned (suffix _v3). Android persists notification channels
 * forever and will not let you change `sound` or `importance` once created;
 * bumping the suffix forces a fresh channel with the correct settings.
 */

import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type ScheduleOptions,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications';
import { PRAYER_KEYS, PRAYER_NAMES_AR, loadPrefs, type PrayerKey } from './prefs';
import { requestNotificationsPermission } from './permissions';

export const PRAYER_NOTIF_CHANNEL = 'noor_prayer_athan_v3';
export const PRAYER_NOTIF_CHANNEL_TEXT = 'noor_prayer_text_v3';
const OLD_CHANNEL_IDS = [
  'noor_prayer_athan',
  'noor_prayer_text',
  'noor_prayer_athan_v2',
  'noor_prayer_text_v2',
];

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
const TOLERANCE_MS = 5 * 60_000; // 5 minutes — catches manual time-changes

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

let _channelsCreated = false;
async function ensureChannels(): Promise<void> {
  if (_channelsCreated) return;
  if (!Capacitor.isNativePlatform()) return;
  if (Capacitor.getPlatform() !== 'android') return;

  // Best-effort: clear out any old/broken channel definitions so a fresh
  // re-install isn't required when we change channel settings.
  for (const old of OLD_CHANNEL_IDS) {
    try {
      await LocalNotifications.deleteChannel({ id: old });
    } catch {
      /* channel didn't exist or platform doesn't support delete — ignore */
    }
  }

  await LocalNotifications.createChannel({
    id: PRAYER_NOTIF_CHANNEL,
    name: 'الأذان',
    description: 'صوت الأذان عند موعد الصلاة',
    importance: 5, // IMPORTANCE_HIGH — heads-up + sound
    visibility: 1,
    sound: 'athan',
    vibration: true,
    lights: true,
  });
  await LocalNotifications.createChannel({
    id: PRAYER_NOTIF_CHANNEL_TEXT,
    name: 'تنبيه الصلاة',
    description: 'تنبيه نصي قبل الصلاة',
    importance: 4,
    visibility: 1,
    vibration: true,
  });
  _channelsCreated = true;
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
 * Returns the number of notifications actually scheduled, plus any error
 * message so the UI can surface it to the user.
 */
export async function scheduleMonthOfPrayers(
  params: ScheduleParams,
): Promise<{
  scheduled: number;
  events: number;
  offline: boolean;
  error?: string;
}> {
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
    return {
      scheduled: 0,
      events: 0,
      offline,
      error: 'تعذر تحميل مواقيت الصلاة — تأكد من الاتصال بالإنترنت مرة واحدة',
    };
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

  try {
    await ensureChannels();
  } catch (e) {
    console.error('[notif] ensureChannels failed', e);
    return {
      scheduled: 0,
      events: events.length,
      offline,
      error: 'تعذر تجهيز قناة الأذان — أعد تثبيت التطبيق',
    };
  }
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
      sound: isAthan ? 'athan' : undefined,
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
  let lastError: string | undefined;
  for (let i = 0; i < notifications.length; i += CHUNK) {
    const slice = notifications.slice(i, i + CHUNK);
    const opts: ScheduleOptions = { notifications: slice };
    try {
      await LocalNotifications.schedule(opts);
      scheduled += slice.length;
    } catch (e) {
      console.error('[notif] schedule chunk failed', e);
      lastError = (e as Error)?.message || String(e);
    }
  }

  if (scheduled === 0 && notifications.length > 0) {
    return {
      scheduled,
      events: events.length,
      offline,
      error:
        'تعذر جدولة التنبيهات — تأكد من السماح بالإشعارات والتنبيهات الدقيقة' +
        (lastError ? ` (${lastError})` : ''),
    };
  }

  return { scheduled, events: events.length, offline };
}

/**
 * Fire the in-app full-screen Adhan popup immediately (used by the test button
 * and by the foreground watcher when a scheduled prayer time arrives while the
 * app is open).
 */
export function fireInAppAdhan(prayer: PrayerKey, mode: 'athan' | 'text' = 'athan'): void {
  window.dispatchEvent(
    new CustomEvent('noor:athan-fire', {
      detail: { prayer, prayerNameAr: PRAYER_NAMES_AR[prayer], kind: mode },
    }),
  );
}

/**
 * Fire a one-off test notification:
 *   1. Fires the in-app popup IMMEDIATELY so the user always sees feedback.
 *   2. Also schedules a system notification ~5s in the future so the user can
 *      verify that scheduled notifications work even if they leave the app.
 */
export async function scheduleTestNotification(
  prayer: PrayerKey = 'Dhuhr',
): Promise<{ inAppFired: boolean; scheduled: boolean; error?: string }> {
  const prefs = loadPrefs();
  const mode = prefs.modes[prayer] === 'silent' ? 'athan' : prefs.modes[prayer];
  const isAthan = mode === 'athan';
  const arName = PRAYER_NAMES_AR[prayer];
  const when = new Date(Date.now() + 5_000);

  // Always fire the in-app popup right away — guarantees visible feedback.
  fireInAppAdhan(prayer, mode);

  if (!Capacitor.isNativePlatform()) {
    return { inAppFired: true, scheduled: false };
  }

  try {
    await ensureChannels();
    const granted = await requestNotificationsPermission();
    if (!granted) {
      return {
        inAppFired: true,
        scheduled: false,
        error: 'لم يتم منح إذن الإشعارات — التجربة تظهر داخل التطبيق فقط',
      };
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 999_001,
          title: isAthan ? `(تجربة) أذان ${arName}` : '(تجربة) تنبيه الصلاة',
          body: `حان الآن موعد أذان ${arName}`,
          schedule: { at: when, allowWhileIdle: true },
          channelId: isAthan ? PRAYER_NOTIF_CHANNEL : PRAYER_NOTIF_CHANNEL_TEXT,
          sound: isAthan ? 'athan' : undefined,
          smallIcon: 'ic_stat_notify',
          iconColor: '#C19A6B',
          extra: { kind: mode, prayer, prayerNameAr: arName },
        },
      ],
    });
    return { inAppFired: true, scheduled: true };
  } catch (e) {
    console.error('[notif] scheduleTestNotification failed', e);
    return {
      inAppFired: true,
      scheduled: false,
      error: (e as Error)?.message || String(e),
    };
  }
}

let _watcherTimer: ReturnType<typeof setInterval> | null = null;
let _firedKeys = new Set<string>();
let _firedKeysDay = -1;

function tickWatcher(): void {
  try {
    const prefs = loadPrefs();
    if (!prefs.enabled) return;

    // Reset the de-dup set every calendar day so a new day's prayers can fire.
    const today = new Date().getDate();
    if (today !== _firedKeysDay) {
      _firedKeys = new Set();
      _firedKeysDay = today;
    }

    const raw = localStorage.getItem('noor.next_prayer_events');
    if (!raw) return;
    const events = JSON.parse(raw) as Array<{ when: string; prayer: PrayerKey }>;
    const now = Date.now();
    for (const ev of events) {
      const t = new Date(ev.when).getTime();
      const key = `${ev.prayer}:${ev.when}`;
      if (_firedKeys.has(key)) continue;
      // Fire if we are within `TOLERANCE_MS` of the prayer time (handles
      // manual phone clock changes — generous 5-minute window).
      if (t <= now && now - t < TOLERANCE_MS) {
        _firedKeys.add(key);
        const mode = prefs.modes[ev.prayer];
        if (mode === 'silent') continue;
        fireInAppAdhan(ev.prayer, mode);
      }
    }
  } catch (e) {
    console.warn('[notif] watcher tick failed', e);
  }
}

export function startForegroundWatcher(): void {
  if (_watcherTimer) {
    tickWatcher();
    return;
  }
  // Aggressive 5s polling — survives manual time changes and short focus windows.
  _watcherTimer = setInterval(tickWatcher, 5_000);
  tickWatcher();
}

export function stopForegroundWatcher(): void {
  if (_watcherTimer) {
    clearInterval(_watcherTimer);
    _watcherTimer = null;
  }
}

/** Reset the in-memory de-dup so the watcher can re-fire prayers (used after manual time-changes / debugging). */
export function resetWatcherFiredKeys(): void {
  _firedKeys = new Set();
  _firedKeysDay = -1;
}

let _nativeListenersAttached = false;
/**
 * Wire up Capacitor LocalNotifications listeners so when a scheduled prayer
 * notification fires while the app is open (or the user taps it from the
 * notification tray), we also open the in-app Adhan popup.
 */
export async function attachNativeNotificationListeners(): Promise<void> {
  if (_nativeListenersAttached) return;
  if (!Capacitor.isNativePlatform()) return;
  _nativeListenersAttached = true;

  const handleExtra = (extra: unknown) => {
    if (!extra || typeof extra !== 'object') return;
    const e = extra as Record<string, unknown>;
    const kind = e.kind === 'text' ? 'text' : 'athan';
    const prayer = (e.prayer as PrayerKey) || 'Dhuhr';
    fireInAppAdhan(prayer, kind);
  };

  try {
    await LocalNotifications.addListener('localNotificationReceived', (n) => {
      handleExtra(n?.extra);
    });
    await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (a) => {
        handleExtra(a?.notification?.extra);
      },
    );
  } catch (e) {
    console.warn('[notif] attachNativeNotificationListeners failed', e);
  }
}
