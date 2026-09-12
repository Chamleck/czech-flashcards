import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { NOUNS } from "../data/nouns";
import { VERBS } from "../data/verbs";
import { ADJECTIVES } from "../data/adjectives";
import { PRONOUNS } from "../data/pronouns";
import { PREPOSITIONS } from "../data/prepositions";
import { ADVERBS } from "../data/adverbs";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";
import { plural } from "../utils/plural";
import { ALL_NUMERAL_IDS } from "../utils/numeralEntries";
import { searchWords, SearchEntry } from "../utils/searchIndex";
import {
  KIND_LABEL_NOUNS,
  KIND_LABEL_VERBS,
  KIND_LABEL_ADJECTIVES,
  KIND_LABEL_PRONOUNS,
  KIND_LABEL_NUMERALS,
  KIND_LABEL_PREPOSITIONS,
  KIND_LABEL_ADVERBS,
} from "../data/groupTitles";

type Props = NativeStackScreenProps<RootStackParamList, "WordsPartOfSpeech">;

interface POSTile {
  key: "nouns" | "verbs" | "adjectives" | "pronouns" | "numerals" | "prepositions" | "adverbs";
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  ready: boolean;
}

// Числівники винесено в окремий розділ. Порядкові живуть серед прикметників
// (category "ordinal"), а sto/tisíc серед іменників (category "numbers"), обидві
// приховані зі "своїх" розділів через hiddenFromPartOfSpeech. Тому лічильники в
// плитках Іменники/Прикметники рахуємо БЕЗ прихованих категорій — щоб число
// збігалося з тим, що учень реально бачить на екрані частини мови.
const HIDDEN_NOUN_CATS = new Set(["numbers"]);
const HIDDEN_ADJ_CATS = new Set(["ordinal"]);
const VISIBLE_NOUNS = NOUNS.filter((n) => !HIDDEN_NOUN_CATS.has(n.category)).length;
const VISIBLE_ADJS = ADJECTIVES.filter((a) => !HIDDEN_ADJ_CATS.has(a.category)).length;

const TILES: POSTile[] = [
  { key: "nouns", emoji: "🔤", title: KIND_LABEL_NOUNS, subtitle: `${VISIBLE_NOUNS} слів з відмінюванням`, color: theme.colors.honey, ready: true },
  { key: "verbs", emoji: "🏃", title: KIND_LABEL_VERBS, subtitle: `${VERBS.length} слів з дієвідміною`, color: theme.colors.mint, ready: true },
  { key: "adjectives", emoji: "🎨", title: KIND_LABEL_ADJECTIVES, subtitle: `${VISIBLE_ADJS} слів з відмінюванням`, color: theme.colors.lilac, ready: true },
  { key: "pronouns", emoji: "👉", title: KIND_LABEL_PRONOUNS, subtitle: `${PRONOUNS.length} присвійних і вказівних`, color: theme.colors.coral, ready: true },
  { key: "numerals", emoji: "🔢", title: KIND_LABEL_NUMERALS, subtitle: "порядкові, сотні, тисячі", color: "#e0a458", ready: true },
  { key: "prepositions", emoji: "🧭", title: KIND_LABEL_PREPOSITIONS, subtitle: `${PREPOSITIONS.length} з фіксованим відмінком`, color: "#7fb8e0", ready: true },
  { key: "adverbs", emoji: "🗺️", title: KIND_LABEL_ADVERBS, subtitle: `${ADVERBS.length} — де? куди? звідки?`, color: "#8ed081", ready: true },
];

export function WordsPartOfSpeechScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [nounMistakes, setNounMistakes] = useState(0);
  const [verbMistakes, setVerbMistakes] = useState(0);
  const [adjMistakes, setAdjMistakes] = useState(0);
  const [pronMistakes, setPronMistakes] = useState(0);
  const [numeralMistakes, setNumeralMistakes] = useState(0);
  const [prepMistakes, setPrepMistakes] = useState(0);
  const [adverbMistakes, setAdverbMistakes] = useState(0);

  // Пошук: query порожній → звичайний грід тайлів; непорожній → результати.
  // Автофокус — ЛИШЕ коли сюди прийшли з іконки пошуку (focusSearch:true),
  // не при звичайному "назад" (інакше клавіатура вискакувала б несподівано).
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  useEffect(() => {
    if (route.params?.focusSearch) {
      // transitionEnd (не setTimeout з підібраним числом) — офіційна подія
      // React Navigation, спрацьовує РІВНО коли анімація переходу реально
      // завершилась, незалежно від швидкості пристрою. 350ms був єдиним
      // таким магічним числом у проєкті — реальна крихкість, спіймана
      // аудитом: на повільному пристрої анімація могла тривати довше, і
      // фокус спрацював би до того, як екран справді готовий.
      const unsubscribe = navigation.addListener("transitionEnd", () => {
        searchInputRef.current?.focus();
        navigation.setParams({ focusSearch: undefined });
      });
      return unsubscribe;
    }
  }, [route.params?.focusSearch, navigation]);
  const results = query.trim().length >= 2 ? searchWords(query) : [];

  // Рахуємо помилки по всіх колодах при кожному фокусі екрана.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([
        loadProgressFrom(PROGRESS_KEYS.nouns),
        loadProgressFrom(PROGRESS_KEYS.verbs),
        loadProgressFrom(PROGRESS_KEYS.adjectives),
        loadProgressFrom(PROGRESS_KEYS.pronouns),
        loadProgressFrom(PROGRESS_KEYS.numerals),
        loadProgressFrom(PROGRESS_KEYS.prepositions),
        loadProgressFrom(PROGRESS_KEYS.adverbs),
      ]).then(
        ([np, vp, ap, pp, mp, prp, advp]: [
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>,
          Record<string, CardProgress>
        ]) => {
          if (!alive) return;
          setNounMistakes(getMistakeIds(np).size);
          setVerbMistakes(getMistakeIds(vp).size);
          setAdjMistakes(getMistakeIds(ap).size);
          // "Займенники" тепер одне сховище PROGRESS_KEYS.pronouns на всі три
          // групи (особові+присвійні+питальні) — раніше було два ключі + merge,
          // і питальні взагалі не рахувались у цьому лічильнику (existing-баг,
          // виправлений консолідацією).
          setPronMistakes(getMistakeIds(pp).size);
          const numeralIds = [...getMistakeIds(mp)].filter((id) => ALL_NUMERAL_IDS.includes(id));
          setNumeralMistakes(numeralIds.length);
          setPrepMistakes(getMistakeIds(prp).size);
          setAdverbMistakes(getMistakeIds(advp).size);
        }
      );
      return () => {
        alive = false;
      };
    }, [])
  );

  function open(key: POSTile["key"]) {
    if (key === "nouns") navigation.navigate("WordCategories");
    else if (key === "verbs") navigation.navigate("VerbCategories");
    else if (key === "adjectives") navigation.navigate("AdjectiveCategories");
    else if (key === "pronouns") navigation.navigate("PronounGroups");
    else if (key === "numerals") navigation.navigate("Numerals");
    else if (key === "prepositions") navigation.navigate("Prepositions");
    else if (key === "adverbs") navigation.navigate("Adverbs");
  }

  function mistakesFor(key: POSTile["key"]): number {
    if (key === "nouns") return nounMistakes;
    if (key === "verbs") return verbMistakes;
    if (key === "adjectives") return adjMistakes;
    if (key === "pronouns") return pronMistakes;
    if (key === "numerals") return numeralMistakes;
    if (key === "prepositions") return prepMistakes;
    if (key === "adverbs") return adverbMistakes;
    return 0;
  }

  // Тап по результату пошуку: "пуш" трьох екранів поспіль, точно як реальна
  // навігаційна глибина від кореня (parentScreen → BrowseList → BrowseCard).
  // Усі проміжні екрани вибору категорії не приймають параметрів, тож це
  // коштує майже нічого — і "назад" тепер веде туди ж, куди привів би
  // звичайний тап по категорії, без скорочень.
  function openSearchResult(entry: SearchEntry) {
    const initialIndex = Math.max(0, entry.entryIds.indexOf(entry.id));
    navigation.push(entry.parentScreen);
    navigation.push("BrowseList", { kind: entry.kind, entryIds: entry.entryIds, title: entry.title });
    navigation.push("BrowseCard", {
      kind: entry.kind,
      entryIds: entry.entryIds,
      initialIndex,
      title: entry.title,
    });
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={searchInputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Пошук слова (cz/укр)…"
          placeholderTextColor={theme.colors.textFaint}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={10}>
            <Text style={styles.searchClear}>✕</Text>
          </Pressable>
        )}
      </View>

      {query.trim().length >= 2 ? (
        results.length > 0 ? (
          <View style={styles.resultsList}>
            {results.map((r) => (
              <Pressable key={`${r.kind}:${r.id}`} style={styles.resultRow} onPress={() => openSearchResult(r)}>
                <Text style={styles.resultIcon}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultCz} numberOfLines={1}>{r.cz}</Text>
                  <Text style={styles.resultUk} numberOfLines={1}>{r.uk}</Text>
                </View>
                <Text style={styles.resultKind} numberOfLines={1}>{r.kindLabel}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsIcon}>🔍</Text>
            <Text style={styles.noResultsTitle}>Нічого не знайдено за «{query.trim()}»</Text>
            <Text style={styles.noResultsHint}>Спробуй іншою мовою або перевір написання</Text>
          </View>
        )
      ) : (
        <>
          <Text style={styles.intro}>Оберіть частину мови для вивчення</Text>

          <View style={styles.grid}>
            {TILES.map((t) => {
              const m = mistakesFor(t.key);
              const subtitle =
                m > 0 ? `🔁 ${m} ${plural(m, "слово", "слова", "слів")} на повторення` : t.subtitle;
              return (
                <Pressable
                  key={t.key}
                  style={[styles.tile, { borderColor: t.color }, !t.ready && styles.tileDim]}
                  onPress={() => t.ready && open(t.key)}
                >
                  <Text style={styles.tileEmoji}>{t.emoji}</Text>
                  <Text style={styles.tileTitle}>{t.title}</Text>
                  <Text style={[styles.tileSub, m > 0 && styles.tileSubAlert]}>{subtitle}</Text>
                  {!t.ready && <Text style={styles.soon}>🔒</Text>}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(5) },
  intro: { color: theme.colors.textDim, fontSize: 15, marginBottom: theme.space(5) },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(2),
    backgroundColor: theme.colors.bgCard,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.lilac,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space(3),
    paddingHorizontal: theme.space(3.5),
    marginBottom: theme.space(5),
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 15, padding: 0 },
  searchClear: { color: theme.colors.textFaint, fontSize: 16, paddingHorizontal: 4 },
  resultsList: { gap: theme.space(2) },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(3),
  },
  resultIcon: { fontSize: 22 },
  resultCz: { color: theme.colors.honey, fontSize: 16, fontWeight: "800" },
  resultUk: { color: theme.colors.textDim, fontSize: 12, marginTop: 1 },
  // Ярлик категорії — ЗАВЖДИ в один рядок за шириною вмісту. flexShrink:0 не
  // дає йому стискатись (усі назви — одне слово, найдовше 11 літер), натомість
  // стискається середня колонка cz/uk (у них numberOfLines={1} з трикрапкою).
  // Раніше був maxWidth:70 + numberOfLines={2}: одне слово ~72px не влізало і
  // RN ламав його ПОСЕРЕДИНІ — одинока літера падала на другий рядок. Тепер
  // адаптивно для будь-якої довжини ярлика й ширини екрана, без магічних чисел.
  resultKind: { color: theme.colors.textFaint, fontSize: 10, textTransform: "uppercase", flexShrink: 0, textAlign: "right" },
  noResults: { alignItems: "center", paddingVertical: theme.space(8) },
  noResultsIcon: { fontSize: 32, opacity: 0.4 },
  noResultsTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "700", marginTop: theme.space(2), textAlign: "center" },
  noResultsHint: { color: theme.colors.textFaint, fontSize: 12, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(3) },
  tile: {
    width: "47%",
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    padding: theme.space(4),
    minHeight: 130,
  },
  tileDim: { opacity: 0.5 },
  tileEmoji: { fontSize: 34 },
  tileTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "800", marginTop: theme.space(2) },
  tileSub: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  tileSubAlert: { color: theme.colors.coral, fontWeight: "700" },
  soon: { position: "absolute", top: theme.space(3), right: theme.space(3), fontSize: 16 },
});
