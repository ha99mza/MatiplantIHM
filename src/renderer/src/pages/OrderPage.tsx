import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react'
import LastUpdateFilter from '../components/LastUpdateFilter'
import PageShell from '../components/PageShell'
import SearchBar from '../components/SearchBar'
import StatusBadge from '../components/StatusBadge'
import VirtualKeyboard from '../components/VirtualKeyboard'
import { fetchOrders, getErrorMessage } from '../services/matiplantApi'
import type { Order } from '../types/matiplant'
import { filterByLastUpdate, type LastUpdateFilterValue } from '../utils/lastUpdateFilter'

type OrderPageProps = {
  onSelectOrder: (order: Order) => void
}

const itemsPerPage = 9

function formatUpdatedAt(updatedAt: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(updatedAt))
}

function OrderPage({ onSelectOrder }: OrderPageProps): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [lastUpdateFilter, setLastUpdateFilter] = useState<LastUpdateFilterValue>('all')
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const searchToolsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    fetchOrders()
      .then((nextOrders) => {
        if (isMounted) {
          setOrders(nextOrders)
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

  const filteredOrders = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    const searchedOrders = query
      ? orders.filter((order) => {
          const searchableValue = [
            order.code,
            order.clientReference,
            order.product?.code,
            order.product?.name,
            order.client?.name
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableValue.includes(query)
        })
      : orders

    return filterByLastUpdate(searchedOrders, lastUpdateFilter)
  }, [lastUpdateFilter, orders, searchValue])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedOrders = filteredOrders.slice(
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
    <PageShell title="Orders" subtitle={`${filteredOrders.length} order(s)`} hideHeader>
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

          <LastUpdateFilter value={lastUpdateFilter} onChange={updateLastUpdateFilter} />
        </div>

        <section className="card-grid" aria-label="Liste des orders">
          {isLoading ? <p className="state-text">Chargement...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!isLoading && !error && paginatedOrders.length === 0 ? (
            <p className="state-text">Aucun order trouve.</p>
          ) : null}
          {!isLoading && !error
            ? paginatedOrders.map((order) => (
                <button
                  className="entity-card order-card"
                  type="button"
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                >
                  <ClipboardList size={38} strokeWidth={2.2} />
                  <span className="entity-title">{order.code}</span>
                  <span className="entity-subtitle">
                    {order.product?.name ?? 'Produit sans nom'}
                  </span>
                  <span className="entity-meta">Update {formatUpdatedAt(order.updatedAt)}</span>
                  <StatusBadge label={order.status} />
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

export default OrderPage
