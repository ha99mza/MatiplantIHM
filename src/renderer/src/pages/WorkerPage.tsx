import { useEffect, useMemo, useRef, useState } from 'react'
import PageShell from '../components/PageShell'
import SearchBar from '../components/SearchBar'
import VirtualKeyboard from '../components/VirtualKeyboard'
import { fetchWorkers, getErrorMessage } from '../services/matiplantApi'
import type { Worker } from '../types/matiplant'

type WorkerPageProps = {
  onBack: () => void
  onSelectWorker: (worker: Worker) => void
}

function fullWorkerName(worker: Worker): string {
  return `${worker.firstName} ${worker.lastName}`.trim()
}

function WorkerPage({ onBack, onSelectWorker }: WorkerPageProps): React.JSX.Element {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

    if (!query) {
      return workers
    }

    return workers.filter((worker) => {
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
  }, [searchValue, workers])

  return (
    <PageShell title="Workers" subtitle={`${filteredWorkers.length} worker(s)`} onBack={onBack}>
      <section className="workers-layout">
        <div className="workers-tools" ref={searchToolsRef}>
          <SearchBar
            value={searchValue}
            placeholder="Recherche"
            onChange={setSearchValue}
            onClear={() => setSearchValue('')}
            onFocus={() => setIsKeyboardVisible(true)}
          />
          {isKeyboardVisible ? (
            <VirtualKeyboard value={searchValue} onChange={setSearchValue} />
          ) : null}
        </div>

        <section className="list-panel" aria-label="Liste des workers">
          {isLoading ? <p className="state-text">Chargement...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!isLoading && !error && filteredWorkers.length === 0 ? (
            <p className="state-text">Aucun worker trouve.</p>
          ) : null}
          {!isLoading && !error
            ? filteredWorkers.map((worker) => (
                <button
                  className="worker-row"
                  type="button"
                  key={worker.id}
                  onClick={() => onSelectWorker(worker)}
                >
                  <span className="worker-name">{fullWorkerName(worker) || 'Worker sans nom'}</span>
                  <span className="worker-details">
                    {/* {worker.employeeId}
                    {worker.position ? ` | ${worker.position}` : ''}
                    {worker.department ? ` | ${worker.department}` : ''} */}
                  </span>
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
      </section>
    </PageShell>
  )
}

export default WorkerPage
