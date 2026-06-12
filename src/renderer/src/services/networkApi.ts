import type { NetworkStatus, WifiConnectPayload, WifiNetwork } from '../types/network'

export async function fetchNetworkStatus(): Promise<NetworkStatus> {
  return (await window.api.getNetworkStatus()) as NetworkStatus
}

export async function scanWifiNetworks(): Promise<WifiNetwork[]> {
  return (await window.api.scanWifiNetworks()) as WifiNetwork[]
}

export async function connectWifi(payload: WifiConnectPayload): Promise<NetworkStatus> {
  return (await window.api.connectWifi(payload)) as NetworkStatus
}

export async function connectEthernet(deviceName: string): Promise<NetworkStatus> {
  return (await window.api.connectEthernet(deviceName)) as NetworkStatus
}
