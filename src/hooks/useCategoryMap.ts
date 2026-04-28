import { useMemo } from 'react'
import type { Channel } from '../types'

export interface CategoryEntry {
  display: string
  subs: Set<string>
}

export function useCategoryMap(allChannels: Channel[]) {
  return useMemo(() => {
    const map: Record<string, CategoryEntry> = {}
    for (const c of allChannels) {
      const cat = (c.category || '').trim()
      const sub = (c.subcategory || '').trim()
      if (!cat) continue
      const key = cat.toLowerCase()
      if (!map[key]) map[key] = { display: cat, subs: new Set() }
      if (sub) map[key].subs.add(sub)
    }
    return map
  }, [allChannels])
}
