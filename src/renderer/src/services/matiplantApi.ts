import type {
  Machine,
  MachineStatusPayload,
  MachinesApiResponse,
  OperationQuantitiesPayload,
  Order,
  OrdersApiResponse,
  Worker,
  WorkersApiResponse
} from '../types/matiplant'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Une erreur est survenue.'
}

export async function fetchOrders(): Promise<Order[]> {
  const response = (await window.api.getOrders()) as OrdersApiResponse

  if (!response?.success) {
    throw new Error('La liste des orders est indisponible.')
  }

  return response.data?.orders ?? []
}

export async function fetchWorkers(): Promise<Worker[]> {
  const response = (await window.api.getWorkers()) as WorkersApiResponse

  if (!response?.success) {
    throw new Error('La liste des workers est indisponible.')
  }

  return response.data?.workers ?? []
}

export async function fetchMachines(): Promise<Machine[]> {
  const response = (await window.api.getMachines()) as MachinesApiResponse

  if (!response?.success) {
    throw new Error('La liste des machines est indisponible.')
  }

  return response.data?.machines ?? []
}

export async function updateMachineStatus(
  machineId: string,
  statusPayload: MachineStatusPayload
): Promise<unknown> {
  return window.api.updateMachineStatus(machineId, statusPayload)
}

export async function updateOperationQuantities(
  operationId: string,
  quantities: OperationQuantitiesPayload
): Promise<unknown> {
  return window.api.updateOperationQuantities(operationId, quantities)
}

export { getErrorMessage }
