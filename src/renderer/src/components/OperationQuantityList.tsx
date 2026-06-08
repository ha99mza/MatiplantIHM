import { useMemo, useState } from 'react'
import { getErrorMessage, updateOperationQuantities } from '../services/matiplantApi'
import type { OperationQuantitiesPayload, OperationStatus, QuantityField } from '../types/matiplant'
import QuantityAdjuster from './QuantityAdjuster'
import StatusBadge from './StatusBadge'

export type EditableOperation = {
  id: string
  sequence: number
  name: string
  status: OperationStatus
  quantityPlanned: number
  quantityProduced: number
  quantityRejected: number
  quantityMissing: number
}

type OperationQuantityListProps<T extends EditableOperation> = {
  operations: T[]
  emptyMessage: string
  getMeta: (operation: T) => string
  onOperationUpdated: (operationId: string, delta: OperationQuantitiesPayload) => void
}

const quantityFields: Array<{ field: QuantityField; label: string }> = [
  { field: 'quantityProduced', label: 'Produced' },
  { field: 'quantityRejected', label: 'Rejected' },
  { field: 'quantityMissing', label: 'Missing' }
]

function emptyDelta(): OperationQuantitiesPayload {
  return {
    quantityProduced: 0,
    quantityRejected: 0,
    quantityMissing: 0
  }
}

function OperationQuantityList<T extends EditableOperation>({
  operations,
  emptyMessage,
  getMeta,
  onOperationUpdated
}: OperationQuantityListProps<T>): React.JSX.Element {
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, OperationQuantitiesPayload>>({})
  const [savingOperationId, setSavingOperationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sortedOperations = useMemo(
    () => [...operations].sort((left, right) => left.sequence - right.sequence),
    [operations]
  )

  const startEdit = (operationId: string): void => {
    setEditingOperationId(operationId)
    setError(null)
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [operationId]: emptyDelta()
    }))
  }

  const cancelEdit = (operationId: string): void => {
    setEditingOperationId(null)
    setError(null)
    setDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts }
      delete nextDrafts[operationId]
      return nextDrafts
    })
  }

  const adjustQuantity = (operation: T, field: QuantityField, amount: number): void => {
    setDrafts((currentDrafts) => {
      const currentDelta = currentDrafts[operation.id] ?? emptyDelta()
      const nextDelta = currentDelta[field] + amount

      if (operation[field] + nextDelta < 0) {
        return currentDrafts
      }

      return {
        ...currentDrafts,
        [operation.id]: {
          ...currentDelta,
          [field]: nextDelta
        }
      }
    })
  }

  const saveOperation = async (operation: T): Promise<void> => {
    const delta = drafts[operation.id] ?? emptyDelta()
    const hasChange = Object.values(delta).some((value) => value !== 0)

    if (!hasChange) {
      cancelEdit(operation.id)
      return
    }

    setSavingOperationId(operation.id)
    setError(null)

    try {
      await updateOperationQuantities(operation.id, delta)
      onOperationUpdated(operation.id, delta)
      cancelEdit(operation.id)
    } catch (nextError) {
      setError(getErrorMessage(nextError))
    } finally {
      setSavingOperationId(null)
    }
  }

  return (
    <>
      {error ? <p className="error-text">{error}</p> : null}

      <section className="operation-list" aria-label="Liste des operations">
        {sortedOperations.length === 0 ? <p className="state-text">{emptyMessage}</p> : null}
        {sortedOperations.map((operation) => {
          const isEditing = editingOperationId === operation.id
          const isSaving = savingOperationId === operation.id
          const delta = drafts[operation.id] ?? emptyDelta()

          return (
            <article className="operation-row" key={operation.id}>
              <div className="operation-heading">
                <span className="operation-sequence">#{operation.sequence}</span>
                <div>
                  <h2>{operation.name}</h2>
                  <p>{getMeta(operation)}</p>
                </div>
                <StatusBadge label={operation.status} />
              </div>

              <div className="quantity-grid">
                <div className="quantity-block quantity-block-static">
                  <span className="quantity-label">Planned</span>
                  <strong>{operation.quantityPlanned}</strong>
                </div>
                {quantityFields.map(({ field, label }) => (
                  <QuantityAdjuster
                    key={field}
                    label={label}
                    value={operation[field]}
                    delta={delta[field]}
                    isEditing={isEditing}
                    isSaving={isSaving}
                    onDecrease={() => adjustQuantity(operation, field, -1)}
                    onIncrease={() => adjustQuantity(operation, field, 1)}
                  />
                ))}
              </div>

              <div className="operation-actions">
                {isEditing ? (
                  <>
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={isSaving}
                      onClick={() => cancelEdit(operation.id)}
                    >
                      Annuler
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      disabled={isSaving}
                      onClick={() => saveOperation(operation)}
                    >
                      {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </>
                ) : (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={savingOperationId !== null}
                    onClick={() => startEdit(operation.id)}
                  >
                    Modifier
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}

export default OperationQuantityList
