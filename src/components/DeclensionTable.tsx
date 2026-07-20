import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DeclensionTable as TableType, CASE_ORDER, CASE_LABELS } from "../types";
import { theme } from "../utils/theme";

// Стек-layout: кожен відмінок — окремий блок на всю ширину.
// Зверху заголовок (номер · назва · контрольне питання),
// під ним дві підписані колонки: однина / множина.
// Так довгі форми (restauracích, pánovi/pánu) мають простір і не ламають рядок.
export function DeclensionTable({ table }: { table: TableType }) {
  return (
    <View style={styles.wrap}>
      {CASE_ORDER.map((c, i) => {
        const lbl = CASE_LABELS[c];
        return (
          <View key={c} style={[styles.block, i > 0 && styles.blockDivider]}>
            <View style={styles.head}>
              <Text style={styles.caseNum}>{lbl.number}</Text>
              <Text style={styles.caseName}>{lbl.uk}</Text>
              <Text style={styles.caseCz}>({lbl.cz})</Text>
              <Text style={styles.caseQ}>· {lbl.question}</Text>
            </View>
            <View style={styles.formsRow}>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>однина</Text>
                <Text style={styles.formText}>{table[c].sg}</Text>
              </View>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>множина</Text>
                <Text style={styles.formText}>{table[c].pl}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.bgElevated,
  },
  block: {
    paddingVertical: theme.space(3),
    paddingHorizontal: theme.space(3.5),
  },
  blockDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  head: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    marginBottom: theme.space(2),
  },
  caseNum: { color: theme.colors.honey, fontWeight: "800", fontSize: 14, marginRight: 6 },
  caseName: { color: theme.colors.text, fontSize: 14, fontWeight: "700", marginRight: 5 },
  caseCz: { color: theme.genderColor.masc_inan, fontSize: 12, fontWeight: "600", fontStyle: "italic", marginRight: 6 },
  caseQ: { color: theme.colors.textFaint, fontSize: 12 },
  formsRow: { flexDirection: "row" },
  formCol: { flex: 1, paddingRight: theme.space(2) },
  formLabel: {
    color: theme.colors.textFaint,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  formText: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
});
