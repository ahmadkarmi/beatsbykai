import { Tabs } from "expo-router";
import { View } from "react-native";
import BottomNav from "@/components/BottomNav";
import MiniPlayer from "@/components/MiniPlayer";
import { colors } from "@/theme";

// MiniPlayer is returned from the tabBar prop rather than absolutely
// positioned, so React Navigation measures the pair and feeds the combined
// height to the screens — replacing the web's hardcoded bottom padding, which
// had to be changed by hand whenever the mini player appeared or vanished.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <View>
          <MiniPlayer />
          <BottomNav {...props} />
        </View>
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="(library)" options={{ title: "Library" }} />
      <Tabs.Screen name="about" options={{ title: "About" }} />
    </Tabs>
  );
}
