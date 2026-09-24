import React, { useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CASE_ORDER, CASE_LABELS } from "../types";
import { theme } from "../utils/theme";
import { PosEmoji } from "../components/PosEmoji";
import { InfoBanner } from "../components/InfoBanner";
import { GRAMMAR_TOPICS, GrammarBlock, GrammarTopic, PatternGroup } from "../data/grammar";
import { ClickableWord, Segments, AppNav } from "../components/ClickableWord";
import { HomeHeaderButton } from "../components/HeaderIcons";

type Props = NativeStackScreenProps<RootStackParamList, "GrammarTopic">;
type GrammarNav = AppNav;

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
          <View style={styles.grpTitleRow}>
            <PosEmoji name={grp.icon} size={20} />
            <Text style={styles.grpTitle}>{grp.title}</Text>
          </View>
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
      return <InfoBanner textStyle={styles.tipText} paragraphs={[block.text]} />;
    case "rich-tip":
      return (
        <InfoBanner
          textStyle={styles.tipText}
          paragraphs={[<Segments segments={block.segments} navigation={navigation} />]}
        />
      );
    case "tip-group":
      return (
        <InfoBanner
          textStyle={styles.tipText}
          paragraphs={block.items.map((it, i) =>
            "text" in it ? it.text : <Segments key={i} segments={it.segments} navigation={navigation} />
          )}
        />
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
              <View style={styles.listTermRow}>
                {it.icon && <PosEmoji name={it.icon} size={16} />}
                <Text style={styles.listTerm}>
                  <Segments segments={it.term} navigation={navigation} />
                </Text>
              </View>
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

// Одна тема — той самий рендер, що й раніше був єдиним тілом екрана. Винесено
// окремо, бо тепер його рендерить і одиночний випадок (тема не знайдена —
// немає, technically завжди рендериться через FlatList нижче), і кожна
// "сторінка" горизонтального пейджера.
function GrammarTopicPage({ topic, navigation }: { topic: GrammarTopic; navigation: GrammarNav }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(8) }]}
      showsVerticalScrollIndicator={false}
    >
      {topic.blocks.map((b, i) => (
        <Block key={i} block={b} navigation={navigation} />
      ))}
    </ScrollView>
  );
}

// Лише "готові" теми беруть участь у свайпі — те саме правило, за яким
// GrammarCategoriesScreen вирішує, які теми взагалі клікабельні. Заблокована
// тема (наразі таких нема) просто випадає з набору, без спецкоду під неї.
const READY_TOPICS = GRAMMAR_TOPICS.filter((t) => t.ready);

export function GrammarTopicScreen({ route, navigation }: Props) {
  const { width } = useWindowDimensions();

  const startIndex = Math.max(
    0,
    READY_TOPICS.findIndex((t) => t.id === route.params.topicId)
  );
  const [idx, setIdx] = useState(startIndex);
  const [areaH, setAreaH] = useState(0);
  const current = READY_TOPICS[idx];

  // На відміну від BrowseCardScreen (де заголовок — стала назва категорії
  // для всіх карток), тут кожна тема має власну змістовну назву — тому
  // заголовок оновлюється при кожному свайпі, а не лишається статичним.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: current ? current.title : "Граматика",
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {READY_TOPICS.length > 0 && (
            <Text style={styles.counter}>
              {idx + 1} / {READY_TOPICS.length}
            </Text>
          )}
          <HomeHeaderButton navigation={navigation} />
        </View>
      ),
    });
  }, [navigation, current, idx]);

  function onArea(e: LayoutChangeEvent) {
    const h = e.nativeEvent.layout.height;
    if (h !== areaH) setAreaH(h);
  }

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== idx) setIdx(i);
  }

  function renderItem({ item }: ListRenderItemInfo<GrammarTopic>) {
    return (
      <View style={{ width, height: areaH }}>
        <GrammarTopicPage topic={item} navigation={navigation} />
      </View>
    );
  }

  if (READY_TOPICS.length === 0) {
    return (
      <View style={styles.safe}>
        <Text style={styles.p}>Тему не знайдено.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }} onLayout={onArea}>
      {areaH > 0 && (
        <FlatList
          data={READY_TOPICS}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={onMomentumEnd}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  counter: { color: theme.colors.textDim, fontSize: 15, fontWeight: "700" },
  p: { color: theme.colors.textDim, fontSize: 15, lineHeight: 22, marginBottom: theme.space(3) },
  h2: {
    color: theme.colors.honey,
    fontSize: 17,
    fontWeight: "800",
    marginTop: theme.space(2),
    marginBottom: theme.space(2),
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
  listTermRow: { flexDirection: "row", alignItems: "center", gap: 6 },
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
  caseCz: { color: theme.genderColor.masc_inan, fontSize: 13, fontWeight: "600", fontStyle: "italic" },
  caseQ: { color: theme.colors.textFaint, fontSize: 13 },
  grpBox: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(3),
  },
  grpTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(2),
    marginBottom: theme.space(2),
  },
  grpTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800" },
  patRow: { marginBottom: theme.space(2) },
  patName: { color: theme.colors.mint, fontSize: 15, fontWeight: "800" },
  patNote: { color: theme.colors.textDim, fontSize: 13, lineHeight: 18 },
});
