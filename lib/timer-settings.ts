import AsyncStorage from "@react-native-async-storage/async-storage";

const TIMER_SETTINGS_KEY = "@omnitrack_timer_settings";

export type TimerSettings = {
  defaultDuration: number; // 秒数
};

const DEFAULT_SETTINGS: TimerSettings = {
  defaultDuration: 90,
};

// タイマー設定を保存
export async function saveTimerSettings(settings: TimerSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving timer settings:", error);
    throw error;
  }
}

// タイマー設定を取得
export async function getTimerSettings(): Promise<TimerSettings> {
  try {
    const data = await AsyncStorage.getItem(TIMER_SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error getting timer settings:", error);
    return DEFAULT_SETTINGS;
  }
}
