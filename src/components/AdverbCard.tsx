import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SpatialAdverbEntry, AdverbSense } from "../types";
import { theme } from "../utils/theme";
import { PosEmoji } from "./PosEmoji";
import { TileEmoji } from "./TileEmoji";
import { Speakable } from "./Speakable";
import { InfoBanner } from "./InfoBanner";
import { rolesOf, senseLabel } from "../data/interrogativeAdverbs";

interface Props {
  entry: SpatialAdverbEntry;
  revealed: boolean;
  onReveal: () => void;
}

// Колір за РОЛЛЮ сенсу (поле asks), не за позицією в масиві — інакше tam/doma (неповний набір сенсів) отримали б
// неправильний колір. Ті самі семантичні кольори, що вже усталені для дуальних прийменників: lilac = місце/спокій
// ("де?", а також tam «де? / куди?» і rovně), mint = рух ("куди?"), honey = третій контраст ("звідки?", як exchange
// у «za»). «кудою?» — lilac, як було.
function accentFor(sense: AdverbSense): string {
  const roles = rolesOf(sense);
  if (roles.includes("orig")) return theme.colors.honey;
  if (roles.length === 1 && roles[0] === "dir") return theme.colors.mint;
  return theme.colors.lilac;
}

// Один приклад-рядок з озвученням. Speakable — сиблінг у View (не в <Text>),
// той самий патерн, що в PrepositionCard/FlashCard.
function ExampleRow({ id, cz, uk }: { id: string; cz: string; uk: string }) {
  return (
    <View style={styles.example}>
      <View style={styles.exampleRow}>
        <TileEmoji name="speechBalloon" size={15} style={{ marginTop: 2 }} />
        <Speakable id={id} text={cz} style={styles.exampleCz} />
      </View>
      <Text style={styles.exampleUk}>{uk}</Text>
    </View>
  );
}

// Блок одного сенсу: заголовок ("де?") + слово + приклади. Кожен sense —
// самостійне слово (vlevo/doleva/zleva — три РІЗНІ слова, не форми одного),
// тому, на відміну від дуальних прийменників, немає єдиного "canonical"
// заголовка над усіма блоками — кожен блок сам собі голова.
function SenseBlock({ idPrefix, sense, accent }: { idPrefix: string; sense: AdverbSense; accent: string }) {
  return (
    <View style={[styles.senseBlock, { borderLeftColor: accent }]}>
      <Text style={[styles.senseHeading, { color: accent }]}>{senseLabel(sense)}</Text>
      <Speakable id={`${idPrefix}:word`} text={sense.cz} style={[styles.senseWord, { color: accent }]} />
      {sense.examples.map((ex, i) => (
        <ExampleRow key={i} id={`${idPrefix}:ex${i}`} cz={ex.cz} uk={ex.uk} />
      ))}
    </View>
  );
}

export function AdverbCard({ entry, revealed, onReveal }: Props) {
  return (
    <View style={styles.card}>
      <View>
        <View style={styles.promptLabelRow}>
          <Text style={styles.promptLabel}>українською</Text>
          <PosEmoji name="flagUkraine" size={13} />
        </View>
        <Text style={styles.promptWord}>{entry.uk}</Text>
      </View>

      {!revealed ? (
        <Pressable style={styles.revealBtn} onPress={onReveal}>
          <View style={styles.revealBtnRow}>
            <Text style={styles.revealBtnText}>Показати відповідь</Text>
            <PosEmoji name="eyes" size={16} />
          </View>
        </Pressable>
      ) : (
        <ScrollView
          style={styles.answerScroll}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {entry.note && <InfoBanner paragraphs={[entry.note]} />}

          {entry.senses.map((sense, i) => (
            <SenseBlock key={i} idPrefix={`${entry.id}:${i}`} sense={sense} accent={accentFor(sense)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    padding: theme.space(5),
  },
  promptLabel: { color: theme.colors.textDim, fontSize: 13, marginBottom: 4 },
  promptLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  promptWord: { color: theme.colors.text, fontSize: 30, fontWeight: "800" },
  revealBtn: {
    marginTop: theme.space(8),
    backgroundColor: theme.colors.honey,
    paddingVertical: theme.space(4),
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  revealBtnText: { color: "#3a1f00", fontWeight: "800", fontSize: 16 },
  revealBtnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  answerScroll: { marginTop: theme.space(4) },
  // Той самий еталон, що answerHead у FlashCard.tsx/SimpleWordCard.tsx —
  // кольорова рамка навколо "головного" елемента блоку, borderLeftColor
  // виставляється по кожному сенсу окремо (inline, як gColor у FlashCard).
  senseBlock: {
    borderLeftWidth: 4,
    paddingLeft: theme.space(3),
    marginBottom: theme.space(4),
  },
  senseHeading: { fontSize: 14, fontWeight: "700" },
  senseWord: { fontSize: 26, fontWeight: "800", marginVertical: 2 },
  example: {
    marginTop: theme.space(2),
    marginBottom: theme.space(1),
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  exampleRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
