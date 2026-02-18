import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { CameraView, Camera } from "expo-camera";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { router } from "expo-router";
import { saveMealLog } from "@/lib/food-storage";
import * as Haptics from "expo-haptics";
import { trpc } from "@/lib/trpc";

export default function BarcodeScannerScreen() {
  const colors = useColors();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const estimateProductMutation = trpc.food.estimateProductFromBarcode.useMutation();

  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setScannedData(data);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirmScan = async () => {
    if (!scannedData || isLoading) return;
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const data = scannedData;

    try {
      // Open Food Facts APIで商品情報を取得
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const result = await response.json();

      if (result.status === 1 && result.product) {
        const product = result.product;
        const nutriments = product.nutriments || {};

        // 100gあたりの栄養素を取得
        const calories = nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0;
        const protein = nutriments["proteins_100g"] || nutriments.proteins || 0;
        const fat = nutriments["fat_100g"] || nutriments.fat || 0;
        const carbs = nutriments["carbohydrates_100g"] || nutriments.carbohydrates || 0;

        const productName = product.product_name || product.product_name_ja || "商品名不明";

        Alert.alert(
          "商品が見つかりました",
          `${productName}\\n\\nカロリー: ${calories} kcal\\nタンパク質: ${protein}g\\n脂質: ${fat}g\\n炭水化物: ${carbs}g\\n\\n※100gあたりの栄養素です`,
          [
            {
              text: "キャンセル",
              style: "cancel",
              onPress: () => {
                setScanned(false);
                setIsLoading(false);
              },
            },
            {
              text: "記録する",
              onPress: async () => {
                const now = new Date();
                const hour = now.getHours();
                let mealType: "breakfast" | "lunch" | "dinner" | "snack" = "snack";
                if (hour >= 5 && hour < 11) mealType = "breakfast";
                else if (hour >= 11 && hour < 16) mealType = "lunch";
                else if (hour >= 16 && hour < 22) mealType = "dinner";

                await saveMealLog({
                  id: Date.now().toString(),
                  date: now.toISOString().split("T")[0],
                  mealType,
                  foods: [
                    {
                      name: productName,
                      amount: "100g",
                      calories,
                      protein,
                      carbs,
                      fat,
                    },
                  ],
                  totalCalories: calories,
                  totalProtein: protein,
                  totalCarbs: carbs,
                  totalFat: fat,
                  createdAt: Date.now(),
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              },
            },
          ]
        );
      } else {
        // Open Food Facts APIで見つからなかった場合、LLMで推定
        console.log("商品が見つからなかったため、LLMで推定します...");
        
        try {
          const llmResult = await estimateProductMutation.mutateAsync({ barcode: data });
          
          if (llmResult.error) {
            Alert.alert(
              "商品が見つかりません",
              "このバーコードの商品情報が見つかりませんでした。手動で入力してください。",
              [
                {
                  text: "OK",
                  onPress: () => {
                    setScanned(false);
                    setIsLoading(false);
                  },
                },
              ]
            );
          } else {
            const productName = llmResult.name || "商品名不明";
            const calories = llmResult.calories || 0;
            const protein = llmResult.protein || 0;
            const fat = llmResult.fat || 0;
            const carbs = llmResult.carbs || 0;

            Alert.alert(
              "商品情報を推定しました",
              `${productName}\n\nカロリー: ${calories} kcal\nタンパク質: ${protein}g\n脂質: ${fat}g\n炭水化物: ${carbs}g\n\n※100gあたりの推定値です。正確な値は成分表を確認してください。`,
              [
                {
                  text: "キャンセル",
                  style: "cancel",
                  onPress: () => {
                    setScanned(false);
                    setIsLoading(false);
                  },
                },
                {
                  text: "記録する",
                  onPress: async () => {
                    const now = new Date();
                    const hour = now.getHours();
                    let mealType: "breakfast" | "lunch" | "dinner" | "snack" = "snack";
                    if (hour >= 5 && hour < 11) mealType = "breakfast";
                    else if (hour >= 11 && hour < 16) mealType = "lunch";
                    else if (hour >= 16 && hour < 22) mealType = "dinner";

                    await saveMealLog({
                      id: Date.now().toString(),
                      date: now.toISOString().split("T")[0],
                      mealType,
                      foods: [
                        {
                          name: productName,
                          amount: "100g",
                          calories,
                          protein,
                          carbs,
                          fat,
                        },
                      ],
                      totalCalories: calories,
                      totalProtein: protein,
                      totalCarbs: carbs,
                      totalFat: fat,
                      createdAt: Date.now(),
                    });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.back();
                  },
                },
              ]
            );
          }
        } catch (llmError) {
          console.error("LLM推定エラー:", llmError);
          Alert.alert(
            "商品が見つかりません",
            "このバーコードの商品情報が見つかりませんでした。手動で入力してください。",
            [
              {
                text: "OK",
                onPress: () => {
                  setScanned(false);
                  setIsLoading(false);
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error("バーコード検索エラー:", error);
      Alert.alert("エラー", "商品情報の取得に失敗しました", [
        {
          text: "OK",
          onPress: () => {
            setScanned(false);
            setIsLoading(false);
          },
        },
      ]);
    }
  };

  if (hasPermission === null) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground">カメラの権限を確認中...</Text>
      </ScreenContainer>
    );
  }

  if (hasPermission === false) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-center mb-4">
          カメラへのアクセスが拒否されています。設定からカメラの権限を許可してください。
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold">戻る</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  if (Platform.OS === "web") {
    return (
      <ScreenContainer className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-center mb-4">
          バーコードスキャン機能はモバイルアプリでのみ利用可能です。
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold">戻る</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          {/* 上部ヘッダー */}
          <View style={[styles.header, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={{ color: "#fff", fontSize: 16 }}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>バーコードスキャン</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* スキャンエリア */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            <Text style={styles.instruction}>バーコードを枠内に合わせてください</Text>
          </View>

          {/* 下部説明と確認ボタン */}
          <View style={[styles.footer, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
            {scanned && scannedData ? (
              <View style={{ alignItems: "center", gap: 12 }}>
                <Text style={{ color: "#fff", fontSize: 14, marginBottom: 8 }}>
                  バーコードを読み取りました
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setScanned(false);
                      setScannedData(null);
                    }}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>再スキャン</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmScan}
                    style={{
                      paddingHorizontal: 32,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>確認</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={{ color: "#fff", textAlign: "center", fontSize: 14 }}>
                商品のバーコードをスキャンすると、Open Food Factsから栄養情報を自動取得します
              </Text>
            )}
          </View>
        </View>
      </CameraView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingBox, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.foreground, fontSize: 16 }}>商品情報を取得中...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 60,
  },
  scanArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  instruction: {
    color: "#fff",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBox: {
    padding: 20,
    borderRadius: 12,
  },
});
