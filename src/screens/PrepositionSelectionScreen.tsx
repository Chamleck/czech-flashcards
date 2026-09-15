import React, { useLayoutEffect, useMemo } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CASE_LABELS } from "../types";
import { PREPOSITIONS } from "../data/prepositions";
import { PREP_DUAL_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "PrepositionSelection">;

export function PrepositionSelectionScreen({ route, navigation }: Props) {
  const { govCase } = route.params;

  const { words, title } = useMemo(() => {
    if (govCase === "dual") {
      return { words: PREPOSITIONS.filter((p) => p.type === "dual"), title: PREP_DUAL_TITLE };
    }
    const lbl = CASE_LABELS[govCase];
    return {
      words: PREPOSITIONS.filter((p) => p.type === "fixed" && p.govCase === govCase),
      title: `${lbl.uk} (${lbl.cz})`,
    };
  }, [govCase]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation, title]);

  return (
    <SelectionList
      words={words}
      onStart={(ids) => navigation.navigate("PrepositionSession", { title, entryIds: ids })}
    />
  );
}
