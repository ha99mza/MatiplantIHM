import { useState } from 'react'

type KeyboardMode = 'lower' | 'upper' | 'number' | 'symbol'

const keyboardLayouts: Record<KeyboardMode, string[]> = {
  lower: ['azertyuiop', 'qsdfghjklm', 'wxcvbn'],
  upper: ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'],
  number: ['1234567890', '.,:;+-*/=', '()[]{}'],
  symbol: ['@#&_$%!?', `'"\\|~^`, '<>{}[]']
}

const modeLabels: Array<{ mode: KeyboardMode; label: string }> = [
  { mode: 'lower', label: 'abc' },
  { mode: 'upper', label: 'ABC' },
  { mode: 'number', label: '123' },
  { mode: 'symbol', label: '#+=' }
]

type VirtualKeyboardProps = {
  value: string
  onChange: (value: string) => void
  onValidate?: () => void
}

function VirtualKeyboard({ value, onChange, onValidate }: VirtualKeyboardProps): React.JSX.Element {
  const [mode, setMode] = useState<KeyboardMode>('lower')
  const keyboardRows = keyboardLayouts[mode]

  const addKey = (key: string): void => {
    onChange(`${value}${key}`)
  }

  return (
    <div className="virtual-keyboard" aria-label="Clavier virtuel">
      <div className="keyboard-preview">
        <span>{value || '-'}</span>
        <button type="button" onClick={onValidate}>
          Valider
        </button>
      </div>
      <div className="keyboard-mode-row">
        {modeLabels.map(({ mode: nextMode, label }) => (
          <button
            className={mode === nextMode ? 'active' : ''}
            type="button"
            key={nextMode}
            onClick={() => setMode(nextMode)}
          >
            {label}
          </button>
        ))}
      </div>
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
          Effacer
        </button>
      </div>
    </div>
  )
}

export default VirtualKeyboard
