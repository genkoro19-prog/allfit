# AllFit - クイックスタートガイド

## 5分でスタート

### 1. 環境セットアップ（2分）

```bash
# リポジトリクローン
git clone <repository-url>
cd omnitrack-fitness

# 依存関係インストール
pnpm install

# 環境変数設定
cp .env.example .env
```

### 2. 開発サーバー起動（1分）

```bash
# 全サービス起動
pnpm dev

# または個別起動
pnpm dev:metro    # フロントエンド（ポート8081）
pnpm dev:server   # バックエンド（ポート3000）
```

### 3. ブラウザで確認（2分）

- **Web版:** http://localhost:8081
- **実機テスト:** `pnpm qr` でQRコード表示 → Expo Goで読み込み

---

## ディレクトリ構成（重要ファイルのみ）

```
app/
├── (tabs)/
│   ├── index.tsx          ← ホーム画面
│   ├── diet.tsx           ← 食事記録
│   ├── records.tsx        ← 身体記録
│   └── stats.tsx          ← 統計
├── workout-session.tsx    ← トレーニング記録
├── barcode-scanner.tsx    ← バーコード読み込み
└── geofencing-settings.tsx ← ジオフェンシング

lib/
├── storage.ts             ← データ保存
├── food-storage.ts        ← 食品データ
└── geofencing-storage.ts  ← ジオフェンシング設定

design.md                 ← UI/UX設計書
HANDOVER.md              ← 詳細ドキュメント
```

---

## よく使うコマンド

```bash
# 開発
pnpm dev                  # 全サービス起動
pnpm dev:metro           # フロントエンドのみ
pnpm lint                # コード検査
pnpm format              # コード整形

# テスト
pnpm test                # テスト実行
pnpm check               # TypeScript型チェック

# ビルド
pnpm build               # Web版ビルド
eas build --platform android  # Android APK
eas build --platform ios      # iOS IPA
```

---

## 主要機能の実装場所

| 機能 | ファイル |
|------|---------|
| トレーニング記録 | `app/workout-session.tsx` |
| 食事記録 | `app/(tabs)/diet.tsx` |
| バーコード読み込み | `app/barcode-scanner.tsx` |
| ジオフェンシング | `app/geofencing-settings.tsx` |
| データ保存 | `lib/storage.ts` |
| テーマ設定 | `lib/theme-provider.tsx` |

---

## データ保存の仕組み

**すべてローカル保存（AsyncStorage）**

```typescript
// 保存
await AsyncStorage.setItem('key', JSON.stringify(data));

// 読み込み
const data = JSON.parse(await AsyncStorage.getItem('key') || '[]');
```

---

## トラブル対応

| 問題 | 解決策 |
|------|--------|
| ポート8081が使用中 | `lsof -i :8081` で確認、別ポート使用 |
| 依存関係エラー | `pnpm install` 再実行 |
| キャッシュ問題 | `rm -rf node_modules/.cache` |
| TypeScriptエラー | `pnpm check` で確認 |

---

## 次のステップ

1. **コードレビュー** - `HANDOVER.md`で全体構成確認
2. **ローカルテスト** - 各画面の動作確認
3. **機能追加** - `todo.md`で計画確認
4. **ビルド** - APK/IPA生成

---

## 重要な注意点

⚠️ **ジオフェンシング機能について**
- Web環境では動作しません
- 実機またはExpo Goアプリでのみ利用可能
- Androidの場合は新しいAPKビルドが必要

⚠️ **データについて**
- すべてローカル保存（オフライン完全対応）
- クラウド同期は実装されていません
- データ削除時の復元機能はありません

---

## サポート

詳細は `HANDOVER.md` を参照してください。
