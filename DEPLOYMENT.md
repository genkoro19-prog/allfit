# AllFit - デプロイメントガイド

## デプロイメント概要

AllFitは以下のプラットフォームにデプロイ可能です：

| プラットフォーム | 方法 | 対象ユーザー |
|-----------------|------|------------|
| **Web** | Vercel / Netlify | 開発者・テスター |
| **iOS** | App Store | 一般ユーザー |
| **Android** | Google Play Store | 一般ユーザー |
| **Expo Go** | QRコード | テスター |

---

## 1. Web版デプロイ

### ローカルビルド

```bash
# ビルド
pnpm build

# 出力
dist/
├── index.html
├── _expo/
└── [その他の静的ファイル]
```

### Vercelへのデプロイ

```bash
# Vercel CLIのインストール
npm install -g vercel

# デプロイ
vercel

# 本番環境
vercel --prod
```

**Vercel設定:**
- **Build Command:** `pnpm build`
- **Output Directory:** `dist`
- **Install Command:** `pnpm install`

### Netlifyへのデプロイ

```bash
# Netlify CLIのインストール
npm install -g netlify-cli

# デプロイ
netlify deploy --prod --dir=dist
```

**netlify.toml設定:**
```toml
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22.13.0"
```

---

## 2. iOS版デプロイ

### 前提条件

- Apple Developer Account（年額$99）
- macOS + Xcode
- EAS CLI

### ステップ1: EAS設定

```bash
# EAS CLIのインストール
npm install -g eas-cli

# ログイン
eas login

# プロジェクト初期化
eas build:configure
```

### ステップ2: ビルド

```bash
# 開発用ビルド（テスト）
eas build --platform ios --profile development

# 本番用ビルド（App Store提出）
eas build --platform ios --profile production
```

### ステップ3: App Store Connect登録

1. **App Store Connectにログイン**
   - https://appstoreconnect.apple.com/

2. **新しいアプリを作成**
   - App Name: AllFit
   - Bundle ID: space.manus.omnitrack.fitness.t20260215100008
   - SKU: allfit-001

3. **アプリ情報を入力**
   - 説明
   - キーワード
   - サポートURL
   - プライバシーポリシーURL

4. **スクリーンショットをアップロード**
   - 5.5インチディスプレイ（6枚）
   - 6.5インチディスプレイ（6枚）

5. **IPA をアップロード**
   ```bash
   # EASからダウンロード
   eas build:list
   # IPA URLをコピー
   ```

6. **審査に提出**
   - 通常1-2日で審査完了

### ステップ4: リリース

```bash
# App Store Connectで承認後
# 自動リリースまたは手動リリース
```

---

## 3. Android版デプロイ

### 前提条件

- Google Play Developer Account（初回$25）
- Android Studio
- EAS CLI

### ステップ1: キーストア作成

```bash
# キーストア生成（初回のみ）
keytool -genkey -v -keystore my-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias

# パスワード設定
# 例: MySecurePassword123!
```

### ステップ2: EAS設定

```bash
# eas.json を編集
cat eas.json
```

**eas.json例:**
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### ステップ3: ビルド

```bash
# APK ビルド（テスト用）
eas build --platform android --profile development

# AAB ビルド（Google Play提出用）
eas build --platform android --profile production
```

### ステップ4: Google Play Console登録

1. **Google Play Consoleにログイン**
   - https://play.google.com/console/

2. **新しいアプリを作成**
   - アプリ名: AllFit
   - デフォルト言語: 日本語
   - アプリまたはゲーム: アプリ

3. **ストア情報を入力**
   - 短い説明（80文字以内）
   - 詳細説明（4000文字以内）
   - スクリーンショット（5-8枚）
   - プレビュー動画（オプション）

4. **コンテンツレーティングを設定**
   - アンケートに回答
   - 自動的にレーティング決定

5. **プライバシーポリシーを設定**
   - URLを入力
   - または「プライバシーポリシーなし」を選択

6. **AAB をアップロード**
   - Google Play Consoleの「テスト」→「内部テスト」
   - AAB ファイルをアップロード
   - テストユーザーを追加

7. **本番環境にロールアウト**
   - テスト完了後
   - 段階的ロールアウト（10% → 50% → 100%）

### ステップ5: 審査に提出

```bash
# Google Play Consoleで審査申請
# 通常2-3時間で審査完了
```

---

## 4. Expo Go でのテスト

### QRコード生成

```bash
# QRコード表示
pnpm qr

# または
npx expo start
# 'w' キーで Web
# 'a' キーで Android
# 'i' キーで iOS
```

### Expo Go アプリでスキャン

1. **Expo Go をインストール**
   - iOS: App Store
   - Android: Google Play Store

2. **QRコードをスキャン**
   - アプリ内のカメラでスキャン
   - 自動的にアプリが起動

3. **テスト実施**
   - 全機能を確認
   - バグレポート

---

## 5. ビルド設定

### app.config.ts

```typescript
// アプリ情報
const env = {
  appName: "AllFit",
  appSlug: "allfit",
  logoUrl: "https://...",
  scheme: "manus20260215100008",
  iosBundleId: "space.manus.omnitrack.fitness.t20260215100008",
  androidPackage: "space.manus.omnitrack.fitness.t20260215100008",
};

// iOS設定
ios: {
  bundleIdentifier: env.iosBundleId,
  supportsTablet: true,
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false
  }
}

// Android設定
android: {
  package: env.androidPackage,
  permissions: [
    "POST_NOTIFICATIONS",
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION",
    "ACCESS_BACKGROUND_LOCATION"
  ]
}
```

### eas.json

```json
{
  "build": {
    "development": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "buildType": "simulator"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "buildType": "archive"
      }
    }
  }
}
```

---

## 6. バージョン管理

### バージョン更新

```bash
# package.json のバージョン更新
# 例: 1.0.0 → 1.0.1

# app.config.ts も更新
version: "1.0.1"

# Git にコミット
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### セマンティックバージョニング

```
MAJOR.MINOR.PATCH
1.0.0

MAJOR: 互換性を破る変更
MINOR: 新機能（互換性あり）
PATCH: バグ修正
```

**例:**
- 1.0.0 → 1.1.0: 新機能追加
- 1.0.0 → 1.0.1: バグ修正
- 1.0.0 → 2.0.0: 大規模リファクタリング

---

## 7. デプロイメントチェックリスト

### リリース前

- [ ] すべてのテストが成功
- [ ] TypeScript型チェックエラーなし
- [ ] コード品質チェック完了（lint）
- [ ] バージョン番号を更新
- [ ] CHANGELOG を更新
- [ ] ドキュメント を更新

### iOS リリース

- [ ] Bundle ID が正しい
- [ ] アイコンが設定済み
- [ ] スプラッシュ画面が設定済み
- [ ] プライバシーポリシーが設定済み
- [ ] スクリーンショットがアップロード済み
- [ ] 説明・キーワードが入力済み

### Android リリース

- [ ] Package name が正しい
- [ ] アイコンが設定済み
- [ ] スクリーンショットがアップロード済み
- [ ] 説明・キーワードが入力済み
- [ ] プライバシーポリシーが設定済み
- [ ] コンテンツレーティングが設定済み

---

## 8. トラブルシューティング

### ビルド失敗

```bash
# キャッシュクリア
eas build:cache --platform android --clear
eas build:cache --platform ios --clear

# ログ確認
eas build:log
```

### App Store 審査拒否

**一般的な理由:**
1. クラッシュ
2. 機能が説明と異なる
3. プライバシーポリシーがない
4. 外部リンクが機能しない

**対応:**
- 詳細なレポートを確認
- 問題を修正
- 新しいビルドをアップロード
- 再度審査に提出

### Google Play 審査拒否

**一般的な理由:**
1. 位置情報権限の過度な使用
2. 広告の不適切な配置
3. プライバシーポリシーの不備

**対応:**
- デベロッパープログラムポリシーを確認
- 問題を修正
- 新しいAABをアップロード
- 再度審査に提出

---

## 9. 本番環境での監視

### エラー追跡

```typescript
// Sentry統合（推奨）
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: "https://...",
  enableInExpoDevelopment: true,
});
```

### アナリティクス

```typescript
// Google Analytics統合
import { Analytics } from "@react-native-google-analytics-bridge";

Analytics.setTrackerId("UA-XXXXXXXX-X");
Analytics.trackScreenView("Home");
```

### クラッシュレポート

```typescript
// エラーログ
console.error("Critical error:", error);

// ユーザーへの通知
Alert.alert("エラーが発生しました", "サポートに連絡してください");
```

---

## 10. リリース後の対応

### ユーザーフィードバック

1. **App Store / Google Play のレビューを監視**
2. **バグレポートに対応**
3. **ホットフィックスをリリース**

### アップデート計画

```
v1.0.0 (初版)
  ↓
v1.0.1 (バグ修正)
  ↓
v1.1.0 (新機能)
  ↓
v1.1.1 (バグ修正)
  ↓
v2.0.0 (大規模更新)
```

---

## 参考リンク

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Vercel Deployment](https://vercel.com/docs)
- [Netlify Deployment](https://docs.netlify.com/)

---

## サポート

デプロイメントに関する問題は、`HANDOVER.md` のトラブルシューティングセクションを参照してください。
