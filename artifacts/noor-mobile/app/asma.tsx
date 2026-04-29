import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { ASMA_HUSNA, type AsmaItem } from "@/lib/constants";

export default function AsmaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AsmaItem | null>(null);

  const filtered = ASMA_HUSNA.filter(
    (a) =>
      a.name.includes(search) ||
      a.transliteration.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>أسماء الله الحسنى</Text>
        <View style={[styles.badge, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>99 اسماً</Text>
        </View>
      </View>

      <View style={[styles.searchBox, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchInner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث عن اسم..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.number)}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelected(item)}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.numberBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.numberText, { color: colors.primary }]}>{item.number}</Text>
            </View>
            <Text style={[styles.arabicName, { color: colors.primary }]}>{item.name}</Text>
            <Text style={[styles.translit, { color: colors.mutedForeground }]}>{item.transliteration}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} onPress={() => setSelected(null)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalContent}>
                  <View style={[styles.modalNumber, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[styles.modalNumberText, { color: colors.primary }]}>{selected.number}</Text>
                  </View>
                  <Text style={[styles.modalArabic, { color: colors.primary }]}>{selected.name}</Text>
                  <Text style={[styles.modalTranslit, { color: colors.mutedForeground }]}>{selected.transliteration}</Text>
                  <View style={[styles.meaningBox, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "33" }]}>
                    <Text style={[styles.meaningText, { color: colors.foreground }]}>{selected.meaning}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelected(null)}
                    style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.closeBtnText, { color: colors.primaryForeground }]}>إغلاق</Text>
                  </TouchableOpacity>
                </View>
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontFamily: "Tajawal_700Bold" },
  searchBox: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchInner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: "Tajawal_500Medium", fontSize: 14, textAlign: "right" },
  grid: { padding: 12, gap: 10 },
  card: {
    flex: 1,
    margin: 5,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: { fontSize: 12, fontFamily: "Tajawal_700Bold" },
  arabicName: { fontSize: 22, fontFamily: "Amiri_700Bold", textAlign: "center", lineHeight: 34 },
  translit: { fontSize: 11, fontFamily: "Tajawal_400Regular", textAlign: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "80%",
    paddingTop: 8,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalContent: { padding: 24, alignItems: "center", gap: 12 },
  modalNumber: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  modalNumberText: { fontSize: 16, fontFamily: "Tajawal_700Bold" },
  modalArabic: { fontSize: 48, fontFamily: "Amiri_700Bold", textAlign: "center", lineHeight: 72 },
  modalTranslit: { fontSize: 15, fontFamily: "Tajawal_500Medium" },
  meaningBox: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 16 },
  meaningText: { fontSize: 15, fontFamily: "Tajawal_400Regular", lineHeight: 26, textAlign: "right" },
  closeBtn: { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 8 },
  closeBtnText: { fontSize: 16, fontFamily: "Tajawal_700Bold" },
});
