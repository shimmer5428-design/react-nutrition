import { Person } from '../api/types'

interface Props {
  persons: Person[]
  selected: string | null
  onSelect: (name: string) => void
}

export default function PersonSelector({ persons, selected, onSelect }: Props) {
  return (
    <div className="form-group">
      <label>Person</label>
      <select
        value={selected ?? ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="" disabled>Select a person...</option>
        {persons.map((p) => (
          <option key={p.name} value={p.name}>{p.name}</option>
        ))}
      </select>
    </div>
  )
}
