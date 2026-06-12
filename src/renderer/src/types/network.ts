export type NetworkDevice = {
  name: string
  type: string
  state: string
  connection: string | null
  macAddress: string | null
  ipv4: string[]
  ipv6: string[]
}

export type ActiveNetworkConnection = {
  name: string
  type: string
  device: string
}

export type NetworkStatus = {
  devices: NetworkDevice[]
  activeConnections: ActiveNetworkConnection[]
  currentWifi: string | null
  primaryDevice: NetworkDevice | null
  primaryIp: string | null
  primaryMac: string | null
  errors: string[]
}

export type WifiNetwork = {
  ssid: string
  signal: number
  security: string
  inUse: boolean
}

export type WifiConnectPayload = {
  ssid: string
  password?: string
}
