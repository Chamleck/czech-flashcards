import React, { useLayoutEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CASE_ORDER, CASE_LABELS, BrowseKind } from "../types";
import { theme } from "../utils/theme";
import { GRAMMAR_BY_ID, GrammarBlock, ParagraphSegment, PatternGroup } from "../data/grammar";
import { findSearchEntry } from "../utils/searchIndex";

type Props = NativeStackScreenProps<RootStackParamList, "GrammarTopic">;
type GrammarNav = Props["navigation"];

function CasesBlock() {
  return (
    <View style={styles.caseBox}>
      {CASE_ORDER.map((c) => {
        const l = CASE_LABELS[c];
        return (
          <View key={c} style={styles.caseRow}>
            <Text style={styles.caseNum}>{l.number}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.caseName}>
                {l.uk} <Text style={styles.caseCz}>({l.cz})</Text>
              </Text>
              <Text style={styles.caseQ}>{l.question}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PatternsBlock({ groups, navigation }: { groups: PatternGroup[]; navigation: GrammarNav }) {
  return (
    <>
      {groups.map((grp) => (
        <View key={grp.title} style={styles.grpBox}>
          <Text style={styles.grpTitle}>
            {grp.emoji} {grp.title}
          </Text>
          {grp.items.map((it) => (
            <View key={it.name} style={styles.patRow}>
              <Text style={styles.patName}>
                {it.nameWordId ? (
                  <ClickableWord word={it.name} wordId={it.nameWordId} kind="nouns" navigation={navigation} />
                ) : (
                  it.name
                )}
              </Text>
              <Text style={styles.patNote}>
                <Segments segments={it.note} navigation={navigation} />
              </Text>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

// Клікабельне слово всередині речення — відкриває картку слова в словнику
// (BrowseCard). Стиль СВІДОМО відрізняється від Speakable (озвучення): колір
// lilac (уже зарезервований у темі під "інформацію"), БЕЗ підкреслення й БЕЗ
// анімації — щоб два різні жести (почути / відкрити картку) не виглядали
// однаково. Nested-Text-з-onPress — той самий безпечний патерн, що вже working
// у caseCz (кольоровий Text всередині Text) і в Speakable (Text з onPress).
function ClickableWord({
  word,
  wordId,
  kind,
  navigation,
}: {
  word: string;
  wordId: string;
  kind: BrowseKind;
  navigation: GrammarNav;
}) {
  function onPress() {
    const entry = findSearchEntry(wordId, kind);
    if (!entry) return; // wordId не знайдено в словнику — тихо ігноруємо тап
    const initialIndex = Math.max(0, entry.entryIds.indexOf(entry.id));
    // ОДИН push картки на поточний стек (а НЕ ланцюжок parentScreen→BrowseList,
    // як для результатів пошуку) — тут інша логіка: "назад" має вести прямо в
    // граматику, звідки тапнули, а не крізь проміжні екрани вибору категорії.
    navigation.push("BrowseCard", {
      kind: entry.kind,
      entryIds: entry.entryIds,
      initialIndex,
      title: entry.title,
    });
  }

  return (
    <Text style={styles.clickableWord} onPress={onPress} suppressHighlighting>
      {word}
    </Text>
  );
}

function Segments({ segments, navigation }: { segments: ParagraphSegment[]; navigation: GrammarNav }) {
  return (
    <>
      {segments.map((seg, i) =>
        "word" in seg ? (
          <ClickableWord key={i} word={seg.word} wordId={seg.wordId} kind={seg.kind} navigation={navigation} />
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </>
  );
}

function Block({ block, navigation }: { block: GrammarBlock; navigation: GrammarNav }) {
  switch (block.type) {
    case "paragraph":
      return <Text style={styles.p}>{block.text}</Text>;
    case "rich-paragraph":
      return (
        <Text style={styles.p}>
          <Segments segments={block.segments} navigation={navigation} />
        </Text>
      );
    case "heading":
      return <Text style={styles.h2}>{block.text}</Text>;
    case "tip":
      return (
        <View style={styles.tip}>
          <Text style={styles.tipText}>{block.text}</Text>
        </View>
      );
    case "rich-tip":
      return (
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            <Segments segments={block.segments} navigation={navigation} />
          </Text>
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
    case "rich-list":
      return (
        <View style={styles.listBox}>
          {block.items.map((it, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listTerm}>
                <Segments segments={it.term} navigation={navigation} />
              </Text>
              <Text style={styles.listNote}>
                <Segments segments={it.note} navigation={navigation} />
              </Text>
            </View>
          ))}
        </View>
      );
    case "cases":
      return <CasesBlock />;
    case "patterns":
      return <PatternsBlock groups={block.groups} navigation={navigation} />;
    default: {
      // Exhaustiveness guard: якщо в GrammarBlock додати новий варіант і забути
      // дописати case вище — цей рядок не скомпілюється (block матиме тип,
      // відмінний від never), а не мовчки відрендериться як null.
      const _exhaustive: never = block;
      return null;
    }
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
        <Block key={i} block={b} navigation={navigation} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  p: { color: theme.colors.textDim, fontSize: 15, lineHeight: 22, marginBottom: theme.space(3) },
  h2: {
    color: theme.colors.honey,
    fontSize: 17,
    fontWeight: "800",
    marginTop: theme.space(2),
    marginBottom: theme.space(2),
  },
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
  clickableWord: { color: theme.colors.lilac, fontWeight: "700" },
  caseBox: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(2),
    marginBottom: theme.space(3),
  },
  caseRow: { flexDirection: "row", alignItems: "center", padding: theme.space(2.5), gap: theme.space(3) },
  caseNum: { color: theme.colors.honey, fontSize: 20, fontWeight: "800", width: 28 },
  caseName: { color: theme.colors.text, fontSize: 15, fontWeight: "700" },
  caseCz: { color: theme.genderColor.masc_inan, fontSize: 13, fontWeight: "600", fontStyle: "italic" },
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
