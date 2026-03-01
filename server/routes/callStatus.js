/**
 * 通話ステータスコールバックルート（POST /api/call-status）
 *
 * Twilioから通話ステータスの変更通知を受け取る。
 * ステータス: initiated → ringing → answered → completed
 * 受信したステータスをcallStateに反映し、フロントエンドにWebSocket配信する。
 */
import { Router } from 'express'
import { updateCallState } from '../services/callState.js'
import { broadcastToClients } from '../services/clientWs.js'

const router = Router()

router.post('/call-status', (req, res) => {
  const { CallSid, CallStatus } = req.body

  if (CallSid && CallStatus) {
    // メモリ内の通話状態を更新
    updateCallState(CallSid, { status: CallStatus })

    // フロントエンドにステータス変更を通知
    broadcastToClients({
      type: 'call-status',
      callSid: CallSid,
      status: CallStatus,
    })
  }

  res.sendStatus(200)
})

export default router
