# AllFit - プロジェクト引き継ぎドキュメント

## プロジェクト概要

**プロジェクト名:** AllFit（オールフィット）  
**説明:** フィットネストレーニング・栄養管理モバイルアプリ  
**プラットフォーム:** iOS / Android / Web（React Native + Expo）  
**開発言語:** TypeScript / React Native  
**データ保存:** ローカル（AsyncStorage）- オフライン完全対応

---

## 主要機能

### 1. トレーニング記録
- 種目選択（プリセット・カスタム）
- セット・重量・回数の記録
- インターバルタイマー自動起動
- 1RM自動計算
- 自己ベスト更新時のエフェクト表示

### 2. 栄養管理
- 自然言語入力によるLLM連携（バーコード読み込み対応）
- プリセット食事（「特」「べーす」「べべき」「さわおに」）
- マイ食品機能（ユーザー独自の食品登録）
- PFC（タンパク質・脂質・炭水化物）の自動計算

### 3. 身体記録
- 身長・体重・体脂肪率・年齢の記録
- 月間カレンダー表示
- 性別・活動レベルの設定

### 4. ジオフェンシング（実機のみ）
- ジム位置情報の登録
- 自動チェックイン・チェックアウト
- チェックイン履歴の表示

### 5. 設定機能
- テーマ設定（ライト・ダークモード）
- プリセット食事のリセット機能
- インターバルタイマーのデフォルト秒数設定

---

## プロジェクト構成

```
omnitrack-fitness/
├── app/                           # Expo Router画面
│   ├── (tabs)/                   # タブバー画面
│   │   ├── index.tsx             # ホーム画面
│   │   ├── diet.tsx              # 食事記録画面
│   │   ├── records.tsx           # 身体記録画面
│   │   ├── stats.tsx             # 統計画面
│   │   └── _layout.tsx           # タブレイアウト
│   ├── barcode-scanner.tsx       # バーコード読み込み
│   ├── geofencing-settings.tsx   # ジオフェンシング設定
│   ├── user-settings.tsx         # ユーザー設定
│   ├── workout-session.tsx       # トレーニング記録
│   ├── _layout.tsx               # ルートレイアウト
│   └── oauth/                    # OAuth認証
├── components/                    # 再利用可能なコンポーネント
│   ├── screen-container.tsx      # SafeArea対応コンテナ
│   ├── themed-view.tsx           # テーマ対応View
│   └── ui/                       # UI要素
│       └── icon-symbol.tsx       # アイコンマッピング
├── hooks/                         # カスタムフック
│   ├── use-colors.ts             # テーマカラー
│   ├── use-color-scheme.ts       # ダークモード検出
│   └── use-auth.ts               # 認証状態
├── lib/                           # ユーティリティ
│   ├── storage.ts                # AsyncStorage操作
│   ├── food-storage.ts           # 食品データ保存
│   ├── geofencing-storage.ts     # ジオフェンシング設定
│   ├── utils.ts                  # ヘルパー関数
│   ├── trpc.ts                   # tRPCクライアント
│   └── theme-provider.tsx        # テーマプロバイダー
├── constants/                     # 定数
│   └── theme.ts                  # テーマ定義
├── server/                        # バックエンド（オプション）
│   ├── _core/
│   │   └── index.ts              # サーバーエントリー
│   └── routers/                  # tRPCルーター
├── assets/                        # 画像・アイコン
│   └── images/
│       ├── icon.png              # アプリアイコン
│       ├── splash-icon.png       # スプラッシュ画面
│       └── android-icon-*.png    # Android適応アイコン
├── app.config.ts                 # Expo設定
├── tailwind.config.js            # Tailwind CSS設定
├── theme.config.js               # テーマトークン
├── package.json                  # 依存関係
├── tsconfig.json                 # TypeScript設定
├── design.md                      # UI/UX設計書
└── todo.md                        # 開発進捗
```

---

## 技術スタック

| 領域 | 技術 | バージョン |
|------|------|-----------|
| **フレームワーク** | React Native | 0.81.5 |
| **ランタイム** | Expo | 54.0.29 |
| **ルーティング** | Expo Router | 6.0.19 |
| **スタイリング** | NativeWind (Tailwind CSS) | 4.2.1 |
| **言語** | TypeScript | 5.9.3 |
| **状態管理** | React Context + AsyncStorage | - |
| **API通信** | tRPC + TanStack Query | 11.7.2 / 5.90.12 |
| **データベース** | Drizzle ORM + MySQL | 0.44.7 / 3.16.0 |
| **テスト** | Vitest | 2.1.9 |
| **パッケージマネージャー** | pnpm | 9.12.0 |

---

## 主要ライブラリ

### UI・UX
- `expo-haptics`: ハプティックフィードバック
- `react-native-reanimated`: アニメーション
- `victory-native`: グラフ表示

### 機能
- `expo-camera`: バーコード読み込み
- `expo-location`: GPS・ジオフェンシング
- `expo-audio`: 音声再生
- `expo-task-manager`: バックグラウンドタスク

### ストレージ
- `@react-native-async-storage/async-storage`: ローカルデータ保存
- `expo-secure-store`: 暗号化キー保存

---

## セットアップ手順

### 1. 環境構築

```bash
# リポジトリのクローン
git clone <repository-url>
cd omnitrack-fitness

# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

### 2. 開発サーバーの起動

```bash
# Web環境での開発
pnpm dev:metro

# または個別に起動
pnpm dev:server      # バックエンド（ポート3000）
pnpm dev:metro       # フロントエンド（ポート8081）
```

### 3. 実機でのテスト

```bash
# iOS Simulator
pnpm ios

# Android Emulator
pnpm android

# Expo Go（QRコード表示）
pnpm qr
```

### 4. ビルド

```bash
# Web版ビルド
pnpm build

# APK/AAB生成（EAS Build使用）
eas build --platform android
eas build --platform ios
```

---

## データ保存仕様

### ローカルストレージキー

| キー | 内容 | 型 |
|------|------|-----|
| `workoutLogs` | トレーニング記録 | JSON配列 |
| `dietLogs` | 食事記録 | JSON配列 |
| `bodyRecords` | 身体記録 | JSON配列 |
| `userSettings` | ユーザー設定 | JSON |
| `presetMeals` | プリセット食事 | JSON配列 |
| `myFoods` | マイ食品 | JSON配列 |
| `gymLocation` | ジム位置情報 | JSON |
| `checkInHistory` | チェックイン履歴 | JSON配列 |

### データ型定義

```typescript
// トレーニング記録
interface WorkoutLog {
  id: string;
  date: string;
  exerciseName: string;
  sets: Array<{
    weight: number;
    reps: number;
    completed: boolean;
  }>;
}

// 食事記録
interface DietLog {
  id: string;
  date: string;
  meal: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

// 身体記録
interface BodyRecord {
  date: string;
  height: number;
  weight: number;
  bodyFat: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: string;
}
```

---

## 外部API連携

### 1. Open Food Facts API
- **用途:** バーコード読み込みによる商品情報取得
- **エンドポイント:** `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
- **フォールバック:** LLM連携で商品情報を推定

### 2. LLM API（Manus内蔵）
- **用途:** 自然言語入力の解析、バーコード情報補完
- **実装:** `server/routers/food.ts`の`estimateProductFromBarcode`エンドポイント

---

## 開発ガイドライン

### コード規約

```typescript
// ✅ 推奨
const handlePress = async () => {
  try {
    await saveData();
    showSuccessMessage();
  } catch (error) {
    console.error('Error:', error);
    showErrorMessage();
  }
};

// ❌ 非推奨
const handlePress = () => {
  saveData().then(() => {
    showSuccessMessage();
  });
};
```

### スタイリング

```typescript
// ✅ Tailwind CSS使用
<View className="flex-1 items-center justify-center p-4 bg-background">
  <Text className="text-2xl font-bold text-foreground">Hello</Text>
</View>

// ❌ インラインスタイル
<View style={{ flex: 1, alignItems: 'center', backgroundColor: '#fff' }}>
  <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Hello</Text>
</View>
```

### コンポーネント設計

```typescript
// ✅ ScreenContainer使用
export default function MyScreen() {
  return (
    <ScreenContainer className="p-4">
      {/* コンテンツ */}
    </ScreenContainer>
  );
}

// ❌ SafeAreaView直接使用
export default function MyScreen() {
  return (
    <SafeAreaView>
      {/* コンテンツ */}
    </SafeAreaView>
  );
}
```

### 状態管理

```typescript
// ✅ AsyncStorage + useState
const [data, setData] = useState([]);
useEffect(() => {
  loadData();
}, []);

const saveData = async () => {
  await AsyncStorage.setItem('key', JSON.stringify(data));
};

// ❌ グローバル状態管理（不要）
// Redux、Zustandなどは使用しない
```

---

## テスト

### テスト実行

```bash
# 全テスト実行
pnpm test

# ウォッチモード
pnpm test --watch

# カバレッジ表示
pnpm test --coverage
```

### テスト例

```typescript
import { describe, it, expect } from 'vitest';
import { calculateBMI } from '@/lib/utils';

describe('calculateBMI', () => {
  it('should calculate BMI correctly', () => {
    const bmi = calculateBMI(70, 1.75); // 70kg, 175cm
    expect(bmi).toBeCloseTo(22.86, 2);
  });
});
```

---

## 既知の問題と制限

### 1. ジオフェンシング
- **制限:** Web環境では動作しない（ネイティブAPIのみ）
- **対応:** 実機またはExpo Goアプリでのみ利用可能
- **Android:** 新しいAPKビルドが必要（位置情報権限追加済み）

### 2. プッシュ通知
- **制限:** Expo Go（SDK 53以降）では利用不可
- **対応:** Development Buildまたはカスタムビルドが必要

### 3. TypeScriptエラー
- **現象:** `Property 'bodyPart' does not exist on type 'WorkoutLog'`
- **原因:** 型定義の不整合
- **対応:** 型定義ファイルを確認・修正

---

## デプロイメント

### Web版デプロイ

```bash
# ビルド
pnpm build

# 出力ファイル: dist/
# Vercel、Netlify等にデプロイ可能
```

### モバイル版デプロイ

```bash
# EAS Build設定確認
cat eas.json

# ビルド
eas build --platform android
eas build --platform ios

# 出力: APK / AAB / IPA
```

### Google Play Store提出

1. Google Play Developer Accountの登録
2. アプリ署名キーの生成
3. AABファイルのアップロード
4. ストア情報の入力
5. 審査申請

---

## トラブルシューティング

### 問題: Metro Bundlerが起動しない

```bash
# キャッシュクリア
rm -rf node_modules/.cache
pnpm install

# ポート競合確認
lsof -i :8081
```

### 問題: AsyncStorageのデータが消える

```typescript
// デバッグ用コード
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  console.log('Stored keys:', keys);
  
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    console.log(`${key}:`, value);
  }
};
```

### 問題: バーコード読み込みが動作しない

```typescript
// 権限確認
import * as Permissions from 'expo-permissions';

const checkCameraPermission = async () => {
  const { status } = await Permissions.askAsync(Permissions.CAMERA);
  console.log('Camera permission:', status);
};
```

---

## 今後の拡張案

### Phase 2
- [ ] クラウドバックアップ機能
- [ ] 複数デバイス間のデータ同期
- [ ] トレーニング仲間との共有機能
- [ ] 詳細な統計・分析画面

### Phase 3
- [ ] AI による個別トレーニングプラン生成
- [ ] 栄養管理の最適化提案
- [ ] ウェアラブルデバイス連携
- [ ] SNS連携（記録共有）

---

## サポート・連絡先

**開発チーム:** Manus  
**プロジェクトリポジトリ:** `<repository-url>`  
**ドキュメント:** このファイル + `design.md` + `todo.md`

---

## ライセンス

[ライセンス情報を記入]

---

## 更新履歴

| 日付 | 更新内容 |
|------|---------|
| 2026-02-18 | 初版作成・引き継ぎドキュメント完成 |

