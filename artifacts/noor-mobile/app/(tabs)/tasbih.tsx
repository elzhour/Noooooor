import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "noor:tasbih:state";

const PRESETS = [
  { text: "سُبْحَانَ اللَّهِ", target: 33 },
  { text: "الْحَمْدُ لِلَّهِ", target: 33 },
  { text: "اللَّهُ أَكْبَرُ", target: 34 },
  { text: "لَا إِلَهَ إِلَّا اللَّهُ", target: 100 },
  { text: "أَسْتَغْفِرُ اللَّهَ", target: 100 },
];

export default function TasbihScreen() {
  const colors = useColors();
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [presetIndex, setPresetIndex] = useState(0);

  const preset = PRESETS[presetIndex];

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        setCount(parsed.count ?? 0);
        setTotal(parsed.total ?? 0);
        setPresetIndex(parsed.presetIndex ?? 0);
      })
      .catch(() => {});
  }, []);

  const persist = (next: { count: number; total: number; presetIndex: number }) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCount = count + 1;
    const newTotal = total + 1;
    setCount(newCount);
    setTotal(newTotal);

    if (newCount === preset.target) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    persist({ count: newCount, total: newTotal, presetIndex });
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCount(0);
    persist({ count: 0, total, presetIndex });
  };

  const handleResetTotal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCount(0);
    setTotal(0);
    persist({ count: 0, total: 0, presetIndex });
  };

  const cyclePreset = () => {
    Haptics.selectionAsync();
    const next = (presetIndex + 1) % PRESETS.length;
    setPresetIndex(next);
    setCount(0);
    persist({ count: 0, total, presetIndex: next });
  };

  const progress = Math.min(count / preset.target, 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>التسبيح</Text>
        <Pressable
          onPress={handleResetTotal}
          style={[styles.iconBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="refresh" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Pressable
        onPress={cyclePreset}
        style={[styles.presetCard, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}
      >
        <Text style={[styles.presetText, { color: colors.foreground }]}>{preset.text}</Text>
        <View style={styles.presetMeta}>
          <Text style={[styles.presetTarget, { color: colors.primary }]}>الهدف: {preset.target}</Text>
          <Ionicons name="swap-horizontal" size={16} color={colors.mutedForeground} />
          <Text style={[styles.presetHint, { color: colors.mutedForeground }]}>اضغط للتغيير</Text>
        </View>
      </Pressable>

      <View style={styles.counterArea}>
        <Pressable
          onPress={handleTap}
          style={({ pressed }) => [
            styles.counterButton,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={["#C19A6B", "#A77F4F"]}
            style={styles.counterGradient}
          >
            <View
              style={[
                styles.progressRing,
                {
                  borderColor: "rgba(255,255,255,0.25)",
                  borderTopColor: "#FDFBF0",
                  transform: [{ rotate: `${progress * 360 - 90}deg` }],
                },
              ]}
            />
            <View style={styles.counterInner}>
              <Text style={styles.counterValue}>{count}</Text>
              <Text style={styles.counterLabel}>اضغط</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius - 4 }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{total}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>الإجمالي</Text>
          </View>
          <Pressable
            onPress={handleReset}
            style={[styles.resetBtn, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}
          >
            <Ionicons name="reload-outline" size={16} color={colors.foreground} />
            <Text style={[styles.resetText, { color: colors.foreground }]}>تصفير العدّاد</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Tajawal_700Bold",
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
  },
  presetCard: {
    marginHorizontal: 16,
    padding: 18,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  presetText: {
    fontSize: 30,
    fontFamily: "Amiri_700Bold",
    textAlign: "center",
  },
  presetMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  presetTarget: {
    fontSize: 12,
    fontFamily: "Tajawal_700Bold",
  },
  presetHint: {
    fontSize: 11,
    fontFamily: "Tajawal_500Medium",
  },
  counterArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingBottom: 80,
  },
  counterButton: {
    width: 240,
    height: 240,
  },
  counterGradient: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C19A6B",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  progressRing: {
    position: "absolute",
    inset: 12,
    borderRadius: 999,
    borderWidth: 4,
  },
  counterInner: {
    alignItems: "center",
    gap: 6,
  },
  counterValue: {
    fontSize: 72,
    fontWeight: "800",
    color: "#FDFBF0",
    fontFamily: "Tajawal_700Bold",
    fontVariant: ["tabular-nums"],
  },
  counterLabel: {
    fontSize: 14,
    color: "#FDFBF0",
    opacity: 0.85,
    fontFamily: "Tajawal_500Medium",
  },
  statsRow: {
    flexDirection: "row-reverse",
    gap: 12,
    paddingHorizontal: 24,
  },
  statBox: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 100,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Tajawal_700Bold",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: "Tajawal_500Medium",
  },
  resetBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resetText: {
    fontSize: 13,
    fontFamily: "Tajawal_500Medium",
  },
});
