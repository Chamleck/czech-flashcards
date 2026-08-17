import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { NOUNS } from "../data/nouns";
import { VERBS } from "../data/verbs";
import { ADJECTIVES } from "../data/adjectives";
import { PRONOUNS } from "../data/pronouns";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";
import { plural } from "../utils/plural";
import { ALL_NUMERAL_IDS } from "../utils/numeralEntries";

type Props = NativeStackScreenProps<RootStackParamList, "WordsPartOfSpeech">;

interface POSTile {
  key: "nouns" | "verbs" | "adjectives" | "pronouns" | "numerals";
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  ready: boolean;
}

// Числівники винесено в окремий розділ. Порядкові живуть серед прикметників
// (category "ordinal"), а sto/tisíc серед іменників (category "numbers"), обидві
// приховані зі "своїх" розділів через hiddenFromPartOfSpeech. Тому лічильники в
// плитках Іменники/Прикметники рахуємо БЕЗ прихованих категорій — щоб число
// збігалося з тим, що учень реально бачить на екрані частини мови.
const HIDDEN_NOUN_CATS = new Set(["numbers"]);
const HIDDEN_ADJ_CATS = new Set(["ordinal"]);
const VISIBLE_NOUNS = NOUNS.filter((n) => !HIDDEN_NOUN_CATS.has(n.category)).length;
const VISIBLE_ADJS = ADJECTIVES.filter((a) => !HIDDEN_ADJ_CATS.has(a.category)).length;

const TILES: POSTile[] = [
  { key: "nouns", emoji: "🔤", title: "Іменники", subtitle: `${VISIBLE_NOUNS} слів з відмінюванням`, color: theme.colors.honey, ready: true },
  { key: "verbs", emoji: "🏃", title: "Дієслова", subtitle: `${VERBS.length} слів з дієвідміною`, color: theme.colors.mint, ready: true },
  { key: "adjectives", emoji: "🎨", title: "Прикметники", subtitle: `${VISIBLE_ADJS} слів з відмінюванням`, color: theme.colors.lilac, ready: true },
  { key: "pronouns", emoji: "👉", title: "Займенники", subtitle: `${PRONOUNS.length} присвійних і вказівних`, color: theme.colors.coral, ready: true },
  { key: "numerals", emoji: "🔢", title: "Числівники", subtitle: "порядкові, сотні, тисячі", color: "#e0a458", ready: true },
];

export function WordsPartOfSpeechScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [nounMistakes, setNounMistakes] = useState(0);
  const [verbMistakes, setVerbMistakes] = useState(0);
  const [adjMistakes, setAdjMistakes] = useState(0);
  const [pronMistakes, setPronMistakes] = useState(0);
  const [numeralMistakes, setNumeralMistakes] = useState(0);

  // Рахуємо помилки по всіх колодах при кожному фокусі екрана.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([
        loadProgressFrom(PROGRESS_KEYS.nouns),
        loadProgressFrom(PROGRESS_KEYS.verbs),
        loadProgressFrom(PROGRESS_KEYS.adjectives),
        loadProgressFrom(PROGRESS_KEYS.pronouns),
        loadProgressFrom(PROGRESS_KEYS.numerals),
      ]).then(
        ([np, vp, ap, pp, mp]: [
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>
        ]) => {
          if (!alive) return;
          setNounMistakes(getMistakeIds(np).size);
          setVerbMistakes(getMistakeIds(vp).size);
          setAdjMistakes(getMistakeIds(ap).size);
          setPronMistakes(getMistakeIds(pp).size);
          const numeralIds = [...getMistakeIds(mp)].filter((id) => ALL_NUMERAL_IDS.includes(id));
          setNumeralMistakes(numeralIds.length);
        }
      );
      return () => {
        alive = false;
      };
    }, [])
  );

  function open(key: POSTile["key"]) {
    if (key === "nouns") navigation.navigate("WordCategories");
    else if (key === "verbs") navigation.navigate("VerbCategories");
    else if (key === "adjectives") navigation.navigate("AdjectiveCategories");
    else if (key === "pronouns") navigation.navigate("PronounGroups");
    else if (key === "numerals") navigation.navigate("Numerals");
  }

  function mistakesFor(key: POSTile["key"]): number {
    if (key === "nouns") return nounMistakes;
    if (key === "verbs") return verbMistakes;
    if (key === "adjectives") return adjMistakes;
    if (key === "pronouns") return pronMistakes;
    if (key === "numerals") return numeralMistakes;
    return 0;
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <Text style={styles.intro}>Оберіть частину мови для вивчення</Text>

      <View style={styles.grid}>
        {TILES.map((t) => {
          const m = mistakesFor(t.key);
          const subtitle =
            m > 0 ? `🔁 ${m} ${plural(m, "слово", "слова", "слів")} на повторення` : t.subtitle;
          return (
            <Pressable
              key={t.key}
              style={[styles.tile, { borderColor: t.color }, !t.ready && styles.tileDim]}
              onPress={() => t.ready && open(t.key)}
            >
              <Text style={styles.tileEmoji}>{t.emoji}</Text>
              <Text style={styles.tileTitle}>{t.title}</Text>
              <Text style={[styles.tileSub, m > 0 && styles.tileSubAlert]}>{subtitle}</Text>
              {!t.ready && <Text style={styles.soon}>🔒</Text>}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(5) },
  intro: { color: theme.colors.textDim, fontSize: 15, marginBottom: theme.space(5) },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(3) },
  tile: {
    width: "47%",
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    padding: theme.space(4),
    minHeight: 130,
  },
  tileDim: { opacity: 0.5 },
  tileEmoji: { fontSize: 34 },
  tileTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "800", marginTop: theme.space(2) },
  tileSub: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  tileSubAlert: { color: theme.colors.coral, fontWeight: "700" },
  soon: { position: "absolute", top: theme.space(3), right: theme.space(3), fontSize: 16 },
});
