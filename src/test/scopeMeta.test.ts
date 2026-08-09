import { describe, it, expect } from 'vitest'
import { deriveCountries, deriveRegions, isDutchScopes } from '../utils/scopeMeta'

describe('deriveCountries', () => {
  it('maps country tokens (before the first dash), deduped and ordered', () => {
    expect(deriveCountries(['nl-dr', 'nl', 'de-bw', 'de-bw-str'])).toEqual(['Netherlands', 'Germany'])
  })

  it('ignores aggregate/community scopes that are not country codes', () => {
    expect(deriveCountries(['europe', 'eu', 'hansemesh', 'dach', 'bebss'])).toEqual([])
  })

  it('handles au-act and other non-EU country codes', () => {
    expect(deriveCountries(['au-act', 'nl'])).toEqual(['Australia', 'Netherlands'])
  })

  it('returns [] for empty/undefined', () => {
    expect(deriveCountries(undefined)).toEqual([])
    expect(deriveCountries([])).toEqual([])
  })
})

describe('deriveRegions', () => {
  it('maps exact Dutch province codes to province names', () => {
    expect(deriveRegions(['nl-dr', 'nl-noord', 'nl', 'nl-ut'])).toEqual(['Drenthe', 'Utrecht'])
  })

  it('does not map city-level or non-NL sub-scopes', () => {
    expect(deriveRegions(['nl-aer', 'nl-ov-ens', 'de-bw'])).toEqual([])
  })
})

describe('isDutchScopes', () => {
  it('is true for the national scope or any nl- sub-scope', () => {
    expect(isDutchScopes(['de', 'nl'])).toBe(true)
    expect(isDutchScopes(['nl-dr'])).toBe(true)
  })

  it('is false when no Dutch scope is present', () => {
    expect(isDutchScopes(['de', 'de-bw', 'europe'])).toBe(false)
    expect(isDutchScopes([])).toBe(false)
  })
})
