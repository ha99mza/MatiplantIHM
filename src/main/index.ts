import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const MATIPLANT_API_BASE_URL = 'https://app.matiplant.com/api/external'
const MATIPLANT_BEARER_TOKEN = '63b6e90f292c78236a6ae34f2c90c8620d7b780e366fa666c1a56cbbcdcfa1e7'
const MATIPLANT_GET_ORDERS_URL = `${MATIPLANT_API_BASE_URL}/orders`
const MATIPLANT_GET_WORKERS_URL = `${MATIPLANT_API_BASE_URL}/workers?includeOperations=true`
const MATIPLANT_UPDATE_OPERATION_URL = `${MATIPLANT_API_BASE_URL}/operations`
type OperationQuantitiesPayload = {
  quantityProduced: number
  quantityRejected: number
  quantityMissing: number
}

function buildApiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(MATIPLANT_BEARER_TOKEN ? { Authorization: `Bearer ${MATIPLANT_BEARER_TOKEN}` } : {})
  }
}

async function parseApiResponse(response: Response): Promise<unknown> {
  const responseText = await response.text()

  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText)
  } catch {
    return responseText
  }
}

function apiErrorMessage(response: Response, payload: unknown): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = payload.message

    if (typeof message === 'string') {
      return message
    }
  }

  return `API error ${response.status}: ${response.statusText}`
}

function registerApiHandlers(): void {
  ipcMain.handle('matiplant:get-orders', async () => {
    const response = await fetch(MATIPLANT_GET_ORDERS_URL, {
      method: 'GET',
      headers: buildApiHeaders()
    })
    const payload = await parseApiResponse(response)

    if (!response.ok) {
      throw new Error(apiErrorMessage(response, payload))
    }

    return payload
  })

  ipcMain.handle('matiplant:get-workers', async () => {
    const response = await fetch(MATIPLANT_GET_WORKERS_URL, {
      method: 'GET',
      headers: buildApiHeaders()
    })
    const payload = await parseApiResponse(response)

    if (!response.ok) {
      throw new Error(apiErrorMessage(response, payload))
    }

    return payload
  })

  ipcMain.handle(
    'matiplant:update-operation-quantities',
    async (_, operationId: string, quantities: OperationQuantitiesPayload) => {
      const response = await fetch(
        `${MATIPLANT_UPDATE_OPERATION_URL}?id=${encodeURIComponent(operationId)}`,
        {
          method: 'PUT',
          headers: buildApiHeaders(),
          body: JSON.stringify(quantities)
        }
      )
      const payload = await parseApiResponse(response)

      if (!response.ok) {
        throw new Error(apiErrorMessage(response, payload))
      }

      return payload
    }
  )
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerApiHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
