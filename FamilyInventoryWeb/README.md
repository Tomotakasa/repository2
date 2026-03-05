# おうち在庫帳 Web版 🏠

iPhoneでそのまま使えるWebアプリ版。パソコン不要、ブラウザだけで動きます。

## 機能

| カテゴリ | 機能 |
|----------|------|
| 在庫管理 | カテゴリ別サマリー、子供別フィルタ、写真付きカード表示 |
| 登録 | 名前・サイズ・ブランド・数量・メモ、写真アップロード |
| AI入力 | 写真1枚で名前・カテゴリ・サイズを自動入力（OpenAI GPT-4o） |
| 共有 | **招待コード制**でグループに家族を招待・データをリアルタイム同期 |
| 設定 | 子供の追加/カラー設定、カテゴリのドラッグ並び替え |
| セキュリティ | Firebase Auth + Firestore Security Rules で完全保護 |

## セットアップ

### 1. Firebase プロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. 「プロジェクトを追加」
3. 以下を有効化:
   - **Authentication** → メール/パスワードを有効化
   - **Firestore Database** → 本番モードで作成
   - **Storage** → デフォルトバケットを作成

### 2. Webアプリを登録してAPIキーを取得

1. プロジェクト設定 → マイアプリ → ウェブ（`</>`）
2. アプリ名を入力して「アプリを登録」
3. 表示される `firebaseConfig` の値をコピー

### 3. 環境変数を設定

```bash
cp .env.example .env
# .env を開いて各値を埋める
```

### 4. セキュリティルールをデプロイ

```bash
npm install -g firebase-tools
firebase login
firebase use --add  # プロジェクトを選択
firebase deploy --only firestore:rules,storage
```

### 5. 開発サーバーを起動

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 6. 本番公開（Firebase Hosting）

```bash
npm run build
firebase deploy --only hosting
```

---

## 招待・共有の仕組み

```
管理者（グループ作成者）
  └─ 設定 → メンバーを招待 → 招待コードを作成 → コードをLINEなどで送る

招待された人
  └─ アプリにサインアップ → グループに参加 → 招待コードを入力 → データを共有！
```

- 招待コードは72時間有効（設定で変更可）
- 使用回数制限なし（設定で変更可）
- 招待された人もさらに他の人を招待できる
- 招待なしで自分だけのグループも作れる（プライベート管理）

---

## カメラAI自動入力のセットアップ

写真1枚でアイテム名・カテゴリ・サイズ・ブランドを自動入力する機能です。

### OpenAI APIキーの取得手順

1. **アカウント作成**
   - [https://platform.openai.com/signup](https://platform.openai.com/signup) にアクセス
   - メールアドレスでサインアップ

2. **APIキーを発行**
   - [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) にアクセス
   - 「+ Create new secret key」をクリック
   - `sk-...` で始まるキーをコピー（**この画面を閉じると二度と見れないので必ず保存！**）

3. **クレジットを追加**（必須）
   - [https://platform.openai.com/settings/billing](https://platform.openai.com/settings/billing)
   - 最低$5程度チャージ
   - 1回の画像解析コスト：約$0.002（50回で$0.10）

4. **アプリに登録**
   - アプリ → 設定 → 「カメラAI設定」
   - APIキーを貼り付けて「保存」

### セキュリティについて

- APIキーはあなたのFirestoreアカウント（`users/{あなたのUID}`）に保存されます
- Firestore Security Rulesにより、**あなた以外はキーを読み取れません**
- キーを使ったAPI呼び出しはあなたのブラウザから直接OpenAIに送られます
- 課金はあなたのOpenAIアカウントに発生します（他のユーザーのキーは使われません）

---

## セキュリティ設計

### Firebase API Key について

`.env` の `VITE_FIREBASE_API_KEY` はブラウザに公開されますが、**これは仕様**です。

- Firebase の API キーはアクセス制御に使われず、プロジェクトの識別子として機能
- 実際のアクセス制御は `firestore.rules` と `storage.rules` で行われる
- 詳細: [Firebase公式ドキュメント](https://firebase.google.com/docs/projects/api-keys)

### Firestore Security Rules の概要

```
users/{uid}
  → 本人のみ読み書き可（openaiApiKeyを他者から保護）

groups/{groupId}
  → メンバーのみ読み取り可
  → admins/ownerのみグループ設定を変更可
  → ownerのみ削除可

groups/{groupId}/items/{itemId}
  → メンバー全員が作成・読み取り・更新・削除可

inviteCodes/{code}
  → 認証済みユーザー全員が読み取り可（参加のため）
  → グループメンバーが作成可
  → usedCountのインクリメントのみ許可（改ざん防止）
```

---

## 技術スタック

| 分類 | 技術 |
|------|------|
| フロント | React 18 + Vite + TypeScript |
| スタイル | Tailwind CSS |
| 認証 | Firebase Authentication |
| DB | Cloud Firestore（リアルタイム同期） |
| ストレージ | Firebase Storage（写真） |
| DnD | @dnd-kit/sortable |
| AI | OpenAI GPT-4o Vision（ユーザー自身のキー） |
| ホスティング | Firebase Hosting |
