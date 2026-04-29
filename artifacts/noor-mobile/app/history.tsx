import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

const ERAS = [
  { id: "pre", name: "ما قبل الإسلام", icon: "🌙", color: "#1b4332", files: ["history-pre"] },
  { id: "seerah", name: "السيرة النبوية", icon: "☪️", color: "#1e3a6e", files: ["history-seerah"] },
  { id: "rashidun", name: "الخلفاء الراشدون", icon: "⭐", color: "#4a2060", files: ["history-rashidun"] },
  { id: "umayyad", name: "الدولة الأموية", icon: "🏛️", color: "#6b3a0f", files: ["history-umayyad"] },
  { id: "abbasid", name: "الدولة العباسية", icon: "🌟", color: "#0a3a5c", files: ["history-abbasid-1", "history-abbasid-2", "history-abbasid-3", "history-abbasid-4"] },
  { id: "ayyubid", name: "الدولة الأيوبية", icon: "⚔️", color: "#2d4a7a", files: ["history-ayyubid"] },
  { id: "mamluk", name: "دولة المماليك", icon: "🏰", color: "#5c3317", files: ["history-mamluk-1", "history-mamluk-2"] },
  { id: "ottoman", name: "الدولة العثمانية", icon: "🕌", color: "#2d6a4f", files: ["history-ottoman-1", "history-ottoman-2", "history-ottoman-3"] },
];

const BASE = "https://raw.githubusercontent.com/islamnoor/noor-data/main/history";
const FALLBACK = "https://cdn.jsdelivr.net/gh/islamnoor/noor-data@main/history";

interface Event {
  id: number;
  title: string;
  text: string;
  year?: string;
}

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selected, setSelected] = useState<(typeof ERAS)[number] | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const loadEra = async (era: (typeof ERAS)[number]) => {
    setSelected(era);
    setLoading(true);
    setEvents([]);
    setExpanded(null);
    try {
      const allEvents: Event[] = [];
      for (const file of era.files) {
        const url = `https://noor-web.vercel.app/data/${file}.json`;
        const res = await fetch(url);
        const data: Event[] = await res.json();
        allEvents.push(...data);
      }
      setEvents(allEvents);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (!selected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>التاريخ الإسلامي</Text>
        </View>
        <ScrollView contentContainerStyle={styles.eraGrid}>
          <View style={[styles.topBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Text style={styles.bannerEmoji}>📜</Text>
            <Text style={[styles.bannerText, { color: colors.primary }]}>رحلة عبر التاريخ الإسلامي العريق</Text>
          </View>
          {ERAS.map((era) => (
            <TouchableOpacity
              key={era.id}
              onPress={() => loadEra(era)}
              style={[styles.eraCard, { backgroundColor: era.color }]}
            >
              <Text style={styles.eraIcon}>{era.icon}</Text>
              <Text style={styles.eraName}>{era.name}</Text>
              <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSelected(null)} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{selected.name}</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>جاري التحميل...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>📚</Text>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>لا توجد بيانات متاحة حالياً</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e, i) => `${e.id}-${i}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setExpanded(expanded === item.id ? null : item.id)}
              style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.eventHeader}>
                {item.year && (
                  <View style={[styles.yearBadge, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[styles.yearText, { color: colors.primary }]}>{item.year}</Text>
                  </View>
                )}
                <Text style={[styles.eventTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Ionicons
                  name={expanded === item.id ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
              {expanded === item.id && (
                <Text style={[styles.eventText, { color: colors.foreground }]}>{item.text}</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  eraGrid: { padding: 16, gap: 10 },
  topBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  bannerEmoji: { fontSize: 24 },
  bannerText: { flex: 1, fontSize: 14, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  eraCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  eraIcon: { fontSize: 28 },
  eraName: { flex: 1, fontSize: 16, fontFamily: "Tajawal_700Bold", color: "#fff", textAlign: "right" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontFamily: "Tajawal_500Medium", fontSize: 14 },
  list: { padding: 16, gap: 10 },
  eventCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  eventHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  yearBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  yearText: { fontSize: 11, fontFamily: "Tajawal_700Bold" },
  eventTitle: { flex: 1, fontSize: 14, fontFamily: "Tajawal_700Bold", textAlign: "right", lineHeight: 22 },
  eventText: {
    fontSize: 13,
    fontFamily: "Tajawal_400Regular",
    lineHeight: 22,
    textAlign: "right",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
});
