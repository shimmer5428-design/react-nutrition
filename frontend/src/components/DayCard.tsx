import { DAY_NAMES } from '../api/types'
import type { DayPlan } from '../api/types'
import type { DaySummary } from '../utils/nutrition'
import { getDayStatus, getMacroStatus, isExerciseDay } from '../utils/nutrition'

interface Props {
  dayPlan: DayPlan
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

export default function DayCard({ dayPlan, dayOfWeek, summary, onEdit }: Props) {
  const status = getDayStatus(summary)
  const exerciseDay = isExerciseDay(dayPlan)

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
          {DAY_NAMES[dayOfWeek]}{exerciseDay ? ' \uD83C\uDFC3' : ''}
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
        {([
          { label: '蛋白', actual: summary.actual_protein, target: summary.target_protein, delta: summary.protein_delta, st: proteinStatus },
          { label: '澱粉', actual: summary.actual_carbs,   target: summary.target_carbs,   delta: summary.carbs_delta,   st: carbsStatus },
          { label: '脂肪', actual: summary.actual_fat,     target: summary.target_fat,     delta: summary.fat_delta,     st: fatStatus },
        ] as const).map(({ label, actual, delta, target, st }) => (
          <div key={label} className="day-card-macro-block">
            <div className="day-card-macro-top">
              <span className="day-card-macro-label">{label}</span>
              <span className="day-card-macro-value">{actual}g</span>
              <span className="day-card-macro-delta">{formatDelta(delta)}g</span>
            </div>
            <ProgressBar actual={actual} target={target} status={st} />
          </div>
        ))}
      </div>

      <button className="day-card-edit-btn" onClick={onEdit}>
        編輯
      </button>
    </div>
  )
}
