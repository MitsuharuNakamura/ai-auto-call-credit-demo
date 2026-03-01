/**
 * 通話状態管理サービス
 *
 * メモリ内Mapで通話ごとの状態（顧客名・電話番号・ステータス等）を保持する。
 * イミュータブルにコピーを返すことで意図しない変更を防ぐ。
 */

/** @type {Map<string, object>} callSid → 通話状態 */
const callStates = new Map()

/** 新しい通話状態を登録する */
export function setCallState(callSid, state) {
  callStates.set(callSid, { ...state })
}

/** 通話状態を取得する（コピーを返す） */
export function getCallState(callSid) {
  const state = callStates.get(callSid)
  return state ? { ...state } : null
}

/** 通話状態を部分更新する */
export function updateCallState(callSid, updates) {
  const current = callStates.get(callSid)
  if (!current) {
    return null
  }
  const updated = { ...current, ...updates }
  callStates.set(callSid, updated)
  return { ...updated }
}

/** 通話状態を削除する */
export function deleteCallState(callSid) {
  callStates.delete(callSid)
}
