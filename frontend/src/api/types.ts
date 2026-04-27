// Mirrors the Python dataclass models from recipe/core/models.py

export interface FoodItem {
  name: string
  amount: number
  unit: string
  protein_g: number
  carbs_g: number
  fat_g: number
  calories: number
  category: string // "protein" | "starch" | "fat" | "vegetable" | "dessert" | "custom"
}

export interface Meal {
  meal_type: string
  items: FoodItem[]
}

export interface MealHistorySource {
  weekId: string
  dayOfWeek: number
  meals: Record<string, Meal>
}

export interface DayPlan {
  person_name: string
  day_of_week: number // 0=Mon ... 6=Sun
  exercise_kcal_burned?: number
  meals: Record<string, Meal>
}

export interface Person {
  name: string
  weight_kg: number
  tdee_manual?: number | null
  height_cm?: number | null
  age?: number | null
  gender?: string | null       // "male" | "female"
  activity_level?: string | null
  calorie_plan?: string        // "deficit" | "maintain" | "surplus"
  exercise_days?: number[]
  exercise_bonus?: number
}

export interface WeekPlanRow {
  week_id: string
  person_name: string
  day_of_week: number
  data: DayPlan
}

// Supabase row shapes (name + data JSONB)
export interface PersonRow {
  name: string
  data: Person
}

export interface FoodRow {
  name: string
  data: FoodItem
}

export const MEAL_TYPES: [string, string][] = [
  ['breakfast', '早餐'],
  ['morning_snack', '上午點心'],
  ['lunch', '午餐'],
  ['afternoon_snack', '下午點心'],
  ['dinner', '晚餐'],
]

export const DAY_NAMES = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export const FOOD_CATEGORIES = ['protein', 'starch', 'fat', 'vegetable', 'dessert', 'custom']
