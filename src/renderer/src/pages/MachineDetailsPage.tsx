import { useState } from 'react'
import PageShell from '../components/PageShell'
import StatusBadge from '../components/StatusBadge'
import { getErrorMessage, updateMachineStatus } from '../services/matiplantApi'
import type { Machine, MachineStatus } from '../types/matiplant'

type MachineDetailsPageProps = {
  machine: Machine
  onBack: () => void
  onMachineUpdated: (machine: Machine) => void
}

const machineStatusOptions: MachineStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE']

function detailValue(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

function MachineDetailsPage({
  machine,
  onBack,
  onMachineUpdated
}: MachineDetailsPageProps): React.JSX.Element {
  const [currentMachine, setCurrentMachine] = useState(machine)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveStatus = async (status: MachineStatus): Promise<void> => {
    if (currentMachine.status === status) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await updateMachineStatus(currentMachine.id, { status })
      const nextMachine = {
        ...currentMachine,
        status
      }
      setCurrentMachine(nextMachine)
      onMachineUpdated(nextMachine)
    } catch (nextError) {
      setError(getErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageShell
      title="Machine details"
      subtitle={`${currentMachine.code} / ${currentMachine.name}`}
      onBack={onBack}
    >
      <section className="machine-details-page">
        <div className="machine-info-grid">
          <div>
            <span>Name</span>
            <strong>{detailValue(currentMachine.name)}</strong>
          </div>
          <div>
            <span>Code</span>
            <strong>{detailValue(currentMachine.code)}</strong>
          </div>
          <div>
            <span>Type</span>
            <strong>{detailValue(currentMachine.type)}</strong>
          </div>
          <div>
            <span>Manufacturer</span>
            <strong>{detailValue(currentMachine.manufacturer)}</strong>
          </div>
          <div>
            <span>Model</span>
            <strong>{detailValue(currentMachine.model)}</strong>
          </div>
          <div>
            <span>Serial</span>
            <strong>{detailValue(currentMachine.serialNumber)}</strong>
          </div>
        </div>

        <div className="machine-status-panel">
          <span>Status</span>
          {currentMachine.status ? (
            <StatusBadge label={currentMachine.status} />
          ) : (
            <strong>-</strong>
          )}
          <div className="machine-status-actions">
            {machineStatusOptions.map((status) => (
              <button
                className={currentMachine.status === status ? 'active' : ''}
                type="button"
                key={status}
                disabled={isSaving}
                onClick={() => saveStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </section>
    </PageShell>
  )
}

export default MachineDetailsPage
