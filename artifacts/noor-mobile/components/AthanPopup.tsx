import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Vibration,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ADHAN_SOUND_FILES,
  getAdhanSound,
} from "@/utils/notifications";

interface AthanPopupProps {
  visible: boolean;
  prayerName: string;
  prayerKey: string;
  withSound: boolean;
  onClose: () => void;
}

export function AthanPopup({
  visible,
  prayerName,
  prayerKey,
  withSound,
  onClose,
}: AthanPopupProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const haloAnim = useRef(new Animated.Value(0)).current;
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!visible) return;

    Vibration.vibrate([0, 600, 300, 600]);

    Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    if (withSound) {
      (async () => {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            shouldDuckAndroid: false,
            staysActiveInBackground: false,
          });
          const soundId = await getAdhanSound();
          const asset = ADHAN_SOUND_FILES[soundId] || ADHAN_SOUND_FILES.azan1;
          const { sound } = await Audio.Sound.createAsync(asset, {
            shouldPlay: true,
            volume: 1.0,
          });
          soundRef.current = sound;
          setIsPlaying(true);
          sound.setOnPlaybackStatusUpdate((s: any) => {
            if (s.didJustFinish) setIsPlaying(false);
          });
        } catch (e) {
          console.warn("Athan playback error", e);
        }
      })();
    }

    return () => {
      haloAnim.stopAnimation();
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setIsPlaying(false);
    };
  }, [visible, withSound]);

  const togglePlay = async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const haloScale = haloAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const haloOpacity = haloAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <LinearGradient
          colors={["#16120F", "#3D2007", "#16120F"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <Animated.View
              style={[
                styles.halo,
                { transform: [{ scale: haloScale }], opacity: haloOpacity },
              ]}
            />
            <View style={styles.logoCircle}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.label}>حان الآن وقت صلاة</Text>
          <Text style={styles.prayer}>{prayerName}</Text>
          <Text style={styles.body}>
            {prayerKey === "fajr"
              ? "الصلاة خير من النوم"
              : "حيّ على الصلاة، حيّ على الفلاح"}
          </Text>

          {withSound && (
            <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color="#16120F"
              />
              <Text style={styles.playText}>
                {isPlaying ? "إيقاف الأذان" : "تشغيل الأذان"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#FDFBF0" />
            <Text style={styles.closeText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  logoWrap: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  halo: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,224,138,0.25)",
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#16120F",
    borderWidth: 3,
    borderColor: "#C19A6B",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFE08A",
    shadowOpacity: 0.6,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  logo: {
    width: 130,
    height: 130,
  },
  label: {
    fontFamily: "Tajawal_500Medium",
    fontSize: 18,
    color: "#FDFBF0",
    marginBottom: 4,
    opacity: 0.85,
  },
  prayer: {
    fontFamily: "Amiri_700Bold",
    fontSize: 56,
    color: "#FFE08A",
    marginBottom: 12,
    textShadowColor: "rgba(255,224,138,0.7)",
    textShadowRadius: 20,
  },
  body: {
    fontFamily: "Amiri_400Regular",
    fontSize: 22,
    color: "#FDFBF0",
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.95,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFE08A",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 16,
  },
  playText: {
    fontFamily: "Tajawal_700Bold",
    fontSize: 16,
    color: "#16120F",
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(253,251,240,0.4)",
  },
  closeText: {
    fontFamily: "Tajawal_500Medium",
    fontSize: 14,
    color: "#FDFBF0",
  },
});
