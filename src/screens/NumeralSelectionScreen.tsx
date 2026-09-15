import React, { useLayoutEffect, useMemo } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { CARDINALS } from "../data/cardinals";
import { ADJECTIVES } from "../data/adjectives";
import { NOUNS } from "../data/nouns";
import { NUMERAL_CARDINAL_TITLE, NUMERAL_ORDINAL_TITLE, NUMERAL_HUNDREDS_TITLE } from "../data/groupTitles";
import { PROGRESS_KEYS } from "../utils/progress";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList, SelectableWord } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "NumeralSelection">;

export function NumeralSelectionScreen({ route, navigation }: Props) {
  const { numKind } = route.params;

  // Явна анотація SelectableWord[] — без неї TS звужує тип useMemo до типу
  // ПЕРШОЇ гілки (CardinalEntry[]) і відмовляється присвоювати туди
  // AdjectiveEntry[]/NounEntry[] (навіть структурно сумісні — union масивів,
  // а не union елементів, TS не уніфікує автоматично). SelectionList
  // потребує лише {id,uk,cz}, тож звуження безпечне: усі три джерела його
  // задовольняють структурно.
  const { words, title }: { words: SelectableWord[]; title: string } = useMemo(() => {
    if (numKind === "cardinal") return { words: CARDINALS, title: NUMERAL_CARDINAL_TITLE };
    if (numKind === "ordinal")
      return { words: ADJECTIVES.filter((a) => a.category === "ordinal"), title: NUMERAL_ORDINAL_TITLE };
    return { words: NOUNS.filter((n) => n.category === "numbers"), title: NUMERAL_HUNDREDS_TITLE };
  }, [numKind]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation, title]);

  function onStart(ids: string[]) {
    if (numKind === "cardinal") navigation.navigate("DeclSession", { title, kind: "cardinal", entryIds: ids });
    else if (numKind === "ordinal") navigation.navigate("DeclSession", { title, kind: "ordinal", entryIds: ids });
    else navigation.navigate("WordSession", { title, entryIds: ids, storageKey: PROGRESS_KEYS.numerals });
  }

  return <SelectionList words={words} onStart={onStart} />;
}
