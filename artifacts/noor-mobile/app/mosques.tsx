import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import * as Location from "expo-location";

interface Mosque {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180, p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)} م` : `${(m / 1000).toFixed(1)} كم`;
}

export default function MosquesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  const findMosques = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("يجب السماح بالوصول إلى الموقع لإيجاد المساجد القريبة");
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = loc.coords;
      setUserLoc({ lat, lng });

      const r = 1500;
      const query = `
        [out:json][timeout:15];
        node["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});
        out body 30;
      `;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain" },
      });
      const json = await res.json();
      const items: Mosque[] = (json.elements || []).map((el: any) => ({
        id: String(el.id),
        name: el.tags?.name || el.tags?.["name:ar"] || "مسجد",
        lat: el.lat,
        lng: el.lon,
        distance: haversine(lat, lng, el.lat, el.lon),
      })).sort((a: Mosque, b: Mosque) => a.distance - b.distance);
      setMosques(items);
    } catch {
      setError("حدث خطأ أثناء البحث. تحقق من الإنترنت وحاول مجدداً");
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (mosque: Mosque) => {
    const url = `https://maps.google.com/maps?q=${mosque.lat},${mosque.lng}`;
    Linking.openURL(url).catch(() => {});
  };

  const getDirections = (mosque: Mosque) => {
    if (!userLoc) return;
    const url = `https://maps.google.com/maps?saddr=${userLoc.lat},${userLoc.lng}&daddr=${mosque.lat},${mosque.lng}&travelmode=walking`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>المساجد القريبة</Text>
      </View>

      {mosques.length === 0 && !loading && (
        <View style={styles.center}>
          <Text style={styles.mosqueIcon}>🕌</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>ابحث عن مساجد قريبة</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            سيتم تحديد موقعك وإيجاد المساجد في نطاق 1.5 كم
          </Text>
          {error && (
            <Text style={[styles.errorText, { color: "#ef4444" }]}>{error}</Text>
          )}
          <TouchableOpacity
            onPress={findMosques}
            style={[styles.searchBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="location" size={18} color={colors.primaryForeground} />
            <Text style={[styles.searchBtnText, { color: colors.primaryForeground }]}>ابحث الآن</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>جاري البحث عن مساجد قريبة...</Text>
        </View>
      )}

      {mosques.length > 0 && (
        <FlatList
          data={mosques}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderText, { color: colors.mutedForeground }]}>
                وجدنا {mosques.length} مسجد في نطاق 1.5 كم
              </Text>
              <TouchableOpacity onPress={findMosques}>
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          renderItem={({ item, index }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardLeft}>
                <View style={[styles.rank, { backgroundColor: index < 3 ? colors.primary + "18" : colors.secondary }]}>
                  <Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.mosqueName, { color: colors.foreground }]}>{item.name}</Text>
                <View style={styles.distRow}>
                  <Ionicons name="location" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.distText, { color: colors.mutedForeground }]}>{fmtDist(item.distance)}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => getDirections(item)}
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="navigate" size={14} color={colors.primaryForeground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openInMaps(item)}
                  style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                >
                  <Ionicons name="map" size={14} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16, padding: 24 },
  mosqueIcon: { fontSize: 72 },
  emptyTitle: { fontSize: 20, fontFamily: "Tajawal_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Tajawal_400Regular", textAlign: "center", lineHeight: 22 },
  errorText: { fontSize: 13, fontFamily: "Tajawal_500Medium", textAlign: "center" },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  searchBtnText: { fontSize: 16, fontFamily: "Tajawal_700Bold" },
  loadingText: { fontFamily: "Tajawal_500Medium", fontSize: 14 },
  list: { padding: 16, gap: 10 },
  listHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listHeaderText: { fontSize: 13, fontFamily: "Tajawal_500Medium" },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardLeft: {},
  rank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: { fontSize: 13, fontFamily: "Tajawal_700Bold" },
  cardInfo: { flex: 1 },
  mosqueName: { fontSize: 14, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  distRow: { flexDirection: "row-reverse", alignItems: "center", gap: 4, marginTop: 2 },
  distText: { fontSize: 12, fontFamily: "Tajawal_400Regular" },
  cardActions: { flexDirection: "row", gap: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
});
