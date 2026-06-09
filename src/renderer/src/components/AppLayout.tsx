import { Bot, ClipboardList, SlidersHorizontal, UserRound, Workflow } from 'lucide-react'

export type AppSection = 'orders' | 'operations' | 'workers' | 'machines' | 'settings'

type AppLayoutProps = {
  activeSection: AppSection
  onNavigate: (section: AppSection) => void
  children: React.ReactNode
}

const navItems: Array<{
  section: AppSection
  label: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}> = [
  { section: 'orders', label: 'Order', Icon: ClipboardList },
  { section: 'operations', label: 'Operation', Icon: Workflow },
  { section: 'workers', label: 'Worker', Icon: UserRound },
  { section: 'machines', label: 'Machine', Icon: Bot },
  { section: 'settings', label: 'Reglage', Icon: SlidersHorizontal }
]

function AppLayout({ activeSection, onNavigate, children }: AppLayoutProps): React.JSX.Element {
  return (
    <div className="app-frame">
      <nav className="app-navbar" aria-label="Sections de l'application">
        {navItems.map(({ section, label, Icon }) => (
          <button
            className={activeSection === section ? 'nav-item active' : 'nav-item'}
            type="button"
            key={section}
            onClick={() => onNavigate(section)}
          >
            <Icon size={34} strokeWidth={2.4} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <main className="app-content">{children}</main>
    </div>
  )
}

export default AppLayout
