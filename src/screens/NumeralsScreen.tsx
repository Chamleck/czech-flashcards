import React, { useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { NOUNS } from "../data/nouns";
import { ADJECTIVES } from "../data/adjectives";
import { CARDINALS } from "../data/cardinals";
import { plural } from "../utils/plural";
import { ModeToggle, BrowseMode } from "../components/ModeToggle";

type Props = NativeStackScreenProps<RootStackParamList, "Numerals">;

// Розділ "Числівники" — єдина точка входу для всіх трьох видів:
//  • кількісні (jeden/dva/pět…) — власний двигун/картка (додаються окремим патчем)
//  • порядкові (перший, другий…) — технічно прикметники (category "ordinal")
//  • сотні/тисячі (sto/tisíc) — технічно іменники (category "numbers")
// Порядкові й сотні/тисячі приховані зі своїх "рідних" розділів (Прикметники/
// Іменники) через hiddenFromPartOfSpeech, щоб не дублюватись.

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
  ready: boolean;
  browseOnly?: boolean; // квіз ще не побудовано — лише перегляд
}

const ITEMS: Item[] = [
  {
    key: "cardinal",
    emoji: "🔢",
    title: "Кількісні",
    hint: "jeden, dva, pět… (окреме відмінювання)",
    count: CARDINAL_IDS.length,
    color: theme.colors.honey,
    ready: true,
    browseOnly: true,
  },
  {
    key: "ordinal",
    emoji: "🥇",
    title: "Порядкові",
    hint: "перший, другий… (зразок mladý/jarní)",
    count: ORDINAL_IDS.length,
    color: theme.colors.lilac,
    ready: true,
  },
  {
    key: "hundreds",
    emoji: "💯",
    title: "Сотні і тисячі",
    hint: "sto, tisíc (звичайні іменники)",
    count: NUMBER_IDS.length,
    color: theme.colors.mint,
    ready: true,
  },
];

export function NumeralsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<BrowseMode>("browse");

  function open(item: Item) {
    if (!item.ready) return;
    if (item.key === "cardinal") {
      // Квіз для кількісних ще не побудовано — лише перегляд (незалежно від тумблера).
      navigation.navigate("BrowseList", {
        kind: "cardinals",
        entryIds: CARDINAL_IDS,
        title: "🔢 Кількісні",
      });
    } else if (item.key === "ordinal") {
      const title = "🥇 Порядкові";
      if (mode === "browse") {
        navigation.navigate("BrowseList", { kind: "adjectives", entryIds: ORDINAL_IDS, title });
      } else {
        navigation.navigate("DeclSession", { title, kind: "adjective", entryIds: ORDINAL_IDS });
      }
    } else if (item.key === "hundreds") {
      const title = "💯 Сотні і тисячі";
      if (mode === "browse") {
        navigation.navigate("BrowseList", { kind: "nouns", entryIds: NUMBER_IDS, title });
      } else {
        navigation.navigate("WordSession", { title, entryIds: NUMBER_IDS });
      }
    }
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <ModeToggle mode={mode} onChange={setMode} />

      {ITEMS.map((item) => (
        <Pressable
          key={item.key}
          style={[styles.row, { borderLeftColor: item.color }, !item.ready && styles.rowDim]}
          onPress={() => open(item)}
          disabled={!item.ready}
        >
          <Text style={styles.emoji}>{item.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.hint}>{item.hint}</Text>
            {item.ready ? (
              <Text style={styles.sub}>
                {item.count} {plural(item.count, "слово", "слова", "слів")}
                {item.browseOnly && mode === "train" ? "  ·  лише перегляд" : ""}
              </Text>
            ) : (
              <Text style={styles.soon}>Скоро 🔒</Text>
            )}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
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
  rowDim: { opacity: 0.5 },
  emoji: { fontSize: 32 },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  hint: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  sub: { color: theme.colors.textFaint, fontSize: 12, marginTop: 4 },
  soon: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "700", marginTop: 4 },
});
