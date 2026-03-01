# AI支払い催促自動架電デモ

Twilio Programmable VoiceのConversationRelayとOpenAI APIを使った、AIによる自動架電デモアプリケーション。

## 機能

- 指定した電話番号にAIが自動架電
- リアルタイムでの音声認識・文字起こし
- AI応答の自動生成（GPT-4o-mini）
- Web GUIでの通話モニタリング

## 技術スタック

- **バックエンド**: Node.js (Express)
- **フロントエンド**: React (Vite)
- **音声通話**: Twilio Programmable Voice
- **AI対話**: Twilio ConversationRelay + OpenAI API
- **文字起こし**: ConversationRelay Transcription
- **リアルタイム同期**: Twilio Sync + WebSocket
- **スタイリング**: Tailwind CSS

## セットアップ

### 1. 依存関係のインストール

```bash
# バックエンド
npm install

# フロントエンド
cd client
npm install
cd ..
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の情報を設定：

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=     # 架電元のTwilio番号（E.164形式）
TWILIO_SYNC_SERVICE_SID= # Twilio SyncのService SID
OPENAI_API_KEY=
SERVER_BASE_URL=         # ngrokのURL（例: https://xxxx.ngrok.io）
```

### 3. ngrokの起動

開発時は ngrok でローカルサーバーを公開：

```bash
ngrok http 3000
```

ngrokのURLを `.env` の `SERVER_BASE_URL` に設定してください。

## 起動方法

```bash
# バックエンド起動（ポート3000）
npm start

# フロントエンド起動（別ターミナルで）
cd client
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてください。

## 使い方

1. Web画面で電話番号（E.164形式、例: +819012345678）と顧客名を入力
2. 「架電」ボタンをクリック
3. AIが自動で架電し、支払い催促の会話を開始
4. 通話内容がリアルタイムで文字起こしされ、画面に表示される

## ライセンス

MIT
