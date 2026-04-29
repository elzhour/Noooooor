import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { PrayerTimeRow } from "./prayerTimes";

const ENABLED_KEY = "noor:notifications:enabled";
const PER_PRAYER_KEY = "noor:notifications:perPrayer";
const ADHAN_SOUND_KEY = "noor:notifications:adhanSound";

export type PrayerKey = PrayerTimeRow["key"];
export type NotifMode = "silent" | "text" | "athan";

export const DEFAULT_PER_PRAYER: Record<PrayerKey, NotifMode> = {
  fajr: "athan",
  sunrise: "silent",
  dhuhr: "athan",
  asr: "athan",
  maghrib: "athan",
  isha: "athan",
};

export const ADHAN_SOUND_OPTIONS = [
  { id: "azan1", name: "أذان مكة" },
  { id: "azan2", name: "أذان المدينة" },
  { id: "azan3", name: "أذان مصر" },
  { id: "azan7", name: "أذان عبد الباسط" },
  { id: "azan9", name: "أذان الحرم" },
  { id: "azan12", name: "أذان منوع" },
];

export const ADHAN_SOUND_FILES: Record<string, any> = {
  azan1: require("@/assets/sounds/azan1.mp3"),
  azan2: require("@/assets/sounds/azan2.mp3"),
  azan3: require("@/assets/sounds/azan3.mp3"),
  azan7: require("@/assets/sounds/azan7.mp3"),
  azan9: require("@/assets/sounds/azan9.mp3"),
  azan12: require("@/assets/sounds/azan12.mp3"),
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureChannelsAsync() {
  if (Platform.OS !== "android") return;
  // Athan channel (with sound)
  await Notifications.setNotificationChannelAsync("adhan", {
    name: "الأذان",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    lightColor: "#C19A6B",
    sound: "azan1.wav",
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  // Text-only channel (no sound)
  await Notifications.setNotificationChannelAsync("adhan-text", {
    name: "تنبيه الصلاة (نص)",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#C19A6B",
    sound: null,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function requestPermissionsAsync(): Promise<boolean> {
  if (!Device.isDevice) return false;
  await ensureChannelsAsync();
  const settings = await Notifications.getPermissionsAsync();
  let granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted && settings.canAskAgain) {
    const request = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    granted =
      request.granted ||
      request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }
  return granted;
}

export async function getEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ENABLED_KEY);
  if (value === null) return true;
  return value === "true";
}
export async function setEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
}

export async function getPerPrayer(): Promise<Record<PrayerKey, NotifMode>> {
  const raw = await AsyncStorage.getItem(PER_PRAYER_KEY);
  if (!raw) return { ...DEFAULT_PER_PRAYER };
  try {
    const parsed = JSON.parse(raw);
    // Backward compat: convert booleans → modes
    const out: Record<PrayerKey, NotifMode> = { ...DEFAULT_PER_PRAYER };
    for (const k of Object.keys(out) as PrayerKey[]) {
      const v = parsed[k];
      if (v === true) out[k] = "athan";
      else if (v === false) out[k] = "silent";
      else if (v === "silent" || v === "text" || v === "athan") out[k] = v;
    }
    return out;
  } catch {
    return { ...DEFAULT_PER_PRAYER };
  }
}
export async function setPerPrayer(map: Record<PrayerKey, NotifMode>): Promise<void> {
  await AsyncStorage.setItem(PER_PRAYER_KEY, JSON.stringify(map));
}

export async function getAdhanSound(): Promise<string> {
  const v = await AsyncStorage.getItem(ADHAN_SOUND_KEY);
  return v && ADHAN_SOUND_FILES[v] ? v : "azan1";
}
export async function setAdhanSound(soundId: string): Promise<void> {
  await AsyncStorage.setItem(ADHAN_SOUND_KEY, soundId);
}

export async function cancelAllAdhanNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((s) => s.content.data?.type === "adhan")
    .map((s) => s.identifier);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function scheduleAdhanForRows(rows: PrayerTimeRow[]): Promise<number> {
  const enabled = await getEnabled();
  if (!enabled) return 0;
  const perPrayer = await getPerPrayer();
  const adhanSound = await getAdhanSound();
  await ensureChannelsAsync();
  await cancelAllAdhanNotifications();

  let scheduled = 0;
  const now = Date.now();

  for (const row of rows) {
    const mode = perPrayer[row.key] || "silent";
    if (mode === "silent") continue;
    const triggerMs = row.date.getTime();
    if (triggerMs <= now + 1000) continue;

    const useAthan = mode === "athan";
    const channelId = useAthan ? "adhan" : "adhan-text";
    const soundFile = useAthan ? `${adhanSound}.wav` : null;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `حان الآن وقت صلاة ${row.arabicName}`,
        body:
          row.key === "fajr"
            ? "الصلاة خير من النوم"
            : "حيّ على الصلاة، حيّ على الفلاح",
        sound: useAthan ? soundFile : undefined,
        data: { type: "adhan", key: row.key, mode, sound: adhanSound },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: row.date,
        channelId,
      },
    });
    scheduled += 1;
  }

  return scheduled;
}
