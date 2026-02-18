import { View } from "react-native";

type MultiColorDotProps = {
  colors: string[];
  size?: number;
};

export function MultiColorDot({ colors, size = 40 }: MultiColorDotProps) {
  if (colors.length === 0) {
    return null;
  }

  // 5部位以上は真っ赤
  if (colors.length >= 5) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#DC2626", // 濃い赤
        }}
      />
    );
  }

  // 1部位: 単色
  if (colors.length === 1) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors[0],
        }}
      />
    );
  }

  // 2部位: 縦半分に2色
  if (colors.length === 2) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        <View style={{ flex: 1, backgroundColor: colors[0] }} />
        <View style={{ flex: 1, backgroundColor: colors[1] }} />
      </View>
    );
  }

  // 3部位: 4分割のうち3色（左上、右上、下半分）
  if (colors.length === 3) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
        }}
      >
        <View style={{ flexDirection: "row", height: "50%" }}>
          <View style={{ flex: 1, backgroundColor: colors[0] }} />
          <View style={{ flex: 1, backgroundColor: colors[1] }} />
        </View>
        <View style={{ height: "50%", backgroundColor: colors[2] }} />
      </View>
    );
  }

  // 4部位: 4分割で4色
  if (colors.length === 4) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
        }}
      >
        <View style={{ flexDirection: "row", height: "50%" }}>
          <View style={{ flex: 1, backgroundColor: colors[0] }} />
          <View style={{ flex: 1, backgroundColor: colors[1] }} />
        </View>
        <View style={{ flexDirection: "row", height: "50%" }}>
          <View style={{ flex: 1, backgroundColor: colors[2] }} />
          <View style={{ flex: 1, backgroundColor: colors[3] }} />
        </View>
      </View>
    );
  }

  return null;
}
