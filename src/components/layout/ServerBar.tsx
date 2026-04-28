import { Link } from 'react-router-dom'
import type { ServerStatus } from '../../hooks/useServerMode'

export default function ServerBar({ status }: { status: ServerStatus }) {
  const className = `server-bar ${status}`
  if (status === 'checking') return <div className={className}>Checking for local server…</div>
  if (status === 'connected') return (
    <div className={className}>
      🟢 Local server connected — edits save directly to <code>channels.json</code> on disk.
      &nbsp;|&nbsp; <Link to="/">Switch to view-only site</Link>
    </div>
  )
  return (
    <div className={className}>
      ⚠️ No local server detected. Open a terminal in the repo root and run: <code>node server.js</code>
      &nbsp; then refresh. &nbsp;|&nbsp; Edits will use localStorage as fallback.
    </div>
  )
}
