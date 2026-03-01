/**
 * Twilio Sync操作サービス
 *
 * 通話ごとにSync Documentを作成し、文字起こしエントリを蓄積する。
 * ドキュメント名: transcript-{callSid}
 * データ構造: { entries: [{ speaker, text, timestamp }, ...] }
 */
import twilio from 'twilio'

/** @type {object|null} Twilio Syncサービスインスタンス（遅延初期化） */
let syncService = null

/** Syncサービスインスタンスを取得（シングルトン） */
function getSyncService() {
  if (syncService) {
    return syncService
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  syncService = client.sync.v1.services(process.env.TWILIO_SYNC_SERVICE_SID)
  return syncService
}

/**
 * 通話用の文字起こしドキュメントを作成する
 * エラーコード54301（既に存在）は無視する
 */
export async function createTranscriptDocument(callSid) {
  const service = getSyncService()
  try {
    await service.documents.create({
      uniqueName: `transcript-${callSid}`,
      data: { entries: [] },
    })
  } catch (error) {
    // 54301: ドキュメントが既に存在する場合はスキップ
    if (error.code === 54301) {
      return
    }
    throw error
  }
}

/**
 * 文字起こしエントリを既存ドキュメントに追記する
 * イミュータブルにentriesを更新する
 */
export async function appendTranscriptEntry(callSid, entry) {
  const service = getSyncService()
  const docName = `transcript-${callSid}`

  try {
    const doc = await service.documents(docName).fetch()
    const currentData = doc.data || { entries: [] }
    // 既存エントリを壊さずに新規エントリを追加
    const updatedEntries = [...currentData.entries, entry]
    await service.documents(docName).update({
      data: { entries: updatedEntries },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Sync update failed: ${errorMessage}`)
  }
}
