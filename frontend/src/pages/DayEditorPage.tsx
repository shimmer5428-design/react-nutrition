import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPersons, getFoods, getWeekPlans, upsertWeekPlan, getAllPersonsWeekData } from '../api/db'
import type { Person, DayPlan, FoodItem, Meal, WeekPlanRow } from '../api/types'
import { DAY_NAMES, MEAL_TYPES } from '../api/types'
import {
  getMacroTargets,
  getMealTargetCalories,
  getDaySummary,
  isExerciseDay,
  getExerciseDayLabel,
} from '../utils/nutrition'
import MealSection from '../components/MealSection'

function emptyDayPlan(personName: string, dayOfWeek: number): DayPlan {
  return {
    person_name: personName,
    day_of_week: dayOfWeek,
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
  const [personWeekData, setPersonWeekData] = useState<WeekPlanRow[]>([])
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

    const [personsRes, foodsRes, planRes, allRes] = await Promise.all([
      getPersons(),
      getFoods(),
      getWeekPlans(personName, weekId),
      getAllPersonsWeekData(weekId),
    ])

    if (personsRes.error) { setError(personsRes.error); setLoading(false); return }
    if (foodsRes.error) { setError(foodsRes.error); setLoading(false); return }
    if (planRes.error) { setError(planRes.error); setLoading(false); return }
    if (allRes.error) { setError(allRes.error); setLoading(false); return }

    const foundPerson = personsRes.data.find((p) => p.name === personName)
    if (!foundPerson) { setError(`找不到人員：${personName}`); setLoading(false); return }

    setPerson(foundPerson)
    setCustomFoods(foodsRes.data)
    setPersonWeekData(planRes.data)
    setAllWeekData(allRes.data)

    const dayRow = planRes.data.find((r) => r.day_of_week === dayOfWeek)
    const loaded = dayRow ? dayRow.data : emptyDayPlan(personName, dayOfWeek)
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

  if (loading) return <p>載入中...</p>
  if (!person) return <p>{error ?? '找不到人員資料'}</p>

  const macros = getMacroTargets(person, dayOfWeek)
  const summary = getDaySummary(person, dayPlan, dayOfWeek)
  const exerciseDay = isExerciseDay(person, dayOfWeek)
  const exerciseLabel = getExerciseDayLabel(person, dayOfWeek)

  // Build person week meals for history tab: dayOfWeek -> mealType -> Meal
  const personWeekMeals: Record<number, Record<string, Meal>> = {}
  for (const row of personWeekData) {
    if (row.day_of_week !== dayOfWeek) {
      personWeekMeals[row.day_of_week] = row.data.meals
    }
  }

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

      {/* 4-column stats */}
      <div className="day-editor-stats">
        <div className="stat-card">
          <div className="stat-label">目標熱量</div>
          <div className="stat-value">{macros.total_kcal} kcal</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">蛋白質目標</div>
          <div className="stat-value">{macros.protein_g}g</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">澱粉目標</div>
          <div className="stat-value">{macros.carbs_g}g</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">脂肪目標</div>
          <div className="stat-value">{macros.fat_g}g</div>
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
              suggestedKcal={getMealTargetCalories(person, dayOfWeek, key)}
              customFoods={customFoods}
              personWeekMeals={personWeekMeals}
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
