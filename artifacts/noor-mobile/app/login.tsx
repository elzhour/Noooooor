import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUserProfile } from "@/lib/rtdb";
import { EGYPT_GOVERNORATES, type Governorate } from "@/lib/constants";
import { useColors } from "@/hooks/useColors";

type Step =
  | "welcome"
  | "signup-email"
  | "signup-password"
  | "signup-city"
  | "login-email"
  | "login-password";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();

  const [step, setStep] = useState<Step>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedGov, setSelectedGov] = useState<Governorate | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!selectedGov) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await saveUserProfile(cred.user.uid, {
        uid: cred.user.uid,
        name: email.split("@")[0],
        email: email.trim(),
        photo: "",
        governorateId: selectedGov.id,
        governorateName: selectedGov.name,
        lat: selectedGov.lat,
        lng: selectedGov.lng,
        joinedAt: Date.now(),
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = mapAuthError(e?.code) || "حدث خطأ أثناء إنشاء الحساب";
      Alert.alert("خطأ", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = mapAuthError(e?.code) || "بيانات الدخول غير صحيحة";
      Alert.alert("خطأ", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.muted]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: colors.foreground }]}>نور</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              تطبيقك الإسلامي اليومي
            </Text>
          </View>

          {step === "welcome" && (
            <View style={styles.actions}>
              <PrimaryButton
                title="إنشاء حساب جديد"
                icon="person-add"
                onPress={() => setStep("signup-email")}
                colors={colors}
              />
              <SecondaryButton
                title="تسجيل الدخول"
                icon="log-in"
                onPress={() => setStep("login-email")}
                colors={colors}
              />
            </View>
          )}

          {(step === "signup-email" || step === "login-email") && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.foreground }]}>البريد الإلكتروني</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
              <PrimaryButton
                title="التالي"
                icon="arrow-back"
                onPress={() =>
                  setStep(step === "signup-email" ? "signup-password" : "login-password")
                }
                colors={colors}
                disabled={!email.includes("@")}
              />
              <BackButton onPress={() => setStep("welcome")} colors={colors} />
            </View>
          )}

          {(step === "signup-password" || step === "login-password") && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {step === "signup-password" ? "اختر كلمة سر قوية" : "كلمة المرور"}
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.foreground }]}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
              {step === "signup-password" && (
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                  6 أحرف على الأقل
                </Text>
              )}
              <PrimaryButton
                title={step === "signup-password" ? "التالي" : "دخول"}
                icon={step === "signup-password" ? "arrow-back" : "log-in"}
                onPress={() =>
                  step === "signup-password" ? setStep("signup-city") : handleSignIn()
                }
                colors={colors}
                disabled={password.length < 6 || loading}
                loading={loading && step === "login-password"}
              />
              <BackButton
                onPress={() =>
                  setStep(step === "signup-password" ? "signup-email" : "login-email")
                }
                colors={colors}
              />
            </View>
          )}

          {step === "signup-city" && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                اختر محافظتك
              </Text>
              <Text style={[styles.hint, { color: colors.mutedForeground, marginBottom: 12 }]}>
                لحساب مواقيت الصلاة بدقة
              </Text>
              <View
                style={{
                  maxHeight: 320,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <FlatList
                  data={EGYPT_GOVERNORATES}
                  keyExtractor={(g) => g.id}
                  renderItem={({ item }) => {
                    const isSelected = selectedGov?.id === item.id;
                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedGov(item)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          backgroundColor: isSelected ? colors.primary + "22" : "transparent",
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 16,
                            fontFamily: "Tajawal_500Medium",
                            flex: 1,
                            textAlign: "right",
                          }}
                        >
                          {item.name}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
              <PrimaryButton
                title="إنشاء الحساب"
                icon="checkmark"
                onPress={handleSignUp}
                colors={colors}
                disabled={!selectedGov || loading}
                loading={loading}
              />
              <BackButton onPress={() => setStep("signup-password")} colors={colors} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PrimaryButton({
  title,
  icon,
  onPress,
  colors,
  disabled,
  loading,
}: {
  title: string;
  icon: any;
  onPress: () => void;
  colors: any;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btnPrimary,
        { backgroundColor: colors.primary, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={styles.btnPrimaryText}>{title}</Text>
          <Ionicons name={icon} size={20} color="#fff" />
        </>
      )}
    </TouchableOpacity>
  );
}

function SecondaryButton({
  title,
  icon,
  onPress,
  colors,
}: {
  title: string;
  icon: any;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btnSecondary, { borderColor: colors.primary }]}
    >
      <Text style={[styles.btnSecondaryText, { color: colors.primary }]}>{title}</Text>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </TouchableOpacity>
  );
}

function BackButton({ onPress, colors }: { onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backBtn}>
      <Ionicons name="arrow-forward" size={18} color={colors.mutedForeground} />
      <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>رجوع</Text>
    </TouchableOpacity>
  );
}

function mapAuthError(code?: string): string | null {
  switch (code) {
    case "auth/email-already-in-use":
      return "هذا البريد مسجل بالفعل، جرّب تسجيل الدخول";
    case "auth/invalid-email":
      return "البريد الإلكتروني غير صحيح";
    case "auth/weak-password":
      return "كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "البريد أو كلمة المرور غير صحيحة";
    case "auth/network-request-failed":
      return "تأكد من الاتصال بالإنترنت وأعد المحاولة";
    case "auth/too-many-requests":
      return "محاولات كثيرة، انتظر قليلاً وأعد المحاولة";
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { width: 100, height: 100, borderRadius: 24, marginBottom: 16 },
  title: {
    fontSize: 42,
    fontFamily: "Amiri_700Bold",
    marginBottom: 4,
  },
  subtitle: { fontSize: 16, fontFamily: "Tajawal_400Regular" },
  actions: { gap: 12 },
  form: { gap: 12 },
  label: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
    marginBottom: 4,
  },
  hint: { fontSize: 13, fontFamily: "Tajawal_400Regular", textAlign: "right" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  btnSecondaryText: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
  },
});
