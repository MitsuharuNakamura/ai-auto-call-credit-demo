/**
 * 通話ステータス表示コンポーネント
 *
 * Twilioの通話ステータスを日本語ラベルと色付きバッジで表示する。
 * 通話中はアニメーション付きのインジケーターを表示する。
 */

/** Twilioステータス → 日本語ラベル・色のマッピング */
const STATUS_MAP = {
  initiated: { label: '発信中', color: 'bg-yellow-100 text-yellow-800' },
  ringing: { label: '呼出中', color: 'bg-orange-100 text-orange-800' },
  'in-progress': { label: '通話中', color: 'bg-green-100 text-green-800' },
  answered: { label: '通話中', color: 'bg-green-100 text-green-800' },
  completed: { label: '終了', color: 'bg-gray-100 text-gray-800' },
  busy: { label: '話し中', color: 'bg-red-100 text-red-800' },
  'no-answer': { label: '応答なし', color: 'bg-red-100 text-red-800' },
  failed: { label: '失敗', color: 'bg-red-100 text-red-800' },
  canceled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-800' },
}

export default function CallStatus({ callStatus }) {
  if (!callStatus) {
    return null
  }

  // 未知のステータスにはデフォルト表示を使用
  const statusInfo = STATUS_MAP[callStatus.status] || {
    label: callStatus.status,
    color: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">ステータス:</span>
      {/* ステータスバッジ */}
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
      {/* 通話中はパルスアニメーションのインジケーターを表示 */}
      {(callStatus.status === 'in-progress' || callStatus.status === 'answered') && (
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
      )}
    </div>
  )
}
