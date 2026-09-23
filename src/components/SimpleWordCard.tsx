import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { InvariantWordEntry } from "../types";
import { theme } from "../utils/theme";
import { PosEmoji } from "./PosEmoji";
import { TileEmoji } from "./TileEmoji";
import { Speakable } from "./Speakable";

interface Props {
  entry: InvariantWordEntry;
  revealed: boolean;
  onReveal: () => void;
}

// Картка для незмінюваного слова без парадигми (InvariantWordEntry) — той
// самий макет, що AdverbCard/PrepositionCard (promptWord → reveal → answer +
// приклади), лише БЕЗ множини сенсів/відмінка: одне слово, один блок
// прикладів. Перший користувач типу — питальні прислівники місця
// (kde/kam/odkud/kudy); той самий компонент переюзається для решти
// незмінюваних питальних слів (kdy/jak/proč/kolik).
//
// Акцент — колір тайла "Питальні слова" (#d98cbf), не колір сусідніх
// прислівників (lilac/mint/honey за роллю де/куди/звідки) — тут немає ролі
// для розфарбовування, і власний колір дає розділу "Питальні" візуальну
// єдність, відмінну від відповідей на ці питання (vlevo/tam тощо).
const ACCENT = "#d98cbf";

function ExampleRow({ id, cz, uk }: { id: string; cz: string; uk: string }) {
  return (
    <View style={styles.example}>
      <View style={styles.exampleRow}>
        <TileEmoji name="speechBalloon" size={15} />
        <Speakable id={id} text={cz} style={styles.exampleCz} />
      </View>
      <Text style={styles.exampleUk}>{uk}</Text>
    </View>
  );
}

export function SimpleWordCard({ entry, revealed, onReveal }: Props) {
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
          <View style={styles.answerHead}>
            <View style={styles.answerLabelRow}>
              <Text style={styles.answerLabel}>чеською</Text>
              <PosEmoji name="flagCzechia" size={13} />
            </View>
            <Speakable id={`${entry.id}:headline`} text={entry.cz} style={styles.answerWord} />
          </View>

          {entry.examples.map((ex, i) => (
            <ExampleRow key={i} id={`${entry.id}:ex${i}`} cz={ex.cz} uk={ex.uk} />
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
  answerHead: {
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
    paddingLeft: theme.space(3),
    marginBottom: theme.space(4),
  },
  answerLabel: { color: theme.colors.textDim, fontSize: 13 },
  answerLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  answerWord: { fontSize: 28, fontWeight: "800", marginVertical: 2, color: ACCENT },
  example: {
    marginTop: theme.space(2),
    marginBottom: theme.space(1),
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5 },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
