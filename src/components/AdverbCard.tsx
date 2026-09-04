import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SpatialAdverbEntry, AdverbSense } from "../types";
import { theme } from "../utils/theme";
import { Speakable } from "./Speakable";

interface Props {
  entry: SpatialAdverbEntry;
  revealed: boolean;
  onReveal: () => void;
}

// Колір за СЕНСОМ (де?/куди?/звідки?), не за позицією в масиві — інакше tam/
// doma (неповний набір сенсів) отримали б неправильний колір: у tam «звідки?»
// стоїть на index=1, і за позицією він хибно пофарбувався б як «куди?» (mint)
// замість «звідки?» (honey), хоча в усіх повних трійках звідки? — завжди honey.
// Ті самі семантичні кольори, що вже усталені для дуальних прийменників:
// lilac = місце/спокій ("де?"), mint = рух ("куди?"), honey = третій контраст
// ("звідки?", як exchange у «za»).
function accentForLabel(label: string): string {
  if (label.includes("звідки")) return theme.colors.honey;
  // Точна рівність, НЕ includes — інакше "де? / куди?" (комбінований лейбл tam)
  // теж хибно спрацював би на .includes("куди") і пофарбувався як "куди?".
  if (label === "куди?") return theme.colors.mint;
  return theme.colors.lilac; // "де?", комбінований "де? / куди?" (tam), або самостійне "напрямок" (rovně)
}

// Один приклад-рядок з озвученням. Speakable — сиблінг у View (не в <Text>),
// той самий патерн, що в PrepositionCard/FlashCard.
function ExampleRow({ id, cz, uk, accent }: { id: string; cz: string; uk: string; accent: string }) {
  return (
    <View style={[styles.example, { borderLeftColor: accent }]}>
      <View style={styles.exampleRow}>
        <Text style={styles.exampleCz}>💬 </Text>
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
      <Text style={[styles.senseHeading, { color: accent }]}>{sense.label}</Text>
      <Speakable id={`${idPrefix}:word`} text={sense.cz} style={[styles.senseWord, { color: accent }]} />
      {sense.examples.map((ex, i) => (
        <ExampleRow key={i} id={`${idPrefix}:ex${i}`} cz={ex.cz} uk={ex.uk} accent={accent} />
      ))}
    </View>
  );
}

export function AdverbCard({ entry, revealed, onReveal }: Props) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.promptLabel}>українською 🇺🇦</Text>
        <Text style={styles.promptWord}>{entry.uk}</Text>
      </View>

      {!revealed ? (
        <Pressable style={styles.revealBtn} onPress={onReveal}>
          <Text style={styles.revealBtnText}>Показати відповідь 👀</Text>
        </Pressable>
      ) : (
        <ScrollView
          style={styles.answerScroll}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {entry.senses.map((sense, i) => (
            <SenseBlock key={i} idPrefix={`${entry.id}:${i}`} sense={sense} accent={accentForLabel(sense.label)} />
          ))}

          {entry.note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>💡 {entry.note}</Text>
            </View>
          )}
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
  promptWord: { color: theme.colors.text, fontSize: 30, fontWeight: "800" },
  revealBtn: {
    marginTop: theme.space(8),
    backgroundColor: theme.colors.honey,
    paddingVertical: theme.space(4),
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  revealBtnText: { color: "#3a1f00", fontWeight: "800", fontSize: 16 },
  answerScroll: { marginTop: theme.space(4) },
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
    borderLeftWidth: 3,
    padding: theme.space(3.5),
  },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  noteBox: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginTop: theme.space(1),
  },
  noteText: { color: theme.colors.text, fontSize: 13, lineHeight: 19 },
});
