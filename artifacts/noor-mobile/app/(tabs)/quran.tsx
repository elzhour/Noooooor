import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SURAH_NAMES } from "@/lib/constants";

export default function QuranScreen() {
  const colors = useColors();
  const [search, setSearch] = useState("");

  const surahs = useMemo(() => {
    const list = Object.entries(SURAH_NAMES).map(([num, name]) => ({
      number: parseInt(num, 10),
      name,
    }));
    if (!search.trim()) return list;
    const q = search.trim();
    return list.filter((s) => s.name.includes(q) || String(s.number).includes(q));
  }, [search]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>القرآن الكريم</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {surahs.length} سورة
        </Text>
      </View>

      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={20} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث عن سورة..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
      </View>

      <FlatList
        data={surahs}
        keyExtractor={(s) => String(s.number)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.numCircle, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.numText, { color: colors.primary }]}>{item.number}</Text>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[styles.surahName, { color: colors.foreground }]}>
                سورة {item.name}
              </Text>
            </View>
            <Ionicons name="chevron-back" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: {
    fontSize: 28,
    fontFamily: "Amiri_700Bold",
    textAlign: "right",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Tajawal_400Regular",
    textAlign: "right",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  numCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  numText: {
    fontSize: 14,
    fontFamily: "Tajawal_700Bold",
  },
  surahName: {
    fontSize: 18,
    fontFamily: "Amiri_700Bold",
  },
});
