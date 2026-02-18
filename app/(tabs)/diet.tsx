import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function DietScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 80 }}>
        <Text className="text-2xl font-bold text-foreground mb-2">食事管理</Text>
        <Text className="text-sm text-muted mb-6">フェーズ2で実装予定</Text>

        <View
          className="p-6 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.surface, minHeight: 200 }}
        >
          <Text className="text-base text-muted text-center">
            LLM連携による自然言語入力{"\n"}
            食事プリセット機能{"\n"}
            PFCバランス表示{"\n"}
            など
          </Text>
        </View>
      </ScrollView>

      {/* 広告バナー (仮表示) */}
      <View
        className="absolute bottom-0 left-0 right-0 h-12 items-center justify-center"
        style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}
      >
        <Text className="text-xs text-muted">広告スペース (320x50)</Text>
      </View>
    </ScreenContainer>
  );
}
