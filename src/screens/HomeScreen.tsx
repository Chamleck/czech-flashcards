import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";
import { plural } from "../utils/plural";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface Tile {
  key: "words" | "grammar" | "flashcards" | "phrases" | "sentences";
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  ready: boolean;
}

const TILES: Tile[] = [
  { key: "words", emoji: "🔤", title: "Слова", subtitle: "Іменники, дієслова та більше", color: theme.colors.honey, ready: true },
  { key: "flashcards", emoji: "🎴", title: "Флеш-картки", subtitle: "Обери правильну форму", color: theme.colors.mint, ready: true },
  { key: "grammar", emoji: "📚", title: "Граматика", subtitle: "Відмінки, роди та зразки", color: theme.colors.lilac, ready: true },
  { key: "phrases", emoji: "💬", title: "Фрази", subtitle: "Скоро", color: "#8ed081", ready: false },
  { key: "sentences", emoji: "✍️", title: "Речення з пропусками", subtitle: "Скоро", color: theme.colors.coral, ready: false },
];

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [wordMistakes, setWordMistakes] = useState(0);

  // Сумарні помилки по «Словах» (іменники + дієслова) для індикатора на плитці.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([
        loadProgressFrom(PROGRESS_KEYS.nouns),
        loadProgressFrom(PROGRESS_KEYS.verbs),
      ]).then(([np, vp]: [Record<string, CardProgress>, Record<string, CardProgress>]) => {
        if (!alive) return;
        setWordMistakes(getMistakeIds(np).size + getMistakeIds(vp).size);
      });
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
              <Text style={styles.tileEmoji}>{t.emoji}</Text>
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

      {/* ТИМЧАСОВО: вхід у прототип перевірки голосу. Прибрати після рішення. */}
      <Pressable style={styles.ttsTestLink} onPress={() => navigation.navigate("TTSPrototype")}>
        <Text style={styles.ttsTestLinkText}>🔊 Тест голосу (тимчасово)</Text>
      </Pressable>
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
  tileEmoji: { fontSize: 34 },
  tileTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "800", marginTop: theme.space(2) },
  tileSub: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  tileSubAlert: { color: theme.colors.coral, fontWeight: "700" },
  soon: { position: "absolute", top: theme.space(3), right: theme.space(3), fontSize: 16 },
  note: { marginTop: theme.space(6), backgroundColor: theme.colors.bgElevated, borderRadius: theme.radius.md, padding: theme.space(4) },
  noteText: { color: theme.colors.textDim, fontSize: 13, lineHeight: 20 },
  ttsTestLink: { marginTop: theme.space(4), alignItems: "center", padding: theme.space(2) },
  ttsTestLinkText: { color: theme.colors.textFaint, fontSize: 13, fontWeight: "600" },
});
