import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

const BOOKS = [
  { slug: "bukhari", name: "صحيح البخاري", edition: "ara-bukhari", icon: "📚" },
  { slug: "muslim", name: "صحيح مسلم", edition: "ara-muslim", icon: "📖" },
  { slug: "tirmidhi", name: "جامع الترمذي", edition: "ara-tirmidhi", icon: "📕" },
  { slug: "abudawud", name: "سنن أبي داود", edition: "ara-abudawud", icon: "📗" },
  { slug: "ibnmajah", name: "سنن ابن ماجه", edition: "ara-ibnmajah", icon: "📘" },
  { slug: "nasai", name: "سنن النسائي", edition: "ara-nasai", icon: "📙" },
] as const;

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
const PAGE_SIZE = 30;

interface Hadith {
  hadithnumber: number;
  text: string;
}

export default function HadithScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<(typeof BOOKS)[number] | null>(null);
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState<Hadith[]>([]);
  const [bookScreen, setBookScreen] = useState(true);

  const loadBook = useCallback(async (book: (typeof BOOKS)[number]) => {
    setSelectedBook(book);
    setBookScreen(false);
    setLoading(true);
    setHadiths([]);
    setAllData([]);
    setPage(0);
    try {
      const res = await fetch(`${CDN}/${book.edition}.json`);
      const json = await res.json();
      const data: Hadith[] = (json.hadiths || []).map((h: any) => ({
        hadithnumber: h.hadithnumber || h.arabicnumber || 0,
        text: h.text || "",
      }));
      setAllData(data);
      setHadiths(data.slice(0, PAGE_SIZE));
      setPage(1);
    } catch {
      setHadiths([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (loading) return;
    const next = allData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    if (!next.length) return;
    setHadiths((prev) => [...prev, ...next]);
    setPage((p) => p + 1);
  }, [allData, page, loading]);

  if (bookScreen) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>الأحاديث النبوية</Text>
        </View>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>اختر الكتاب</Text>
        {BOOKS.map((book) => (
          <TouchableOpacity
            key={book.slug}
            onPress={() => loadBook(book)}
            style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={styles.bookIcon}>{book.icon}</Text>
            <Text style={[styles.bookName, { color: colors.foreground }]}>{book.name}</Text>
            <Ionicons name="arrow-back" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setBookScreen(true)} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{selectedBook?.name}</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>جاري التحميل...</Text>
        </View>
      ) : (
        <FlatList
          data={hadiths}
          keyExtractor={(item, i) => `${i}-${item.hadithnumber}`}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item, index }) => (
            <View style={[styles.hadithCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.hadithNumber, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.hadithNumberText, { color: colors.primary }]}>{item.hadithnumber}</Text>
              </View>
              <Text style={[styles.hadithText, { color: colors.foreground }]}>{item.text}</Text>
            </View>
          )}
          ListFooterComponent={
            page * PAGE_SIZE < allData.length ? (
              <TouchableOpacity
                onPress={loadMore}
                style={[styles.moreBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}
              >
                <Text style={[styles.moreBtnText, { color: colors.primary }]}>تحميل المزيد</Text>
              </TouchableOpacity>
            ) : null
          }
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
  sectionLabel: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, fontSize: 14, fontFamily: "Tajawal_500Medium", textAlign: "right" },
  bookCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  bookIcon: { fontSize: 24 },
  bookName: { flex: 1, fontSize: 16, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontFamily: "Tajawal_500Medium", fontSize: 14 },
  list: { padding: 16, gap: 12 },
  hadithCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  hadithNumber: { alignSelf: "flex-end", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  hadithNumberText: { fontSize: 12, fontFamily: "Tajawal_700Bold" },
  hadithText: { fontSize: 14, fontFamily: "Tajawal_400Regular", lineHeight: 24, textAlign: "right" },
  moreBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  moreBtnText: { fontFamily: "Tajawal_700Bold", fontSize: 14 },
});
