import { describe, it, expect } from 'vitest'
import { parseFirmwareVersion, versionAtLeast, dutyCycleToAf, afToDutyCycle } from '../utils/configUtils'

describe('configUtils', () => {
  it('parseFirmwareVersion extracts semver', () => {
    expect(parseFirmwareVersion('v1.13.0-295f67d (Build: 15-Feb-2026)')).toEqual([1, 13, 0])
  })

  it('parseFirmwareVersion returns [0,0,0] on unknown string', () => {
    expect(parseFirmwareVersion('unknown')).toEqual([0, 0, 0])
  })

  it('versionAtLeast: 1.14.0 >= 1.14.0', () => {
    expect(versionAtLeast([1, 14, 0], [1, 14, 0])).toBe(true)
  })

  it('versionAtLeast: 1.13.0 < 1.14.0', () => {
    expect(versionAtLeast([1, 13, 0], [1, 14, 0])).toBe(false)
  })

  it('versionAtLeast: 2.0.0 >= 1.14.0', () => {
    expect(versionAtLeast([2, 0, 0], [1, 14, 0])).toBe(true)
  })

  it('dutyCycleToAf and afToDutyCycle round-trip', () => {
    expect(afToDutyCycle(dutyCycleToAf(10))).toBe(10)
  })
})
