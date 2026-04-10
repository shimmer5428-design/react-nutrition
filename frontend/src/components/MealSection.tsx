import { useState } from 'react'
import type { FoodItem, Meal } from '../api/types'
import { mealItemTotals } from '../utils/nutrition'
import AddFoodPanel from './AddFoodPanel'

interface Props {
  mealType: string
  mealLabel: string
  meal: Meal
  suggestedKcal: number
  customFoods: FoodItem[]
  /** All day plans for this person this week (for history tab) */
  personWeekMeals: Record<number, Record<string, Meal>>
  /** All persons' meals for this day (for family tab) */
  familyDayMeals: { personName: string; meals: Record<string, Meal> }[]
  currentPersonName: string
  currentDayOfWeek: number
  onUpdateItemAmount: (itemIndex: number, newAmount: number) => void
  onRemoveItem: (itemIndex: number) => void
  onAddItem: (item: FoodItem) => void
}

interface ItemRowProps {
  idx: number
  name: string
  amount: number
  unit: string
  protein: number
  carbs: number
  fat: number
  calories: number
  onUpdate: (idx: number, val: number) => void
  onRemove: (idx: number) => void
}

function ItemRow({ idx, name, amount, unit, protein, carbs, fat, calories, onUpdate, onRemove }: ItemRowProps) {
  const [draft, setDraft] = useState(String(amount))

  // sync external amount changes (e.g. after save)
  const displayVal = draft

  function commit() {
    const parsed = parseFloat(draft)
    if (!isNaN(parsed) && parsed > 0) {
      onUpdate(idx, parsed)
    } else {
      setDraft(String(amount)) // revert
    }
  }

  return (
    <tr>
      <td>{name}</td>
      <td>
        <div className="meal-item-qty">
          <input
            type="number"
            className="qty-input"
            min="0.1"
            step="0.1"
            value={displayVal}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
          />
          <span className="qty-unit">{unit}</span>
        </div>
      </td>
      <td>{protein}</td>
      <td>{carbs}</td>
      <td>{fat}</td>
      <td>{Math.round(calories)}</td>
      <td>
        <button className="qty-btn delete-btn" onClick={() => onRemove(idx)}>×</button>
      </td>
    </tr>
  )
}

export default function MealSection({
  mealLabel,
  meal,
  suggestedKcal,
  customFoods,
  personWeekMeals,
  familyDayMeals,
  currentPersonName,
  currentDayOfWeek,
  onUpdateItemAmount,
  onRemoveItem,
  onAddItem,
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const items = meal.items
  const totals = mealItemTotals(items)

  return (
    <div className="meal-accordion">
      <div className="meal-accordion-header" onClick={() => setExpanded(!expanded)}>
        <span className="meal-accordion-arrow">{expanded ? '\u25BC' : '\u25B6'}</span>
        <span className="meal-accordion-title">
          {mealLabel} -- 實際 {Math.round(totals.cal)}kcal（建議 {suggestedKcal}kcal）
        </span>
      </div>

      {expanded && (
        <div className="meal-accordion-body">
          {items.length > 0 ? (
            <table className="meal-items-table">
              <thead>
                <tr>
                  <th>食材</th>
                  <th>份量</th>
                  <th>蛋白(g)</th>
                  <th>澱粉(g)</th>
                  <th>脂肪(g)</th>
                  <th>熱量</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <ItemRow
                    key={idx}
                    idx={idx}
                    name={item.name}
                    amount={item.amount}
                    unit={item.unit}
                    protein={item.protein_g}
                    carbs={item.carbs_g}
                    fat={item.fat_g}
                    calories={item.calories}
                    onUpdate={onUpdateItemAmount}
                    onRemove={onRemoveItem}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <p className="meal-empty">尚無食材</p>
          )}

          {items.length > 0 && (
            <div className="meal-subtotal">
              小計：蛋白 {totals.protein.toFixed(1)}g / 澱粉 {totals.carbs.toFixed(1)}g / 脂肪 {totals.fat.toFixed(1)}g / {Math.round(totals.cal)} kcal
            </div>
          )}

          <div className="meal-add-toggle">
            <button
              className="add-food-toggle-btn"
              onClick={() => setAddOpen(!addOpen)}
            >
              {addOpen ? '- 收起' : '+ 新增食材'}
            </button>
          </div>

          {addOpen && (
            <AddFoodPanel
              customFoods={customFoods}
              personWeekMeals={personWeekMeals}
              familyDayMeals={familyDayMeals}
              currentPersonName={currentPersonName}
              currentDayOfWeek={currentDayOfWeek}
              mealType={meal.meal_type}
              onAdd={(item) => {
                onAddItem(item)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
