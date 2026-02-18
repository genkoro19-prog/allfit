# AllFit - 環境変数設定ガイド

## 環境変数について

AllFitはローカル開発・本番環境の両方で動作します。環境変数は最小限に設定されています。

---

## 必須環境変数

現在、AllFitは**外部API キーを必要としません**。すべての機能がローカルで動作します。

### 理由

- **バーコード読み込み**: Open Food Facts API（認証不要）
- **LLM連携**: Manus内蔵API（自動認証）
- **データ保存**: AsyncStorage（ローカル）
- **ジオフェンシング**: ネイティブAPI（認証不要）

---

## オプション環境変数

### 開発環境

```bash
# Metro Bundlerポート（デフォルト: 8081）
EXPO_PORT=8081

# ノード環境
NODE_ENV=development

# ログレベル
LOG_LEVEL=info
```

### ビルド環境

```bash
# EAS Build設定
EAS_BUILD_PROFILE=development  # または production

# Android署名キー（Google Play提出時）
ANDROID_KEYSTORE_PASSWORD=<your-password>
ANDROID_KEY_ALIAS=<your-alias>
```

---

## セットアップ手順

### 1. リポジトリクローン

```bash
git clone <repository-url>
cd omnitrack-fitness
```

### 2. 依存関係インストール

```bash
pnpm install
```

### 3. 開発サーバー起動

```bash
# 環境変数は不要 - そのまま起動可能
pnpm dev
```

### 4. ビルド（オプション）

```bash
# Web版
pnpm build

# Android APK
eas build --platform android

# iOS IPA
eas build --platform ios
```

---

## 外部API設定（今後の拡張用）

### Open Food Facts API

```typescript
// app/barcode-scanner.tsx で自動使用
const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
const response = await fetch(url);
```

**特徴:**
- 認証不要
- 無料
- 世界中の商品データベース

### Manus LLM API

```typescript
// server/routers/food.ts で自動使用
const response = await llmClient.chat({
  messages: [{ role: 'user', content: userInput }]
});
```

**特徴:**
- Manus内蔵（自動認証）
- API キー不要
- 自然言語処理

---

## トラブルシューティング

### Q: ポート8081が使用中

```bash
# 別ポートで起動
EXPO_PORT=8082 pnpm dev

# または既存プロセスを終了
lsof -i :8081
kill -9 <PID>
```

### Q: バーコード読み込みが動作しない

```bash
# カメラ権限を確認
# iOS: Settings → AllFit → Camera
# Android: Settings → Apps → AllFit → Permissions → Camera
```

### Q: ジオフェンシングが動作しない

```bash
# 位置情報権限を確認
# iOS: Settings → AllFit → Location → Always
# Android: Settings → Apps → AllFit → Permissions → Location
```

---

## 本番環境への展開

### Google Play Store

1. **Google Play Developer Accountの登録**
   - https://play.google.com/console

2. **APK/AABの生成**
   ```bash
   eas build --platform android --profile production
   ```

3. **署名キーの管理**
   ```bash
   # キーストア作成（初回のみ）
   keytool -genkey -v -keystore my-release-key.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias my-key-alias
   ```

4. **ストア情報の入力**
   - アプリ説明
   - スクリーンショット
   - プライバシーポリシー
   - コンテンツレーティング

5. **審査申請**
   - 通常2-3時間で審査完了

### Apple App Store

1. **Apple Developer Programの登録**
   - https://developer.apple.com/programs/

2. **IPA の生成**
   ```bash
   eas build --platform ios --profile production
   ```

3. **App Store Connectでの登録**
   - https://appstoreconnect.apple.com/

4. **審査申請**
   - 通常1-2日で審査完了

---

## セキュリティベストプラクティス

### 1. 認証情報の保護

```typescript
// ❌ 危険: ハードコード
const API_KEY = 'sk-1234567890';

// ✅ 安全: 環境変数
const API_KEY = process.env.API_KEY;

// ✅ より安全: SecureStore
import * as SecureStore from 'expo-secure-store';
const API_KEY = await SecureStore.getItemAsync('API_KEY');
```

### 2. API通信

```typescript
// ✅ HTTPS + タイムアウト
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  timeout: 10000
});

// ✅ エラーハンドリング
if (!response.ok) {
  throw new Error(`API error: ${response.status}`);
}
```

### 3. データ保護

```typescript
// ✅ AsyncStorage + 暗号化
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// 機密情報は SecureStore
await SecureStore.setItemAsync('apiKey', key);

// 通常データは AsyncStorage
await AsyncStorage.setItem('workoutLogs', JSON.stringify(logs));
```

---

## 環境別設定

### 開発環境

```bash
NODE_ENV=development
LOG_LEVEL=debug
EXPO_PORT=8081
```

### ステージング環境

```bash
NODE_ENV=staging
LOG_LEVEL=info
EXPO_PORT=8081
```

### 本番環境

```bash
NODE_ENV=production
LOG_LEVEL=warn
EXPO_PORT=8081
```

---

## 参考リンク

- [Expo Environment Variables](https://docs.expo.dev/build-reference/variables/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Security](https://reactnative.dev/docs/security)
- [Open Food Facts API](https://world.openfoodfacts.org/api)

---

## サポート

環境変数に関する問題は、`HANDOVER.md` のトラブルシューティングセクションを参照してください。
