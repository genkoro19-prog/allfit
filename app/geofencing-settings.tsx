import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { saveGymLocation, getGymLocation, getCheckInHistory, saveCheckInRecord, type GymLocation, type CheckInRecord } from "@/lib/geofencing-storage";
import * as Haptics from "expo-haptics";

const GEOFENCING_TASK_NAME = "GEOFENCING_TASK";

// ジオフェンシングタスクを定義
TaskManager.defineTask(GEOFENCING_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Geofencing error:", error);
    return;
  }
  if (data) {
    const { eventType, region } = data as any;
    const gymLocation = await getGymLocation();
    if (!gymLocation) return;

    const record: CheckInRecord = {
      id: Date.now().toString(),
      type: eventType === 1 ? "check-in" : "check-out", // 1 = enter, 2 = exit
      timestamp: new Date().toISOString(),
      gymName: gymLocation.name,
    };
    await saveCheckInRecord(record);
    console.log(`Geofencing: ${record.type} at ${gymLocation.name}`);
  }
});

export default function GeofencingSettingsScreen() {
  const colors = useColors();
  const [gymName, setGymName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("100");
  const [isGeofencingActive, setIsGeofencingActive] = useState(false);
  const [history, setHistory] = useState<CheckInRecord[]>([]);

  useEffect(() => {
    loadGymLocation();
    loadHistory();
    checkGeofencingStatus();
  }, []);

  const loadGymLocation = async () => {
    const location = await getGymLocation();
    if (location) {
      setGymName(location.name);
      setLatitude(location.latitude.toString());
      setLongitude(location.longitude.toString());
      setRadius(location.radius.toString());
    }
  };

  const loadHistory = async () => {
    const records = await getCheckInHistory();
    setHistory(records);
  };

  const checkGeofencingStatus = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK_NAME);
    setIsGeofencingActive(isRegistered);
  };

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("エラー", "位置情報の権限が必要です");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("エラー", "現在地を取得できませんでした");
    }
  };

  const handleSaveAndStart = async () => {
    if (!gymName || !latitude || !longitude || !radius) {
      Alert.alert("エラー", "すべての項目を入力してください");
      return;
    }

    // Web環境ではジオフェンシングをサポートしない
    if (Platform.OS === "web") {
      Alert.alert(
        "ジオフェンシングは利用できません",
        "Web環境ではジオフェンシング機能は利用できません。\n実機またはExpo Goアプリでお試しください。"
      );
      return;
    }

    const gymLocation: GymLocation = {
      name: gymName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: parseFloat(radius),
    };

    try {
      // 位置情報の権限を確認
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== "granted") {
        Alert.alert("エラー", "位置情報の権限が必要です");
        return;
      }

      // バックグラウンド権限を確認（iOS/Android）
      if (Platform.OS !== "web") {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== "granted") {
          Alert.alert(
            "バックグラウンド権限が必要",
            "自動チェックイン/チェックアウトにはバックグラウンドでの位置情報アクセスが必要です。設定から「常に許可」を選択してください。"
          );
          return;
        }
      }

      // ジム位置を保存
      await saveGymLocation(gymLocation);

      // ジオフェンシングを開始
      await Location.startGeofencingAsync(GEOFENCING_TASK_NAME, [
        {
          identifier: "gym",
          latitude: gymLocation.latitude,
          longitude: gymLocation.longitude,
          radius: gymLocation.radius,
          notifyOnEnter: true,
          notifyOnExit: true,
        },
      ]);

      setIsGeofencingActive(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("成功", "ジオフェンシングを開始しました");
    } catch (error) {
      console.error("Error starting geofencing:", error);
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      Alert.alert(
        "ジオフェンシングに失敗しました",
        `エラー詳細: ${errorMessage}\n\nWeb環境ではジオフェンシングは利用できません。実機またはExpo Goでお試しください。`
      );
    }
  };

  const handleStop = async () => {
    try {
      await Location.stopGeofencingAsync(GEOFENCING_TASK_NAME);
      setIsGeofencingActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("成功", "ジオフェンシングを停止しました");
    } catch (error) {
      console.error("Error stopping geofencing:", error);
      Alert.alert("エラー", "ジオフェンシングの停止に失敗しました");
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-lg text-foreground">←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">ジオフェンス設定</Text>
        </View>

        {/* ステータス */}
        <View
          className="p-4 rounded-xl mb-4"
          style={{ backgroundColor: isGeofencingActive ? "#10B981" : colors.surface }}
        >
          <Text className="text-base font-semibold" style={{ color: isGeofencingActive ? "#fff" : colors.foreground }}>
            {isGeofencingActive ? "ジオフェンシング有効" : "ジオフェンシング無効"}
          </Text>
        </View>

        {/* ジム位置設定 */}
        <Text className="text-base font-semibold text-foreground mb-2">ジム情報</Text>
        <View className="mb-4">
          <TextInput
            value={gymName}
            onChangeText={setGymName}
            placeholder="ジム名"
            placeholderTextColor={colors.muted}
            className="p-3 rounded-xl mb-2 text-foreground"
            style={{ backgroundColor: colors.surface }}
          />
          <View className="flex-row gap-2 mb-2">
            <TextInput
              value={latitude}
              onChangeText={setLatitude}
              placeholder="緯度"
              keyboardType="numeric"
              placeholderTextColor={colors.muted}
              className="flex-1 p-3 rounded-xl text-foreground"
              style={{ backgroundColor: colors.surface }}
            />
            <TextInput
              value={longitude}
              onChangeText={setLongitude}
              placeholder="経度"
              keyboardType="numeric"
              placeholderTextColor={colors.muted}
              className="flex-1 p-3 rounded-xl text-foreground"
              style={{ backgroundColor: colors.surface }}
            />
          </View>
          <TextInput
            value={radius}
            onChangeText={setRadius}
            placeholder="半径（メートル）"
            keyboardType="numeric"
            placeholderTextColor={colors.muted}
            className="p-3 rounded-xl mb-2 text-foreground"
            style={{ backgroundColor: colors.surface }}
          />
          <TouchableOpacity
            onPress={handleGetCurrentLocation}
            className="p-3 rounded-xl items-center mb-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold text-white">現在地を取得</Text>
          </TouchableOpacity>
        </View>

        {/* 開始/停止ボタン */}
        {isGeofencingActive ? (
          <TouchableOpacity
            onPress={handleStop}
            className="p-3 rounded-xl items-center mb-4"
            style={{ backgroundColor: "#EF4444" }}
          >
            <Text className="text-base font-semibold text-white">ジオフェンシングを停止</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSaveAndStart}
            className="p-3 rounded-xl items-center mb-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold text-white">保存してジオフェンシングを開始</Text>
          </TouchableOpacity>
        )}

        {/* チェックイン履歴 */}
        <Text className="text-base font-semibold text-foreground mb-2">チェックイン履歴</Text>
        {history.length === 0 ? (
          <View
            className="p-6 rounded-xl items-center"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-sm text-muted">履歴がありません</Text>
          </View>
        ) : (
          history.slice(0, 20).map((record) => (
            <View
              key={record.id}
              className="p-4 rounded-xl mb-2"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {record.type === "check-in" ? "チェックイン" : "チェックアウト"}
                  </Text>
                  <Text className="text-xs text-muted">{record.gymName}</Text>
                </View>
                <Text className="text-xs text-muted">
                  {new Date(record.timestamp).toLocaleString("ja-JP")}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
