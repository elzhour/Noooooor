import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Prayer } from "adhan";

export interface PrayerTimeRow {
  key: "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
  arabicName: string;
  englishName: string;
  date: Date;
}

export interface PrayerData {
  rows: PrayerTimeRow[];
  next: PrayerTimeRow | null;
  current: PrayerTimeRow | null;
  hijriDate: string;
  gregorianDate: string;
}

const PRAYER_NAMES: Array<{ key: PrayerTimeRow["key"]; arabicName: string; englishName: string }> = [
  { key: "fajr", arabicName: "الفجر", englishName: "Fajr" },
  { key: "sunrise", arabicName: "الشروق", englishName: "Sunrise" },
  { key: "dhuhr", arabicName: "الظهر", englishName: "Dhuhr" },
  { key: "asr", arabicName: "العصر", englishName: "Asr" },
  { key: "maghrib", arabicName: "المغرب", englishName: "Maghrib" },
  { key: "isha", arabicName: "العشاء", englishName: "Isha" },
];

export function computePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
): PrayerData {
  const coordinates = new Coordinates(latitude, longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Shafi;

  const prayerTimes = new PrayerTimes(coordinates, date, params);

  const rows: PrayerTimeRow[] = PRAYER_NAMES.map(({ key, arabicName, englishName }) => ({
    key,
    arabicName,
    englishName,
    date: prayerTimes[key],
  }));

  const nowMs = Date.now();
  const upcoming = rows.find((row) => row.date.getTime() > nowMs) ?? null;

  let current: PrayerTimeRow | null = null;
  for (const row of rows) {
    if (row.date.getTime() <= nowMs) {
      current = row;
    }
  }

  let nextRow = upcoming;
  if (!nextRow) {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);
    nextRow = {
      key: "fajr",
      arabicName: "الفجر",
      englishName: "Fajr",
      date: tomorrowTimes.fajr,
    };
  }

  const hijriFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const gregorianFormatter = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    rows,
    next: nextRow,
    current,
    hijriDate: hijriFormatter.format(date),
    gregorianDate: gregorianFormatter.format(date),
  };
}

export function formatPrayerTime(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
}

export { Prayer };
