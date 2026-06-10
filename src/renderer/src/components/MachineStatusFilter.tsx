import type { MachineStatus } from '../types/matiplant'

type MachineStatusFilterProps = {
  value: MachineStatus | null
  onChange: (value: MachineStatus | null) => void
}

const statusOptions: Array<{ value: MachineStatus; label: string }> = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE' }
]

function MachineStatusFilter({ value, onChange }: MachineStatusFilterProps): React.JSX.Element {
  return (
    <div className="status-filter" aria-label="Filtre machines by status">
      <span>Filtre by status</span>
      <div className="filter-options machine-filter-options">
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

export default MachineStatusFilter
