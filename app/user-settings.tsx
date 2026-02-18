import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { router } from "expo-router";
import {
  getUserSettings,
  saveUserSettings,
  initializeUserSettings,
  calculatePFCByPreset,
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  type UserSettings,
} from "@/lib/user-settings";
import { getWeightLogs, getLatestBodyRecord, saveBodyRecord, type BodyRecord } from "@/lib/storage";
import * as Haptics from "expo-haptics";

export default function UserSettingsScreen() {
  const colors = useColors();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState<UserSettings["activityLevel"]>("moderate");
  const [goal, setGoal] = useState<UserSettings["goal"]>("maintain");
  const [pfcMode, setPfcMode] = useState<UserSettings["pfcMode"]>("preset_maintain");
  const [manualProtein, setManualProtein] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [intervalTimerDuration, setIntervalTimerDuration] = useState("90");
  const [existingSettings, setExistingSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    loadSettings();
    loadLatestWeight();
  }, []);

  const loadSettings = async () => {
    const settings = await getUserSettings();
    const bodyRecord = await getLatestBodyRecord();

    // 身体記録とユーザー設定の両方がある場合、新しい方を優先
    if (settings && bodyRecord) {
      // 更新日時を比較（bodyRecord.createdAt vs settingsの更新日時）
      // bodyRecordにはcreatedAtがあるが、settingsにはないのでbodyRecordを優先
      setAge(bodyRecord.age.toString());
      setGender(bodyRecord.gender);
      setHeight(bodyRecord.height.toString());
      setWeight(bodyRecord.weight.toString());
      setActivityLevel(settings.activityLevel);
      setGoal(settings.goal);
      setPfcMode(settings.pfcMode || "preset_maintain");
      if (settings.pfcMode === "manual") {
        setManualProtein(settings.targetProtein.toString());
        setManualFat(settings.targetFat.toString());
        setManualCarbs(settings.targetCarbs.toString());
      }
      setIntervalTimerDuration((settings.intervalTimerDuration || 90).toString());
      setExistingSettings(settings);
    } else if (settings) {
      // ユーザー設定のみがある場合
      setExistingSettings(settings);
      setAge(settings.age.toString());
      setGender(settings.gender);
      setHeight(settings.height.toString());
      setWeight(settings.weight.toString());
      setActivityLevel(settings.activityLevel);
      setGoal(settings.goal);
      setPfcMode(settings.pfcMode || "preset_maintain");
      if (settings.pfcMode === "manual") {
        setManualProtein(settings.targetProtein.toString());
        setManualFat(settings.targetFat.toString());
        setManualCarbs(settings.targetCarbs.toString());
      }
      setIntervalTimerDuration((settings.intervalTimerDuration || 90).toString());
    } else if (bodyRecord) {
      // 身体記録のみがある場合
      setAge(bodyRecord.age.toString());
      setGender(bodyRecord.gender);
      setHeight(bodyRecord.height.toString());
      setWeight(bodyRecord.weight.toString());
    }
  };

  const loadLatestWeight = async () => {
    const weightLogs = await getWeightLogs();
    if (weightLogs.length > 0 && !weight) {
      // 最新の体重データを取得
      const latestWeight = weightLogs[weightLogs.length - 1].weight;
      setWeight(latestWeight.toString());
    }
  };

  const handleResetPresets = async () => {
    Alert.alert(
      "確認",
      "食事プリセットを初期値に戻しますか？\n（削除したデフォルトプリセットが復元されます）",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "リセット",
          style: "destructive",
          onPress: async () => {
            try {
              // AsyncStorageから削除されたプリセットのキーを削除
              await AsyncStorage.removeItem("@omnitrack_deleted_default_presets");
              await AsyncStorage.removeItem("@omnitrack_default_preset_meals");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("完了", "食事プリセットを初期値に戻しました。");
            } catch (error) {
              console.error("プリセットリセットエラー:", error);
              Alert.alert("エラー", "プリセットのリセットに失敗しました。");
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (!ageNum || !heightNum || !weightNum) {
      Alert.alert("入力エラー", "年齢、身長、体重を正しく入力してください");
      return;
    }

    // 手動設定の場合は入力チェック
    if (pfcMode === "manual") {
      const proteinNum = parseInt(manualProtein);
      const fatNum = parseInt(manualFat);
      const carbsNum = parseInt(manualCarbs);
      if (!proteinNum || !fatNum || !carbsNum) {
        Alert.alert("入力エラー", "PFCを正しく入力してください");
        return;
      }
    }

    // BMR、TDEE、目標カロリーを計算
    const bmr = calculateBMR(ageNum, gender, heightNum, weightNum);
    const tdee = calculateTDEE(bmr, activityLevel);
    const targetCalories = calculateTargetCalories(tdee, goal);

    // PFCをモードに応じて計算
    let targetProtein: number;
    let targetFat: number;
    let targetCarbs: number;

    if (pfcMode === "manual") {
      targetProtein = parseInt(manualProtein);
      targetFat = parseInt(manualFat);
      targetCarbs = parseInt(manualCarbs);
    } else {
      const pfc = calculatePFCByPreset(targetCalories, weightNum, pfcMode);
      targetProtein = pfc.targetProtein;
      targetFat = pfc.targetFat;
      targetCarbs = pfc.targetCarbs;
    }

    const intervalTimerDurationNum = parseInt(intervalTimerDuration) || 90;

    const settings: UserSettings = {
      age: ageNum,
      gender,
      height: heightNum,
      weight: weightNum,
      activityLevel,
      goal,
      pfcMode,
      intervalTimerDuration: intervalTimerDurationNum,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      targetProtein,
      targetFat,
      targetCarbs,
    };

    await saveUserSettings(settings);

    // 身体記録と同期
    const latestBodyRecord = await getLatestBodyRecord();
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const bodyRecord: BodyRecord = {
      id: `body_${Date.now()}`,
      date: formatDate(new Date()),
      height: heightNum,
      weight: weightNum,
      bodyFatPercentage: latestBodyRecord?.bodyFatPercentage || 15, // デフォルト値
      age: ageNum,
      gender,
      activityLevel,
      createdAt: Date.now(),
    };

    await saveBodyRecord(bodyRecord);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const activityLevels = [
    { value: "sedentary", label: "ほとんど運動しない" },
    { value: "light", label: "軽い運動（週1-3日）" },
    { value: "moderate", label: "中程度の運動（週3-5日）" },
    { value: "active", label: "激しい運動（週6-7日）" },
    { value: "very_active", label: "非常に激しい運動" },
  ];

  const goals = [
    { value: "lose_weight", label: "減量（-500kcal/日）" },
    { value: "maintain", label: "維持" },
    { value: "gain_muscle", label: "増量（+300kcal/日）" },
  ];

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-foreground">目標設定</Text>
            <Text className="text-sm text-muted mt-1">基本情報から目標を自動計算</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary font-semibold">キャンセル</Text>
          </TouchableOpacity>
        </View>

        {/* 基本情報 */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-3">基本情報</Text>

          {/* 性別 */}
          <Text className="text-sm text-muted mb-2">性別</Text>
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setGender("male")}
              className="flex-1 p-3 rounded-xl items-center"
              style={{ backgroundColor: gender === "male" ? colors.primary : colors.surface }}
            >
              <Text style={{ color: gender === "male" ? "#fff" : colors.foreground }} className="font-semibold">
                男性
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGender("female")}
              className="flex-1 p-3 rounded-xl items-center"
              style={{ backgroundColor: gender === "female" ? colors.primary : colors.surface }}
            >
              <Text style={{ color: gender === "female" ? "#fff" : colors.foreground }} className="font-semibold">
                女性
              </Text>
            </TouchableOpacity>
          </View>

          {/* 年齢 */}
          <Text className="text-sm text-muted mb-2">年齢</Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="例: 25"
            keyboardType="number-pad"
            placeholderTextColor={colors.muted}
            className="p-3 rounded-xl mb-4 text-foreground"
            style={{ backgroundColor: colors.surface }}
          />

          {/* 身長 */}
          <Text className="text-sm text-muted mb-2">身長 (cm)</Text>
          <TextInput
            value={height}
            onChangeText={setHeight}
            placeholder="例: 170"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.muted}
            className="p-3 rounded-xl mb-4 text-foreground"
            style={{ backgroundColor: colors.surface }}
          />

          {/* 体重 */}
          <Text className="text-sm text-muted mb-2">体重 (kg)</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder="例: 70"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.muted}
            className="p-3 rounded-xl mb-4 text-foreground"
            style={{ backgroundColor: colors.surface }}
          />
        </View>

        {/* 活動レベル */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-3">活動レベル</Text>
          {activityLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              onPress={() => setActivityLevel(level.value as UserSettings["activityLevel"])}
              className="p-3 rounded-xl mb-2 flex-row items-center"
              style={{ backgroundColor: activityLevel === level.value ? colors.primary : colors.surface }}
            >
              <View
                className="w-5 h-5 rounded-full mr-3 items-center justify-center"
                style={{ borderWidth: 2, borderColor: activityLevel === level.value ? "#fff" : colors.border }}
              >
                {activityLevel === level.value && (
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: "#fff" }} />
                )}
              </View>
              <Text style={{ color: activityLevel === level.value ? "#fff" : colors.foreground }}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 目標 */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-3">目標</Text>
          {goals.map((g) => (
            <TouchableOpacity
              key={g.value}
              onPress={() => setGoal(g.value as UserSettings["goal"])}
              className="p-3 rounded-xl mb-2 flex-row items-center"
              style={{ backgroundColor: goal === g.value ? colors.primary : colors.surface }}
            >
              <View
                className="w-5 h-5 rounded-full mr-3 items-center justify-center"
                style={{ borderWidth: 2, borderColor: goal === g.value ? "#fff" : colors.border }}
              >
                {goal === g.value && (
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: "#fff" }} />
                )}
              </View>
              <Text style={{ color: goal === g.value ? "#fff" : colors.foreground }}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PFC設定モード */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-3">PFC目標設定</Text>
          {[
            { value: "preset_cut", label: "おすすめ１：減量（ローファット）" },
            { value: "preset_bulk", label: "おすすめ２：増量（バルクアップ）" },
            { value: "preset_maintain", label: "おすすめ３：維持（バランス型）" },
            { value: "manual", label: "手動設定" },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.value}
              onPress={() => setPfcMode(mode.value as UserSettings["pfcMode"])}
              className="p-3 rounded-xl mb-2 flex-row items-center"
              style={{ backgroundColor: pfcMode === mode.value ? colors.primary : colors.surface }}
            >
              <View
                className="w-5 h-5 rounded-full mr-3 items-center justify-center"
                style={{ borderWidth: 2, borderColor: pfcMode === mode.value ? "#fff" : colors.border }}
              >
                {pfcMode === mode.value && (
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: "#fff" }} />
                )}
              </View>
              <Text style={{ color: pfcMode === mode.value ? "#fff" : colors.foreground }}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 手動設定PFC入力 */}
        {pfcMode === "manual" && (
          <View className="mb-6">
            <Text className="text-base font-semibold text-foreground mb-3">手動PFC設定</Text>
            <Text className="text-sm text-muted mb-2">タンパク質 (g)</Text>
            <TextInput
              value={manualProtein}
              onChangeText={setManualProtein}
              placeholder="例: 150"
              keyboardType="number-pad"
              placeholderTextColor={colors.muted}
              className="p-3 rounded-xl mb-3 text-foreground"
              style={{ backgroundColor: colors.surface }}
            />
            <Text className="text-sm text-muted mb-2">脂質 (g)</Text>
            <TextInput
              value={manualFat}
              onChangeText={setManualFat}
              placeholder="例: 60"
              keyboardType="number-pad"
              placeholderTextColor={colors.muted}
              className="p-3 rounded-xl mb-3 text-foreground"
              style={{ backgroundColor: colors.surface }}
            />
            <Text className="text-sm text-muted mb-2">炭水化物 (g)</Text>
            <TextInput
              value={manualCarbs}
              onChangeText={setManualCarbs}
              placeholder="例: 250"
              keyboardType="number-pad"
              placeholderTextColor={colors.muted}
              className="p-3 rounded-xl mb-3 text-foreground"
              style={{ backgroundColor: colors.surface }}
            />
          </View>
        )}

        {/* インターバルタイマー設定 */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-3">インターバルタイマーのデフォルト秒数</Text>
          <View className="flex-row gap-2 mb-3">
            {[60, 90, 120, 180].map((duration) => (
              <TouchableOpacity
                key={duration}
                onPress={() => setIntervalTimerDuration(duration.toString())}
                className="flex-1 p-3 rounded-xl items-center"
                style={{ backgroundColor: intervalTimerDuration === duration.toString() ? colors.primary : colors.surface }}
              >
                <Text style={{ color: intervalTimerDuration === duration.toString() ? "#fff" : colors.foreground, fontWeight: "600" }}>
                  {duration}秒
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-sm text-muted mb-2">カスタム秒数</Text>
          <TextInput
            value={intervalTimerDuration}
            onChangeText={setIntervalTimerDuration}
            placeholder="例: 90"
            keyboardType="number-pad"
            placeholderTextColor={colors.muted}
            className="p-3 rounded-xl mb-3 text-foreground"
            style={{ backgroundColor: colors.surface }}
          />
        </View>

        {/* プリセットリセットボタン */}
        <TouchableOpacity
          onPress={handleResetPresets}
          className="p-4 rounded-xl items-center mb-4 flex-row justify-center gap-2"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-base font-semibold text-foreground">食事プリセットを初期値に戻す</Text>
        </TouchableOpacity>

        {/* 保存ボタン */}
        <TouchableOpacity
          onPress={handleSave}
          className="p-4 rounded-xl items-center mb-4"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-bold text-base">目標を保存</Text>
        </TouchableOpacity>

        {/* 計算結果プレビュー */}
        {age && height && weight && (
          <View className="p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <Text className="text-sm font-semibold text-foreground mb-2">計算結果プレビュー</Text>
            {(() => {
              const settings = initializeUserSettings(
                parseInt(age) || 0,
                gender,
                parseFloat(height) || 0,
                parseFloat(weight) || 0,
                activityLevel,
                goal
              );
              return (
                <View className="gap-1">
                  <Text className="text-xs text-muted">基礎代謝: {settings.bmr} kcal</Text>
                  <Text className="text-xs text-muted">総消費カロリー: {settings.tdee} kcal</Text>
                  <Text className="text-xs text-muted">目標摂取カロリー: {settings.targetCalories} kcal</Text>
                  <Text className="text-xs text-muted">
                    PFC目標: P {settings.targetProtein}g / F {settings.targetFat}g / C {settings.targetCarbs}g
                  </Text>
                </View>
              );
            })()}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
