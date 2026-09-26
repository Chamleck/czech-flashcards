import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import { Speakable } from "./Speakable";

// Таблиця з довільними підписами рядків (особа/підмет → форма). Витягнуто з
// VerbConjugation.tsx (де раніше жила як приватна FormTable) при появі
// другого реального споживача — ConditionalParticleCard (aby/kdyby мають ту
// саму 6-особову сітку форм, що дієвідміна дієслів). Той самий принцип
// екстракції, що SelectionList/MistakeDeckCard/SectionHeader раніше.
// speakIdBase: якщо переданий, кожна форма озвучувана з id `${speakIdBase}:{i}`.
export function PersonFormsTable({
  labels,
  forms,
  accent,
  speakIdBase,
}: {
  labels: { cz: string; uk: string }[];
  forms: { cz: string }[];
  accent: string;
  speakIdBase?: string;
}) {
  return (
    <View style={styles.table}>
      {labels.map((lbl, i) => (
        <View key={i} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
          <View style={styles.personCell}>
            <Text style={styles.personCz}>{lbl.cz}</Text>
            <Text style={styles.personUk}>{lbl.uk}</Text>
          </View>
          {speakIdBase && forms[i].cz ? (
            <Speakable
              id={`${speakIdBase}:${i}`}
              text={forms[i].cz}
              style={[styles.formText, { color: accent }]}
            />
          ) : (
            <Text style={[styles.formText, { color: accent }]}>{forms[i].cz}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.bgElevated,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowAlt: { backgroundColor: "rgba(255,255,255,0.03)" },
  personCell: { flex: 1.3, paddingVertical: theme.space(2), paddingHorizontal: theme.space(2.5) },
  personCz: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  personUk: { color: theme.colors.textFaint, fontSize: 11 },
  formText: {
    flex: 1.7,
    paddingVertical: theme.space(2),
    paddingHorizontal: theme.space(2.5),
    fontSize: 15,
    fontWeight: "600",
  },
});
