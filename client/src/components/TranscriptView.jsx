/**
 * 文字起こしリアルタイム表示コンポーネント
 *
 * チャットUI風のレイアウトで通話内容を表示する。
 * - AIの発話: 左寄せ（青系背景）
 * - 顧客の発話: 右寄せ（グレー系背景）
 * 新しいメッセージが来たら自動スクロールする。
 */
import { useEffect, useRef } from 'react'

/** タイムスタンプを「HH:MM:SS」形式にフォーマットする */
function formatTime(timestamp) {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function TranscriptView({ transcripts }) {
  const scrollRef = useRef(null)

  // 新しいメッセージが追加されたら自動で最下部にスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcripts])

  // 文字起こしがない場合はプレースホルダーを表示
  if (transcripts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        通話が開始されると文字起こしが表示されます
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="space-y-3 max-h-96 overflow-y-auto p-4"
    >
      {transcripts.map((entry, index) => {
        const isAI = entry.speaker === 'ai_agent'
        return (
          <div
            key={`${entry.timestamp}-${index}`}
            className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
          >
            {/* 吹き出し: AIは左寄せ青系、顧客は右寄せグレー */}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                isAI
                  ? 'bg-blue-100 text-blue-900 rounded-bl-sm'
                  : 'bg-gray-200 text-gray-900 rounded-br-sm'
              }`}
            >
              {/* 話者ラベル */}
              <p className="text-xs font-medium mb-1 opacity-70">
                {isAI ? 'AI' : '顧客'}
              </p>
              {/* 発話テキスト */}
              <p className="text-sm">{entry.text}</p>
              {/* タイムスタンプ */}
              <p className="text-xs mt-1 opacity-50 text-right">
                {formatTime(entry.timestamp)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
