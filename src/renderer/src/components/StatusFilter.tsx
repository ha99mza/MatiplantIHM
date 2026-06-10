import type { OrderStatus } from '../types/matiplant'

type StatusFilterProps = {
  value: OrderStatus | null
  onChange: (value: OrderStatus | null) => void
}

const statusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: 'PENDING', label: 'PENDING' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' }
]

function StatusFilter({ value, onChange }: StatusFilterProps): React.JSX.Element {
  return (
    <div className="status-filter" aria-label="Filtre by status">
      <span>Filtre by status</span>
      <div className="filter-options status-filter-options">
        {statusOptions.map((option) => (
          <button
            className={value === option.value ? 'active' : ''}
            type="button"
            key={option.value}
            onClick={() => onChange(value === option.value ? null : option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default StatusFilter
