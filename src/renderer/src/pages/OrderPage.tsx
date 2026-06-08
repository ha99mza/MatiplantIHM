import { useEffect, useMemo, useRef, useState } from 'react'
import PageShell from '../components/PageShell'
import SearchBar from '../components/SearchBar'
import StatusBadge from '../components/StatusBadge'
import VirtualKeyboard from '../components/VirtualKeyboard'
import { fetchOrders, getErrorMessage } from '../services/matiplantApi'
import type { Order } from '../types/matiplant'

type OrderPageProps = {
  onBack: () => void
  onSelectOrder: (order: Order) => void
}

function OrderPage({ onBack, onSelectOrder }: OrderPageProps): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

    if (!query) {
      return orders
    }

    return orders.filter((order) => {
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
  }, [orders, searchValue])

  return (
    <PageShell title="Orders" subtitle={`${filteredOrders.length} order(s)`} onBack={onBack}>
      <section className="orders-layout">
        <div className="orders-tools" ref={searchToolsRef}>
          <SearchBar
            value={searchValue}
            placeholder="Code order / Product name"
            onChange={setSearchValue}
            onClear={() => setSearchValue('')}
            onFocus={() => setIsKeyboardVisible(true)}
          />
          {isKeyboardVisible ? (
            <VirtualKeyboard value={searchValue} onChange={setSearchValue} />
          ) : null}
        </div>

        <section className="list-panel" aria-label="Liste des orders">
          {isLoading ? <p className="state-text">Chargement...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!isLoading && !error && filteredOrders.length === 0 ? (
            <p className="state-text">Aucun order trouve.</p>
          ) : null}
          {!isLoading && !error
            ? filteredOrders.map((order) => (
                <button
                  className="order-row"
                  type="button"
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                >
                  <span className="order-code">{order.code}</span>
                  <span className="order-product">{order.product?.name ?? 'Produit sans nom'}</span>
                  <StatusBadge label={order.status} />
                </button>
              ))
            : null}
        </section>
      </section>
    </PageShell>
  )
}

export default OrderPage
