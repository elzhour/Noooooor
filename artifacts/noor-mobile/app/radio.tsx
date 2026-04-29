import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Audio } from "expo-av";

const STATIONS = [
  { id: "quran", name: "إذاعة القرآن الكريم", freq: "FM 98.8", color: "#1b4332", url: "https://live.mp3quran.net/eg_quran" },
  { id: "sunnah", name: "إذاعة السنة النبوية", freq: "FM 92.7", color: "#1e3a6e", url: "https://live.mp3quran.net/nas" },
  { id: "midan", name: "إذاعة ميدان", freq: "FM 88.5", color: "#4a2060", url: "https://stream.radiojar.com/crmgggnde8duv" },
  { id: "makkah", name: "قرآن مكة المكرمة", freq: "بث مباشر", color: "#6b3a0f", url: "https://backup.quraan.com.sa/radio/128/stream" },
  { id: "madinah", name: "إذاعة المدينة المنورة", freq: "بث مباشر", color: "#0a3a5c", url: "https://live.mp3quran.net/almadinah" },
];

export default function RadioScreen() {
  const colors = useColors();
  const router = useRouter();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    }).catch(() => {});
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const handlePlay = async (station: (typeof STATIONS)[number]) => {
    if (loading) return;
    if (playing === station.id) {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlaying(null);
      return;
    }
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setLoading(station.id);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { shouldPlay: true, isLooping: false }
      );
      soundRef.current = sound;
      setPlaying(station.id);
    } catch {
      setPlaying(null);
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الإذاعة الإسلامية</Text>
      </View>

      {playing && (
        <View style={[styles.nowPlaying, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}>
          <View style={styles.nowPlayingDot}>
            <View style={[styles.dot, { backgroundColor: "#4CAF50" }]} />
          </View>
          <Text style={[styles.nowPlayingText, { color: colors.primary }]}>
            يُبَثّ الآن: {STATIONS.find((s) => s.id === playing)?.name}
          </Text>
        </View>
      )}

      <FlatList
        data={STATIONS}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isPlaying = playing === item.id;
          const isLoading = loading === item.id;
          return (
            <TouchableOpacity
              onPress={() => handlePlay(item)}
              style={[styles.card, { backgroundColor: colors.card, borderColor: isPlaying ? colors.primary : colors.border }]}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + "DD" }]}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name={isPlaying ? "pause" : "radio"} size={22} color="#fff" />
                )}
              </View>
              <View style={styles.info}>
                <Text style={[styles.stationName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.stationFreq, { color: colors.mutedForeground }]}>{item.freq}</Text>
              </View>
              <View style={[styles.playBtn, { backgroundColor: isPlaying ? colors.primary : colors.primary + "18" }]}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={18}
                  color={isPlaying ? colors.primaryForeground : colors.primary}
                />
              </View>
            </TouchableOpacity>
          );
        }}
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
  nowPlaying: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  nowPlayingDot: { padding: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nowPlayingText: { fontSize: 13, fontFamily: "Tajawal_500Medium" },
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
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1 },
  stationName: { fontSize: 15, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  stationFreq: { fontSize: 12, fontFamily: "Tajawal_400Regular", textAlign: "right", marginTop: 2 },
  playBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
});
