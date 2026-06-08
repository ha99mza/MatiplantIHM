import { useState } from 'react'
import HomePage from './pages/HomePage'
import OperationPage from './pages/OperationPage'
import OrderPage from './pages/OrderPage'
import WorkerOperationsPage from './pages/WorkerOperationsPage'
import WorkerPage from './pages/WorkerPage'
import type { Order, Worker } from './types/matiplant'

type Route =
  | {
      name: 'home'
    }
  | {
      name: 'orders'
    }
  | {
      name: 'operations'
      order: Order
    }
  | {
      name: 'workers'
    }
  | {
      name: 'workerOperations'
      worker: Worker
    }

function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>({ name: 'home' })

  if (route.name === 'orders') {
    return (
      <OrderPage
        onBack={() => setRoute({ name: 'home' })}
        onSelectOrder={(order) => setRoute({ name: 'operations', order })}
      />
    )
  }

  if (route.name === 'operations') {
    return <OperationPage order={route.order} onBack={() => setRoute({ name: 'orders' })} />
  }

  if (route.name === 'workers') {
    return (
      <WorkerPage
        onBack={() => setRoute({ name: 'home' })}
        onSelectWorker={(worker) => setRoute({ name: 'workerOperations', worker })}
      />
    )
  }

  if (route.name === 'workerOperations') {
    return (
      <WorkerOperationsPage worker={route.worker} onBack={() => setRoute({ name: 'workers' })} />
    )
  }

  return (
    <HomePage
      onOpenOrders={() => setRoute({ name: 'orders' })}
      onOpenWorkers={() => setRoute({ name: 'workers' })}
    />
  )
}

export default App
