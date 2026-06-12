import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { AlertTriangle, Cable, CheckCircle2, RefreshCw, Wifi } from 'lucide-react'
import PageShell from '../components/PageShell'
import VirtualKeyboard from '../components/VirtualKeyboard'
import { getErrorMessage } from '../services/matiplantApi'
import {
  connectEthernet,
  connectWifi,
  fetchNetworkStatus,
  scanWifiNetworks
} from '../services/networkApi'
import type { NetworkDevice, NetworkStatus, WifiNetwork } from '../types/network'

function isEthernetDevice(device: NetworkDevice): boolean {
  const type = device.type.toLowerCase()

  return type.includes('ethernet') || type.includes('wired')
}

function formatDeviceType(type?: string): string {
  if (!type) {
    return '-'
  }

  if (type.includes('802-11') || type.toLowerCase() === 'wifi') {
    return 'WiFi'
  }

  if (type.includes('802-3') || type.toLowerCase().includes('ethernet')) {
    return 'Ethernet'
  }

  return type
}

function connectionLabel(status: NetworkStatus | null): string {
  if (!status?.activeConnections.length) {
    return '-'
  }

  return status.activeConnections
    .map((connection) => `${connection.name} / ${connection.device}`)
    .join(', ')
}

type KeyboardTarget = 'ssid' | 'password'

function SettingsPage(): React.JSX.Element {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null)
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([])
  const [selectedSsid, setSelectedSsid] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [keyboardTarget, setKeyboardTarget] = useState<KeyboardTarget | null>(null)
  const [isStatusLoading, setIsStatusLoading] = useState(true)
  const [isWifiLoading, setIsWifiLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [wifiError, setWifiError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const keyboardAreaRef = useRef<HTMLDivElement>(null)

  const loadNetworkStatus = useCallback(async (): Promise<void> => {
    setIsStatusLoading(true)
    setStatusError(null)

    try {
      const nextStatus = await fetchNetworkStatus()
      setNetworkStatus(nextStatus)
      setStatusError(nextStatus.errors.length > 0 ? nextStatus.errors.join(' | ') : null)
    } catch (error) {
      setStatusError(getErrorMessage(error))
    } finally {
      setIsStatusLoading(false)
    }
  }, [])

  const loadWifiNetworks = useCallback(async (): Promise<void> => {
    setIsWifiLoading(true)
    setWifiError(null)

    try {
      const nextNetworks = await scanWifiNetworks()
      setWifiNetworks(nextNetworks)
      setSelectedSsid((currentSsid) => {
        if (currentSsid) {
          return currentSsid
        }

        return nextNetworks.find((network) => network.inUse)?.ssid ?? nextNetworks[0]?.ssid ?? ''
      })
    } catch (error) {
      setWifiError(getErrorMessage(error))
    } finally {
      setIsWifiLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadInitialNetworkStatus = async (): Promise<void> => {
      try {
        const nextStatus = await fetchNetworkStatus()

        if (!isMounted) {
          return
        }

        setNetworkStatus(nextStatus)
        setStatusError(nextStatus.errors.length > 0 ? nextStatus.errors.join(' | ') : null)
      } catch (error) {
        if (isMounted) {
          setStatusError(getErrorMessage(error))
        }
      } finally {
        if (isMounted) {
          setIsStatusLoading(false)
        }
      }
    }

    const loadInitialWifiNetworks = async (): Promise<void> => {
      try {
        const nextNetworks = await scanWifiNetworks()

        if (!isMounted) {
          return
        }

        setWifiNetworks(nextNetworks)
        setSelectedSsid(
          nextNetworks.find((network) => network.inUse)?.ssid ?? nextNetworks[0]?.ssid ?? ''
        )
      } catch (error) {
        if (isMounted) {
          setWifiError(getErrorMessage(error))
        }
      } finally {
        if (isMounted) {
          setIsWifiLoading(false)
        }
      }
    }

    void loadInitialNetworkStatus()
    void loadInitialWifiNetworks()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!keyboardTarget) {
      return
    }

    const hideKeyboardOnOutsideClick = (event: MouseEvent): void => {
      if (!keyboardAreaRef.current?.contains(event.target as Node)) {
        setKeyboardTarget(null)
      }
    }

    document.addEventListener('mousedown', hideKeyboardOnOutsideClick)

    return () => {
      document.removeEventListener('mousedown', hideKeyboardOnOutsideClick)
    }
  }, [keyboardTarget])

  const ethernetDevices = useMemo(
    () => networkStatus?.devices.filter(isEthernetDevice) ?? [],
    [networkStatus]
  )
  const selectedWifiNetwork = useMemo(
    () => wifiNetworks.find((network) => network.ssid === selectedSsid) ?? null,
    [selectedSsid, wifiNetworks]
  )
  const visibleError = actionError ?? wifiError ?? statusError
  const primaryDevice = networkStatus?.primaryDevice ?? null
  const keyboardValue =
    keyboardTarget === 'password' ? wifiPassword : keyboardTarget === 'ssid' ? selectedSsid : ''

  const updateKeyboardValue = (value: string): void => {
    if (keyboardTarget === 'password') {
      setWifiPassword(value)
      return
    }

    if (keyboardTarget === 'ssid') {
      setSelectedSsid(value)
    }
  }

  const refreshAll = (): void => {
    setActionError(null)
    setMessage(null)
    void loadNetworkStatus()
    void loadWifiNetworks()
  }

  const handleConnectWifi = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    if (!selectedSsid.trim()) {
      setActionError('Choisir un WiFi.')
      return
    }

    setIsConnecting(true)
    setActionError(null)
    setMessage(null)

    try {
      const nextStatus = await connectWifi({
        ssid: selectedSsid.trim(),
        password: wifiPassword
      })
      setNetworkStatus(nextStatus)
      setStatusError(nextStatus.errors.length > 0 ? nextStatus.errors.join(' | ') : null)
      setWifiPassword('')
      setMessage(`WiFi connecte: ${selectedSsid.trim()}`)
      void loadWifiNetworks()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnectEthernet = async (deviceName: string): Promise<void> => {
    setIsConnecting(true)
    setActionError(null)
    setMessage(null)

    try {
      const nextStatus = await connectEthernet(deviceName)
      setNetworkStatus(nextStatus)
      setStatusError(nextStatus.errors.length > 0 ? nextStatus.errors.join(' | ') : null)
      setMessage(`Ethernet connecte: ${deviceName}`)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <PageShell title="Reglage" hideHeader>
      <section className="settings-page">
        <div className="settings-feedback" aria-live="polite">
          {visibleError ? (
            <span className="settings-error">
              <AlertTriangle size={18} strokeWidth={2.6} />
              {visibleError}
            </span>
          ) : null}
          {!visibleError && message ? (
            <span className="settings-success">
              <CheckCircle2 size={18} strokeWidth={2.6} />
              {message}
            </span>
          ) : null}
        </div>

        <section className="network-status-grid" aria-label="Etat reseau">
          <article className="network-status-card">
            <span>Adresse IP</span>
            <strong>{isStatusLoading ? '...' : (networkStatus?.primaryIp ?? '-')}</strong>
          </article>
          <article className="network-status-card">
            <span>Adresse MAC</span>
            <strong>{isStatusLoading ? '...' : (networkStatus?.primaryMac ?? '-')}</strong>
          </article>
          <article className="network-status-card">
            <span>WiFi actuel</span>
            <strong>{isStatusLoading ? '...' : (networkStatus?.currentWifi ?? '-')}</strong>
          </article>
          <article className="network-status-card">
            <span>Interface</span>
            <strong>
              {isStatusLoading
                ? '...'
                : primaryDevice
                  ? `${primaryDevice.name} / ${formatDeviceType(primaryDevice.type)}`
                  : connectionLabel(networkStatus)}
            </strong>
          </article>
        </section>

        <section className="network-workspace settings-workspace-simple" ref={keyboardAreaRef}>
          <form
            className="settings-panel wifi-connect-panel wifi-connect-panel-simple"
            onSubmit={handleConnectWifi}
          >
            <header className="settings-panel-header">
              <div>
                <Wifi size={26} strokeWidth={2.6} />
                <strong>Connexion WiFi</strong>
              </div>
              <div className="settings-panel-actions">
                <button
                  className="secondary-button compact-action"
                  type="button"
                  disabled={isWifiLoading || isConnecting}
                  onClick={loadWifiNetworks}
                >
                  <RefreshCw size={18} strokeWidth={2.8} />
                  <span>Scanner</span>
                </button>
                <button
                  className="secondary-button compact-action"
                  type="button"
                  disabled={isStatusLoading || isConnecting}
                  onClick={refreshAll}
                >
                  <RefreshCw size={18} strokeWidth={2.8} />
                  <span>Actualiser</span>
                </button>
              </div>
            </header>

            <label className="network-field">
              <span>WiFi</span>
              <input
                type="text"
                list="wifi-network-options"
                value={selectedSsid}
                disabled={isConnecting}
                placeholder={isWifiLoading ? 'Scan...' : 'Choisir un WiFi'}
                //onFocus={() => setKeyboardTarget('ssid')}
                onChange={(event) => setSelectedSsid(event.target.value)}
              />
              <datalist id="wifi-network-options">
                {wifiNetworks.map((network) => (
                  <option
                    value={network.ssid}
                    key={`${network.ssid}-${network.security}`}
                    label={`${network.signal}% / ${network.security}`}
                  />
                ))}
              </datalist>
            </label>

            <label className="network-field">
              <span>Mot de passe</span>
              <input
                type="password"
                value={wifiPassword}
                disabled={isConnecting}
                onFocus={() => setKeyboardTarget('password')}
                onChange={(event) => setWifiPassword(event.target.value)}
              />
            </label>

            <div className="selected-wifi-summary">
              <span>{selectedWifiNetwork ? `${selectedWifiNetwork.signal}%` : '-'}</span>
              <span>{selectedWifiNetwork?.security ?? '-'}</span>
              <span>{isWifiLoading ? 'Scan...' : `${wifiNetworks.length} WiFi`}</span>
            </div>

            <button
              className="primary-button network-submit-button"
              type="submit"
              disabled={isConnecting || !selectedSsid.trim()}
            >
              {isConnecting ? 'Connexion...' : 'Connecter WiFi'}
            </button>

            {keyboardTarget ? (
              <VirtualKeyboard value={keyboardValue} onChange={updateKeyboardValue} />
            ) : null}
          </form>

          <section className="settings-panel ethernet-panel" aria-label="Ethernet">
            <header className="settings-panel-header">
              <div>
                <Cable size={26} strokeWidth={2.6} />
                <strong>Ethernet</strong>
              </div>
            </header>

            <div className="ethernet-device-list">
              {ethernetDevices.length === 0 ? (
                <p className="state-text">Aucune interface Ethernet.</p>
              ) : null}
              {ethernetDevices.map((device) => (
                <button
                  className="ethernet-device-button"
                  type="button"
                  key={device.name}
                  disabled={isConnecting}
                  onClick={() => void handleConnectEthernet(device.name)}
                >
                  <span>
                    <strong>{device.name}</strong>
                    <small>{device.connection ?? device.state}</small>
                  </span>
                  <em>{device.ipv4[0] ?? '-'}</em>
                  <b>{device.state === 'connected' ? 'Actif' : 'Connecter'}</b>
                </button>
              ))}
            </div>
          </section>
        </section>
      </section>
    </PageShell>
  )
}

export default SettingsPage
