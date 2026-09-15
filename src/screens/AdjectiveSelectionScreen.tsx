import React, { useLayoutEffect, useMemo } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { ADJECTIVES } from "../data/adjectives";
import { ADJ_CATEGORY_BY_KEY } from "../data/adjectiveCategories";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "AdjectiveSelection">;

export function AdjectiveSelectionScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const meta = ADJ_CATEGORY_BY_KEY[category];
  const words = useMemo(() => ADJECTIVES.filter((a) => a.category === category), [category]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${meta.emoji} ${meta.title}`,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation, meta]);

  return (
    <SelectionList
      words={words}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: `${meta.emoji} ${meta.title}`, kind: "adjective", entryIds: ids })
      }
    />
  );
}
