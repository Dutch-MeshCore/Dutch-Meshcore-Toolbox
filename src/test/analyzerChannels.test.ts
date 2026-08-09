import { describe, it, expect } from 'vitest'
import { mapAnalyzerChannel, mapAnalyzerResponse, isDutch } from '../utils/analyzerChannels'

const raw = {
  key: '#mc-radar',
  name: '#mc-radar',
  hash: '0x03',
  messageCount: 5733,
  lastActivity: '2026-08-09T14:22:08.157209Z',
  lastSender: 'NLKDC-TIE01',
  lastMessage: 'Did I kill my repeaters?',
  encrypted: false,
  secretHex: 'f27acf0bf185c2ec4b9fd36bf12fa1ee',
  scopes: ['nl', 'nl-zh', 'de', 'eu'],
}

describe('mapAnalyzerChannel', () => {
  it('maps analyzer fields onto the app model', () => {
    const c = mapAnalyzerChannel(raw)!
    expect(c.channel).toBe('#mc-radar')
    expect(c.channel_hash).toBe('f27acf0bf185c2ec4b9fd36bf12fa1ee')
    expect(c.message_amount).toBe(5733)
    expect(c.last_seen).toBe('2026-08-09T14:22:08.157209Z')
    expect(c.last_sender).toBe('NLKDC-TIE01')
    expect(c.last_message).toBe('Did I kill my repeaters?')
    expect(c.encrypted).toBe(false)
    expect(c.scopes).toEqual(['nl', 'nl-zh', 'de', 'eu'])
  })

  it('derives countries/regions and a primary country/region from scopes', () => {
    const c = mapAnalyzerChannel(raw)!
    expect(c.countries).toEqual(['Netherlands', 'Germany'])
    expect(c.regions).toEqual(['Zuid-Holland'])
    expect(c.country).toBe('Netherlands')
    expect(c.region).toBe('Zuid-Holland')
  })

  it('returns null when there is no channel name', () => {
    expect(mapAnalyzerChannel({ secretHex: 'ab' })).toBeNull()
  })

  it('tolerates missing optional fields', () => {
    const c = mapAnalyzerChannel({ name: '#x' })!
    expect(c.channel).toBe('#x')
    expect(c.channel_hash).toBe('')
    expect(c.message_amount).toBe(0)
    expect(c.scopes).toEqual([])
    expect(c.country).toBe('')
  })
})

describe('mapAnalyzerResponse', () => {
  it('maps the channels array and drops malformed records', () => {
    const out = mapAnalyzerResponse({ channels: [raw, null, {}, { name: '#ok' }, 42] })
    expect(out.map(c => c.channel)).toEqual(['#mc-radar', '#ok'])
  })

  it('returns [] for a non-array / missing channels field', () => {
    expect(mapAnalyzerResponse({})).toEqual([])
    expect(mapAnalyzerResponse(null)).toEqual([])
    expect(mapAnalyzerResponse('nope')).toEqual([])
  })
})

describe('isDutch', () => {
  it('detects Dutch-scoped channels', () => {
    expect(isDutch({ scopes: ['de', 'nl-ut'] })).toBe(true)
    expect(isDutch({ scopes: ['de', 'europe'] })).toBe(false)
  })
})
