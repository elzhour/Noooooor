import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ref, get } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

interface RankRow {
  uid: string;
  name: string;
  governorateName: string;
  score: number;
}

export default function RankingsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await get(ref(rtdb, "users"));
      const all = (snap.val() || {}) as Record<string, any>;
      const list: RankRow[] = Object.entries(all).map(([uid, data]) => {
        const profile = data?.profile || {};
        const tasbihTotals = data?.tasbih_totals || {};
        let score = 0;
        for (const v of Object.values(tasbihTotals)) {
          if (typeof v === "number") score += v;
        }
        return {
          uid,
          name: profile.name || "مستخدم",
          governorateName: profile.governorateName || "",
          score,
        };
      });
      list.sort((a, b) => b.score - a.score);
      setRows(list.slice(0, 100));
    } catch (e) {
      console.warn("rankings load", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>قائمة الترتيب</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          أفضل المستخدمين في الذكر والتسبيح
        </Text>
      </View>

      {loading && rows.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.uid}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
          renderItem={({ item, index }) => {
            const isMe = user?.uid === item.uid;
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
            return (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: isMe ? colors.primary + "22" : colors.card,
                    borderColor: isMe ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={[styles.rank, { backgroundColor: colors.primary + "33" }]}>
                  {medal ? (
                    <Text style={{ fontSize: 18 }}>{medal}</Text>
                  ) : (
                    <Text style={[styles.rankText, { color: colors.primary }]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={[styles.name, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {item.name} {isMe ? "(أنت)" : ""}
                  </Text>
                  {item.governorateName ? (
                    <Text style={[styles.gov, { color: colors.mutedForeground }]}>
                      {item.governorateName}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.scoreWrap}>
                  <Text style={[styles.score, { color: colors.primary }]}>
                    {item.score.toLocaleString("ar-EG")}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
                    تسبيحة
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: "center" }}>
              <Ionicons name="trophy-outline" size={64} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Tajawal_500Medium" }}>
                ابدأ بالتسبيح لتدخل قائمة الترتيب
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
        />
      )}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
  },
  name: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
  },
  gov: {
    fontSize: 13,
    fontFamily: "Tajawal_400Regular",
    textAlign: "right",
    marginTop: 2,
  },
  scoreWrap: { alignItems: "center" },
  score: {
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
  },
  scoreLabel: {
    fontSize: 11,
    fontFamily: "Tajawal_400Regular",
  },
});
