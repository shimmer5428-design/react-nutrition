import { Person } from '../api/types'
import SearchableSelect from './SearchableSelect'

interface Props {
  persons: Person[]
  selected: string | null
  onSelect: (name: string) => void
}

export default function PersonSelector({ persons, selected, onSelect }: Props) {
  return (
    <SearchableSelect
      label="Person"
      value={selected ?? ''}
      onChange={onSelect}
      placeholder="Select a person..."
      options={persons.map(p => ({ value: p.name, label: p.name }))}
    />
  )
}
