import React, { useCallback, useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { EditButton } from "../components/EditButton";
import { ALL_INTERROGATIVE_IDS } from "../utils/interrogativeEntries";
import { INTERROGATIVE_ADVERBS } from "../data/interrogativeAdverbs";
import { INTERROGATIVE_MISC } from "../data/interrogativeMisc";
import { INTERROGATIVE_GROUP_TITLE, INTERROGATIVE_ADVERBS_GROUP_TITLE, INTERROGATIVE_MISC_GROUP_TITLE } from "../data/groupTitles";
import { plural } from "../utils/plural";
import { ModeToggle, BrowseMode } from "../components/ModeToggle";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";

type Props = NativeStackScreenProps<RootStackParamList, "Interrogatives">;

// Локальні константи — той самий принцип, що ALL_ADVERB_IDS в AdverbsScreen
// (суцільний список без підгруп, не потребує окремого resolver-файлу).
const ALL_INTERROGATIVE_ADVERB_IDS: string[] = INTERROGATIVE_ADVERBS.map((w) => w.id);
const ALL_INTERROGATIVE_MISC_IDS: string[] = INTERROGATIVE_MISC.map((w) => w.id);

// Розділ "Питальні слова" — окремий тематичний хаб усіх питальних виразів
// (tázací výrazy). На відміну від інших розділів "Слів", він НЕ по одній
// частині мови: питальні перетинають частини мови (займенники kdo/co/jaký/
// который/čí, далі — прислівники kde/kam/…, числівник kolik), але для учня це
// один природний блок "як ставити запитання". Тому власний розділ, а не
// підгрупа "Займенників" (де питальні лежали раніше — категорійно некоректно).
//
// Механіка (Тренування/Перегляд, "Повторити помилки") — та сама, що в
// PronounGroups, з якого займенникову групу винесено. Власне сховище прогресу
// PROGRESS_KEYS.interrogatives — ОДНЕ на весь розділ (обидві групи разом),
// тому й "Повторити помилки" вгорі — один спільний лічильник, не по групі.
//
// Прислівникова група (kde/kam/odkud/kudy) і "Інша" (kdy/jak/proč/kolik) —
// теж мають ✏️ вибір слів, як і займенникова: по 4 слова кожна — не
// вироджений випадок (на відміну від груп РІВНО з 1 словом, як
// lokal/instrumental у прийменників, де пікер не має сенсу).
// "Інша" — БЕЗ КВІЗУ (лише словник+граматика, узгоджено окремо): kdy/jak/proč
// прозорі когнати, kolik керує родовим множини так само, як pět+ у
// numeralAgreementEngine — дублювати механізм немає сенсу.

export function InterrogativesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<BrowseMode>("browse");
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProgressFrom(PROGRESS_KEYS.interrogatives).then((p: Record<string, CardProgress>) => {
        if (!alive) return;
        // Фільтр за ALL_INTERROGATIVE_IDS: у сховищі можуть лишатись осиротілі
        // записи (напр. після переносу групи), які не належать жодній чинній
        // картці — не рахуємо їх у лічильнику помилок.
        const all = getMistakeIds(p);
        setMistakeIds(new Set([...all].filter((id) => ALL_INTERROGATIVE_IDS.includes(id))));
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const mistakeCount = mistakeIds.size;

  function startMistakes() {
    const ids = ALL_INTERROGATIVE_IDS.filter((id) => mistakeIds.has(id));
    if (ids.length === 0) return;
    navigation.navigate("DeclSession", { title: "Повторити помилки", kind: "interrogative", entryIds: ids });
  }

  function openPronouns() {
    if (mode === "browse") {
      navigation.navigate("BrowseList", { kind: "interrogative", entryIds: ALL_INTERROGATIVE_IDS, title: INTERROGATIVE_GROUP_TITLE });
    } else {
      navigation.navigate("DeclSession", { title: INTERROGATIVE_GROUP_TITLE, kind: "interrogative", entryIds: ALL_INTERROGATIVE_IDS });
    }
  }

  function openAdverbs() {
    if (mode === "browse") {
      navigation.navigate("BrowseList", { kind: "interrogative", entryIds: ALL_INTERROGATIVE_ADVERB_IDS, title: INTERROGATIVE_ADVERBS_GROUP_TITLE });
    } else {
      navigation.navigate("DeclSession", { title: INTERROGATIVE_ADVERBS_GROUP_TITLE, kind: "interrogative", entryIds: ALL_INTERROGATIVE_ADVERB_IDS });
    }
  }

  function openMisc() {
    if (mode === "browse") {
      navigation.navigate("BrowseList", { kind: "interrogative", entryIds: ALL_INTERROGATIVE_MISC_IDS, title: INTERROGATIVE_MISC_GROUP_TITLE });
    } else {
      navigation.navigate("DeclSession", { title: INTERROGATIVE_MISC_GROUP_TITLE, kind: "interrogative", entryIds: ALL_INTERROGATIVE_MISC_IDS });
    }
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "train" && (
        <Pressable
          style={[styles.mistakeCard, mistakeCount === 0 && styles.mistakeCardEmpty]}
          onPress={startMistakes}
          disabled={mistakeCount === 0}
        >
          <Text style={styles.mistakeEmoji}>🔁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.mistakeTitle}>Повторити помилки</Text>
            <Text style={styles.mistakeSub}>
              {mistakeCount === 0
                ? "Поки що немає слів на повторення"
                : `${mistakeCount} ${plural(mistakeCount, "слово", "слова", "слів")} чекає`}
            </Text>
          </View>
          {mistakeCount > 0 && <Text style={styles.mistakeBadge}>{mistakeCount}</Text>}
        </Pressable>
      )}

      {/* Займенникові питальні — jaký/который/čí (адʼєктивне відмінювання) +
          kdo/co (без роду, одна форма на відмінок). Колір genderColor.masc_inan
          (синій) — усталений "колір питальних" ще з часів, коли група жила в
          Займенниках. */}
      <View style={[styles.row, { borderLeftColor: theme.genderColor.masc_inan }]}>
        <Pressable style={styles.rowMain} onPress={openPronouns}>
          <Text style={styles.emoji}>❓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Займенники</Text>
            <Text style={styles.hint}>kdo, co, jaký, který, čí</Text>
            <Text style={styles.sub}>
              {ALL_INTERROGATIVE_IDS.length} {plural(ALL_INTERROGATIVE_IDS.length, "слово", "слова", "слів")}
            </Text>
          </View>
        </Pressable>
        {mode === "train" && (
          <EditButton onPress={() => navigation.navigate("InterrogativeSelection")} />
        )}
      </View>

      {/* Прислівникова група — kde/kam/odkud/kudy. Колір mint: відрізняє
          ряд від займенникового (masc_inan/синій), той самий mint, що вже
          усталений як "знаю"/акцент прислівників-відповідей в AdverbsScreen. */}
      <View style={[styles.row, { borderLeftColor: theme.colors.mint }]}>
        <Pressable style={styles.rowMain} onPress={openAdverbs}>
          <Text style={styles.emoji}>🗺️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Прислівники</Text>
            <Text style={styles.hint}>kde, kam, odkud, kudy</Text>
            <Text style={styles.sub}>
              {ALL_INTERROGATIVE_ADVERB_IDS.length} {plural(ALL_INTERROGATIVE_ADVERB_IDS.length, "слово", "слова", "слів")}
            </Text>
          </View>
        </Pressable>
        {mode === "train" && (
          <EditButton onPress={() => navigation.navigate("InterrogativeAdverbSelection")} />
        )}
      </View>

      {/* "Інша" група — kdy/jak/proč/kolik. Колір honey: третій акцент ряду
          хаба, відрізняє від займенникового (синій) і прислівникового (mint). */}
      <View style={[styles.row, { borderLeftColor: theme.colors.honey }]}>
        <Pressable style={styles.rowMain} onPress={openMisc}>
          <Text style={styles.emoji}>❔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Інші</Text>
            <Text style={styles.hint}>kdy, jak, proč, kolik</Text>
            <Text style={styles.sub}>
              {ALL_INTERROGATIVE_MISC_IDS.length} {plural(ALL_INTERROGATIVE_MISC_IDS.length, "слово", "слова", "слів")}
            </Text>
          </View>
        </Pressable>
        {mode === "train" && (
          <EditButton onPress={() => navigation.navigate("InterrogativeMiscSelection")} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  mistakeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.coral,
    padding: theme.space(4),
    marginBottom: theme.space(3),
  },
  mistakeCardEmpty: { opacity: 0.5, borderColor: theme.colors.textFaint },
  mistakeEmoji: { fontSize: 28 },
  mistakeTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  mistakeSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  mistakeBadge: {
    color: "#1a1020",
    backgroundColor: theme.colors.coral,
    fontWeight: "800",
    fontSize: 15,
    minWidth: 30,
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    marginBottom: theme.space(3),
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    padding: theme.space(4),
  },
  emoji: { fontSize: 32 },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  hint: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  sub: { color: theme.colors.textFaint, fontSize: 12, marginTop: 4 },
});
