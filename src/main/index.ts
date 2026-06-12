import { execFile } from 'child_process'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const MATIPLANT_API_BASE_URL = 'https://app.matiplant.com/api/external'
const MATIPLANT_BEARER_TOKEN = '63b6e90f292c78236a6ae34f2c90c8620d7b780e366fa666c1a56cbbcdcfa1e7'
const MATIPLANT_GET_ORDERS_URL = `${MATIPLANT_API_BASE_URL}/orders`
const MATIPLANT_GET_WORKERS_URL = `${MATIPLANT_API_BASE_URL}/workers?includeOperations=true`
const MATIPLANT_GET_MACHINES_URL = `${MATIPLANT_API_BASE_URL}/machines`
const MATIPLANT_UPDATE_MACHINE_URL = `${MATIPLANT_API_BASE_URL}/machines`
const MATIPLANT_UPDATE_OPERATION_URL = `${MATIPLANT_API_BASE_URL}/operations`


type OperationQuantitiesPayload = {
  quantityProduced: number
  quantityRejected: number
  quantityMissing: number
}

type MachineStatusPayload = {
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
}

type WifiConnectPayload = {
  ssid: string
  password?: string
}

type NmcliDeviceStatus = {
  deviceName: string
  type: string
  state: string
  connection: string | null
}

type ActiveNetworkConnection = {
  name: string
  type: string
  device: string
}

type NetworkDeviceInfo = {
  name: string
  type: string
  state: string
  connection: string | null
  macAddress: string | null
  ipv4: string[]
  ipv6: string[]
}

type WifiNetworkInfo = {
  ssid: string
  signal: number
  security: string
  inUse: boolean
}

type NetworkStatus = {
  devices: NetworkDeviceInfo[]
  activeConnections: ActiveNetworkConnection[]
  currentWifi: string | null
  primaryDevice: NetworkDeviceInfo | null
  primaryIp: string | null
  primaryMac: string | null
  errors: string[]
}

type IpAddressInfo = {
  family?: string
  local?: string
}

type IpDeviceInfo = {
  ifname?: string
  address?: string
  addr_info?: IpAddressInfo[]
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

function commandErrorMessage(command: string, error: unknown, stderr?: string): string {
  const nodeError = error as NodeJS.ErrnoException

  if (nodeError.code === 'ENOENT') {
    return `Commande Linux indisponible: ${command}`
  }

  const errorMessage = error instanceof Error ? error.message : String(error)
  const stderrMessage = stderr?.trim()

  return stderrMessage || errorMessage || `Erreur commande: ${command}`
}

function runLinuxCommand(command: string, args: string[], timeout = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { encoding: 'utf8', timeout, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(commandErrorMessage(command, error, stderr)))
          return
        }

        resolve(stdout)
      }
    )
  })
}

function splitNmcliFields(line: string): string[] {
  const fields: string[] = []
  let currentField = ''
  let isEscaped = false

  for (const character of line) {
    if (isEscaped) {
      currentField += character
      isEscaped = false
      continue
    }

    if (character === '\\') {
      isEscaped = true
      continue
    }

    if (character === ':') {
      fields.push(currentField)
      currentField = ''
      continue
    }

    currentField += character
  }

  if (isEscaped) {
    currentField += '\\'
  }

  fields.push(currentField)
  return fields
}

function normalizeNmcliValue(value?: string): string | null {
  if (!value || value === '--') {
    return null
  }

  return value
}

function isWifiType(type: string): boolean {
  const normalizedType = type.toLowerCase()

  return (
    normalizedType === 'wifi' ||
    normalizedType.includes('wireless') ||
    normalizedType.includes('802-11')
  )
}

function parseNmcliDeviceStatus(output: string): NmcliDeviceStatus[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [deviceName = '', type = 'unknown', state = 'unknown', connection = ''] =
        splitNmcliFields(line)

      return {
        deviceName,
        type,
        state,
        connection: normalizeNmcliValue(connection)
      }
    })
    .filter((device) => device.deviceName && device.deviceName !== 'lo')
}

function parseActiveConnections(output: string): ActiveNetworkConnection[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = '', type = 'unknown', device = ''] = splitNmcliFields(line)

      return { name, type, device }
    })
    .filter((connection) => connection.name && connection.device && connection.device !== 'lo')
}

function parseIpDevices(output: string): IpDeviceInfo[] {
  try {
    const parsedOutput = JSON.parse(output)

    if (Array.isArray(parsedOutput)) {
      return parsedOutput as IpDeviceInfo[]
    }
  } catch {
    return []
  }

  return []
}

function parseWifiNetworks(output: string): WifiNetworkInfo[] {
  const wifiNetworksByKey = new Map<string, WifiNetworkInfo>()

  output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [ssid = '', signal = '0', security = '', inUse = ''] = splitNmcliFields(line)
      const normalizedSsid = ssid.trim()

      if (!normalizedSsid) {
        return
      }

      const wifiNetwork: WifiNetworkInfo = {
        ssid: normalizedSsid,
        signal: Number.parseInt(signal, 10) || 0,
        security: normalizeNmcliValue(security)?.trim() ?? 'Open',
        inUse: inUse === '*' || inUse.toLowerCase() === 'yes'
      }
      const wifiKey = `${wifiNetwork.ssid}:${wifiNetwork.security}`
      const existingNetwork = wifiNetworksByKey.get(wifiKey)

      if (!existingNetwork || wifiNetwork.inUse || wifiNetwork.signal > existingNetwork.signal) {
        wifiNetworksByKey.set(wifiKey, wifiNetwork)
      }
    })

  return [...wifiNetworksByKey.values()].sort((left, right) => {
    if (left.inUse !== right.inUse) {
      return left.inUse ? -1 : 1
    }

    return right.signal - left.signal
  })
}

function buildNetworkDevices(
  nmcliDevices: NmcliDeviceStatus[],
  ipDevices: IpDeviceInfo[]
): NetworkDeviceInfo[] {
  const devicesByName = new Map<string, NetworkDeviceInfo>()

  nmcliDevices.forEach((device) => {
    devicesByName.set(device.deviceName, {
      name: device.deviceName,
      type: device.type,
      state: device.state,
      connection: device.connection,
      macAddress: null,
      ipv4: [],
      ipv6: []
    })
  })

  ipDevices.forEach((ipDevice) => {
    if (!ipDevice.ifname || ipDevice.ifname === 'lo') {
      return
    }

    const currentDevice =
      devicesByName.get(ipDevice.ifname) ??
      ({
        name: ipDevice.ifname,
        type: 'unknown',
        state: 'unknown',
        connection: null,
        macAddress: null,
        ipv4: [],
        ipv6: []
      } satisfies NetworkDeviceInfo)

    currentDevice.macAddress = ipDevice.address ?? currentDevice.macAddress
    currentDevice.ipv4 =
      ipDevice.addr_info
        ?.filter((addressInfo) => addressInfo.family === 'inet' && addressInfo.local)
        .map((addressInfo) => addressInfo.local as string) ?? []
    currentDevice.ipv6 =
      ipDevice.addr_info
        ?.filter((addressInfo) => addressInfo.family === 'inet6' && addressInfo.local)
        .map((addressInfo) => addressInfo.local as string) ?? []

    devicesByName.set(currentDevice.name, currentDevice)
  })

  return [...devicesByName.values()].sort((left, right) => {
    if (left.state === 'connected' && right.state !== 'connected') {
      return -1
    }

    if (right.state === 'connected' && left.state !== 'connected') {
      return 1
    }

    return left.name.localeCompare(right.name)
  })
}

async function readNetworkStatus(): Promise<NetworkStatus> {
  const [nmcliDevicesResult, activeConnectionsResult, ipDevicesResult] = await Promise.allSettled([
    runLinuxCommand('nmcli', ['-t', '-f', 'DEVICE,TYPE,STATE,CONNECTION', 'device', 'status']),
    runLinuxCommand('nmcli', ['-t', '-f', 'NAME,TYPE,DEVICE', 'connection', 'show', '--active']),
    runLinuxCommand('ip', ['-j', 'addr', 'show'])
  ])
  const errors: string[] = []

  if (nmcliDevicesResult.status === 'rejected') {
    errors.push(commandErrorMessage('nmcli', nmcliDevicesResult.reason))
  }

  if (activeConnectionsResult.status === 'rejected') {
    errors.push(commandErrorMessage('nmcli', activeConnectionsResult.reason))
  }

  if (ipDevicesResult.status === 'rejected') {
    errors.push(commandErrorMessage('ip', ipDevicesResult.reason))
  }

  const nmcliDevices =
    nmcliDevicesResult.status === 'fulfilled'
      ? parseNmcliDeviceStatus(nmcliDevicesResult.value)
      : []
  const activeConnections =
    activeConnectionsResult.status === 'fulfilled'
      ? parseActiveConnections(activeConnectionsResult.value)
      : []
  const ipDevices =
    ipDevicesResult.status === 'fulfilled' ? parseIpDevices(ipDevicesResult.value) : []
  const devices = buildNetworkDevices(nmcliDevices, ipDevices)
  const primaryDevice =
    devices.find((device) => device.state === 'connected' && device.ipv4.length > 0) ??
    devices.find((device) => device.ipv4.length > 0) ??
    devices.find((device) => device.state === 'connected') ??
    null
  const currentWifi =
    activeConnections.find((connection) => isWifiType(connection.type))?.name ?? null

  return {
    devices,
    activeConnections,
    currentWifi,
    primaryDevice,
    primaryIp: primaryDevice?.ipv4[0] ?? primaryDevice?.ipv6[0] ?? null,
    primaryMac: primaryDevice?.macAddress ?? null,
    errors
  }
}

async function scanWifiNetworks(): Promise<WifiNetworkInfo[]> {
  const output = await runLinuxCommand(
    'nmcli',
    ['-t', '-f', 'SSID,SIGNAL,SECURITY,IN-USE', 'device', 'wifi', 'list', '--rescan', 'yes'],
    20000
  )

  return parseWifiNetworks(output)
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

  ipcMain.handle('matiplant:get-machines', async () => {
    const response = await fetch(MATIPLANT_GET_MACHINES_URL, {
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
    'matiplant:update-machine-status',
    async (_, machineId: string, statusPayload: MachineStatusPayload) => {
      const response = await fetch(
        `${MATIPLANT_UPDATE_MACHINE_URL}?id=${encodeURIComponent(machineId)}`,
        {
          method: 'PUT',
          headers: buildApiHeaders(),
          body: JSON.stringify(statusPayload)
        }
      )
      const payload = await parseApiResponse(response)

      if (!response.ok) {
        throw new Error(apiErrorMessage(response, payload))
      }

      return payload
    }
  )

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

  ipcMain.handle('network:get-status', async () => {
    return readNetworkStatus()
  })

  ipcMain.handle('network:scan-wifi', async () => {
    return scanWifiNetworks()
  })

  ipcMain.handle('network:connect-wifi', async (_, payload: WifiConnectPayload) => {
    const ssid = payload.ssid.trim()

    if (!ssid) {
      throw new Error('SSID WiFi requis.')
    }

    const args = ['device', 'wifi', 'connect', ssid]
    const password = payload.password?.trim()

    if (password) {
      args.push('password', password)
    }

    await runLinuxCommand('nmcli', args, 30000)
    return readNetworkStatus()
  })

  ipcMain.handle('network:connect-ethernet', async (_, deviceName: string) => {
    const normalizedDeviceName = deviceName.trim()

    if (!normalizedDeviceName) {
      throw new Error('Interface Ethernet requise.')
    }

    await runLinuxCommand('nmcli', ['device', 'connect', normalizedDeviceName], 30000)
    return readNetworkStatus()
  })
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
