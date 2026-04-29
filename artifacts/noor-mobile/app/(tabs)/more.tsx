import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج من حسابك؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const items: MenuItem[] = [
    {
      id: "qibla",
      label: "اتجاه القبلة",
      icon: "compass",
      color: "#0EA5E9",
      onPress: () => router.push("/qibla"),
    },
    {
      id: "settings",
      label: "إعدادات الإشعارات",
      icon: "notifications",
      color: "#C19A6B",
      onPress: () => router.push("/settings"),
    },
    {
      id: "asma",
      label: "أسماء الله الحسنى",
      icon: "sparkles",
      color: "#A855F7",
      onPress: () => router.push("/asma"),
    },
    {
      id: "hadith",
      label: "الأحاديث النبوية",
      icon: "book",
      color: "#10B981",
      onPress: () => router.push("/hadith"),
    },
    {
      id: "sunnah",
      label: "السنة النبوية",
      icon: "rose",
      color: "#EC4899",
      onPress: () => router.push("/sunnah"),
    },
    {
      id: "stories",
      label: "قصص الأنبياء",
      icon: "library",
      color: "#F59E0B",
      onPress: () => router.push("/prophetstories"),
    },
    {
      id: "history",
      label: "التاريخ الإسلامي",
      icon: "time",
      color: "#8B5CF6",
      onPress: () => router.push("/history"),
    },
    {
      id: "quizzes",
      label: "مسابقات إسلامية",
      icon: "trophy",
      color: "#F97316",
      onPress: () => router.push("/quizzes"),
    },
    {
      id: "radio",
      label: "الإذاعة الإسلامية",
      icon: "radio",
      color: "#EF4444",
      onPress: () => router.push("/radio"),
    },
    {
      id: "tv",
      label: "قنوات إسلامية",
      icon: "tv",
      color: "#3B82F6",
      onPress: () => router.push("/islamictv"),
    },
    {
      id: "mosques",
      label: "المساجد القريبة",
      icon: "location",
      color: "#14B8A6",
      onPress: () => router.push("/mosques"),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.avatar}
            resizeMode="contain"
          />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {profile?.name || user?.email?.split("@")[0] || "مستخدم"}
            </Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
              {user?.email || ""}
            </Text>
            {profile?.governorateName ? (
              <View style={styles.govBadge}>
                <Ionicons name="location" size={12} color={colors.primary} />
                <Text style={[styles.govText, { color: colors.primary }]}>
                  {profile.governorateName}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Menu grid */}
        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              style={[
                styles.gridItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.color + "22" }]}>
                <Ionicons name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={[styles.itemLabel, { color: colors.foreground }]} numberOfLines={2}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.signOutBtn, { borderColor: colors.destructive }]}
        >
          <Ionicons name="log-out" size={20} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>
            تسجيل الخروج
          </Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          نُور — الإصدار 1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    margin: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  userName: {
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
  },
  userEmail: {
    fontSize: 13,
    fontFamily: "Tajawal_400Regular",
    textAlign: "right",
    marginTop: 2,
  },
  govBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(193,154,107,0.15)",
  },
  govText: { fontSize: 12, fontFamily: "Tajawal_500Medium" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  gridItem: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 11,
    fontFamily: "Tajawal_500Medium",
    textAlign: "center",
    lineHeight: 14,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Tajawal_700Bold",
  },
  version: {
    fontSize: 12,
    fontFamily: "Tajawal_400Regular",
    textAlign: "center",
    marginTop: 8,
  },
});
