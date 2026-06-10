import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, ChevronLeft, ChevronRight } from 'lucide-react'
import MachineStatusFilter from '../components/MachineStatusFilter'
import PageShell from '../components/PageShell'
import SearchBar from '../components/SearchBar'
import StatusBadge from '../components/StatusBadge'
import VirtualKeyboard from '../components/VirtualKeyboard'
import { fetchMachines, getErrorMessage } from '../services/matiplantApi'
import type { Machine, MachineStatus } from '../types/matiplant'

type MachinePageProps = {
  onSelectMachine: (machine: Machine) => void
}

const itemsPerPage = 9

function updatedAtTime(updatedAt?: string): number {
  if (!updatedAt) {
    return 0
  }

  const time = new Date(updatedAt).getTime()
  return Number.isNaN(time) ? 0 : time
}

function MachinePage({ onSelectMachine }: MachinePageProps): React.JSX.Element {
  const [machines, setMachines] = useState<Machine[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<MachineStatus | null>(null)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const searchToolsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    fetchMachines()
      .then((nextMachines) => {
        if (isMounted) {
          setMachines(nextMachines)
        }
      })
      .catch((nextError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(nextError))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isKeyboardVisible) {
      return
    }

    const hideKeyboardOnOutsideClick = (event: MouseEvent): void => {
      if (!searchToolsRef.current?.contains(event.target as Node)) {
        setIsKeyboardVisible(false)
      }
    }

    document.addEventListener('mousedown', hideKeyboardOnOutsideClick)

    return () => {
      document.removeEventListener('mousedown', hideKeyboardOnOutsideClick)
    }
  }, [isKeyboardVisible])

  const filteredMachines = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    const searchedMachines = query
      ? machines.filter((machine) => {
          const searchableValue = [
            machine.code,
            machine.name,
            machine.type,
            machine.manufacturer,
            machine.model,
            machine.serialNumber
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableValue.includes(query)
        })
      : machines

    const statusFilteredMachines = statusFilter
      ? searchedMachines.filter((machine) => machine.status === statusFilter)
      : searchedMachines

    return [...statusFilteredMachines].sort(
      (left, right) => updatedAtTime(right.updatedAt) - updatedAtTime(left.updatedAt)
    )
  }, [machines, searchValue, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMachines.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedMachines = filteredMachines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const updateSearch = (value: string): void => {
    setSearchValue(value)
    setPage(1)
  }

  const updateStatusFilter = (value: MachineStatus | null): void => {
    setStatusFilter(value)
    setPage(1)
  }

  return (
    <PageShell title="Machines" subtitle={`${filteredMachines.length} machine(s)`} hideHeader>
      <section className="section-layout">
        <div className="section-toolbar">
          <div className="section-search" ref={searchToolsRef}>
            <SearchBar
              value={searchValue}
              placeholder="Recherche"
              onChange={updateSearch}
              onClear={() => updateSearch('')}
              onFocus={() => setIsKeyboardVisible(true)}
            />
            {isKeyboardVisible ? (
              <VirtualKeyboard value={searchValue} onChange={updateSearch} />
            ) : null}
          </div>

          <MachineStatusFilter value={statusFilter} onChange={updateStatusFilter} />
        </div>

        <section className="card-grid" aria-label="Liste des machines">
          {isLoading ? <p className="state-text">Chargement...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!isLoading && !error && paginatedMachines.length === 0 ? (
            <p className="state-text">Aucune machine trouvee.</p>
          ) : null}
          {!isLoading && !error
            ? paginatedMachines.map((machine) => (
                <button
                  className="entity-card machine-card"
                  type="button"
                  key={machine.id}
                  onClick={() => onSelectMachine(machine)}
                >
                  <Bot size={38} strokeWidth={2.2} />
                  <span className="entity-title">{machine.name || machine.code}</span>
                  <span className="entity-subtitle">{machine.code}</span>
                  <span className="entity-meta">
                    {[machine.type, machine.manufacturer, machine.model]
                      .filter(Boolean)
                      .join(' / ') || 'Machine'}
                  </span>
                  {machine.status ? <StatusBadge label={machine.status} /> : null}
                </button>
              ))
            : null}
        </section>

        <div className="pagination-bar">
          <button
            className="pagination-button"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft size={30} strokeWidth={3} />
            <span>Page precedente</span>
          </button>
          <span className="pagination-state">
            Page {currentPage} / {totalPages}
          </span>
          <button
            className="pagination-button"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            <span>Page suivante</span>
            <ChevronRight size={30} strokeWidth={3} />
          </button>
        </div>
      </section>
    </PageShell>
  )
}

export default MachinePage
