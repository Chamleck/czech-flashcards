import React, { useCallback, useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { ADVERBS } from "../data/adverbs";
import { plural } from "../utils/plural";
import { ModeToggle, BrowseMode } from "../components/ModeToggle";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";

type Props = NativeStackScreenProps<RootStackParamList, "Adverbs">;

// Розділ "Прислівники" — на відміну від прийменників, тут нема відмінка для
// групування (незмінна лексика без керування), тому один плоский список,
// не декілька груп. Механіка (Тренування/Перегляд, self-report SRS,
// "Повторити помилки") — та сама, що в прийменників.
const ALL_ADVERB_IDS = ADVERBS.map((a) => a.id);

export function AdverbsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<BrowseMode>("browse");
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProgressFrom(PROGRESS_KEYS.adverbs).then((p: Record<string, CardProgress>) => {
        if (!alive) return;
        setMistakeIds(new Set(getMistakeIds(p)));
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const mistakeCount = mistakeIds.size;

  function startMistakes() {
    const ids = ALL_ADVERB_IDS.filter((id) => mistakeIds.has(id));
    if (ids.length === 0) return;
    navigation.navigate("AdverbSession", { title: "Повторити помилки", entryIds: ids });
  }

  function openAll() {
    const title = "Прислівники місця";
    if (mode === "browse") {
      navigation.navigate("BrowseList", { kind: "adverbs", entryIds: ALL_ADVERB_IDS, title });
    } else {
      navigation.navigate("AdverbSession", { title, entryIds: ALL_ADVERB_IDS });
    }
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <ModeToggle mode={mode} onChange={setMode} />

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

      <Pressable style={[styles.row, { borderLeftColor: theme.colors.lilac }]} onPress={openAll}>
        <Text style={styles.emoji}>🗺️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Де? Куди? Звідки?</Text>
          <Text style={styles.hint}>vlevo / doleva / zleva тощо</Text>
          <Text style={styles.sub}>
            {ALL_ADVERB_IDS.length} {plural(ALL_ADVERB_IDS.length, "прислівник", "прислівники", "прислівників")}
          </Text>
        </View>
      </Pressable>
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
    marginBottom: theme.space(3),
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    padding: theme.space(4),
    marginBottom: theme.space(3),
  },
  emoji: { fontSize: 32 },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  hint: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  sub: { color: theme.colors.textFaint, fontSize: 12, marginTop: 4 },
});
