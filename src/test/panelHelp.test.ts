import { describe, it, expect } from 'vitest'
import { PANEL_HELP, PANEL_HELP_IDS } from '../components/config/panelHelpContent'

const LANGS = ['nl', 'en', 'de'] as const

describe('panelHelp content', () => {
  it('exposes exactly the 12 expected panel ids', () => {
    expect([...PANEL_HELP_IDS].sort()).toEqual(
      [
        'access', 'advanced', 'advert', 'filter', 'hardware', 'location',
        'mqtt', 'owner', 'radio', 'region', 'regionGating', 'room',
      ].sort(),
    )
  })

  it('has content for every id in every language', () => {
    for (const id of PANEL_HELP_IDS) {
      for (const lang of LANGS) {
        const c = PANEL_HELP[id]?.[lang]
        expect(c, `${id}/${lang} missing`).toBeTruthy()
        expect(c.title.trim().length, `${id}/${lang} title empty`).toBeGreaterThan(0)
        expect(c.intro.trim().length, `${id}/${lang} intro empty`).toBeGreaterThan(0)
        expect(Array.isArray(c.fields), `${id}/${lang} fields not array`).toBe(true)
        for (const f of c.fields) {
          expect(f.label.trim().length, `${id}/${lang} field label empty`).toBeGreaterThan(0)
          expect(f.body.trim().length, `${id}/${lang} field body empty`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('contains no em-dash (U+2014) anywhere (project typography rule)', () => {
    const emDash = String.fromCharCode(0x2014)
    const json = JSON.stringify(PANEL_HELP)
    expect(json.includes(emDash)).toBe(false)
  })
})
