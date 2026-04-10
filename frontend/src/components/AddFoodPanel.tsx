import { useRef, useState } from 'react'
import type { FoodItem, Meal } from '../api/types'
import { BUILTIN_FOODS, CATEGORY_LABELS, getFoodsByCategory } from '../api/foodDatabase'
import { analyzeFood } from '../api/gemini'

interface Props {
  customFoods: FoodItem[]
  /** personWeekMeals: dayOfWeek -> mealType -> Meal */
  personWeekMeals: Record<number, Record<string, Meal>>
  /** familyDayMeals: other persons' meals for same day */
  familyDayMeals: { personName: string; meals: Record<string, Meal> }[]
  currentPersonName: string
  currentDayOfWeek: number
  mealType: string
  onAdd: (item: FoodItem) => void
}

type Tab = 'builtin' | 'custom' | 'history' | 'family' | 'ai'

const TAB_LABELS: [Tab, string][] = [
  ['builtin', '內建食材'],
  ['custom', '自訂食材'],
  ['history', '歷史帶入'],
  ['family', '家人同餐'],
  ['ai', '外食 AI'],
]

function scaleFood(food: FoodItem, qty: number): FoodItem {
  const ratio = food.amount > 0 ? qty / food.amount : 1
  return {
    ...food,
    amount: qty,
    protein_g: Math.round(food.protein_g * ratio * 10) / 10,
    carbs_g: Math.round(food.carbs_g * ratio * 10) / 10,
    fat_g: Math.round(food.fat_g * ratio * 10) / 10,
    calories: Math.round(food.calories * ratio * 10) / 10,
  }
}

export default function AddFoodPanel({
  customFoods,
  personWeekMeals,
  familyDayMeals,
  currentPersonName,
  currentDayOfWeek,
  mealType,
  onAdd,
}: Props) {
  const [tab, setTab] = useState<Tab>('builtin')

  // Builtin state
  const [category, setCategory] = useState('protein')
  const [selectedFood, setSelectedFood] = useState<string>('')
  const [qty, setQty] = useState(1)

  // Custom state
  const [customSelected, setCustomSelected] = useState<string>('')
  const [customQty, setCustomQty] = useState(1)

  // AI state
  const [aiDesc, setAiDesc] = useState('')
  const [aiImageBase64, setAiImageBase64] = useState<string | undefined>()
  const [aiImageMime, setAiImageMime] = useState<string | undefined>()
  const [aiImagePreview, setAiImagePreview] = useState<string | undefined>()
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResults, setAiResults] = useState<FoodItem[]>([])
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categoryKeys = Object.keys(CATEGORY_LABELS)
  const filteredFoods = getFoodsByCategory(category)
  const chosen = BUILTIN_FOODS.find((f) => f.name === selectedFood)
  const chosenCustom = customFoods.find((f) => f.name === customSelected)

  // History: collect unique foods from same meal type, past 3 days only
  const historyFoods: FoodItem[] = []
  const seenHistory = new Set<string>()
  const pastThreeDays = [currentDayOfWeek - 1, currentDayOfWeek - 2, currentDayOfWeek - 3].filter(d => d >= 0)
  for (const day of pastThreeDays) {
    const dayMeals = personWeekMeals[day]
    if (!dayMeals) continue
    const meal = dayMeals[mealType]
    if (!meal) continue
    for (const item of meal.items) {
      if (!seenHistory.has(item.name)) {
        seenHistory.add(item.name)
        historyFoods.push(item)
      }
    }
  }

  // Family: collect meals from other persons for same day & same meal type
  const familyOptions: { personName: string; items: FoodItem[] }[] = []
  for (const fm of familyDayMeals) {
    if (fm.personName === currentPersonName) continue
    const meal = fm.meals[mealType]
    if (meal && meal.items.length > 0) {
      familyOptions.push({ personName: fm.personName, items: meal.items })
    }
  }

  function handleAddBuiltin() {
    if (!chosen) return
    onAdd(scaleFood(chosen, qty))
    setQty(1)
    setSelectedFood('')
  }

  function handleAddCustom() {
    if (!chosenCustom) return
    onAdd(scaleFood(chosenCustom, customQty))
    setCustomQty(1)
    setCustomSelected('')
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      // dataUrl = "data:image/jpeg;base64,/9j/..."
      const [header, base64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      setAiImageBase64(base64)
      setAiImageMime(mime)
      setAiImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setAiImageBase64(undefined)
    setAiImageMime(undefined)
    setAiImagePreview(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleAiAnalyze() {
    if (!aiDesc.trim() && !aiImageBase64) {
      setAiError('請輸入描述或上傳照片')
      return
    }
    setAiLoading(true)
    setAiError(null)
    setAiResults([])
    setAiSelected(new Set())
    try {
      const items = await analyzeFood(aiDesc, aiImageBase64, aiImageMime)
      setAiResults(items)
      setAiSelected(new Set(items.map((_, i) => i)))
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 分析失敗，請再試一次')
    } finally {
      setAiLoading(false)
    }
  }

  function toggleAiSelect(idx: number) {
    setAiSelected(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  function handleAiAddSelected() {
    for (const idx of aiSelected) {
      const item = aiResults[idx]
      if (item) onAdd({ ...item })
    }
    setAiResults([])
    setAiSelected(new Set())
    setAiDesc('')
    clearImage()
  }

  return (
    <div className="add-food-panel">
      <div className="add-food-tabs">
        {TAB_LABELS.map(([key, label]) => (
          <button
            key={key}
            className={`add-food-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Builtin ── */}
      {tab === 'builtin' && (
        <div className="add-food-tab-content">
          <div className="add-food-row">
            <div className="form-group">
              <label>分類</label>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSelectedFood('') }}>
                {categoryKeys.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>食材</label>
              <select value={selectedFood} onChange={(e) => { setSelectedFood(e.target.value); const f = BUILTIN_FOODS.find(x => x.name === e.target.value); if (f) setQty(f.amount) }}>
                <option value="">選擇食材...</option>
                {filteredFoods.map((f) => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {chosen && (
            <div className="add-food-detail">
              <div className="add-food-baseline">
                基準份量：{chosen.amount}{chosen.unit} -- 蛋白 {chosen.protein_g}g / 澱粉 {chosen.carbs_g}g / 脂肪 {chosen.fat_g}g / {chosen.calories}cal
              </div>
              <div className="add-food-qty-row">
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                <input
                  type="number"
                  className="qty-input"
                  value={qty}
                  onChange={(e) => setQty(Math.max(0, +e.target.value))}
                />
                <span>{chosen.unit}</span>
                <button className="qty-btn" onClick={() => setQty(qty + 1)}>+</button>
                <button className="primary add-btn" onClick={handleAddBuiltin}>新增</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Custom ── */}
      {tab === 'custom' && (
        <div className="add-food-tab-content">
          {customFoods.length === 0 ? (
            <p className="meal-empty">尚無自訂食材。請至「Custom Foods」頁面新增。</p>
          ) : (
            <>
              <div className="add-food-row">
                <div className="form-group">
                  <label>自訂食材</label>
                  <select value={customSelected} onChange={(e) => { setCustomSelected(e.target.value); const f = customFoods.find(x => x.name === e.target.value); if (f) setCustomQty(f.amount) }}>
                    <option value="">選擇食材...</option>
                    {customFoods.map((f) => (
                      <option key={f.name} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {chosenCustom && (
                <div className="add-food-detail">
                  <div className="add-food-baseline">
                    基準份量：{chosenCustom.amount}{chosenCustom.unit} -- 蛋白 {chosenCustom.protein_g}g / 澱粉 {chosenCustom.carbs_g}g / 脂肪 {chosenCustom.fat_g}g / {chosenCustom.calories}cal
                  </div>
                  <div className="add-food-qty-row">
                    <button className="qty-btn" onClick={() => setCustomQty(Math.max(1, customQty - 1))}>-</button>
                    <input type="number" className="qty-input" value={customQty} onChange={(e) => setCustomQty(Math.max(0, +e.target.value))} />
                    <span>{chosenCustom.unit}</span>
                    <button className="qty-btn" onClick={() => setCustomQty(customQty + 1)}>+</button>
                    <button className="primary add-btn" onClick={handleAddCustom}>新增</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── History ── */}
      {tab === 'history' && (
        <div className="add-food-tab-content">
          {historyFoods.length === 0 ? (
            <p className="meal-empty">前三天同一餐尚無食材紀錄。</p>
          ) : (
            <div className="history-food-list">
              {historyFoods.map((f) => (
                <div key={f.name} className="history-food-item">
                  <span>{f.name} ({f.amount}{f.unit}) - {Math.round(f.calories)}cal</span>
                  <button className="primary add-btn" onClick={() => onAdd({ ...f })}>帶入</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Family ── */}
      {tab === 'family' && (
        <div className="add-food-tab-content">
          {familyOptions.length === 0 ? (
            <p className="meal-empty">其他家人今日此餐尚無資料。</p>
          ) : (
            <div className="family-food-list">
              {familyOptions.map((fo) => (
                <div key={fo.personName} className="family-person-block">
                  <h4>{fo.personName} 的此餐</h4>
                  {fo.items.map((item, idx) => (
                    <div key={idx} className="history-food-item">
                      <span>{item.name} ({item.amount}{item.unit}) - {Math.round(item.calories)}cal</span>
                      <button className="primary add-btn" onClick={() => onAdd({ ...item })}>帶入</button>
                    </div>
                  ))}
                  <button
                    className="primary"
                    style={{ marginTop: 4 }}
                    onClick={() => {
                      for (const item of fo.items) {
                        onAdd({ ...item })
                      }
                    }}
                  >
                    全部帶入
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI 外食分析 ── */}
      {tab === 'ai' && (
        <div className="add-food-tab-content">
          <div className="ai-analyze-panel">
            <div className="form-group">
              <label>描述你吃了什麼</label>
              <textarea
                className="ai-desc-input"
                rows={3}
                placeholder="例：麥當勞大麥克套餐、中薯、無糖可樂；或是便當：雞腿、白飯、炒青菜"
                value={aiDesc}
                onChange={(e) => setAiDesc(e.target.value)}
                disabled={aiLoading}
              />
            </div>

            <div className="ai-image-row">
              <button
                className="ai-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={aiLoading}
              >
                {aiImagePreview ? '換一張照片' : '上傳照片（選填）'}
              </button>
              {aiImagePreview && (
                <button className="ai-clear-img-btn" onClick={clearImage} disabled={aiLoading}>
                  移除
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>

            {aiImagePreview && (
              <img src={aiImagePreview} alt="預覽" className="ai-image-preview" />
            )}

            <button
              className="primary ai-analyze-btn"
              onClick={handleAiAnalyze}
              disabled={aiLoading || (!aiDesc.trim() && !aiImageBase64)}
            >
              {aiLoading ? 'AI 分析中...' : 'AI 分析'}
            </button>

            {aiError && <p className="ai-error">{aiError}</p>}

            {aiResults.length > 0 && (
              <div className="ai-results">
                <p className="ai-results-hint">勾選要帶入的食材：</p>
                {aiResults.map((item, idx) => (
                  <label key={idx} className="ai-result-item">
                    <input
                      type="checkbox"
                      checked={aiSelected.has(idx)}
                      onChange={() => toggleAiSelect(idx)}
                    />
                    <span>
                      {item.name} {item.amount}{item.unit} — 蛋白 {item.protein_g}g / 澱粉 {item.carbs_g}g / 脂肪 {item.fat_g}g / {Math.round(item.calories)}cal
                    </span>
                  </label>
                ))}
                <button
                  className="primary"
                  style={{ marginTop: 8 }}
                  disabled={aiSelected.size === 0}
                  onClick={handleAiAddSelected}
                >
                  帶入勾選食材（{aiSelected.size} 項）
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
