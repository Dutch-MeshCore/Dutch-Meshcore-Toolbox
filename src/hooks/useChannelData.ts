import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Channel, ChannelMeta } from '../types'

type LocalEdits = Record<string, Partial<ChannelMeta> | null>

export function buildChannels(
  metaMap: Record<string, ChannelMeta>,
  localEdits: LocalEdits,
  serverMode: boolean
): Channel[] {
  return Object.keys(metaMap).sort().map(name => {
    const hexKey = metaMap[name]?.channel_hash ?? ''
    const base = metaMap[name]
    const local = serverMode ? undefined : localEdits[name]
    if (local === null) {
      return { channel: name, _key: hexKey, _hasMeta: false, _localEdit: true }
    }
    const merged: Channel = { ...base, channel: name, _key: hexKey, _hasMeta: false, _localEdit: false }
    merged._hasMeta = !!(metaMap[name] || (local && Object.keys(local).length > 0))
    merged._localEdit = !serverMode && !!local
    if (local) Object.assign(merged, local)
    return merged
  })
}

export function useChannelData(serverMode: boolean, localEdits: LocalEdits) {
  const [metaMap, setMetaMap] = useState<Record<string, ChannelMeta>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('./data/channels.json')
        if (!res.ok) throw new Error(`channels.json: ${res.status}`)
        const arr: ChannelMeta[] = await res.json()
        const newMeta: Record<string, ChannelMeta> = {}
        for (const c of arr) newMeta[c.channel] = c
        if (!cancelled) { setMetaMap(newMeta); setLoading(false) }
      } catch (e) {
        if (!cancelled) { setError((e as Error).message); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const allChannels = useMemo(
    () => buildChannels(metaMap, localEdits, serverMode),
    [metaMap, localEdits, serverMode]
  )

  const rebuildMeta = useCallback((updatedMeta: Record<string, ChannelMeta>) => {
    setMetaMap(updatedMeta)
  }, [])

  return { allChannels, metaMap, loading, error, rebuildMeta }
}
