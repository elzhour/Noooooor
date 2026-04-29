import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { formatPrayerTime, type PrayerTimeRow } from "@/utils/prayerTimes";

interface Props {
  rows: PrayerTimeRow[];
  currentKey?: PrayerTimeRow["key"] | null;
  nextKey?: PrayerTimeRow["key"] | null;
  hijriDate: string;
  gregorianDate: string;
  city?: string;
}

const ICONS: Record<PrayerTimeRow["key"], keyof typeof Ionicons.glyphMap> = {
  fajr: "moon-outline",
  sunrise: "partly-sunny-outline",
  dhuhr: "sunny-outline",
  asr: "sunny",
  maghrib: "cloudy-night-outline",
  isha: "moon",
};

export function PrayerTimesCard({
  rows,
  currentKey,
  nextKey,
  hijriDate,
  gregorianDate,
  city,
}: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>مواقيت الصلاة</Text>
          {city ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              <Ionicons name="location-outline" size={12} color={colors.mutedForeground} /> {city}
            </Text>
          ) : null}
        </View>
        <View style={styles.dateBox}>
          <Text style={[styles.hijri, { color: colors.primary }]}>{hijriDate}</Text>
          <Text style={[styles.gregorian, { color: colors.mutedForeground }]}>{gregorianDate}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {rows.map((row) => {
        const isNext = row.key === nextKey;
        const isCurrent = row.key === currentKey;
        return (
          <View
            key={row.key}
            style={[
              styles.row,
              isNext && {
                backgroundColor: colors.primary,
                borderRadius: colors.radius - 4,
                paddingHorizontal: 12,
              },
              isCurrent && !isNext && {
                backgroundColor: colors.muted,
                borderRadius: colors.radius - 4,
                paddingHorizontal: 12,
              },
            ]}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name={ICONS[row.key]}
                size={18}
                color={isNext ? colors.primaryForeground : colors.primary}
              />
              <Text
                style={[
                  styles.prayerName,
                  {
                    color: isNext ? colors.primaryForeground : colors.foreground,
                  },
                ]}
              >
                {row.arabicName}
              </Text>
              {isNext ? (
                <View style={[styles.badge, { backgroundColor: colors.primaryForeground }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>التالية</Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.prayerTime,
                {
                  color: isNext ? colors.primaryForeground : colors.foreground,
                },
              ]}
            >
              {formatPrayerTime(row.date)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "right",
    fontFamily: "Tajawal_700Bold",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "right",
  },
  dateBox: {
    alignItems: "flex-start",
  },
  hijri: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Tajawal_700Bold",
  },
  gregorian: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  rowLeft: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Tajawal_500Medium",
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Tajawal_700Bold",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Tajawal_700Bold",
  },
});
