import { useState, useEffect, useMemo } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { router } from "expo-router";
import {
  getWorkoutLogs,
  getPersonalRecords,
  getTotalVolumeByDateRange,
  getWorkoutDaysByDateRange,
  getLatestBodyRecord,
  saveBodyRecord,
  type PersonalRecord,
  type BodyRecord,
} from "@/lib/storage";
import { getUserSettings, saveUserSettings, calculateBMR, calculateTDEE, calculateTargetCalories, calculatePFCByPreset } from "@/lib/user-settings";
import * as Haptics from "expo-haptics";
import { AdBanner } from "@/components/ad-banner";

export default function RecordsScreen() {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [personalRecords, setPersonalRecords] = useState<Record<number, PersonalRecord>>({});
  const [monthVolume, setMonthVolume] = useState(0);
  const [monthDays, setMonthDays] = useState(0);
  const [bodyRecord, setBodyRecord] = useState<BodyRecord | null>(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activityLevel, setActivityLevel] = useState<BodyRecord["activityLevel"]>("sedentary");

  // 日付をYYYY-MM-DD形式に変換
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 月間カレンダーのデータを生成（5週固定）
  const generateMonthCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const calendar: Array<Date | null> = [];

    // 前月の空白
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push(null);
    }

    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(new Date(year, month, day));
    }

    // 5週分（35マス）に固定するため、不足分を空白で埋める
    while (calendar.length < 35) {
      calendar.push(null);
    }

    return calendar;
  };

  const calendar = generateMonthCalendar();

  // データ読み込み
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    // 自己ベスト記録を取得
    const records = await getPersonalRecords();
    setPersonalRecords(records);

    // 最新の身体記録を取得
    const latestRecord = await getLatestBodyRecord();
    if (latestRecord) {
      setBodyRecord(latestRecord);
      setHeight(latestRecord.height.toString());
      setWeight(latestRecord.weight.toString());
      setBodyFat(latestRecord.bodyFatPercentage.toString());
      setAge(latestRecord.age.toString());
      setGender(latestRecord.gender);
      setActivityLevel(latestRecord.activityLevel);
    }

    // 月間統計
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const volume = await getTotalVolumeByDateRange(
      formatDate(firstDay),
      formatDate(lastDay)
    );
    const days = await getWorkoutDaysByDateRange(
      formatDate(firstDay),
      formatDate(lastDay)
    );

    setMonthVolume(volume);
    setMonthDays(days);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const handleDatePress = (date: Date) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDate(date);
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date | null): boolean => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const bodyFatNum = parseFloat(bodyFat);
    const ageNum = parseInt(age);

    if (isNaN(heightNum) || isNaN(weightNum) || isNaN(bodyFatNum) || isNaN(ageNum)) {
      alert("すべての項目を正しく入力してください");
      return;
    }

    const record: BodyRecord = {
      id: `body_${Date.now()}`,
      date: formatDate(new Date()),
      height: heightNum,
      weight: weightNum,
      bodyFatPercentage: bodyFatNum,
      age: ageNum,
      gender,
      activityLevel,
      createdAt: Date.now(),
    };

    await saveBodyRecord(record);

    // ユーザー設定と同期
    const userSettings = await getUserSettings();
    if (userSettings) {
      // 既存の設定がある場合、身長・体重・年齢・性別を更新
      const bmr = calculateBMR(ageNum, gender, heightNum, weightNum);
      const tdee = calculateTDEE(bmr, userSettings.activityLevel);
      const targetCalories = calculateTargetCalories(tdee, userSettings.goal);
      const pfc = calculatePFCByPreset(targetCalories, weightNum, userSettings.pfcMode);

      await saveUserSettings({
        ...userSettings,
        age: ageNum,
        gender,
        height: heightNum,
        weight: weightNum,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        targetProtein: pfc.targetProtein,
        targetFat: pfc.targetFat,
        targetCarbs: pfc.targetCarbs,
      });
    }

    alert("保存しました");
    await loadData();
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-2xl font-bold text-foreground">身体記録</Text>
            <Text className="text-sm text-muted">身長・体重・体脂肪率を記録します</Text>
          </View>
          <View className="flex-row gap-1">
            <TouchableOpacity
              onPress={() => router.push("/weekly-plan")}
              className="px-2 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-semibold text-white">週間</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/fatigue-heatmap")}
              className="px-2 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-semibold text-white">疲労</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/reminder-settings")}
              className="px-2 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-semibold text-white">通知</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/geofencing-settings")}
              className="px-2 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-semibold text-white">ジム</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View className="mb-4" />

        {/* カレンダーと入力欄の横並びレイアウト */}
        <View className="flex-row gap-3 mb-8">
          {/* 月間カレンダー (3/4) */}
          <View style={{ width: "73%" }}>
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity onPress={handlePrevMonth} className="p-2">
                <Text className="text-lg font-bold text-foreground">←</Text>
              </TouchableOpacity>
              <Text className="text-base font-bold text-foreground">
                {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月
              </Text>
              <TouchableOpacity onPress={handleNextMonth} className="p-2">
                <Text className="text-lg font-bold text-foreground">→</Text>
              </TouchableOpacity>
            </View>

            {/* 曜日ヘッダー */}
            <View className="flex-row mb-2">
              {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
                <View key={index} className="flex-1 items-center">
                  <Text className="text-xs text-muted font-medium">{day}</Text>
                </View>
              ))}
            </View>

            {/* カレンダーグリッド */}
            <View className="flex-row flex-wrap" style={{ height: 200 }}>
              {calendar.map((date, index) => (
                <View key={index} className="w-[14.28%] aspect-square p-1">
                  {date ? (
                    <TouchableOpacity
                      className="flex-1 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isToday(date) ? colors.primary : isSelected(date) ? colors.surface : "transparent",
                        borderWidth: isSelected(date) && !isToday(date) ? 2 : 0,
                        borderColor: colors.primary,
                      }}
                      onPress={() => handleDatePress(date)}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color: isToday(date) ? "#FFFFFF" : colors.foreground,
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-1" />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* 身体記録入力 (1/4) */}
          <View style={{ width: "25%" }} className="gap-2">
            <View>
              <Text className="text-[10px] text-muted mb-1">身長</Text>
              <TextInput
                className="px-2 py-1 rounded-lg text-xs text-foreground"
                style={{ backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="cm"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View>
              <Text className="text-[10px] text-muted mb-1">体重</Text>
              <TextInput
                className="px-2 py-1 rounded-lg text-xs text-foreground"
                style={{ backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="kg"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View>
              <Text className="text-[10px] text-muted mb-1">体脂肪率</Text>
              <TextInput
                className="px-2 py-1 rounded-lg text-xs text-foreground"
                style={{ backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }}
                value={bodyFat}
                onChangeText={setBodyFat}
                keyboardType="numeric"
                placeholder="%"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View>
              <Text className="text-[10px] text-muted mb-1">年齢</Text>
              <TextInput
                className="px-2 py-1 rounded-lg text-xs text-foreground"
                style={{ backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="歳"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>
        </View>

        {/* 性別と活動レベル */}
        <View className="mb-6">
          <Text className="text-xs text-muted mb-2">性別</Text>
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: gender === "male" ? colors.primary : colors.background, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => setGender("male")}
            >
              <Text className="text-sm font-semibold" style={{ color: gender === "male" ? "#FFFFFF" : colors.foreground }}>男性</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: gender === "female" ? colors.primary : colors.background, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => setGender("female")}
            >
              <Text className="text-sm font-semibold" style={{ color: gender === "female" ? "#FFFFFF" : colors.foreground }}>女性</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-muted mb-2">活動レベル（職業タイプ）</Text>
          <View className="gap-2">
            <TouchableOpacity
              className="py-2 px-3 rounded-lg"
              style={{ backgroundColor: activityLevel === "sedentary" ? colors.primary : colors.background, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => setActivityLevel("sedentary")}
            >
              <Text className="text-sm font-semibold" style={{ color: activityLevel === "sedentary" ? "#FFFFFF" : colors.foreground }}>座り仕事（ほとんど運動しない）</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-2 px-3 rounded-lg"
              style={{ backgroundColor: activityLevel === "light" ? colors.primary : colors.background, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => setActivityLevel("light")}
            >
              <Text className="text-sm font-semibold" style={{ color: activityLevel === "light" ? "#FFFFFF" : colors.foreground }}>立ち仕事（軽い運動）</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-2 px-3 rounded-lg"
              style={{ backgroundColor: activityLevel === "moderate" ? colors.primary : colors.background, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => setActivityLevel("moderate")}
            >
              <Text className="text-sm font-semibold" style={{ color: activityLevel === "moderate" ? "#FFFFFF" : colors.foreground }}>中程度の運動（週3-5回）</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-2 px-3 rounded-lg"
              style={{ backgroundColor: activityLevel === "active" ? colors.primary : colors.background, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => setActivityLevel("active")}
            >
              <Text className="text-sm font-semibold" style={{ color: activityLevel === "active" ? "#FFFFFF" : colors.foreground }}>激しい運動（週6-7回）</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-2 px-3 rounded-lg"
              style={{ backgroundColor: activityLevel === "very_active" ? colors.primary : colors.background, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => setActivityLevel("very_active")}
            >
              <Text className="text-sm font-semibold" style={{ color: activityLevel === "very_active" ? "#FFFFFF" : colors.foreground }}>非常に激しい運動（1日2回など）</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 月間統計 */}
        <View className="flex-row gap-3 mb-6">
          <View
            className="flex-1 p-4 rounded-xl"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-xs text-muted mb-1">月間総負荷量</Text>
            <Text className="text-2xl font-bold text-foreground">{monthVolume.toLocaleString()}</Text>
            <Text className="text-xs text-muted">kg</Text>
          </View>
          <View
            className="flex-1 p-4 rounded-xl"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-xs text-muted mb-1">月間トレーニング日数</Text>
            <Text className="text-2xl font-bold text-foreground">{monthDays}</Text>
            <Text className="text-xs text-muted">日</Text>
          </View>
        </View>

         {/* 統計グラフ */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">統計グラフ</Text>
          <View className="p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <Text className="text-sm text-muted text-center">統計グラフ機能は実装中です</Text>
            <Text className="text-xs text-muted text-center mt-2">トレーニング時間・1RM推移・体重推移・PFC推移</Text>
          </View>
        </View>

        {/* 自己ベスト記録 */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">自己ベスト記録</Text>
          {Object.keys(personalRecords).length === 0 ? (
            <View
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-sm text-muted text-center">記録がありません</Text>
            </View>
          ) : (
            <View className="gap-3">
              {Object.values(personalRecords).map((record) => (
                <View
                  key={record.exerciseId}
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-bold text-foreground">{record.exerciseName}</Text>
                    <Text className="text-xs text-muted">{record.date}</Text>
                  </View>
                  <View className="flex-row gap-4">
                    <View>
                      <Text className="text-xs text-muted">最大重量</Text>
                      <Text className="text-lg font-bold text-foreground">{record.weight} kg</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">推定1RM</Text>
                      <Text className="text-lg font-bold text-foreground">{record.best1RM} kg</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 広告バナー */}
      <AdBanner />
      
      {/* 保存ボタン（広告の上に固定） */}
      <View
        className="absolute left-0 right-0 px-4 py-3"
        style={{ bottom: 50, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1 }}
      >
        <TouchableOpacity
          className="py-4 rounded-xl items-center"
          style={{ backgroundColor: colors.primary }}
          onPress={handleSave}
        >
          <Text className="text-base font-bold text-white">保存</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
