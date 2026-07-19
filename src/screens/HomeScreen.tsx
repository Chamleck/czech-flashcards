import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { NOUNS } from "../data/nouns";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface Tile {
  key: "words" | "grammar" | "phrases" | "sentences";
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  ready: boolean;
}

const TILES: Tile[] = [
  { key: "words", emoji: "🔤", title: "Слова", subtitle: `${NOUNS.length} іменників з відмінюванням`, color: theme.colors.honey, ready: true },
  { key: "grammar", emoji: "📚", title: "Граматика", subtitle: "Відмінки, роди та зразки", color: theme.colors.lilac, ready: true },
  { key: "phrases", emoji: "💬", title: "Фрази", subtitle: "Скоро", color: theme.colors.mint, ready: false },
  { key: "sentences", emoji: "✍️", title: "Речення з пропусками", subtitle: "Скоро", color: theme.colors.coral, ready: false },
];

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  function open(key: Tile["key"]) {
    if (key === "words") navigation.navigate("WordCategories");
    else if (key === "grammar") navigation.navigate("GrammarCategories");
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.space(4), paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <Text style={styles.hi}>Ahoj! 👋</Text>
      <Text style={styles.subtitle}>Вчимо чеську через картки</Text>

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
  tileEmoji: { fontSize: 34 },
  tileTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "800", marginTop: theme.space(2) },
  tileSub: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  soon: { position: "absolute", top: theme.space(3), right: theme.space(3), fontSize: 16 },
  note: { marginTop: theme.space(6), backgroundColor: theme.colors.bgElevated, borderRadius: theme.radius.md, padding: theme.space(4) },
  noteText: { color: theme.colors.textDim, fontSize: 13, lineHeight: 20 },
});
