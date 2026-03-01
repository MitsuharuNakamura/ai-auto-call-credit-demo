/**
 * メインアプリケーションコンポーネント
 *
 * 架電フォーム・通話ステータス・文字起こし表示を統合する。
 * WebSocketでバックエンドからリアルタイムデータを受信する。
 */
import { useState, useCallback } from 'react'
import CallForm from './components/CallForm.jsx'
import CallStatus from './components/CallStatus.jsx'
import TranscriptView from './components/TranscriptView.jsx'
import { useWebSocket } from './hooks/useWebSocket.js'

/** 通話がアクティブとみなされるステータスの集合 */
const ACTIVE_STATUSES = new Set([
  'initiated',
  'ringing',
  'in-progress',
  'answered',
])

export default function App() {
  const [callSid, setCallSid] = useState(null)
  const { callStatus, transcripts, connected, clearTranscripts } = useWebSocket()

  // 通話が進行中かどうか判定
  const isCallActive = callStatus
    ? ACTIVE_STATUSES.has(callStatus.status)
    : false

  /** 架電開始時: 前回のデータをクリアしてcallSidを設定 */
  const handleCallStarted = useCallback((newCallSid) => {
    clearTranscripts()
    setCallSid(newCallSid)
  }, [clearTranscripts])

  /** 新しい通話ボタン: データをリセットする */
  const handleNewCall = useCallback(() => {
    clearTranscripts()
    setCallSid(null)
  }, [clearTranscripts])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ヘッダー: タイトルとWebSocket接続状態 */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            AI支払い催促自動架電デモ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Twilio ConversationRelay + OpenAI
          </p>
          {/* WebSocket接続インジケーター */}
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${
                connected ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              {connected ? '接続中' : '未接続'}
            </span>
          </div>
        </header>

        {/* 架電フォームセクション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">架電設定</h2>
          <CallForm
            onCallStarted={handleCallStarted}
            isCallActive={isCallActive}
          />
        </div>

        {/* 通話ステータスセクション（通話開始後のみ表示） */}
        {callStatus && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <CallStatus callStatus={callStatus} />
            {callSid && (
              <p className="text-xs text-gray-400 mt-2">
                Call SID: {callSid}
              </p>
            )}
          </div>
        )}

        {/* 文字起こしセクション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              文字起こし
            </h2>
            {/* 通話終了後に「新しい通話」ボタンを表示 */}
            {transcripts.length > 0 && !isCallActive && (
              <button
                onClick={handleNewCall}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                新しい通話
              </button>
            )}
          </div>
          <TranscriptView transcripts={transcripts} />
        </div>
      </div>
    </div>
  )
}
