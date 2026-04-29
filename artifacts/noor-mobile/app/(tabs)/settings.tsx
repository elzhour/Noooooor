import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import {
  cancelAllAdhanNotifications,
  DEFAULT_PER_PRAYER,
  getEnabled,
  getPerPrayer,
  requestPermissionsAsync,
  scheduleAdhanForRows,
  setEnabled,
  setPerPrayer,
  type PrayerKey,
} from "@/utils/notifications";
import { computePrayerTimes } from "@/utils/prayerTimes";
import { fetchCurrentLocation } from "@/utils/location";

const PRAYER_LABELS: Array<{ key: PrayerKey; label: string }> = [
  { key: "fajr", label: "الفجر" },
  { key: "sunrise", label: "الشروق" },
  { key: "dhuhr", label: "الظهر" },
  { key: "asr", label: "العصر" },
  { key: "maghrib", label: "المغرب" },
  { key: "isha", label: "العشاء" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const [enabled, setEnabledState] = useState(true);
  const [perPrayer, setPerPrayerState] = useState<Record<PrayerKey, boolean>>(DEFAULT_PER_PRAYER);
  const [permission, setPermission] = useState<string>("checking");
  const [scheduled, setScheduled] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const e = await getEnabled();
      setEnabledState(e);
      const map = await getPerPrayer();
      setPerPrayerState(map);

      const p = await Notifications.getPermissionsAsync();
      setPermission(p.granted ? "granted" : p.canAskAgain ? "askable" : "denied");

      const all = await Notifications.getAllScheduledNotificationsAsync();
      setScheduled(all.filter((s) => s.content.data?.type === "adhan").length);
    })();
  }, []);

  const reschedule = async () => {
    const loc = await fetchCurrentLocation();
    const data = computePrayerTimes(loc.latitude, loc.longitude, new Date());
    const count = await scheduleAdhanForRows(data.rows);
    setScheduled(count);
    return count;
  };

  const toggleMaster = async (next: boolean) => {
    Haptics.selectionAsync();
    setEnabledState(next);
    await setEnabled(next);

    if (next) {
      const granted = await requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "تنبيه",
          "لم يتم منح صلاحية الإشعارات. افتح إعدادات النظام للسماح بها.",
          [
            { text: "إلغاء", style: "cancel" },
            { text: "فتح الإعدادات", onPress: () => Linking.openSettings() },
          ]
        );
        setPermission("denied");
        return;
      }
      setPermission("granted");
      const count = await reschedule();
      Alert.alert("تم", `تمت جدولة ${count} إشعار للصلوات القادمة.`);
    } else {
      await cancelAllAdhanNotifications();
      setScheduled(0);
    }
  };

  const togglePrayer = async (key: PrayerKey, value: boolean) => {
    Haptics.selectionAsync();
    const next = { ...perPrayer, [key]: value };
    setPerPrayerState(next);
    await setPerPrayer(next);
    if (enabled && permission === "granted") {
      await reschedule();
    }
  };

  const testNotification = async () => {
    const granted = await requestPermissionsAsync();
    if (!granted) {
      Alert.alert("تنبيه", "السماح بالإشعارات مطلوب لاختبارها.");
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "اختبار إشعار الأذان",
        body: "إذا وصلك هذا الإشعار، فإن الإعدادات تعمل بشكل صحيح ✓",
        sound: "default",
        data: { type: "test" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    });
    Alert.alert("تم الإرسال", "سيصلك إشعار خلال 3 ثوانٍ.");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>الإعدادات</Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="notifications" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>إشعارات الأذان</Text>
          </View>

          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>تفعيل الإشعارات</Text>
              <Text style={[styles.rowHint, { color: colors.mutedForeground }]}>
                {permission === "granted"
                  ? `${scheduled} إشعار مجدول`
                  : permission === "denied"
                  ? "السماح من إعدادات النظام مطلوب"
                  : "اضغط لتفعيل الإشعارات"}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={toggleMaster}
              trackColor={{ true: colors.primary, false: colors.muted }}
              thumbColor="#fff"
            />
          </View>

          {PRAYER_LABELS.map((p, idx) => (
            <View
              key={p.key}
              style={[
                styles.row,
                idx < PRAYER_LABELS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                !enabled && { opacity: 0.4 },
              ]}
            >
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>{p.label}</Text>
              <Switch
                value={perPrayer[p.key]}
                onValueChange={(v) => togglePrayer(p.key, v)}
                disabled={!enabled}
                trackColor={{ true: colors.primary, false: colors.muted }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <Pressable
          onPress={testNotification}
          style={({ pressed }) => [
            styles.testBtn,
            {
              backgroundColor: pressed ? colors.muted : colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Ionicons name="flash-outline" size={18} color={colors.primary} />
          <Text style={[styles.testText, { color: colors.foreground }]}>إرسال إشعار تجريبي</Text>
        </Pressable>

        <View
          style={[
            styles.aboutCard,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 6 }]}>عن التطبيق</Text>
          <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>
            نور — رفيقك اليومي للصلاة والذكر والقرآن. يحسب مواقيت الصلاة محلياً
            على جهازك بناءً على موقعك. الحسابات تتبع طريقة رابطة العالم الإسلامي
            ومذهب الشافعية في وقت العصر.
          </Text>
          <Text style={[styles.version, { color: colors.mutedForeground }]}>الإصدار 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 96 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "right",
    fontFamily: "Tajawal_700Bold",
  },
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 14,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Tajawal_700Bold",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
  },
  rowHint: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
    fontFamily: "Tajawal_500Medium",
  },
  testBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 14,
    borderWidth: 1,
  },
  testText: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
  },
  aboutCard: {
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: "right",
    fontFamily: "Tajawal_400Regular",
  },
  version: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "right",
    fontFamily: "Tajawal_500Medium",
  },
});
