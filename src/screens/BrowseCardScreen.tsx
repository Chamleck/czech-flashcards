import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  ListRenderItemInfo,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, BrowseKind } from "../types";
import { theme } from "../utils/theme";
import { browseSource, browseEntries } from "../utils/browseData";
import { FlashCard } from "../components/FlashCard";
import { VerbCard } from "../components/VerbCard";
import { AdjPronounCard } from "../components/AdjPronounCard";
import { PersonalPronounCard } from "../components/PersonalPronounCard";
import { NumeralCard } from "../components/NumeralCard";
import { PrepositionCard } from "../components/PrepositionCard";
import { AdverbCard } from "../components/AdverbCard";
import { SimpleWordCard } from "../components/SimpleWordCard";
import { interrogativeCardType } from "../utils/interrogativeEntries";
import { pronounCardType } from "../utils/pronounEntries";
import { stopSpeech, useStopSpeechOnUnmount } from "../utils/useSpeech";
import { HomeHeaderButton, SearchHeaderButton } from "../components/HeaderIcons";

type Props = NativeStackScreenProps<RootStackParamList, "BrowseCard">;

// Рендер потрібної картки за частиною мови. Картки НЕ змінюються — просто завжди
// розкриті (revealed=true), тож кнопка "Показати відповідь" не з'являється, а
// onReveal — заглушка. Нова частина мови → одна нова гілка тут.
function CardFor({ kind, entry, navigation }: { kind: BrowseKind; entry: any; navigation: Props["navigation"] }) {
  const p = { revealed: true, onReveal: () => {} };
  switch (kind) {
    case "nouns":
      return <FlashCard entry={entry} {...p} />;
    case "verbs":
      // replace, не push: тут уже картка слова, і видові партнери можуть
      // посилатись один на одного — push нескінченно роздував би стек при
      // тапах туди-сюди, replace тримає глибину стека постійною.
      return <VerbCard entry={entry} {...p} navigation={navigation} linkMode="replace" />;
    case "cardinals":
      return <NumeralCard entry={entry} {...p} />;
    case "prepositions":
      return <PrepositionCard entry={entry} {...p} />;
    case "adverbs":
      return <AdverbCard entry={entry} {...p} />;
    case "interrogative": {
      // Розділ "Питальні слова" — три форми запису в одному kind, диспетчер
      // за id через interrogativeCardType (те саме, що DeclSessionScreen
      // використовує для kind="interrogative" у Тренуванні).
      const t = interrogativeCardType(entry.id);
      if (t === "core") return <PersonalPronounCard entry={entry} {...p} />;
      if (t === "invariant") return <SimpleWordCard entry={entry} {...p} />;
      return <AdjPronounCard entry={entry} {...p} />;
    }
    case "service-word":
      // Розділ "Службові слова" — на відміну від interrogative, тут завжди
      // одна форма (InvariantWordEntry), резолвер за id не потрібен.
      return <SimpleWordCard entry={entry} {...p} />;
    case "pronouns": {
      // Присвійні/вказівні vs особові — той самий принцип, що interrogative
      // вище: один kind, диспетчер картки по id через pronounCardType
      // (pronounEntries.ts), а не окремий BrowseKind.
      const t = pronounCardType(entry.id);
      if (t === "personal") return <PersonalPronounCard entry={entry} {...p} />;
      return <AdjPronounCard entry={entry} {...p} />;
    }
    case "adjectives":
    default:
      return <AdjPronounCard entry={entry} {...p} />;
  }
}

export function BrowseCardScreen({ route, navigation }: Props) {
  const { kind, entryIds, initialIndex, title } = route.params;
  const { width } = useWindowDimensions();
  useStopSpeechOnUnmount(); // вихід з екрана — не тягнемо звук

  const entries = useMemo(
    () => browseEntries(browseSource(kind), entryIds),
    [kind, entryIds]
  );

  const [idx, setIdx] = useState(initialIndex);
  const [areaH, setAreaH] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {entries.length > 0 && (
            <Text style={styles.counter}>
              {Math.min(idx + 1, entries.length)} / {entries.length}
            </Text>
          )}
          <HomeHeaderButton navigation={navigation} />
          <SearchHeaderButton navigation={navigation} />
        </View>
      ),
    });
  }, [navigation, title, idx, entries.length]);

  function onArea(e: LayoutChangeEvent) {
    const h = e.nativeEvent.layout.height;
    if (h !== areaH) setAreaH(h);
  }

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== idx) {
      stopSpeech(); // свайпнули на іншу картку — звук попередньої не тягнемо
      setIdx(i);
    }
  }

  function renderItem({ item }: ListRenderItemInfo<{ id: string }>) {
    return (
      <View style={{ width, height: areaH }}>
        <View style={styles.page}>
          <CardFor kind={kind} entry={item} navigation={navigation} />
        </View>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.safe}>
        <Text style={styles.empty}>Немає слів для перегляду.</Text>
      </View>
    );
  }

  return (
    <View style={styles.safe} onLayout={onArea}>
      {areaH > 0 && (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
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
  page: { flex: 1, paddingHorizontal: theme.space(4), paddingVertical: theme.space(3) },
  counter: { color: theme.colors.textDim, fontSize: 15, fontWeight: "700" },
  empty: { color: theme.colors.textDim, textAlign: "center", marginTop: 40 },
});
