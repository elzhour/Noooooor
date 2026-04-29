import React, { useState, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { azkarCategories } from "@/data/azkar";

export default function AzkarScreen() {
  const colors = useColors();
  const [activeId, setActiveId] = useState(azkarCategories[0].id);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const active = useMemo(
    () => azkarCategories.find((c) => c.id === activeId)!,
    [activeId]
  );

  const tap = (id: string, target: number) => {
    Haptics.selectionAsync();
    setCounts((prev) => {
      const next = (prev[id] ?? 0) + 1;
      if (next === target) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return { ...prev, [id]: next };
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>الأذكار</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {active.description}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {azkarCategories.map((cat) => {
          const isActive = cat.id === activeId;
          return (
            <Pressable
              key={cat.id}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveId(cat.id);
              }}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {active.items.map((item) => {
          const current = counts[item.id] ?? 0;
          const isDone = current >= item.count;
          return (
            <Pressable
              key={item.id}
              onPress={() => tap(item.id, item.count)}
              style={({ pressed }) => [
                styles.zikrCard,
                {
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderColor: isDone ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                  opacity: isDone ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.zikrText, { color: colors.foreground }]}>
                {item.text}
              </Text>
              {item.reference ? (
                <Text style={[styles.zikrRef, { color: colors.mutedForeground }]}>
                  ({item.reference})
                </Text>
              ) : null}
              <View style={styles.counterRow}>
                <View
                  style={[
                    styles.counterBadge,
                    { backgroundColor: isDone ? colors.primary : colors.muted },
                  ]}
                >
                  <Text
                    style={[
                      styles.counterText,
                      {
                        color: isDone ? colors.primaryForeground : colors.foreground,
                      },
                    ]}
                  >
                    {current} / {item.count}
                  </Text>
                </View>
                {isDone ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : (
                  <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>
                    اضغط لتسبّح
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
        <View style={{ height: 96 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  tabs: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    flexDirection: "row-reverse",
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Tajawal_500Medium",
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  zikrCard: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  zikrText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: "right",
    fontFamily: "Amiri_400Regular",
  },
  zikrRef: {
    fontSize: 11,
    textAlign: "right",
    fontFamily: "Tajawal_500Medium",
  },
  counterRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  counterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  counterText: {
    fontSize: 13,
    fontFamily: "Tajawal_700Bold",
  },
  tapHint: {
    fontSize: 11,
    fontFamily: "Tajawal_500Medium",
  },
});
