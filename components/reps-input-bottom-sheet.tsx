import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useState, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface RepsInputBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reps: number) => void;
  initialReps?: number;
}

export function RepsInputBottomSheet({
  visible,
  onClose,
  onConfirm,
  initialReps = 0,
}: RepsInputBottomSheetProps) {
  const colors = useColors();
  const [reps, setReps] = useState(initialReps);

  useEffect(() => {
    setReps(initialReps);
  }, [initialReps, visible]);

  const handleRepsSelect = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReps(value);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReps(0);
  };

  const handleConfirm = () => {
    if (reps === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(reps);
    onClose();
  };

  // 1-20の数字ボタンを生成
  const repsButtons = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="rounded-t-3xl p-6"
          style={{ backgroundColor: colors.background }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* ハンドルバー */}
          <View className="items-center mb-4">
            <View className="w-12 h-1 rounded-full" style={{ backgroundColor: colors.border }} />
          </View>

          {/* タイトル */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground text-center">回数入力</Text>
            <Text className="text-sm text-muted text-center mt-1">1〜20回から選択</Text>
          </View>

          {/* 現在の回数表示 */}
          <View className="items-center mb-6 p-6 rounded-2xl" style={{ backgroundColor: colors.surface }}>
            <Text className="text-5xl font-bold" style={{ color: colors.primary }}>
              {reps}
            </Text>
            <Text className="text-base text-muted mt-2">回</Text>
          </View>

          {/* 回数選択ボタン */}
          <View className="mb-6 max-h-64">
            <View className="flex-row flex-wrap gap-2">
              {repsButtons.map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleRepsSelect(value)}
                  className="w-[60px] h-[60px] rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: reps === value ? colors.primary : colors.surface,
                    borderWidth: reps === value ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    className="text-lg font-semibold"
                    style={{ color: reps === value ? "#fff" : colors.foreground }}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* クリア・決定ボタン */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleClear}
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-base font-semibold text-foreground">クリア</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: reps === 0 ? colors.muted : colors.primary }}
              disabled={reps === 0}
            >
              <Text className="text-base font-semibold text-white">決定</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
