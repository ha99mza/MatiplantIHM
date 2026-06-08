export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
export type OrderPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type OperationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export type ApiUser = {
  id: string
  firstName: string
  lastName: string
  email: string
}

export type Client = {
  id: string
  code: string
  name: string
  email: string
}

export type Product = {
  id: string
  code: string
  name: string
  description: string | null
}

export type Machine = {
  id: string
  name: string
  code: string
}

export type Worker = {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  position?: string
  department?: string
  skillsWithRatings?: WorkerSkill[]
  isActive?: boolean
  hiredAt?: string
  terminatedAt?: string | null
  createdAt?: string
  updatedAt?: string
  teamId?: string | null
  workstationId?: string | null
  team?: Record<string, unknown> | null
  workstation?: Record<string, unknown> | null
  orderOperations?: WorkerOrderOperation[]
}

export type WorkerSkill = {
  rating: number
  skillId: string
  skillCode: string
  skillName: string
  skillCategory: string
}

export type WorkerOperationOrder = {
  id: string
  code: string
  status: OrderStatus
  client: {
    name: string
  }
}

export type WorkerOrderOperation = {
  id: string
  sequence: number
  name: string
  status: OperationStatus
  quantityPlanned: number
  quantityProduced: number
  quantityMissing: number
  quantityRejected: number
  order: WorkerOperationOrder
}

export type ProgressHistoryItem = {
  id: string
  previousQuantityProduced: number
  previousQuantityRejected: number
  previousQuantityMissing: number
  previousStatus: string
  newQuantityProduced: number
  newQuantityRejected: number
  newQuantityMissing: number
  newStatus: string
  rejectedNotes: string | null
  missingNotes: string | null
  createdAt: string
  user: ApiUser
}

export type Operation = {
  id: string
  sequence: number
  name: string
  status: OperationStatus
  quantityPlanned: number
  quantityProduced: number
  quantityRejected: number
  quantityMissing: number
  rejectedNotes: string | null
  missingNotes: string | null
  startDate: string | null
  endDate: string | null
  actualStartDate: string | null
  actualEndDate: string | null
  machineId: string | null
  workerId: string | null
  machine: Machine | null
  worker: Worker | null
  progressHistory: ProgressHistoryItem[]
}

export type Order = {
  id: string
  code: string
  clientReference: string | null
  status: OrderStatus
  priority: OrderPriority
  clientId: string
  productId: string
  quantityPlanned: number
  quantityProduced: number
  quantityRejected: number
  startDate: string
  endDate: string
  actualStartDate: string | null
  actualEndDate: string | null
  notes: string
  tenantId: string
  createdAt: string
  updatedAt: string
  client: Client
  product: Product
  operations: Operation[]
}

export type OrdersApiResponse = {
  success: boolean
  data?: {
    orders?: Order[]
  }
}

export type WorkersApiResponse = {
  success: boolean
  data?: {
    workers?: Worker[]
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  timestamp?: string
}

export type OperationQuantitiesPayload = {
  quantityProduced: number
  quantityRejected: number
  quantityMissing: number
}

export type QuantityField = keyof OperationQuantitiesPayload
