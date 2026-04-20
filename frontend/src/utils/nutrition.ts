import type { Person, DayPlan, FoodItem, Meal } from '../api/types'
import { MEAL_TYPES } from '../api/types'

// ---------------------------------------------------------------------------
// Activity multipliers (Harris-Benedict)
// ---------------------------------------------------------------------------
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

// ---------------------------------------------------------------------------
// Calorie plan multipliers
// ---------------------------------------------------------------------------
const PLAN_MULTIPLIERS: Record<string, number> = {
  deficit: 0.85,
  maintain: 1.0,
  surplus: 1.15,
}

// ---------------------------------------------------------------------------
// Meal calorie ratios
// ---------------------------------------------------------------------------
export const MEAL_CALORIE_RATIO: Record<string, number> = {
  breakfast: 0.30,
  morning_snack: 0.0,
  lunch: 0.30,
  afternoon_snack: 0.0,
  dinner: 0.40,
}

// ---------------------------------------------------------------------------
// TDEE calculation
// ---------------------------------------------------------------------------

function calculateBMR(person: Person): number {
  const weight = person.weight_kg
  const height = person.height_cm ?? 170
  const age = person.age ?? 30
  const gender = person.gender ?? 'male'

  if (gender === 'male') {
    return 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age
  }
  return 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age
}

export function getBaseTDEE(person: Person): number {
  if (person.tdee_manual) {
    return person.tdee_manual
  }
  const bmr = calculateBMR(person)
  const multiplier = ACTIVITY_MULTIPLIERS[person.activity_level ?? 'moderate'] ?? 1.55
  return Math.round(bmr * multiplier)
}

export function getExerciseCalories(dayPlan?: Pick<DayPlan, 'exercise_kcal_burned'> | null): number {
  const value = dayPlan?.exercise_kcal_burned ?? 0
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

export function isExerciseDay(dayPlan?: Pick<DayPlan, 'exercise_kcal_burned'> | null): boolean {
  return getExerciseCalories(dayPlan) > 0
}

export function getExerciseMacroBonus(dayPlan?: Pick<DayPlan, 'exercise_kcal_burned'> | null): MacroTargets {
  const total_kcal = getExerciseCalories(dayPlan)
  const protein_g = Math.round((total_kcal * 0.20) / 4)
  const fat_g = Math.round((total_kcal * 0.30) / 9)
  const carbs_g = Math.round((total_kcal * 0.50) / 4)
  return { protein_g, carbs_g, fat_g, total_kcal }
}

export function getExerciseDayLabel(dayPlan?: Pick<DayPlan, 'exercise_kcal_burned'> | null): string {
  const kcal = getExerciseCalories(dayPlan)
  if (kcal <= 0) return ''
  return `運動日 +${kcal} kcal`
}

export function getBaseTargetCalories(person: Person): number {
  const tdee = getBaseTDEE(person)
  const planMultiplier = PLAN_MULTIPLIERS[person.calorie_plan ?? 'maintain'] ?? 1.0
  return Math.round(tdee * planMultiplier)
}

export function getTargetCalories(person: Person, dayPlan?: Pick<DayPlan, 'exercise_kcal_burned'> | null): number {
  return getBaseTargetCalories(person) + getExerciseCalories(dayPlan)
}

// ---------------------------------------------------------------------------
// Macro targets
// ---------------------------------------------------------------------------

export interface MacroTargets {
  protein_g: number
  carbs_g: number
  fat_g: number
  total_kcal: number
}

export function getMacroTargets(person: Person, dayPlan?: Pick<DayPlan, 'exercise_kcal_burned'> | null): MacroTargets {
  const base_kcal = getBaseTargetCalories(person)
  const exerciseBonus = getExerciseMacroBonus(dayPlan)
  const protein_g = Math.round((base_kcal * 0.20) / 4) + exerciseBonus.protein_g
  const fat_g = Math.round((base_kcal * 0.30) / 9) + exerciseBonus.fat_g
  const carbs_g = Math.round((base_kcal * 0.50) / 4) + exerciseBonus.carbs_g
  return { protein_g, carbs_g, fat_g, total_kcal: base_kcal + exerciseBonus.total_kcal }
}

export function getMealTargetCalories(person: Person, dayPlan: Pick<DayPlan, 'exercise_kcal_burned'> | null, mealType: string): number {
  const total = getTargetCalories(person, dayPlan)
  const ratio = MEAL_CALORIE_RATIO[mealType] ?? 0
  return Math.round(total * ratio)
}

// ---------------------------------------------------------------------------
// Day summary helpers
// ---------------------------------------------------------------------------

export interface DaySummary {
  actual_kcal: number
  actual_protein: number
  actual_carbs: number
  actual_fat: number
  target_kcal: number
  target_protein: number
  target_carbs: number
  target_fat: number
  deficit_kcal: number
  protein_delta: number
  carbs_delta: number
  fat_delta: number
  vegetable_grams: number
  vegetable_servings: number
}

export function mealItemTotals(items: FoodItem[]): { protein: number; carbs: number; fat: number; cal: number } {
  return {
    protein: items.reduce((s, i) => s + i.protein_g, 0),
    carbs: items.reduce((s, i) => s + i.carbs_g, 0),
    fat: items.reduce((s, i) => s + i.fat_g, 0),
    cal: items.reduce((s, i) => s + i.calories, 0),
  }
}

export function getDaySummary(person: Person, dayPlan: DayPlan): DaySummary {
  const targets = getMacroTargets(person, dayPlan)

  let actual_kcal = 0
  let actual_protein = 0
  let actual_carbs = 0
  let actual_fat = 0
  let vegetable_grams = 0

  for (const mealKey of MEAL_TYPES.map(([k]) => k)) {
    const meal: Meal | undefined = dayPlan.meals[mealKey]
    if (!meal) continue
    for (const item of meal.items) {
      actual_kcal += item.calories
      actual_protein += item.protein_g
      actual_carbs += item.carbs_g
      actual_fat += item.fat_g
      if (item.category === 'vegetable') {
        vegetable_grams += item.amount
      }
    }
  }

  return {
    actual_kcal: Math.round(actual_kcal),
    actual_protein: Math.round(actual_protein * 10) / 10,
    actual_carbs: Math.round(actual_carbs * 10) / 10,
    actual_fat: Math.round(actual_fat * 10) / 10,
    target_kcal: targets.total_kcal,
    target_protein: targets.protein_g,
    target_carbs: targets.carbs_g,
    target_fat: targets.fat_g,
    deficit_kcal: Math.round(actual_kcal - targets.total_kcal),
    protein_delta: Math.round((actual_protein - targets.protein_g) * 10) / 10,
    carbs_delta: Math.round((actual_carbs - targets.carbs_g) * 10) / 10,
    fat_delta: Math.round((actual_fat - targets.fat_g) * 10) / 10,
    vegetable_grams: Math.round(vegetable_grams),
    vegetable_servings: Math.round(vegetable_grams / 100 * 10) / 10,
  }
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

export type DayStatus = 'met' | 'deficit' | 'exceeded'

export function getDayStatus(summary: DaySummary): DayStatus {
  const ratio = summary.actual_kcal / summary.target_kcal
  if (ratio < 0.95) return 'deficit'
  if (ratio > 1.05) return 'exceeded'
  return 'met'
}

export function getMacroStatus(actual: number, target: number): DayStatus {
  const ratio = target > 0 ? actual / target : 1
  if (ratio < 0.95) return 'deficit'
  if (ratio > 1.05) return 'exceeded'
  return 'met'
}
