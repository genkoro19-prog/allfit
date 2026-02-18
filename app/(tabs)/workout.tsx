import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getCustomExercises, type CustomExercise } from "@/lib/custom-exercises";
import * as Haptics from "expo-haptics";

export default function WorkoutScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const selectedDateParam = params.date as string; // YYYY-MM-DD形式
  console.log("[workout.tsx] 受け取ったパラメータ:", params);
  console.log("[workout.tsx] selectedDateParam =", selectedDateParam);
  const [selectedPart, setSelectedPart] = useState<string>("chest");
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);

  useEffect(() => {
    loadCustomExercises();
  }, []);

  const loadCustomExercises = async () => {
    const exercises = await getCustomExercises();
    setCustomExercises(exercises);
  };

  // 部位別の種目データ
  const exercisesByPart = {
    chest: [
      { id: 1, name: "ベンチプレス", equipmentType: "barbell" },
      { id: 2, name: "インクラインベンチプレス", equipmentType: "barbell" },
      { id: 3, name: "ダンベルプレス", equipmentType: "dumbbell" },
      { id: 4, name: "ダンベルフライ", equipmentType: "dumbbell" },
      { id: 5, name: "チェストプレスマシン", equipmentType: "machine" },
      { id: 6, name: "プッシュアップ", equipmentType: "bodyweight" },
    ],
    back: [
      { id: 7, name: "デッドリフト", equipmentType: "barbell" },
      { id: 8, name: "ベントオーバーロウ", equipmentType: "barbell" },
      { id: 9, name: "ダンベルロウ", equipmentType: "dumbbell" },
      { id: 10, name: "ラットプルダウン", equipmentType: "machine" },
      { id: 11, name: "シーテッドロウ", equipmentType: "machine" },
      { id: 12, name: "チンニング(懸垂)", equipmentType: "bodyweight" },
    ],
    legs: [
      { id: 13, name: "スクワット", equipmentType: "barbell" },
      { id: 14, name: "レッグプレス", equipmentType: "machine" },
      { id: 15, name: "レッグエクステンション", equipmentType: "machine" },
      { id: 16, name: "レッグカール", equipmentType: "machine" },
      { id: 17, name: "ブルガリアンスクワット", equipmentType: "dumbbell" },
      { id: 18, name: "ランジ", equipmentType: "bodyweight" },
    ],
    glutes: [
      { id: 33, name: "ヒップスラスト", equipmentType: "barbell" },
      { id: 34, name: "グルートブリッジ", equipmentType: "bodyweight" },
      { id: 35, name: "ケーブルキックバック", equipmentType: "machine" },
      { id: 36, name: "ダンベルステップアップ", equipmentType: "dumbbell" },
    ],
    shoulders: [
      { id: 19, name: "ショルダープレス", equipmentType: "barbell" },
      { id: 20, name: "ダンベルショルダープレス", equipmentType: "dumbbell" },
      { id: 21, name: "サイドレイズ", equipmentType: "dumbbell" },
      { id: 22, name: "フロントレイズ", equipmentType: "dumbbell" },
      { id: 23, name: "リアレイズ", equipmentType: "dumbbell" },
    ],
    arms: [
      { id: 24, name: "バーベルカール", equipmentType: "barbell" },
      { id: 25, name: "ダンベルカール", equipmentType: "dumbbell" },
      { id: 26, name: "ハンマーカール", equipmentType: "dumbbell" },
      { id: 27, name: "トライセプスエクステンション", equipmentType: "dumbbell" },
      { id: 28, name: "ディップス", equipmentType: "bodyweight" },
    ],
    abs: [
      { id: 29, name: "クランチ", equipmentType: "bodyweight" },
      { id: 30, name: "レッグレイズ", equipmentType: "bodyweight" },
      { id: 31, name: "プランク", equipmentType: "bodyweight" },
      { id: 32, name: "アブローラー", equipmentType: "machine" },
    ],
    others: [
      { id: 37, name: "カーフレイズ", equipmentType: "machine" },
      { id: 38, name: "シュラッグ", equipmentType: "dumbbell" },
      { id: 39, name: "フォアアームカール", equipmentType: "dumbbell" },
      { id: 40, name: "ネックエクステンション", equipmentType: "bodyweight" },
    ],
  };

  const partNames: Record<string, string> = {
    chest: "胸",
    back: "背",
    legs: "脚",
    glutes: "尻",
    shoulders: "肩",
    arms: "腕",
    abs: "腹",
    others: "他",
  };

  const partColors: Record<string, string> = {
    chest: "#FF6B6B",    // 赤
    back: "#4ECDC4",     // 青緑
    legs: "#FFD93D",     // 黄
    glutes: "#FF9FF3",   // ピンク
    shoulders: "#95E1D3", // ミント
    arms: "#FFA07A",     // サーモン
    abs: "#A8E6CF",      // ライトグリーン
    others: "#B8B8B8",   // グレー
  };

  const equipmentTypeLabels: Record<string, string> = {
    barbell: "バーベル",
    dumbbell: "ダンベル",
    machine: "マシン",
    bodyweight: "自重",
  };

  const handlePartSelect = (part: string) => {
    setSelectedPart(part);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const presetExercises = exercisesByPart[selectedPart as keyof typeof exercisesByPart] || [];
  const partNameJapanese = partNames[selectedPart];
  const customExercisesForPart = customExercises.filter(ex => ex.bodyPart === partNameJapanese);
  const selectedExercises = [...presetExercises, ...customExercisesForPart.map(ex => ({
    id: ex.id,
    name: ex.name,
    equipmentType: ex.equipmentType,
    isCustom: true,
  }))];

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        {/* ヘッダー */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">種目選択</Text>
          <Text className="text-sm text-muted mt-1">トレーニングする部位を選んでください</Text>
        </View>

        {/* 部位選択ボタン */}
        <View className="px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            <View className="flex-row gap-2">
              {Object.keys(exercisesByPart).map((part) => (
                <TouchableOpacity
                  key={part}
                  className="px-5 py-3 rounded-full"
                  style={{
                    backgroundColor: selectedPart === part ? partColors[part] : colors.surface,
                    borderWidth: 2,
                    borderColor: selectedPart === part ? partColors[part] : "transparent",
                  }}
                  onPress={() => handlePartSelect(part)}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{
                      color: selectedPart === part ? "#FFFFFF" : colors.foreground,
                    }}
                  >
                    {partNames[part]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 選択された部位の種目リスト */}
        <View className="px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">{partNames[selectedPart]}</Text>
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push({
                  pathname: "/custom-exercise-form",
                  params: { bodyPart: partNames[selectedPart] },
                });
              }}
            >
              <Text className="text-sm font-semibold text-white">+カスタム</Text>
            </TouchableOpacity>
          </View>
          <View className="gap-2">
            {selectedExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                className="flex-row items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: colors.surface }}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  // パラメータから受け取った日付を使用（ない場合は当日）
                  const dateStr = selectedDateParam || (() => {
                    const today = new Date();
                    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                  })();
                  // 英語キーを日本語の部位名に変換
                  const bodyPartJapanese = partNames[selectedPart];
                  console.log("[workout.tsx] 種目選択: dateStr =", dateStr, ", selectedPart =", selectedPart, ", bodyPartJapanese =", bodyPartJapanese);
                  router.push({
                    pathname: "/workout-session",
                    params: {
                      name: exercise.name,
                      equipmentType: exercise.equipmentType,
                      bodyPart: bodyPartJapanese,
                      date: dateStr,
                    },
                  });
                }}
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{exercise.name}</Text>
                  <Text className="text-xs text-muted mt-1">
                    {equipmentTypeLabels[exercise.equipmentType]}
                  </Text>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: colors.primary, opacity: 0.2 }}
                >
                  <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                    選択
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 広告バナー (仮表示) */}
      <View
        className="absolute bottom-0 left-0 right-0 h-12 items-center justify-center"
        style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}
      >
        <Text className="text-xs text-muted">広告スペース (320x50)</Text>
      </View>
    </ScreenContainer>
  );
}
