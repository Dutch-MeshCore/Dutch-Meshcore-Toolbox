import { describe, it, expect } from 'vitest'
import {
  PAYLOAD_TYPES,
  PAYLOAD_TYPE_COUNT,
  defaultFilterSettings,
  cloneFilterSettings,
  buildFilterCommands,
  parseFilterEnabled,
  parseFilterHops,
  parseFilterRate,
  parseFilterChannels,
  parseFilterHash,
  parseFilterMalformed,
  assembleFilterSettings,
} from '../lib/config/filterCommands'

describe('filter model', () => {
  it('has 12 payload types in firmware order', () => {
    expect(PAYLOAD_TYPE_COUNT).toBe(12)
    expect(PAYLOAD_TYPES.map(t => t.name)).toEqual([
      'REQ', 'RESPONSE', 'TXT_MSG', 'ACK', 'ADVERT', 'GRP_TXT',
      'GRP_DATA', 'ANON_REQ', 'PATH', 'TRACE', 'MULTIPART', 'CONTROL',
    ])
    expect(PAYLOAD_TYPES[5].index).toBe(5)
  })

  it('defaults mirror FilterPrefs in Filter.h', () => {
    const d = defaultFilterSettings()
    expect(d.enabled).toBe(false)
    expect(d.malformed).toBe(false)
    expect(d.minHashBytes).toBe(1)
    expect(d.channels).toEqual([])
    expect(d.perType).toHaveLength(12)
    // hops: 8 everywhere except GRP_TXT (5) = 32
    expect(d.perType.map(p => p.hops)).toEqual([8, 8, 8, 8, 8, 32, 8, 8, 8, 8, 8, 8])
    // rate limit: 5 except TXT_MSG(2)=20, ADVERT(4)=10, GRP_TXT(5)=20
    expect(d.perType.map(p => p.rateLimit)).toEqual([5, 5, 20, 5, 10, 20, 5, 5, 5, 5, 5, 5])
    // rate window: 60 everywhere
    expect(d.perType.every(p => p.rateSecs === 60)).toBe(true)
  })

  it('cloneFilterSettings makes a deep copy', () => {
    const a = defaultFilterSettings()
    const b = cloneFilterSettings(a)
    b.perType[0].hops = 99
    b.channels.push('Public')
    expect(a.perType[0].hops).toBe(8)
    expect(a.channels).toEqual([])
  })
})

describe('buildFilterCommands', () => {
  it('returns [] when nothing changed', () => {
    const base = defaultFilterSettings()
    const next = cloneFilterSettings(base)
    expect(buildFilterCommands(next, base)).toEqual([])
  })

  it('emits hash and malformed changes', () => {
    const base = defaultFilterSettings()
    const next = cloneFilterSettings(base)
    next.minHashBytes = 2
    next.malformed = true
    expect(buildFilterCommands(next, base)).toEqual([
      'filter hash 2',
      'filter malformed on',
    ])
  })

  it('emits per-type hops and rate changes by index', () => {
    const base = defaultFilterSettings()
    const next = cloneFilterSettings(base)
    next.perType[0].hops = 10
    next.perType[5].rateLimit = 30
    expect(buildFilterCommands(next, base)).toEqual([
      'filter hops 0 10',
      'filter rate 5 30 60',
    ])
  })

  it('emits channel add and remove deltas', () => {
    const base = defaultFilterSettings()
    base.channels = ['#old']
    const next = cloneFilterSettings(base)
    next.channels = ['Public']
    expect(buildFilterCommands(next, base)).toEqual([
      'filter channel add Public',
      'filter channel remove #old',
    ])
  })

  it('emits enable/disable last', () => {
    const base = defaultFilterSettings()
    const next = cloneFilterSettings(base)
    next.minHashBytes = 3
    next.enabled = true
    expect(buildFilterCommands(next, base)).toEqual([
      'filter hash 3',
      'filter on',
    ])
  })

  it('builds full set from defaults for the generator', () => {
    const base = defaultFilterSettings()
    const next = cloneFilterSettings(base)
    next.enabled = true
    next.perType[2].hops = 4
    const cmds = buildFilterCommands(next, base)
    expect(cmds).toContain('filter hops 2 4')
    expect(cmds[cmds.length - 1]).toBe('filter on')
  })
})

describe('filter reply parsers', () => {
  it('parses enabled from the status line', () => {
    expect(parseFilterEnabled('> Filter on: Blocked [ Hops: 0 | Rate: 0 ]')).toBe(true)
    expect(parseFilterEnabled('> Filter off: Blocked [ Hops: 0 ]')).toBe(false)
    expect(parseFilterEnabled('> Filter: on')).toBe(true)
  })

  it('parses the hops list by index', () => {
    const hops = parseFilterHops('[TYPE: MAX_HOPS]\n00: 8\n01: 7\n05: 32\n11: 9')
    expect(hops[0]).toBe(8)
    expect(hops[1]).toBe(7)
    expect(hops[5]).toBe(32)
    expect(hops[11]).toBe(9)
  })

  it('parses the rate list by index', () => {
    const rate = parseFilterRate('[TYPE: LIMIT,SECS]\n00: 5,60\n02: 20,120')
    expect(rate[0]).toEqual({ limit: 5, secs: 60 })
    expect(rate[2]).toEqual({ limit: 20, secs: 120 })
  })

  it('parses channel names, stripping the hash suffix', () => {
    expect(parseFilterChannels('Public (11),#general (a3)')).toEqual(['Public', '#general'])
    expect(parseFilterChannels('None')).toEqual([])
    expect(parseFilterChannels('> None')).toEqual([])
    expect(parseFilterChannels('')).toEqual([])
  })

  it('parses hash and malformed', () => {
    expect(parseFilterHash('> Filter: minimal 2 bytes path hash size')).toBe(2)
    expect(parseFilterHash('nonsense')).toBeNull()
    expect(parseFilterMalformed('> Filter: malformed text scan on')).toBe(true)
    expect(parseFilterMalformed('> Filter: malformed scan off')).toBe(false)
  })

  it('assembles a full FilterSettings from all replies', () => {
    const s = assembleFilterSettings({
      status: '> Filter on: Blocked [ Hops: 0 ]',
      hops: '[TYPE: MAX_HOPS]\n00: 4\n05: 16',
      rate: '[TYPE: LIMIT,SECS]\n02: 9,30',
      channels: 'Public (11)',
      hash: '> Filter: minimal 3 bytes path hash size',
      malformed: '> Filter: malformed text scan on',
    })
    expect(s.enabled).toBe(true)
    expect(s.perType[0].hops).toBe(4)
    expect(s.perType[5].hops).toBe(16)
    expect(s.perType[1].hops).toBe(8)        // untouched default
    expect(s.perType[2].rateLimit).toBe(9)
    expect(s.perType[2].rateSecs).toBe(30)
    expect(s.channels).toEqual(['Public'])
    expect(s.minHashBytes).toBe(3)
    expect(s.malformed).toBe(true)
  })
})
