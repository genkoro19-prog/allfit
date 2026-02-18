import AsyncStorage from "@react-native-async-storage/async-storage";

const WORKOUT_LOGS_KEY = "@omnitrack_workout_logs";
const CARDIO_LOGS_KEY = "@omnitrack_cardio_logs";

// トレーニング記録を削除
export async function deleteWorkoutLog(logId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(WORKOUT_LOGS_KEY);
    if (!data) return;
    
    const logs = JSON.parse(data);
    const updatedLogs = logs.filter((log: any) => log.id !== logId);
    await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Error deleting workout log:", error);
    throw error;
  }
}

// 有酸素記録を削除
export async function deleteCardioLog(logId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(CARDIO_LOGS_KEY);
    if (!data) return;
    
    const logs = JSON.parse(data);
    const updatedLogs = logs.filter((log: any) => log.id !== logId);
    await AsyncStorage.setItem(CARDIO_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Error deleting cardio log:", error);
    throw error;
  }
}
