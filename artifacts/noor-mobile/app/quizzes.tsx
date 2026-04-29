import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

interface Answer { answer: string; t: number; }
interface Question { id: number; q: string; answers: Answer[]; }
interface LevelsData { level1: Question[]; level2: Question[]; level3: Question[]; }
interface Topic { name: string; slug: string; levelsData: LevelsData; }
interface Category { id: number; arabicName: string; englishName: string; description: string; topics: Topic[]; }
interface QuizData { description: string; mainCategories: Category[]; }

const CAT_COLORS = ["#1b4332", "#1e3a6e", "#4a2040", "#6b3a0f", "#3a1a5c", "#1a4a3a"];
const LEVEL_LABELS: Record<string, string> = { level1: "المستوى الأول", level2: "المستوى الثاني", level3: "المستوى الثالث" };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr] as T[];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = a[i]!;
    a[i] = a[j]!;
    a[j] = temp;
  }
  return a;
}

export default function QuizzesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<"cats" | "topics" | "levels" | "quiz" | "results">("cats");
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetch("https://noor-web.vercel.app/data/quizzes.json")
      .then((r) => r.json())
      .then((d) => { setQuizData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const startQuiz = (topic: Topic, level: string) => {
    const rawQs: Question[] = (topic.levelsData as any)[level] || [];
    const qs = shuffle(rawQs).slice(0, 10).map((q) => ({
      ...q,
      answers: shuffle(q.answers),
    }));
    setQuestions(qs);
    setCurrent(0);
    setChosen(null);
    setScore(0);
    setAnswered(false);
    setScreen("quiz");
  };

  const handleAnswer = (idx: number, isCorrect: boolean) => {
    if (answered) return;
    setChosen(idx);
    setAnswered(true);
    if (isCorrect) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setScreen("results");
      return;
    }
    setChosen(null);
    setAnswered(false);
    setCurrent((c) => c + 1);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>جاري تحميل الأسئلة...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === "results") {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setScreen("cats")} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="home" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>النتيجة</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={[styles.scoreText, { color: colors.foreground }]}>{score} / {questions.length}</Text>
          <Text style={[styles.scorePct, { color: pct >= 70 ? "#4CAF50" : pct >= 50 ? colors.primary : "#ef4444" }]}>
            {pct}%
          </Text>
          <Text style={[styles.scoreMsg, { color: colors.mutedForeground }]}>
            {pct >= 80 ? "ممتاز! أحسنت 🌟" : pct >= 60 ? "جيد! استمر في التعلم 📚" : "حاول مرة أخرى 💪"}
          </Text>
          <View style={styles.resultBtns}>
            <TouchableOpacity
              onPress={() => startQuiz(selectedTopic!, selectedLevel)}
              style={[styles.resultBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.resultBtnText, { color: colors.primaryForeground }]}>إعادة المحاولة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScreen("cats")}
              style={[styles.resultBtn, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Text style={[styles.resultBtnText, { color: colors.foreground }]}>العودة للرئيسية</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === "quiz" && questions.length > 0) {
    const q = questions[current];
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setScreen("cats")} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((current + 1) / questions.length) * 100}%` }]} />
          </View>
          <Text style={[styles.qCounter, { color: colors.mutedForeground }]}>{current + 1}/{questions.length}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.quizContent}>
          <View style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.qText, { color: colors.foreground }]}>{q.q}</Text>
          </View>
          <View style={styles.answers}>
            {q.answers.map((ans, idx) => {
              const isChosen = chosen === idx;
              const isCorrect = ans.t === 1;
              let bg = colors.card;
              let border = colors.border;
              if (answered) {
                if (isCorrect) { bg = "#4CAF5020"; border = "#4CAF50"; }
                else if (isChosen && !isCorrect) { bg = "#ef444420"; border = "#ef4444"; }
              }
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleAnswer(idx, isCorrect)}
                  style={[styles.answerBtn, { backgroundColor: bg, borderColor: border }]}
                >
                  <Text style={[styles.answerText, { color: colors.foreground }]}>{ans.answer}</Text>
                  {answered && isCorrect && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
                  {answered && isChosen && !isCorrect && <Ionicons name="close-circle" size={20} color="#ef4444" />}
                </TouchableOpacity>
              );
            })}
          </View>
          {answered && (
            <TouchableOpacity
              onPress={nextQuestion}
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
                {current + 1 >= questions.length ? "عرض النتيجة" : "السؤال التالي"}
              </Text>
              <Ionicons name="arrow-back" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === "topics" && selectedCat) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setScreen("cats")} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{selectedCat.arabicName}</Text>
        </View>
        <FlatList
          data={selectedCat.topics}
          keyExtractor={(t) => t.slug}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { setSelectedTopic(item); setScreen("levels"); }}
              style={[styles.topicCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.topicName, { color: colors.foreground }]}>{item.name}</Text>
              <View style={styles.levelPills}>
                {["level1", "level2", "level3"].map((l) => {
                  const count = (item.levelsData as any)[l]?.length || 0;
                  return count > 0 ? (
                    <View key={l} style={[styles.levelPill, { backgroundColor: colors.primary + "18" }]}>
                      <Text style={[styles.levelPillText, { color: colors.primary }]}>{count} سؤال</Text>
                    </View>
                  ) : null;
                })}
              </View>
              <Ionicons name="arrow-back" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  if (screen === "levels" && selectedTopic) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setScreen("topics")} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{selectedTopic.name}</Text>
        </View>
        <View style={styles.levelsContainer}>
          {(["level1", "level2", "level3"] as const).map((level, i) => {
            const count = (selectedTopic.levelsData as any)[level]?.length || 0;
            if (!count) return null;
            const levelColors = ["#2d6a4f", "#1e4d7b", "#5c2d7a"];
            return (
              <TouchableOpacity
                key={level}
                onPress={() => { setSelectedLevel(level); startQuiz(selectedTopic, level); }}
                style={[styles.levelCard, { backgroundColor: levelColors[i] }]}
              >
                <Text style={styles.levelName}>{LEVEL_LABELS[level]}</Text>
                <Text style={styles.levelCount}>{count} سؤال</Text>
                <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>المسابقات الإسلامية</Text>
      </View>
      {!quizData ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>❌</Text>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>تعذر تحميل البيانات</Text>
        </View>
      ) : (
        <FlatList
          data={quizData.mainCategories}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={() => (
            <View style={[styles.quizBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
              <Text style={styles.quizBannerEmoji}>🏅</Text>
              <Text style={[styles.quizBannerText, { color: colors.primary }]}>اختبر معلوماتك الإسلامية</Text>
            </View>
          )}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => { setSelectedCat(item); setScreen("topics"); }}
              style={[styles.catCard, { backgroundColor: CAT_COLORS[index % CAT_COLORS.length] }]}
            >
              <View style={styles.catInfo}>
                <Text style={styles.catName}>{item.arabicName}</Text>
                <Text style={styles.catDesc} numberOfLines={1}>{item.description}</Text>
              </View>
              <View style={[styles.topicsCount, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Text style={styles.topicsCountText}>{item.topics.length} موضوع</Text>
              </View>
            </TouchableOpacity>
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
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 24 },
  loadingText: { fontFamily: "Tajawal_500Medium", fontSize: 14 },
  list: { padding: 16, gap: 10 },
  quizBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  quizBannerEmoji: { fontSize: 28 },
  quizBannerText: { flex: 1, fontSize: 15, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  catCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  catInfo: { flex: 1 },
  catName: { fontSize: 17, fontFamily: "Tajawal_700Bold", color: "#fff", textAlign: "right" },
  catDesc: { fontSize: 12, fontFamily: "Tajawal_400Regular", color: "rgba(255,255,255,0.75)", textAlign: "right", marginTop: 2 },
  topicsCount: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  topicsCountText: { fontSize: 11, color: "#fff", fontFamily: "Tajawal_500Medium" },
  topicCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  topicName: { flex: 1, fontSize: 15, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  levelPills: { flexDirection: "row", gap: 4 },
  levelPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  levelPillText: { fontSize: 9, fontFamily: "Tajawal_500Medium" },
  levelsContainer: { padding: 16, gap: 12 },
  levelCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderRadius: 16,
  },
  levelName: { flex: 1, fontSize: 17, fontFamily: "Tajawal_700Bold", color: "#fff", textAlign: "right" },
  levelCount: { fontSize: 13, fontFamily: "Tajawal_500Medium", color: "rgba(255,255,255,0.8)" },
  quizContent: { padding: 16, gap: 14 },
  qCard: { borderRadius: 16, borderWidth: 1, padding: 20 },
  qText: { fontSize: 16, fontFamily: "Tajawal_700Bold", lineHeight: 28, textAlign: "right" },
  answers: { gap: 10 },
  answerBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  answerText: { flex: 1, fontSize: 14, fontFamily: "Tajawal_500Medium", textAlign: "right" },
  nextBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 15,
    borderRadius: 14,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Tajawal_700Bold" },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  qCounter: { fontSize: 13, fontFamily: "Tajawal_500Medium", minWidth: 40, textAlign: "center" },
  trophyEmoji: { fontSize: 72 },
  scoreText: { fontSize: 36, fontFamily: "Tajawal_700Bold" },
  scorePct: { fontSize: 24, fontFamily: "Tajawal_700Bold" },
  scoreMsg: { fontSize: 16, fontFamily: "Tajawal_500Medium" },
  resultBtns: { width: "100%", gap: 10, marginTop: 8 },
  resultBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  resultBtnText: { fontSize: 16, fontFamily: "Tajawal_700Bold" },
});
