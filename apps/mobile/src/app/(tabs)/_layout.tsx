import { Tabs } from "expo-router";
import BottomNav from "@/components/BottomNav";
import { colors } from "@/theme";

// The MiniPlayer will be stacked above BottomNav inside this same tabBar in
// slice 5, so React Navigation measures the pair and feeds the height to
// useBottomTabBarHeight() — replacing the web's hardcoded bottom padding.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
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
