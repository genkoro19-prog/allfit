import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useState, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

type EquipmentType = "barbell" | "dumbbell" | "machine" | "bodyweight";

interface WeightInputBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (weight: number) => void;
  initialWeight?: number;
  equipmentType: EquipmentType;
}

export function WeightInputBottomSheet({
  visible,
  onClose,
  onConfirm,
  initialWeight = 0,
  equipmentType,
}: WeightInputBottomSheetProps) {
  const colors = useColors();
  const [weight, setWeight] = useState(initialWeight);

  useEffect(() => {
    setWeight(initialWeight);
  }, [initialWeight, visible]);

  // バーベルの場合、シャフト重量(20kg)を自動加算
  const BARBELL_SHAFT_WEIGHT = 20;

  // 器具タイプ別のプレートボタン設定
  const getPlateButtons = () => {
    switch (equipmentType) {
      case "barbell":
        // バーベルは両側にプレートを付けるため、実際の増減は2倍
        return [
          { label: "+20kg", value: 40 }, // 10kg × 2
          { label: "+10kg", value: 20 }, // 5kg × 2
          { label: "+5kg", value: 10 }, // 2.5kg × 2
          { label: "+2.5kg", value: 5 }, // 1.25kg × 2
          { label: "+1.25kg", value: 2.5 }, // 0.625kg × 2
        ];
      case "dumbbell":
        // ダンベルは片手分の重量
        return [
          { label: "+10kg", value: 10 },
          { label: "+5kg", value: 5 },
          { label: "+2kg", value: 2 },
          { label: "+1kg", value: 1 },
        ];
      case "machine":
      case "bodyweight":
        // マシン/自重は標準的な刻み
        return [
          { label: "+10kg", value: 10 },
          { label: "+5kg", value: 5 },
          { label: "+2.5kg", value: 2.5 },
          { label: "+1kg", value: 1 },
        ];
    }
  };

  const plateButtons = getPlateButtons();

  const handleWeightChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeight((prev) => Math.max(0, prev + delta));
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWeight(equipmentType === "barbell" ? BARBELL_SHAFT_WEIGHT : 0);
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(weight);
    onClose();
  };

  // バーベルの場合、シャフト重量を含めた表示
  const getDisplayWeight = () => {
    if (equipmentType === "barbell") {
      const plateWeight = Math.max(0, weight - BARBELL_SHAFT_WEIGHT);
      return `${weight.toFixed(1)} kg\n(シャフト ${BARBELL_SHAFT_WEIGHT}kg + プレート ${plateWeight.toFixed(1)}kg)`;
    }
    return `${weight.toFixed(1)} kg`;
  };

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
            <Text className="text-xl font-bold text-foreground text-center">重量入力</Text>
            <Text className="text-sm text-muted text-center mt-1">
              {equipmentType === "barbell"
                ? "バーベル (プレート両側)"
                : equipmentType === "dumbbell"
                  ? "ダンベル (片手)"
                  : equipmentType === "machine"
                    ? "マシン"
                    : "自重"}
            </Text>
          </View>

          {/* 現在の重量表示 */}
          <View className="items-center mb-6 p-6 rounded-2xl" style={{ backgroundColor: colors.surface }}>
            <Text
              className="text-4xl font-bold text-center"
              style={{ color: colors.primary, lineHeight: 48 }}
            >
              {getDisplayWeight()}
            </Text>
          </View>

          {/* プレート加算ボタン */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted mb-2">プレート追加</Text>
            <View className="flex-row flex-wrap gap-2">
              {plateButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleWeightChange(button.value)}
                  className="flex-1 min-w-[70px] py-3 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-base font-semibold text-white">{button.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* プレート減算ボタン */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-muted mb-2">プレート削除</Text>
            <View className="flex-row flex-wrap gap-2">
              {plateButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleWeightChange(-button.value)}
                  className="flex-1 min-w-[70px] py-3 rounded-xl items-center"
                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                >
                  <Text className="text-base font-semibold text-foreground">{button.label.replace("+", "-")}</Text>
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
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-base font-semibold text-white">決定</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
