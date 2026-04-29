import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { computePrayerTimes, type PrayerData } from "@/utils/prayerTimes";
import { fetchCurrentLocation, type LocationResult } from "@/utils/location";
import {
  ensureChannelsAsync,
  getEnabled,
  requestPermissionsAsync,
  scheduleAdhanForRows,
} from "@/utils/notifications";
import { PrayerTimesCard } from "@/components/PrayerTimesCard";
import { NextPrayerCard } from "@/components/NextPrayerCard";

export default function HomeScreen() {
  const colors = useColors();
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [_tick, setTick] = useState(0);

  const loadAll = useCallback(async () => {
    const loc = await fetchCurrentLocation();
    setLocation(loc);
    const data = computePrayerTimes(loc.latitude, loc.longitude, new Date());
    setPrayerData(data);
    if (Platform.OS === "android") {
      try {
        await AsyncStorage.setItem(
          "@noor/location",
          JSON.stringify({ lat: loc.latitude, lng: loc.longitude })
        );
        const { requestWidgetUpdate } = await import("react-native-android-widget");
        const { PrayerTimesWidget } = await import("@/widgets/PrayerTimesWidget");
        const { NextPrayerWidget } = await import("@/widgets/NextPrayerWidget");
        const prayers = data.rows.map((r) => ({
          name: r.arabicName,
          time: r.date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          isNext: data.next?.key === r.key,
        }));
        const prayerTimesData = {
          prayers,
          date: new Date().toLocaleDateString("ar-EG"),
          hijri: data.hijriDate,
        };
        const nextData = data.next
          ? {
              prayerName: data.next.arabicName,
              prayerTime: data.next.date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
              countdown: "",
              date: new Date().toLocaleDateString("ar-EG"),
              hijri: data.hijriDate,
            }
          : null;
        await requestWidgetUpdate({
          widgetName: "PrayerTimesWidget",
          renderWidget: () => React.createElement(PrayerTimesWidget as any, { data: prayerTimesData }),
        }).catch(() => {});
        await requestWidgetUpdate({
          widgetName: "NextPrayerWidget",
          renderWidget: () => React.createElement(NextPrayerWidget as any, { data: nextData }),
        }).catch(() => {});
      } catch {}
    }
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureChannelsAsync();
        const data = await loadAll();
        if (cancelled) return;
        const enabled = await getEnabled();
        if (enabled) {
          const granted = await requestPermissionsAsync();
          if (granted && data) {
            await scheduleAdhanForRows(data.rows);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      if (!location) return;
      const data = computePrayerTimes(location.latitude, location.longitude, new Date());
      setPrayerData(data);
    }, [location])
  );

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!location) return;
    const refreshAtMidnight = () => {
      const data = computePrayerTimes(location.latitude, location.longitude, new Date());
      setPrayerData(data);
    };
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 30, 0);
    const ms = midnight.getTime() - now.getTime();
    const timer = setTimeout(refreshAtMidnight, ms);
    return () => clearTimeout(timer);
  }, [location, _tick]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const data = await loadAll();
      const enabled = await getEnabled();
      if (enabled && data) {
        await scheduleAdhanForRows(data.rows);
      }
    } catch (err) {
      Alert.alert("خطأ", "تعذر تحديث المواقيت. حاول مرة أخرى.");
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "صباح الخير";
    if (h < 18) return "مساء الخير";
    return "مساء النور";
  }, [_tick]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          جاري حساب مواقيت الصلاة...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.foreground }]}>{greeting}</Text>
            <Text style={[styles.appName, { color: colors.primary }]}>نور — رفيقك في الطاعة</Text>
          </View>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {prayerData?.next ? <NextPrayerCard next={prayerData.next} /> : null}

        {prayerData ? (
          <PrayerTimesCard
            rows={prayerData.rows}
            currentKey={prayerData.current?.key ?? null}
            nextKey={prayerData.next?.key ?? null}
            hijriDate={prayerData.hijriDate}
            gregorianDate={prayerData.gregorianDate}
            city={location?.city ?? location?.country}
          />
        ) : null}

        <View style={styles.quickRow}>
          <QuickAction
            label="الأذكار"
            icon="book"
            href="/(tabs)/azkar"
            colors={colors}
          />
          <QuickAction
            label="التسبيح"
            icon="ellipse"
            href="/(tabs)/tasbih"
            colors={colors}
          />
          <QuickAction
            label="القبلة"
            icon="compass"
            href="/(tabs)/qibla"
            colors={colors}
          />
        </View>

        <View
          style={[
            styles.duaCard,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.duaTitle, { color: colors.primary }]}>دعاء اليوم</Text>
          <Text style={[styles.duaText, { color: colors.foreground }]}>
            «اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا»
          </Text>
          <Text style={[styles.duaRef, { color: colors.mutedForeground }]}>رواه ابن ماجه</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { useRouter } from "expo-router";
function QuickAction({
  label,
  icon,
  href,
  colors,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  colors: ReturnType<typeof useColors>;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        router.push(href as never);
      }}
      style={({ pressed }) => [
        styles.quick,
        {
          backgroundColor: pressed ? colors.muted : colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius - 4,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Tajawal_500Medium" },
  content: { padding: 16, gap: 16, paddingBottom: 96 },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "right",
    fontFamily: "Tajawal_700Bold",
  },
  appName: {
    fontSize: 13,
    marginTop: 2,
    textAlign: "right",
    fontFamily: "Tajawal_500Medium",
  },
  logo: { width: 44, height: 44 },
  quickRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  quick: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  quickLabel: {
    fontSize: 13,
    fontFamily: "Tajawal_500Medium",
  },
  duaCard: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  duaTitle: {
    fontSize: 14,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
  },
  duaText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: "right",
    fontFamily: "Amiri_400Regular",
  },
  duaRef: {
    fontSize: 11,
    textAlign: "right",
    fontFamily: "Tajawal_500Medium",
  },
});
