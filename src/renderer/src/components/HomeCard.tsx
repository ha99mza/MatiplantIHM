type HomeCardProps = {
  title: string
  variant: 'orders' | 'operations' | 'workers' | 'machines'
  disabled?: boolean
  onClick?: () => void
}

function HomeCard({ title, variant, disabled = false, onClick }: HomeCardProps): React.JSX.Element {
  return (
    <button
      className={`home-card home-card-${variant}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="home-card-mark">{title.slice(0, 2)}</span>
      <span className="home-card-title">{title}</span>
    </button>
  )
}

export default HomeCard
