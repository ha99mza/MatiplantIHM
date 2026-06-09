import type { LastUpdateFilterValue } from '../utils/lastUpdateFilter'

type LastUpdateFilterProps = {
  value: LastUpdateFilterValue
  onChange: (value: LastUpdateFilterValue) => void
}

const filterOptions: Array<{ value: LastUpdateFilterValue; label: string }> = [
  { value: '1d', label: '1D' },
  { value: '3d', label: '3D' },
  { value: '1w', label: '1W' },
  { value: 'all', label: 'ALL' }
]

function LastUpdateFilter({ value, onChange }: LastUpdateFilterProps): React.JSX.Element {
  return (
    <div className="last-update-filter" aria-label="Filtre by last Update">
      <span>Filtre by last Update</span>
      <div className="filter-options">
        {filterOptions.map((option) => (
          <button
            className={value === option.value ? 'active' : ''}
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default LastUpdateFilter
