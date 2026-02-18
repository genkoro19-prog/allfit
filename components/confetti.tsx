import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";

type ConfettiProps = {
  show: boolean;
  onComplete?: () => void;
};

export function Confetti({ show, onComplete }: ConfettiProps) {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {confettiPieces.map((i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  const colors = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#95E1D3", "#FFA07A", "#A8E6CF"];
  const color = colors[index % colors.length];

  const randomX = (Math.random() - 0.5) * 400;
  const randomDelay = Math.random() * 200;

  useEffect(() => {
    translateY.value = withDelay(
      randomDelay,
      withTiming(800, { duration: 2500, easing: Easing.out(Easing.quad) })
    );
    translateX.value = withDelay(
      randomDelay,
      withTiming(randomX, { duration: 2500, easing: Easing.out(Easing.quad) })
    );
    opacity.value = withDelay(
      randomDelay + 1500,
      withTiming(0, { duration: 1000 })
    );
    rotate.value = withDelay(
      randomDelay,
      withTiming(Math.random() * 720 - 360, { duration: 2500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const startX = Math.random() * 100;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: "10%",
          left: `${startX}%`,
          width: 10,
          height: 10,
          backgroundColor: color,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
}
