import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface IntervalTimerOverlayProps {
  visible: boolean;
  onClose: () => void;
  durationSeconds?: number;
}

export function IntervalTimerOverlay({
  visible,
  onClose,
  durationSeconds = 90,
}: IntervalTimerOverlayProps) {
  const colors = useColors();
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      setRemainingSeconds(durationSeconds);
      setIsPaused(false);
      startTimer();
    } else {
      stopTimer();
    }

    return () => {
      stopTimer();
    };
  }, [visible, durationSeconds]);

  const startTimer = () => {
    stopTimer(); // 既存のタイマーをクリア
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          stopTimer();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePauseResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPaused) {
      startTimer();
      setIsPaused(false);
    } else {
      stopTimer();
      setIsPaused(true);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopTimer();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = remainingSeconds / durationSeconds;
  const progressColor =
    remainingSeconds === 0
      ? colors.success
      : remainingSeconds <= 10
        ? colors.error
        : remainingSeconds <= 30
          ? colors.warning
          : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      >
        <View className="w-full max-w-sm p-8 rounded-3xl items-center" style={{ backgroundColor: colors.background }}>
          {/* タイトル */}
          <Text className="text-lg font-semibold text-foreground mb-8">インターバルタイマー</Text>

          {/* 円形プログレスバー (簡易版) */}
          <View className="items-center justify-center mb-8">
            <View
              className="w-48 h-48 rounded-full items-center justify-center"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 8,
                borderColor: progressColor,
              }}
            >
              <Text className="text-6xl font-bold" style={{ color: progressColor }}>
                {formatTime(remainingSeconds)}
              </Text>
            </View>
          </View>

          {/* 完了メッセージ */}
          {remainingSeconds === 0 && (
            <View className="mb-6">
              <Text className="text-xl font-bold text-center" style={{ color: colors.success }}>
                インターバル完了!
              </Text>
              <Text className="text-sm text-muted text-center mt-2">次のセットを開始しましょう</Text>
            </View>
          )}

          {/* コントロールボタン */}
          <View className="flex-row gap-3 w-full">
            {remainingSeconds > 0 && (
              <TouchableOpacity
                onPress={handlePauseResume}
                className="flex-1 py-4 rounded-xl items-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-base font-semibold text-foreground">{isPaused ? "再開" : "一時停止"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSkip}
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: remainingSeconds === 0 ? colors.primary : colors.surface }}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: remainingSeconds === 0 ? "#fff" : colors.foreground }}
              >
                {remainingSeconds === 0 ? "閉じる" : "スキップ"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
