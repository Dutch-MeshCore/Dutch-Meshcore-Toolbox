// Canonical model + command builders/parsers for MeshCore region gating.
// Mirrors the dmc-observer regiongating firmware branch. See
// specs/2026-08-24-region-duty-cycle-support-design.md.

export interface RegionNode {
  name: string          // '*' for the wildcard root
  flood: boolean        // flood-allowed (trailing F in the dump)
  children: RegionNode[]
}

export interface DcGateSettings {
  enabled: boolean
  thresh: number        // 1..100
  hyst: number          // 0..50
}

export interface RegionSettings {
  tree: RegionNode
  home: string | null
  default: string | null
  dcGate: DcGateSettings
}

export function defaultRegionSettings(): RegionSettings {
  return {
    tree: { name: '*', flood: false, children: [] },
    home: null,
    default: null,
    dcGate: { enabled: false, thresh: 70, hyst: 10 },
  }
}

export function cloneRegionNode(n: RegionNode): RegionNode {
  return { name: n.name, flood: n.flood, children: n.children.map(cloneRegionNode) }
}

export function cloneRegionSettings(s: RegionSettings): RegionSettings {
  return {
    tree: cloneRegionNode(s.tree),
    home: s.home,
    default: s.default,
    dcGate: { ...s.dcGate },
  }
}

// VERIFIED against firmware (RegionMap.cpp printChildRegions): the dump uses
// exactly ONE leading space per depth level. Root '*' at column 0 (depth 0),
// children at 1 space (depth 1), grandchildren at 2 spaces (depth 2).
const INDENT = 1

/**
 * Parse the `region` dump into a tree rooted at the wildcard '*'. Format: 1 space
 * per depth level; wildcard prints as '*'; named regions WITHOUT '#'; the home
 * region has a trailing '^'; flood-allowed has a trailing ' F'. Home is read
 * separately via `region home`, so '^' is stripped here. An empty or unsupported
 * reply yields a lone flood-denied wildcard.
 */
export function parseRegionTree(reply: string): RegionNode {
  const root: RegionNode = { name: '*', flood: false, children: [] }
  const stack: RegionNode[] = []
  for (const raw of reply.split('\n')) {
    const line = raw.replace(/\r$/, '')
    if (!line.trim()) continue
    if (/unknown command|error|-none-/i.test(line)) continue
    const indent = line.length - line.trimStart().length
    const depth = Math.floor(indent / INDENT)
    let body = line.trim()
    const flood = /\sF$/.test(body)          // trailing ' F'
    body = body.replace(/\s+F$/, '')         // drop flood flag
    const name = body.replace(/\^+$/, '').replace(/^#/, '').trim() // drop home '^' and any '#'
    if (!name) continue
    if (name === '*') {
      root.flood = flood
      stack.length = 0
      stack[0] = root
      continue
    }
    const node: RegionNode = { name, flood, children: [] }
    const parent = stack[depth - 1] ?? root
    parent.children.push(node)
    stack[depth] = node
    stack.length = depth + 1
  }
  return root
}

// Firmware replies are prefixed with '> '; strip it before interpreting.
const strip = (s: string): string => s.replace(/^>\s*/, '').trim()
const asBool = (s: string): boolean => /^(on|1|true|enabled)$/i.test(strip(s))
const asInt = (s: string, fallback: number): number => {
  const m = s.match(/-?\d+/)
  return m ? parseInt(m[0], 10) : fallback
}

export interface DcGateReplies { enabled: string; thresh: string; hyst: string }

/** Build DcGateSettings from the three `get dc.gate*` replies, overlaying defaults. */
export function parseDcGate(r: DcGateReplies): DcGateSettings {
  const d = defaultRegionSettings().dcGate
  return {
    enabled: asBool(r.enabled),
    thresh: asInt(r.thresh, d.thresh),
    hyst: asInt(r.hyst, d.hyst),
  }
}

export interface DcGateStatus { dutyPct: number; level: number; maxLevel: number }

/**
 * Parse the live status line `> duty {N}%, gate level {cur}/{max}`.
 * Returns null if it does not match.
 */
export function parseDcGateStatus(reply: string): DcGateStatus | null {
  const duty = reply.match(/duty\s+(\d+)\s*%/i)
  const gate = reply.match(/gate\s+level\s+(\d+)\s*\/\s*(\d+)/i)
  if (!duty || !gate) return null
  return { dutyPct: parseInt(duty[1], 10), level: parseInt(gate[1], 10), maxLevel: parseInt(gate[2], 10) }
}

export interface Neighbor { pubkey: string; ageSecs: number; snr: number }

/**
 * Parse `neighbors` output: each line is `{8-hex}:{seconds_ago}:{snr*4}`.
 * Field 2 is an age in seconds; field 3 is SNR times 4 (divided back to dB here).
 */
export function parseNeighbors(reply: string): Neighbor[] {
  const out: Neighbor[] = []
  for (const raw of reply.split('\n')) {
    const m = raw.trim().match(/^([0-9a-fA-F]{2,}):(\d+):(-?\d+)$/)
    if (m) out.push({ pubkey: m[1], ageSecs: parseInt(m[2], 10), snr: parseInt(m[3], 10) / 4 })
  }
  return out
}

function treeEqual(a: RegionNode, b: RegionNode): boolean {
  return a.name === b.name && a.flood === b.flood &&
    a.children.length === b.children.length &&
    a.children.every((c, i) => treeEqual(c, b.children[i]))
}

function preorder(root: RegionNode): RegionNode[] {
  const out: RegionNode[] = []
  const walk = (n: RegionNode) => { out.push(n); n.children.forEach(walk) }
  walk(root)
  return out
}

// Leaf-first (children before parents), excluding the wildcard root.
function removeOrder(root: RegionNode): string[] {
  const out: string[] = []
  const walk = (n: RegionNode) => {
    n.children.forEach(walk)
    if (n.name !== '*') out.push(n.name)
  }
  walk(root)
  return out
}

// Parent-first, excluding the wildcard root. Parent is '*' for top-level regions,
// otherwise the parent's name.
function putOrder(root: RegionNode): { name: string; parent: string }[] {
  const out: { name: string; parent: string }[] = []
  const walk = (n: RegionNode, parentName: string) => {
    if (n.name !== '*') out.push({ name: n.name, parent: parentName })
    for (const c of n.children) walk(c, n.name === '*' ? '*' : n.name)
  }
  walk(root, '*')
  return out
}

/**
 * Ordered command list turning `base` (the device snapshot) into `next`.
 *
 * Tree changes apply as a declarative clear-then-rebuild using discrete commands
 * (the interactive `region load` protocol is incompatible with the request/
 * response serial layer): remove old regions leaf-first, put new regions
 * parent-first, then force each node's flood state with allowf/denyf (including
 * the wildcard '*'). home/default and dc.gate diff independently. Empty when
 * nothing changed.
 */
export function buildRegionCommands(next: RegionSettings, base: RegionSettings): string[] {
  const cmds: string[] = []

  const treeChanged = !treeEqual(next.tree, base.tree)
  const homeChanged = next.home !== base.home
  const defaultChanged = next.default !== base.default

  if (treeChanged) {
    for (const name of removeOrder(base.tree)) cmds.push(`region remove ${name}`)
    for (const { name, parent } of putOrder(next.tree)) cmds.push(`region put ${name} ${parent}`)
    for (const n of preorder(next.tree)) cmds.push(`region ${n.flood ? 'allowf' : 'denyf'} ${n.name}`)
  }
  if (homeChanged && next.home) cmds.push(`region home ${next.home}`)
  if (defaultChanged) cmds.push(`region default ${next.default ?? '<null>'}`)
  if (treeChanged || homeChanged || defaultChanged) cmds.push('region save')

  if (next.dcGate.enabled !== base.dcGate.enabled) {
    cmds.push(`set dc.gate ${next.dcGate.enabled ? '1' : '0'}`)
  }
  if (next.dcGate.thresh !== base.dcGate.thresh) {
    cmds.push(`set dc.gate.thresh ${next.dcGate.thresh}`)
  }
  if (next.dcGate.hyst !== base.dcGate.hyst) {
    cmds.push(`set dc.gate.hyst ${next.dcGate.hyst}`)
  }
  return cmds
}

export function regionSupported(reply: string): boolean {
  if (/unknown command/i.test(reply)) return false
  return /\*/.test(reply) // the dump always contains the '*' wildcard root
  // (region is a base repeater feature, v1.10+; only dc.gate is DMC-specific)
}

/** Parse bare `region home` reply ' home is <name>' (' home is *' means unset). */
export function parseRegionHome(reply: string): string | null {
  const m = reply.match(/home is(?:\s+now)?\s+(.+?)\s*$/i)
  const v = m ? m[1].trim() : ''
  return v && v !== '*' ? v.replace(/^#/, '') : null
}

/** Parse bare `region default` reply ' default scope is <name>' ('<null>' means unset). */
export function parseRegionDefault(reply: string): string | null {
  const m = reply.match(/default scope is(?:\s+now)?\s+(.+?)\s*$/i)
  const v = m ? m[1].trim() : ''
  return v && v !== '<null>' ? v.replace(/^#/, '') : null
}

export interface RegionReplies {
  tree: string
  home: string
  default: string
  dcGate: DcGateReplies
}

/** Assemble a RegionSettings from raw device replies, overlaying defaults. */
export function assembleRegionSettings(r: RegionReplies): RegionSettings {
  const s = defaultRegionSettings()
  s.tree = parseRegionTree(r.tree)
  s.home = parseRegionHome(r.home)
  s.default = parseRegionDefault(r.default)
  s.dcGate = parseDcGate(r.dcGate)
  return s
}

/**
 * Serialise a flood-allowed ('allow-only') tree to the space-separated `region
 * def` shorthand used by config.meshcore.io / firmware. Uses the firmware cursor
 * model: after a subtree, the last token gets a `|<parent>` jump so the next
 * sibling is created under the correct parent. Deny nodes cannot be expressed by
 * `def` (all nodes are treated as flood-allowed here).
 */
export function treeToDefString(root: RegionNode): string {
  const tokens: string[] = []
  const emit = (node: RegionNode) => {
    node.children.forEach((child, i) => {
      tokens.push(child.name)            // create child under `node` (cursor at node)
      emit(child)                        // recurse; cursor ends deep in child's subtree
      const isLast = i === node.children.length - 1
      if (!isLast) tokens[tokens.length - 1] += `|${node.name}` // jump back to parent
    })
  }
  emit(root)
  return tokens.join(' ')
}

/**
 * Parse a `region def` shorthand back into an allow-only tree rooted at '*'.
 * A plain token creates a region under the cursor and moves the cursor to it; a
 * `X|Y` token creates X under the cursor then moves the cursor to the existing
 * region named Y ('*' is the wildcard root).
 */
export function defStringToTree(def: string): RegionNode {
  const root: RegionNode = { name: '*', flood: true, children: [] }
  const byName = new Map<string, RegionNode>([['*', root]])
  let cursor = root
  for (const tok of def.trim().split(/\s+/).filter(Boolean)) {
    const pipe = tok.indexOf('|')
    const createName = pipe === -1 ? tok : tok.slice(0, pipe)
    const jumpName = pipe === -1 ? undefined : tok.slice(pipe + 1)
    if (createName) {
      const node: RegionNode = { name: createName, flood: true, children: [] }
      cursor.children.push(node)
      byName.set(createName, node)
      cursor = node
    }
    if (jumpName !== undefined) {
      cursor = byName.get(jumpName) ?? root
    }
  }
  return root
}

export interface RegionBackup { def: string; home: string; default: string }

/**
 * Region block for the device backup, aligned with config.meshcore.io PR #3
 * (region.def / region.home / region.default). def is the allow-only shorthand.
 */
export function regionToBackup(s: RegionSettings): RegionBackup {
  return {
    def: treeToDefString(s.tree),
    home: s.home ?? '',
    default: s.default ?? '',
  }
}

/**
 * Rebuild RegionSettings from a backup block. Tree comes from the def shorthand
 * (allow-only). dcGate is not part of the config.meshcore.io shape, so it is kept
 * from `base` (the connected device's current gating).
 */
export function backupToRegion(b: RegionBackup, base: RegionSettings): RegionSettings {
  const s = cloneRegionSettings(base)
  if (typeof b.def === 'string') s.tree = defStringToTree(b.def)
  s.home = b.home?.trim() ? b.home.trim() : null
  s.default = b.default?.trim() ? b.default.trim() : null
  return s
}

const SHARE_TYPE = 'dmc-region'
const SHARE_VERSION = 1

export function serializeRegionSettings(s: RegionSettings): string {
  return JSON.stringify({ type: SHARE_TYPE, version: SHARE_VERSION, settings: s }, null, 2)
}

const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : NaN
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function sanitizeNode(raw: unknown): RegionNode | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.name !== 'string' || !r.name.trim()) return null
  const children = Array.isArray(r.children)
    ? r.children.map(sanitizeNode).filter((c): c is RegionNode => c !== null)
    : []
  return { name: r.name.trim(), flood: r.flood === true, children }
}

/**
 * Parse and sanitise a shared region-settings string. Accepts the tagged wrapper
 * from serializeRegionSettings or a bare RegionSettings object. Returns null for
 * non-JSON or input that does not look like region settings.
 */
export function parseSharedRegionSettings(text: string): RegionSettings | null {
  let data: unknown
  try { data = JSON.parse(text) } catch { return null }
  if (!data || typeof data !== 'object') return null
  const tagged = data as { type?: unknown; settings?: unknown }
  const raw = (tagged.type === SHARE_TYPE ? tagged.settings : data) as Record<string, unknown> | undefined
  if (!raw || typeof raw !== 'object') return null

  const looksLikeRegion = 'tree' in raw || 'home' in raw || 'default' in raw || 'dcGate' in raw
  if (!looksLikeRegion) return null

  const s = defaultRegionSettings()
  const tree = sanitizeNode(raw.tree)
  if (tree) s.tree = tree.name === '*' ? tree : { name: '*', flood: false, children: [tree] }
  if (typeof raw.home === 'string' && raw.home.trim()) s.home = raw.home.trim()
  if (typeof raw.default === 'string' && raw.default.trim()) s.default = raw.default.trim()
  const g = raw.dcGate as Record<string, unknown> | undefined
  if (g && typeof g === 'object') {
    s.dcGate = {
      enabled: g.enabled === true,
      thresh: clampInt(g.thresh, 1, 100, 70),
      hyst: clampInt(g.hyst, 0, 50, 10),
    }
  }
  return s
}
