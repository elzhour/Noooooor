import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { formatCountdown, formatPrayerTime, type PrayerTimeRow } from "@/utils/prayerTimes";

interface Props {
  next: PrayerTimeRow;
}

export function NextPrayerCard({ next }: Props) {
  const colors = useColors();
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = next.date.getTime() - now;
  const countdown = formatCountdown(remaining);

  return (
    <LinearGradient
      colors={["#C19A6B", "#A77F4F"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: colors.radius }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={16} color="#FDFBF0" />
          <Text style={styles.label}>الصلاة القادمة</Text>
        </View>
        <Text style={styles.timeText}>{formatPrayerTime(next.date)}</Text>
      </View>

      <Text style={styles.prayerName}>{next.arabicName}</Text>

      <View style={styles.countdownRow}>
        <Text style={styles.countdownLabel}>متبقي</Text>
        <Text style={styles.countdownValue}>{countdown}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  label: {
    color: "#FDFBF0",
    fontSize: 13,
    opacity: 0.9,
    fontFamily: "Tajawal_500Medium",
  },
  timeText: {
    color: "#FDFBF0",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Tajawal_700Bold",
  },
  prayerName: {
    color: "#FDFBF0",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 4,
    fontFamily: "Amiri_700Bold",
  },
  countdownRow: {
    flexDirection: "row-reverse",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 4,
  },
  countdownLabel: {
    color: "#FDFBF0",
    fontSize: 12,
    opacity: 0.8,
    fontFamily: "Tajawal_500Medium",
  },
  countdownValue: {
    color: "#FDFBF0",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
    fontFamily: "Tajawal_700Bold",
  },
});
