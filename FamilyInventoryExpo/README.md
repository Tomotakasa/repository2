# おうち在庫帳 🏠

家族で使える子供用品・家庭用品の在庫管理アプリ（React Native + Expo）

## 機能

### メイン・在庫管理
- **カテゴリ別サマリー**: オムツ、トップスなどのカテゴリごとに在庫数を自動集計
- **子供別クイックフィルタ**: タブ切り替えで特定の子の持ち物を即時絞り込み
- **詳細フィルタリング**: サイズ・ブランド・持ち主の組み合わせ絞り込み
- **写真付き在庫リスト**: カード形式で画像付き表示

### 登録・編集
- **かんたん登録**: 名前・サイズ・ブランド・数・メモを1画面で入力
- **写真アップロード**: カメラ撮影 or 写真フォルダから直接選択
- **ローカル保存**: 写真はデバイス内に安全保存
- **ID方式のデータ管理**: カテゴリ名変更後もデータの紐付けが壊れない

### 設定・ビジュアル
- **子供別カラーコーディング**: 各子供に色を設定、カード背景に反映
- **カテゴリ並び替え**: ≡アイコンを長押しドラッグ&ドロップ
- **カラーパレット選択**: ビジュアルなカラーピッカー
- **子供・カテゴリの追加/削除**: ボタン一つで完結

### 家族共有（Google不要！）
- **JSONエクスポート**: データをファイルとして書き出し
- **ネイティブ共有**: LINE・メール・AirDropなどで家族に送信
- **JSONインポート**: 受け取ったファイルを読み込み

## セットアップ

```bash
cd FamilyInventoryExpo
npm install
npx expo start
```

Expo Go アプリ（iOS/Android）でQRコードをスキャンして実行できます。

## 技術スタック

| 分類 | 技術 |
|------|------|
| フレームワーク | React Native + Expo SDK 51 |
| 言語 | TypeScript |
| 状態管理 | React Context + AsyncStorage |
| ナビゲーション | React Navigation (Native Stack) |
| 画像処理 | expo-image-picker + expo-file-system |
| ドラッグ&ドロップ | react-native-draggable-flatlist |
| 共有 | expo-sharing + expo-document-picker |
| UI | expo-linear-gradient + @expo/vector-icons |

## データ構造

```typescript
// データはすべてデバイスのAsyncStorageに保存
AppData {
  familyName: string         // 家族名
  children: Child[]          // 子供プロフィール（名前・色・絵文字）
  categories: Category[]     // カテゴリ（IDで管理）
  items: InventoryItem[]     // アイテム（画像URI・各種属性）
}
```

## ディレクトリ構成

```
src/
├── types/          型定義
├── utils/          ユーティリティ（storage, helpers, defaultData）
├── contexts/       AppContext（グローバル状態管理）
├── navigation/     ナビゲーション設定
├── screens/        各画面
│   ├── HomeScreen            メイン画面
│   ├── CategoryDetailScreen  カテゴリ詳細
│   ├── AddEditItemScreen     アイテム追加/編集
│   └── SettingsScreen        設定画面
└── components/     再利用コンポーネント
    ├── ChildFilterTabs       子供フィルタータブ
    ├── CategoryCard          カテゴリカード
    ├── ItemCard              アイテムカード
    └── ColorPickerModal      カラーピッカー
```
