import { ElectronAPI } from '@electron-toolkit/preload'

type ConnectorStatus = {
  mode: 'development' | 'packaged'
  state: 'idle' | 'starting' | 'running' | 'stopped' | 'failed'
  pid: number | null
  command: string | null
  args: string[]
  lastError: string | null
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getConnectorStatus: () => Promise<ConnectorStatus>
    }
  }
}
