import { GoogleGenerativeAI } from '@google/generative-ai'
import type { FoodItem } from './types'

const PROMPT = `你是精通台灣飲食的營養師。根據以下描述（或圖片），估算每道食物的營養成分。
只回傳 JSON 陣列，不要有任何其他文字或 markdown。每個元素格式：
{"name":"食物名稱（繁體中文）","amount":數字,"unit":"g/ml/份/碗/片等","protein_g":數字,"carbs_g":數字,"fat_g":數字,"calories":數字,"category":"protein"|"starch"|"fat"|"vegetable"|"dessert"|"custom"}
注意：複合料理請拆解成主要成分；份量以台灣一般份量為基準；所有數值都必須是數字。`

export async function analyzeFood(
  description: string,
  imageBase64?: string,
  imageMimeType?: string,
): Promise<FoodItem[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string
  if (!apiKey) throw new Error('未設定 VITE_GEMINI_API_KEY')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [
    { text: PROMPT + '\n\n描述：' + (description.trim() || '（請根據圖片判斷）') },
  ]

  if (imageBase64 && imageMimeType) {
    parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } })
  }

  const result = await model.generateContent(parts)
  const raw = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(raw) as FoodItem[]
}
