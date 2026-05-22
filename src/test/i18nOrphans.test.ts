import { describe, it, expect } from 'vitest'
import { STRINGS } from '../i18n'

describe('i18n — no orphaned editor/howto keys', () => {
  it('does not contain nav_editor key', () => {
    expect('nav_editor' in STRINGS.en).toBe(false)
    expect('nav_editor' in STRINGS.nl).toBe(false)
  })

  it('does not contain nav_howto key', () => {
    expect('nav_howto' in STRINGS.en).toBe(false)
    expect('nav_howto' in STRINGS.nl).toBe(false)
  })

  it('does not contain howto_ keys', () => {
    const enKeys = Object.keys(STRINGS.en)
    const nlKeys = Object.keys(STRINGS.nl)
    const enHowto = enKeys.filter(k => k.startsWith('howto_'))
    const nlHowto = nlKeys.filter(k => k.startsWith('howto_'))
    expect(enHowto).toHaveLength(0)
    expect(nlHowto).toHaveLength(0)
  })

  it('does not contain editor_ keys', () => {
    const enKeys = Object.keys(STRINGS.en)
    const nlKeys = Object.keys(STRINGS.nl)
    const enEditor = enKeys.filter(k => k.startsWith('editor_'))
    const nlEditor = nlKeys.filter(k => k.startsWith('editor_'))
    expect(enEditor).toHaveLength(0)
    expect(nlEditor).toHaveLength(0)
  })

  it('does not contain local_edit_s, local_edits_p, export_link', () => {
    const orphaned = ['local_edit_s', 'local_edits_p', 'export_link']
    for (const key of orphaned) {
      expect(key in STRINGS.en).toBe(false)
      expect(key in STRINGS.nl).toBe(false)
    }
  })

  it('does not contain th_source', () => {
    expect('th_source' in STRINGS.en).toBe(false)
    expect('th_source' in STRINGS.nl).toBe(false)
  })
})
