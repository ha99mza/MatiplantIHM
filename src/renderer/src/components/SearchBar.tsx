type SearchBarProps = {
  value: string
  placeholder: string
  onChange: (value: string) => void
  onClear: () => void
  onFocus?: () => void
}

function SearchBar({
  value,
  placeholder,
  onChange,
  onClear,
  onFocus
}: SearchBarProps): React.JSX.Element {
  return (
    <div className="search-bar" onClick={onFocus}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button className="text-button" type="button" onClick={onClear}>
          Effacer
        </button>
      ) : null}
    </div>
  )
}

export default SearchBar
