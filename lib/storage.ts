import AsyncStorage from "@react-native-async-storage/async-storage";

export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
};

export type LocalWorkoutData = {
  id: string;
  date: string; // YYYY-MM-DD
  exerciseId: number;
  exerciseName: string;
  equipmentType: string;
  bodyPart: string;
  sets: WorkoutSet[];
  totalVolume: number;
  estimated1RM: number;
  createdAt: number;
};

export type CalorieLog = {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  createdAt: number;
};

const WORKOUT_LOGS_KEY = "@omnitrack_workout_logs";
const PERSONAL_RECORDS_KEY = "@omnitrack_personal_records";
const CALORIE_LOGS_KEY = "@omnitrack_calorie_logs";

// トレーニング記録を保存
export async function saveWorkoutLog(log: LocalWorkoutData): Promise<void> {
  try {
    const existingLogs = await getWorkoutLogs();
    const updatedLogs = [...existingLogs, log];
    await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Error saving workout log:", error);
    throw error;
  }
}

// 全トレーニング記録を取得
export async function getWorkoutLogs(): Promise<LocalWorkoutData[]> {
  try {
    const data = await AsyncStorage.getItem(WORKOUT_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting workout logs:", error);
    return [];
  }
}

// 特定日付のトレーニング記録を取得
export async function getWorkoutLogsByDate(date: string): Promise<LocalWorkoutData[]> {
  try {
    const allLogs = await getWorkoutLogs();
    return allLogs.filter((log) => log.date === date);
  } catch (error) {
    console.error("Error getting workout logs by date:", error);
    return [];
  }
}

// 日付範囲のトレーニング記録を取得
export async function getWorkoutLogsByDateRange(
  startDate: string,
  endDate: string
): Promise<LocalWorkoutData[]> {
  try {
    const allLogs = await getWorkoutLogs();
    return allLogs.filter((log) => log.date >= startDate && log.date <= endDate);
  } catch (error) {
    console.error("Error getting workout logs by date range:", error);
    return [];
  }
}

// 総負荷量を計算(日付範囲)
export async function getTotalVolumeByDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  try {
    const logs = await getWorkoutLogsByDateRange(startDate, endDate);
    return logs.reduce((sum, log) => sum + log.totalVolume, 0);
  } catch (error) {
    console.error("Error calculating total volume:", error);
    return 0;
  }
}

// トレーニング日数を計算(日付範囲)
export async function getWorkoutDaysByDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  try {
    const logs = await getWorkoutLogsByDateRange(startDate, endDate);
    const uniqueDates = new Set(logs.map((log) => log.date));
    return uniqueDates.size;
  } catch (error) {
    console.error("Error calculating workout days:", error);
    return 0;
  }
}

// 種目別の自己ベスト(1RM)を取得
export type PersonalRecord = {
  exerciseId: number;
  exerciseName: string;
  best1RM: number;
  weight: number;
  reps: number;
  date: string;
};

export async function getPersonalRecords(): Promise<Record<number, PersonalRecord>> {
  try {
    const data = await AsyncStorage.getItem(PERSONAL_RECORDS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error getting personal records:", error);
    return {};
  }
}

// 自己ベストを更新
export async function updatePersonalRecord(
  exerciseId: number,
  exerciseName: string,
  rm: number,
  weight: number,
  reps: number,
  date: string
): Promise<boolean> {
  try {
    const records = await getPersonalRecords();
    const currentRecord = records[exerciseId];

    // 新記録かチェック
    if (!currentRecord || rm > currentRecord.best1RM) {
      records[exerciseId] = {
        exerciseId,
        exerciseName,
        best1RM: rm,
        weight,
        reps,
        date,
      };
      await AsyncStorage.setItem(PERSONAL_RECORDS_KEY, JSON.stringify(records));
      return true; // 新記録
    }
    return false; // 新記録ではない
  } catch (error) {
    console.error("Error updating personal record:", error);
    return false;
  }
}

// 種目別1RM履歴を取得
export async function get1RMHistoryByExercise(exerciseId: number): Promise<
  Array<{
    date: string;
    rm: number;
    weight: number;
    reps: number;
  }>
> {
  try {
    const allLogs = await getWorkoutLogs();
    const exerciseLogs = allLogs.filter((log) => log.exerciseId === exerciseId);

    return exerciseLogs.map((log) => ({
      date: log.date,
      rm: log.estimated1RM,
      weight: log.sets.reduce((max, set) => (set.weight > max ? set.weight : max), 0),
      reps: log.sets.reduce((max, set) => (set.reps > max ? set.reps : max), 0),
    }));
  } catch (error) {
    console.error("Error getting 1RM history:", error);
    return [];
  }
}

// データをクリア(開発用)
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WORKOUT_LOGS_KEY);
    await AsyncStorage.removeItem(PERSONAL_RECORDS_KEY);
  } catch (error) {
    console.error("Error clearing data:", error);
  }
}

// 身体記録
export type BodyRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  height: number; // cm
  weight: number; // kg
  bodyFatPercentage: number; // %
  age: number; // 年齢
  gender: "male" | "female"; // 性別
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active"; // 活動レベル
  createdAt: number;
};

const BODY_RECORDS_KEY = "@omnitrack_body_records";

// 身体記録を保存
export async function saveBodyRecord(record: BodyRecord): Promise<void> {
  try {
    const existingRecords = await getBodyRecords();
    const updatedRecords = [...existingRecords, record];
    await AsyncStorage.setItem(BODY_RECORDS_KEY, JSON.stringify(updatedRecords));
  } catch (error) {
    console.error("Error saving body record:", error);
    throw error;
  }
}

// 全身体記録を取得
export async function getBodyRecords(): Promise<BodyRecord[]> {
  try {
    const data = await AsyncStorage.getItem(BODY_RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting body records:", error);
    return [];
  }
}

// 最新の身体記録を取得
export async function getLatestBodyRecord(): Promise<BodyRecord | null> {
  try {
    const records = await getBodyRecords();
    if (records.length === 0) return null;
    return records.sort((a, b) => b.createdAt - a.createdAt)[0];
  } catch (error) {
    console.error("Error getting latest body record:", error);
    return null;
  }
}

// 基礎代謝を計算 (Harris-Benedict式)
export function calculateBMR(weight: number, height: number, age: number, gender: "male" | "female"): number {
  if (gender === "male") {
    return 66.47 + 13.75 * weight + 5.003 * height - 6.755 * age;
  } else {
    return 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;
  }
}

// 活動代謝を計算 (活動レベル係数)
export function calculateTDEE(bmr: number, activityLevel: BodyRecord["activityLevel"]): number {
  const activityMultipliers = {
    sedentary: 1.2, // 座り仕事、ほとんど運動しない
    light: 1.375, // 軽い運動(週1-3回)
    moderate: 1.55, // 中程度の運動(週3-5回)
    active: 1.725, // 激しい運動(週6-7回)
    very_active: 1.9, // 非常に激しい運動(1日2回など)
  };
  return bmr * activityMultipliers[activityLevel];
}

// 有酸素運動記録
export type CardioLog = {
  id: string;
  date: string; // YYYY-MM-DD
  exerciseType: string; // ランニング、サイクリング、水泳など
  duration: number; // 分
  distance: number; // km
  calories: number; // kcal
  createdAt: number;
};

const CARDIO_LOGS_KEY = "@omnitrack_cardio_logs";

// 有酸素運動記録を保存
export async function saveCardioLog(log: CardioLog): Promise<void> {
  try {
    const existingLogs = await getCardioLogs();
    const updatedLogs = [...existingLogs, log];
    await AsyncStorage.setItem(CARDIO_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Error saving cardio log:", error);
    throw error;
  }
}

// 全有酸素運動記録を取得
export async function getCardioLogs(): Promise<CardioLog[]> {
  try {
    const data = await AsyncStorage.getItem(CARDIO_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting cardio logs:", error);
    return [];
  }
}

// 特定日付の有酸素運動記録を取得
export async function getCardioLogsByDate(date: string): Promise<CardioLog[]> {
  try {
    const allLogs = await getCardioLogs();
    return allLogs.filter((log) => log.date === date);
  } catch (error) {
    console.error("Error getting cardio logs by date:", error);
    return [];
  }
}

// カロリー記録を保存
export async function saveCalorieLog(log: CalorieLog): Promise<void> {
  try {
    const existingLogs = await getCalorieLogs();
    const updatedLogs = [...existingLogs, log];
    await AsyncStorage.setItem(CALORIE_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Error saving calorie log:", error);
    throw error;
  }
}

// 全カロリー記録を取得
export async function getCalorieLogs(): Promise<CalorieLog[]> {
  try {
    const data = await AsyncStorage.getItem(CALORIE_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting calorie logs:", error);
    return [];
  }
}

// 特定日付のカロリー記録を取得
export async function getCalorieLogsByDate(date: string): Promise<CalorieLog[]> {
  try {
    const allLogs = await getCalorieLogs();
    return allLogs.filter((log) => log.date === date);
  } catch (error) {
    console.error("Error getting calorie logs by date:", error);
    return [];
  }
}

// 特定日付の総摂取カロリーを計算
export async function getTotalCaloriesByDate(date: string): Promise<number> {
  try {
    const logs = await getCalorieLogsByDate(date);
    return logs.reduce((total, log) => total + log.calories, 0);
  } catch (error) {
    console.error("Error calculating total calories:", error);
    return 0;
  }
}

// 特定日付の総消費カロリーを計算（TDEE + 運動消費）
export async function getTotalBurnedCaloriesByDate(date: string): Promise<number> {
  try {
    const bodyRecord = await getLatestBodyRecord();
    if (!bodyRecord) return 0;

    // TDEE（基礎代謝 × 活動レベル）
    const bmr = calculateBMR(bodyRecord.weight, bodyRecord.height, bodyRecord.age, bodyRecord.gender);
    const tdee = calculateTDEE(bmr, bodyRecord.activityLevel);

    // 有酸素運動の消費カロリー
    const cardioLogs = await getCardioLogsByDate(date);
    const cardioCalories = cardioLogs.reduce((total, log) => total + log.calories, 0);

    // 筋トレの消費カロリー（概算: 1セットあたり5kcal）
    const workoutLogs = await getWorkoutLogsByDate(date);
    const workoutCalories = workoutLogs.reduce((total, log) => {
      return total + log.sets.length * 5;
    }, 0);

    return tdee + cardioCalories + workoutCalories;
  } catch (error) {
    console.error("Error calculating burned calories:", error);
    return 0;
  }
}
