type PageShellProps = {
  title: string
  subtitle?: string
  onBack?: () => void
  children: React.ReactNode
}

function PageShell({ title, subtitle, onBack, children }: PageShellProps): React.JSX.Element {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="app-kicker">Matiplant</p>
          <h1>{title}</h1>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
        {onBack ? (
          <button className="secondary-button" type="button" onClick={onBack}>
            Retour
          </button>
        ) : null}
      </header>
      {children}
    </div>
  )
}

export default PageShell
