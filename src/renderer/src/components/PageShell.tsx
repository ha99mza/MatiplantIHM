type PageShellProps = {
  title: string
  subtitle?: string
  hideHeader?: boolean
  onBack?: () => void
  children: React.ReactNode
}

function PageShell({
  title,
  subtitle,
  hideHeader = false,
  onBack,
  children
}: PageShellProps): React.JSX.Element {
  return (
    <div className="page-shell">
      {hideHeader ? null : (
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
          </div>
          {onBack ? (
            <button className="secondary-button" type="button" onClick={onBack}>
              Retour
            </button>
          ) : null}
        </header>
      )}
      {children}
    </div>
  )
}

export default PageShell
