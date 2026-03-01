/**
 * 架電APIルート（POST /api/call）
 *
 * フロントエンドからのリクエストを受けてTwilio APIで発信する。
 * 通話状態をcallStateに保存し、callSidをレスポンスで返す。
 */
import { Router } from 'express'
import twilio from 'twilio'
import { setCallState } from '../services/callState.js'

const router = Router()

router.post('/call', async (req, res) => {
  const { phoneNumber, customerName } = req.body

  // バリデーション: 必須パラメータの確認
  if (!phoneNumber || !customerName) {
    return res.status(400).json({
      success: false,
      error: '電話番号と顧客名は必須です',
    })
  }

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
    const serverBaseUrl = process.env.SERVER_BASE_URL

    // Twilio APIで発信する
    // 相手が応答したら /voice/outbound のTwiMLでConversationRelayを起動
    const call = await client.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
      url: `${serverBaseUrl}/voice/outbound?customerName=${encodeURIComponent(customerName)}`,
      statusCallback: `${serverBaseUrl}/api/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    })

    // 通話状態をメモリに保存（ConversationRelayで顧客名を参照するため）
    setCallState(call.sid, {
      customerName,
      phoneNumber,
      status: 'initiated',
    })

    return res.json({
      success: true,
      data: { callSid: call.sid },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({
      success: false,
      error: `架電に失敗しました: ${errorMessage}`,
    })
  }
})

export default router
