import { useState } from 'react'
import OperationQuantityList from '../components/OperationQuantityList'
import PageShell from '../components/PageShell'
import StatusBadge from '../components/StatusBadge'
import type { Operation, OperationQuantitiesPayload, Order } from '../types/matiplant'

type OperationPageProps = {
  order: Order
  onBack: () => void
}

function workerLabel(operation: Operation): string {
  if (!operation.worker) {
    return 'Worker -'
  }

  return `${operation.worker.firstName} ${operation.worker.lastName}`
}

function machineLabel(operation: Operation): string {
  if (!operation.machine) {
    return 'Machine -'
  }

  return `${operation.machine.code} / ${operation.machine.name}`
}

function OperationPage({ order, onBack }: OperationPageProps): React.JSX.Element {
  const [currentOrder, setCurrentOrder] = useState(order)

  const updateLocalOperation = (operationId: string, delta: OperationQuantitiesPayload): void => {
    setCurrentOrder((current) => ({
      ...current,
      operations: current.operations.map((currentOperation) =>
        currentOperation.id === operationId
          ? {
              ...currentOperation,
              quantityProduced: currentOperation.quantityProduced + delta.quantityProduced,
              quantityRejected: currentOperation.quantityRejected + delta.quantityRejected,
              quantityMissing: currentOperation.quantityMissing + delta.quantityMissing
            }
          : currentOperation
      )
    }))
  }

  return (
    <PageShell
      title="Operations"
      subtitle={`${currentOrder.code} / ${currentOrder.product?.name ?? 'Produit sans nom'}`}
      hideHeader
      onBack={onBack}
    >
      <section className="operation-page">
        <div className="order-summary order-summary-operations">
          <div>
            <span>Order</span>
            <strong>{currentOrder.code}</strong>
          </div>
          <div>
            <span>Product</span>
            <strong>{currentOrder.product?.name ?? '-'}</strong>
          </div>
          <div>
            <span>Planned</span>
            <strong>{currentOrder.quantityPlanned}</strong>
          </div>
          <div>
            <span>Operations</span>
            <strong>{currentOrder.operations.length}</strong>
          </div>
          <StatusBadge label={currentOrder.status} />
        </div>

        <OperationQuantityList
          operations={currentOrder.operations}
          emptyMessage="Aucune operation trouvee."
          getMeta={(operation) => `${machineLabel(operation)} | ${workerLabel(operation)}`}
          onOperationUpdated={updateLocalOperation}
        />
      </section>
    </PageShell>
  )
}

export default OperationPage
