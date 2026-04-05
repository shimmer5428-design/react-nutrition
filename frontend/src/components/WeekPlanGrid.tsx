import { DAY_NAMES, MEAL_TYPES, DayPlan, FoodItem } from '../api/types'

interface Props {
  days: DayPlan[]
  onAddItem: (dayIndex: number, mealType: string, item: FoodItem) => void
  onRemoveItem: (dayIndex: number, mealType: string, itemIndex: number) => void
}

function mealTotals(items: FoodItem[]) {
  return {
    protein: items.reduce((s, i) => s + i.protein_g, 0).toFixed(1),
    carbs: items.reduce((s, i) => s + i.carbs_g, 0).toFixed(1),
    fat: items.reduce((s, i) => s + i.fat_g, 0).toFixed(1),
    cal: items.reduce((s, i) => s + i.calories, 0).toFixed(0),
  }
}

export default function WeekPlanGrid({ days, onRemoveItem }: Props) {
  if (days.length === 0) {
    return <p style={{ color: '#9ca3af' }}>No plan loaded. Select a person and week.</p>
  }

  return (
    <div>
      {days.map((day, dayIdx) => {
        const dayTotal = {
          protein: 0, carbs: 0, fat: 0, cal: 0,
        }
        return (
          <div key={dayIdx} className="card">
            <h2>{DAY_NAMES[dayIdx] ?? `Day ${dayIdx}`}</h2>
            {MEAL_TYPES.map(([mealKey, mealLabel]) => {
              const meal = day.meals?.[mealKey]
              const items = meal?.items ?? []
              const totals = mealTotals(items)
              dayTotal.protein += parseFloat(totals.protein)
              dayTotal.carbs += parseFloat(totals.carbs)
              dayTotal.fat += parseFloat(totals.fat)
              dayTotal.cal += parseFloat(totals.cal)

              return (
                <div key={mealKey} className="meal-section">
                  <h3>{mealLabel}</h3>
                  {items.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Food</th>
                          <th>Amount</th>
                          <th>P (g)</th>
                          <th>C (g)</th>
                          <th>F (g)</th>
                          <th>Cal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, itemIdx) => (
                          <tr key={itemIdx}>
                            <td>{item.name}</td>
                            <td>{item.amount} {item.unit}</td>
                            <td>{item.protein_g}</td>
                            <td>{item.carbs_g}</td>
                            <td>{item.fat_g}</td>
                            <td>{item.calories}</td>
                            <td>
                              <button
                                className="danger"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => onRemoveItem(dayIdx, mealKey, itemIdx)}
                              >
                                X
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>No items</p>
                  )}
                  {items.length > 0 && (
                    <div className="nutrition-summary">
                      Protein: <span>{totals.protein}g</span>
                      Carbs: <span>{totals.carbs}g</span>
                      Fat: <span>{totals.fat}g</span>
                      Calories: <span>{totals.cal}</span>
                    </div>
                  )}
                </div>
              )
            })}
            <div className="nutrition-summary" style={{ fontWeight: 600, borderTop: '2px solid #e5e7eb', paddingTop: '12px' }}>
              Day Total -- Protein: <span>{dayTotal.protein.toFixed(1)}g</span>
              Carbs: <span>{dayTotal.carbs.toFixed(1)}g</span>
              Fat: <span>{dayTotal.fat.toFixed(1)}g</span>
              Calories: <span>{dayTotal.cal.toFixed(0)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
