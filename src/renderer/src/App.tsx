import { useState } from 'react'
import AppLayout, { type AppSection } from './components/AppLayout'
import MachineDetailsPage from './pages/MachineDetailsPage'
import MachinePage from './pages/MachinePage'
import OperationPage from './pages/OperationPage'
import OrderPage from './pages/OrderPage'
import SectionPlaceholderPage from './pages/SectionPlaceholderPage'
import WorkerOperationsPage from './pages/WorkerOperationsPage'
import WorkerPage from './pages/WorkerPage'
import type { Machine, Order, Worker } from './types/matiplant'

type Route =
  | {
      name: 'orders'
    }
  | {
      name: 'orderOperations'
      order: Order
    }
  | {
      name: 'operations'
    }
  | {
      name: 'workers'
    }
  | {
      name: 'workerOperations'
      worker: Worker
    }
  | {
      name: 'machines'
    }
  | {
      name: 'machineDetails'
      machine: Machine
    }
  | {
      name: 'settings'
    }

function sectionFromRoute(route: Route): AppSection {
  if (route.name === 'orderOperations') {
    return 'operations'
  }

  if (route.name === 'workerOperations') {
    return 'workers'
  }

  if (route.name === 'machineDetails') {
    return 'machines'
  }

  return route.name
}

function routeFromSection(section: AppSection): Route {
  return { name: section }
}

function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>({ name: 'orders' })

  const content = (() => {
    if (route.name === 'orders') {
      return <OrderPage onSelectOrder={(order) => setRoute({ name: 'orderOperations', order })} />
    }

    if (route.name === 'orderOperations') {
      return <OperationPage order={route.order} onBack={() => setRoute({ name: 'orders' })} />
    }

    if (route.name === 'workers') {
      return (
        <WorkerPage onSelectWorker={(worker) => setRoute({ name: 'workerOperations', worker })} />
      )
    }

    if (route.name === 'workerOperations') {
      return (
        <WorkerOperationsPage worker={route.worker} onBack={() => setRoute({ name: 'workers' })} />
      )
    }

    if (route.name === 'machines') {
      return (
        <MachinePage onSelectMachine={(machine) => setRoute({ name: 'machineDetails', machine })} />
      )
    }

    if (route.name === 'machineDetails') {
      return (
        <MachineDetailsPage
          machine={route.machine}
          onBack={() => setRoute({ name: 'machines' })}
          onMachineUpdated={(machine) => setRoute({ name: 'machineDetails', machine })}
        />
      )
    }

    if (route.name === 'settings') {
      return <SectionPlaceholderPage title="Reglages" />
    }

    return <SectionPlaceholderPage title="Operations" />
  })()

  return (
    <AppLayout
      activeSection={sectionFromRoute(route)}
      onNavigate={(section) => setRoute(routeFromSection(section))}
    >
      {content}
    </AppLayout>
  )
}

export default App
