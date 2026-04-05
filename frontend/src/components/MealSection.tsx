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
  onUpdateItemAmount: (itemIndex: number, newAmount: number) => void
  onRemoveItem: (itemIndex: number) => void
  onAddItem: (item: FoodItem) => void
}

export default function MealSection({
  mealLabel,
  meal,
  suggestedKcal,
  customFoods,
  personWeekMeals,
  familyDayMeals,
  currentPersonName,
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
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>
                      <div className="meal-item-qty">
                        <button
                          className="qty-btn"
                          onClick={() => {
                            if (item.amount > 1) {
                              onUpdateItemAmount(idx, item.amount - 1)
                            }
                          }}
                        >
                          -
                        </button>
                        <span>{item.amount} {item.unit}</span>
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateItemAmount(idx, item.amount + 1)}
                        >
                          +
                        </button>
                        <button
                          className="qty-btn update-btn"
                          onClick={() => onUpdateItemAmount(idx, item.amount)}
                        >
                          更新
                        </button>
                        <button
                          className="qty-btn delete-btn"
                          onClick={() => onRemoveItem(idx)}
                        >
                          x
                        </button>
                      </div>
                    </td>
                    <td>{item.protein_g}</td>
                    <td>{item.carbs_g}</td>
                    <td>{item.fat_g}</td>
                    <td>{Math.round(item.calories)}</td>
                    <td></td>
                  </tr>
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
