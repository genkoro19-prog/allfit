# AllFit - アーキテクチャドキュメント

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    AllFit モバイルアプリ                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Expo Router (ナビゲーション)             │   │
│  │  ┌─────────┬─────────┬─────────┬─────────┐          │   │
│  │  │ Home    │ Diet    │ Records │ Stats   │          │   │
│  │  └─────────┴─────────┴─────────┴─────────┘          │   │
│  │  ┌──────────────────────────────────────┐            │   │
│  │  │ Workout Session / Barcode / Settings │            │   │
│  │  └──────────────────────────────────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Context + Hooks                    │   │
│  │  ┌──────────────┬──────────────┬──────────────┐      │   │
│  │  │ useColors    │ useAuth      │ useColorScheme│     │   │
│  │  └──────────────┴──────────────┴──────────────┘      │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ビジネスロジック層                        │   │
│  │  ┌──────────────────────────────────────┐            │   │
│  │  │ lib/storage.ts (AsyncStorage操作)     │            │   │
│  │  │ lib/food-storage.ts (食品管理)        │            │   │
│  │  │ lib/geofencing-storage.ts (位置情報)  │            │   │
│  │  └──────────────────────────────────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              データ層                                 │   │
│  │  ┌──────────────────────────────────────┐            │   │
│  │  │ AsyncStorage (ローカル保存)           │            │   │
│  │  │ - workoutLogs                        │            │   │
│  │  │ - dietLogs                           │            │   │
│  │  │ - bodyRecords                        │            │   │
│  │  │ - userSettings                       │            │   │
│  │  │ - presetMeals / myFoods              │            │   │
│  │  │ - gymLocation / checkInHistory       │            │   │
│  │  └──────────────────────────────────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │      外部API（オプション）            │
        ├──────────────────────────────────────┤
        │ Open Food Facts API                  │
        │ (バーコード → 商品情報)              │
        │                                      │
        │ Manus LLM API                        │
        │ (自然言語解析 / 商品推定)            │
        └──────────────────────────────────────┘
```

---

## データフロー

### 1. トレーニング記録の流れ

```
ユーザー入力
    ↓
Workout Session画面
    ↓
種目・重量・回数を入力
    ↓
handleSaveWorkout()
    ↓
AsyncStorage.setItem('workoutLogs', ...)
    ↓
ホーム画面に反映
```

### 2. 食事記録の流れ

```
ユーザー入力
    ↓
Diet画面
    ↓
┌─ 自然言語入力 → LLM解析 → PFC計算
│
└─ バーコード読み込み → Open Food Facts API
                    ↓
                LLM補完（失敗時）
                    ↓
AsyncStorage.setItem('dietLogs', ...)
    ↓
ホーム画面に反映
```

### 3. ジオフェンシングの流れ

```
ユーザーが位置情報許可
    ↓
Geofencing Settings画面
    ↓
ジム位置情報を入力
    ↓
Location.startGeofencingAsync()
    ↓
TaskManager.defineTask()でバックグラウンドタスク登録
    ↓
ジム範囲内に入る/出る
    ↓
自動チェックイン/チェックアウト
    ↓
AsyncStorage.setItem('checkInHistory', ...)
```

---

## 状態管理の設計

### Context + AsyncStorage パターン

```typescript
// ✅ 推奨パターン
const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

useEffect(() => {
  // 初期化時にAsyncStorageから読み込み
  loadWorkoutLogs();
}, []);

const loadWorkoutLogs = async () => {
  const data = await AsyncStorage.getItem('workoutLogs');
  setWorkoutLogs(data ? JSON.parse(data) : []);
};

const saveWorkoutLog = async (log: WorkoutLog) => {
  const updated = [...workoutLogs, log];
  setWorkoutLogs(updated);
  // 重要: 状態更新後にAsyncStorageに保存
  await AsyncStorage.setItem('workoutLogs', JSON.stringify(updated));
};
```

### なぜこのパターン？

| 理由 | 説明 |
|------|------|
| **シンプル** | Redux/Zustandより学習コストが低い |
| **オフライン対応** | AsyncStorageでローカル保存 |
| **パフォーマンス** | 不要な再レンダリングなし |
| **保守性** | コンポーネント単位で管理可能 |

---

## コンポーネント設計

### ScreenContainer パターン

```typescript
// SafeArea + テーマ背景を自動処理
<ScreenContainer className="p-4">
  {/* コンテンツ */}
</ScreenContainer>

// 内部実装
export function ScreenContainer({ children, className, edges = ["top", "left", "right"] }) {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={edges} className="flex-1">
        <View className={cn("flex-1", className)}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}
```

### 利点

- ✅ ノッチ・ホームインジケータ対応
- ✅ テーマ背景が自動適用
- ✅ 全画面で統一されたレイアウト
- ✅ SafeArea設定を一元管理

---

## スタイリング戦略

### Tailwind CSS（NativeWind）

```typescript
// ✅ 推奨: Tailwindクラス
<View className="flex-1 items-center justify-center p-4 bg-background">
  <Text className="text-2xl font-bold text-foreground">Title</Text>
</View>

// ❌ 非推奨: インラインスタイル
<View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 16 }}>
  <Text style={{ fontSize: 24, fontWeight: '700' }}>Title</Text>
</View>
```

### テーマカラー

```typescript
// theme.config.js で定義
const themeColors = {
  primary: { light: '#FF6B35', dark: '#FF6B35' },
  background: { light: '#FFFFFF', dark: '#151718' },
  foreground: { light: '#11181C', dark: '#ECEDEE' },
  // ...
};

// コンポーネントで使用
const colors = useColors();
<View style={{ backgroundColor: colors.primary }} />
```

---

## エラーハンドリング

### 推奨パターン

```typescript
const handleSave = async () => {
  try {
    // 入力検証
    if (!validate(data)) {
      Alert.alert('エラー', '入力内容を確認してください');
      return;
    }

    // 処理実行
    await saveData(data);
    
    // 成功フィードバック
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('成功', '保存しました');
    
    // 画面遷移
    router.back();
  } catch (error) {
    console.error('Save error:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    Alert.alert('エラー', `保存に失敗しました: ${message}`);
  }
};
```

---

## パフォーマンス最適化

### 1. リスト表示

```typescript
// ✅ FlatList使用
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
/>

// ❌ ScrollView + map()
<ScrollView>
  {items.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
</ScrollView>
```

### 2. 計算結果のメモ化

```typescript
// ✅ useMemo使用
const totalCalories = useMemo(() => {
  return dietLogs.reduce((sum, log) => sum + log.calories, 0);
}, [dietLogs]);

// ❌ 毎回計算
const totalCalories = dietLogs.reduce((sum, log) => sum + log.calories, 0);
```

### 3. 画像キャッシング

```typescript
// Expo Image は自動キャッシング
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  cachePolicy="memory-disk"
/>
```

---

## テスト戦略

### ユニットテスト

```typescript
import { describe, it, expect } from 'vitest';
import { calculateBMI, calculateCalories } from '@/lib/utils';

describe('Fitness calculations', () => {
  it('should calculate BMI correctly', () => {
    expect(calculateBMI(70, 1.75)).toBeCloseTo(22.86, 1);
  });

  it('should calculate daily calories', () => {
    const calories = calculateCalories({
      weight: 70,
      height: 175,
      age: 30,
      gender: 'male',
      activityLevel: 'moderate'
    });
    expect(calories).toBeGreaterThan(2000);
    expect(calories).toBeLessThan(3000);
  });
});
```

### インテグレーションテスト

```typescript
// AsyncStorage操作のテスト
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Storage operations', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('should save and retrieve workout logs', async () => {
    const log = { id: '1', exercise: 'Bench Press', weight: 100 };
    await AsyncStorage.setItem('workoutLogs', JSON.stringify([log]));
    
    const retrieved = JSON.parse(await AsyncStorage.getItem('workoutLogs'));
    expect(retrieved[0]).toEqual(log);
  });
});
```

---

## セキュリティ考慮事項

### 1. 機密情報の保存

```typescript
// ✅ 暗号化キー保存
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('apiKey', secretKey);
const key = await SecureStore.getItemAsync('apiKey');

// ❌ AsyncStorageに保存（平文）
await AsyncStorage.setItem('apiKey', secretKey); // 危険！
```

### 2. 入力検証

```typescript
// ✅ バリデーション
const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// ❌ 検証なし
const email = userInput; // 危険！
```

### 3. API通信

```typescript
// ✅ HTTPS + タイムアウト
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  timeout: 10000 // 10秒
});

// ❌ タイムアウトなし
const response = await fetch(url, { method: 'POST' });
```

---

## デバッグ方法

### コンソールログ

```typescript
// ✅ 構造化ログ
console.log('🚀 App started');
console.log('📊 Data:', { workoutLogs, dietLogs });
console.error('❌ Error:', error);

// ❌ 無意味なログ
console.log('ok');
console.log(data);
```

### React DevTools

```bash
# Web版デバッグ
# ブラウザの開発者ツール（F12）→ Console/Network
```

### Expo DevTools

```bash
# Metro Bundler起動時に表示
# 'i' キー: iOS Simulator
# 'a' キー: Android Emulator
# 'w' キー: Web
# 'r' キー: リロード
# 'm' キー: メニュー
```

---

## 拡張性の考慮

### 新機能追加時のチェックリスト

- [ ] データ型を `lib/` に定義
- [ ] AsyncStorageキーを追加
- [ ] 新しい画面を `app/` に作成
- [ ] ナビゲーション設定を更新
- [ ] テストを作成
- [ ] `design.md` を更新
- [ ] `todo.md` に記録

### 例: 新しい記録タイプ追加

```typescript
// 1. 型定義 (lib/types.ts)
interface SleepLog {
  date: string;
  duration: number; // 時間
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

// 2. ストレージ操作 (lib/storage.ts)
export const saveSleepLog = async (log: SleepLog) => {
  const logs = await getSleepLogs();
  await AsyncStorage.setItem('sleepLogs', JSON.stringify([...logs, log]));
};

// 3. 画面作成 (app/sleep-log.tsx)
export default function SleepLogScreen() {
  // 実装
}

// 4. ナビゲーション追加 (app/(tabs)/_layout.tsx)
<Tabs.Screen name="sleep" options={{ title: 'Sleep' }} />
```

---

## まとめ

AllFitは以下の原則で設計されています：

1. **シンプル** - 複雑な状態管理を避ける
2. **オフライン優先** - ネットワーク依存なし
3. **ユーザーフレンドリー** - 直感的なUI/UX
4. **拡張可能** - 新機能追加が容易
5. **保守性** - コード品質を重視

これらの原則を守ることで、長期的に安定した開発が可能です。
