import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import prophetsMetaJson from "@/data/prophets-meta.json";

interface ProphetMeta {
  id: string;
  name: string;
  title: string;
  order: number;
  color: string;
  quranCount: number;
}

interface ProphetEvent {
  id: number;
  prophet: string;
  title: string;
  text: string;
}

const PROPHETS_META = prophetsMetaJson as ProphetMeta[];

function colorToGradientStart(colorStr: string): string {
  const match = colorStr.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : "#1b4332";
}

export default function ProphetStoriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selected, setSelected] = useState<ProphetMeta | null>(null);
  const [events, setEvents] = useState<ProphetEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalItem, setModalItem] = useState<ProphetEvent | null>(null);

  const loadProphet = async (prophet: ProphetMeta) => {
    setSelected(prophet);
    setLoading(true);
    setEvents([]);
    try {
      const url = `https://noor-web.vercel.app/data/prophet-${prophet.id}.json`;
      const res = await fetch(url);
      const data: ProphetEvent[] = await res.json();
      setEvents(data);
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>قصص الأنبياء</Text>
        </View>
        <View style={[styles.verseBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
          <Text style={[styles.verse, { color: colors.primary }]}>
            {"لَقَدْ كَانَ فِي قَصَصِهِمْ عِبْرَةٌ لِّأُولِي الْأَلْبَابِ"}
          </Text>
          <Text style={[styles.verseRef, { color: colors.mutedForeground }]}>يوسف: 111</Text>
        </View>
        <FlatList
          data={PROPHETS_META}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const bg = colorToGradientStart(item.color);
            return (
              <TouchableOpacity
                onPress={() => loadProphet(item)}
                style={[styles.prophetCard, { backgroundColor: bg }]}
              >
                <Text style={styles.prophetName}>{item.name}</Text>
                <Text style={styles.prophetTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.quranBadge}>
                  <Text style={styles.quranBadgeText}>{item.quranCount} مرة</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    );
  }

  const bg = colorToGradientStart(selected.color);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSelected(null)} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>نبي الله {selected.name}</Text>
      </View>
      <View style={[styles.prophetBanner, { backgroundColor: bg }]}>
        <Text style={styles.prophetBigName}>{selected.name}</Text>
        <Text style={styles.prophetBigTitle}>{selected.title}</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد قصص متاحة حالياً</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e, i) => `${e.id}-${i}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setModalItem(item)}
              style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.eventTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.eventPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
                {item.text}
              </Text>
              <Text style={[styles.readMore, { color: colors.primary }]}>اقرأ المزيد ←</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!modalItem} animationType="slide" transparent onRequestClose={() => setModalItem(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} onPress={() => setModalItem(null)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            {modalItem && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{modalItem.title}</Text>
                <Text style={[styles.modalText, { color: colors.foreground }]}>{modalItem.text}</Text>
                <TouchableOpacity
                  onPress={() => setModalItem(null)}
                  style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.closeBtnText, { color: colors.primaryForeground }]}>إغلاق</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  verseBanner: {
    margin: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  verse: { fontSize: 15, fontFamily: "Amiri_700Bold", textAlign: "center", lineHeight: 28 },
  verseRef: { fontSize: 12, fontFamily: "Tajawal_400Regular", textAlign: "center" },
  grid: { padding: 12 },
  prophetCard: {
    flex: 1,
    margin: 5,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    minHeight: 110,
  },
  prophetName: { fontSize: 24, fontFamily: "Amiri_700Bold", color: "#fff", textAlign: "right", lineHeight: 36 },
  prophetTitle: { fontSize: 12, fontFamily: "Tajawal_400Regular", color: "rgba(255,255,255,0.8)", textAlign: "right" },
  quranBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-end" },
  quranBadgeText: { fontSize: 10, color: "#fff", fontFamily: "Tajawal_500Medium" },
  prophetBanner: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    gap: 4,
    alignItems: "center",
  },
  prophetBigName: { fontSize: 36, fontFamily: "Amiri_700Bold", color: "#fff" },
  prophetBigTitle: { fontSize: 14, fontFamily: "Tajawal_500Medium", color: "rgba(255,255,255,0.85)" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontFamily: "Tajawal_500Medium", fontSize: 14 },
  list: { padding: 16, gap: 10 },
  eventCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  eventTitle: { fontSize: 15, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  eventPreview: { fontSize: 13, fontFamily: "Tajawal_400Regular", lineHeight: 21, textAlign: "right" },
  readMore: { fontSize: 12, fontFamily: "Tajawal_700Bold", textAlign: "left" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    paddingTop: 8,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalContent: { padding: 20, gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  modalText: { fontSize: 14, fontFamily: "Tajawal_400Regular", lineHeight: 24, textAlign: "right" },
  closeBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 8 },
  closeBtnText: { fontSize: 16, fontFamily: "Tajawal_700Bold" },
});
