import { describe, it, expect } from 'vitest'
import {
  PAYLOAD_TYPES,
  PAYLOAD_TYPE_COUNT,
  defaultFilterSettings,
  cloneFilterSettings,
  buildFilterCommands,
  isFilterStatusReply,
  parseFilterEnabled,
  parseFilterHops,
  parseFilterRate,
  parseFilterChannels,
  parseFilterHash,
  parseFilterMalformed,
  assembleFilterSettings,
  parseFilterBlockedCounts,
  parseFilterCount,
  serializeFilterSettings,
  parseSharedFilterSettings,
  parseFilterDryrun,
  parseFilterAdvert,
  parseFilterAge,
  parseFilterPaths,
  parseFilterRules,
  parseFilterWatch,
  detectFilterFeatures,
  readFilterFromDevice,
  ALL_FILTER_FEATURES,
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

  it('sends the soft cutoff only when set, and drops it for firmware without it', () => {
    const base = defaultFilterSettings()
    const next = cloneFilterSettings(base)
    next.perType[5].soft = 15
    expect(buildFilterCommands(next, base)).toEqual(['filter rate 5 20 60 15'])
    expect(buildFilterCommands(next, base, { ...ALL_FILTER_FEATURES, soft: false })).toEqual([])

    const cleared = cloneFilterSettings(next)
    cleared.perType[5].soft = 0
    expect(buildFilterCommands(cleared, next)).toEqual(['filter rate 5 20 60'])
  })

  it('emits the extended settings before dry-run and enable', () => {
    const base = defaultFilterSettings()
    const next = cloneFilterSettings(base)
    next.enabled = true
    next.dryrun = true
    next.advertHours = 48
    next.ageMins = 60
    next.paths = ['A1B2']
    next.watch = ['#bots']
    next.senders = [{ pattern: 'Bob', secs: 60, prob: 100 }, { pattern: 'Bot*', secs: 0, prob: 50 }]
    next.texts = [{ pattern: '^BEACON', secs: 0, prob: 100 }]
    expect(buildFilterCommands(next, base)).toEqual([
      'filter advert 48',
      'filter path add A1B2',
      'filter watch add #bots',
      'filter sender add Bob 60',
      'filter sender add Bot* 0 50',
      'filter text add ^BEACON',
      'filter age 60',
      'filter dryrun on',
      'filter on',
    ])
  })

  it('rebuilds a rule list in order when any rule changes', () => {
    const base = defaultFilterSettings()
    base.senders = [{ pattern: 'A', secs: 0, prob: 100 }, { pattern: 'B', secs: 0, prob: 100 }]
    const next = cloneFilterSettings(base)
    next.senders[0].secs = 30
    expect(buildFilterCommands(next, base)).toEqual([
      'filter sender remove A',
      'filter sender remove B',
      'filter sender add A 30',
      'filter sender add B',
    ])
  })

  it('removes paths and watch entries and turns the age limit off', () => {
    const base = defaultFilterSettings()
    base.paths = ['C3']
    base.watch = ['#old']
    base.ageMins = 30
    const next = cloneFilterSettings(base)
    next.paths = []
    next.watch = []
    next.ageMins = 0
    expect(buildFilterCommands(next, base)).toEqual([
      'filter path remove C3',
      'filter watch remove #old',
      'filter age off',
    ])
  })

  it('sends nothing the firmware does not support', () => {
    const base = defaultFilterSettings()
    const next = cloneFilterSettings(base)
    next.dryrun = true
    next.advertHours = 12
    next.ageMins = 5
    next.paths = ['AA']
    next.senders = [{ pattern: 'X', secs: 0, prob: 100 }]
    const none = { soft: false, dryrun: false, advert: false, age: false, path: false, rules: false }
    expect(buildFilterCommands(next, base, none)).toEqual([])
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

  it('parses the v1.17.1 rate list (no soft column) by index', () => {
    const rate = parseFilterRate('[TYPE: LIMIT,SECS]\n00: 5,60\n02: 20,120')
    expect(rate[0]).toEqual({ limit: 5, secs: 60, soft: 0 })
    expect(rate[2]).toEqual({ limit: 20, secs: 120, soft: 0 })
  })

  it('parses the current rate list with the soft cutoff column', () => {
    const rate = parseFilterRate('[TYPE: LIMIT,SECS,SOFT]\n00: 5,60,0\n05: 20,60,15')
    expect(rate[0]).toEqual({ limit: 5, secs: 60, soft: 0 })
    expect(rate[5]).toEqual({ limit: 20, secs: 60, soft: 15 })
  })

  it('ignores a truncated two-value line under a SOFT header', () => {
    // The reply is capped at 160 bytes, so the last line can be cut short.
    const rate = parseFilterRate('[TYPE: LIMIT,SECS,SOFT]\n10: 5,60,0\n11: 5,6')
    expect(rate[10]).toEqual({ limit: 5, secs: 60, soft: 0 })
    expect(rate[11]).toBeUndefined()
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

  it('parses dry-run, advert window and message age', () => {
    expect(parseFilterDryrun('> Filter: dry-run on')).toBe(true)
    expect(parseFilterDryrun('> Filter: dry-run off')).toBe(false)
    expect(parseFilterDryrun('> Filter: command error')).toBeNull()
    expect(parseFilterAdvert('> Filter: advert origin window 48h (cache 87/256)')).toBe(48)
    expect(parseFilterAdvert('> Filter: command error')).toBeNull()
    expect(parseFilterAge('> Filter: message age limit off')).toBe(0)
    expect(parseFilterAge('> Message age: max 60m, dropped 37')).toBe(60)
    expect(parseFilterAge('> Message age: max 60m, dropped 0 (clock not set, inactive)')).toBe(60)
    expect(parseFilterAge('> Filter: command error')).toBeNull()
  })

  it('parses blocked path prefixes', () => {
    expect(parseFilterPaths('A1B2,C3')).toEqual(['A1B2', 'C3'])
    expect(parseFilterPaths('None')).toEqual([])
    expect(parseFilterPaths('> Filter: command error')).toBeNull()
  })

  it('parses sender/text rules with throttle and dosing', () => {
    expect(parseFilterRules('Bob throttle 60s,Bot* block 50%,SpamBot block')).toEqual([
      { pattern: 'Bob', secs: 60, prob: 100 },
      { pattern: 'Bot*', secs: 0, prob: 50 },
      { pattern: 'SpamBot', secs: 0, prob: 100 },
    ])
    expect(parseFilterRules('None')).toEqual([])
    expect(parseFilterRules('> Filter: command error')).toBeNull()
  })

  it('parses the watch list, dropping the implicit Public', () => {
    expect(parseFilterWatch('Public (11),#bots (a3)')).toEqual(['#bots'])
    expect(parseFilterWatch('Public (11)')).toEqual([])
    expect(parseFilterWatch('> Filter: command error')).toBeNull()
  })

  it('assembles the extended settings and detects features on current firmware', () => {
    const replies = {
      status: '> Filter on: Blocked [ Hops: 0 | Rate: 0 | Channel: 0 | Hash: 0 | Malformed: 0 ] (dry-run)',
      hops: '[TYPE: MAX_HOPS]\n00: 8',
      rate: '[TYPE: LIMIT,SECS,SOFT]\n05: 20,60,10',
      channels: 'None',
      hash: '> Filter: minimal 1 bytes path hash size',
      malformed: '> Filter: malformed text scan off',
      dryrun: '> Filter: dry-run on',
      advert: '> Filter: advert origin window 24h (cache 3/256)',
      age: '> Message age: max 60m, dropped 0',
      paths: 'A1B2',
      senders: 'Bob throttle 60s',
      texts: '^BEACON block',
      watch: 'Public (11),#bots (a3)',
    }
    const s = assembleFilterSettings(replies)
    expect(s.perType[5].soft).toBe(10)
    expect(s.dryrun).toBe(true)
    expect(s.advertHours).toBe(24)
    expect(s.ageMins).toBe(60)
    expect(s.paths).toEqual(['A1B2'])
    expect(s.senders).toEqual([{ pattern: 'Bob', secs: 60, prob: 100 }])
    expect(s.texts).toEqual([{ pattern: '^BEACON', secs: 0, prob: 100 }])
    expect(s.watch).toEqual(['#bots'])
    expect(detectFilterFeatures(replies)).toEqual(ALL_FILTER_FEATURES)
  })

  it('detects a v1.17.1 build as base-only', () => {
    const err = '> Filter: command error'
    const f = detectFilterFeatures({
      status: '> Filter off: Blocked [ Hops: 0 ]',
      hops: '', rate: '[TYPE: LIMIT,SECS]\n00: 5,60', channels: 'None', hash: '', malformed: '',
      dryrun: err, advert: err, age: err, paths: err, senders: err, texts: err, watch: err,
    })
    expect(f).toEqual({ soft: false, dryrun: false, advert: false, age: false, path: false, rules: false })
  })
})

describe('readFilterFromDevice', () => {
  it('returns null on firmware without a packet filter', async () => {
    expect(await readFilterFromDevice(async () => '> Unknown command')).toBeNull()
  })

  it('reads every subcommand once the status probe matches', async () => {
    const sent: string[] = []
    const out = await readFilterFromDevice(async cmd => {
      sent.push(cmd)
      return cmd === 'filter' ? '> Filter off: Blocked [ Hops: 0 ]' : '> Filter: command error'
    })
    expect(out).not.toBeNull()
    expect(sent).toContain('filter rate')
    expect(sent).toContain('filter sender list')
    expect(out!.features.rules).toBe(false)
  })
})

describe('parseFilterBlockedCounts', () => {
  it('parses the blocked breakdown from the status line', () => {
    const r = '> Filter on: Blocked [ Hops: 3 | Rate: 12 | Channel: 1 | Hash: 0 | Malformed: 2 ]'
    expect(parseFilterBlockedCounts(r)).toEqual({ hops: 3, rate: 12, channel: 1, hash: 0, malformed: 2 })
  })
  it('returns null when the line is not a filter status line', () => {
    expect(parseFilterBlockedCounts('> Unknown command')).toBeNull()
  })
})

describe('parseFilterCount', () => {
  it('parses per-type blocked counts', () => {
    const r = '05: 2,10\n02: 0,4'
    expect(parseFilterCount(r)).toEqual({ 5: { hops: 2, rate: 10 }, 2: { hops: 0, rate: 4 } })
  })
  it('returns an empty object when there is no data', () => {
    expect(parseFilterCount('> ')).toEqual({})
  })
})

describe('serializeFilterSettings / parseSharedFilterSettings', () => {
  it('round-trips a settings object through the tagged wrapper', () => {
    const s = defaultFilterSettings()
    s.enabled = true
    s.minHashBytes = 2
    s.channels = ['Public', '#bot']
    s.perType[5].hops = 16
    s.perType[2].rateLimit = 10
    const text = serializeFilterSettings(s)
    expect(JSON.parse(text)).toMatchObject({ type: 'dmc-filter', version: 1 })
    expect(parseSharedFilterSettings(text)).toEqual(s)
  })

  it('returns null for non-JSON and non-filter JSON', () => {
    expect(parseSharedFilterSettings('not json')).toBeNull()
    expect(parseSharedFilterSettings('{"foo":1}')).toBeNull()
    expect(parseSharedFilterSettings('{"type":"dmc-filter","version":1}')).toBeNull()
  })

  it('accepts a bare settings object without the wrapper', () => {
    const s = defaultFilterSettings()
    s.malformed = true
    expect(parseSharedFilterSettings(JSON.stringify(s))).toEqual(s)
  })

  it('sanitizes out-of-range values, bad channels, and short perType', () => {
    const raw = {
      enabled: true,
      malformed: 'yes',            // invalid type -> ignored, stays default false
      minHashBytes: 9,             // clamp to 3
      channels: ['ok', 'bad name', '', 42, 'ok'], // drop whitespace/empty/non-string
      perType: [{ hops: 999, rateLimit: -5, rateSecs: 10 }], // clamp; rest default
    }
    const out = parseSharedFilterSettings(JSON.stringify(raw))!
    expect(out.enabled).toBe(true)
    expect(out.malformed).toBe(false)
    expect(out.minHashBytes).toBe(3)
    expect(out.channels).toEqual(['ok'])
    expect(out.perType).toHaveLength(12)
    expect(out.perType[0].hops).toBe(64)
    expect(out.perType[0].rateLimit).toBe(0)
    expect(out.perType[0].rateSecs).toBe(10)
    expect(out.perType[1].hops).toBe(8) // untouched default
  })

  it('round-trips and sanitizes the extended fields', () => {
    const s = defaultFilterSettings()
    s.dryrun = true
    s.advertHours = 48
    s.ageMins = 60
    s.paths = ['A1B2']
    s.watch = ['#bots']
    s.senders = [{ pattern: 'Bob', secs: 60, prob: 100 }]
    s.texts = [{ pattern: '^BEACON', secs: 0, prob: 50 }]
    s.perType[5].soft = 10
    expect(parseSharedFilterSettings(serializeFilterSettings(s))).toEqual(s)

    const out = parseSharedFilterSettings(JSON.stringify({
      enabled: true,
      advertHours: 9999,
      paths: ['a1b2', 'XYZ', 'abc'],
      watch: ['#ok', 'nohash'],
      senders: [{ pattern: 'has space' }, { pattern: 'ThisNameIsWayTooLong' }, { pattern: 'Ok', secs: 1e6, prob: 0 }],
      perType: [{ rateLimit: 5, soft: 9 }],
    }))!
    expect(out.advertHours).toBe(720)
    expect(out.paths).toEqual(['A1B2'])
    expect(out.watch).toEqual(['#ok'])
    expect(out.senders).toEqual([{ pattern: 'Ok', secs: 65535, prob: 1 }])
    expect(out.perType[0].soft).toBe(0) // soft must stay below the limit
  })

  it('loads an older share file without the extended fields at defaults', () => {
    const old = { enabled: true, minHashBytes: 2, channels: [], malformed: false, perType: [{ hops: 4, rateLimit: 5, rateSecs: 60 }] }
    const out = parseSharedFilterSettings(JSON.stringify(old))!
    expect(out.dryrun).toBe(false)
    expect(out.senders).toEqual([])
    expect(out.perType[0].soft).toBe(0)
  })
})

describe('isFilterStatusReply', () => {
  it('matches the DMC filter status line (on or off), regardless of firmware name', () => {
    expect(isFilterStatusReply('> Filter on: Blocked [ Hops: 0 | Rate: 0 ]')).toBe(true)
    expect(isFilterStatusReply('> Filter off: Blocked [ Hops: 0 ]')).toBe(true)
  })
  it('rejects stock-firmware "Unknown command" and non-status replies', () => {
    expect(isFilterStatusReply('> Unknown command')).toBe(false)
    expect(isFilterStatusReply('')).toBe(false)
    expect(isFilterStatusReply('> Filter: on')).toBe(false) // set-reply, not the status probe
  })
})
