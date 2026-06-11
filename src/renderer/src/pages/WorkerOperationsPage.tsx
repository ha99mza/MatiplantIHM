import { useState } from 'react'
import OperationQuantityList from '../components/OperationQuantityList'
import PageShell from '../components/PageShell'
import type { OperationQuantitiesPayload, Worker } from '../types/matiplant'

type WorkerOperationsPageProps = {
  worker: Worker
  onBack: () => void
}

function workerName(worker: Worker): string {
  return `${worker.firstName} ${worker.lastName}`.trim() || 'Worker sans nom'
}

function WorkerOperationsPage({ worker, onBack }: WorkerOperationsPageProps): React.JSX.Element {
  const [currentWorker, setCurrentWorker] = useState(worker)

  const updateLocalOperation = (operationId: string, delta: OperationQuantitiesPayload): void => {
    setCurrentWorker((current) => ({
      ...current,
      orderOperations: (current.orderOperations ?? []).map((operation) =>
        operation.id === operationId
          ? {
              ...operation,
              quantityProduced: operation.quantityProduced + delta.quantityProduced,
              quantityRejected: operation.quantityRejected + delta.quantityRejected,
              quantityMissing: operation.quantityMissing + delta.quantityMissing
            }
          : operation
      )
    }))
  }

  return (
    <PageShell
      title="Worker operations"
      subtitle={`${workerName(currentWorker)} / ${currentWorker.employeeId}`}
      hideHeader
      onBack={onBack}
    >
      <section className="operation-page">
        <div className="order-summary worker-summary">
          <div>
            <span>Worker</span>
            <strong>{workerName(currentWorker)}</strong>
          </div>
          <div>
            <span>Employee ID</span>
            <strong>{currentWorker.employeeId}</strong>
          </div>
          <div>
            <span>Position</span>
            <strong>{currentWorker.position ?? '-'}</strong>
          </div>
          <div>
            <span>Department</span>
            <strong>{currentWorker.department ?? '-'}</strong>
          </div>
        </div>

        <OperationQuantityList
          operations={currentWorker.orderOperations ?? []}
          emptyMessage="Aucune operation associee a ce worker."
          getMeta={(operation) =>
            `Order ${operation.order.code} | Client ${operation.order.client.name}`
          }
          onOperationUpdated={updateLocalOperation}
        />
      </section>
    </PageShell>
  )
}

export default WorkerOperationsPage
