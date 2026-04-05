import { useEffect, useState } from 'react'
import { supabase } from '../api/supabase'
import { Person, PersonRow } from '../api/types'

const EMPTY_PERSON: Person = {
  name: '',
  weight_kg: 60,
  height_cm: 165,
  age: 30,
  gender: 'male',
  activity_level: 'moderate',
  calorie_plan: 'maintain',
  exercise_days: [],
  exercise_bonus: 0.10,
  tdee_manual: null,
}

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [form, setForm] = useState<Person>({ ...EMPTY_PERSON })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('persons')
      .select('*')
      .order('name')
    if (err) {
      setError(err.message)
    } else {
      setPersons((data as PersonRow[]).map((r) => r.data))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    setError(null)
    setSuccess(null)
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    const { error: err } = await supabase
      .from('persons')
      .upsert({ name: form.name, data: form }, { onConflict: 'name' })
    if (err) {
      setError(err.message)
    } else {
      setSuccess(`Saved "${form.name}"`)
      setForm({ ...EMPTY_PERSON })
      load()
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete person "${name}"?`)) return
    const { error: err } = await supabase
      .from('persons')
      .delete()
      .eq('name', name)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(`Deleted "${name}"`)
      load()
    }
  }

  function handleEdit(person: Person) {
    setForm({ ...person })
    setSuccess(null)
    setError(null)
  }

  return (
    <div>
      <h1>Persons</h1>

      {error && <div className="status error">{error}</div>}
      {success && <div className="status success">{success}</div>}

      <div className="card">
        <h2>{form.name && persons.some(p => p.name === form.name) ? 'Edit' : 'Add'} Person</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: +e.target.value })} />
          </div>
          <div className="form-group">
            <label>Height (cm)</label>
            <input type="number" value={form.height_cm ?? ''} onChange={(e) => setForm({ ...form, height_cm: e.target.value ? +e.target.value : null })} />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" value={form.age ?? ''} onChange={(e) => setForm({ ...form, age: e.target.value ? +e.target.value : null })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Gender</label>
            <select value={form.gender ?? ''} onChange={(e) => setForm({ ...form, gender: e.target.value || null })}>
              <option value="">--</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="form-group">
            <label>Activity Level</label>
            <select value={form.activity_level ?? ''} onChange={(e) => setForm({ ...form, activity_level: e.target.value || null })}>
              <option value="">--</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>
          <div className="form-group">
            <label>Calorie Plan</label>
            <select value={form.calorie_plan ?? 'maintain'} onChange={(e) => setForm({ ...form, calorie_plan: e.target.value })}>
              <option value="deficit">Deficit</option>
              <option value="maintain">Maintain</option>
              <option value="surplus">Surplus</option>
            </select>
          </div>
          <div className="form-group">
            <label>TDEE (manual)</label>
            <input type="number" value={form.tdee_manual ?? ''} onChange={(e) => setForm({ ...form, tdee_manual: e.target.value ? +e.target.value : null })} />
          </div>
        </div>
        <button className="primary" onClick={handleSave}>Save Person</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Weight</th>
              <th>Height</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Activity</th>
              <th>Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {persons.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.weight_kg} kg</td>
                <td>{p.height_cm ?? '-'} cm</td>
                <td>{p.age ?? '-'}</td>
                <td>{p.gender ?? '-'}</td>
                <td>{p.activity_level ?? '-'}</td>
                <td>{p.calorie_plan}</td>
                <td>
                  <button className="primary" style={{ marginRight: 8 }} onClick={() => handleEdit(p)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(p.name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
