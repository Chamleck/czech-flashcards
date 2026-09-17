import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";
import { plural } from "../utils/plural";
import { ALL_NUMERAL_IDS } from "../utils/numeralEntries";
import { ALL_INTERROGATIVE_IDS } from "../utils/interrogativeEntries";
import { ALL_PRONOUN_MIXED_IDS } from "../utils/pronounEntries";
import { TileEmoji } from "../components/TileEmoji";
import { TileEmojiName } from "../components/icons/tileEmoji";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface Tile {
  // "flashcards" лишається внутрішнім ключем (маршрут FlashcardsCategories/
  // FlashcardsQuizScreen перейменування не потребує — це технічний
  // ідентифікатор, а не текст, який бачить користувач); змінився лише
  // видимий title нижче: "Вікторина" замість "Флеш-картки", бо режим — це
  // вибір правильної форми з варіантів, а не переворот карток.
  key: "words" | "grammar" | "flashcards" | "phrases" | "sentences";
  icon: TileEmojiName;
  title: string;
  subtitle: string;
  color: string;
  ready: boolean;
}

const TILES: Tile[] = [
  { key: "words", icon: "openBook", title: "Слова", subtitle: "Іменники, дієслова та більше", color: theme.colors.honey, ready: true },
  { key: "flashcards", icon: "bullseye", title: "Вікторина", subtitle: "Обери правильну форму", color: theme.colors.mint, ready: true },
  { key: "grammar", icon: "graduationCap", title: "Граматика", subtitle: "Відмінки, роди та зразки", color: theme.colors.lilac, ready: true },
  { key: "phrases", icon: "speechBalloon", title: "Фрази", subtitle: "Скоро", color: "#8ed081", ready: false },
  { key: "sentences", icon: "writingHand", title: "Речення з пропусками", subtitle: "Скоро", color: theme.colors.coral, ready: false },
];

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [wordMistakes, setWordMistakes] = useState(0);

  // Сумарні помилки по «Словах» — УСІ частини мови й підкатегорії, не лише
  // іменники+дієслова (реальний баг, знайдений на тестуванні: лічильник тут
  // лишився від найранішої фази, коли інших частин мови ще не було, і його
  // забули розширити при додаванні прикметників/займенників/числівників/
  // прийменників). Займенники (pronouns) та Питальні слова (interrogatives) —
  // окремі сховища, кожне фільтроване за своїм набором id; числівники — спільне
  // сховище, відфільтроване за ALL_NUMERAL_IDS (той самий принцип, що і в
  // WordsPartOfSpeechScreen — не рахуємо осиротілі записи).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([
        loadProgressFrom(PROGRESS_KEYS.nouns),
        loadProgressFrom(PROGRESS_KEYS.verbs),
        loadProgressFrom(PROGRESS_KEYS.adjectives),
        loadProgressFrom(PROGRESS_KEYS.pronouns),
        loadProgressFrom(PROGRESS_KEYS.interrogatives),
        loadProgressFrom(PROGRESS_KEYS.numerals),
        loadProgressFrom(PROGRESS_KEYS.prepositions),
        loadProgressFrom(PROGRESS_KEYS.adverbs),
      ]).then(
        ([np, vp, ap, pp, ip, mp, prp, advp]: [
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>
        ]) => {
          if (!alive) return;
          const numeralCount = [...getMistakeIds(mp)].filter((id) =>
            ALL_NUMERAL_IDS.includes(id)
          ).length;
          // pp = PROGRESS_KEYS.pronouns (особові+присвійні+вказівні), ip =
          // PROGRESS_KEYS.interrogatives (Питальні слова) — кожне фільтроване за
          // своїм набором id, щоб осиротілі записи не подвоювались/не рахувались.
          const pronCount = [...getMistakeIds(pp)].filter((id) =>
            ALL_PRONOUN_MIXED_IDS.includes(id)
          ).length;
          const interrogativeCount = [...getMistakeIds(ip)].filter((id) =>
            ALL_INTERROGATIVE_IDS.includes(id)
          ).length;
          setWordMistakes(
            getMistakeIds(np).size +
              getMistakeIds(vp).size +
              getMistakeIds(ap).size +
              pronCount +
              interrogativeCount +
              numeralCount +
              getMistakeIds(prp).size +
              getMistakeIds(advp).size
          );
        }
      );
      return () => {
        alive = false;
      };
    }, [])
  );

  function open(key: Tile["key"]) {
    if (key === "words") navigation.navigate("WordsPartOfSpeech");
    else if (key === "grammar") navigation.navigate("GrammarCategories");
    else if (key === "flashcards") navigation.navigate("FlashcardsCategories");
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.space(4), paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <Text style={styles.hi}>Ahoj! 👋</Text>
      <Text style={styles.subtitle}>Вчимо чеську через картки</Text>

      <View style={styles.grid}>
        {TILES.map((t) => {
          const showMistakes = t.key === "words" && wordMistakes > 0;
          const subtitle = showMistakes
            ? `🔁 ${wordMistakes} ${plural(wordMistakes, "слово", "слова", "слів")} на повторення`
            : t.subtitle;
          return (
            <Pressable
              key={t.key}
              style={[styles.tile, { borderColor: t.color }, !t.ready && styles.tileDim]}
              onPress={() => t.ready && open(t.key)}
            >
              <TileEmoji name={t.icon} />
              <Text style={styles.tileTitle}>{t.title}</Text>
              <Text style={[styles.tileSub, showMistakes && styles.tileSubAlert]}>{subtitle}</Text>
              {!t.ready && <Text style={styles.soon}>🔒</Text>}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Фаза 1: іменники з повним відмінюванням. Далі — прикметники, займенники, прийменники,
          дати та цілі речення.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(5) },
  hi: { color: theme.colors.text, fontSize: 34, fontWeight: "900" },
  subtitle: { color: theme.colors.textDim, fontSize: 16, marginTop: 4, marginBottom: theme.space(6) },
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
  tileTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "800", marginTop: theme.space(2) },
  tileSub: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  tileSubAlert: { color: theme.colors.coral, fontWeight: "700" },
  soon: { position: "absolute", top: theme.space(3), right: theme.space(3), fontSize: 16 },
  note: { marginTop: theme.space(6), backgroundColor: theme.colors.bgElevated, borderRadius: theme.radius.md, padding: theme.space(4) },
  noteText: { color: theme.colors.textDim, fontSize: 13, lineHeight: 20 },
});
