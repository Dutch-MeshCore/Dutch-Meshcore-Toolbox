import { describe, it, expect } from 'vitest'
import { parseServerUrl } from '../utils/mqttUtils'

describe('parseServerUrl', () => {
  it('extracts port and audience from a full wss URL', () => {
    expect(parseServerUrl('wss://collector1.dutchmeshcore.nl:443/mqtt')).toEqual({
      port: '443',
      audience: 'collector1.dutchmeshcore.nl',
    })
  })

  it('defaults to port 443 for wss when port is omitted', () => {
    expect(parseServerUrl('wss://my-broker.example.com/mqtt')).toEqual({
      port: '443',
      audience: 'my-broker.example.com',
    })
  })

  it('defaults to port 1883 for non-wss when port is omitted', () => {
    expect(parseServerUrl('mqtt://my-broker.example.com')).toEqual({
      port: '1883',
      audience: 'my-broker.example.com',
    })
  })

  it('returns empty strings for an invalid URL', () => {
    expect(parseServerUrl('not-a-url')).toEqual({ port: '', audience: '' })
  })

  it('returns empty strings for an empty string', () => {
    expect(parseServerUrl('')).toEqual({ port: '', audience: '' })
  })

  it('handles a plain hostname with explicit port', () => {
    expect(parseServerUrl('ws://broker.local:1883/path')).toEqual({
      port: '1883',
      audience: 'broker.local',
    })
  })

  it('returns empty strings for a URL with no hostname', () => {
    expect(parseServerUrl('file:///local/path')).toEqual({ port: '', audience: '' })
  })
})
