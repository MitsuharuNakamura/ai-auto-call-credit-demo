/**
 * フロントエンド向けWebSocketサービス
 *
 * /ws エンドポイントでフロントエンドと接続し、
 * 通話ステータス変更や文字起こしデータをリアルタイム配信する。
 *
 * 送信イベント:
 * - { type: "call-status", callSid, status }
 * - { type: "transcript", callSid, speaker, text, timestamp }
 */
import { WebSocketServer } from 'ws'

/** @type {WebSocketServer|null} */
let wss = null

/** WebSocketサーバーを初期化する（noServerモード） */
export function setupClientWebSocket(server) {
  wss = new WebSocketServer({ noServer: true })

  wss.on('connection', (ws) => {
    ws.on('error', (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      process.stderr.write(`Client WS error: ${errorMessage}\n`)
    })
  })

  return wss
}

/** WebSocketサーバーインスタンスを取得する */
export function getClientWss() {
  return wss
}

/** 接続中の全クライアントにメッセージを一斉送信する */
export function broadcastToClients(message) {
  if (!wss) {
    return
  }

  const data = JSON.stringify(message)
  for (const client of wss.clients) {
    // readyState === 1 は OPEN 状態
    if (client.readyState === 1) {
      client.send(data)
    }
  }
}
