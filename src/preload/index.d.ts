import { ElectronAPI } from '@electron-toolkit/preload'

type MatiplantOperationQuantitiesPayload = {
  quantityProduced: number
  quantityRejected: number
  quantityMissing: number
}

interface MatiplantApi {
  getOrders: () => Promise<unknown>
  getWorkers: () => Promise<unknown>
  updateOperationQuantities: (
    operationId: string,
    quantities: MatiplantOperationQuantitiesPayload
  ) => Promise<unknown>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: MatiplantApi
  }
}
