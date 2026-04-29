import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import * as Notifications from "expo-notifications";
import { AthanPopup } from "@/components/AthanPopup";
import { getPerPrayer, type PrayerKey, type NotifMode } from "@/utils/notifications";
import type { PrayerTimeRow } from "@/utils/prayerTimes";

interface AthanCtx {
  triggerForRows: (rows: PrayerTimeRow[]) => void;
}

const AthanContext = createContext<AthanCtx>({ triggerForRows: () => {} });

const PRAYER_NAMES_AR: Record<string, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

export function AthanProvider({ children }: { children: React.ReactNode }) {
  const [popup, setPopup] = useState<{
    visible: boolean;
    name: string;
    key: string;
    sound: boolean;
  }>({ visible: false, name: "", key: "", sound: false });
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  const showPopup = useCallback(async (key: string, mode: NotifMode) => {
    if (mode === "silent") return;
    setPopup({
      visible: true,
      name: PRAYER_NAMES_AR[key] || key,
      key,
      sound: mode === "athan",
    });
  }, []);

  const triggerForRows = useCallback(
    (rows: PrayerTimeRow[]) => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      watchTimerRef.current = setInterval(async () => {
        const now = Date.now();
        const perPrayer = await getPerPrayer();
        for (const row of rows) {
          const fireKey = `${row.key}-${row.date.toISOString().slice(0, 10)}`;
          if (firedRef.current.has(fireKey)) continue;
          const t = row.date.getTime();
          if (t <= now && now - t < 60_000) {
            firedRef.current.add(fireKey);
            const mode = perPrayer[row.key as PrayerKey] || "silent";
            showPopup(row.key, mode);
          }
        }
      }, 5_000);
    },
    [showPopup],
  );

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notif) => {
      const data: any = notif.request.content.data || {};
      if (data.type === "adhan" && data.key) {
        const mode = (data.mode as NotifMode) || "athan";
        showPopup(data.key as string, mode);
      }
    });
    const tapSub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data: any = res.notification.request.content.data || {};
      if (data.type === "adhan" && data.key) {
        showPopup(data.key as string, (data.mode as NotifMode) || "athan");
      }
    });
    return () => {
      sub.remove();
      tapSub.remove();
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, [showPopup]);

  return (
    <AthanContext.Provider value={{ triggerForRows }}>
      {children}
      <AthanPopup
        visible={popup.visible}
        prayerName={popup.name}
        prayerKey={popup.key}
        withSound={popup.sound}
        onClose={() => setPopup((p) => ({ ...p, visible: false }))}
      />
    </AthanContext.Provider>
  );
}

export function useAthan() {
  return useContext(AthanContext);
}
