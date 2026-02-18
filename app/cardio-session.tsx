import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { saveCardioLog } from "@/lib/storage";

const CARDIO_TYPES = [
  { id: "running", name: "ランニング", emoji: "🏃", caloriesPerMin: 10 },
  { id: "cycling", name: "サイクリング", emoji: "🚴", caloriesPerMin: 8 },
  { id: "swimming", name: "水泳", emoji: "🏊", caloriesPerMin: 12 },
  { id: "walking", name: "ウォーキング", emoji: "🚶", caloriesPerMin: 4 },
  { id: "rowing", name: "ローイング", emoji: "🚣", caloriesPerMin: 11 },
  { id: "jumping", name: "縄跳び", emoji: "🦘", caloriesPerMin: 13 },
];

export default function CardioSessionScreen() {
  const colors = useColors();
  const [selectedType, setSelectedType] = useState(CARDIO_TYPES[0]);
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const calculateCalories = () => {
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) return 0;
    return Math.round(selectedType.caloriesPerMin * durationNum);
  };

  const handleSave = async () => {
    const durationNum = parseInt(duration);
    const distanceNum = parseFloat(distance);

    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert("エラー", "時間を入力してください");
      return;
    }

    setIsSaving(true);

    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      await saveCardioLog({
        id: `${Date.now()}`,
        date: dateStr,
        exerciseType: selectedType.name,
        duration: durationNum,
        distance: distanceNum || 0,
        calories: calculateCalories(),
        createdAt: Date.now(),
      });

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("保存完了", "有酸素運動を記録しました", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error saving cardio log:", error);
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
            <Text className="text-2xl font-bold text-foreground">有酸素運動</Text>
          </View>
        </View>

        {/* 運動タイプ選択 */}
        <View
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-sm text-muted mb-3">運動タイプ</Text>
          <View className="flex-row flex-wrap gap-2">
            {CARDIO_TYPES.map((type) => (
              <Pressable
                key={type.id}
                className="px-4 py-3 rounded-xl flex-row items-center"
                style={{
                  backgroundColor: selectedType.id === type.id ? colors.primary : colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                onPress={() => {
                  setSelectedType(type);
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text className="text-lg mr-2">{type.emoji}</Text>
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: selectedType.id === type.id ? "#FFFFFF" : colors.foreground,
                  }}
                >
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 時間入力 */}
        <View
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-sm text-muted mb-2">時間 (分)</Text>
          <TextInput
            className="p-4 rounded-xl text-2xl font-bold"
            style={{
              backgroundColor: colors.background,
              color: colors.foreground,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* 距離入力 (オプション) */}
        <View
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-sm text-muted mb-2">距離 (km) - オプション</Text>
          <TextInput
            className="p-4 rounded-xl text-2xl font-bold"
            style={{
              backgroundColor: colors.background,
              color: colors.foreground,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
            placeholder="5.0"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* 推定消費カロリー */}
        {duration && (
          <View
            className="p-6 rounded-2xl mb-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-sm text-muted mb-2">推定消費カロリー</Text>
            <View className="flex-row items-baseline">
              <Text className="text-4xl font-bold text-foreground">{calculateCalories()}</Text>
              <Text className="text-lg text-muted ml-2">kcal</Text>
            </View>
          </View>
        )}

        {/* 保存ボタン */}
        <Pressable
          className="p-5 rounded-2xl items-center mb-4"
          style={{
            backgroundColor: colors.primary,
            opacity: duration && !isSaving ? 1 : 0.5,
          }}
          onPress={handleSave}
          disabled={!duration || isSaving}
        >
          <Text className="text-lg font-bold text-white">{isSaving ? "保存中..." : "記録を保存"}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
