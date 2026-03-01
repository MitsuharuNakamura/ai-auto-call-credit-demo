/**
 * ConversationRelay WebSocketハンドラ（/conversation-relay）
 *
 * Twilio ConversationRelayからのWebSocket接続を処理する。
 * 顧客の発話（promptイベント）をOpenAI APIに送り、AI応答を返す。
 * 同時に文字起こしをTwilio Syncに保存し、フロントエンドにWebSocket配信する。
 *
 * イベントフロー:
 * 1. setup → callSid取得、会話初期化、Sync Document作成
 * 2. prompt → 顧客発話をOpenAIに送信 → AI応答を返却
 * 3. close → 会話履歴をクリア
 */
import { getCallState } from '../services/callState.js'
import { initConversation, getAIResponse, clearConversation } from '../services/openai.js'
import { createTranscriptDocument, appendTranscriptEntry } from '../services/sync.js'
import { broadcastToClients } from '../services/clientWs.js'
import { generateSystemPrompt } from '../utils/systemPrompt.js'

/** OpenAI APIエラー時のデフォルト応答 */
const DEFAULT_ERROR_RESPONSE = '申し訳ございません、少々お待ちください。'

/**
 * 文字起こしをSyncに保存し、フロントエンドにリアルタイム配信する
 * Sync保存は非同期で実行し、配信はブロックしない
 */
function saveAndBroadcast(callSid, speaker, text) {
  const timestamp = new Date().toISOString()
  const entry = { speaker, text, timestamp }

  // Sync保存（エラーがあってもフロントエンド配信は継続する）
  appendTranscriptEntry(callSid, entry).catch((error) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    process.stderr.write(`Sync append error: ${errorMessage}\n`)
  })

  // フロントエンドに文字起こしデータを配信
  broadcastToClients({
    type: 'transcript',
    callSid,
    speaker,
    text,
    timestamp,
  })
}

/** ConversationRelay WebSocket接続のハンドラ */
export function handleConversationRelay(ws) {
  let callSid = null

  ws.on('message', async (data) => {
    let message
    try {
      message = JSON.parse(data.toString())
    } catch {
      return
    }

    // --- setupイベント: 通話開始時の初期化 ---
    if (message.type === 'setup') {
      callSid = message.callSid
      const state = getCallState(callSid)
      const customerName = state?.customerName || ''

      // OpenAI会話履歴をシステムプロンプトで初期化
      const systemPrompt = generateSystemPrompt(customerName)
      initConversation(callSid, systemPrompt)

      // Twilio Syncに文字起こし用ドキュメントを作成
      try {
        await createTranscriptDocument(callSid)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        process.stderr.write(`Sync document creation error: ${errorMessage}\n`)
      }

      // welcomeGreetingの発話を文字起こしとして記録
      saveAndBroadcast(callSid, 'ai_agent', `Twilioクレジットです。${customerName}さまでよろしいですか？`)
      return
    }

    // --- promptイベント: 顧客の発話を受信 ---
    if (message.type === 'prompt') {
      const voiceInput = message.voicePrompt || ''

      if (!callSid) {
        ws.send(JSON.stringify({
          type: 'text',
          token: DEFAULT_ERROR_RESPONSE,
        }))
        return
      }

      // 顧客の発話を文字起こしとして記録
      saveAndBroadcast(callSid, 'customer', voiceInput)

      try {
        // OpenAI APIでAI応答を生成
        const aiResult = await getAIResponse(callSid, voiceInput)

        // ConversationRelayにAI応答を送信（TTSで読み上げられる）
        ws.send(JSON.stringify({
          type: 'text',
          token: aiResult.response,
        }))

        // AI応答を文字起こしとして記録
        saveAndBroadcast(callSid, 'ai_agent', aiResult.response)

        // 入金日確認完了の場合、少し待ってから通話を終了する
        if (aiResult.endCall) {
          setTimeout(() => {
            ws.send(JSON.stringify({ type: 'end' }))
          }, 500)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        process.stderr.write(`AI response error: ${errorMessage}\n`)

        // エラー時はデフォルトの応答を返す
        ws.send(JSON.stringify({
          type: 'text',
          token: DEFAULT_ERROR_RESPONSE,
        }))
        saveAndBroadcast(callSid, 'ai_agent', DEFAULT_ERROR_RESPONSE)
      }
      return
    }
  })

  // 接続切断時に会話履歴をクリア
  ws.on('close', () => {
    if (callSid) {
      clearConversation(callSid)
    }
  })

  ws.on('error', (error) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    process.stderr.write(`ConversationRelay WS error: ${errorMessage}\n`)
  })
}
