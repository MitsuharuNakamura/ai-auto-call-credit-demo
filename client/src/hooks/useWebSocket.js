/**
 * WebSocket接続カスタムフック
 *
 * バックエンドの /ws エンドポイントに接続し、
 * 通話ステータスと文字起こしデータをリアルタイムで受信する。
 * 切断時は自動再接続を行う。
 *
 * 受信イベント:
 * - call-status: 通話ステータスの変更
 * - transcript: 文字起こしデータ（話者・テキスト・タイムスタンプ）
 */
import { useState, useEffect, useRef, useCallback } from 'react'

/** 再接続までの待機時間（ミリ秒） */
const WS_RECONNECT_DELAY = 3000

export function useWebSocket() {
  const [callStatus, setCallStatus] = useState(null)
  const [transcripts, setTranscripts] = useState([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)

  /** WebSocket接続を確立する */
  const connect = useCallback(() => {
    // 既に接続中の場合はスキップ
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    // プロトコルに応じてws/wssを切り替え、サーバーのポート3000に接続
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const port = 3000
    const ws = new WebSocket(`${protocol}//${host}:${port}/ws`)

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      let message
      try {
        message = JSON.parse(event.data)
      } catch {
        return
      }

      // 通話ステータス変更の受信
      if (message.type === 'call-status') {
        setCallStatus({
          callSid: message.callSid,
          status: message.status,
        })
      }

      // 文字起こしデータの受信（イミュータブルに配列を更新）
      if (message.type === 'transcript') {
        setTranscripts((prev) => [
          ...prev,
          {
            callSid: message.callSid,
            speaker: message.speaker,
            text: message.text,
            timestamp: message.timestamp,
          },
        ])
      }
    }

    // 切断時は一定時間後に自動再接続
    ws.onclose = () => {
      setConnected(false)
      reconnectTimerRef.current = setTimeout(connect, WS_RECONNECT_DELAY)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [])

  // コンポーネントマウント時に接続、アンマウント時にクリーンアップ
  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  /** 文字起こしとステータスをリセットする（新しい通話用） */
  const clearTranscripts = useCallback(() => {
    setTranscripts([])
    setCallStatus(null)
  }, [])

  return {
    callStatus,
    transcripts,
    connected,
    clearTranscripts,
  }
}
