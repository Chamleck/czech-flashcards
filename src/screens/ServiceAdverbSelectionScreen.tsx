import React, { useLayoutEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { SERVICE_ADVERBS } from "../data/serviceAdverbs";
import { SERVICE_ADVERBS_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceAdverbSelection">;

export function ServiceAdverbSelectionScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: SERVICE_ADVERBS_TITLE,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation]);

  return (
    <SelectionList
      words={SERVICE_ADVERBS}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: SERVICE_ADVERBS_TITLE, kind: "service-word", entryIds: ids })
      }
    />
  );
}
