// Canonical model + command builders/parsers for the repeater packet filter.
// Mirrors MeshCore/examples/simple_repeater/Filter.{h,cpp} (dmc-dev), including the
// soft cutoff, dry-run, per-origin advert window, message age limit, blocked path
// prefixes, sender/text rules and the rule watch list. Older DMC builds (v1.17.1)
// lack some of these; see FilterFeatures.

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

// Firmware limits (Filter.h, FilterStats.h, PathBlock.h, SenderRules.h, MessageAge.h).
export const FILTER_CHANNEL_MAX = 16
export const FILTER_PATH_MAX = 8
export const FILTER_RULE_MAX = 8
export const FILTER_WATCH_MAX = 4
export const FILTER_SENDER_LEN = 15
export const FILTER_TEXT_LEN = 23
export const FILTER_ADVERT_MAX_HOURS = 720
export const FILTER_AGE_MAX_MINS = 10080

export interface PerTypePrefs {
  hops: number
  rateLimit: number
  rateSecs: number
  /** Soft cutoff: below `rateLimit`, drops probabilistically from here up. 0 = off. */
  soft: number
}

/** A sender or text rule. secs 0 = block, 1-65535 = throttle; prob 1-100 = dosing. */
export interface FilterRule {
  pattern: string
  secs: number
  prob: number
}

export interface FilterSettings {
  enabled: boolean
  perType: PerTypePrefs[] // length 12, indexed by payload type
  channels: string[]
  minHashBytes: number
  malformed: boolean
  dryrun: boolean
  advertHours: number
  ageMins: number
  /** Blocked path prefixes, upper-case hex (2-8 digits). */
  paths: string[]
  senders: FilterRule[]
  texts: FilterRule[]
  /** Extra `#channels` the sender/text rules and age limit may read (Public is implicit). */
  watch: string[]
}

/**
 * Which optional filter features the connected firmware answers. Older DMC builds
 * only know the v1.17 base (hops, rate, channel, hash, malformed). Pass undefined
 * where every feature is available (the CLI generator targets current firmware).
 */
export interface FilterFeatures {
  soft: boolean
  dryrun: boolean
  advert: boolean
  age: boolean
  path: boolean
  rules: boolean
}

export const ALL_FILTER_FEATURES: FilterFeatures = {
  soft: true, dryrun: true, advert: true, age: true, path: true, rules: true,
}

const DEFAULT_HOPS = 8
const DEFAULT_RATE_LIMIT = 5
const DEFAULT_RATE_SECS = 60

function defaultPerType(): PerTypePrefs[] {
  const perType: PerTypePrefs[] = PAYLOAD_TYPES.map(() => ({
    hops: DEFAULT_HOPS,
    rateLimit: DEFAULT_RATE_LIMIT,
    rateSecs: DEFAULT_RATE_SECS,
    soft: 0,
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
    dryrun: false,
    advertHours: 0,
    ageMins: 0,
    paths: [],
    senders: [],
    texts: [],
    watch: [],
  }
}

export function cloneFilterSettings(s: FilterSettings): FilterSettings {
  return {
    enabled: s.enabled,
    perType: s.perType.map(p => ({ ...p })),
    channels: [...s.channels],
    minHashBytes: s.minHashBytes,
    malformed: s.malformed,
    dryrun: s.dryrun,
    advertHours: s.advertHours,
    ageMins: s.ageMins,
    paths: [...s.paths],
    senders: s.senders.map(r => ({ ...r })),
    texts: s.texts.map(r => ({ ...r })),
    watch: [...s.watch],
  }
}

/** The `[secs] [prob]` tail of a rule, omitting trailing defaults. */
function ruleArgs(r: FilterRule): string {
  if (r.prob !== 100) return ` ${r.secs} ${r.prob}`
  if (r.secs !== 0) return ` ${r.secs}`
  return ''
}

function sameRules(a: FilterRule[], b: FilterRule[]): boolean {
  return a.length === b.length &&
    a.every((r, i) => r.pattern === b[i].pattern && r.secs === b[i].secs && r.prob === b[i].prob)
}

/**
 * Minimal ordered list of `filter ...` commands to turn `base` into `next`.
 * For the generator, pass base = defaultFilterSettings(); for the live block,
 * pass base = the snapshot read from the device plus its features, so nothing
 * the firmware does not understand is sent. Enable/disable is emitted last so
 * the configuration is in place before the filter is switched on.
 */
export function buildFilterCommands(
  next: FilterSettings,
  base: FilterSettings,
  features: FilterFeatures = ALL_FILTER_FEATURES,
): string[] {
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
    const soft = features.soft ? n.soft : 0
    if (n.rateLimit !== b.rateLimit || n.rateSecs !== b.rateSecs || (features.soft && n.soft !== b.soft)) {
      // An omitted soft argument means "off", so only send it when set.
      cmds.push(`filter rate ${i} ${n.rateLimit} ${n.rateSecs}${soft > 0 ? ` ${soft}` : ''}`)
    }
  }
  for (const ch of next.channels) {
    if (!base.channels.includes(ch)) cmds.push(`filter channel add ${ch}`)
  }
  for (const ch of base.channels) {
    if (!next.channels.includes(ch)) cmds.push(`filter channel remove ${ch}`)
  }
  if (features.advert && next.advertHours !== base.advertHours) {
    cmds.push(`filter advert ${next.advertHours}`)
  }
  if (features.path) {
    for (const p of base.paths) {
      if (!next.paths.includes(p)) cmds.push(`filter path remove ${p}`)
    }
    for (const p of next.paths) {
      if (!base.paths.includes(p)) cmds.push(`filter path add ${p}`)
    }
  }
  if (features.rules) {
    // Watch first, so the rules can read the channel the moment they exist.
    for (const w of base.watch) {
      if (!next.watch.includes(w)) cmds.push(`filter watch remove ${w}`)
    }
    for (const w of next.watch) {
      if (!base.watch.includes(w)) cmds.push(`filter watch add ${w}`)
    }
    // Rules are evaluated in order and `add` of an existing pattern fails, so any
    // change rebuilds the whole list.
    for (const kind of ['sender', 'text'] as const) {
      const n = kind === 'sender' ? next.senders : next.texts
      const b = kind === 'sender' ? base.senders : base.texts
      if (sameRules(n, b)) continue
      for (const r of b) cmds.push(`filter ${kind} remove ${r.pattern}`)
      for (const r of n) cmds.push(`filter ${kind} add ${r.pattern}${ruleArgs(r)}`)
    }
  }
  if (features.age && next.ageMins !== base.ageMins) {
    cmds.push(`filter age ${next.ageMins > 0 ? next.ageMins : 'off'}`)
  }
  if (features.dryrun && next.dryrun !== base.dryrun) {
    cmds.push(`filter dryrun ${next.dryrun ? 'on' : 'off'}`)
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

/**
 * Parse `filter rate`. Current firmware prints `NN: limit,secs,soft` under a
 * `[TYPE: LIMIT,SECS,SOFT]` header; v1.17.1 printed `NN: limit,secs`. When the
 * header announces SOFT, two-value lines are ignored: the reply is capped at 160
 * bytes, so a truncated last line would otherwise parse as a wrong value.
 */
export function parseFilterRate(reply: string): { limit: number; secs: number; soft: number }[] {
  const out: { limit: number; secs: number; soft: number }[] = []
  const hasSoft = /LIMIT,SECS,SOFT/i.test(reply)
  for (const line of reply.split('\n')) {
    const m = line.match(/^\s*(\d{1,2})\s*:\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+)\s*)?$/)
    if (!m || (hasSoft && m[4] === undefined)) continue
    out[parseInt(m[1], 10)] = {
      limit: parseInt(m[2], 10),
      secs: parseInt(m[3], 10),
      soft: m[4] === undefined ? 0 : parseInt(m[4], 10),
    }
  }
  return out
}

/** Split a comma-separated list reply (`None` = empty), dropping `(hex)` / `: count` suffixes. */
function parseNameList(reply: string): string[] {
  const body = reply.replace(/^>\s*/, '').trim()
  if (!body || /^none$/i.test(body)) return []
  return body
    .split(',')
    .map(s => s.trim().replace(/\s*:\s*\d+.*$/, '').replace(/\s*\([0-9a-fA-F]{1,2}\)\s*$/, '').trim())
    .filter(Boolean)
}

export function parseFilterChannels(reply: string): string[] {
  return parseNameList(reply)
}

export function parseFilterHash(reply: string): number | null {
  const m = reply.match(/minimal\s+(\d+)\s+bytes/i)
  return m ? parseInt(m[1], 10) : null
}

export function parseFilterMalformed(reply: string): boolean {
  const m = reply.match(/scan\s+(on|off)\b/i)
  return m ? m[1].toLowerCase() === 'on' : false
}

/** `> Filter: dry-run on|off`; null when the firmware does not know dry-run. */
export function parseFilterDryrun(reply: string): boolean | null {
  const m = reply.match(/dry-run\s+(on|off)\b/i)
  return m ? m[1].toLowerCase() === 'on' : null
}

/** `> Filter: advert origin window 48h (cache 87/256)`; null when unsupported. */
export function parseFilterAdvert(reply: string): number | null {
  const m = reply.match(/advert origin window\s+(\d+)h/i)
  return m ? parseInt(m[1], 10) : null
}

/**
 * `filter age`: `> Message age: max 60m, dropped 0[ (clock not set, inactive)]`,
 * or `> Filter: message age limit off`. Returns minutes (0 = off), null when unsupported.
 */
export function parseFilterAge(reply: string): number | null {
  if (/message age limit off/i.test(reply)) return 0
  const m = reply.match(/Message age:\s*max\s+(\d+)m/i)
  return m ? parseInt(m[1], 10) : null
}

/** True if a list reply came from firmware that knows the subcommand. */
function isListReply(reply: string): boolean {
  const body = reply.replace(/^>\s*/, '').trim()
  return body.length > 0 && !/command error|unknown|syntax error|^filter\s/i.test(body)
}

/** `filter path list`: `A1B2,C3` or `None`; null when unsupported. */
export function parseFilterPaths(reply: string): string[] | null {
  if (!isListReply(reply)) return null
  return parseNameList(reply).map(p => p.toUpperCase()).filter(p => /^(?:[0-9A-F]{2}){1,4}$/.test(p))
}

/** `filter sender list` / `filter text list`: `Bob throttle 60s,Bot* block 50%` or `None`. */
export function parseFilterRules(reply: string): FilterRule[] | null {
  if (!isListReply(reply)) return null
  const body = reply.replace(/^>\s*/, '').trim()
  if (/^none$/i.test(body)) return []
  const out: FilterRule[] = []
  for (const item of body.split(',')) {
    const m = item.trim().match(/^(\S+)\s+(?:throttle\s+(\d+)s|block)(?:\s+(\d+)%)?$/i)
    if (!m) continue
    out.push({
      pattern: m[1],
      secs: m[2] === undefined ? 0 : parseInt(m[2], 10),
      prob: m[3] === undefined ? 100 : parseInt(m[3], 10),
    })
  }
  return out
}

/** `filter watch list`: `Public (11),#bots (a3)`; Public is implicit and dropped. */
export function parseFilterWatch(reply: string): string[] | null {
  if (!isListReply(reply)) return null
  return parseNameList(reply).filter(n => n !== 'Public')
}

export interface FilterReplies {
  status: string
  hops: string
  rate: string
  channels: string
  hash: string
  malformed: string
  dryrun?: string
  advert?: string
  age?: string
  paths?: string
  senders?: string
  texts?: string
  watch?: string
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
      s.perType[i].soft = rate[i].soft
    }
  }
  s.channels = parseFilterChannels(replies.channels)
  const hash = parseFilterHash(replies.hash)
  if (hash !== null) s.minHashBytes = hash
  s.malformed = parseFilterMalformed(replies.malformed)
  s.dryrun = parseFilterDryrun(replies.dryrun ?? '') ?? false
  s.advertHours = parseFilterAdvert(replies.advert ?? '') ?? 0
  s.ageMins = parseFilterAge(replies.age ?? '') ?? 0
  s.paths = parseFilterPaths(replies.paths ?? '') ?? []
  s.senders = parseFilterRules(replies.senders ?? '') ?? []
  s.texts = parseFilterRules(replies.texts ?? '') ?? []
  s.watch = parseFilterWatch(replies.watch ?? '') ?? []
  return s
}

/** Which optional features the replies show the firmware supports. */
export function detectFilterFeatures(replies: FilterReplies): FilterFeatures {
  return {
    soft: /LIMIT,SECS,SOFT/i.test(replies.rate),
    dryrun: parseFilterDryrun(replies.dryrun ?? '') !== null,
    advert: parseFilterAdvert(replies.advert ?? '') !== null,
    age: parseFilterAge(replies.age ?? '') !== null,
    path: parseFilterPaths(replies.paths ?? '') !== null,
    rules: parseFilterRules(replies.senders ?? '') !== null,
  }
}

/**
 * Read the whole filter configuration from a device. Returns null when the
 * firmware has no packet filter (stock firmware answers `filter` with
 * "Unknown command"). Subcommands older builds lack simply fail detection.
 */
export async function readFilterFromDevice(
  send: (cmd: string) => Promise<string>,
): Promise<{ settings: FilterSettings; features: FilterFeatures } | null> {
  const status = await send('filter')
  if (!isFilterStatusReply(status)) return null
  const replies: FilterReplies = {
    status,
    hops: await send('filter hops'),
    rate: await send('filter rate'),
    channels: await send('filter channel list'),
    hash: await send('filter hash'),
    malformed: await send('filter malformed'),
    dryrun: await send('filter dryrun'),
    advert: await send('filter advert'),
    age: await send('filter age'),
    paths: await send('filter path list'),
    senders: await send('filter sender list'),
    texts: await send('filter text list'),
    watch: await send('filter watch list'),
  }
  return { settings: assembleFilterSettings(replies), features: detectFilterFeatures(replies) }
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

/** Unique, non-empty, whitespace-free strings, capped at `max`. */
function cleanNames(v: unknown, max: number, valid: (s: string) => boolean = () => true): string[] {
  if (!Array.isArray(v)) return []
  const seen = new Set<string>()
  return v
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0 && !/\s/.test(c) && valid(c))
    .filter(c => (seen.has(c) ? false : (seen.add(c), true)))
    .slice(0, max)
}

function cleanRules(v: unknown, maxLen: number): FilterRule[] {
  if (!Array.isArray(v)) return []
  const seen = new Set<string>()
  const out: FilterRule[] = []
  for (const r of v) {
    if (!r || typeof r !== 'object') continue
    const rr = r as Record<string, unknown>
    const pattern = typeof rr.pattern === 'string' ? rr.pattern : ''
    if (!pattern || /[\s,]/.test(pattern) || pattern.length > maxLen || seen.has(pattern)) continue
    seen.add(pattern)
    out.push({
      pattern,
      secs: clampInt(rr.secs, 0, 65535) ?? 0,
      prob: clampInt(rr.prob, 1, 100) ?? 100,
    })
    if (out.length >= FILTER_RULE_MAX) break
  }
  return out
}

/** True for a path prefix the firmware accepts: 2-8 hex digits, whole bytes. */
export function isValidPathPrefix(p: string): boolean {
  return /^(?:[0-9a-fA-F]{2}){1,4}$/.test(p)
}

/**
 * Parse and sanitize a shared filter-settings string. Accepts either the tagged
 * wrapper produced by serializeFilterSettings or a bare FilterSettings object.
 * Unknown or out-of-range fields are clamped/dropped by overlaying onto the
 * firmware defaults, so the result is always a safe FilterSettings. Files from
 * before the soft cutoff / dry-run / rules existed load with those at defaults.
 * Returns null for non-JSON input or JSON that does not look like filter settings.
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
  if (typeof raw.dryrun === 'boolean') s.dryrun = raw.dryrun

  const hash = clampInt(raw.minHashBytes, 1, 3)
  if (hash !== null) s.minHashBytes = hash
  const advert = clampInt(raw.advertHours, 0, FILTER_ADVERT_MAX_HOURS)
  if (advert !== null) s.advertHours = advert
  const age = clampInt(raw.ageMins, 0, FILTER_AGE_MAX_MINS)
  if (age !== null) s.ageMins = age

  s.channels = cleanNames(raw.channels, FILTER_CHANNEL_MAX)
  s.paths = cleanNames(raw.paths, FILTER_PATH_MAX, isValidPathPrefix).map(p => p.toUpperCase())
  s.watch = cleanNames(raw.watch, FILTER_WATCH_MAX, w => w.startsWith('#'))
  s.senders = cleanRules(raw.senders, FILTER_SENDER_LEN)
  s.texts = cleanRules(raw.texts, FILTER_TEXT_LEN)

  if (Array.isArray(raw.perType)) {
    for (let i = 0; i < PAYLOAD_TYPE_COUNT; i++) {
      const p = raw.perType[i]
      if (!p || typeof p !== 'object') continue
      const pt = p as Record<string, unknown>
      const hops = clampInt(pt.hops, 0, 64)
      const rateLimit = clampInt(pt.rateLimit, 0, 65535)
      const rateSecs = clampInt(pt.rateSecs, 0, 4294967295)
      const soft = clampInt(pt.soft, 0, 65535)
      if (hops !== null) s.perType[i].hops = hops
      if (rateLimit !== null) s.perType[i].rateLimit = rateLimit
      if (rateSecs !== null) s.perType[i].rateSecs = rateSecs
      // The firmware rejects a soft cutoff at or above the limit.
      if (soft !== null) s.perType[i].soft = soft < s.perType[i].rateLimit ? soft : 0
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
 * (`> Filter on|off: Blocked [...]`, with a trailing `(dry-run)` while dry-run
 * is on). Used to detect filter support by capability rather than firmware
 * name – stock firmware answers an unknown `filter` command with
 * `> Unknown command`, which does not match.
 */
export function isFilterStatusReply(reply: string): boolean {
  return /Filter\s+(?:on|off):\s*Blocked/i.test(reply)
}
