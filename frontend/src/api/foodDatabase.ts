import type { FoodItem } from './types'

export const CATEGORY_LABELS: Record<string, string> = {
  protein: '蛋白質',
  starch: '澱粉',
  fat: '油脂',
  vegetable: '蔬菜',
  dessert: '甜點',
}

export const BUILTIN_FOODS: FoodItem[] = [
  // ── Protein ──
  { name: '雞蛋', amount: 60, unit: 'g', protein_g: 7.6, carbs_g: 0.4, fat_g: 5.8, calories: 86.0, category: 'protein' },
  { name: '雞胸肉', amount: 100, unit: 'g', protein_g: 30.0, carbs_g: 0.0, fat_g: 3.5, calories: 165.0, category: 'protein' },
  { name: '雞腿肉（去皮）', amount: 100, unit: 'g', protein_g: 25.0, carbs_g: 0.0, fat_g: 5.0, calories: 145.0, category: 'protein' },
  { name: '蛋白粉', amount: 40, unit: 'g', protein_g: 30.0, carbs_g: 3.0, fat_g: 1.0, calories: 160.0, category: 'protein' },
  { name: '豆漿（無糖）', amount: 240, unit: 'g', protein_g: 7.0, carbs_g: 8.0, fat_g: 4.0, calories: 100.0, category: 'protein' },
  { name: '鮭魚', amount: 100, unit: 'g', protein_g: 25.0, carbs_g: 0.0, fat_g: 8.0, calories: 172.0, category: 'protein' },
  { name: '鯛魚（虱目魚）', amount: 100, unit: 'g', protein_g: 22.0, carbs_g: 0.0, fat_g: 4.0, calories: 122.0, category: 'protein' },
  { name: '豬里肌', amount: 100, unit: 'g', protein_g: 22.0, carbs_g: 0.0, fat_g: 4.0, calories: 122.0, category: 'protein' },
  { name: '牛腱', amount: 100, unit: 'g', protein_g: 23.0, carbs_g: 0.0, fat_g: 5.0, calories: 137.0, category: 'protein' },
  { name: '蝦仁', amount: 100, unit: 'g', protein_g: 24.0, carbs_g: 0.0, fat_g: 0.5, calories: 100.0, category: 'protein' },
  { name: '希臘優格（0%）', amount: 100, unit: 'g', protein_g: 10.0, carbs_g: 4.0, fat_g: 0.0, calories: 57.0, category: 'protein' },
  { name: '優格', amount: 100, unit: 'g', protein_g: 3.0, carbs_g: 3.0, fat_g: 0.0, calories: 47.0, category: 'protein' },
  { name: '板豆腐', amount: 100, unit: 'g', protein_g: 8.0, carbs_g: 2.0, fat_g: 4.0, calories: 76.0, category: 'protein' },
  { name: '嫩豆腐', amount: 290, unit: 'g', protein_g: 15.2, carbs_g: 4.8, fat_g: 6.0, calories: 134.8, category: 'protein' },
  { name: '牛奶（全脂）', amount: 240, unit: 'g', protein_g: 8.0, carbs_g: 12.0, fat_g: 8.0, calories: 149.0, category: 'protein' },
  { name: '牛奶（脫脂）', amount: 240, unit: 'g', protein_g: 8.0, carbs_g: 12.0, fat_g: 0.0, calories: 83.0, category: 'protein' },
  { name: '水煮鮪魚罐頭', amount: 150, unit: 'g', protein_g: 29.2, carbs_g: 0.0, fat_g: 1.5, calories: 129.0, category: 'protein' },
  { name: '毛豆', amount: 100, unit: 'g', protein_g: 13.8, carbs_g: 13.7, fat_g: 5.0, calories: 125.0, category: 'protein' },
  { name: '香腸', amount: 100, unit: 'g', protein_g: 17.0, carbs_g: 13.3, fat_g: 25.3, calories: 349.0, category: 'protein' },
  { name: '豆皮', amount: 100, unit: 'g', protein_g: 25.3, carbs_g: 4.5, fat_g: 8.8, calories: 199.0, category: 'protein' },
  { name: '豆漿優格', amount: 950, unit: 'g', protein_g: 31.35, carbs_g: 19.95, fat_g: 19.0, calories: 376.2, category: 'protein' },
  { name: '燉牛肉', amount: 100, unit: 'g', protein_g: 23.5, carbs_g: 11.8, fat_g: 17.6, calories: 294.0, category: 'protein' },
  { name: '滷肉', amount: 100, unit: 'g', protein_g: 13.4, carbs_g: 4.4, fat_g: 19.5, calories: 246.7, category: 'protein' },
  { name: '油豆腐', amount: 100, unit: 'g', protein_g: 17.0, carbs_g: 4.9, fat_g: 17.6, calories: 245.0, category: 'protein' },
  { name: '豆乾', amount: 100, unit: 'g', protein_g: 17.4, carbs_g: 3.5, fat_g: 8.6, calories: 161.0, category: 'protein' },

  // ── Starch ──
  { name: '白飯（熟）', amount: 100, unit: 'g', protein_g: 2.7, carbs_g: 28.0, fat_g: 0.3, calories: 130.0, category: 'starch' },
  { name: '糙米飯（熟）', amount: 100, unit: 'g', protein_g: 2.6, carbs_g: 25.0, fat_g: 0.9, calories: 112.0, category: 'starch' },
  { name: '十穀米（熟）', amount: 100, unit: 'g', protein_g: 4.75, carbs_g: 27.0, fat_g: 3.0, calories: 118.0, category: 'starch' },
  { name: '地瓜（熟）', amount: 100, unit: 'g', protein_g: 1.6, carbs_g: 20.0, fat_g: 0.1, calories: 86.0, category: 'starch' },
  { name: '燕麥（生）', amount: 40, unit: 'g', protein_g: 5.0, carbs_g: 27.0, fat_g: 3.0, calories: 156.0, category: 'starch' },
  { name: '全麥吐司', amount: 30, unit: 'g', protein_g: 3.8, carbs_g: 13.0, fat_g: 1.0, calories: 86.0, category: 'starch' },
  { name: '馬鈴薯（熟）', amount: 100, unit: 'g', protein_g: 2.0, carbs_g: 17.0, fat_g: 0.1, calories: 77.0, category: 'starch' },
  { name: '義大利麵（熟）', amount: 100, unit: 'g', protein_g: 5.0, carbs_g: 25.0, fat_g: 1.0, calories: 131.0, category: 'starch' },
  { name: '玉米（熟）', amount: 100, unit: 'g', protein_g: 3.3, carbs_g: 19.0, fat_g: 1.4, calories: 96.0, category: 'starch' },
  { name: '饅頭', amount: 80, unit: 'g', protein_g: 6.0, carbs_g: 38.0, fat_g: 1.0, calories: 185.0, category: 'starch' },
  { name: '藜麥（熟）', amount: 100, unit: 'g', protein_g: 4.4, carbs_g: 21.3, fat_g: 1.9, calories: 120.0, category: 'starch' },
  { name: '南瓜（熟）', amount: 100, unit: 'g', protein_g: 1.0, carbs_g: 9.5, fat_g: 0.1, calories: 43.0, category: 'starch' },
  { name: '米粉（熟）', amount: 100, unit: 'g', protein_g: 1.6, carbs_g: 22.0, fat_g: 0.2, calories: 97.0, category: 'starch' },
  { name: '水果', amount: 100, unit: 'g', protein_g: 0.5, carbs_g: 11.0, fat_g: 0.1, calories: 46.0, category: 'starch' },
  { name: '咖喱', amount: 100, unit: 'g', protein_g: 4.0, carbs_g: 18.0, fat_g: 14.0, calories: 200.0, category: 'starch' },
  { name: '墨西哥捲餅', amount: 100, unit: 'g', protein_g: 3.0, carbs_g: 18.0, fat_g: 1.0, calories: 87.0, category: 'starch' },
  { name: '果醬', amount: 100, unit: 'g', protein_g: 0.6, carbs_g: 60.0, fat_g: 0.1, calories: 250.0, category: 'starch' },
  { name: '大熊全麥麵包', amount: 38.8, unit: 'g', protein_g: 3.3, carbs_g: 20.2, fat_g: 1.8, calories: 111.0, category: 'starch' },
  { name: '關廟麵（熟）', amount: 100, unit: 'g', protein_g: 4.0, carbs_g: 30.0, fat_g: 0.5, calories: 140.0, category: 'starch' },

  // ── Fat ──
  { name: '橄欖油', amount: 14, unit: 'g', protein_g: 0.0, carbs_g: 0.0, fat_g: 14.0, calories: 124.0, category: 'fat' },
  { name: '椰子油', amount: 14, unit: 'g', protein_g: 0.0, carbs_g: 0.0, fat_g: 14.0, calories: 125.0, category: 'fat' },
  { name: '酪梨', amount: 100, unit: 'g', protein_g: 2.0, carbs_g: 9.0, fat_g: 15.0, calories: 160.0, category: 'fat' },
  { name: '核桃', amount: 30, unit: 'g', protein_g: 4.5, carbs_g: 4.0, fat_g: 18.5, calories: 196.0, category: 'fat' },
  { name: '杏仁', amount: 30, unit: 'g', protein_g: 6.0, carbs_g: 6.0, fat_g: 14.0, calories: 174.0, category: 'fat' },
  { name: '花生醬（無糖）', amount: 30, unit: 'g', protein_g: 7.0, carbs_g: 6.0, fat_g: 16.0, calories: 188.0, category: 'fat' },
  { name: '奶油', amount: 10, unit: 'g', protein_g: 0.1, carbs_g: 0.0, fat_g: 8.0, calories: 71.0, category: 'fat' },
  { name: '起司片', amount: 20, unit: 'g', protein_g: 4.0, carbs_g: 0.5, fat_g: 5.0, calories: 62.0, category: 'fat' },
  { name: '芝麻油', amount: 14, unit: 'g', protein_g: 0.0, carbs_g: 0.0, fat_g: 14.0, calories: 124.0, category: 'fat' },
  { name: '亞麻仁油', amount: 14, unit: 'g', protein_g: 0.0, carbs_g: 0.0, fat_g: 14.0, calories: 124.0, category: 'fat' },
  { name: '腰果', amount: 30, unit: 'g', protein_g: 5.0, carbs_g: 9.0, fat_g: 13.0, calories: 165.0, category: 'fat' },
  { name: '綜合堅果', amount: 30, unit: 'g', protein_g: 6.0, carbs_g: 7.0, fat_g: 12.5, calories: 165.0, category: 'fat' },

  // ── Vegetable ──
  { name: '洋蔥', amount: 100, unit: 'g', protein_g: 1.1, carbs_g: 9.3, fat_g: 0.1, calories: 40.0, category: 'vegetable' },
  { name: '紅蘿蔔（carrot）', amount: 100, unit: 'g', protein_g: 0.9, carbs_g: 9.6, fat_g: 0.2, calories: 41.0, category: 'vegetable' },
  { name: '綠色蔬菜（熟）', amount: 100, unit: 'g', protein_g: 2.0, carbs_g: 4.0, fat_g: 0.3, calories: 28.0, category: 'vegetable' },
  { name: '白蘿蔔', amount: 100, unit: 'g', protein_g: 0.7, carbs_g: 4.1, fat_g: 0.1, calories: 18.0, category: 'vegetable' },
  { name: '豆子（四季豆）', amount: 100, unit: 'g', protein_g: 1.8, carbs_g: 7.0, fat_g: 0.2, calories: 35.0, category: 'vegetable' },
  { name: '炒蔬菜（洋蔥、紅蘿蔔、綠色蔬菜、白蘿蔔、豆子）', amount: 250, unit: 'g', protein_g: 3.6, carbs_g: 15.3, fat_g: 5.5, calories: 122.0, category: 'vegetable' },

  // ── Dessert ──
  { name: '巧克力', amount: 30, unit: 'g', protein_g: 1.5, carbs_g: 15.0, fat_g: 10.0, calories: 156.0, category: 'dessert' },
  { name: '巧克力蛋糕', amount: 100, unit: 'g', protein_g: 4.7, carbs_g: 52.8, fat_g: 20.1, calories: 389.0, category: 'dessert' },
  { name: '檸檬塔', amount: 100, unit: 'g', protein_g: 4.5, carbs_g: 31.6, fat_g: 13.6, calories: 260.0, category: 'dessert' },
  { name: '香草冰淇淋', amount: 100, unit: 'g', protein_g: 3.5, carbs_g: 24.0, fat_g: 11.0, calories: 210.0, category: 'dessert' },
  { name: '糖霜甜甜圈', amount: 80, unit: 'g', protein_g: 2.0, carbs_g: 25.0, fat_g: 12.0, calories: 220.0, category: 'dessert' },
  { name: '費南雪', amount: 40, unit: 'g', protein_g: 2.5, carbs_g: 15.0, fat_g: 10.0, calories: 150.0, category: 'dessert' },
  { name: '蛋黃酥', amount: 65, unit: 'g', protein_g: 6.0, carbs_g: 30.0, fat_g: 22.0, calories: 342.0, category: 'dessert' },
  { name: '餅乾', amount: 20, unit: 'g', protein_g: 1.0, carbs_g: 10.0, fat_g: 5.0, calories: 90.0, category: 'dessert' },
  { name: '布丁', amount: 120, unit: 'g', protein_g: 5.0, carbs_g: 12.0, fat_g: 9.8, calories: 158.0, category: 'dessert' },
  { name: '提拉米蘇', amount: 100, unit: 'g', protein_g: 4.4, carbs_g: 21.1, fat_g: 25.1, calories: 328.0, category: 'dessert' },
]

/** Foods grouped by category for dropdown filtering */
export function getFoodsByCategory(category: string): FoodItem[] {
  return BUILTIN_FOODS.filter((f) => f.category === category)
}

/** Pre-grouped map: category -> FoodItem[] */
export const CATEGORY_FOODS: Record<string, FoodItem[]> = Object.keys(CATEGORY_LABELS).reduce(
  (acc, cat) => {
    acc[cat] = BUILTIN_FOODS.filter((f) => f.category === cat)
    return acc
  },
  {} as Record<string, FoodItem[]>,
)
