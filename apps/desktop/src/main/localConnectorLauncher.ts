import { app } from 'electron'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

type ConnectorMode = 'development' | 'packaged'
type ConnectorState = 'idle' | 'starting' | 'running' | 'stopped' | 'failed'

type ConnectorStatus = {
  mode: ConnectorMode
  state: ConnectorState
  pid: number | null
  command: string | null
  args: string[]
  lastError: string | null
}

let connectorProcess: ChildProcessWithoutNullStreams | null = null

const status: ConnectorStatus = {
  mode: app.isPackaged ? 'packaged' : 'development',
  state: 'idle',
  pid: null,
  command: null,
  args: [],
  lastError: null
}

function getBundledConnectorPath(): string {
  const executableName = process.platform === 'win32' ? 'local-connector.exe' : 'local-connector'
  return join(process.resourcesPath, 'bin', executableName)
}

function getDevelopmentConnectorRoot(): string {
  return join(app.getAppPath(), '..', 'local-connector')
}

function resolveConnectorCommand(): { command: string; args: string[]; cwd?: string } {
  if (app.isPackaged) {
    const bundledConnectorPath = getBundledConnectorPath()
    if (!existsSync(bundledConnectorPath)) {
      throw new Error(`Bundled connector executable not found at ${bundledConnectorPath}`)
    }

    return {
      command: bundledConnectorPath,
      args: []
    }
  }

  return {
    command: process.env.BUN_PATH || 'bun',
    args: ['run', 'dev'],
    cwd: getDevelopmentConnectorRoot()
  }
}

export function getConnectorStatus(): ConnectorStatus {
  return { ...status }
}

export async function startConnector(): Promise<void> {
  if (connectorProcess) {
    return
  }

  const { command, args, cwd } = resolveConnectorCommand()

  status.mode = app.isPackaged ? 'packaged' : 'development'
  status.state = 'starting'
  status.command = command
  status.args = args
  status.lastError = null

  connectorProcess = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    env: process.env
  })

  status.pid = connectorProcess.pid ?? null

  connectorProcess.stdout.on('data', (chunk) => {
    console.log(`[local-connector] ${chunk.toString().trim()}`)
  })

  connectorProcess.stderr.on('data', (chunk) => {
    const message = chunk.toString().trim()
    if (!message) {
      return
    }

    status.lastError = message
    console.error(`[local-connector] ${message}`)
  })

  connectorProcess.on('spawn', () => {
    status.state = 'running'
  })

  connectorProcess.on('exit', (code, signal) => {
    connectorProcess = null
    status.pid = null
    status.state = code === 0 ? 'stopped' : 'failed'
    status.lastError =
      code === 0
        ? null
        : `Connector exited with code ${code ?? 'null'} and signal ${signal ?? 'null'}`
  })

  connectorProcess.on('error', (error) => {
    connectorProcess = null
    status.pid = null
    status.state = 'failed'
    status.lastError = error.message
  })
}

export function stopConnector(): void {
  if (!connectorProcess) {
    return
  }

  connectorProcess.kill()
  connectorProcess = null
  status.pid = null
  status.state = 'stopped'
}
