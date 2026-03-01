/**
 * サーバーエントリポイント
 *
 * Express HTTPサーバーに2つのWebSocketサーバーをアタッチする:
 * - /conversation-relay: Twilio ConversationRelay用（AI対話処理）
 * - /ws: フロントエンド用（リアルタイム通知）
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { parse } from 'url'

import callRouter from './routes/call.js'
import voiceRouter from './routes/voice.js'
import callStatusRouter from './routes/callStatus.js'
import { handleConversationRelay } from './routes/conversationRelay.js'
import { setupClientWebSocket } from './services/clientWs.js'

const app = express()
const PORT = process.env.PORT || 3000

// ミドルウェア設定
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ルート登録
app.use('/api', callRouter)          // 架電API・ステータスコールバック
app.use('/api', callStatusRouter)
app.use('/voice', voiceRouter)       // TwiML応答

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const server = createServer(app)

// WebSocketサーバー初期化（noServerモードで手動ルーティング）
const conversationRelayWss = new WebSocketServer({ noServer: true })
const clientWss = setupClientWebSocket(server)

// ConversationRelay接続時のハンドラ登録
conversationRelayWss.on('connection', (ws) => {
  handleConversationRelay(ws)
})

// HTTP Upgradeリクエストをパスに応じて振り分け
server.on('upgrade', (request, socket, head) => {
  const { pathname } = parse(request.url || '', true)

  if (pathname === '/conversation-relay') {
    // Twilio ConversationRelayからのWebSocket接続
    conversationRelayWss.handleUpgrade(request, socket, head, (ws) => {
      conversationRelayWss.emit('connection', ws, request)
    })
    return
  }

  if (pathname === '/ws') {
    // フロントエンドからのWebSocket接続
    clientWss.handleUpgrade(request, socket, head, (ws) => {
      clientWss.emit('connection', ws, request)
    })
    return
  }

  // 未知のパスは接続を切断
  socket.destroy()
})

server.listen(PORT, () => {
  process.stdout.write(`Server running on port ${PORT}\n`)
})
