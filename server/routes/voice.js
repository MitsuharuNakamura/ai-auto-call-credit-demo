/**
 * TwiML応答ルート（POST /voice/outbound）
 *
 * 相手が応答したときにTwilioから呼ばれる。
 * ConversationRelayを起動するTwiMLを返す。
 *
 * 生成されるTwiML:
 * <Response>
 *   <Connect>
 *     <ConversationRelay url="wss://..." voice="ja-JP-Standard-B" ... />
 *   </Connect>
 * </Response>
 */
import { Router } from 'express'
import twilio from 'twilio'

const router = Router()

router.post('/outbound', (req, res) => {
  const customerName = req.query.customerName || ''
  const serverBaseUrl = process.env.SERVER_BASE_URL
  // WebSocketはwss://プロトコルを使用するためhttps://を除去
  const wsUrl = serverBaseUrl.replace('https://', '')

  const response = new twilio.twiml.VoiceResponse()
  const connect = response.connect()

  // ConversationRelayを起動:
  // - Google TTS/STTで日本語の音声認識・合成
  // - welcomeGreetingで最初の発話を設定
  // - interruptibleで顧客が割り込み可能
  connect.conversationRelay({
    url: `wss://${wsUrl}/conversation-relay`,
    voice: 'ja-JP-Chirp3-HD-Aoede',
    language: 'ja-JP',
    transcriptionProvider: 'google',
    ttsProvider: 'google',
    welcomeGreeting: `もしもし。こちらは、Twilioクレジットです。お時間よろしいでしょうか？`,
    interruptible: 'true',
  })

  res.type('text/xml')
  res.send(response.toString())
})

export default router
