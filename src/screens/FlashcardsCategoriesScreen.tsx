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

export function FlashcardsCategoriesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<FlashcardStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadFlashcardStats().then((s) => {
        if (alive) setStats(s);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const accuracy =
    stats && stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : null;

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <Text style={styles.intro}>
        Обери правильну форму з двох варіантів. Обидва варіанти — справжні форми того самого слова,
        тож зайвого не запам'ятаєш.
      </Text>

      {stats && stats.totalAnswered > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>точність</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalAnswered}</Text>
            <Text style={styles.statLabel}>відповідей</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.bestStreak}</Text>
            <Text style={styles.statLabel}>найкраща серія</Text>
          </View>
        </View>
      )}

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  intro: { color: theme.colors.textDim, fontSize: 14, lineHeight: 20, marginBottom: theme.space(4) },
  statsCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space(4),
    marginBottom: theme.space(4),
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: theme.colors.honey, fontSize: 22, fontWeight: "900" },
  statLabel: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.08)" },
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
