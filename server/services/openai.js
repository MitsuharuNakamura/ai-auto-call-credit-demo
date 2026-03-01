/**
 * OpenAI API連携サービス
 *
 * 通話ごとにチャット履歴をメモリ内Mapで管理し、
 * GPT-4o-miniにJSON形式で応答を生成させる。
 * 応答: { response: "発話テキスト", endCall: boolean }
 */
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/** @type {Map<string, Array>} callSid → メッセージ履歴 */
const conversationHistories = new Map()

/**
 * 会話を初期化する
 * システムプロンプトをセットして履歴を開始する
 */
export function initConversation(callSid, systemPrompt) {
  conversationHistories.set(callSid, [
    { role: 'system', content: systemPrompt },
  ])
}

/**
 * 顧客の発話に対するAI応答を取得する
 * @returns {{ response: string, endCall: boolean }}
 */
export async function getAIResponse(callSid, userMessage) {
  const history = conversationHistories.get(callSid)
  if (!history) {
    throw new Error(`No conversation history for callSid: ${callSid}`)
  }

  // イミュータブルに履歴を更新（ユーザーメッセージを追加）
  const updatedHistory = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: updatedHistory,
      temperature: 0.7,
      max_tokens: 256,
      response_format: { type: 'json_object' }, // JSON形式で応答を強制
    })

    const assistantMessage = completion.choices[0].message.content

    // アシスタントの応答を履歴に追加
    const finalHistory = [
      ...updatedHistory,
      { role: 'assistant', content: assistantMessage },
    ]
    conversationHistories.set(callSid, finalHistory)

    // JSON応答をパースして返す
    const parsed = JSON.parse(assistantMessage)
    return {
      response: parsed.response || '',
      endCall: parsed.endCall === true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`OpenAI API error: ${errorMessage}`)
  }
}

/** 通話終了時に会話履歴をクリアする */
export function clearConversation(callSid) {
  conversationHistories.delete(callSid)
}
