import React, { useLayoutEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CASE_ORDER, CASE_LABELS } from "../types";
import { theme } from "../utils/theme";
import { GRAMMAR_BY_ID, GrammarBlock } from "../data/grammar";

type Props = NativeStackScreenProps<RootStackParamList, "GrammarTopic">;

// Згруповані зразки відмінювання для блоку "patterns"
const PATTERN_GROUPS = [
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

function CasesBlock() {
  return (
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
  );
}

function PatternsBlock() {
  return (
    <>
      {PATTERN_GROUPS.map((grp) => (
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
    </>
  );
}

function Block({ block }: { block: GrammarBlock }) {
  switch (block.type) {
    case "paragraph":
      return <Text style={styles.p}>{block.text}</Text>;
    case "tip":
      return (
        <View style={styles.tip}>
          <Text style={styles.tipText}>{block.text}</Text>
        </View>
      );
    case "list":
      return (
        <View style={styles.listBox}>
          {block.items.map((it, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listTerm}>{it.term}</Text>
              <Text style={styles.listNote}>{it.note}</Text>
            </View>
          ))}
        </View>
      );
    case "cases":
      return <CasesBlock />;
    case "patterns":
      return <PatternsBlock />;
    default:
      return null;
  }
}

export function GrammarTopicScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topic = GRAMMAR_BY_ID[route.params.topicId];

  useLayoutEffect(() => {
    navigation.setOptions({ title: topic ? `${topic.emoji} ${topic.title}` : "Граматика" });
  }, [navigation, topic]);

  if (!topic) {
    return (
      <View style={styles.safe}>
        <Text style={styles.p}>Тему не знайдено.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(8) }]}
    >
      {topic.blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  p: { color: theme.colors.textDim, fontSize: 15, lineHeight: 22, marginBottom: theme.space(3) },
  tip: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
    marginBottom: theme.space(3),
  },
  tipText: { color: theme.colors.text, fontSize: 14, lineHeight: 21 },
  listBox: { marginBottom: theme.space(3) },
  listItem: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(2),
  },
  listTerm: { color: theme.colors.text, fontSize: 15, fontWeight: "700" },
  listNote: { color: theme.colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 3 },
  caseBox: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(2),
    marginBottom: theme.space(3),
  },
  caseRow: { flexDirection: "row", alignItems: "center", padding: theme.space(2.5), gap: theme.space(3) },
  caseNum: { color: theme.colors.honey, fontSize: 20, fontWeight: "800", width: 28 },
  caseName: { color: theme.colors.text, fontSize: 15, fontWeight: "700" },
  caseQ: { color: theme.colors.textFaint, fontSize: 13 },
  grpBox: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(3),
  },
  grpTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800", marginBottom: theme.space(2) },
  patRow: { marginBottom: theme.space(2) },
  patName: { color: theme.colors.mint, fontSize: 15, fontWeight: "800" },
  patNote: { color: theme.colors.textDim, fontSize: 13, lineHeight: 18 },
});
