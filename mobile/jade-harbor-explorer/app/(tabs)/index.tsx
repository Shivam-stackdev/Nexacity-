import { SafeAreaView } from "react-native-safe-area-context";

import { JadeHarbor3D } from "@/components/jade-harbor-3d";

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#7BC6D1" }} edges={["top", "bottom", "left", "right"]}>
      <JadeHarbor3D />
    </SafeAreaView>
  );
}
