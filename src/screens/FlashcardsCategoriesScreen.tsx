import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { FLASHCARD_CATEGORIES } from "../data/flashcardCategories";
import { loadFlashcardStats, FlashcardStats } from "../utils/flashcardStats";

type Props = NativeStackScreenProps<RootStackParamList, "FlashcardsCategories">;

type Segment = "round" | "total";

function pctOf(correct: number, answered: number): number | null {
  return answered > 0 ? Math.round((correct / answered) * 100) : null;
}

export function FlashcardsCategoriesScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  // Після щойно зіграного раунду відкриваємо вкладку "Цей раунд", інакше — "Загалом".
  const [segment, setSegment] = useState<Segment>(
    route.params?.justFinishedRound ? "round" : "total"
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadFlashcardStats().then((s) => {
        if (alive) setStats(s);
      });
      // Якщо повернулися одразу після зіграного раунду — показуємо "Цей раунд".
      if (route.params?.justFinishedRound) {
        setSegment("round");
        // прибираємо прапорець, щоб наступний звичайний захід відкривав "Загалом"
        navigation.setParams({ justFinishedRound: undefined });
      }
      return () => {
        alive = false;
      };
    }, [route.params?.justFinishedRound, navigation])
  );

  const hasAnyData = !!stats && stats.totalAnswered > 0;

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <Text style={styles.intro}>
        Обери правильну форму з двох варіантів. Обидва варіанти — справжні форми того самого слова,
        тож зайвого не запам'ятаєш.
      </Text>

      {/* Сегмент-контрол: перемикає, які дані показує плашка нижче. Це не свайп — тап. */}
      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentBtn, segment === "round" && styles.segmentBtnActive]}
          onPress={() => setSegment("round")}
        >
          <Text style={[styles.segmentText, segment === "round" && styles.segmentTextActive]}>
            Цей раунд
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, segment === "total" && styles.segmentBtnActive]}
          onPress={() => setSegment("total")}
        >
          <Text style={[styles.segmentText, segment === "total" && styles.segmentTextActive]}>
            Загалом
          </Text>
        </Pressable>
      </View>

      {/* Плашка статистики: те саме місце й габарити, змінюється лише вміст. */}
      <View style={styles.statsCard}>
        {segment === "round"
          ? renderRound(stats)
          : renderTotal(stats, hasAnyData)}
      </View>

      {FLASHCARD_CATEGORIES.map((c) => (
        <Pressable
          key={c.id}
          style={[styles.row, { borderLeftColor: c.color }, !c.ready && styles.rowDim]}
          onPress={() => c.ready && navigation.navigate("FlashcardsQuiz", { categoryId: c.id, title: c.title })}
        >
          <Text style={styles.emoji}>{c.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{c.title}</Text>
            <Text style={styles.sub}>{c.subtitle}</Text>
          </View>
          <Text style={styles.chevron}>{c.ready ? "›" : "🔒"}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function StatTriple({
  accuracy,
  answered,
  streak,
}: {
  accuracy: number | null;
  answered: number;
  streak: number;
}) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{accuracy === null ? "—" : `${accuracy}%`}</Text>
        <Text style={styles.statLabel}>точність</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{answered}</Text>
        <Text style={styles.statLabel}>відповідей</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{streak}</Text>
        <Text style={styles.statLabel}>найкраща серія</Text>
      </View>
    </View>
  );
}

// "Цей раунд" — остання завершена сесія + рядок особистого рекорду.
function renderRound(stats: FlashcardStats | null) {
  const r = stats?.lastRound ?? null;
  if (!r) {
    return <Text style={styles.placeholder}>Зіграй раунд, щоб побачити результат 🎯</Text>;
  }
  const best = stats?.bestRound ?? null;
  return (
    <>
      <StatTriple accuracy={pctOf(r.correct, r.answered)} answered={r.answered} streak={r.bestStreak} />
      {best && (
        <Text style={styles.recordRow}>
          🏆 Твій найкращий раунд: {best.correct}/{best.answered}
        </Text>
      )}
    </>
  );
}

// "Загалом" — накопичено за весь час.
function renderTotal(stats: FlashcardStats | null, hasAnyData: boolean) {
  if (!stats || !hasAnyData) {
    return <Text style={styles.placeholder}>Зіграй раунд, щоб побачити результат 🎯</Text>;
  }
  return (
    <StatTriple
      accuracy={pctOf(stats.totalCorrect, stats.totalAnswered)}
      answered={stats.totalAnswered}
      streak={stats.bestStreak}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  intro: { color: theme.colors.textDim, fontSize: 14, lineHeight: 20, marginBottom: theme.space(4) },
  segment: {
    flexDirection: "row",
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: 3,
    marginBottom: theme.space(3),
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: theme.space(2),
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  segmentBtnActive: { backgroundColor: theme.colors.honey },
  segmentText: { color: theme.colors.textDim, fontSize: 14, fontWeight: "700" },
  segmentTextActive: { color: "#3a1f00" },
  statsCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space(4),
    marginBottom: theme.space(4),
  },
  statsRow: { flexDirection: "row" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: theme.colors.honey, fontSize: 22, fontWeight: "900" },
  statLabel: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  placeholder: {
    color: theme.colors.textDim,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: theme.space(4),
  },
  recordRow: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: theme.space(3),
    paddingTop: theme.space(3),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    marginHorizontal: theme.space(4),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    padding: theme.space(4),
    marginBottom: theme.space(3),
  },
  rowDim: { opacity: 0.45 },
  emoji: { fontSize: 26, width: 32, textAlign: "center" },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  sub: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  chevron: { color: theme.colors.textFaint, fontSize: 24, fontWeight: "300" },
});
