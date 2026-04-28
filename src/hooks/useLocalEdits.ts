import { useState, useCallback } from 'react'
import type { ChannelMeta } from '../types'

const LS_KEY = 'meshcore-local-edits'

type Edits = Record<string, Partial<ChannelMeta> | null>

export function useLocalEdits() {
  const [localEdits, setLocalEdits] = useState<Edits>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
  })

  const persist = useCallback((edits: Edits) => {
    setLocalEdits(edits)
    localStorage.setItem(LS_KEY, JSON.stringify(edits))
  }, [])

  const applyEdit = useCallback((name: string, patch: Partial<ChannelMeta>) => {
    persist({ ...localEdits, [name]: patch })
  }, [localEdits, persist])

  const removeEdit = useCallback((name: string) => {
    persist({ ...localEdits, [name]: null })
  }, [localEdits, persist])

  const clearAll = useCallback(() => persist({}), [persist])

  return { localEdits, applyEdit, removeEdit, clearAll }
}
