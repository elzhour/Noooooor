import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

const CHANNELS = [
  { id: "iqraa", name: "قناة اقرأ", desc: "قناة إسلامية متنوعة", color: "#1b4332", icon: "📺", url: "https://www.iqraa.com/live" },
  { id: "nas", name: "قناة ناس", desc: "قناة دينية ترفيهية", color: "#1e3a6e", icon: "📡", url: "https://www.nas.tv" },
  { id: "alnas", name: "قناة الناس", desc: "قناة دينية مصرية", color: "#4a2060", icon: "🕌", url: "https://www.alnas.tv" },
  { id: "quran_tv", name: "قناة القرآن الكريم", desc: "البث المباشر من مكة المكرمة", color: "#6b3a0f", icon: "📿", url: "https://www.quran.com/tv" },
  { id: "huda", name: "قناة هدى", desc: "Huda TV - Islamic Channel", color: "#0a3a5c", icon: "🌙", url: "https://www.huda.tv/live" },
  { id: "peace", name: "Peace TV", desc: "قناة السلام", color: "#2d5c3a", icon: "☮️", url: "https://www.peacetv.tv/live" },
];

export default function IslamicTVScreen() {
  const colors = useColors();
  const router = useRouter();

  const openChannel = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>القنوات الإسلامية</Text>
      </View>

      <View style={[styles.notice, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
        <Ionicons name="information-circle" size={16} color={colors.primary} />
        <Text style={[styles.noticeText, { color: colors.primary }]}>سيتم فتح القناة في المتصفح</Text>
      </View>

      <FlatList
        data={CHANNELS}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openChannel(item.url)}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
              <Text style={styles.emoji}>{item.icon}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.channelName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.channelDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
            </View>
            <View style={[styles.watchBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="play" size={14} color={colors.primaryForeground} />
              <Text style={[styles.watchText, { color: colors.primaryForeground }]}>شاهد</Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  notice: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    margin: 16,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: { fontSize: 13, fontFamily: "Tajawal_500Medium" },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: { fontSize: 28 },
  info: { flex: 1 },
  channelName: { fontSize: 15, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  channelDesc: { fontSize: 12, fontFamily: "Tajawal_400Regular", textAlign: "right", marginTop: 2 },
  watchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  watchText: { fontSize: 12, fontFamily: "Tajawal_700Bold" },
});
