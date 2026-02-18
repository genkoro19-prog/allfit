import { useState, useEffect } from "react";
import { ScrollView, Text, View, Dimensions } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getWorkoutLogs, getBodyRecords, type LocalWorkoutData } from "@/lib/storage";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { Circle } from "@shopify/react-native-skia";

const { width } = Dimensions.get("window");

type ChartDataPoint = {
  date: string;
  value: number;
};

export default function StatisticsScreen() {
  const colors = useColors();

  const [weightData, setWeightData] = useState<ChartDataPoint[]>([]);
  const [volumeData, setVolumeData] = useState<ChartDataPoint[]>([]);
  const [rmData, setRmData] = useState<ChartDataPoint[]>([]);

  const { state, isActive } = useChartPressState({ x: 0, y: { value: 0 } });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    // 体重データを取得
    const bodyRecords = await getBodyRecords();
    const weightChartData: ChartDataPoint[] = bodyRecords
      .filter((r) => r.weight)
      .map((r) => ({
        date: r.date,
        value: r.weight!,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setWeightData(weightChartData);

    // トレーニングデータを取得
    const workoutLogs = await getWorkoutLogs();
    
    // 日付ごとの総負荷量を計算
    const volumeByDate: Record<string, number> = {};
    workoutLogs.forEach((log) => {
      const totalVolume = log.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      volumeByDate[log.date] = (volumeByDate[log.date] || 0) + totalVolume;
    });
    const volumeChartData: ChartDataPoint[] = Object.entries(volumeByDate)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setVolumeData(volumeChartData);

    // 1RMデータを取得（ベンチプレスのみ）
    const benchPressLogs = workoutLogs.filter((log) => log.exerciseName === "ベンチプレス");
    const rmByDate: Record<string, number> = {};
    benchPressLogs.forEach((log) => {
      const maxRm = Math.max(...log.sets.map((set) => {
        // Epley式: 1RM = weight * (1 + reps / 30)
        return set.weight * (1 + set.reps / 30);
      }));
      if (!rmByDate[log.date] || maxRm > rmByDate[log.date]) {
        rmByDate[log.date] = maxRm;
      }
    });
    const rmChartData: ChartDataPoint[] = Object.entries(rmByDate)
      .map(([date, value]) => ({ date, value: Math.round(value) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setRmData(rmChartData);
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        {/* ヘッダー */}
        <View className="px-4 pt-4 pb-6">
          <Text className="text-2xl font-bold text-foreground">統計</Text>
          <Text className="text-sm text-muted mt-1">トレーニングの推移を確認</Text>
        </View>

        {/* 体重推移グラフ */}
        {weightData.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">体重推移</Text>
            <View
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.surface, height: 250 }}
            >
              <CartesianChart
                data={weightData.map((d, i) => ({ x: i, y: d.value }))}
                xKey="x"
                yKeys={["y"]}
                axisOptions={{
                  labelColor: colors.muted,
                  lineColor: colors.border,
                }}
              >
                {({ points }) => (
                  <Line
                    points={points.y}
                    color={colors.primary}
                    strokeWidth={3}
                    animate={{ type: "timing", duration: 300 }}
                  />
                )}
              </CartesianChart>
            </View>
          </View>
        )}

        {/* 総負荷量推移グラフ */}
        {volumeData.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">総負荷量推移</Text>
            <View
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.surface, height: 250 }}
            >
              <CartesianChart
                data={volumeData.map((d, i) => ({ x: i, y: d.value }))}
                xKey="x"
                yKeys={["y"]}
                axisOptions={{
                  labelColor: colors.muted,
                  lineColor: colors.border,
                }}
              >
                {({ points }) => (
                  <Line
                    points={points.y}
                    color="#FF6B6B"
                    strokeWidth={3}
                    animate={{ type: "timing", duration: 300 }}
                  />
                )}
              </CartesianChart>
            </View>
          </View>
        )}

        {/* 1RM推移グラフ（ベンチプレス） */}
        {rmData.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">1RM推移（ベンチプレス）</Text>
            <View
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.surface, height: 250 }}
            >
              <CartesianChart
                data={rmData.map((d, i) => ({ x: i, y: d.value }))}
                xKey="x"
                yKeys={["y"]}
                axisOptions={{
                  labelColor: colors.muted,
                  lineColor: colors.border,
                }}
              >
                {({ points }) => (
                  <Line
                    points={points.y}
                    color="#4ECDC4"
                    strokeWidth={3}
                    animate={{ type: "timing", duration: 300 }}
                  />
                )}
              </CartesianChart>
            </View>
          </View>
        )}

        {/* データがない場合 */}
        {weightData.length === 0 && volumeData.length === 0 && rmData.length === 0 && (
          <View className="px-4">
            <View
              className="p-8 rounded-xl items-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-base text-muted text-center">
                まだデータがありません{"\n"}トレーニングを記録してください
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
