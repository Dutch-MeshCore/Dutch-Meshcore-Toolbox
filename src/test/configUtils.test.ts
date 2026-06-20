import { describe, it, expect } from 'vitest'
import { isDmcFirmware } from '../utils/configUtils'

describe('isDmcFirmware', () => {
  it('detects DutchMeshcore version strings (case-insensitive)', () => {
    expect(isDmcFirmware('DutchMeshcore.nl - v1.16.0')).toBe(true)
    expect(isDmcFirmware('dutchmeshcore v1.16.0')).toBe(true)
  })
  it('returns false for stock firmware or empty input', () => {
    expect(isDmcFirmware('v1.16.0')).toBe(false)
    expect(isDmcFirmware('')).toBe(false)
    expect(isDmcFirmware(undefined as unknown as string)).toBe(false)
  })
})
