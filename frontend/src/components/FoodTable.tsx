import { FoodItem } from '../api/types'

interface Props {
  foods: FoodItem[]
  onDelete?: (name: string) => void
  onAdd?: (food: FoodItem) => void
  compact?: boolean
}

export default function FoodTable({ foods, onDelete, compact }: Props) {
  if (foods.length === 0) {
    return <p style={{ color: '#9ca3af', padding: '12px 0' }}>No foods yet.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          {!compact && <th>Amount</th>}
          {!compact && <th>Unit</th>}
          <th>Protein (g)</th>
          <th>Carbs (g)</th>
          <th>Fat (g)</th>
          <th>Calories</th>
          {!compact && <th>Category</th>}
          {onDelete && <th>Action</th>}
        </tr>
      </thead>
      <tbody>
        {foods.map((f) => (
          <tr key={f.name}>
            <td>{f.name}</td>
            {!compact && <td>{f.amount}</td>}
            {!compact && <td>{f.unit}</td>}
            <td>{f.protein_g}</td>
            <td>{f.carbs_g}</td>
            <td>{f.fat_g}</td>
            <td>{f.calories}</td>
            {!compact && <td>{f.category}</td>}
            {onDelete && (
              <td>
                <button className="danger" onClick={() => onDelete(f.name)}>
                  Delete
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
