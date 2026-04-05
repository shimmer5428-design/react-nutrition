import { useEffect, useState } from 'react'
import { supabase } from '../api/supabase'
import { FoodItem, FoodRow, FOOD_CATEGORIES } from '../api/types'
import FoodTable from '../components/FoodTable'

const EMPTY_FOOD: FoodItem = {
  name: '',
  amount: 100,
  unit: 'g',
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  calories: 0,
  category: 'custom',
}

export default function FoodsPage() {
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [form, setForm] = useState<FoodItem>({ ...EMPTY_FOOD })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('custom_foods')
      .select('*')
      .order('name')
    if (err) {
      setError(err.message)
    } else {
      setFoods((data as FoodRow[]).map((r) => r.data))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    setError(null)
    setSuccess(null)
    if (!form.name.trim()) {
      setError('Food name is required')
      return
    }
    const { error: err } = await supabase
      .from('custom_foods')
      .upsert({ name: form.name, data: form }, { onConflict: 'name' })
    if (err) {
      setError(err.message)
    } else {
      setSuccess(`Saved "${form.name}"`)
      setForm({ ...EMPTY_FOOD })
      load()
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete food "${name}"?`)) return
    const { error: err } = await supabase
      .from('custom_foods')
      .delete()
      .eq('name', name)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(`Deleted "${name}"`)
      load()
    }
  }

  return (
    <div>
      <h1>Custom Foods</h1>

      {error && <div className="status error">{error}</div>}
      {success && <div className="status success">{success}</div>}

      <div className="card">
        <h2>Add / Edit Food</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Protein (g)</label>
            <input type="number" step="0.1" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: +e.target.value })} />
          </div>
          <div className="form-group">
            <label>Carbs (g)</label>
            <input type="number" step="0.1" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: +e.target.value })} />
          </div>
          <div className="form-group">
            <label>Fat (g)</label>
            <input type="number" step="0.1" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: +e.target.value })} />
          </div>
          <div className="form-group">
            <label>Calories</label>
            <input type="number" step="1" value={form.calories} onChange={(e) => setForm({ ...form, calories: +e.target.value })} />
          </div>
        </div>
        <button className="primary" onClick={handleSave}>Save Food</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <FoodTable foods={foods} onDelete={handleDelete} />
      )}
    </div>
  )
}
