import AsyncStorage from "@react-native-async-storage/async-storage";

const CUSTOM_EXERCISES_KEY = "@omnitrack_custom_exercises";

export type CustomExercise = {
  id: string;
  name: string;
  bodyPart: string; // 日本語の部位名
  equipmentType: "barbell" | "dumbbell" | "machine" | "bodyweight";
  createdAt: number;
};

// カスタム種目を保存
export async function saveCustomExercise(exercise: CustomExercise): Promise<void> {
  try {
    const exercises = await getCustomExercises();
    const updatedExercises = [...exercises, exercise];
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updatedExercises));
  } catch (error) {
    console.error("Error saving custom exercise:", error);
    throw error;
  }
}

// 全カスタム種目を取得
export async function getCustomExercises(): Promise<CustomExercise[]> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting custom exercises:", error);
    return [];
  }
}

// カスタム種目を更新
export async function updateCustomExercise(exerciseId: string, updates: Partial<CustomExercise>): Promise<void> {
  try {
    const exercises = await getCustomExercises();
    const updatedExercises = exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    );
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updatedExercises));
  } catch (error) {
    console.error("Error updating custom exercise:", error);
    throw error;
  }
}

// カスタム種目を削除
export async function deleteCustomExercise(exerciseId: string): Promise<void> {
  try {
    const exercises = await getCustomExercises();
    const updatedExercises = exercises.filter((ex) => ex.id !== exerciseId);
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updatedExercises));
  } catch (error) {
    console.error("Error deleting custom exercise:", error);
    throw error;
  }
}
