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
