import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getOrders: (): Promise<unknown> => ipcRenderer.invoke('matiplant:get-orders'),
  getWorkers: (): Promise<unknown> => ipcRenderer.invoke('matiplant:get-workers'),
  updateOperationQuantities: (
    operationId: string,
    quantities: {
      quantityProduced: number
      quantityRejected: number
      quantityMissing: number
    }
  ): Promise<unknown> =>
    ipcRenderer.invoke('matiplant:update-operation-quantities', operationId, quantities)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
