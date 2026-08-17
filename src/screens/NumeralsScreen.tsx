import React, { useCallback, useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { NOUNS } from "../data/nouns";
import { ADJECTIVES } from "../data/adjectives";
import { CARDINALS } from "../data/cardinals";
import { plural } from "../utils/plural";
import { ModeToggle, BrowseMode } from "../components/ModeToggle";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";
import { ALL_NUMERAL_IDS } from "../utils/numeralEntries";

type Props = NativeStackScreenProps<RootStackParamList, "Numerals">;

// Розділ "Числівники" — єдина точка входу для всіх трьох видів:
//  • кількісні (jeden/dva/pět…) — власна картка NumeralCard, kind "cardinal"
//  • порядкові (перший, другий…) — рендер/датасет прикметників, kind "ordinal"
//  • сотні/тисячі/мільйони (sto/tisíc/milion/miliarda) — рендер/датасет іменників
// Порядкові й сотні-тисячі приховані зі своїх "рідних" розділів (Прикметники/
// Іменники) через hiddenFromPartOfSpeech, щоб не дублюватись. Прогрес усіх
// трьох видів пишеться в ОДНЕ спільне сховище PROGRESS_KEYS.numerals — це
// свідомий вибір: розділ "Числівники" один концептуально, лічильник помилок
// теж один, незалежно від того, який рушій рендерить конкретну картку.

const ORDINAL_IDS = ADJECTIVES.filter((a) => a.category === "ordinal").map((a) => a.id);
const NUMBER_IDS = NOUNS.filter((n) => n.category === "numbers").map((n) => n.id);
const CARDINAL_IDS = CARDINALS.map((c) => c.id);

interface Item {
  key: "cardinal" | "ordinal" | "hundreds";
  emoji: string;
  title: string;
  hint: string;
  count: number;
  color: string;
}

const ITEMS: Item[] = [
  {
    key: "cardinal",
    emoji: "🔢",
    title: "Кількісні",
    hint: "jeden, dva, pět… (окреме відмінювання)",
    count: CARDINAL_IDS.length,
    color: theme.colors.honey,
  },
  {
    key: "ordinal",
    emoji: "🥇",
    title: "Порядкові",
    hint: "перший, другий… (зразок mladý/jarní)",
    count: ORDINAL_IDS.length,
    color: theme.colors.lilac,
  },
  {
    key: "hundreds",
    emoji: "💯",
    title: "Сотні, тисячі, мільйони",
    hint: "sto, tisíc, milion, miliarda (звичайні іменники)",
    count: NUMBER_IDS.length,
    color: theme.colors.mint,
  },
];

export function NumeralsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<BrowseMode>("browse");
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());

  // Один спільний лічильник помилок на весь розділ (як категорії всередині
  // "Прикметники" ділять один store) — читаємо PROGRESS_KEYS.numerals і лишаємо
  // лише id, що належать розділу числівників.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProgressFrom(PROGRESS_KEYS.numerals).then((p: Record<string, CardProgress>) => {
        if (!alive) return;
        const all = getMistakeIds(p);
        const numeralOnly = new Set([...all].filter((id) => ALL_NUMERAL_IDS.includes(id)));
        setMistakeIds(numeralOnly);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const mistakeCount = mistakeIds.size;

  function startMistakes() {
    const ids = ALL_NUMERAL_IDS.filter((id) => mistakeIds.has(id));
    if (ids.length === 0) return;
    navigation.navigate("DeclSession", {
      title: "Повторити помилки",
      kind: "numeral-mixed",
      entryIds: ids,
    });
  }

  function open(item: Item) {
    if (item.key === "cardinal") {
      const title = "🔢 Кількісні";
      if (mode === "browse") {
        navigation.navigate("BrowseList", { kind: "cardinals", entryIds: CARDINAL_IDS, title });
      } else {
        navigation.navigate("DeclSession", { title, kind: "cardinal", entryIds: CARDINAL_IDS });
      }
    } else if (item.key === "ordinal") {
      const title = "🥇 Порядкові";
      if (mode === "browse") {
        navigation.navigate("BrowseList", { kind: "adjectives", entryIds: ORDINAL_IDS, title });
      } else {
        navigation.navigate("DeclSession", { title, kind: "ordinal", entryIds: ORDINAL_IDS });
      }
    } else if (item.key === "hundreds") {
      const title = "💯 Сотні, тисячі, мільйони";
      if (mode === "browse") {
        navigation.navigate("BrowseList", { kind: "nouns", entryIds: NUMBER_IDS, title });
      } else {
        navigation.navigate("WordSession", {
          title,
          entryIds: NUMBER_IDS,
          storageKey: PROGRESS_KEYS.numerals,
        });
      }
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

      {ITEMS.map((item) => (
        <Pressable
          key={item.key}
          style={[styles.row, { borderLeftColor: item.color }]}
          onPress={() => open(item)}
        >
          <Text style={styles.emoji}>{item.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.hint}>{item.hint}</Text>
            <Text style={styles.sub}>
              {item.count} {plural(item.count, "слово", "слова", "слів")}
            </Text>
          </View>
        </Pressable>
      ))}
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
