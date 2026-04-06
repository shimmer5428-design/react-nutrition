import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPersons, getAllPersonsWeekData } from '../api/db'
import type { Person, DayPlan, WeekPlanRow } from '../api/types'
import { DAY_NAMES, MEAL_TYPES } from '../api/types'
import { getDaySummary } from '../utils/nutrition'
import DayCard from '../components/DayCard'

function currentWeekId(): string {
  // ISO 8601: week 1 = week containing first Thursday; weeks start on Monday
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)) // shift to Thursday of this week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function emptyDayPlan(personName: string, dayOfWeek: number): DayPlan {
  return {
    person_name: personName,
    day_of_week: dayOfWeek,
    meals: Object.fromEntries(
      MEAL_TYPES.map(([key]) => [key, { meal_type: key, items: [] }])
    ),
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [persons, setPersons] = useState<Person[]>([])
  const [weekId, setWeekId] = useState(currentWeekId())
  const [weekData, setWeekData] = useState<WeekPlanRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [personsResult, weekResult] = await Promise.all([
      getPersons(),
      getAllPersonsWeekData(weekId),
    ])
    if (personsResult.error) { setError(personsResult.error); setLoading(false); return }
    if (weekResult.error) { setError(weekResult.error); setLoading(false); return }
    setPersons(personsResult.data)
    setWeekData(weekResult.data)
    setLoading(false)
  }, [weekId])

  useEffect(() => { load() }, [load])

  // Build lookup: personName -> dayOfWeek -> DayPlan
  const planMap: Record<string, Record<number, DayPlan>> = {}
  for (const row of weekData) {
    if (!planMap[row.person_name]) planMap[row.person_name] = {}
    planMap[row.person_name][row.day_of_week] = row.data
  }

  function handlePrevWeek() {
    const match = weekId.match(/^(\d{4})-W(\d{2})$/)
    if (!match) return
    let year = parseInt(match[1])
    let week = parseInt(match[2]) - 1
    if (week < 1) { year--; week = 52 }
    setWeekId(`${year}-W${String(week).padStart(2, '0')}`)
  }

  function handleNextWeek() {
    const match = weekId.match(/^(\d{4})-W(\d{2})$/)
    if (!match) return
    let year = parseInt(match[1])
    let week = parseInt(match[2]) + 1
    if (week > 52) { year++; week = 1 }
    setWeekId(`${year}-W${String(week).padStart(2, '0')}`)
  }

  return (
    <div>
      <h1>本週飲食總覽</h1>

      <div className="dashboard-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#22c55e' }} /> 達標</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /> 不足</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#f97316' }} /> 超標</span>
        <span className="legend-item">{'\uD83C\uDFC6'} 運動日</span>
      </div>

      <div className="dashboard-week-nav">
        <button onClick={handlePrevWeek}>&larr;</button>
        <input
          value={weekId}
          onChange={(e) => setWeekId(e.target.value)}
          className="week-id-input"
          placeholder="YYYY-WNN"
        />
        <button onClick={handleNextWeek}>&rarr;</button>
      </div>

      {error && <div className="status error">{error}</div>}

      {loading ? (
        <p>載入中...</p>
      ) : persons.length === 0 ? (
        <p>尚無人員資料。請先至「Persons」頁面新增。</p>
      ) : (
        <div className="dashboard-persons">
          {persons.map((person) => {
            const personPlans = planMap[person.name] ?? {}
            return (
              <div key={person.name} className="dashboard-person-row">
                <h2 className="dashboard-person-name">{person.name}</h2>
                <div className="dashboard-days-grid">
                  {DAY_NAMES.map((_, dayIdx) => {
                    const dayPlan = personPlans[dayIdx] ?? emptyDayPlan(person.name, dayIdx)
                    const summary = getDaySummary(person, dayPlan, dayIdx)
                    return (
                      <DayCard
                        key={dayIdx}
                        person={person}
                        dayOfWeek={dayIdx}
                        summary={summary}
                        onEdit={() => navigate(`/edit/${weekId}/${encodeURIComponent(person.name)}/${dayIdx}`)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
