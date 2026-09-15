import React, { useLayoutEffect, useMemo } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { ADVERBS } from "../data/adverbs";
import { ADVERBS_GROUP_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "AdverbSelection">;

export function AdverbSelectionScreen({ navigation }: Props) {
  // SpatialAdverbEntry не має top-level "cz" (кілька сенсів-слів) — той самий
  // композит "vlevo / doleva / zleva", що вже використовує browseData.ts для
  // списку перегляду.
  const words = useMemo(
    () => ADVERBS.map((a) => ({ id: a.id, uk: a.uk, cz: a.senses.map((s) => s.cz).join(" / ") })),
    []
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: ADVERBS_GROUP_TITLE,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation]);

  return (
    <SelectionList
      words={words}
      onStart={(ids) => navigation.navigate("AdverbSession", { title: ADVERBS_GROUP_TITLE, entryIds: ids })}
    />
  );
}
