import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { saveCalorieLog } from "@/lib/storage";

const MEAL_TYPES = [
  { id: "breakfast", name: "朝食", emoji: "🌅" },
  { id: "lunch", name: "昼食", emoji: "☀️" },
  { id: "dinner", name: "夕食", emoji: "🌙" },
  { id: "snack", name: "間食", emoji: "🍪" },
] as const;

export default function CalorieInputScreen() {
  const colors = useColors();
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const caloriesNum = parseInt(calories);

    if (!foodName.trim()) {
      Alert.alert("エラー", "食品名を入力してください");
      return;
    }

    if (isNaN(caloriesNum) || caloriesNum <= 0) {
      Alert.alert("エラー", "カロリーを入力してください");
      return;
    }

    setIsSaving(true);

    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      await saveCalorieLog({
        id: `${Date.now()}`,
        date: dateStr,
        mealType: selectedMealType,
        foodName: foodName.trim(),
        calories: caloriesNum,
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fat: fat ? parseFloat(fat) : undefined,
        createdAt: Date.now(),
      });

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("保存完了", "食事を記録しました", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error saving calorie log:", error);
      Alert.alert("エラー", "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 80 }}>
        {/* ヘッダー */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="mr-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text className="text-2xl text-foreground">←</Text>
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">食事記録</Text>
          </View>
        </View>

        {/* 食事タイプ選択 */}
        <View
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-sm text-muted mb-3">食事タイプ</Text>
          <View className="flex-row flex-wrap gap-2">
            {MEAL_TYPES.map((type) => (
              <Pressable
                key={type.id}
                className="px-4 py-3 rounded-xl flex-row items-center"
                style={{
                  backgroundColor: selectedMealType === type.id ? colors.primary : colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                onPress={() => {
                  setSelectedMealType(type.id);
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text className="text-lg mr-2">{type.emoji}</Text>
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: selectedMealType === type.id ? "#FFFFFF" : colors.foreground,
                  }}
                >
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 食品名入力 */}
        <View
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-sm text-muted mb-2">食品名</Text>
          <TextInput
            className="p-4 rounded-xl text-base"
            style={{
              backgroundColor: colors.background,
              color: colors.foreground,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            value={foodName}
            onChangeText={setFoodName}
            placeholder="例: 白米、鶏胸肉、サラダ"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* カロリー入力 */}
        <View
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-sm text-muted mb-2">カロリー (kcal)</Text>
          <TextInput
            className="p-4 rounded-xl text-2xl font-bold"
            style={{
              backgroundColor: colors.background,
              color: colors.foreground,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            value={calories}
            onChangeText={setCalories}
            keyboardType="number-pad"
            placeholder="500"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* マクロ栄養素入力 (オプション) */}
        <View
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-sm text-muted mb-3">マクロ栄養素 (オプション)</Text>

          <View className="mb-3">
            <Text className="text-xs text-muted mb-2">タンパク質 (g)</Text>
            <TextInput
              className="p-3 rounded-xl text-base"
              style={{
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              value={protein}
              onChangeText={setProtein}
              keyboardType="decimal-pad"
              placeholder="30"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-muted mb-2">炭水化物 (g)</Text>
            <TextInput
              className="p-3 rounded-xl text-base"
              style={{
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="decimal-pad"
              placeholder="60"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View>
            <Text className="text-xs text-muted mb-2">脂質 (g)</Text>
            <TextInput
              className="p-3 rounded-xl text-base"
              style={{
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              value={fat}
              onChangeText={setFat}
              keyboardType="decimal-pad"
              placeholder="10"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* 保存ボタン */}
        <Pressable
          className="p-5 rounded-2xl items-center mb-4"
          style={{
            backgroundColor: colors.primary,
            opacity: foodName && calories && !isSaving ? 1 : 0.5,
          }}
          onPress={handleSave}
          disabled={!foodName || !calories || isSaving}
        >
          <Text className="text-lg font-bold text-white">{isSaving ? "保存中..." : "記録を保存"}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
