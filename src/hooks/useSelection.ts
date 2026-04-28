import { useState, useCallback } from 'react'
import type { Channel } from '../types'

export function useSelection(filtered: Channel[]) {
  const [selection, setSelection] = useState<Set<string>>(new Set())

  const toggle = useCallback((name: string) => {
    setSelection(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }, [])

  const selectAllFiltered = useCallback(() => {
    setSelection(new Set(filtered.map(c => c.channel)))
  }, [filtered])

  const clear = useCallback(() => setSelection(new Set()), [])

  return { selection, toggle, selectAllFiltered, clear }
}
