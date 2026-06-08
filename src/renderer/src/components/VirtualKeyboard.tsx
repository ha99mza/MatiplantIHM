const keyboardRows = ['1234567890', 'AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN']

type VirtualKeyboardProps = {
  value: string
  onChange: (value: string) => void
}

function VirtualKeyboard({ value, onChange }: VirtualKeyboardProps): React.JSX.Element {
  const addKey = (key: string): void => {
    onChange(`${value}${key}`)
  }

  return (
    <div className="virtual-keyboard" aria-label="Clavier virtuel">
      {keyboardRows.map((row) => (
        <div className="keyboard-row" key={row}>
          {row.split('').map((key) => (
            <button type="button" key={key} onClick={() => addKey(key)}>
              {key}
            </button>
          ))}
        </div>
      ))}
      <div className="keyboard-row keyboard-row-actions">
        <button type="button" onClick={() => onChange(`${value} `)}>
          Espace
        </button>
        <button type="button" onClick={() => onChange(value.slice(0, -1))}>
          Suppr
        </button>
        <button type="button" onClick={() => onChange('')}>
          Clear
        </button>
      </div>
    </div>
  )
}

export default VirtualKeyboard
