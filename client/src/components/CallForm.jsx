/**
 * 架電フォームコンポーネント
 *
 * 電話番号（E.164形式）と顧客名を入力して架電を開始する。
 * POST /api/call にリクエストを送信し、callSidを親コンポーネントに通知する。
 * 通話中はフォームを無効化する。
 */
import { useState } from 'react'

/** フォームの初期値 */
const INITIAL_FORM = {
  phoneNumber: '',
  customerName: '',
}

export default function CallForm({ onCallStarted, isCallActive }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /** フォーム値をイミュータブルに更新する */
  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  /** フォーム送信: バリデーション → API呼び出し → 結果通知 */
  async function handleSubmit(e) {
    e.preventDefault()

    // 必須項目のバリデーション
    if (!form.phoneNumber || !form.customerName) {
      setError('電話番号と顧客名を入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: form.phoneNumber,
          customerName: form.customerName,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || '架電に失敗しました')
        return
      }

      // 架電成功: callSidを親に通知
      onCallStarted(data.data.callSid)
    } catch (err) {
      setError(`架電に失敗しました: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 電話番号入力 */}
      <div>
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          電話番号（E.164形式）
        </label>
        <input
          id="phoneNumber"
          type="tel"
          placeholder="+819012345678"
          value={form.phoneNumber}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          disabled={isCallActive || loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      {/* 顧客名入力 */}
      <div>
        <label
          htmlFor="customerName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          顧客名
        </label>
        <input
          id="customerName"
          type="text"
          placeholder="田中太郎"
          value={form.customerName}
          onChange={(e) => handleChange('customerName', e.target.value)}
          disabled={isCallActive || loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      {/* エラーメッセージ */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 架電ボタン（通話中・発信中は無効化） */}
      <button
        type="submit"
        disabled={isCallActive || loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '発信中...' : '架電'}
      </button>
    </form>
  )
}
