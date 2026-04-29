import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { PrayerTimeRow } from "./prayerTimes";

const ENABLED_KEY = "noor:notifications:enabled";
const PER_PRAYER_KEY = "noor:notifications:perPrayer";

export type PrayerKey = PrayerTimeRow["key"];

export const DEFAULT_PER_PRAYER: Record<PrayerKey, boolean> = {
  fajr: true,
  sunrise: false,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureChannelAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("adhan", {
      name: "الأذان",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#C19A6B",
      sound: "default",
    });
  }
}

export async function requestPermissionsAsync(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  await ensureChannelAsync();

  const settings = await Notifications.getPermissionsAsync();
  let granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted && settings.canAskAgain) {
    const request = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
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

export async function getPerPrayer(): Promise<Record<PrayerKey, boolean>> {
  const raw = await AsyncStorage.getItem(PER_PRAYER_KEY);
  if (!raw) return { ...DEFAULT_PER_PRAYER };
  try {
    return { ...DEFAULT_PER_PRAYER, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PER_PRAYER };
  }
}

export async function setPerPrayer(map: Record<PrayerKey, boolean>): Promise<void> {
  await AsyncStorage.setItem(PER_PRAYER_KEY, JSON.stringify(map));
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
  await ensureChannelAsync();
  await cancelAllAdhanNotifications();

  let scheduled = 0;
  const now = Date.now();

  for (const row of rows) {
    if (!perPrayer[row.key]) continue;
    const triggerMs = row.date.getTime();
    if (triggerMs <= now + 1000) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "حان الآن وقت صلاة " + row.arabicName,
        body: "الصلاة خير من النوم — لا تنسَ ذكر الله",
        sound: "default",
        data: { type: "adhan", key: row.key },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: row.date,
        channelId: "adhan",
      },
    });
    scheduled += 1;
  }

  return scheduled;
}
