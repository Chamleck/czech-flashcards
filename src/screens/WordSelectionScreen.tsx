import React, { useLayoutEffect, useMemo } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { NOUNS } from "../data/nouns";
import { CATEGORY_BY_KEY } from "../data/categories";
import { GenderIcon } from "../components/GenderIcon";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "WordSelection">;

export function WordSelectionScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const meta = CATEGORY_BY_KEY[category];
  const words = useMemo(() => NOUNS.filter((n) => n.category === category), [category]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: meta.title,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation, meta]);

  return (
    <SelectionList
      words={words}
      czColor={(w) => theme.genderColor[w.gender]}
      renderExtra={(w) => <GenderIcon gender={w.gender} size={20} />}
      onStart={(ids) =>
        navigation.navigate("WordSession", { title: meta.title, entryIds: ids })
      }
    />
  );
}
