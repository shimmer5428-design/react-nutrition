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

// bar fill class: matches Streamlit palette
function barClass(status: string) {
  return status === 'met' ? 'bar-met' : status === 'deficit' ? 'bar-under' : 'bar-over'
}

function ProgressBar({ actual, target, status }: { actual: number; target: number; status: string }) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0
  return (
    <div className="macro-progress-bar-bg">
      <div
        className={`macro-progress-bar-fill ${barClass(status)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function DayCard({ person, dayOfWeek, summary, onEdit }: Props) {
  const status = getDayStatus(summary)
  const exerciseDay = isExerciseDay(person, dayOfWeek)

  // card bg class mirrors Streamlit: deficit=#FF6163, met=#A4CA68, exceeded=#a677c6
  const cardClass =
    status === 'met'
      ? 'day-card day-card-met-bg'
      : status === 'exceeded'
      ? 'day-card day-card-exceeded-bg'
      : 'day-card day-card-deficit-bg'

  const proteinStatus = getMacroStatus(summary.actual_protein, summary.target_protein)
  const carbsStatus = getMacroStatus(summary.actual_carbs, summary.target_carbs)
  const fatStatus = getMacroStatus(summary.actual_fat, summary.target_fat)

  const formatDelta = (v: number) => (v >= 0 ? `+${v}` : `${v}`)

  return (
    <div className={cardClass}>
      <div className="day-card-header">
        <span className="day-card-day-name">
          {DAY_NAMES[dayOfWeek]}{exerciseDay ? ' \uD83C\uDFC6' : ''}
        </span>
      </div>

      {/* exercise day kcal in yellow (#ECF29D), otherwise dark */}
      <div className={`day-card-kcal${exerciseDay ? ' exercise' : ''}`}>
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
