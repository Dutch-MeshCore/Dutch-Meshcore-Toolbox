import { useState, useEffect } from 'react'

export type ServerStatus = 'checking' | 'connected' | 'disconnected'

export function useServerMode() {
  const [status, setStatus] = useState<ServerStatus>('checking')

  useEffect(() => {
    async function check() {
      try {
        const r = await fetch('/api/status', { signal: AbortSignal.timeout(1500) })
        const j = await r.json()
        setStatus(j.ok === true ? 'connected' : 'disconnected')
      } catch {
        setStatus('disconnected')
      }
    }
    check()
  }, [])

  return { status, serverMode: status === 'connected' }
}
