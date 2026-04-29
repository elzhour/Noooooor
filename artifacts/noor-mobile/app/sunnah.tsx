import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import rawData from "@/data/sunnah.json";

interface SunnahItem {
  id: string;
  title: string;
  hadith: string;
  source: string;
  description?: string;
  reward?: string;
  category?: string;
  subcategory?: string;
}

function flattenSunnah(): SunnahItem[] {
  const content = (rawData as any).content as Record<string, Record<string, SunnahItem[]>>;
  const items: SunnahItem[] = [];
  for (const cat of Object.keys(content)) {
    const subs = content[cat];
    for (const sub of Object.keys(subs)) {
      const subItems = subs[sub];
      if (Array.isArray(subItems)) {
        for (const item of subItems) {
          items.push({ ...item, category: cat, subcategory: sub });
        }
      }
    }
  }
  return items;
}

const ALL_SUNNAH = flattenSunnah();
const CATEGORIES = [...new Set(ALL_SUNNAH.map((s) => s.category).filter(Boolean))] as string[];

export default function SunnahScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<SunnahItem | null>(null);

  const filtered = useMemo(() => {
    let items = ALL_SUNNAH;
    if (selectedCat) items = items.filter((s) => s.category === selectedCat);
    if (search.trim()) {
      items = items.filter(
        (s) =>
          s.title.includes(search) ||
          s.hadith.includes(search) ||
          s.source?.includes(search)
      );
    }
    return items;
  }, [search, selectedCat]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>السنة النبوية</Text>
        <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{filtered.length}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={[styles.searchRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث في السنة..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            onPress={() => setSelectedCat(null)}
            style={[styles.chip, { backgroundColor: !selectedCat ? colors.primary : colors.secondary, borderColor: !selectedCat ? colors.primary : colors.border }]}
          >
            <Text style={[styles.chipText, { color: !selectedCat ? colors.primaryForeground : colors.foreground }]}>الكل</Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCat(selectedCat === cat ? null : cat)}
              style={[styles.chip, { backgroundColor: selectedCat === cat ? colors.primary : colors.secondary, borderColor: selectedCat === cat ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: selectedCat === cat ? colors.primaryForeground : colors.foreground }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setModalItem(item)}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.cardTop}>
              {item.subcategory && (
                <View style={[styles.catBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[styles.catBadgeText, { color: colors.primary }]}>{item.subcategory}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.cardPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
              {item.hadith}
            </Text>
            {item.source && (
              <Text style={[styles.cardSource, { color: colors.mutedForeground }]}>{item.source}</Text>
            )}
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!modalItem} animationType="slide" transparent onRequestClose={() => setModalItem(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} onPress={() => setModalItem(null)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            {modalItem && (
              <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{modalItem.title}</Text>
                <View style={[styles.hadithBox, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "30" }]}>
                  <Text style={[styles.modalText, { color: colors.foreground }]}>{modalItem.hadith}</Text>
                </View>
                {modalItem.source && (
                  <Text style={[styles.modalSource, { color: colors.mutedForeground }]}>المصدر: {modalItem.source}</Text>
                )}
                {modalItem.description && (
                  <View style={[styles.descBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Text style={[styles.descLabel, { color: colors.mutedForeground }]}>الشرح:</Text>
                    <Text style={[styles.descText, { color: colors.foreground }]}>{modalItem.description}</Text>
                  </View>
                )}
                {modalItem.reward && (
                  <View style={[styles.rewardBox, { backgroundColor: "#f0fdf4", borderColor: "#4CAF5040" }]}>
                    <Ionicons name="star" size={14} color="#4CAF50" />
                    <Text style={[styles.rewardText, { color: "#166534" }]}>{modalItem.reward}</Text>
                  </View>
                )}
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontFamily: "Tajawal_700Bold" },
  controls: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  searchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: "Tajawal_500Medium", fontSize: 14, textAlign: "right" },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: "Tajawal_500Medium" },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  cardTop: { flexDirection: "row-reverse" },
  catBadge: { alignSelf: "flex-end", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catBadgeText: { fontSize: 10, fontFamily: "Tajawal_700Bold" },
  cardTitle: { fontSize: 15, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  cardPreview: { fontSize: 13, fontFamily: "Tajawal_400Regular", lineHeight: 21, textAlign: "right" },
  cardSource: { fontSize: 11, fontFamily: "Tajawal_400Regular", textAlign: "right" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "85%", paddingTop: 8 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalContent: { padding: 20, gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  hadithBox: { borderRadius: 14, borderWidth: 1, padding: 14 },
  modalText: { fontSize: 14, fontFamily: "Tajawal_400Regular", lineHeight: 26, textAlign: "right" },
  modalSource: { fontSize: 13, fontFamily: "Tajawal_500Medium", textAlign: "right" },
  descBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  descLabel: { fontSize: 12, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  descText: { fontSize: 13, fontFamily: "Tajawal_400Regular", lineHeight: 22, textAlign: "right" },
  rewardBox: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 6, borderRadius: 10, borderWidth: 1, padding: 10 },
  rewardText: { flex: 1, fontSize: 13, fontFamily: "Tajawal_500Medium", textAlign: "right", lineHeight: 20 },
  closeBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 4 },
  closeBtnText: { fontSize: 16, fontFamily: "Tajawal_700Bold" },
});
