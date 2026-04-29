import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Animated,
  Pressable,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Magnetometer } from "expo-sensors";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { fetchCurrentLocation, type LocationResult } from "@/utils/location";
import { Coordinates, Qibla } from "adhan";

function lowPass(prev: number, next: number, alpha = 0.15) {
  let diff = next - prev;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return (prev + alpha * diff + 360) % 360;
}

export default function QiblaScreen() {
  const colors = useColors();
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const rotation = useRef(new Animated.Value(0)).current;
  const headingRef = useRef(0);
  const alignedRef = useRef(false);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    (async () => {
      const loc = await fetchCurrentLocation();
      setLocation(loc);

      const bearing = Qibla(new Coordinates(loc.latitude, loc.longitude));
      setQiblaBearing(bearing);

      const isAvailable = await Magnetometer.isAvailableAsync();
      setAvailable(isAvailable);
      if (isAvailable) {
        Magnetometer.setUpdateInterval(120);
        subscription = Magnetometer.addListener((data) => {
          let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
          angle = (angle + 360) % 360;
          const compass = (360 - angle) % 360;
          const smoothed = lowPass(headingRef.current, compass);
          headingRef.current = smoothed;
          setHeading(smoothed);
        });
      }
      setLoading(false);
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (qiblaBearing === null) return;
    const target = (qiblaBearing - heading + 360) % 360;
    Animated.timing(rotation, {
      toValue: target,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const diff = Math.min(Math.abs(target), 360 - Math.abs(target));
    if (diff < 5 && !alignedRef.current) {
      alignedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (diff >= 8) {
      alignedRef.current = false;
    }
  }, [heading, qiblaBearing, rotation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          جاري تحديد القبلة...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>اتجاه القبلة</Text>
        {location?.city ? (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            <Ionicons name="location-outline" size={12} color={colors.mutedForeground} /> {location.city}
          </Text>
        ) : null}
      </View>

      <View style={styles.compassWrap}>
        <View
          style={[
            styles.compassCircle,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Animated.View
            style={[
              styles.arrowContainer,
              {
                transform: [
                  {
                    rotate: rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.arrowHead, { borderBottomColor: colors.primary }]} />
            <View style={[styles.arrowBody, { backgroundColor: colors.primary }]} />
            <Text style={[styles.kaaba, { color: colors.primary }]}>🕋</Text>
          </Animated.View>

          <View style={styles.centerDot}>
            <Ionicons name="compass" size={32} color={colors.primary} />
          </View>

          <Text style={[styles.cardinalN, { color: colors.foreground }]}>ش</Text>
          <Text style={[styles.cardinalS, { color: colors.mutedForeground }]}>ج</Text>
          <Text style={[styles.cardinalE, { color: colors.mutedForeground }]}>ش</Text>
          <Text style={[styles.cardinalW, { color: colors.mutedForeground }]}>غ</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>اتجاه القبلة</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              {qiblaBearing?.toFixed(1)}°
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>اتجاهك الحالي</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {heading.toFixed(0)}°
            </Text>
          </View>
        </View>

        {available === false ? (
          <View style={[styles.warning, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.destructive} />
            <Text style={[styles.warningText, { color: colors.foreground }]}>
              جهازك لا يحتوي على مستشعر بوصلة. يمكنك استخدام درجة الاتجاه فوق لتوجيه نفسك يدويًا.
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Tajawal_500Medium" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "right",
    fontFamily: "Tajawal_700Bold",
  },
  subtitle: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
    fontFamily: "Tajawal_500Medium",
  },
  compassWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  compassCircle: {
    width: 280,
    height: 280,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  arrowContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "flex-start",
    position: "absolute",
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: 10,
  },
  arrowBody: {
    width: 4,
    height: 80,
  },
  kaaba: {
    fontSize: 28,
    marginTop: -10,
  },
  centerDot: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(193,154,107,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardinalN: { position: "absolute", top: 8, fontSize: 14, fontWeight: "700", fontFamily: "Tajawal_700Bold" },
  cardinalS: { position: "absolute", bottom: 8, fontSize: 14, fontWeight: "700", fontFamily: "Tajawal_700Bold" },
  cardinalE: { position: "absolute", left: 8, fontSize: 14, fontWeight: "700", fontFamily: "Tajawal_700Bold" },
  cardinalW: { position: "absolute", right: 8, fontSize: 14, fontWeight: "700", fontFamily: "Tajawal_700Bold" },
  infoCard: {
    borderWidth: 1,
    padding: 16,
    width: "100%",
    gap: 8,
  },
  infoRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  infoLabel: { fontSize: 13, fontFamily: "Tajawal_500Medium" },
  infoValue: { fontSize: 18, fontWeight: "700", fontFamily: "Tajawal_700Bold", fontVariant: ["tabular-nums"] },
  warning: {
    flexDirection: "row-reverse",
    gap: 10,
    padding: 12,
    alignItems: "center",
  },
  warningText: { flex: 1, fontSize: 12, fontFamily: "Tajawal_500Medium", textAlign: "right" },
});
