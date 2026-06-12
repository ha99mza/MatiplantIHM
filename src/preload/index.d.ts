import { ElectronAPI } from '@electron-toolkit/preload'

type MatiplantOperationQuantitiesPayload = {
  quantityProduced: number
  quantityRejected: number
  quantityMissing: number
}

type MatiplantMachineStatusPayload = {
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
}

type NetworkWifiConnectPayload = {
  ssid: string
  password?: string
}

interface MatiplantApi {
  getOrders: () => Promise<unknown>
  getWorkers: () => Promise<unknown>
  getMachines: () => Promise<unknown>
  updateMachineStatus: (
    machineId: string,
    statusPayload: MatiplantMachineStatusPayload
  ) => Promise<unknown>
  updateOperationQuantities: (
    operationId: string,
    quantities: MatiplantOperationQuantitiesPayload
  ) => Promise<unknown>
  getNetworkStatus: () => Promise<unknown>
  scanWifiNetworks: () => Promise<unknown>
  connectWifi: (payload: NetworkWifiConnectPayload) => Promise<unknown>
  connectEthernet: (deviceName: string) => Promise<unknown>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: MatiplantApi
  }
}
