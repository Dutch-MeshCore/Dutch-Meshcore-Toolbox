# Repeater Packet-Filter CLI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Filter CLI generator page and a live "(Custom DMC firmware only)" packet-filter block to the repeater serial setup in the Dutch-Meshcore-Toolbox, both driven by one shared filter-command core.

**Architecture:** A pure `filterCommands.ts` module owns the model (12 payload types, firmware defaults), a minimal-diff command builder, and reply parsers. A shared `FilterSettingsForm` React component renders the controls. Two surfaces consume it: a new `/filter-cli` generator page (copy-paste output, like the MQTT CLI page) and a new auto-detected panel in `ConfigForm` wired into the existing connect-read / save-write serial flow.

**Tech Stack:** React + TypeScript, Vite, Vitest (jsdom), Web Serial API. Bilingual NL/EN via `src/i18n.ts` + `useLang`.

---

## Conventions for this plan

- **Working directory for ALL commands and paths:** `G:\Github\repositories\Dutch-MeshCore\Dutch-Meshcore-Toolbox` (the Toolbox repo).
- **Branch:** continue on the existing `feat/repeater-filter-cli` branch (already created; the design spec is committed there). Do **not** push.
- **Commits:** plain messages, **no `Co-Authored-By` trailer** (user preference). Commit after each task.
- **Run a single test file:** `npx vitest run src/test/<file>.test.ts`
- **Run all tests:** `npm run test:run`
- **Type-check + build:** `npm run build` (runs `tsc -b && vite build`)
- The firmware is the source of truth: `../MeshCore/examples/simple_repeater/Filter.{h,cpp}`.

## File structure (what each new/changed file is responsible for)

**New:**
- `src/lib/config/filterCommands.ts` — model, defaults, `buildFilterCommands`, reply parsers, `assembleFilterSettings`. Pure, no React.
- `src/components/config/FilterSettingsForm.tsx` — shared controlled form (globals + channels + advanced per-type table).
- `src/pages/FilterCliPage.tsx` — `/filter-cli` generator page.
- `src/test/filterCommands.test.ts` — unit tests for the pure module.

**Modified:**
- `src/utils/configUtils.ts` — add `isDmcFirmware`.
- `src/types.ts` — add `filter?` / `filterDevice?` to `SerialDeviceInfo`.
- `src/i18n.ts` — add `nav_filter`, `config_section_filter` (NL + EN).
- `src/styles/globals.css` — styles for the filter form.
- `src/hooks/useSerialDevice.ts` — read filter on connect (DMC only); diff/write on save.
- `src/components/config/ConfigForm.tsx` — render the filter panel when DMC fw is detected.
- `src/App.tsx` — add `/filter-cli` route.
- `src/components/layout/Navbar.tsx` — add Config-menu link + active state.

---

## Task 1: Filter model + defaults (`filterCommands.ts`)

**Files:**
- Create: `src/lib/config/filterCommands.ts`
- Test: `src/test/filterCommands.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/test/filterCommands.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/filterCommands.test.ts`
Expected: FAIL — cannot resolve `../lib/config/filterCommands`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/config/filterCommands.ts`:

```ts
// Canonical model + command builders/parsers for the repeater packet filter.
// Mirrors MeshCore/examples/simple_repeater/Filter.{h,cpp}.

export interface PayloadType {
  index: number
  name: string
}

export const PAYLOAD_TYPES: readonly PayloadType[] = [
  { index: 0, name: 'REQ' },
  { index: 1, name: 'RESPONSE' },
  { index: 2, name: 'TXT_MSG' },
  { index: 3, name: 'ACK' },
  { index: 4, name: 'ADVERT' },
  { index: 5, name: 'GRP_TXT' },
  { index: 6, name: 'GRP_DATA' },
  { index: 7, name: 'ANON_REQ' },
  { index: 8, name: 'PATH' },
  { index: 9, name: 'TRACE' },
  { index: 10, name: 'MULTIPART' },
  { index: 11, name: 'CONTROL' },
] as const

export const PAYLOAD_TYPE_COUNT = PAYLOAD_TYPES.length

export interface PerTypePrefs {
  hops: number
  rateLimit: number
  rateSecs: number
}

export interface FilterSettings {
  enabled: boolean
  perType: PerTypePrefs[] // length 12, indexed by payload type
  channels: string[]
  minHashBytes: number
  malformed: boolean
}

const DEFAULT_HOPS = 8
const DEFAULT_RATE_LIMIT = 5
const DEFAULT_RATE_SECS = 60

function defaultPerType(): PerTypePrefs[] {
  const perType: PerTypePrefs[] = PAYLOAD_TYPES.map(() => ({
    hops: DEFAULT_HOPS,
    rateLimit: DEFAULT_RATE_LIMIT,
    rateSecs: DEFAULT_RATE_SECS,
  }))
  perType[5].hops = 32       // GRP_TXT
  perType[2].rateLimit = 20  // TXT_MSG
  perType[4].rateLimit = 10  // ADVERT
  perType[5].rateLimit = 20  // GRP_TXT
  return perType
}

export function defaultFilterSettings(): FilterSettings {
  return {
    enabled: false,
    perType: defaultPerType(),
    channels: [],
    minHashBytes: 1,
    malformed: false,
  }
}

export function cloneFilterSettings(s: FilterSettings): FilterSettings {
  return {
    enabled: s.enabled,
    perType: s.perType.map(p => ({ ...p })),
    channels: [...s.channels],
    minHashBytes: s.minHashBytes,
    malformed: s.malformed,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/filterCommands.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/config/filterCommands.ts src/test/filterCommands.test.ts
git commit -m "feat(filter): add packet-filter model and firmware defaults"
```

---

## Task 2: `buildFilterCommands` minimal-diff builder

**Files:**
- Modify: `src/lib/config/filterCommands.ts`
- Test: `src/test/filterCommands.test.ts`

- [ ] **Step 1: Write the failing test** (append a new `describe` block to `src/test/filterCommands.test.ts`)

```ts
import { buildFilterCommands } from '../lib/config/filterCommands'

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/filterCommands.test.ts`
Expected: FAIL — `buildFilterCommands` is not exported.

- [ ] **Step 3: Write minimal implementation** (append to `src/lib/config/filterCommands.ts`)

```ts
/**
 * Minimal ordered list of `filter ...` commands to turn `base` into `next`.
 * For the generator, pass base = defaultFilterSettings(); for the live block,
 * pass base = the snapshot read from the device. Enable/disable is emitted last
 * so the configuration is in place before the filter is switched on.
 */
export function buildFilterCommands(next: FilterSettings, base: FilterSettings): string[] {
  const cmds: string[] = []

  if (next.minHashBytes !== base.minHashBytes) {
    cmds.push(`filter hash ${next.minHashBytes}`)
  }
  if (next.malformed !== base.malformed) {
    cmds.push(`filter malformed ${next.malformed ? 'on' : 'off'}`)
  }
  for (let i = 0; i < PAYLOAD_TYPE_COUNT; i++) {
    if (next.perType[i].hops !== base.perType[i].hops) {
      cmds.push(`filter hops ${i} ${next.perType[i].hops}`)
    }
  }
  for (let i = 0; i < PAYLOAD_TYPE_COUNT; i++) {
    const n = next.perType[i]
    const b = base.perType[i]
    if (n.rateLimit !== b.rateLimit || n.rateSecs !== b.rateSecs) {
      cmds.push(`filter rate ${i} ${n.rateLimit} ${n.rateSecs}`)
    }
  }
  for (const ch of next.channels) {
    if (!base.channels.includes(ch)) cmds.push(`filter channel add ${ch}`)
  }
  for (const ch of base.channels) {
    if (!next.channels.includes(ch)) cmds.push(`filter channel remove ${ch}`)
  }
  if (next.enabled !== base.enabled) {
    cmds.push(`filter ${next.enabled ? 'on' : 'off'}`)
  }
  return cmds
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/filterCommands.test.ts`
Expected: PASS (all Task 1 + Task 2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/config/filterCommands.ts src/test/filterCommands.test.ts
git commit -m "feat(filter): add minimal-diff command builder"
```

---

## Task 3: Reply parsers + `assembleFilterSettings`

**Files:**
- Modify: `src/lib/config/filterCommands.ts`
- Test: `src/test/filterCommands.test.ts`

Reply formats (after the toolbox strips the `  -> ` marker; multi-line blocks keep embedded `\n`):
- status: `> Filter on: Blocked [ Hops: 0 | Rate: 0 | Channel: 0 | Hash: 0 | Malformed: 0 ]`
- hops: `[TYPE: MAX_HOPS]\n00: 8\n01: 8\n...\n11: 8`
- rate: `[TYPE: LIMIT,SECS]\n00: 5,60\n...\n11: 5,60`
- channels: `Public (11),#general (a3)` or `None`
- hash: `> Filter: minimal 1 bytes path hash size`
- malformed: `> Filter: malformed text scan off`

- [ ] **Step 1: Write the failing test** (append a new `describe` block)

```ts
import {
  parseFilterEnabled,
  parseFilterHops,
  parseFilterRate,
  parseFilterChannels,
  parseFilterHash,
  parseFilterMalformed,
  assembleFilterSettings,
} from '../lib/config/filterCommands'

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

  it('parses the rate list by index', () => {
    const rate = parseFilterRate('[TYPE: LIMIT,SECS]\n00: 5,60\n02: 20,120')
    expect(rate[0]).toEqual({ limit: 5, secs: 60 })
    expect(rate[2]).toEqual({ limit: 20, secs: 120 })
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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/filterCommands.test.ts`
Expected: FAIL — parsers not exported.

- [ ] **Step 3: Write minimal implementation** (append to `src/lib/config/filterCommands.ts`)

```ts
export function parseFilterEnabled(reply: string): boolean {
  const m = reply.match(/Filter:?\s+(on|off)\b/i)
  return m ? m[1].toLowerCase() === 'on' : false
}

export function parseFilterHops(reply: string): number[] {
  const out: number[] = []
  for (const line of reply.split('\n')) {
    const m = line.match(/^\s*(\d{1,2})\s*:\s*(\d+)\s*$/)
    if (m) out[parseInt(m[1], 10)] = parseInt(m[2], 10)
  }
  return out
}

export function parseFilterRate(reply: string): { limit: number; secs: number }[] {
  const out: { limit: number; secs: number }[] = []
  for (const line of reply.split('\n')) {
    const m = line.match(/^\s*(\d{1,2})\s*:\s*(\d+)\s*,\s*(\d+)\s*$/)
    if (m) out[parseInt(m[1], 10)] = { limit: parseInt(m[2], 10), secs: parseInt(m[3], 10) }
  }
  return out
}

export function parseFilterChannels(reply: string): string[] {
  const body = reply.replace(/^>\s*/, '').trim()
  if (!body || /^none$/i.test(body)) return []
  return body
    .split(',')
    .map(s => s.trim().replace(/\s*\([0-9a-fA-F]{1,2}\)\s*$/, '').trim())
    .filter(Boolean)
}

export function parseFilterHash(reply: string): number | null {
  const m = reply.match(/minimal\s+(\d+)\s+bytes/i)
  return m ? parseInt(m[1], 10) : null
}

export function parseFilterMalformed(reply: string): boolean {
  const m = reply.match(/scan\s+(on|off)\b/i)
  return m ? m[1].toLowerCase() === 'on' : false
}

export interface FilterReplies {
  status: string
  hops: string
  rate: string
  channels: string
  hash: string
  malformed: string
}

/** Build a full FilterSettings from raw device replies, overlaying onto defaults. */
export function assembleFilterSettings(replies: FilterReplies): FilterSettings {
  const s = defaultFilterSettings()
  s.enabled = parseFilterEnabled(replies.status)
  const hops = parseFilterHops(replies.hops)
  const rate = parseFilterRate(replies.rate)
  for (let i = 0; i < PAYLOAD_TYPE_COUNT; i++) {
    if (typeof hops[i] === 'number') s.perType[i].hops = hops[i]
    if (rate[i]) {
      s.perType[i].rateLimit = rate[i].limit
      s.perType[i].rateSecs = rate[i].secs
    }
  }
  s.channels = parseFilterChannels(replies.channels)
  const hash = parseFilterHash(replies.hash)
  if (hash !== null) s.minHashBytes = hash
  s.malformed = parseFilterMalformed(replies.malformed)
  return s
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/filterCommands.test.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 5: Commit**

```bash
git add src/lib/config/filterCommands.ts src/test/filterCommands.test.ts
git commit -m "feat(filter): add device reply parsers and state assembler"
```

---

## Task 4: `isDmcFirmware` helper

**Files:**
- Modify: `src/utils/configUtils.ts`
- Test: `src/test/configUtils.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/test/configUtils.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/configUtils.test.ts`
Expected: FAIL — `isDmcFirmware` not exported.

- [ ] **Step 3: Write minimal implementation** (append to `src/utils/configUtils.ts`, before `PRESETS_URL`)

```ts
/** True when the connected device reports the custom DutchMeshCore firmware. */
export function isDmcFirmware(version: string): boolean {
  return /dutchmeshcore/i.test(version || '')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/configUtils.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/configUtils.ts src/test/configUtils.test.ts
git commit -m "feat(config): add isDmcFirmware version detector"
```

---

## Task 5: Extend `SerialDeviceInfo` with filter state

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add the import** at the top of `src/types.ts` (after line 1, the existing first import is none — add as the first line):

```ts
import type { FilterSettings } from './lib/config/filterCommands'
```

- [ ] **Step 2: Extend the `SerialDeviceInfo` interface** — add two optional fields inside the interface (after `importPrvKey?: string`):

```ts
  filter?: FilterSettings
  filterDevice?: FilterSettings
```

The interface becomes:

```ts
export interface SerialDeviceInfo {
  version: string
  clock: string
  role: string
  pubKey: string
  prvKey: string
  password: string
  vars: DeviceVars
  varsDevice: Partial<DeviceVars>
  importPrvKey?: string
  filter?: FilterSettings
  filterDevice?: FilterSettings
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): add filter state to SerialDeviceInfo"
```

---

## Task 6: i18n keys (NL + EN)

**Files:**
- Modify: `src/i18n.ts`

`STRINGS` has a `nl` block then an `en` block; `StringKey = keyof typeof STRINGS.en`. Add the same two keys to **both** blocks so parity holds.

- [ ] **Step 1: Add `nav_filter`** — in **both** the `nl` and `en` blocks, on the line immediately after `nav_keygen: ...`, add:

NL block (after `nav_keygen: 'Sleutels',`):
```ts
    nav_filter: 'Filter CLI',
```
EN block (after the EN `nav_keygen` entry):
```ts
    nav_filter: 'Filter CLI',
```

- [ ] **Step 2: Add `config_section_filter`** — in **both** blocks, on the line immediately after `config_section_advanced: ...`, add:

NL block:
```ts
    config_section_filter: 'Pakketfilter — (alleen aangepaste DMC-firmware)',
```
EN block:
```ts
    config_section_filter: 'Packet Filter — (Custom DMC firmware only)',
```

- [ ] **Step 3: Verify parity + type-check**

Run: `npx vitest run src/test/i18nOrphans.test.ts && npx tsc -b`
Expected: PASS / no errors. (If an i18n parity test exists it must stay green; both keys were added to both blocks.)

- [ ] **Step 4: Commit**

```bash
git add src/i18n.ts
git commit -m "i18n: add filter nav and config-section labels"
```

---

## Task 7: `FilterSettingsForm` component + styles

**Files:**
- Create: `src/components/config/FilterSettingsForm.tsx`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Create the component**

Create `src/components/config/FilterSettingsForm.tsx`:

```tsx
import { useState } from 'react'
import { PAYLOAD_TYPES, cloneFilterSettings, type FilterSettings } from '../../lib/config/filterCommands'

interface Props {
  value: FilterSettings
  onChange: (next: FilterSettings) => void
}

function clampInt(v: string, min: number, max: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export default function FilterSettingsForm({ value, onChange }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [channelInput, setChannelInput] = useState('')

  function patch(mutate: (s: FilterSettings) => void) {
    const next = cloneFilterSettings(value)
    mutate(next)
    onChange(next)
  }

  function addChannel() {
    const name = channelInput.trim()
    if (!name || value.channels.length >= 16) return
    if (!value.channels.includes(name)) patch(s => { s.channels.push(name) })
    setChannelInput('')
  }

  return (
    <div className="filter-form">
      <label className="check-row">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={e => patch(s => { s.enabled = e.target.checked })}
        />
        Enable packet filter
      </label>

      <div className="field-row" style={{ marginTop: '.5rem' }}>
        <div className="field-group">
          <label>Min path-hash bytes (1–3)</label>
          <input
            type="number" min={1} max={3}
            value={value.minHashBytes}
            onChange={e => patch(s => { s.minHashBytes = clampInt(e.target.value, 1, 3) })}
          />
        </div>
        <div className="field-group">
          <label className="check-row" style={{ marginTop: '1.7rem' }}>
            <input
              type="checkbox"
              checked={value.malformed}
              onChange={e => patch(s => { s.malformed = e.target.checked })}
            />
            Scan public-channel text for malformed UTF-8
          </label>
        </div>
      </div>

      <div className="field-group" style={{ marginTop: '.5rem' }}>
        <label>Blocked channels ({value.channels.length}/16)</label>
        <div className="filter-channel-list">
          {value.channels.length === 0 && <span className="field-hint">None</span>}
          {value.channels.map(ch => (
            <span key={ch} className="filter-channel-chip">
              {ch}
              <button
                type="button" className="chip-remove" aria-label={`Remove ${ch}`}
                onClick={() => patch(s => { s.channels = s.channels.filter(c => c !== ch) })}
              >×</button>
            </span>
          ))}
        </div>
        <div className="filter-channel-add">
          <input
            value={channelInput}
            onChange={e => setChannelInput(e.target.value)}
            placeholder="#channel or Public"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChannel() } }}
          />
          <button type="button" className="btn" onClick={addChannel} disabled={value.channels.length >= 16}>
            Add
          </button>
        </div>
      </div>

      <button
        type="button" className="btn" style={{ marginTop: '.6rem' }}
        onClick={() => setAdvancedOpen(o => !o)}
      >
        {advancedOpen ? '▲' : '▼'} Advanced — per payload type
      </button>

      {advancedOpen && (
        <table className="filter-type-table">
          <thead>
            <tr><th>Type</th><th>Max hops (0–64)</th><th>Rate limit</th><th>Window (s)</th></tr>
          </thead>
          <tbody>
            {PAYLOAD_TYPES.map(pt => (
              <tr key={pt.index}>
                <td><code>{String(pt.index).padStart(2, '0')}</code> {pt.name}</td>
                <td>
                  <input
                    type="number" min={0} max={64}
                    value={value.perType[pt.index].hops}
                    onChange={e => patch(s => { s.perType[pt.index].hops = clampInt(e.target.value, 0, 64) })}
                  />
                </td>
                <td>
                  <input
                    type="number" min={0}
                    value={value.perType[pt.index].rateLimit}
                    onChange={e => patch(s => { s.perType[pt.index].rateLimit = clampInt(e.target.value, 0, 65535) })}
                  />
                </td>
                <td>
                  <input
                    type="number" min={0}
                    value={value.perType[pt.index].rateSecs}
                    onChange={e => patch(s => { s.perType[pt.index].rateSecs = clampInt(e.target.value, 0, 4294967295) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add styles** — append to `src/styles/globals.css`:

```css
/* ── Packet filter form ──────────────────────────────────────────────────── */
.filter-channel-list { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .3rem; }
.filter-channel-chip {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .15rem .5rem; border-radius: 999px;
  background: var(--surface-2, rgba(127,127,127,.15)); font-size: .85rem;
}
.filter-channel-chip .chip-remove {
  background: none; border: none; cursor: pointer; font-size: 1rem; line-height: 1;
  color: inherit; padding: 0;
}
.filter-channel-add { display: flex; gap: .5rem; margin-top: .4rem; }
.filter-type-table { width: 100%; border-collapse: collapse; margin-top: .5rem; font-size: .9rem; }
.filter-type-table th, .filter-type-table td { padding: .25rem .4rem; text-align: left; }
.filter-type-table input { width: 6rem; }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/config/FilterSettingsForm.tsx src/styles/globals.css
git commit -m "feat(filter): add shared FilterSettingsForm component"
```

---

## Task 8: `useSerialDevice` — read filter on connect, write on save

**Files:**
- Modify: `src/hooks/useSerialDevice.ts`

The hook's serial path is not unit-tested in this repo (see `src/test/useSerialDevice.test.ts`); the heavy logic lives in the Task 1–3 pure helpers. Verify this task by type-check/build and the manual hardware check in Task 12.

- [ ] **Step 1: Add imports** — at the top of `src/hooks/useSerialDevice.ts`, after the existing `configUtils` import (line 4), add:

```ts
import { isDmcFirmware } from '../utils/configUtils'
import {
  assembleFilterSettings,
  buildFilterCommands,
  cloneFilterSettings,
  type FilterSettings,
} from '../lib/config/filterCommands'
```

- [ ] **Step 2: Extend the `_getData` cli param type** — it currently lacks `sendCommand`. Replace the `_getData` signature's param type so it includes:

```ts
  async function _getData(cli: {
    getVersion: () => Promise<string>
    getClock: () => Promise<string>
    getRole: () => Promise<string>
    getPubKey: () => Promise<string>
    getVariable: (k: string) => Promise<string>
    parseVariableResponse: (r: string) => unknown
    sendCommand: (cmd: string) => Promise<string>
  }) {
```

- [ ] **Step 3: Read filter state before `setDevice`** — in `_getData`, replace the final `setDevice(...)` line:

```ts
    setDevice({ version: vers, clock, role, pubKey, prvKey, password: '', vars, varsDevice })
    setBusy('')
```

with:

```ts
    let filter: FilterSettings | undefined
    let filterDevice: FilterSettings | undefined
    if (isDmcFirmware(vers)) {
      setBusy('Reading packet filter…')
      try {
        filter = assembleFilterSettings({
          status: await cli.sendCommand('filter'),
          hops: await cli.sendCommand('filter hops'),
          rate: await cli.sendCommand('filter rate'),
          channels: await cli.sendCommand('filter channel list'),
          hash: await cli.sendCommand('filter hash'),
          malformed: await cli.sendCommand('filter malformed'),
        })
        filterDevice = cloneFilterSettings(filter)
      } catch { /* filter is optional; ignore on stock or unresponsive fw */ }
    }

    setDevice({ version: vers, clock, role, pubKey, prvKey, password: '', vars, varsDevice, filter, filterDevice })
    setBusy('')
```

- [ ] **Step 4: Write filter diff on save** — in `setData`, immediately **after** the `if (device.password) { ... }` block and **before** the `await _getData(...)` re-read call, add:

```ts
      if (device.filter && device.filterDevice) {
        const filterCmds = buildFilterCommands(device.filter, device.filterDevice)
        for (const cmd of filterCmds) {
          await cli.sendCommand(cmd)
        }
      }
```

(`cli` in `setData` is already typed with `sendCommand`.)

- [ ] **Step 5: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useSerialDevice.ts
git commit -m "feat(serial): read filter on connect and write diff on save (DMC fw)"
```

---

## Task 9: `ConfigForm` — render the filter panel (DMC only)

**Files:**
- Modify: `src/components/config/ConfigForm.tsx`

- [ ] **Step 1: Add imports** — after the existing imports at the top of `src/components/config/ConfigForm.tsx`, add:

```ts
import FilterSettingsForm from './FilterSettingsForm'
import { isDmcFirmware } from '../../utils/configUtils'
import { defaultFilterSettings } from '../../lib/config/filterCommands'
```

- [ ] **Step 2: Define the section** — after the `AdvancedSection` definition (the `const AdvancedSection = showAdvanced ? (...) : null` block) and before the `return (`, add:

```tsx
  // ── Section: Packet Filter (Custom DMC firmware only) ────────────────────────
  const FilterPanel = isDmcFirmware(device.version) && device.filter ? (
    <div className="panel">
      <div className="panel-legend">{t('config_section_filter')}</div>
      <FilterSettingsForm
        value={device.filter}
        onChange={f => onUpdate({ filter: f })}
      />
      <button
        className="btn" style={{ marginTop: '.6rem' }}
        onClick={async () => {
          await onSendCommand('filter reset')
          onUpdate({ filter: defaultFilterSettings(), filterDevice: defaultFilterSettings() })
        }}
      >
        ♻ Reset filter to defaults
      </button>
    </div>
  ) : null
```

- [ ] **Step 3: Render it** — in the returned JSX, add `{FilterPanel}` on the line immediately after `{OwnerSection}`:

```tsx
      {OwnerSection}
      {FilterPanel}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/config/ConfigForm.tsx
git commit -m "feat(config): add packet-filter panel to repeater setup (DMC fw)"
```

---

## Task 10: `FilterCliPage` generator page

**Files:**
- Create: `src/pages/FilterCliPage.tsx`

Modeled on `MqttCliPage.tsx`: page-local NL/EN `copy` object, `FilterSettingsForm`, an output box built from `buildFilterCommands(state, defaultFilterSettings())` with per-line copy + copy-all, and a help dialog.

- [ ] **Step 1: Create the page**

Create `src/pages/FilterCliPage.tsx`:

```tsx
import { useMemo, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { useToast } from '../hooks/useToast'
import Toast from '../components/ui/Toast'
import FilterSettingsForm from '../components/config/FilterSettingsForm'
import { buildFilterCommands, defaultFilterSettings, PAYLOAD_TYPES } from '../lib/config/filterCommands'

const copy = {
  nl: {
    title: 'Repeater Pakketfilter CLI',
    sub: 'Stel het pakketfilter in en krijg kant-en-klare CLI-opdrachten voor je repeater.',
    bannerTitle: 'Aangepaste DMC-firmware',
    bannerSub: 'Het pakketfilter is alleen beschikbaar in de aangepaste DutchMeshCore repeater-firmware.',
    intro: 'De opdrachten gaan ervan uit dat het filter op de standaardwaarden staat. Voer eerst "filter reset" uit als je twijfelt.',
    output: 'Gegenereerde opdrachten',
    copyAll: 'Alles kopiëren',
    copy: 'Kopieer', copied: 'Gekopieerd!',
    empty: 'Pas instellingen aan om opdrachten te genereren.',
    copiedAll: 'Alle opdrachten gekopieerd!', nothing: 'Nog niets om te kopiëren.',
    help: 'Commandoreferentie', footer: 'Repeater Pakketfilter CLI - 2026',
  },
  en: {
    title: 'Repeater Packet-Filter CLI',
    sub: 'Configure the packet filter and get ready-to-paste CLI commands for your repeater.',
    bannerTitle: 'Custom DMC firmware',
    bannerSub: 'The packet filter is only available in the custom DutchMeshCore repeater firmware.',
    intro: 'The commands assume the filter is at its default settings. Run "filter reset" first if unsure.',
    output: 'Generated commands',
    copyAll: 'Copy all',
    copy: 'Copy', copied: 'Copied!',
    empty: 'Adjust settings to generate commands.',
    copiedAll: 'All commands copied!', nothing: 'Nothing to copy yet.',
    help: 'Command reference', footer: 'Repeater Packet-Filter CLI - 2026',
  },
}

export default function FilterCliPage() {
  const { lang } = useLang()
  const c = copy[lang]
  const { toasts, toast } = useToast()
  const [settings, setSettings] = useState(defaultFilterSettings)
  const [copiedLine, setCopiedLine] = useState<number | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const commands = useMemo(
    () => buildFilterCommands(settings, defaultFilterSettings()),
    [settings],
  )

  async function copyCommand(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopiedLine(index)
    window.setTimeout(() => setCopiedLine(null), 1500)
  }

  async function copyAll() {
    if (commands.length === 0) { toast(c.nothing, 'err'); return }
    await navigator.clipboard.writeText(commands.join('\n'))
    toast(c.copiedAll, 'ok')
  }

  return (
    <>
      <Navbar />
      <main className="page mqtt-page">
        <div className="fw-banner">
          <span className="fw-banner-icon">🇳🇱</span>
          <div className="fw-banner-text">
            <strong>{c.bannerTitle}</strong>
            <p>{c.bannerSub}</p>
          </div>
          <a href="https://dutchmeshcore.nl" target="_blank" rel="noopener noreferrer">dutchmeshcore.nl</a>
        </div>

        <div className="header">
          <h1>{c.title}</h1>
          <p>{c.sub}</p>
        </div>

        <div className="info-box privacy-box"><span>ℹ</span><p>{c.intro}</p></div>

        <FilterSettingsForm value={settings} onChange={setSettings} />

        <div className="output-section">
          <div className="output-header">
            <p className="section-title">{c.output}</p>
            <div className="output-actions">
              <button className="icon-btn" onClick={() => setHelpOpen(true)} title={c.help}>?</button>
              <button className="btn btn-accent" onClick={copyAll}>{c.copyAll}</button>
            </div>
          </div>
          <div className="output-box">
            {commands.length === 0 ? (
              <p className="empty-msg">{c.empty}</p>
            ) : commands.map((line, index) => (
              <div key={index} className="cmd-line">
                <code>{line}</code>
                <button
                  className={`btn btn-sm${copiedLine === index ? ' copied' : ''}`}
                  onClick={() => copyCommand(line, index)}
                >
                  {copiedLine === index ? c.copied : c.copy}
                </button>
              </div>
            ))}
          </div>
        </div>

        <footer className="site-footer">
          <a href="https://dutchmeshcore.nl" target="_blank" rel="noopener noreferrer">DutchMeshCore.nl</a>
          {' '}— {c.footer}
        </footer>
      </main>

      {helpOpen && (
        <div className="help-overlay open" role="dialog" aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setHelpOpen(false) }}>
          <div className="help-dialog">
            <div className="help-dialog-head">
              <h3>{c.help}</h3>
              <button className="help-close-btn" onClick={() => setHelpOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="help-body">
              <table className="help-cmd-table">
                <tbody>
                  <tr><td><code>filter on</code> / <code>filter off</code></td><td>{lang === 'nl' ? 'Filter in-/uitschakelen.' : 'Enable/disable the filter.'}</td></tr>
                  <tr><td><code>filter reset</code></td><td>{lang === 'nl' ? 'Herstel standaardwaarden.' : 'Restore default settings.'}</td></tr>
                  <tr><td><code>filter hops &lt;type&gt; &lt;0–64&gt;</code></td><td>{lang === 'nl' ? 'Max. hops per payload-type.' : 'Max hops per payload type.'}</td></tr>
                  <tr><td><code>filter rate &lt;type&gt; &lt;limit&gt; &lt;secs&gt;</code></td><td>{lang === 'nl' ? 'Snelheidslimiet per type.' : 'Rate limit per type.'}</td></tr>
                  <tr><td><code>filter channel add|remove &lt;#name|Public&gt;</code></td><td>{lang === 'nl' ? 'Blokkeer GRP_TXT-kanaal.' : 'Block a GRP_TXT channel.'}</td></tr>
                  <tr><td><code>filter hash &lt;1–3&gt;</code></td><td>{lang === 'nl' ? 'Min. path-hash bytes.' : 'Min path-hash bytes.'}</td></tr>
                  <tr><td><code>filter malformed on|off</code></td><td>{lang === 'nl' ? 'Scan op ongeldige UTF-8.' : 'Scan for malformed UTF-8.'}</td></tr>
                </tbody>
              </table>
              <p className="help-section-title">{lang === 'nl' ? 'Payload-types' : 'Payload types'}</p>
              <p>{PAYLOAD_TYPES.map(pt => `${String(pt.index).padStart(2, '0')}=${pt.name}`).join('  ')}</p>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors. (If `useToast`'s `toast` signature differs, match it to the usage in `src/pages/MqttCliPage.tsx`, which calls `toast(message, 'ok' | 'err')`.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/FilterCliPage.tsx
git commit -m "feat(filter): add Filter CLI generator page"
```

---

## Task 11: Route + navbar entry

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Add the import + route in `src/App.tsx`**

After `import MqttCliPage from './pages/MqttCliPage'`, add:
```ts
import FilterCliPage from './pages/FilterCliPage'
```
After the `<Route path="/mqtt-cli" ... />` line, add:
```tsx
        <Route path="/filter-cli" element={<FilterCliPage />} />
```

- [ ] **Step 2: Add the nav link in `src/components/layout/Navbar.tsx`**

Update the `inConfig` check (currently `pathname === '/mqtt-cli' || pathname === '/mcmqtt-toml'`) to include the new route:
```ts
  const inConfig = pathname === '/mqtt-cli' || pathname === '/filter-cli' || pathname === '/mcmqtt-toml'
```

Inside the Config dropdown, after the `/mqtt-cli` link line, add:
```tsx
                <Link to="/filter-cli" className={pathname === '/filter-cli' ? 'active' : ''} onClick={close}>{t('nav_filter')}</Link>
```

- [ ] **Step 3: Type-check + build**

Run: `npm run build`
Expected: `tsc -b` clean, `vite build` succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/layout/Navbar.tsx
git commit -m "feat(filter): wire Filter CLI page into routing and nav"
```

---

## Task 12: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole test suite**

Run: `npm run test:run`
Expected: all tests PASS, including the new `filterCommands.test.ts` and `configUtils.test.ts`, and existing i18n/parity tests.

- [ ] **Step 2: Lint (if configured)**

Run: `npm run lint` (skip if the script is absent).
Expected: no new errors in the files added/modified by this plan.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Manual smoke test — generator**

Run: `npm run dev`, open the app, go to **Config → Filter CLI** (`/filter-cli`). Toggle "Enable packet filter", change a per-type hop value, add a channel. Confirm the output box shows the matching `filter ...` lines ending in `filter on`, and that Copy / Copy all work.

- [ ] **Step 5: Manual smoke test — serial block (requires a DMC repeater on USB)**

Open **Devices → Repeater setup** (`/usb-config`), connect to a DMC repeater. Confirm:
- The "Packet Filter — (Custom DMC firmware only)" panel appears and is **pre-filled with the device's current values** (verify a couple against `filter hops` / `filter rate` in the console).
- It does **not** appear when connected to stock (non-DMC) firmware.
- Change a value, click **Save**, reconnect, and confirm the change persisted (only the changed `filter ...` commands were sent).
- "Reset filter to defaults" sends `filter reset` and the form returns to defaults.

- [ ] **Step 6: Final commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "chore(filter): verification fixups"
```

---

## Self-review notes (author)

- **Spec coverage:** model/defaults → Task 1; builder → Task 2; parsers/assembler → Task 3; `isDmcFirmware` → Task 4; types → Task 5; i18n → Task 6; shared form → Task 7; live read/write → Task 8; serial panel (auto-detect + label) → Task 9; generator page → Task 10; routing/nav → Task 11; tests/build/manual → Task 12. All spec sections map to a task.
- **Type consistency:** `FilterSettings`, `PerTypePrefs`, `defaultFilterSettings()`, `cloneFilterSettings()`, `buildFilterCommands(next, base)`, `assembleFilterSettings(replies)`, `FilterReplies`, and `isDmcFirmware()` are used with identical signatures across Tasks 5/7/8/9/10.
- **Known limitation (carried from spec):** the device's 160-byte reply buffer can truncate `filter rate` with very large custom values across all 12 types; defaults and ordinary values fit. Not worked around.
- **To verify during Task 8/12:** exact channel-name round-trip (leading `#` storage and the ` (hashhex)` suffix) against `Filter::addChannel` / `listChannelNames`.
