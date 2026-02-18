import { useState } from "react";
import { ScrollView, Text, View, Pressable, TouchableOpacity, TextInput, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function RMCalculatorScreen() {
  const colors = useColors();
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [estimated1RM, setEstimated1RM] = useState<number | null>(null);

  // Brzycki式で1RMを計算
  const calculate1RM = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);

    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0 || r > 36) {
      return;
    }

    // Brzycki式: 1RM = weight × (36 / (37 - reps))
    const rm = w * (36 / (37 - r));
    setEstimated1RM(Math.round(rm * 10) / 10);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getRMPercentage = (percentage: number) => {
    if (!estimated1RM) return "-";
    return Math.round(estimated1RM * percentage * 10) / 10;
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 80 }}>
        {/* ヘッダー */}
        <View className="flex-row items-center py-4">
          <Pressable
            onPress={() => router.back()}
            className="mr-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-2xl text-foreground">←</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-foreground">RM計算機</Text>
        </View>

        {/* 入力セクション */}
        <View
          className="p-6 rounded-2xl mb-6"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-lg font-bold text-foreground mb-4">重量とレップ数を入力</Text>

          <View className="mb-4">
            <Text className="text-sm text-muted mb-2">重量 (kg)</Text>
            <TextInput
              className="p-4 rounded-xl text-lg font-semibold"
              style={{
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="100"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm text-muted mb-2">レップ数</Text>
            <TextInput
              className="p-4 rounded-xl text-lg font-semibold"
              style={{
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              placeholder="8"
              placeholderTextColor={colors.muted}
            />
          </View>

          <TouchableOpacity
            className="p-4 rounded-xl items-center"
            style={{
              backgroundColor: colors.primary,
              opacity: weight && reps ? 1 : 0.5,
            }}
            onPress={calculate1RM}
            disabled={!weight || !reps}
          >
            <Text className="text-lg font-bold text-white">計算する</Text>
          </TouchableOpacity>
        </View>

        {/* 結果表示 */}
        {estimated1RM !== null && (
          <>
            <View
              className="p-6 rounded-2xl mb-6"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-sm text-muted mb-2">推定1RM</Text>
              <Text className="text-5xl font-bold text-foreground mb-1">{estimated1RM}</Text>
              <Text className="text-lg text-muted">kg</Text>
            </View>

            {/* パーセンテージ表 */}
            <View
              className="p-6 rounded-2xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-lg font-bold text-foreground mb-4">トレーニング強度</Text>

              {[
                { label: "95% (1-2 reps)", value: 0.95 },
                { label: "90% (3-4 reps)", value: 0.9 },
                { label: "85% (5-6 reps)", value: 0.85 },
                { label: "80% (7-8 reps)", value: 0.8 },
                { label: "75% (9-10 reps)", value: 0.75 },
                { label: "70% (11-12 reps)", value: 0.7 },
                { label: "65% (13-15 reps)", value: 0.65 },
                { label: "60% (16-20 reps)", value: 0.6 },
              ].map((item, index) => (
                <View
                  key={index}
                  className="flex-row justify-between items-center py-3"
                  style={{
                    borderBottomWidth: index < 7 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text className="text-sm text-muted">{item.label}</Text>
                  <Text className="text-lg font-bold text-foreground">{getRMPercentage(item.value)} kg</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
