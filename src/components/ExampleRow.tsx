import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import { Speakable } from "./Speakable";
import { TileEmoji } from "./TileEmoji";

// Рядок прикладу під словом: чеське речення (озвучується) + переклад. Спільний для карток слів.
// label — підпис значення багатозначного слова над прикладом («вага», «їжа»); lead — перший приклад одразу під
// таблицею форм (більший відступ зверху), інакше — приклад у стосі прикладів.
export function ExampleRow({ id, cz, uk, label, lead }: { id: string; cz: string; uk: string; label?: string; lead?: boolean }) {
  return (
    <View style={[styles.example, lead ? styles.lead : styles.stacked]}>
      {label && <Text style={styles.senseLabel}>{label}</Text>}
      <View style={styles.exampleRow}>
        <TileEmoji name="speechBalloon" size={15} style={{ marginTop: 2 }} />
        <Speakable id={id} text={cz} style={styles.exampleCz} />
      </View>
      <Text style={styles.exampleUk}>{uk}</Text>
    </View>
  );
}

// Приклади слова під таблицею форм: у однозначного — один, у багатозначного — по одному на значення, кожен під своїм
// підписом (data: NounSense, AdjectiveSense). Перший — під таблицею, решта — стосом.
export function SenseExamples({ id, items }: { id: string; items: { label?: string; cz: string; uk: string }[] }) {
  return (
    <>
      {items.map((ex, i) => (
        <ExampleRow key={i} id={i === 0 ? `${id}:example` : `${id}:example${i + 1}`} cz={ex.cz} uk={ex.uk} label={ex.label} lead={i === 0} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  example: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  stacked: {
    marginTop: theme.space(2),
    marginBottom: theme.space(1),
  },
  lead: {
    marginTop: theme.space(4),
  },
  senseLabel: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: theme.space(1),
  },
  exampleRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
