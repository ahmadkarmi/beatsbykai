import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, type } from "@/theme";

type Variant = keyof typeof type;

/**
 * The only way text should be rendered in this app.
 *
 * React Native ignores `fontWeight` on a custom font family — on Android bold
 * text simply renders regular, silently. Routing every string through a fixed
 * set of variants means the bold family is always named explicitly and that
 * failure mode cannot reappear.
 */
export default function AppText({
  variant = "body",
  color = colors.text,
  style,
  ...rest
}: TextProps & {
  variant?: Variant;
  color?: string;
}) {
  return <Text {...rest} style={[type[variant] as TextStyle, { color }, style]} />;
}
