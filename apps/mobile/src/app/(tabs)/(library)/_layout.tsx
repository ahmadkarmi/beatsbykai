import { Stack } from "expo-router";
import { colors } from "@/theme";

// A Stack *inside* the Library tab. Because route groups do not appear in the
// path, this yields "/" and "/songs/<slug>" exactly as on web — while keeping
// the tab bar visible on the song screen and making back return to the list.
export default function LibraryStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
