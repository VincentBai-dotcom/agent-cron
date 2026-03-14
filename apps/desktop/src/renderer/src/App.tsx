import { useEffect, useState } from 'react'

type ConnectorStatus = Awaited<ReturnType<typeof window.api.getConnectorStatus>>

function App(): React.JSX.Element {
  const [connectorStatus, setConnectorStatus] = useState<ConnectorStatus | null>(null)

  useEffect(() => {
    void window.api.getConnectorStatus().then(setConnectorStatus)
  }, [])

  return (
    <main style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>agent-cron desktop</h1>
      <p>Desktop control app for task registration, drafts, and local connector supervision.</p>
      <section style={{ marginTop: 24 }}>
        <h2>Local connector</h2>
        {connectorStatus ? (
          <dl>
            <dt>Mode</dt>
            <dd>{connectorStatus.mode}</dd>
            <dt>State</dt>
            <dd>{connectorStatus.state}</dd>
            <dt>PID</dt>
            <dd>{connectorStatus.pid ?? 'not started'}</dd>
            <dt>Command</dt>
            <dd>{connectorStatus.command ?? 'unresolved'}</dd>
            <dt>Args</dt>
            <dd>{connectorStatus.args.join(' ') || '(none)'}</dd>
            <dt>Last error</dt>
            <dd>{connectorStatus.lastError ?? 'none'}</dd>
          </dl>
        ) : (
          <p>Loading connector status...</p>
        )}
      </section>
      <section style={{ marginTop: 24 }}>
        <h2>Planned surfaces</h2>
        <ul>
          <li>Task registration</li>
          <li>Job run dashboard</li>
          <li>Draft review queue</li>
        </ul>
      </section>
    </main>
  )
}

export default App
