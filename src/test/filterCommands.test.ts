import { describe, it, expect } from 'vitest'
import {
  PAYLOAD_TYPES,
  PAYLOAD_TYPE_COUNT,
  defaultFilterSettings,
  cloneFilterSettings,
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
