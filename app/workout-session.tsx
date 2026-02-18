import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { WeightInputBottomSheet } from "@/components/weight-input-bottom-sheet";
import { RepsInputBottomSheet } from "@/components/reps-input-bottom-sheet";
import { IntervalTimerOverlay } from "@/components/interval-timer-overlay";
import { Confetti } from "@/components/confetti";
import * as Haptics from "expo-haptics";
import {
  saveWorkoutLog,
  updatePersonalRecord,
  type WorkoutSet as StorageWorkoutSet,
  type LocalWorkoutData,
} from "@/lib/storage";
import { getTimerSettings } from "@/lib/timer-settings";

type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
};

export default function WorkoutSessionScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const exerciseName = params.name as string;
  const equipmentType = params.equipmentType as string;
  const bodyPart = params.bodyPart as string;
  const selectedDate = params.date as string; // YYYY-MM-DD形式
  
  console.log("[workout-session.tsx] 受け取ったパラメータ:", params);
  console.log("[workout-session.tsx] exerciseName =", exerciseName);
  console.log("[workout-session.tsx] bodyPart =", bodyPart);
  console.log("[workout-session.tsx] selectedDate =", selectedDate);

  const [sets, setSets] = useState<WorkoutSet[]>([
    { id: "1", weight: 100, reps: 8, completed: true },
    { id: "2", weight: 100, reps: 8, completed: true },
    { id: "3", weight: 100, reps: 6, completed: false },
  ]);

  const [weightSheetVisible, setWeightSheetVisible] = useState(false);
  const [repsSheetVisible, setRepsSheetVisible] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timerDuration, setTimerDuration] = useState(90);

  useEffect(() => {
    loadTimerSettings();
  }, []);

  const loadTimerSettings = async () => {
    const settings = await getTimerSettings();
    setTimerDuration(settings.defaultDuration);
  };

  // 総負荷量計算
  const totalVolume = sets.reduce((sum, set) => {
    if (set.completed) {
      return sum + set.weight * set.reps;
    }
    return sum;
  }, 0);

  // 1RM計算 (Epley式)
  const calculate1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  const maxSet = sets.reduce((max, set) => {
    if (!set.completed) return max;
    const rm = calculate1RM(set.weight, set.reps);
    return rm > (max?.rm || 0) ? { ...set, rm } : max;
  }, null as (WorkoutSet & { rm: number }) | null);

  const estimated1RM = maxSet ? maxSet.rm : 0;

  const handleWeightPress = (setId: string) => {
    setEditingSetId(setId);
    setWeightSheetVisible(true);
  };

  const handleRepsPress = (setId: string) => {
    setEditingSetId(setId);
    setRepsSheetVisible(true);
  };

  const handleWeightConfirm = (weight: number) => {
    if (editingSetId) {
      setSets((prev) =>
        prev.map((s) => (s.id === editingSetId ? { ...s, weight } : s))
      );
    }
    setWeightSheetVisible(false);
    setEditingSetId(null);
  };

  const handleRepsConfirm = (reps: number) => {
    if (editingSetId) {
      setSets((prev) =>
        prev.map((s) => (s.id === editingSetId ? { ...s, reps } : s))
      );
    }
    setRepsSheetVisible(false);
    setEditingSetId(null);
  };

  const handleSetComplete = (setId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s))
    );
    
    // セット完了時にインターバルタイマーを起動
    const set = sets.find((s) => s.id === setId);
    if (set && !set.completed) {
      setTimerVisible(true);
    }
  };

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet: WorkoutSet = {
      id: String(sets.length + 1),
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 8,
      completed: false,
    };
    setSets((prev) => [...prev, newSet]);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleFinishWorkout = async () => {
    // 総負荷量計算
    const volume = sets.reduce((sum, set) => {
      if (set.completed) {
        return sum + set.weight * set.reps;
      }
      return sum;
    }, 0);

    // 選択された日付を使用（パラメータがない場合は当日）
    const dateStr = selectedDate || (() => {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    })();

    // ワークアウトログを作成
    const workoutLog = {
      id: `${Date.now()}`,
      date: dateStr,
      exerciseId: 0, // TODO: 種目 IDを渡す
      exerciseName,
      equipmentType,
      bodyPart: bodyPart || "その他", // パラメータから部位を取得
      sets: sets as StorageWorkoutSet[],
      totalVolume: volume,
      estimated1RM,
      createdAt: Date.now(),
    } satisfies LocalWorkoutData;

    console.log("[workout-session.tsx] 保存するデータ:", workoutLog);

    // データ保存
    try {
      await saveWorkoutLog(workoutLog);
      console.log("[workout-session.tsx] データ保存成功");

      // 自己ベスト更新チェック
      if (maxSet) {
        const isNewRecord = await updatePersonalRecord(
          0, // TODO: 種目IDを渡す
          exerciseName,
          maxSet.rm,
          maxSet.weight,
          maxSet.reps,
          dateStr
        );

        if (isNewRecord) {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          setShowConfetti(true);
        }
      }

      router.back();
    } catch (error) {
      console.error("Error saving workout:", error);
      // エラーハンドリング: ユーザーに通知
      alert("トレーニング記録の保存に失敗しました");
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ヘッダー */}
        <View className="px-4 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-sm font-medium" style={{ color: colors.primary }}>
              ← 戻る
            </Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground mt-2">{exerciseName}</Text>
          <Text className="text-sm text-muted mt-1">
            {equipmentType === "barbell" && "バーベル"}
            {equipmentType === "dumbbell" && "ダンベル"}
            {equipmentType === "machine" && "マシン"}
            {equipmentType === "bodyweight" && "自重"}
          </Text>
        </View>

        {/* 統計情報 */}
        <View className="flex-row px-4 py-4 gap-3">
          <View
            className="flex-1 p-4 rounded-xl"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-xs text-muted mb-1">総負荷量</Text>
            <Text className="text-2xl font-bold text-foreground">{totalVolume}kg</Text>
          </View>
          <View
            className="flex-1 p-4 rounded-xl"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-xs text-muted mb-1">推定1RM</Text>
            <Text className="text-2xl font-bold text-foreground">{estimated1RM}kg</Text>
          </View>
        </View>

        {/* セットリスト */}
        <View className="px-4">
          <Text className="text-lg font-semibold text-foreground mb-3">セット記録</Text>
          {sets.map((set, index) => (
            <View
              key={set.id}
              className="flex-row items-center mb-3 p-4 rounded-xl"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-base font-medium text-foreground w-16">
                セット {index + 1}
              </Text>
              <TouchableOpacity
                className="flex-1 mx-2 px-4 py-3 rounded-lg"
                style={{ backgroundColor: colors.background }}
                onPress={() => handleWeightPress(set.id)}
              >
                <Text className="text-base font-semibold text-foreground text-center">
                  {set.weight}kg
                </Text>
              </TouchableOpacity>
              <Text className="text-base text-muted mx-1">×</Text>
              <TouchableOpacity
                className="flex-1 mx-2 px-4 py-3 rounded-lg"
                style={{ backgroundColor: colors.background }}
                onPress={() => handleRepsPress(set.id)}
              >
                <Text className="text-base font-semibold text-foreground text-center">
                  {set.reps}回
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor: set.completed ? colors.success : colors.border,
                }}
                onPress={() => handleSetComplete(set.id)}
              >
                <Text className="text-white text-lg font-bold">✓</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* セット追加ボタン */}
          <TouchableOpacity
            className="py-4 rounded-xl items-center justify-center mt-2"
            style={{ backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }}
            onPress={handleAddSet}
          >
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              + セット追加
            </Text>
          </TouchableOpacity>
        </View>

        {/* トレーニング完了ボタン */}
        <View className="px-4 mt-6">
          <TouchableOpacity
            className="py-4 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={handleFinishWorkout}
          >
            <Text className="text-base font-bold text-white">トレーニング完了</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 重量入力ボトムシート */}
      <WeightInputBottomSheet
        visible={weightSheetVisible}
        equipmentType={equipmentType as "barbell" | "dumbbell" | "machine" | "bodyweight"}
        initialWeight={
          editingSetId ? sets.find((s) => s.id === editingSetId)?.weight || 0 : 0
        }
        onConfirm={handleWeightConfirm}
        onClose={() => setWeightSheetVisible(false)}
      />

      {/* 回数入力ボトムシート */}
      <RepsInputBottomSheet
        visible={repsSheetVisible}
        initialReps={editingSetId ? sets.find((s) => s.id === editingSetId)?.reps || 8 : 8}
        onConfirm={handleRepsConfirm}
        onClose={() => setRepsSheetVisible(false)}
      />

      {/* インターバルタイマー */}
      <IntervalTimerOverlay
        visible={timerVisible}
        durationSeconds={timerDuration}
        onClose={() => setTimerVisible(false)}
      />
      
      {/* 紙吹雪エフェクト */}
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
    </ScreenContainer>
  );
}
