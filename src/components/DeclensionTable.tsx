import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DeclensionTable as TableType, CASE_ORDER, CASE_LABELS } from "../types";
import { theme } from "../utils/theme";

export function DeclensionTable({ table }: { table: TableType }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.cell, styles.caseCol, styles.headText]}>відмінок</Text>
        <Text style={[styles.cell, styles.headText]}>однина</Text>
        <Text style={[styles.cell, styles.headText]}>множина</Text>
      </View>
      {CASE_ORDER.map((c, i) => {
        const lbl = CASE_LABELS[c];
        return (
          <View key={c} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
            <View style={[styles.cell, styles.caseCol]}>
              <Text style={styles.caseNum}>{lbl.number}</Text>
              <Text style={styles.caseName}>{lbl.uk}</Text>
              <Text style={styles.caseQ}>{lbl.question}</Text>
            </View>
            <Text style={[styles.cell, styles.formText]}>{table[c].sg}</Text>
            <Text style={[styles.cell, styles.formText]}>{table[c].pl}</Text>
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
  row: { flexDirection: "row", alignItems: "stretch" },
  rowAlt: { backgroundColor: "rgba(255,255,255,0.03)" },
  head: { backgroundColor: theme.colors.honey },
  cell: {
    flex: 1,
    paddingVertical: theme.space(2.5),
    paddingHorizontal: theme.space(2),
    justifyContent: "center",
  },
  caseCol: { flex: 1.3 },
  headText: { color: "#3a1f00", fontWeight: "700", fontSize: 12, textAlign: "center" },
  caseNum: { color: theme.colors.honey, fontWeight: "800", fontSize: 13 },
  caseName: { color: theme.colors.text, fontSize: 12, fontWeight: "600" },
  caseQ: { color: theme.colors.textFaint, fontSize: 10 },
  formText: {
    color: theme.colors.text,
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
  },
});
