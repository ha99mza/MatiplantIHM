import type { OperationStatus, OrderPriority, OrderStatus } from '../types/matiplant'

type StatusBadgeProps = {
  label: OrderStatus | OperationStatus | OrderPriority
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
}

function StatusBadge({ label }: StatusBadgeProps): React.JSX.Element {
  return <span className={`status-badge status-${label.toLowerCase()}`}>{statusLabels[label]}</span>
}

export default StatusBadge
