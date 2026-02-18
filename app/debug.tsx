import { useState } from "react";
import { View, Text, Pressable, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

export default function DebugScreen() {
  const colors = useColors();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClearAllData = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Web環境ではwindow.confirmを使用
    const confirmed = Platform.OS === "web" 
      ? window.confirm("すべてのトレーニング履歴、身体記録、カロリー記録を削除します。\nこの操作は取り消せません。\n\n本当に削除しますか？")
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            "全データ削除",
            "すべてのトレーニング履歴、身体記録、カロリー記録を削除します。この操作は取り消せません。",
            [
              { text: "キャンセル", style: "cancel", onPress: () => resolve(false) },
              { text: "削除", style: "destructive", onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      console.log("削除開始...");
      
      // AsyncStorageの全データを削除
      const keysToRemove = [
        "workout_logs",
        "cardio_logs",
        "calorie_logs",
        "body_records",
        "personal_records",
      ];
      console.log("削除するキー:", keysToRemove);
      await AsyncStorage.multiRemove(keysToRemove);
      console.log("削除完了");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (Platform.OS === "web") {
        alert("すべてのデータを削除しました");
        router.back();
      } else {
        Alert.alert("完了", "すべてのデータを削除しました", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("データ削除エラー:", error);
      if (Platform.OS === "web") {
        alert("データの削除に失敗しました");
      } else {
        Alert.alert("エラー", "データの削除に失敗しました");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1">
        <Text className="text-2xl font-bold text-foreground mb-2">デバッグ</Text>
        <Text className="text-sm text-muted mb-8">開発用のデバッグ機能です</Text>

        <View className="gap-4">
          <Pressable
            onPress={handleClearAllData}
            disabled={isDeleting}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? "#DC2626" : "#EF4444",
                opacity: isDeleting ? 0.5 : pressed ? 0.9 : 1,
                padding: 16,
                borderRadius: 12,
              },
            ]}
          >
            <Text className="text-white font-bold text-center">
              {isDeleting ? "削除中..." : "全データを削除"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? colors.surface : "transparent",
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                borderRadius: 12,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text className="text-foreground font-bold text-center">戻る</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
