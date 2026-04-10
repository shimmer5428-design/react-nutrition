import { useEffect, useState } from 'react'
import { getPersons, upsertPerson, deletePerson as deletePersonApi } from '../api/db'
import { Person } from '../api/types'

const EMPTY_PERSON: Person = {
  name: '',
  weight_kg: 60,
  height_cm: 165,
  age: 30,
  gender: 'male',
  activity_level: 'moderate',
  calorie_plan: 'maintain',
  exercise_days: [],
  exercise_bonus: 0.05,
  tdee_manual: null,
}

const DAY_LABELS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [form, setForm] = useState<Person>({ ...EMPTY_PERSON })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data, error: err } = await getPersons()
    if (err) {
      setError(err)
    } else {
      setPersons(data)
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
    const { error: err } = await upsertPerson(form.name, form)
    if (err) {
      setError(err)
    } else {
      setSuccess(`Saved "${form.name}"`)
      setForm({ ...EMPTY_PERSON })
      load()
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete family member "${name}"?`)) return
    const { error: err } = await deletePersonApi(name)
    if (err) {
      setError(err)
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
      <h1>Family Members</h1>

      {error && <div className="status error">{error}</div>}
      {success && <div className="status success">{success}</div>}

      <div className="card">
        <h2>{form.name && persons.some(p => p.name === form.name) ? 'Edit' : 'Add'} Family Member</h2>
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
            <label>TDEE (手動填入，留空自動計算)</label>
            <input type="number" value={form.tdee_manual ?? ''} onChange={(e) => setForm({ ...form, tdee_manual: e.target.value ? +e.target.value : null })} />
          </div>
          <div className="form-group">
            <label>運動日熱量加成 (%)</label>
            <input
              type="number"
              min="0"
              max="50"
              step="1"
              value={Math.round((form.exercise_bonus ?? 0.05) * 100)}
              onChange={(e) => setForm({ ...form, exercise_bonus: (e.target.value ? +e.target.value : 5) / 100 })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>運動日（勾選）</label>
            <div className="exercise-days-checkboxes">
              {DAY_LABELS.map((label, idx) => (
                <label key={idx} className="exercise-day-check">
                  <input
                    type="checkbox"
                    checked={(form.exercise_days ?? []).includes(idx)}
                    onChange={(e) => {
                      const days = new Set(form.exercise_days ?? [])
                      e.target.checked ? days.add(idx) : days.delete(idx)
                      setForm({ ...form, exercise_days: Array.from(days).sort() })
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button className="primary" onClick={handleSave}>儲存</button>
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
