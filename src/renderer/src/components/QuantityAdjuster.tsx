type QuantityAdjusterProps = {
  label: string
  value: number
  delta: number
  isEditing: boolean
  isSaving: boolean
  onDecrease: () => void
  onIncrease: () => void
}

function QuantityAdjuster({
  label,
  value,
  delta,
  isEditing,
  isSaving,
  onDecrease,
  onIncrease
}: QuantityAdjusterProps): React.JSX.Element {
  const nextValue = value + delta

  return (
    <div className="quantity-block">
      <span className="quantity-label">{label}</span>
      <strong>{nextValue}</strong>
      {isEditing ? (
        <div className="quantity-actions">
          <button type="button" disabled={isSaving || nextValue <= 0} onClick={onDecrease}>
            -
          </button>
          <span className="quantity-delta">{delta > 0 ? `+${delta}` : delta}</span>
          <button type="button" disabled={isSaving} onClick={onIncrease}>
            +
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default QuantityAdjuster
