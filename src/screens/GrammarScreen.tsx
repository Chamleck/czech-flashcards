import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from "react-native";
import { theme } from "../utils/theme";
import { CASE_ORDER, CASE_LABELS } from "../types";

const PATTERNS = [
  { g: "🧑 Чол. рід — істоти", items: [
    { name: "pán", note: "твердий: студент, pán, syn — Nsg на приголосний, Gsg -a" },
    { name: "muž", note: "м'який: učitel, muž, otec — Gsg -e, часто Npl -i/-é" },
  ]},
  { g: "🪑 Чол. рід — неістоти", items: [
    { name: "hrad", note: "твердий: stůl, dům, les — Gsg -u, Lsg -e/-u" },
    { name: "stroj", note: "м'який: pokoj, čaj — Gsg -e, Npl -e" },
  ]},
  { g: "🌸 Жін. рід", items: [
    { name: "žena", note: "твердий на -a: káva, škola — Gsg -y, Isg -ou" },
    { name: "růže", note: "м'який на -e: restaurace — Gsg -e, Npl -e" },
    { name: "kost", note: "на приголосний (i-відміна): věc, noc — Isg -í" },
  ]},
  { g: "☀️ Сер. рід", items: [
    { name: "město", note: "твердий на -o: auto, okno — Npl -a" },
    { name: "moře", note: "м'який на -e: pole — Gsg -e, Npl -e" },
    { name: "kuře", note: "малята (-ete): dítě-подібні — Gsg -ete, Npl -ata" },
    { name: "stavení", note: "на -í: nádraží — незмінне в однині, Ipl -ími" },
  ]},
];

export function GrammarScreen({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← Назад</Text>
        </Pressable>
        <Text style={styles.title}>Граматика</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h2}>Сім відмінків 📚</Text>
        <Text style={styles.p}>
          Чеська має 7 відмінків. На кожен є контрольне питання — по ньому легше визначити форму.
        </Text>
        <View style={styles.caseBox}>
          {CASE_ORDER.map((c) => {
            const l = CASE_LABELS[c];
            return (
              <View key={c} style={styles.caseRow}>
                <Text style={styles.caseNum}>{l.number}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseName}>{l.uk}</Text>
                  <Text style={styles.caseQ}>{l.question}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.h2}>Зразки відмінювання (взори) 🗂️</Text>
        <Text style={styles.p}>
          Кожен іменник відмінюється за одним із зразків. Знаючи рід і зразок — знаєш усі форми.
        </Text>
        {PATTERNS.map((grp) => (
          <View key={grp.g} style={styles.grpBox}>
            <Text style={styles.grpTitle}>{grp.g}</Text>
            {grp.items.map((it) => (
              <View key={it.name} style={styles.patRow}>
                <Text style={styles.patName}>{it.name}</Text>
                <Text style={styles.patNote}>{it.note}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.tip}>
          <Text style={styles.tipText}>
            💡 Порада: спочатку визнач рід і чи слово тверде/м'яке (за останнім приголосним основи).
            Це одразу звужує зразок до 1–2 варіантів.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
  },
  back: { color: theme.colors.lilac, fontSize: 16, fontWeight: "600", width: 60 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: "800" },
  content: { padding: theme.space(4), paddingBottom: theme.space(10) },
  h2: { color: theme.colors.honey, fontSize: 20, fontWeight: "800", marginTop: theme.space(4), marginBottom: theme.space(2) },
  p: { color: theme.colors.textDim, fontSize: 14, lineHeight: 20, marginBottom: theme.space(3) },
  caseBox: { backgroundColor: theme.colors.bgCard, borderRadius: theme.radius.md, padding: theme.space(2) },
  caseRow: { flexDirection: "row", alignItems: "center", padding: theme.space(2.5), gap: theme.space(3) },
  caseNum: { color: theme.colors.honey, fontSize: 20, fontWeight: "800", width: 28 },
  caseName: { color: theme.colors.text, fontSize: 15, fontWeight: "700" },
  caseQ: { color: theme.colors.textFaint, fontSize: 13 },
  grpBox: { backgroundColor: theme.colors.bgCard, borderRadius: theme.radius.md, padding: theme.space(3.5), marginBottom: theme.space(3) },
  grpTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800", marginBottom: theme.space(2) },
  patRow: { marginBottom: theme.space(2) },
  patName: { color: theme.colors.mint, fontSize: 15, fontWeight: "800" },
  patNote: { color: theme.colors.textDim, fontSize: 13, lineHeight: 18 },
  tip: { backgroundColor: theme.colors.bgElevated, borderRadius: theme.radius.md, padding: theme.space(4), marginTop: theme.space(2) },
  tipText: { color: theme.colors.text, fontSize: 14, lineHeight: 21 },
});
