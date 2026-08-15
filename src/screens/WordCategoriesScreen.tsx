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
import { plural } from "../utils/plural";
import { ModeToggle, BrowseMode } from "../components/ModeToggle";

type Props = NativeStackScreenProps<RootStackParamList, "WordCategories">;

export function WordCategoriesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<BrowseMode>("browse");

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

  // Тап по категорії: тренування — сесія зі всіма словами; перегляд — список слів.
  function onCategory(key: string, title: string) {
    const ids = NOUNS.filter((n) => n.category === key).map((n) => n.id);
    if (ids.length === 0) return;
    if (mode === "browse") {
      navigation.navigate("BrowseList", { kind: "nouns", entryIds: ids, title });
    } else {
      navigation.navigate("WordSession", { title, entryIds: ids });
    }
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <ModeToggle mode={mode} onChange={setMode} />

      {/* Колода помилок — лише в режимі тренування */}
      {mode === "train" && (
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
      )}

      <Text style={styles.sectionLabel}>Категорії</Text>

      {CATEGORIES.filter((c) => !c.hiddenFromPartOfSpeech).map((c) => {
        const count = countInCategory(c.key);
        const title = `${c.emoji} ${c.title}`;
        return (
          <View key={c.key} style={[styles.catRow, { borderLeftColor: c.color }]}>
            <Pressable style={styles.catMain} onPress={() => onCategory(c.key, title)}>
              <Text style={styles.catEmoji}>{c.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.catTitle}>{c.title}</Text>
                <Text style={styles.catSub}>{count} {plural(count, "слово", "слова", "слів")}</Text>
              </View>
            </Pressable>
            {/* Кастомний підбір слів — лише в тренуванні (у перегляді завжди повний список) */}
            {mode === "train" && (
              <Pressable
                style={styles.editBtn}
                hitSlop={8}
                onPress={() => navigation.navigate("WordSelection", { category: c.key })}
              >
                <Text style={styles.editIcon}>✏️</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
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
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    marginBottom: theme.space(3),
  },
  catMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    padding: theme.space(4),
  },
  catEmoji: { fontSize: 26 },
  catTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  catSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  editBtn: {
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(4),
    alignSelf: "stretch",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.06)",
  },
  editIcon: { fontSize: 18 },
});
