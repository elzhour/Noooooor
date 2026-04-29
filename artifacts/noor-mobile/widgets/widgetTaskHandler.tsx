import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from "adhan";
import { PrayerTimesWidget } from "./PrayerTimesWidget";
import { NextPrayerWidget } from "./NextPrayerWidget";

const PRAYER_LABELS: Record<string, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? "م" : "ص";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return "الآن";
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}س ${minutes}د`;
  return `${minutes} دقيقة`;
}

function toHijri(date: Date): string {
  try {
    return date.toLocaleDateString("ar-SA-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

async function getPrayerData() {
  let lat = 30.0444;
  let lng = 31.2357;
  try {
    const stored = await AsyncStorage.getItem("@noor/location");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.lat && parsed?.lng) {
        lat = parsed.lat;
        lng = parsed.lng;
      }
    }
  } catch {}

  const now = new Date();
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Shafi;
  const pt = new PrayerTimes(coords, now, params);

  const prayerKeys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
  const prayerDates: Record<string, Date> = {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };

  let nextPrayer: string | null = null;
  let nextPrayerDate: Date | null = null;

  for (const key of prayerKeys) {
    const d = prayerDates[key];
    if (d > now) {
      nextPrayer = key;
      nextPrayerDate = d;
      break;
    }
  }

  const hijri = toHijri(now);
  const date = now.toLocaleDateString("ar-EG");

  const prayers = prayerKeys.map((key) => ({
    name: PRAYER_LABELS[key],
    time: formatTime(prayerDates[key]),
    isNext: key === nextPrayer,
  }));

  return {
    allPrayers: { prayers, date, hijri },
    nextPrayer: nextPrayer
      ? {
          prayerName: PRAYER_LABELS[nextPrayer],
          prayerTime: formatTime(nextPrayerDate!),
          countdown: formatCountdown(nextPrayerDate!.getTime() - now.getTime()),
          date,
          hijri,
        }
      : null,
  };
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetName } = props.widgetInfo;
  const { widgetAction } = props;

  if (widgetAction === "WIDGET_DELETED") return;

  const prayerData = await getPrayerData();

  if (widgetName === "PrayerTimesWidget") {
    props.renderWidget(<PrayerTimesWidget data={prayerData.allPrayers} />);
  } else if (widgetName === "NextPrayerWidget") {
    props.renderWidget(<NextPrayerWidget data={prayerData.nextPrayer} />);
  }
}
