import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

type CardioType = "ランニング" | "サイクリング" | "水泳" | "ウォーキング" | "エアロバイク" | "その他";

const cardioIcons: Record<CardioType, string> = {
  ランニング: "🏃",
  サイクリング: "🚴",
  水泳: "🏊",
  ウォーキング: "🚶",
  エアロバイク: "🚲",
  その他: "✨",
};

export default function CardioScreen() {
  const colors = useColors();
  const [selectedCardio, setSelectedCardio] = useState<CardioType | null>(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");

  const handleCardioPress = (cardio: CardioType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedCardio(cardio);
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedCardio) {
      setSelectedCardio(null);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // TODO: Save cardio log to AsyncStorage
    router.back();
  };

  const cardioTypes: CardioType[] = ["ランニング", "サイクリング", "水泳", "ウォーキング", "エアロバイク", "その他"];

  // 種目選択画面
  if (!selectedCardio) {
    return (
      <ScreenContainer className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
          {/* ヘッダー */}
          <View className="px-4 pt-4 pb-2">
            <TouchableOpacity onPress={handleBack} className="flex-row items-center gap-2 mb-2">
              <Text className="text-xl text-foreground">←</Text>
              <Text className="text-base text-muted">戻る</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">有酸素運動</Text>
            <Text className="text-sm text-muted mt-1">運動の種類を選択してください</Text>
          </View>

          {/* 有酸素運動ボタン */}
          <View className="px-4 gap-3">
            {cardioTypes.map((cardio) => (
              <TouchableOpacity
                key={cardio}
                onPress={() => handleCardioPress(cardio)}
                className="p-6 rounded-2xl"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-4xl">{cardioIcons[cardio]}</Text>
                  <Text className="text-xl font-bold text-foreground">{cardio}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // 記録入力画面
  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        {/* ヘッダー */}
        <View className="px-4 pt-4 pb-2">
          <TouchableOpacity onPress={handleBack} className="flex-row items-center gap-2 mb-2">
            <Text className="text-xl text-foreground">←</Text>
            <Text className="text-base text-muted">戻る</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <Text className="text-3xl">{cardioIcons[selectedCardio]}</Text>
            <Text className="text-2xl font-bold text-foreground">{selectedCardio}</Text>
          </View>
        </View>

        {/* 入力フォーム */}
        <View className="px-4 gap-4">
          {/* 距離 */}
          <View>
            <Text className="text-sm text-muted mb-2">距離 (km)</Text>
            <TextInput
              className="p-4 rounded-xl text-lg font-bold text-foreground"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
              placeholder="例: 5.0"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* 時間 */}
          <View>
            <Text className="text-sm text-muted mb-2">時間 (分)</Text>
            <TextInput
              className="p-4 rounded-xl text-lg font-bold text-foreground"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="例: 30"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* 消費カロリー */}
          <View>
            <Text className="text-sm text-muted mb-2">消費カロリー (kcal)</Text>
            <TextInput
              className="p-4 rounded-xl text-lg font-bold text-foreground"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              placeholder="例: 250"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* 保存ボタン */}
          <TouchableOpacity
            onPress={handleSave}
            className="py-4 rounded-xl items-center justify-center mt-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-lg font-bold text-white">記録を保存</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
