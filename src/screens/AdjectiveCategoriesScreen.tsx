import React, { useCallback, useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { EditButton } from "../components/EditButton";
import { MistakeDeckCard } from "../components/MistakeDeckCard";
import { PosEmoji } from "../components/PosEmoji";
import { ADJECTIVES } from "../data/adjectives";
import { ADJ_CATEGORIES } from "../data/adjectiveCategories";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";
import { plural } from "../utils/plural";
import { ModeToggle, BrowseMode } from "../components/ModeToggle";

type Props = NativeStackScreenProps<RootStackParamList, "AdjectiveCategories">;

export function AdjectiveCategoriesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<BrowseMode>("browse");

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProgressFrom(PROGRESS_KEYS.adjectives).then((p: Record<string, CardProgress>) => {
        if (alive) setMistakeIds(getMistakeIds(p));
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const countInCategory = (key: string) => ADJECTIVES.filter((a) => a.category === key).length;
  const mistakeCount = mistakeIds.size;

  function startMistakes() {
    const ids = ADJECTIVES.filter((a) => mistakeIds.has(a.id)).map((a) => a.id);
    if (ids.length === 0) return;
    navigation.navigate("DeclSession", { title: "Повторити помилки", kind: "adjective", entryIds: ids });
  }

  function onCategory(key: string, title: string) {
    const ids = ADJECTIVES.filter((a) => a.category === key).map((a) => a.id);
    if (ids.length === 0) return;
    if (mode === "browse") {
      navigation.navigate("BrowseList", { kind: "adjectives", entryIds: ids, title });
    } else {
      navigation.navigate("DeclSession", { title, kind: "adjective", entryIds: ids });
    }
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "train" && (
        <MistakeDeckCard count={mistakeCount} wordForms={["слово", "слова", "слів"]} onPress={startMistakes} />
      )}

      <Text style={styles.sectionLabel}>Категорії</Text>

      {ADJ_CATEGORIES.filter((c) => !c.hiddenFromPartOfSpeech).map((c) => {
        const count = countInCategory(c.key);
        const title = c.title;
        return (
          <View key={c.key} style={[styles.catRow, { borderLeftColor: c.color }]}>
            <Pressable style={styles.catMain} onPress={() => onCategory(c.key, title)}>
              <PosEmoji name={c.icon} size={26} />
              <View style={{ flex: 1 }}>
                <Text style={styles.catTitle}>{c.title}</Text>
                <Text style={styles.catHint}>{c.hint}</Text>
                <Text style={styles.catSub}>{count} {plural(count, "слово", "слова", "слів")}</Text>
              </View>
            </Pressable>
            {mode === "train" && (
                              <EditButton onPress={() => navigation.navigate("AdjectiveSelection", { category: c.key })} />
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
  catHint: { color: theme.colors.textFaint, fontSize: 12, marginTop: 1 },
  catSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 3 },
});
