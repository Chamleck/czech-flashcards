import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { NOUNS } from "../data/nouns";
import { VERBS } from "../data/verbs";

type Props = NativeStackScreenProps<RootStackParamList, "WordsPartOfSpeech">;

interface POSTile {
  key: "nouns" | "verbs" | "adjectives" | "pronouns";
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  ready: boolean;
}

const TILES: POSTile[] = [
  { key: "nouns", emoji: "🔤", title: "Іменники", subtitle: `${NOUNS.length} слів з відмінюванням`, color: theme.colors.honey, ready: true },
  { key: "verbs", emoji: "🏃", title: "Дієслова", subtitle: `${VERBS.length} слів з дієвідміною`, color: theme.colors.mint, ready: true },
  { key: "adjectives", emoji: "🎨", title: "Прикметники", subtitle: "Скоро", color: theme.colors.lilac, ready: false },
  { key: "pronouns", emoji: "👉", title: "Займенники", subtitle: "Скоро", color: theme.colors.coral, ready: false },
];

export function WordsPartOfSpeechScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  function open(key: POSTile["key"]) {
    if (key === "nouns") navigation.navigate("WordCategories");
    else if (key === "verbs") navigation.navigate("VerbCategories");
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <Text style={styles.intro}>Оберіть частину мови для вивчення</Text>

      <View style={styles.grid}>
        {TILES.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tile, { borderColor: t.color }, !t.ready && styles.tileDim]}
            onPress={() => t.ready && open(t.key)}
          >
            <Text style={styles.tileEmoji}>{t.emoji}</Text>
            <Text style={styles.tileTitle}>{t.title}</Text>
            <Text style={styles.tileSub}>{t.subtitle}</Text>
            {!t.ready && <Text style={styles.soon}>🔒</Text>}
          </Pressable>
        ))}
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
  soon: { position: "absolute", top: theme.space(3), right: theme.space(3), fontSize: 16 },
});
