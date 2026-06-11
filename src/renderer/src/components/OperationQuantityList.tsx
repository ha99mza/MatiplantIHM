import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getErrorMessage, updateOperationQuantities } from '../services/matiplantApi'
import type { OperationQuantitiesPayload, OperationStatus, QuantityField } from '../types/matiplant'
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

const itemsPerPage = 8

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
  const [selectedOperation, setSelectedOperation] = useState<T | null>(null)
  const [selectedField, setSelectedField] = useState<QuantityField>('quantityProduced')
  const [draft, setDraft] = useState<OperationQuantitiesPayload>(emptyDelta())
  const [savingOperationId, setSavingOperationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const sortedOperations = useMemo(
    () => [...operations].sort((left, right) => left.sequence - right.sequence),
    [operations]
  )
  const totalPages = Math.max(1, Math.ceil(sortedOperations.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedOperations = sortedOperations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const openOperation = (operation: T): void => {
    setSelectedOperation(operation)
    setSelectedField('quantityProduced')
    setDraft(emptyDelta())
    setError(null)
  }

  const closeOperation = (): void => {
    setSelectedOperation(null)
    setSelectedField('quantityProduced')
    setDraft(emptyDelta())
    setError(null)
  }

  const setQuantityDelta = (operation: T, field: QuantityField, value: number): void => {
    setDraft((currentDraft) => {
      const numericValue = Number.isFinite(value) ? value : 0
      const minDelta = -operation[field]
      const nextDelta = Math.max(minDelta, Math.trunc(numericValue))

      return {
        ...currentDraft,
        [field]: nextDelta
      }
    })
  }

  const adjustQuantity = (operation: T, field: QuantityField, amount: number): void => {
    setQuantityDelta(operation, field, draft[field] + amount)
  }

  const pressNumberKey = (operation: T, key: string): void => {
    const currentValue = draft[selectedField]
    const sign = currentValue < 0 ? -1 : 1
    const nextAbsoluteValue = Number(`${Math.abs(currentValue)}${key}`)

    setQuantityDelta(operation, selectedField, sign * nextAbsoluteValue)
  }

  const deleteNumberKey = (operation: T): void => {
    const currentValue = draft[selectedField]
    const sign = currentValue < 0 ? -1 : 1
    const nextValue = Math.floor(Math.abs(currentValue) / 10)

    setQuantityDelta(operation, selectedField, sign * nextValue)
  }

  const saveOperation = async (): Promise<void> => {
    if (!selectedOperation) {
      return
    }

    const hasChange = Object.values(draft).some((value) => value !== 0)

    if (!hasChange) {
      closeOperation()
      return
    }

    setSavingOperationId(selectedOperation.id)
    setError(null)

    try {
      await updateOperationQuantities(selectedOperation.id, draft)
      onOperationUpdated(selectedOperation.id, draft)
      closeOperation()
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
        {paginatedOperations.map((operation) => (
          <button
            className="operation-list-row"
            type="button"
            key={operation.id}
            onClick={() => openOperation(operation)}
          >
            <span className="operation-sequence">#{operation.sequence}</span>
            <span className="operation-list-name">{operation.name}</span>
            <span className="operation-list-meta">{getMeta(operation)}</span>
            <StatusBadge label={operation.status} />
          </button>
        ))}
      </section>

      <div className="pagination-bar operation-pagination">
        <button
          className="pagination-button"
          type="button"
          disabled={currentPage <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          <ChevronLeft size={24} strokeWidth={3} />
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
          <ChevronRight size={24} strokeWidth={3} />
        </button>
      </div>

      {selectedOperation ? (
        <div className="operation-modal-backdrop" role="presentation">
          <section
            className="operation-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Modifier ${selectedOperation.name}`}
          >
            <header className="operation-modal-header">
              <div>
                <span className="operation-sequence">#{selectedOperation.sequence}</span>
                <h2>{selectedOperation.name}</h2>
                <p>{getMeta(selectedOperation)}</p>
              </div>
              <div className="operation-planned-chip">
                <span>Planifiee</span>
                <strong>{selectedOperation.quantityPlanned}</strong>
              </div>
              <StatusBadge label={selectedOperation.status} />
            </header>

            <div className="operation-modal-body">
              <div className="operation-edit-quantities">
                {quantityFields.map(({ field, label }) => {
                  const nextValue = selectedOperation[field] + draft[field]
                  const isSelected = selectedField === field

                  return (
                    <div
                      className={
                        isSelected ? 'operation-quantity-card active' : 'operation-quantity-card'
                      }
                      role="button"
                      tabIndex={0}
                      key={field}
                      onClick={() => setSelectedField(field)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          setSelectedField(field)
                        }
                      }}
                    >
                      <span>{label}</span>
                      <strong>{nextValue}</strong>
                      {/* <small>
                        Actuel {selectedOperation[field]} | Ajustement {draft[field] > 0 ? '+' : ''}
                        {draft[field]}
                      </small> */}
                      <div className="operation-quantity-controls">
                        <button
                          type="button"
                          disabled={savingOperationId === selectedOperation.id || nextValue <= 0}
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedField(field)
                            adjustQuantity(selectedOperation, field, -1)
                          }}
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          value={draft[field]}
                          disabled={savingOperationId === selectedOperation.id}
                          onFocus={() => setSelectedField(field)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            setQuantityDelta(
                              selectedOperation,
                              field,
                              Number(event.target.value || 0)
                            )
                          }
                        />
                        <button
                          type="button"
                          disabled={savingOperationId === selectedOperation.id}
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedField(field)
                            adjustQuantity(selectedOperation, field, 1)
                          }}
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="numeric-keyboard" aria-label="Clavier numerique">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((key) => (
                  <button
                    type="button"
                    key={key}
                    disabled={savingOperationId === selectedOperation.id}
                    onClick={() => pressNumberKey(selectedOperation, key)}
                  >
                    {key}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={savingOperationId === selectedOperation.id}
                  onClick={() => deleteNumberKey(selectedOperation)}
                >
                  Suppr
                </button>
                <button
                  type="button"
                  disabled={savingOperationId === selectedOperation.id}
                  onClick={() => setQuantityDelta(selectedOperation, selectedField, 0)}
                >
                  Effacer
                </button>
              </div>
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <footer className="operation-modal-actions">
              <button
                className="secondary-button"
                type="button"
                disabled={savingOperationId === selectedOperation.id}
                onClick={closeOperation}
              >
                Annuler
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={savingOperationId === selectedOperation.id}
                onClick={saveOperation}
              >
                {savingOperationId === selectedOperation.id ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  )
}

export default OperationQuantityList
