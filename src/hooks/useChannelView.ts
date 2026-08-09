import { useState, useMemo, useCallback } from 'react'
import type { Channel, FilterState, SortField, SortDir } from '../types'
import { isDutch } from '../utils/analyzerChannels'

const LS_SORT    = 'meshcore-sort'
const LS_SORTDIR = 'meshcore-sortdir'

function sortChannels(arr: Channel[], sortBy: SortField, sortDir: SortDir): Channel[] {
  const d = sortDir === 'asc' ? 1 : -1
  return [...arr].sort((a, b) => {
    // Default view: Dutch-scoped channels first, then most recently active.
    if (sortBy === 'nl_activity') {
      const da = isDutch(a) ? 0 : 1
      const db = isDutch(b) ? 0 : 1
      if (da !== db) return da - db
      const la = a.last_seen || '', lb = b.last_seen || ''
      return la !== lb ? lb.localeCompare(la) : a.channel.localeCompare(b.channel)
    }
    if (sortBy === 'message_amount') {
      const na = a.message_amount ?? -1
      const nb = b.message_amount ?? -1
      return na !== nb ? d * (na - nb) : a.channel.localeCompare(b.channel)
    }
    let va = '', vb = ''
    switch (sortBy) {
      case 'alpha':       va = a.channel;              vb = b.channel;              break
      case 'country':     va = a.country     || '';    vb = b.country     || '';    break
      case 'region':      va = a.region      || '';    vb = b.region      || '';    break
      case 'scope':       va = (a.scopes||[])[0]||''; vb = (b.scopes||[])[0]||''; break
      case 'last_seen':   va = a.last_seen   || '';    vb = b.last_seen   || '';    break
    }
    const cmp = va.localeCompare(vb, undefined, { sensitivity: 'base' })
    return cmp !== 0 ? d * cmp : a.channel.localeCompare(b.channel)
  })
}

const EMPTY_FILTERS: FilterState = {
  search: '', region: '', scope: '', country: '',
  onlyScoped: false, minMessages: 0,
}

export function useChannelView(allChannels: Channel[]) {
  const [filters, setFiltersRaw] = useState<FilterState>(EMPTY_FILTERS)
  const [sortBy, setSortByRaw]   = useState<SortField>(() => (localStorage.getItem(LS_SORT) as SortField) || 'nl_activity')
  const [sortDir, setSortDirRaw] = useState<SortDir>(() => (localStorage.getItem(LS_SORTDIR) as SortDir) || 'asc')

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, val: FilterState[K]) => {
    setFiltersRaw(f => ({ ...f, [key]: val }))
  }, [])

  const clearFilters = useCallback(() => setFiltersRaw(EMPTY_FILTERS), [])

  const setSort = useCallback((field: SortField) => {
    setSortByRaw(prev => {
      const next = prev === field ? field : field
      localStorage.setItem(LS_SORT, next)
      return next
    })
    setSortDirRaw(prev => {
      const next = sortBy === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'
      localStorage.setItem(LS_SORTDIR, next)
      return next
    })
  }, [sortBy])

  const isFiltered = Object.values(filters).some(v => v !== '' && v !== false)

  const filtered = useMemo(() => {
    const { search, region, scope, country, onlyScoped, minMessages } = filters
    const q = search.trim().toLowerCase()
    const base = allChannels.filter(c => {
      if (onlyScoped && !c.scopes?.length)              return false
      if (region     && !(c.regions||[]).includes(region))   return false
      if (scope      && !(c.scopes||[]).includes(scope))     return false
      if (country    && !(c.countries||[]).includes(country)) return false
      if (minMessages > 0 && (c.message_amount ?? 0) < minMessages) return false
      if (q) {
        const hay = [
          c.channel, c.country, c.region,
          (c.countries||[]).join(' '), (c.regions||[]).join(' '), (c.scopes||[]).join(' '),
          c.last_sender, c.last_message,
        ].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    return sortChannels(base, sortBy, sortDir)
  }, [allChannels, filters, sortBy, sortDir])

  return { filtered, filters, setFilter, clearFilters, isFiltered, sortBy, sortDir, setSort }
}
