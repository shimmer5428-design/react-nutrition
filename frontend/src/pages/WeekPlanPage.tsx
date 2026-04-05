import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../api/supabase'
import { Person, PersonRow, DayPlan, FoodItem, FoodRow, WeekPlanRow, MEAL_TYPES, FOOD_CATEGORIES } from '../api/types'
import PersonSelector from '../components/PersonSelector'
import WeekPlanGrid from '../components/WeekPlanGrid'

function currentWeekId(): string {
  const now = new Date()
  const jan1 = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000)
  const week = Math.ceil((days + jan1.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function emptyDays(personName: string): DayPlan[] {
  return Array.from({ length: 7 }, (_, i) => ({
    person_name: personName,
    day_of_week: i,
    meals: Object.fromEntries(
      MEAL_TYPES.map(([key]) => [key, { meal_type: key, items: [] }])
    ),
  }))
}

export default function WeekPlanPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [weekId, setWeekId] = useState(currentWeekId())
  const [days, setDays] = useState<DayPlan[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Add-food form state
  const [addDay, setAddDay] = useState(0)
  const [addMeal, setAddMeal] = useState(MEAL_TYPES[0][0])
  const [addFoodName, setAddFoodName] = useState('')
  const [addAmount, setAddAmount] = useState(100)

  useEffect(() => {
    async function loadPersons() {
      const { data } = await supabase.from('persons').select('*').order('name')
      if (data) setPersons((data as PersonRow[]).map((r) => r.data))
    }
    async function loadFoods() {
      const { data } = await supabase.from('custom_foods').select('*').order('name')
      if (data) setFoods((data as FoodRow[]).map((r) => r.data))
    }
    loadPersons()
    loadFoods()
  }, [])

  const loadPlan = useCallback(async () => {
    if (!selectedPerson) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('week_plans')
      .select('*')
      .eq('week_id', weekId)
      .eq('person_name', selectedPerson)
      .order('day_of_week')

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const rows = data as WeekPlanRow[]
    if (rows.length === 0) {
      setDays(emptyDays(selectedPerson))
    } else {
      const loaded = emptyDays(selectedPerson)
      for (const row of rows) {
        if (row.day_of_week >= 0 && row.day_of_week < 7) {
          loaded[row.day_of_week] = row.data
        }
      }
      setDays(loaded)
    }
    setLoading(false)
  }, [selectedPerson, weekId])

  useEffect(() => {
    if (selectedPerson) loadPlan()
  }, [selectedPerson, weekId, loadPlan])

  async function handleSave() {
    if (!selectedPerson) return
    setError(null)
    setSuccess(null)

    const rows = days.map((day, i) => ({
      week_id: weekId,
      person_name: selectedPerson,
      day_of_week: i,
      data: day,
    }))

    const { error: err } = await supabase
      .from('week_plans')
      .upsert(rows, { onConflict: 'week_id,person_name,day_of_week' })

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Week plan saved!')
    }
  }

  function handleAddItem() {
    const food = foods.find((f) => f.name === addFoodName)
    if (!food) {
      setError('Please select a food')
      return
    }
    // Scale the food to the requested amount
    const ratio = food.amount ? addAmount / food.amount : 1
    const scaled: FoodItem = {
      name: food.name,
      amount: addAmount,
      unit: food.unit,
      protein_g: Math.round(food.protein_g * ratio * 10) / 10,
      carbs_g: Math.round(food.carbs_g * ratio * 10) / 10,
      fat_g: Math.round(food.fat_g * ratio * 10) / 10,
      calories: Math.round(food.calories * ratio * 10) / 10,
      category: food.category,
    }

    const updated = [...days]
    const day = { ...updated[addDay] }
    const meals = { ...day.meals }
    const meal = meals[addMeal] ? { ...meals[addMeal] } : { meal_type: addMeal, items: [] }
    meal.items = [...meal.items, scaled]
    meals[addMeal] = meal
    day.meals = meals
    updated[addDay] = day
    setDays(updated)
    setError(null)
  }

  function handleRemoveItem(dayIndex: number, mealType: string, itemIndex: number) {
    const updated = [...days]
    const day = { ...updated[dayIndex] }
    const meals = { ...day.meals }
    const meal = { ...meals[mealType] }
    meal.items = meal.items.filter((_, i) => i !== itemIndex)
    meals[mealType] = meal
    day.meals = meals
    updated[dayIndex] = day
    setDays(updated)
  }

  const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div>
      <h1>Week Plan</h1>

      {error && <div className="status error">{error}</div>}
      {success && <div className="status success">{success}</div>}

      <div className="card">
        <div className="form-row">
          <PersonSelector
            persons={persons}
            selected={selectedPerson}
            onSelect={setSelectedPerson}
          />
          <div className="form-group">
            <label>Week ID</label>
            <input value={weekId} onChange={(e) => setWeekId(e.target.value)} placeholder="YYYY-WNN" />
          </div>
          <button className="primary" onClick={handleSave} disabled={!selectedPerson}>
            Save Week Plan
          </button>
        </div>
      </div>

      {selectedPerson && (
        <div className="card">
          <h2>Add Food to Meal</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Day</label>
              <select value={addDay} onChange={(e) => setAddDay(+e.target.value)}>
                {DAY_NAMES_SHORT.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Meal</label>
              <select value={addMeal} onChange={(e) => setAddMeal(e.target.value)}>
                {MEAL_TYPES.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Food</label>
              <select value={addFoodName} onChange={(e) => setAddFoodName(e.target.value)}>
                <option value="">Select food...</option>
                {foods.map((f) => (
                  <option key={f.name} value={f.name}>{f.name} ({f.calories} cal / {f.amount}{f.unit})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="number" value={addAmount} onChange={(e) => setAddAmount(+e.target.value)} style={{ width: 80 }} />
            </div>
            <button className="primary" onClick={handleAddItem}>Add</button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading plan...</p>
      ) : (
        <WeekPlanGrid
          days={days}
          onAddItem={() => {}}
          onRemoveItem={handleRemoveItem}
        />
      )}
    </div>
  )
}
