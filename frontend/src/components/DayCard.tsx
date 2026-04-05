import { DAY_NAMES } from '../api/types'
import type { Person } from '../api/types'
import type { DaySummary } from '../utils/nutrition'
import { getDayStatus, getMacroStatus, isExerciseDay } from '../utils/nutrition'

interface Props {
  person: Person
  dayOfWeek: number
  summary: DaySummary
  onEdit: () => void
}

function ProgressBar({ actual, target, status }: { actual: number; target: number; status: string }) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0
  const barColor = status === 'met' ? '#22c55e' : status === 'deficit' ? '#ef4444' : '#f97316'
  return (
    <div className="macro-progress-bar-bg">
      <div
        className="macro-progress-bar-fill"
        style={{ width: `${pct}%`, backgroundColor: barColor }}
      />
    </div>
  )
}

export default function DayCard({ person, dayOfWeek, summary, onEdit }: Props) {
  const status = getDayStatus(summary)
  const exerciseDay = isExerciseDay(person, dayOfWeek)

  const cardBg =
    status === 'met' ? '#166534' : status === 'deficit' ? '#991b1b' : '#9a3412'

  const proteinStatus = getMacroStatus(summary.actual_protein, summary.target_protein)
  const carbsStatus = getMacroStatus(summary.actual_carbs, summary.target_carbs)
  const fatStatus = getMacroStatus(summary.actual_fat, summary.target_fat)

  const formatDelta = (v: number) => (v >= 0 ? `+${v}` : `${v}`)

  return (
    <div className="day-card" style={{ backgroundColor: cardBg }}>
      <div className="day-card-header">
        <span className="day-card-day-name">
          {DAY_NAMES[dayOfWeek]}{exerciseDay ? ' \uD83C\uDFC6' : ''}
        </span>
      </div>

      <div className="day-card-kcal" style={{ color: exerciseDay ? '#fde047' : '#ffffff' }}>
        {summary.actual_kcal} / {summary.target_kcal} kcal
      </div>
      <div className="day-card-deficit">
        ({formatDelta(summary.deficit_kcal)})
      </div>

      <div className="day-card-macros">
        <div className="day-card-macro-row">
          <span className="day-card-macro-label">蛋白</span>
          <span className="day-card-macro-value">{summary.actual_protein}g</span>
          <ProgressBar actual={summary.actual_protein} target={summary.target_protein} status={proteinStatus} />
          <span className="day-card-macro-delta">{formatDelta(summary.protein_delta)}g</span>
        </div>
        <div className="day-card-macro-row">
          <span className="day-card-macro-label">澱粉</span>
          <span className="day-card-macro-value">{summary.actual_carbs}g</span>
          <ProgressBar actual={summary.actual_carbs} target={summary.target_carbs} status={carbsStatus} />
          <span className="day-card-macro-delta">{formatDelta(summary.carbs_delta)}g</span>
        </div>
        <div className="day-card-macro-row">
          <span className="day-card-macro-label">脂肪</span>
          <span className="day-card-macro-value">{summary.actual_fat}g</span>
          <ProgressBar actual={summary.actual_fat} target={summary.target_fat} status={fatStatus} />
          <span className="day-card-macro-delta">{formatDelta(summary.fat_delta)}g</span>
        </div>
      </div>

      <button className="day-card-edit-btn" onClick={onEdit}>
        編輯
      </button>
    </div>
  )
}
