/**
 * Notification preferences — saved in localStorage so they persist offline.
 *
 * For each of the 5 daily prayers the user can pick one of three modes:
 *   - 'silent' : no notification at all
 *   - 'text'   : silent text notification ("حان الآن موعد أذان <name>")
 *   - 'athan'  : full athan sound + popup with close button
 */

export type PrayerKey = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export type NotifyMode = 'silent' | 'text' | 'athan';

export const PRAYER_KEYS: readonly PrayerKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export const PRAYER_NAMES_AR: Record<PrayerKey, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

export interface NotificationPrefs {
  modes: Record<PrayerKey, NotifyMode>;
  athanReciterId: string;
  enabled: boolean;
}

const STORAGE_KEY = 'noor.notification_prefs.v1';

const DEFAULTS: NotificationPrefs = {
  modes: {
    Fajr: 'athan',
    Dhuhr: 'athan',
    Asr: 'athan',
    Maghrib: 'athan',
    Isha: 'athan',
  },
  athanReciterId: 'azan1',
  enabled: true,
};

export function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, modes: { ...DEFAULTS.modes } };
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      enabled: parsed.enabled ?? DEFAULTS.enabled,
      athanReciterId: parsed.athanReciterId ?? DEFAULTS.athanReciterId,
      modes: { ...DEFAULTS.modes, ...(parsed.modes ?? {}) },
    };
  } catch {
    return { ...DEFAULTS, modes: { ...DEFAULTS.modes } };
  }
}

export function savePrefs(p: NotificationPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* quota / disabled storage — silently ignore */
  }
}

export function setPrayerMode(key: PrayerKey, mode: NotifyMode): NotificationPrefs {
  const p = loadPrefs();
  p.modes[key] = mode;
  savePrefs(p);
  return p;
}

export function setAthanReciter(id: string): NotificationPrefs {
  const p = loadPrefs();
  p.athanReciterId = id;
  savePrefs(p);
  return p;
}

export function setEnabled(v: boolean): NotificationPrefs {
  const p = loadPrefs();
  p.enabled = v;
  savePrefs(p);
  return p;
}
