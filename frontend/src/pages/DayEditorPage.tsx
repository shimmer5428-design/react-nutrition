import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPersons, getFoods, getWeekPlans, upsertWeekPlan, getAllPersonsWeekData } from '../api/db'
import type { Person, DayPlan, FoodItem, Meal, MealHistorySource, WeekPlanRow } from '../api/types'
import { DAY_NAMES, MEAL_TYPES } from '../api/types'
import {
  getMacroTargets,
  getMealTargetCalories,
  getDaySummary,
  getExerciseMacroBonus,
  isExerciseDay,
  getExerciseDayLabel,
} from '../utils/nutrition'
import MealSection from '../components/MealSection'

function emptyDayPlan(personName: string, dayOfWeek: number): DayPlan {
  return {
    person_name: personName,
    day_of_week: dayOfWeek,
    exercise_kcal_burned: 0,
    meals: Object.fromEntries(
      MEAL_TYPES.map(([key]) => [key, { meal_type: key, items: [] }])
    ),
  }
}

// Meal layout definition: which meals go where in the 2-column grid
const MEAL_LAYOUT: { key: string; label: string; span: 1 | 2 }[] = [
  { key: 'breakfast', label: '早餐', span: 1 },
  { key: 'morning_snack', label: '上午點心', span: 1 },
  { key: 'lunch', label: '午餐', span: 1 },
  { key: 'afternoon_snack', label: '下午點心', span: 1 },
  { key: 'dinner', label: '晚餐', span: 2 },
]

function parseIsoWeekId(weekId: string): { year: number; week: number } | null {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return null
  return { year: parseInt(match[1]), week: parseInt(match[2]) }
}

function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7)
  return monday
}

function dateToIsoWeekId(date: Date): string {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function dateToDayOfWeek(date: Date): number {
  return (date.getUTCDay() || 7) - 1
}

function getHistoryDayRefs(weekId: string, dayOfWeek: number): { weekId: string; dayOfWeek: number }[] {
  const parsed = parseIsoWeekId(weekId)
  if (!parsed || dayOfWeek < 0 || dayOfWeek > 6) {
    return [dayOfWeek - 1, dayOfWeek - 2, dayOfWeek - 3]
      .filter((day) => day >= 0)
      .map((day) => ({ weekId, dayOfWeek: day }))
  }

  const currentDate = isoWeekMonday(parsed.year, parsed.week)
  currentDate.setUTCDate(currentDate.getUTCDate() + dayOfWeek)

  return [1, 2, 3].map((offset) => {
    const historyDate = new Date(currentDate)
    historyDate.setUTCDate(currentDate.getUTCDate() - offset)
    return {
      weekId: dateToIsoWeekId(historyDate),
      dayOfWeek: dateToDayOfWeek(historyDate),
    }
  })
}

export default function DayEditorPage() {
  const { weekId, personName: encodedPersonName, dayOfWeek: dayStr } = useParams<{
    weekId: string
    personName: string
    dayOfWeek: string
  }>()
  const navigate = useNavigate()
  const personName = decodeURIComponent(encodedPersonName ?? '')
  const dayOfWeek = parseInt(dayStr ?? '0')

  const [person, setPerson] = useState<Person | null>(null)
  const [dayPlan, setDayPlan] = useState<DayPlan>(emptyDayPlan(personName, dayOfWeek))
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([])
  const [historyMealSources, setHistoryMealSources] = useState<MealHistorySource[]>([])
  const [allWeekData, setAllWeekData] = useState<WeekPlanRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle')
  const [loading, setLoading] = useState(true)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestDayPlan = useRef(dayPlan)

  const load = useCallback(async () => {
    if (!weekId || !personName) return
    setLoading(true)
    setError(null)
    const historyDayRefs = getHistoryDayRefs(weekId, dayOfWeek)
    const historyWeekIds = Array.from(
      new Set(historyDayRefs.map((ref) => ref.weekId).filter((id) => id !== weekId))
    )

    const [personsRes, foodsRes, planRes, allRes, ...historyWeekResults] = await Promise.all([
      getPersons(),
      getFoods(),
      getWeekPlans(personName, weekId),
      getAllPersonsWeekData(weekId),
      ...historyWeekIds.map((historyWeekId) => getWeekPlans(personName, historyWeekId)),
    ])

    if (personsRes.error) { setError(personsRes.error); setLoading(false); return }
    if (foodsRes.error) { setError(foodsRes.error); setLoading(false); return }
    if (planRes.error) { setError(planRes.error); setLoading(false); return }
    if (allRes.error) { setError(allRes.error); setLoading(false); return }
    const historyError = historyWeekResults.find((res) => res.error)?.error
    if (historyError) { setError(historyError); setLoading(false); return }

    const foundPerson = personsRes.data.find((p) => p.name === personName)
    if (!foundPerson) { setError(`找不到人員：${personName}`); setLoading(false); return }

    const historyRows = historyWeekResults.flatMap((res) => res.data)
    const planRowsByDate = new Map<string, WeekPlanRow>()
    for (const row of [...planRes.data, ...historyRows]) {
      planRowsByDate.set(`${row.week_id}:${row.day_of_week}`, row)
    }
    const nextHistoryMealSources = historyDayRefs.flatMap((ref) => {
      const row = planRowsByDate.get(`${ref.weekId}:${ref.dayOfWeek}`)
      return row ? [{ weekId: ref.weekId, dayOfWeek: ref.dayOfWeek, meals: row.data.meals }] : []
    })

    setPerson(foundPerson)
    setCustomFoods(foodsRes.data)
    setHistoryMealSources(nextHistoryMealSources)
    setAllWeekData(allRes.data)

    const dayRow = planRes.data.find((r) => r.day_of_week === dayOfWeek)
    const loaded = dayRow
      ? { ...dayRow.data, exercise_kcal_burned: Math.max(0, dayRow.data.exercise_kcal_burned ?? 0) }
      : emptyDayPlan(personName, dayOfWeek)
    setDayPlan(loaded)
    latestDayPlan.current = loaded
    setSaveStatus('idle')

    setLoading(false)
  }, [weekId, personName, dayOfWeek])

  useEffect(() => { load() }, [load])

  async function doSave(plan: DayPlan) {
    if (!weekId || !personName) return
    setError(null)
    setSaveStatus('saving')
    const { error: err } = await upsertWeekPlan(weekId, personName, dayOfWeek, plan)
    if (err) {
      setError(err)
      setSaveStatus('dirty')
    } else {
      setSaveStatus('saved')
    }
  }

  async function handleSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    await doSave(latestDayPlan.current)
  }

  function scheduleAutoSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setSaveStatus('dirty')
    autoSaveTimer.current = setTimeout(() => {
      doSave(latestDayPlan.current)
    }, 2000)
  }

  function updateMealItems(mealType: string, updater: (items: FoodItem[]) => FoodItem[]) {
    setDayPlan((prev) => {
      const meals = { ...prev.meals }
      const meal = meals[mealType] ? { ...meals[mealType] } : { meal_type: mealType, items: [] }
      meal.items = updater([...meal.items])
      meals[mealType] = meal
      const next = { ...prev, meals }
      latestDayPlan.current = next
      return next
    })
    scheduleAutoSave()
  }

  function handleUpdateItemAmount(mealType: string, itemIndex: number, newAmount: number) {
    updateMealItems(mealType, (items) => {
      const original = items[itemIndex]
      if (!original) return items
      // Find original base food to recalculate
      const baseAmount = original.amount
      const ratio = baseAmount > 0 ? newAmount / baseAmount : 1
      items[itemIndex] = {
        ...original,
        amount: newAmount,
        protein_g: Math.round(original.protein_g * ratio * 10) / 10,
        carbs_g: Math.round(original.carbs_g * ratio * 10) / 10,
        fat_g: Math.round(original.fat_g * ratio * 10) / 10,
        calories: Math.round(original.calories * ratio * 10) / 10,
      }
      return items
    })
  }

  function handleRemoveItem(mealType: string, itemIndex: number) {
    updateMealItems(mealType, (items) => items.filter((_, i) => i !== itemIndex))
  }

  function handleAddItem(mealType: string, item: FoodItem) {
    updateMealItems(mealType, (items) => [...items, item])
  }

  function handleExerciseChange(nextValue: number) {
    const exerciseKcal = Math.max(0, Math.round(nextValue))
    setDayPlan((prev) => {
      const next = { ...prev, exercise_kcal_burned: exerciseKcal }
      latestDayPlan.current = next
      return next
    })
    scheduleAutoSave()
  }

  if (loading) return <p>載入中...</p>
  if (!person) return <p>{error ?? '找不到人員資料'}</p>

  const macros = getMacroTargets(person, dayPlan)
  const summary = getDaySummary(person, dayPlan)
  const exerciseDay = isExerciseDay(dayPlan)
  const exerciseLabel = getExerciseDayLabel(dayPlan)
  const exerciseBonus = getExerciseMacroBonus(dayPlan)
  const exerciseKcal = dayPlan.exercise_kcal_burned ?? 0

  // Build family day meals for family tab
  const familyDayMeals: { personName: string; meals: Record<string, Meal> }[] = []
  for (const row of allWeekData) {
    if (row.day_of_week === dayOfWeek && row.person_name !== personName) {
      familyDayMeals.push({ personName: row.person_name, meals: row.data.meals })
    }
  }

  // Vegetable check
  const vegTarget = 5
  const vegShort = Math.max(0, vegTarget - summary.vegetable_servings)
  const vegShortGrams = Math.round(vegShort * 100)

  return (
    <div className="day-editor">
      <div className="day-editor-topbar">
        <button onClick={() => navigate('/')}>
          &larr; 返回總覽
        </button>
        <div className="topbar-save-group">
          <span className={`save-status save-status-${saveStatus}`}>
            {saveStatus === 'dirty' ? '未儲存' : saveStatus === 'saving' ? '儲存中...' : saveStatus === 'saved' ? '已儲存 ✓' : ''}
          </span>
          <button className="primary" onClick={handleSave}>立即儲存</button>
        </div>
      </div>

      {error && <div className="status error">{error}</div>}

      <h1 className="day-editor-title">
        {personName} -- {DAY_NAMES[dayOfWeek]}{exerciseDay ? ` \uD83C\uDFC3（${exerciseLabel}）` : ''}
      </h1>

      <div className="day-editor-exercise card">
        <div className="day-editor-exercise-input">
          <div className="form-group">
            <label>今日運動消耗（kcal）</label>
            <input
              type="number"
              min="0"
              step="10"
              value={exerciseKcal}
              onChange={(e) => handleExerciseChange(e.target.value ? +e.target.value : 0)}
            />
          </div>
        </div>
        <div className="day-editor-exercise-summary">
          額外加入：{exerciseBonus.total_kcal} kcal {'->'} 蛋白 {exerciseBonus.protein_g}g / 澱粉 {exerciseBonus.carbs_g}g / 脂肪 {exerciseBonus.fat_g}g
        </div>
      </div>

      {/* 4-column stats */}
      <div className="day-editor-stats">
        <div className="stat-card">
          <div className="stat-label">熱量</div>
          <div className="stat-value">{summary.actual_kcal} / {macros.total_kcal} kcal</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">蛋白質</div>
          <div className="stat-value">{summary.actual_protein}g / {macros.protein_g}g</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">澱粉</div>
          <div className="stat-value">{summary.actual_carbs}g / {macros.carbs_g}g</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">脂肪</div>
          <div className="stat-value">{summary.actual_fat}g / {macros.fat_g}g</div>
        </div>
      </div>

      {/* Vegetable section */}
      <div className="day-editor-veg card">
        <div className="veg-title">蔬菜目標：至少5份，約500g（1份約100g熟蔬菜）</div>
        <div className="veg-stats">
          <span>目前蔬菜份數：<strong>{summary.vegetable_servings}</strong></span>
          <span>目前蔬菜重量：<strong>{summary.vegetable_grams}g</strong></span>
        </div>
        {summary.vegetable_servings < 5 && (
          <div className="veg-alert">
            今日蔬菜尚未達標，還差{vegShort.toFixed(1)}份（約{vegShortGrams}g）
          </div>
        )}
      </div>

      {/* Meal grid: 2 columns, dinner spans full */}
      <div className="day-editor-meals-grid">
        {MEAL_LAYOUT.map(({ key, label, span }) => (
          <div
            key={key}
            className="day-editor-meal-cell"
            style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}
          >
            <MealSection
              mealType={key}
              mealLabel={label}
              meal={dayPlan.meals[key] ?? { meal_type: key, items: [] }}
              suggestedKcal={getMealTargetCalories(person, dayPlan, key)}
              customFoods={customFoods}
              historyMealSources={historyMealSources}
              familyDayMeals={familyDayMeals}
              currentPersonName={personName}
              onUpdateItemAmount={(itemIdx, newAmount) => handleUpdateItemAmount(key, itemIdx, newAmount)}
              onRemoveItem={(itemIdx) => handleRemoveItem(key, itemIdx)}
              onAddItem={(item) => handleAddItem(key, item)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
