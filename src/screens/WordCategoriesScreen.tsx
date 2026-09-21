import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { EditButton } from "../components/EditButton";
import { MistakeDeckCard } from "../components/MistakeDeckCard";
import { PosEmoji } from "../components/PosEmoji";
import { NOUNS } from "../data/nouns";
import { CATEGORIES } from "../data/categories";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";
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
      loadProgressFrom(PROGRESS_KEYS.nouns).then((p: Record<string, CardProgress>) => {
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
        <MistakeDeckCard count={mistakeCount} wordForms={["слово", "слова", "слів"]} onPress={startMistakes} />
      )}

      <Text style={styles.sectionLabel}>Категорії</Text>

      {CATEGORIES.filter((c) => !c.hiddenFromPartOfSpeech).map((c) => {
        const count = countInCategory(c.key);
        const title = c.title;
        return (
          <View key={c.key} style={[styles.catRow, { borderLeftColor: c.color }]}>
            <Pressable style={styles.catMain} onPress={() => onCategory(c.key, title)}>
              <PosEmoji name={c.icon} size={26} />
              <View style={{ flex: 1 }}>
                <Text style={styles.catTitle}>{c.title}</Text>
                <Text style={styles.catSub}>{count} {plural(count, "слово", "слова", "слів")}</Text>
              </View>
            </Pressable>
            {/* Кастомний підбір слів — лише в тренуванні (у перегляді завжди повний список) */}
            {mode === "train" && (
                              <EditButton onPress={() => navigation.navigate("WordSelection", { category: c.key })} />
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
  catTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  catSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
