import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { NOUNS } from "../data/nouns";
import { CATEGORIES } from "../data/categories";
import { loadProgress, getMistakeIds } from "../utils/progress";

type Props = NativeStackScreenProps<RootStackParamList, "WordCategories">;

export function WordCategoriesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());

  // Оновлюємо колоду помилок щоразу, коли екран знову у фокусі
  // (напр. після завершення сесії, де щось позначили "не знаю").
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProgress().then((p: Record<string, CardProgress>) => {
        if (alive) setMistakeIds(getMistakeIds(p));
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const countInCategory = (key: string) => NOUNS.filter((n) => n.category === key).length;
  const mistakeCount = mistakeIds.size;

  function startMistakes() {
    const ids = NOUNS.filter((n) => mistakeIds.has(n.id)).map((n) => n.id);
    if (ids.length === 0) return;
    navigation.navigate("WordSession", { title: "Повторити помилки", entryIds: ids });
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      {/* Колода помилок */}
      <Pressable
        style={[styles.mistakeCard, mistakeCount === 0 && styles.mistakeCardEmpty]}
        onPress={startMistakes}
        disabled={mistakeCount === 0}
      >
        <Text style={styles.mistakeEmoji}>🔁</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.mistakeTitle}>Повторити помилки</Text>
          <Text style={styles.mistakeSub}>
            {mistakeCount === 0
              ? "Поки що немає слів на повторення"
              : `${mistakeCount} ${plural(mistakeCount, "слово", "слова", "слів")} чекає`}
          </Text>
        </View>
        {mistakeCount > 0 && <Text style={styles.mistakeBadge}>{mistakeCount}</Text>}
      </Pressable>

      <Text style={styles.sectionLabel}>Категорії</Text>

      {CATEGORIES.map((c) => {
        const count = countInCategory(c.key);
        return (
          <Pressable
            key={c.key}
            style={[styles.catRow, { borderLeftColor: c.color }]}
            onPress={() => navigation.navigate("WordSelection", { category: c.key })}
          >
            <Text style={styles.catEmoji}>{c.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.catTitle}>{c.title}</Text>
              <Text style={styles.catSub}>{count} {plural(count, "слово", "слова", "слів")}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Українська множина: 1 слово / 2 слова / 5 слів
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  mistakeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.coral,
    padding: theme.space(4),
  },
  mistakeCardEmpty: { opacity: 0.5, borderColor: theme.colors.textFaint },
  mistakeEmoji: { fontSize: 28 },
  mistakeTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  mistakeSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  mistakeBadge: {
    color: "#1a1020",
    backgroundColor: theme.colors.coral,
    fontWeight: "800",
    fontSize: 15,
    minWidth: 30,
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  sectionLabel: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: theme.space(6),
    marginBottom: theme.space(3),
    marginLeft: theme.space(1),
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    padding: theme.space(4),
    marginBottom: theme.space(3),
  },
  catEmoji: { fontSize: 26 },
  catTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  catSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  chevron: { color: theme.colors.textFaint, fontSize: 28, fontWeight: "300" },
});
