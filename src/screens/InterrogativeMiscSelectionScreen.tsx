import React, { useLayoutEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { INTERROGATIVE_MISC } from "../data/interrogativeMisc";
import { INTERROGATIVE_MISC_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "InterrogativeMiscSelection">;

export function InterrogativeMiscSelectionScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: INTERROGATIVE_MISC_TITLE,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation]);

  return (
    <SelectionList
      words={INTERROGATIVE_MISC}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: INTERROGATIVE_MISC_TITLE, kind: "interrogative", entryIds: ids })
      }
    />
  );
}
