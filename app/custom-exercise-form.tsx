import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveCustomExercise, type CustomExercise } from "@/lib/custom-exercises";
import * as Haptics from "expo-haptics";

export default function CustomExerciseFormScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const bodyPart = params.bodyPart as string;
  
  const [exerciseName, setExerciseName] = useState("");
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<"barbell" | "dumbbell" | "machine" | "bodyweight">("barbell");

  const equipmentTypes: Array<{ key: "barbell" | "dumbbell" | "machine" | "bodyweight"; label: string }> = [
    { key: "barbell", label: "バーベル" },
    { key: "dumbbell", label: "ダンベル" },
    { key: "machine", label: "マシン" },
    { key: "bodyweight", label: "自重" },
  ];

  const handleSave = async () => {
    if (!exerciseName.trim()) {
      alert("種目名を入力してください");
      return;
    }

    const newExercise: CustomExercise = {
      id: `custom_${Date.now()}`,
      name: exerciseName.trim(),
      bodyPart,
      equipmentType: selectedEquipmentType,
      createdAt: Date.now(),
    };

    await saveCustomExercise(newExercise);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    router.back();
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 80 }}>
        {/* ヘッダー */}
        <View className="pt-4 pb-6">
          <Text className="text-2xl font-bold text-foreground">カスタム種目追加</Text>
          <Text className="text-sm text-muted mt-1">部位: {bodyPart}</Text>
        </View>

        {/* 種目名入力 */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">種目名</Text>
          <TextInput
            className="px-4 py-3 rounded-xl text-base text-foreground"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholder="例: ケーブルクロスオーバー"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* 器具タイプ選択 */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">器具タイプ</Text>
          <View className="gap-2">
            {equipmentTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                className="flex-row items-center p-4 rounded-xl"
                style={{
                  backgroundColor: selectedEquipmentType === type.key ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: selectedEquipmentType === type.key ? colors.primary : colors.border,
                }}
                onPress={() => {
                  setSelectedEquipmentType(type.key);
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: selectedEquipmentType === type.key ? "#FFFFFF" : colors.foreground }}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 保存ボタン */}
        <View className="gap-2">
          <TouchableOpacity
            className="py-4 rounded-xl items-center"
            style={{ backgroundColor: colors.primary }}
            onPress={handleSave}
          >
            <Text className="text-base font-bold text-white">保存</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="py-4 rounded-xl items-center"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            onPress={() => router.back()}
          >
            <Text className="text-base font-semibold text-foreground">キャンセル</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
