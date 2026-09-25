import React, { useCallback, useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { EditButton } from "../components/EditButton";
import { MistakeDeckCard } from "../components/MistakeDeckCard";
import { PosEmoji } from "../components/PosEmoji";
import { CONJUNCTIONS } from "../data/conjunctions";
import { SERVICE_ADVERBS } from "../data/serviceAdverbs";
import { CONJUNCTIONS_TITLE, SERVICE_ADVERBS_TITLE } from "../data/groupTitles";
import { plural } from "../utils/plural";
import { ModeToggle, BrowseMode } from "../components/ModeToggle";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceWords">;

// Локальні константи — той самий принцип, що ALL_INTERROGATIVE_ADVERB_IDS в
// InterrogativesScreen (суцільний список, не потребує окремого resolver-файлу
// — на відміну від interrogative, тут немає мішаних форм запису).
const ALL_CONJUNCTION_IDS: string[] = CONJUNCTIONS.map((w) => w.id);
const ALL_SERVICE_ADVERB_IDS: string[] = SERVICE_ADVERBS.map((w) => w.id);
const ALL_SERVICE_WORD_IDS: string[] = [...ALL_CONJUNCTION_IDS, ...ALL_SERVICE_ADVERB_IDS];

// Розділ "Службові слова" — окремий тематичний хаб (сполучники + загальні
// прислівники), та сама модель, що "Питальні слова" (InterrogativesScreen):
// обидві групи — незмінна частина мови (spojky, příslovce), не вкладаються в
// жодну наявну тему (Прислівники — лише просторові де/куди/звідки).
//
// Механіка (Тренування/Перегляд, "Повторити помилки") — та сама, що в
// InterrogativesScreen. Власне сховище прогресу PROGRESS_KEYS.serviceWords —
// ОДНЕ на весь розділ (обидві групи разом), тому й "Повторити помилки" вгорі
// — один спільний лічильник, не по групі.
//
// БЕЗ КВІЗУ (узгоджено, той самий принцип, що INTERROGATIVE_MISC): незмінні
// слова не мають форми для multiple-choice — лише словник+граматика.
export function ServiceWordsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<BrowseMode>("browse");
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProgressFrom(PROGRESS_KEYS.serviceWords).then((p: Record<string, CardProgress>) => {
        if (!alive) return;
        const all = getMistakeIds(p);
        setMistakeIds(new Set([...all].filter((id) => ALL_SERVICE_WORD_IDS.includes(id))));
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const mistakeCount = mistakeIds.size;

  function startMistakes() {
    const ids = ALL_SERVICE_WORD_IDS.filter((id) => mistakeIds.has(id));
    if (ids.length === 0) return;
    navigation.navigate("DeclSession", { title: "Повторити помилки", kind: "service-word", entryIds: ids, isMistakeRepeat: true });
  }

  function openConjunctions() {
    if (mode === "browse") {
      navigation.navigate("BrowseList", { kind: "service-word", entryIds: ALL_CONJUNCTION_IDS, title: CONJUNCTIONS_TITLE });
    } else {
      navigation.navigate("DeclSession", { title: CONJUNCTIONS_TITLE, kind: "service-word", entryIds: ALL_CONJUNCTION_IDS });
    }
  }

  function openServiceAdverbs() {
    if (mode === "browse") {
      navigation.navigate("BrowseList", { kind: "service-word", entryIds: ALL_SERVICE_ADVERB_IDS, title: SERVICE_ADVERBS_TITLE });
    } else {
      navigation.navigate("DeclSession", { title: SERVICE_ADVERBS_TITLE, kind: "service-word", entryIds: ALL_SERVICE_ADVERB_IDS });
    }
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "train" && (
        <MistakeDeckCard count={mistakeCount} wordForms={["слово", "слова", "слів"]} onPress={startMistakes} />
      )}

      {/* Сполучники — колір link (сіра "ланка", буквально "зв'язок"). */}
      <View style={styles.row}>
        <Pressable style={styles.rowMain} onPress={openConjunctions}>
          <PosEmoji name="link" size={32} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{CONJUNCTIONS_TITLE}</Text>
            <Text style={styles.hint}>a, ale, nebo, protože, že, když…</Text>
            <Text style={styles.sub}>
              {ALL_CONJUNCTION_IDS.length} {plural(ALL_CONJUNCTION_IDS.length, "слово", "слова", "слів")}
            </Text>
          </View>
        </Pressable>
        {mode === "train" && (
          <EditButton onPress={() => navigation.navigate("ConjunctionSelection")} />
        )}
      </View>

      {/* Прислівники (загальні, не просторові) — колір sparkles (акцент/модальність). */}
      <View style={styles.row}>
        <Pressable style={styles.rowMain} onPress={openServiceAdverbs}>
          <PosEmoji name="sparkles" size={32} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{SERVICE_ADVERBS_TITLE}</Text>
            <Text style={styles.hint}>opravdu, vlastně, prostě, už…</Text>
            <Text style={styles.sub}>
              {ALL_SERVICE_ADVERB_IDS.length} {plural(ALL_SERVICE_ADVERB_IDS.length, "слово", "слова", "слів")}
            </Text>
          </View>
        </Pressable>
        {mode === "train" && (
          <EditButton onPress={() => navigation.navigate("ServiceAdverbSelection")} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    marginBottom: theme.space(3),
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    padding: theme.space(4),
  },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  hint: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  sub: { color: theme.colors.textFaint, fontSize: 12, marginTop: 4 },
});
