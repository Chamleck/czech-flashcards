import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { AdjPronounCard, DeclEntry } from "../components/AdjPronounCard";
import { PersonalPronounCard } from "../components/PersonalPronounCard";
import { NumeralCard } from "../components/NumeralCard";
import { FlashCard } from "../components/FlashCard";
import { ADJECTIVES } from "../data/adjectives";
import { PRONOUNS } from "../data/pronouns";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { CARDINALS } from "../data/cardinals";
import { NOUNS } from "../data/nouns";
import { resolveNumeral } from "../utils/numeralEntries";
import { resolvePronoun } from "../utils/pronounEntries";
import { INTERROGATIVE_ALL } from "../data/interrogativePronouns";
import { resolveInterrogative } from "../utils/interrogativeEntries";
import {
  loadProgressFrom,
  saveProgressTo,
  updateCard,
  buildQueue,
  PROGRESS_KEYS,
} from "../utils/progress";
import { stopSpeech, useStopSpeechOnUnmount } from "../utils/useSpeech";

type Props = NativeStackScreenProps<RootStackParamList, "DeclSession">;

export function DeclSessionScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { title, kind, entryIds } = route.params;
  useStopSpeechOnUnmount();

  const isPersonal = kind === "personal";
  const isCardinal = kind === "cardinal";
  const isMixed = kind === "numeral-mixed";
  const isPronounMixed = kind === "pronoun-mixed";
  const isInterrogative = kind === "interrogative";
  // "ordinal"/"cardinal"/"numeral-mixed" пишуть у спільне сховище "Числівники".
  // Увесь розділ "Займенники" (personal / pronoun / interrogative / pronoun-mixed)
  // тепер теж пише в ОДНЕ сховище PROGRESS_KEYS.pronouns (консолідовано міграцією
  // migratePronounStores) — тому окремих гілок сховища для них більше немає.
  const storageKey =
    kind === "adjective"
      ? PROGRESS_KEYS.adjectives
      : kind === "ordinal" || kind === "cardinal" || kind === "numeral-mixed"
      ? PROGRESS_KEYS.numerals
      : kind === "personal"
      ? PROGRESS_KEYS.pronouns
      : isInterrogative
      ? PROGRESS_KEYS.pronouns
      : PROGRESS_KEYS.pronouns;
  // Для "numeral-mixed"/"pronoun-mixed"/"interrogative"/"personal" датасет —
  // об'єднання джерел розділу; конкретна картка вибирається ПОКАРТКОВО за id
  // (див. renderCard нижче через resolveNumeral/resolvePronoun).
  const dataset: { id: string }[] =
    kind === "adjective" || kind === "ordinal"
      ? ADJECTIVES
      : kind === "personal"
      ? PERSONAL_PRONOUNS
      : kind === "cardinal"
      ? CARDINALS
      : isMixed
      ? [...CARDINALS, ...ADJECTIVES, ...NOUNS]
      : isPronounMixed
      ? [...PRONOUNS, ...PERSONAL_PRONOUNS, ...INTERROGATIVE_ALL]
      : isInterrogative
      ? INTERROGATIVE_ALL
      : PRONOUNS;

  const entries = useMemo(
    () => dataset.filter((e) => entryIds.includes(e.id)),
    [dataset, entryIds]
  );

  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [loaded, setLoaded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ done: 0, known: 0 });

  useEffect(() => {
    // Усі kind (включно з pronoun-mixed) читають з одного storageKey —
    // розділ "Займенники" консолідований в PROGRESS_KEYS.pronouns.
    loadProgressFrom(storageKey).then((p) => {
      setProgress(p);
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const queue = useMemo<{ id: string }[]>(
    () => (loaded ? buildQueue(entries, progress) : []),
    // фіксуємо чергу лише при завантаженні, щоб картки не перестрибували
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loaded]
  );

  const finished = idx >= queue.length;

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {queue.length > 0 && (
            <Text style={styles.counter}>
              {finished ? queue.length : idx + 1} / {queue.length}
            </Text>
          )}
          <HomeHeaderButton navigation={navigation} />
        </View>
      ),
    });
  }, [navigation, title, idx, finished, queue.length]);

  if (!loaded) {
    return (
      <View style={styles.safe}>
        <Text style={styles.loading}>Завантаження…</Text>
      </View>
    );
  }

  const current = queue[idx];

  async function answer(knewIt: boolean) {
    if (!current) return;
    stopSpeech();
    // Усі kind (включно з pronoun-mixed) пишуть в один storageKey — розділ
    // "Займенники" консолідований, тому окремої гілки для змішаної сесії немає.
    const updated = {
      ...progress,
      [current.id]: updateCard(progress[current.id], current.id, knewIt),
    };
    setProgress(updated);
    await saveProgressTo(storageKey, updated);
    setStats((s) => ({ done: s.done + 1, known: s.known + (knewIt ? 1 : 0) }));
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  if (finished) {
    return (
      <View style={styles.safe}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Готово!</Text>
          <Text style={styles.doneText}>
            Пройдено карток: {stats.done}{"\n"}
            Знав одразу: {stats.known}
          </Text>
          <Pressable
            style={styles.againBtn}
            onPress={() => {
              setIdx(0);
              setStats({ done: 0, known: 0 });
            }}
          >
            <Text style={styles.againText}>Ще раз 🔁</Text>
          </Pressable>
          <Pressable style={styles.backHome} onPress={() => navigation.popToTop()}>
            <Text style={styles.backHomeText}>На головну 🏠</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Рендер картки поточного слова. Для звичайних режимів — за kind сесії;
  // для "numeral-mixed"/"pronoun-mixed" — покартково за id (той самий принцип
  // диспетчеризації, що CardFor у BrowseCardScreen).
  function renderCard() {
    const p = { revealed, onReveal: () => setRevealed(true) };
    if (isMixed) {
      const r = resolveNumeral(current.id);
      if (!r) return null;
      if (r.cardType === "cardinal")
        return <NumeralCard entry={r.entry as (typeof CARDINALS)[number]} {...p} />;
      if (r.cardType === "hundreds")
        return <FlashCard entry={r.entry as (typeof NOUNS)[number]} {...p} />;
      return <AdjPronounCard entry={r.entry as DeclEntry} {...p} />;
    }
    if (isPronounMixed) {
      const r = resolvePronoun(current.id);
      if (!r) return null;
      if (r.cardType === "personal")
        return <PersonalPronounCard entry={r.entry as (typeof PERSONAL_PRONOUNS)[number]} {...p} />;
      if (r.cardType === "interrogative")
        // Питальні всередині pronoun-mixed — теж змішана форма (kdo/co без
        // роду проти jaký/который/čí адʼєктивних), той самий принцип
        // диспетчеризації по формі запису, що й в BrowseCardScreen/CardFor.
        return "gendered" in (r.entry as object) ? (
          <PersonalPronounCard entry={r.entry as (typeof PERSONAL_PRONOUNS)[number]} {...p} />
        ) : (
          <AdjPronounCard entry={r.entry as DeclEntry} {...p} />
        );
      return <AdjPronounCard entry={r.entry as DeclEntry} {...p} />;
    }
    if (isInterrogative) {
      const r = resolveInterrogative(current.id);
      if (!r) return null;
      if (r.cardType === "core")
        return <PersonalPronounCard entry={r.entry as (typeof PERSONAL_PRONOUNS)[number]} {...p} />;
      return <AdjPronounCard entry={r.entry as DeclEntry} {...p} />;
    }
    if (isPersonal)
      return <PersonalPronounCard entry={current as (typeof PERSONAL_PRONOUNS)[number]} {...p} />;
    if (isCardinal) return <NumeralCard entry={current as (typeof CARDINALS)[number]} {...p} />;
    return <AdjPronounCard entry={current as DeclEntry} {...p} />;
  }

  return (
    <View style={styles.safe}>
      <View style={styles.cardArea}>{renderCard()}</View>

      {revealed && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + theme.space(4) }]}>
          <Pressable style={[styles.actionBtn, styles.dontKnow]} onPress={() => answer(false)}>
            <Text style={styles.actionText}>Ще повторити 🔁</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.know]} onPress={() => answer(true)}>
            <Text style={styles.actionText}>Знаю ✅</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { color: theme.colors.textDim, textAlign: "center", marginTop: 40 },
  counter: { color: theme.colors.textDim, fontSize: 15, fontWeight: "700" },
  cardArea: { flex: 1, paddingHorizontal: theme.space(4), paddingTop: theme.space(2) },
  actions: { flexDirection: "row", gap: theme.space(3), padding: theme.space(4) },
  actionBtn: { flex: 1, paddingVertical: theme.space(4), borderRadius: theme.radius.md, alignItems: "center" },
  dontKnow: { backgroundColor: theme.colors.coral },
  know: { backgroundColor: theme.colors.mint },
  actionText: { color: "#1a1020", fontWeight: "800", fontSize: 15 },
  doneWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.space(6) },
  doneEmoji: { fontSize: 64 },
  doneTitle: { color: theme.colors.text, fontSize: 26, fontWeight: "800", marginTop: 8 },
  doneText: { color: theme.colors.textDim, fontSize: 16, textAlign: "center", marginTop: 12, lineHeight: 24 },
  againBtn: {
    marginTop: theme.space(6),
    backgroundColor: theme.colors.honey,
    paddingVertical: theme.space(3.5),
    paddingHorizontal: theme.space(8),
    borderRadius: theme.radius.md,
  },
  againText: { color: "#3a1f00", fontWeight: "800", fontSize: 16 },
  backHome: { marginTop: theme.space(4) },
  backHomeText: { color: theme.colors.lilac, fontSize: 15, fontWeight: "700" },
});
