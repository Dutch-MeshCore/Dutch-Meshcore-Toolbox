import { describe, it, expect } from 'vitest'
import {
  defaultRegionSettings, cloneRegionSettings, parseRegionTree,
  type RegionNode, type RegionSettings,
} from '../lib/config/regionCommands'
import {
  parseDcGate, parseDcGateStatus, parseNeighbors,
} from '../lib/config/regionCommands'
import { buildRegionCommands } from '../lib/config/regionCommands'
import {
  regionSupported, assembleRegionSettings,
  treeToDefString, defStringToTree,
  serializeRegionSettings, parseSharedRegionSettings,
  regionToBackup, backupToRegion,
} from '../lib/config/regionCommands'

const settings = (): RegionSettings => ({
  tree: {
    name: '*', flood: true, children: [
      { name: 'europe', flood: true, children: [
        { name: 'uk', flood: false, children: [] },
      ] },
    ],
  },
  home: 'uk',
  default: 'europe',
  dcGate: { enabled: true, thresh: 80, hyst: 5 },
})

describe('buildRegionCommands', () => {
  it('is a no-op when nothing changed', () => {
    const s = settings()
    expect(buildRegionCommands(s, structuredClone(s))).toEqual([])
  })

  it('clears leaf-first, rebuilds parent-first, forces flood, sets home, saves, diffs dc.gate', () => {
    const base = settings()
    const next = structuredClone(base)
    next.tree.children[0].children[0].flood = true // uk now flood-allowed (a tree change)
    next.home = 'europe'
    next.dcGate.thresh = 90
    const cmds = buildRegionCommands(next, base)

    // clear old tree leaf-first (children before parents), wildcard never removed
    expect(cmds).toContain('region remove uk')
    expect(cmds).toContain('region remove europe')
    expect(cmds.indexOf('region remove uk')).toBeLessThan(cmds.indexOf('region remove europe'))

    // rebuild parent-first; top-level parent is the wildcard '*'
    expect(cmds).toContain('region put europe *')
    expect(cmds).toContain('region put uk europe')
    expect(cmds.indexOf('region put europe *')).toBeLessThan(cmds.indexOf('region put uk europe'))

    // removes happen before puts
    expect(cmds.indexOf('region remove europe')).toBeLessThan(cmds.indexOf('region put europe *'))

    // flood forced per node including the wildcard
    expect(cmds).toContain('region allowf *')
    expect(cmds).toContain('region allowf uk')

    expect(cmds).toContain('region home europe')
    expect(cmds).toContain('region save')
    expect(cmds).toContain('set dc.gate.thresh 90')
    expect(cmds).not.toContain('region default europe') // unchanged
  })

  it('forces denyf for a flood-denied node', () => {
    const base = settings()
    const next = structuredClone(base)
    next.tree.children[0].flood = false // europe now denied
    expect(buildRegionCommands(next, base)).toContain('region denyf europe')
  })

  it('emits region default <null> when default is cleared', () => {
    const base = settings()
    const next = structuredClone(base)
    next.default = null
    expect(buildRegionCommands(next, base)).toContain('region default <null>')
  })
})

// Fixture matches the VERIFIED firmware `region` dump: 1 space per depth level,
// names WITHOUT '#', home marked with trailing '^', flood-allowed with trailing ' F'.
const DUMP = [
  '* F',
  ' europe F',
  '  netherlands^ F',
  '  uk',
].join('\n')

describe('parseRegionTree', () => {
  it('builds a nested tree rooted at the wildcard', () => {
    const root = parseRegionTree(DUMP)
    expect(root.name).toBe('*')
    expect(root.flood).toBe(true)
    expect(root.children.map(c => c.name)).toEqual(['europe'])
    const europe = root.children[0]
    expect(europe.flood).toBe(true)
    expect(europe.children.map(c => c.name)).toEqual(['netherlands', 'uk'])
    expect(europe.children[0].name).toBe('netherlands') // trailing '^' stripped
    expect(europe.children[0].flood).toBe(true)
    expect(europe.children[1].flood).toBe(false) // no trailing F
  })

  it('returns a lone flood-denied wildcard for an empty dump', () => {
    const root = parseRegionTree('')
    expect(root).toEqual<RegionNode>({ name: '*', flood: false, children: [] })
  })
})

describe('defaults and clone', () => {
  it('clone is a deep copy', () => {
    const a = defaultRegionSettings()
    const b = cloneRegionSettings(a)
    b.tree.children.push({ name: 'x', flood: true, children: [] })
    b.dcGate.thresh = 42
    expect(a.tree.children).toHaveLength(0)
    expect(a.dcGate.thresh).toBe(70)
  })
})

// Firmware replies are prefixed with '> '. get dc.gate -> '> on'/'> off';
// thresh/hyst -> '> 70' / '> 10' (bare int).
describe('parseDcGate', () => {
  it('reads enabled/thresh/hyst from the three "> ..." replies', () => {
    expect(parseDcGate({ enabled: '> on', thresh: '> 70', hyst: '> 10' }))
      .toEqual({ enabled: true, thresh: 70, hyst: 10 })
    expect(parseDcGate({ enabled: '> off', thresh: '', hyst: '' }))
      .toEqual({ enabled: false, thresh: 70, hyst: 10 }) // falls back to defaults
  })
})

// Verified status format: '> duty {N}%, gate level {cur}/{max}'.
describe('parseDcGateStatus', () => {
  it('extracts duty percent and current/max gate level', () => {
    expect(parseDcGateStatus('> duty 42%, gate level 1/4'))
      .toEqual({ dutyPct: 42, level: 1, maxLevel: 4 })
    expect(parseDcGateStatus('nonsense')).toBeNull()
  })
})

// Verified neighbours format: '{8-hex}:{seconds_ago}:{snr*4}'. Field 2 is an age
// in seconds; field 3 is SNR times 4. Empty list prints '-none-'.
describe('parseNeighbors', () => {
  it('parses hex:age:snr4 lines and divides snr by 4', () => {
    const out = parseNeighbors('a1b2c3d4:37:20\nd4e5f6a7:100:-24')
    expect(out).toEqual([
      { pubkey: 'a1b2c3d4', ageSecs: 37, snr: 5 },
      { pubkey: 'd4e5f6a7', ageSecs: 100, snr: -6 },
    ])
    expect(parseNeighbors('-none-')).toEqual([])
  })
})

describe('regionSupported', () => {
  it('true for a region dump, false for unknown-command', () => {
    expect(regionSupported('* F\n europe F')).toBe(true)
    expect(regionSupported('*^ F')).toBe(true) // empty tree: wildcard is home (trailing '^')
    expect(regionSupported('> Unknown command')).toBe(false)
  })
})

describe('def string round-trip (config.meshcore.io alignment)', () => {
  it('serialises an allow-only tree to a def string and back', () => {
    const tree = {
      name: '*', flood: true, children: [
        { name: 'eu', flood: true, children: [
          { name: 'fr', flood: true, children: [] },
        ] },
      ],
    }
    const def = treeToDefString(tree)
    expect(def).toBe('eu fr')
    const back = defStringToTree(def)
    expect(back).toEqual(tree)
  })
})

describe('def string round-trip with siblings', () => {
  it('encodes/decodes a multi-child tree using | jumps back to the parent', () => {
    const tree = {
      name: '*', flood: true, children: [
        { name: 'a', flood: true, children: [
          { name: 'a1', flood: true, children: [] },
        ] },
        { name: 'b', flood: true, children: [] },
      ],
    }
    expect(treeToDefString(tree)).toBe('a a1|* b')
    expect(defStringToTree('a a1|* b')).toEqual(tree)
  })

  it('round-trips two-level siblings under a named parent', () => {
    const tree = {
      name: '*', flood: true, children: [
        { name: 'eu', flood: true, children: [
          { name: 'nl', flood: true, children: [] },
          { name: 'fr', flood: true, children: [] },
        ] },
      ],
    }
    const def = treeToDefString(tree)
    expect(defStringToTree(def)).toEqual(tree)
  })
})

describe('regionToBackup', () => {
  it('matches the config.meshcore.io shape', () => {
    const s = defaultRegionSettings()
    s.tree.children.push({ name: 'eu', flood: true, children: [{ name: 'fr', flood: true, children: [] }] })
    s.home = 'fr'; s.default = 'fr'
    expect(regionToBackup(s)).toEqual({ def: 'eu fr', home: 'fr', default: 'fr' })
  })
})

describe('backupToRegion', () => {
  it('rebuilds settings from the backup shape', () => {
    const base = defaultRegionSettings()
    const r = backupToRegion({ def: 'eu fr', home: 'fr', default: 'fr' }, base)
    expect(r.home).toBe('fr')
    expect(r.default).toBe('fr')
    expect(r.tree.children[0].name).toBe('eu')
    expect(r.tree.children[0].children[0].name).toBe('fr')
  })
})

describe('share serialise/parse', () => {
  it('round-trips and sanitises', () => {
    const s = assembleRegionSettings({
      tree: '* F\n eu F', home: ' home is eu', default: ' default scope is eu',
      dcGate: { enabled: '> on', thresh: '> 70', hyst: '> 10' },
    })
    const json = serializeRegionSettings(s)
    const parsed = parseSharedRegionSettings(json)
    expect(parsed?.home).toBe('eu')
    expect(parsed?.dcGate.thresh).toBe(70)
    expect(parseSharedRegionSettings('not json')).toBeNull()
  })
})
