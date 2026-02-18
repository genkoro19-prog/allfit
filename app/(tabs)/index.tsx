import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Platform, Modal, Pressable } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getWorkoutLogsByDate,
  getTotalVolumeByDateRange,
  getWorkoutDaysByDateRange,
  getWorkoutLogs,
  getLatestBodyRecord,
  getCardioLogsByDate,
  getTotalCaloriesByDate,
  getTotalBurnedCaloriesByDate,
  type LocalWorkoutData,
  type CardioLog,
  type BodyRecord,
} from "@/lib/storage";
import { deleteWorkoutLog, deleteCardioLog } from "@/lib/storage-delete";
import * as Haptics from "expo-haptics";
import { MultiColorDot } from "@/components/multi-color-dot";

export default function HomeScreen() {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateLogs, setSelectedDateLogs] = useState<LocalWorkoutData[]>([]);
  const [selectedDateCardioLogs, setSelectedDateCardioLogs] = useState<CardioLog[]>([]);
  const [weekVolume, setWeekVolume] = useState(0);
  const [monthVolume, setMonthVolume] = useState(0);
  const [weekDays, setWeekDays] = useState(0);
  const [monthDays, setMonthDays] = useState(0);
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [workoutBodyParts, setWorkoutBodyParts] = useState<Map<string, string[]>>(new Map());
  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailDate, setDetailDate] = useState<Date | null>(null);
  const [todayIntakeCalories, setTodayIntakeCalories] = useState(0);
  const [todayBurnedCalories, setTodayBurnedCalories] = useState(0);

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
    const selectedDateStr = formatDate(selectedDate);
    const logs = await getWorkoutLogsByDate(selectedDateStr);
    setSelectedDateLogs(logs);

    const cardioLogs = await getCardioLogsByDate(selectedDateStr);
    setSelectedDateCardioLogs(cardioLogs);

    // 全トレーニング記録を取得してトレーニング実施日と部位を抽出
    const allLogs = await getWorkoutLogs();
    const dates = new Set(allLogs.map((log) => log.date));
    setWorkoutDates(dates);

    // 日付ごとの部位情報を抽出
    const bodyPartsMap = new Map<string, string[]>();
    allLogs.forEach((log) => {
      const existing = bodyPartsMap.get(log.date) || [];
      if (!existing.includes(log.bodyPart)) {
        existing.push(log.bodyPart);
      }
      bodyPartsMap.set(log.date, existing);
    });
    setWorkoutBodyParts(bodyPartsMap);

    // BMR/TDEEの計算
    const latestBodyRecord = await getLatestBodyRecord();
    if (latestBodyRecord) {
      const calculatedBMR = calculateBMR(
        latestBodyRecord.weight,
        latestBodyRecord.height,
        latestBodyRecord.age,
        latestBodyRecord.gender
      );
      const calculatedTDEE = calculateTDEE(calculatedBMR, latestBodyRecord.activityLevel);
      setBmr(Math.round(calculatedBMR));
      setTdee(Math.round(calculatedTDEE));
    }

    // 週間統計(過去7日間)
    const today = formatDate(new Date());
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekVol = await getTotalVolumeByDateRange(formatDate(weekStart), today);
    const weekD = await getWorkoutDaysByDateRange(formatDate(weekStart), today);
    setWeekVolume(weekVol);
    setWeekDays(weekD);

    // 月間統計(過去28日間)
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 27);
    const monthVol = await getTotalVolumeByDateRange(formatDate(monthStart), today);
    const monthD = await getWorkoutDaysByDateRange(formatDate(monthStart), today);
    setMonthVolume(monthVol);
    setMonthDays(monthD);

    // 今日のカロリー情報
    const intakeCalories = await getTotalCaloriesByDate(today);
    const burnedCalories = await getTotalBurnedCaloriesByDate(today);
    setTodayIntakeCalories(intakeCalories);
    setTodayBurnedCalories(burnedCalories);
  };

  // BMR計算(Harris-Benedict式)
  const calculateBMR = (weight: number, height: number, age: number, gender: "male" | "female"): number => {
    if (gender === "male") {
      return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
    }
  };

  // TDEE計算
  const calculateTDEE = (bmr: number, activityLevel: BodyRecord["activityLevel"]): number => {
    const multipliers: Record<BodyRecord["activityLevel"], number> = {
      sedentary: 1.2, // 座り仕事
      light: 1.375, // 立ち仕事
      moderate: 1.55, // 軽い運動
      active: 1.725, // 中程度の運動
      very_active: 1.9, // 激しい運動
    };
    return bmr * multipliers[activityLevel];
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

  const handleAddWorkout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // 選択された日付を渡す
    const dateStr = formatDate(selectedDate);
    console.log("[index.tsx] handleAddWorkout: 選択された日付 =", dateStr);
    router.push({
      pathname: "/(tabs)/workout",
      params: { date: dateStr },
    });
  };

  const handleAddCardio = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Create cardio session screen
    console.log("Cardio button pressed");
  };

  const handleRMCalculator = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Create RM calculator screen
    console.log("RM Calculator button pressed");
  };

  const handleDatePress = async (date: Date) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDate(date);
    const dateStr = formatDate(date);
    const logs = await getWorkoutLogsByDate(dateStr);
    const cardioLogs = await getCardioLogsByDate(dateStr);
    setSelectedDateLogs(logs);
    setSelectedDateCardioLogs(cardioLogs);
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

  const isSelectedDate = (date: Date | null): boolean => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasWorkout = (date: Date | null): boolean => {
    if (!date) return false;
    return workoutDates.has(formatDate(date));
  };

  const getBodyPartsForDate = (date: Date | null): string[] => {
    if (!date) return [];
    const parts = workoutBodyParts.get(formatDate(date)) || [];
    return parts; // 全部位を返す
  };

  const getBodyPartColor = (bodyPart: string): string => {
    const colorMap: Record<string, string> = {
      胸: "#FF6B6B",    // 赤
      背中: "#4ECDC4",  // 青緑
      背: "#4ECDC4",    // 青緑
      脚: "#FFD93D",    // 黄
      臀部: "#FF9FF3",  // ピンク
      尻: "#FF9FF3",    // ピンク
      肩: "#95E1D3",    // ミント
      腕: "#FFA07A",    // サーモン
      腹筋: "#A8E6CF",  // ライトグリーン
      腹: "#A8E6CF",    // ライトグリーン
      その他: "#B8B8B8", // グレー
      他: "#B8B8B8",    // グレー
    };
    return colorMap[bodyPart] || "#B8B8B8";
  };

  const getBodyPartShortName = (bodyPart: string): string => {
    const shortNames: Record<string, string> = {
      胸: "胸",
      背中: "背",
      脚: "脚",
      肩: "肩",
      腕: "腕",
      腹筋: "腹",
      臀部: "臀",
      その他: "他",
    };
    return shortNames[bodyPart] || bodyPart;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const japaneseMonthNames = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];

  // 部位別にグループ化されたトレーニング記録
  const groupedLogs = selectedDateLogs.reduce((acc: Record<string, LocalWorkoutData[]>, log: LocalWorkoutData) => {
    if (!acc[log.bodyPart]) {
      acc[log.bodyPart] = [];
    }
    acc[log.bodyPart].push(log);
    return acc;
  }, {} as Record<string, LocalWorkoutData[]>);

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        {/* ヘッダー */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">OmniTrack Fitness</Text>
        </View>

        {/* カレンダーとカロリー情報 */}
        <View className="px-4 py-4 flex-row gap-3">
          {/* 左側: カレンダー (3/4) */}
          <View style={{ width: '75%' }}>
          {/* 月名表示 */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={handlePrevMonth} className="p-2">
              <Text className="text-2xl font-bold text-foreground">←</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-3xl font-bold text-foreground">
                {japaneseMonthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
            </View>
            <TouchableOpacity onPress={handleNextMonth} className="p-2">
              <Text className="text-2xl font-bold text-foreground">→</Text>
            </TouchableOpacity>
          </View>

          {/* 曜日ヘッダー */}
          <View className="flex-row mb-3">
            {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
              <View key={index} className="flex-1 items-center">
                <Text className="text-xs text-muted font-semibold">{day}</Text>
              </View>
            ))}
          </View>

          {/* カレンダーグリッド */}
          <View className="flex-row flex-wrap" style={{ height: 240 }}>
            {calendar.map((date, index) => (
              <View key={index} className="w-[14.28%] aspect-square p-1">
                {date ? (
                  <TouchableOpacity
                    className="flex-1 items-center justify-center relative"
                    onPress={() => handleDatePress(date)}
                  >
                    {/* 背景の● */}
                    {hasWorkout(date) ? (
                      <View className="absolute inset-0 items-center justify-center">
                        <MultiColorDot
                          colors={getBodyPartsForDate(date).map(part => getBodyPartColor(part))}
                          size={36}
                        />
                      </View>
                    ) : isSelectedDate(date) ? (
                      <View
                        className="absolute inset-0 items-center justify-center"
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: colors.surface,
                            borderWidth: 2,
                            borderColor: colors.primary,
                          }}
                        />
                      </View>
                    ) : isToday(date) ? (
                      <View
                        className="absolute inset-0 items-center justify-center"
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                    ) : null}
                    {/* 数字 */}
                    <Text
                      className="text-base font-bold"
                      style={{
                        color: isToday(date) || hasWorkout(date) ? "#FFFFFF" : colors.foreground,
                        zIndex: 10,
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

          {/* 右側: カロリー情報 (1/4) */}
          <View style={{ width: '22%' }} className="gap-3">
            {/* 基礎代謝 */}
            <View
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-[10px] text-muted mb-1">基礎代謝</Text>
              <Text className="text-lg font-bold text-foreground">{bmr > 0 ? bmr : '-'}</Text>
              <Text className="text-[9px] text-muted">kcal</Text>
            </View>

            {/* 活動代謝 */}
            <View
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-[10px] text-muted mb-1">活動代謝</Text>
              <Text className="text-lg font-bold text-foreground">{tdee > 0 ? tdee : '-'}</Text>
              <Text className="text-[9px] text-muted">kcal</Text>
            </View>

            {/* 消費カロリー */}
            <TouchableOpacity
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push("/calorie-input");
              }}
            >
              <Text className="text-[10px] text-muted mb-1">消費</Text>
              <Text className="text-lg font-bold text-foreground">{todayBurnedCalories > 0 ? todayBurnedCalories : '-'}</Text>
              <Text className="text-[9px] text-muted">kcal</Text>
            </TouchableOpacity>

            {/* 摂取カロリー */}
            <TouchableOpacity
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push("/calorie-input");
              }}
            >
              <Text className="text-[10px] text-muted mb-1">摂取</Text>
              <Text className="text-lg font-bold text-foreground">{todayIntakeCalories > 0 ? todayIntakeCalories : '-'}</Text>
              <Text className="text-[9px] text-muted">kcal</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* アクションボタン */}
        <View className="px-4 pb-4">
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              className="flex-1 py-4 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleAddWorkout}
            >
              <Text className="text-base font-bold text-white">+筋トレ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-4 rounded-xl items-center justify-center"
              style={{ backgroundColor: "#4A90E2" }}
              onPress={handleAddCardio}
            >
              <Text className="text-base font-bold text-white">+有酸素</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-6 py-4 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              onPress={handleRMCalculator}
            >
              <Text className="text-base font-semibold text-foreground">RM換算</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 選択日のトレーニング記録 */}
        {(selectedDateLogs.length > 0 || selectedDateCardioLogs.length > 0) && (
          <View className="px-4 pb-4">
            <Text className="text-lg font-bold text-foreground mb-3">
              {japaneseMonthNames[selectedDate.getMonth()]}
              {selectedDate.getDate()}日のトレーニング
            </Text>

            {/* 筋トレ記録 */}
            {Object.entries(groupedLogs).map(([bodyPart, logs]) => (
              <View
                key={bodyPart}
                className="p-4 rounded-xl mb-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getBodyPartColor(bodyPart) }}
                  />
                  <Text className="text-lg font-bold text-foreground">{bodyPart}</Text>
                </View>

                {logs.map((log) => (
                  <View key={log.id} className="mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">{log.exerciseName}</Text>
                      </View>
                      <Text className="text-sm font-semibold mr-2" style={{ color: colors.primary }}>
                        RM: {log.estimated1RM.toFixed(1)}kg
                      </Text>
                      <TouchableOpacity
                        onPress={async () => {
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          const confirmed = Platform.OS === "web" 
                            ? window.confirm("このトレーニング記録を削除しますか？")
                            : true; // ネイティブではAlert.alertを使用する必要がある
                          if (confirmed) {
                            await deleteWorkoutLog(log.id);
                            loadData();
                          }
                        }}
                        className="px-2 py-1"
                      >
                        <Text className="text-xs" style={{ color: colors.error }}>削除</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      {log.sets.map((set, index) => (
                        <View
                          key={set.id}
                          className="px-3 py-2 rounded-lg"
                          style={{ backgroundColor: colors.border }}
                        >
                          <Text className="text-xs text-foreground">
                            {index + 1}. {set.weight}kg × {set.reps}回
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {/* 有酸素記録 */}
            {selectedDateCardioLogs.map((log) => (
              <View
                key={log.id}
                className="p-4 rounded-xl mb-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#4A90E2" }} />
                    <Text className="text-lg font-bold text-foreground">有酸素運動</Text>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      const confirmed = Platform.OS === "web" 
                        ? window.confirm("この有酸素運動記録を削除しますか？")
                        : true;
                      if (confirmed) {
                        await deleteCardioLog(log.id);
                        loadData();
                      }
                    }}
                    className="px-2 py-1"
                  >
                    <Text className="text-xs" style={{ color: colors.error }}>削除</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-base font-semibold text-foreground mb-2">{log.exerciseType}</Text>
                <View className="flex-row gap-4">
                  {log.distance > 0 && (
                    <Text className="text-sm text-muted">距離: {log.distance}km</Text>
                  )}
                  {log.duration > 0 && (
                    <Text className="text-sm text-muted">時間: {log.duration}分</Text>
                  )}
                  {log.calories > 0 && (
                    <Text className="text-sm text-muted">消費: {log.calories}kcal</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 広告バナー (仮表示) */}
      <View
        className="absolute bottom-0 left-0 right-0 h-12 items-center justify-center"
        style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}
      >
        <Text className="text-xs text-muted">広告スペース (320x50)</Text>
      </View>

      {/* 日付詳細モーダル */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setShowDetailModal(false)}
        >
          <Pressable
            className="w-11/12 max-w-md rounded-2xl p-6"
            style={{ backgroundColor: colors.background }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">
                {detailDate && `${japaneseMonthNames[detailDate.getMonth()]}${detailDate.getDate()}日の記録`}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text className="text-2xl text-muted">×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-96">
              {/* 筋トレ記録 */}
              {Object.entries(groupedLogs).map(([bodyPart, logs]) => (
                <View key={bodyPart} className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getBodyPartColor(bodyPart) }}
                    />
                    <Text className="text-base font-bold text-foreground">{bodyPart}</Text>
                  </View>
                  {logs.map((log) => (
                    <View key={log.id} className="mb-2 pl-5">
                      <Text className="text-sm font-semibold text-foreground">{log.exerciseName}</Text>
                      <Text className="text-xs text-muted">
                        {log.sets.length}セット · 総負荷量: {(log.totalVolume / 1000).toFixed(2)}t · RM: {log.estimated1RM.toFixed(1)}kg
                      </Text>
                    </View>
                  ))}
                </View>
              ))}

              {/* 有酸素運動記録 */}
              {selectedDateCardioLogs.map((cardio) => (
                <View key={cardio.id} className="mb-4">
                  <Text className="text-base font-bold text-foreground mb-2">{cardio.exerciseType}</Text>
                  <Text className="text-sm text-muted">
                    時間: {cardio.duration}分 · 距離: {cardio.distance > 0 ? `${cardio.distance}km` : "-"} · 消費: {cardio.calories}kcal
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
