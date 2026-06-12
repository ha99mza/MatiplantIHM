import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, UserRound } from 'lucide-react'
import LastUpdateFilter from '../components/LastUpdateFilter'
import PageShell from '../components/PageShell'
import SearchBar from '../components/SearchBar'
import VirtualKeyboard from '../components/VirtualKeyboard'
import { fetchWorkers, getErrorMessage } from '../services/matiplantApi'
import type { Worker } from '../types/matiplant'
import { filterByLastUpdate, type LastUpdateFilterValue } from '../utils/lastUpdateFilter'

type WorkerPageProps = {
  onSelectWorker: (worker: Worker) => void
}

const itemsPerPage = 9

function fullWorkerName(worker: Worker): string {
  return `${worker.firstName} ${worker.lastName}`.trim()
}

function formatUpdatedAt(updatedAt?: string): string {
  if (!updatedAt) {
    return '-'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(updatedAt))
}

function WorkerPage({ onSelectWorker }: WorkerPageProps): React.JSX.Element {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [lastUpdateFilter, setLastUpdateFilter] = useState<LastUpdateFilterValue>('all')
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const searchToolsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    fetchWorkers()
      .then((nextWorkers) => {
        if (isMounted) {
          setWorkers(nextWorkers)
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

  const filteredWorkers = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    const searchedWorkers = query
      ? workers.filter((worker) => {
          const searchableValue = [
            fullWorkerName(worker),
            worker.employeeId,
            worker.position,
            worker.department
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableValue.includes(query)
        })
      : workers

    return filterByLastUpdate(searchedWorkers, lastUpdateFilter)
  }, [lastUpdateFilter, searchValue, workers])

  const totalPages = Math.max(1, Math.ceil(filteredWorkers.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedWorkers = filteredWorkers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const updateSearch = (value: string): void => {
    setSearchValue(value)
    setPage(1)
  }

  const updateLastUpdateFilter = (value: LastUpdateFilterValue): void => {
    setLastUpdateFilter(value)
    setPage(1)
  }

  return (
    <PageShell title="Workers" subtitle={`${filteredWorkers.length} worker(s)`} hideHeader>
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
              <VirtualKeyboard
                value={searchValue}
                onChange={updateSearch}
                onValidate={() => setIsKeyboardVisible(false)}
              />
            ) : null}
          </div>

          <LastUpdateFilter value={lastUpdateFilter} onChange={updateLastUpdateFilter} />
        </div>

        <section className="card-grid" aria-label="Liste des workers">
          {isLoading ? <p className="state-text">Chargement...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!isLoading && !error && paginatedWorkers.length === 0 ? (
            <p className="state-text">Aucun worker trouve.</p>
          ) : null}
          {!isLoading && !error
            ? paginatedWorkers.map((worker) => (
                <button
                  className="entity-card worker-card"
                  type="button"
                  key={worker.id}
                  onClick={() => onSelectWorker(worker)}
                >
                  <UserRound size={38} strokeWidth={2.2} />
                  <span className="entity-title">
                    {fullWorkerName(worker) || 'Worker sans nom'}
                  </span>
                  <span className="entity-subtitle">{worker.employeeId}</span>
                  <span className="entity-meta">Update {formatUpdatedAt(worker.updatedAt)}</span>
                  <span
                    className={
                      worker.isActive === false ? 'worker-status inactive' : 'worker-status'
                    }
                  >
                    {worker.isActive === false ? 'Inactive' : 'Active'}
                  </span>
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

export default WorkerPage
