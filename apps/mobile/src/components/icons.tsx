import Svg, { Circle, Line, Path, Polygon, Polyline, Rect, Text as SvgText } from "react-native-svg";

// Ported 1:1 from apps/web/components/song/icons.tsx and the web BottomNav.
// Same viewBoxes and coordinates, so the two platforms stay visually
// identical; `currentColor` becomes an explicit `color` prop.

type IconProps = { size?: number; color?: string };

const STROKE = {
  fill: "none" as const,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ChevronDownIcon({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color}>
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}

export function ShareIcon({ size = 20, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color}>
      <Circle cx="18" cy="5" r="3" />
      <Circle cx="6" cy="12" r="3" />
      <Circle cx="18" cy="19" r="3" />
      <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </Svg>
  );
}

export function PreviousIcon({ size = 26, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="19,20 9,12 19,4" />
      <Rect x="5" y="4" width="2.5" height="16" rx="1" />
    </Svg>
  );
}

export function NextIcon({ size = 26, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="5,4 15,12 5,20" />
      <Rect x="16.5" y="4" width="2.5" height="16" rx="1" />
    </Svg>
  );
}

export function PlayIcon({ size = 24, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="5,3 19,12 5,21" />
    </Svg>
  );
}

export function PauseIcon({ size = 24, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="6" y="4" width="4" height="16" />
      <Rect x="14" y="4" width="4" height="16" />
    </Svg>
  );
}

export function ShuffleIcon({ size = 20, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color}>
      <Polyline points="16 3 21 3 21 8" />
      <Line x1="4" y1="20" x2="21" y2="3" />
      <Polyline points="21 16 21 21 16 21" />
      <Line x1="15" y1="15" x2="21" y2="21" />
      <Line x1="4" y1="4" x2="9" y2="9" />
    </Svg>
  );
}

export function RepeatIcon({ size = 20, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color}>
      <Polyline points="17 1 21 5 17 9" />
      <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <Polyline points="7 23 3 19 7 15" />
      <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </Svg>
  );
}

export function RepeatOneIcon({ size = 20, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color}>
      <Polyline points="17 1 21 5 17 9" />
      <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <Polyline points="7 23 3 19 7 15" />
      <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
      <SvgText x="11.5" y="14.5" fontSize="7" fill={color} stroke="none" textAnchor="middle" fontWeight="bold">
        1
      </SvgText>
    </Svg>
  );
}

export function LibraryIcon({ size = 20, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color}>
      <Line x1="8" y1="6" x2="21" y2="6" />
      <Line x1="8" y1="12" x2="21" y2="12" />
      <Line x1="8" y1="18" x2="21" y2="18" />
      <Line x1="3" y1="6" x2="3.01" y2="6" />
      <Line x1="3" y1="12" x2="3.01" y2="12" />
      <Line x1="3" y1="18" x2="3.01" y2="18" />
    </Svg>
  );
}

export function AboutIcon({ size = 20, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color}>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12.01" y2="8" />
    </Svg>
  );
}

export function PlaceholderCoverIcon({ size = 72, color = "#d4820a" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1} opacity={0.2}>
      <Path d="M9 18V5l12-2v13" />
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="18" cy="16" r="3" />
    </Svg>
  );
}
