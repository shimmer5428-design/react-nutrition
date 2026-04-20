import { GoogleGenerativeAI } from '@google/generative-ai'
import type { FoodItem } from './types'
import { FOOD_CATEGORIES } from './types'

const PROMPT = `你是精通台灣飲食的營養師。根據以下描述（或圖片），估算每道食物的營養成分。
只回傳 JSON 陣列，不要有任何其他文字或 markdown。每個元素格式：
{"name":"食物名稱（繁體中文）","amount":數字,"unit":"g/ml/份/碗/片等","protein_g":數字,"carbs_g":數字,"fat_g":數字,"calories":數字,"category":"protein"|"starch"|"fat"|"vegetable"|"dessert"|"custom"}
注意：
1. 複合料理必須拆解成主要成分，不可把整份便當、套餐、湯品或沙拉當成單一項目。
2. 不可省略任何蔬菜或配菜，包含便當配菜、燙青菜、炒青菜、沙拉、湯裡蔬菜。
3. 所有蔬菜都必須獨立成項，category 必須填 "vegetable"。
4. 若份量不明確，請用台灣常見熟重估算。
5. 所有數值都必須是數字。`

const VALID_CATEGORIES = new Set(FOOD_CATEGORIES)
const VEGETABLE_KEYWORDS = [
  '蔬菜', '青菜', '高麗菜', '花椰菜', '綠花椰', '白花椰', '空心菜', '菠菜', '青江菜',
  '萵苣', '生菜', '小白菜', '大白菜', '娃娃菜', '地瓜葉', '茼蒿', '芥藍', '油菜',
  '洋蔥', '紅蘿蔔', '白蘿蔔', '蘿蔔', '四季豆', '豆芽', '豆苗', '甜椒', '青椒',
  '小黃瓜', '黃瓜', '番茄', '茄子', '秋葵', '海帶芽', '木耳', '沙拉', '配菜', '燙青菜',
]

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0
}

function isVegetableLike(name: string): boolean {
  return VEGETABLE_KEYWORDS.some((keyword) => name.includes(keyword))
}

function normalizeFoodItem(raw: unknown): FoodItem {
  const item = (raw ?? {}) as Partial<FoodItem>
  const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : '未命名食物'
  const rawCategory = typeof item.category === 'string' ? item.category.trim() : 'custom'
  const category = isVegetableLike(name)
    ? 'vegetable'
    : VALID_CATEGORIES.has(rawCategory)
    ? rawCategory
    : 'custom'

  return {
    name,
    amount: Math.max(0, toNumber(item.amount)),
    unit: typeof item.unit === 'string' && item.unit.trim() ? item.unit.trim() : 'g',
    protein_g: Math.max(0, toNumber(item.protein_g)),
    carbs_g: Math.max(0, toNumber(item.carbs_g)),
    fat_g: Math.max(0, toNumber(item.fat_g)),
    calories: Math.max(0, toNumber(item.calories)),
    category,
  }
}

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
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('AI 回傳格式錯誤')
  }
  return parsed.map(normalizeFoodItem)
}
