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

const SHARE_TYPE = 'dmc-filter'
const SHARE_VERSION = 1

/** Serialize filter settings into a shareable, tagged JSON string. */
export function serializeFilterSettings(s: FilterSettings): string {
  return JSON.stringify({ type: SHARE_TYPE, version: SHARE_VERSION, settings: s }, null, 2)
}

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : NaN
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, Math.round(n)))
}

/**
 * Parse and sanitize a shared filter-settings string. Accepts either the tagged
 * wrapper produced by serializeFilterSettings or a bare FilterSettings object.
 * Unknown or out-of-range fields are clamped/dropped by overlaying onto the
 * firmware defaults, so the result is always a safe FilterSettings. Returns null
 * for non-JSON input or JSON that does not look like filter settings.
 */
export function parseSharedFilterSettings(text: string): FilterSettings | null {
  let data: unknown
  try { data = JSON.parse(text) } catch { return null }
  if (!data || typeof data !== 'object') return null

  const tagged = data as { type?: unknown; settings?: unknown }
  const raw = (tagged.type === SHARE_TYPE ? tagged.settings : data) as Record<string, unknown> | undefined
  if (!raw || typeof raw !== 'object') return null

  const looksLikeFilter =
    typeof raw.enabled === 'boolean' ||
    typeof raw.malformed === 'boolean' ||
    typeof raw.minHashBytes === 'number' ||
    Array.isArray(raw.channels) ||
    Array.isArray(raw.perType)
  if (!looksLikeFilter) return null

  const s = defaultFilterSettings()
  if (typeof raw.enabled === 'boolean') s.enabled = raw.enabled
  if (typeof raw.malformed === 'boolean') s.malformed = raw.malformed

  const hash = clampInt(raw.minHashBytes, 1, 3)
  if (hash !== null) s.minHashBytes = hash

  if (Array.isArray(raw.channels)) {
    const seen = new Set<string>()
    s.channels = raw.channels
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0 && !/\s/.test(c))
      .filter(c => (seen.has(c) ? false : (seen.add(c), true)))
      .slice(0, 16)
  }

  if (Array.isArray(raw.perType)) {
    for (let i = 0; i < PAYLOAD_TYPE_COUNT; i++) {
      const p = raw.perType[i]
      if (!p || typeof p !== 'object') continue
      const pt = p as Record<string, unknown>
      const hops = clampInt(pt.hops, 0, 64)
      const rateLimit = clampInt(pt.rateLimit, 0, 65535)
      const rateSecs = clampInt(pt.rateSecs, 0, 4294967295)
      if (hops !== null) s.perType[i].hops = hops
      if (rateLimit !== null) s.perType[i].rateLimit = rateLimit
      if (rateSecs !== null) s.perType[i].rateSecs = rateSecs
    }
  }

  return s
}

export interface FilterBlockedCounts {
  hops: number
  rate: number
  channel: number
  hash: number
  malformed: number
}

/**
 * Parse the blocked breakdown from the `filter` status line, e.g.
 * `Filter on: Blocked [ Hops: 3 | Rate: 12 | Channel: 1 | Hash: 0 | Malformed: 2 ]`.
 * Returns null when the reply is not a DMC filter status line.
 */
export function parseFilterBlockedCounts(reply: string): FilterBlockedCounts | null {
  if (!isFilterStatusReply(reply)) return null
  const num = (label: string): number => {
    const m = reply.match(new RegExp(label + '\\s*:\\s*(\\d+)', 'i'))
    return m ? parseInt(m[1], 10) : 0
  }
  return {
    hops: num('Hops'),
    rate: num('Rate'),
    channel: num('Channel'),
    hash: num('Hash'),
    malformed: num('Malformed'),
  }
}

/**
 * Parse `filter count` output. Each line is `<type>: <hopsBlocked>,<rateBlocked>`,
 * e.g. `05: 2,10`. Returns a map keyed by payload-type index.
 */
export function parseFilterCount(reply: string): Record<number, { hops: number; rate: number }> {
  const out: Record<number, { hops: number; rate: number }> = {}
  for (const line of reply.split('\n')) {
    const m = line.match(/^\s*>?\s*(\d{1,2})\s*:\s*(\d+)\s*,\s*(\d+)\s*$/)
    if (m) out[parseInt(m[1], 10)] = { hops: parseInt(m[2], 10), rate: parseInt(m[3], 10) }
  }
  return out
}

/**
 * True if a bare `filter` reply is the DMC packet-filter status line
 * (`> Filter on|off: Blocked [...]`). Used to detect filter support by
 * capability rather than firmware name – stock firmware answers an unknown
 * `filter` command with `> Unknown command`, which does not match.
 */
export function isFilterStatusReply(reply: string): boolean {
  return /Filter\s+(?:on|off):\s*Blocked/i.test(reply)
}
