// Canonical model + command builders/parsers for base "hardware / advanced" device
// settings the main config form doesn't cover: the packet bridge (RS232 / ESP-NOW /
// MQTT), the external-FEM gain toggles, and LR2021 side-detector spreading factors.
// Mirrors MeshCore/src/helpers/CommonCLI.cpp.
//
// Every group is capability-gated: the firmware only compiles a command in when the
// relevant feature (WITH_BRIDGE / WITH_RS232_BRIDGE / WITH_ESPNOW_BRIDGE) or board
// capability (canControlLoRaFemLna / …FemPaGain / USE_LR2021) is present. Absent
// commands answer `??: <cmd>` or `Error: unsupported`, so we read every key, detect
// which are actually supported, and only render / emit `set …` for those.

export const BRIDGE_MAX_BAUD = 115200

export interface HardwareSettings {
  // Packet bridge (RS232 / ESP-NOW / MQTT)
  bridgeType: string // read-only capability tag: 'rs232' | 'espnow' | 'none'
  bridgeSupported: boolean // WITH_BRIDGE → enabled/delay/source
  bridgeEnabled: boolean
  bridgeDelay: number // ms, 0-10000
  bridgeSource: 'rx' | 'tx' // model uses rx/tx; firmware `get` reports logRx/logTx
  rs232Supported: boolean
  bridgeBaud: number // 9600-115200
  espnowSupported: boolean
  bridgeChannel: number // 1-14
  bridgeSecret: string // secret (serial-read only)
  // External FEM gain (board-capability gated)
  femRxSupported: boolean
  femRxgain: boolean
  femTxSupported: boolean
  femTxgain: boolean
  // LR2021 side-detector spreading factors (`set` is LR2021-only)
  extraSfSupported: boolean
  extraSf: string // comma-separated SFs, '' = none
}

export function defaultHardwareSettings(): HardwareSettings {
  return {
    bridgeType: 'none', bridgeSupported: false, bridgeEnabled: false, bridgeDelay: 0,
    bridgeSource: 'tx', rs232Supported: false, bridgeBaud: BRIDGE_MAX_BAUD,
    espnowSupported: false, bridgeChannel: 1, bridgeSecret: '',
    femRxSupported: false, femRxgain: false, femTxSupported: false, femTxgain: false,
    extraSfSupported: false, extraSf: '',
  }
}

export function cloneHardwareSettings(s: HardwareSettings): HardwareSettings {
  return { ...s }
}

/** True when the connected device exposes at least one editable hardware setting,
 *  i.e. the config section is worth rendering at all. */
export function hasAnyHardware(s: HardwareSettings): boolean {
  return s.bridgeSupported || s.rs232Supported || s.espnowSupported ||
    s.femRxSupported || s.femTxSupported || s.extraSfSupported
}

export function stripReply(reply: string): string {
  return (reply ?? '').replace(/^>\s?/, '').trim()
}

// A capability-present reply is the firmware's `> <value>` form; anything else
// (`??: …`, `Error: unsupported`, `unknown config …`) means "not on this build".
function hasValue(reply: string): boolean {
  return (reply ?? '').trim().startsWith('>')
}
function isOnOff(reply: string): boolean {
  const v = stripReply(reply).toLowerCase()
  return v === 'on' || v === 'off'
}
function parseBoolOnOff(reply: string): boolean {
  return stripReply(reply).toLowerCase() === 'on'
}
function parseInt0(reply: string): number {
  const m = stripReply(reply).match(/-?\d+/)
  return m ? parseInt(m[0], 10) : 0
}

/** Every `get` key needed to populate the editable model. */
export function hardwareGetCommands(): string[] {
  return [
    'bridge.type', 'bridge.enabled', 'bridge.delay', 'bridge.source',
    'bridge.baud', 'bridge.channel', 'bridge.secret',
    'radio.fem.rxgain', 'radio.fem.txgain', 'extra.sf',
  ]
}

/** Build a HardwareSettings from a map of get-command → raw reply. */
export function assembleHardwareSettings(r: Record<string, string>): HardwareSettings {
  const s = defaultHardwareSettings()
  const g = (k: string) => r[k] ?? ''

  const bt = stripReply(g('bridge.type'))
  s.bridgeType = bt === 'rs232' || bt === 'espnow' ? bt : 'none'

  s.bridgeSupported = isOnOff(g('bridge.enabled'))
  if (s.bridgeSupported) {
    s.bridgeEnabled = parseBoolOnOff(g('bridge.enabled'))
    s.bridgeDelay = parseInt0(g('bridge.delay'))
    const src = stripReply(g('bridge.source')).toLowerCase()
    s.bridgeSource = src === 'logrx' || src === 'rx' ? 'rx' : 'tx'
  }

  s.rs232Supported = hasValue(g('bridge.baud')) && /^\d/.test(stripReply(g('bridge.baud')))
  if (s.rs232Supported) s.bridgeBaud = parseInt0(g('bridge.baud')) || s.bridgeBaud

  s.espnowSupported = hasValue(g('bridge.channel')) && /^\d/.test(stripReply(g('bridge.channel')))
  if (s.espnowSupported) {
    s.bridgeChannel = parseInt0(g('bridge.channel')) || s.bridgeChannel
    s.bridgeSecret = stripReply(g('bridge.secret'))
  }

  s.femRxSupported = isOnOff(g('radio.fem.rxgain'))
  if (s.femRxSupported) s.femRxgain = parseBoolOnOff(g('radio.fem.rxgain'))
  s.femTxSupported = isOnOff(g('radio.fem.txgain'))
  if (s.femTxSupported) s.femTxgain = parseBoolOnOff(g('radio.fem.txgain'))

  // `get extra.sf` is NOT capability-gated - it always answers with a bare (no
  // `> ` prompt) CSV or "No extra SF configured". Only a numeric CSV reliably
  // indicates an LR2021 board actually using side detectors, so gate on that to
  // avoid showing a field whose `set` (LR2021-only) would no-op elsewhere.
  const sf = (g('extra.sf') ?? '').trim()
  s.extraSfSupported = /^\d/.test(sf)
  if (s.extraSfSupported) s.extraSf = sf

  return s
}

/** Minimal ordered list of `set …` commands to turn `base` into `next`, restricted
 *  to groups the device actually supports. No hardware change forces a full reboot
 *  (the firmware restarts the bridge itself), so needsReboot is always false. */
export function buildHardwareCommands(
  next: HardwareSettings, base: HardwareSettings,
): { cmds: string[]; needsReboot: boolean } {
  const cmds: string[] = []
  const onoff = (b: boolean) => (b ? 'on' : 'off')

  if (next.bridgeSupported) {
    if (next.bridgeEnabled !== base.bridgeEnabled) cmds.push(`set bridge.enabled ${onoff(next.bridgeEnabled)}`)
    if (next.bridgeDelay !== base.bridgeDelay) cmds.push(`set bridge.delay ${next.bridgeDelay}`)
    if (next.bridgeSource !== base.bridgeSource) cmds.push(`set bridge.source ${next.bridgeSource}`)
  }
  if (next.rs232Supported && next.bridgeBaud !== base.bridgeBaud) {
    cmds.push(`set bridge.baud ${next.bridgeBaud}`)
  }
  if (next.espnowSupported) {
    if (next.bridgeChannel !== base.bridgeChannel) cmds.push(`set bridge.channel ${next.bridgeChannel}`)
    if (next.bridgeSecret !== base.bridgeSecret && next.bridgeSecret) cmds.push(`set bridge.secret ${next.bridgeSecret}`)
  }
  if (next.femRxSupported && next.femRxgain !== base.femRxgain) {
    cmds.push(`set radio.fem.rxgain ${onoff(next.femRxgain)}`)
  }
  if (next.femTxSupported && next.femTxgain !== base.femTxgain) {
    cmds.push(`set radio.fem.txgain ${onoff(next.femTxgain)}`)
  }
  if (next.extraSfSupported && next.extraSf !== base.extraSf && next.extraSf) {
    cmds.push(`set extra.sf ${next.extraSf}`)
  }
  return { cmds, needsReboot: false }
}

/** Overlay an imported (possibly old or partial) hardware object onto current
 *  defaults so missing fields don't become `undefined`. The `*Supported` flags are
 *  live device capabilities, so they always come from the connected device, never
 *  the file - the field values are only applied where the device supports them. */
export function sanitizeImportedHardware(raw: unknown, live: HardwareSettings): HardwareSettings {
  const out = cloneHardwareSettings(live) // start from live capabilities + current values
  const r = (raw ?? {}) as Partial<HardwareSettings>
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
  const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d)
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)

  if (live.bridgeSupported) {
    out.bridgeEnabled = bool(r.bridgeEnabled, out.bridgeEnabled)
    out.bridgeDelay = num(r.bridgeDelay, out.bridgeDelay)
    out.bridgeSource = r.bridgeSource === 'rx' || r.bridgeSource === 'tx' ? r.bridgeSource : out.bridgeSource
  }
  if (live.rs232Supported) out.bridgeBaud = num(r.bridgeBaud, out.bridgeBaud)
  if (live.espnowSupported) {
    out.bridgeChannel = num(r.bridgeChannel, out.bridgeChannel)
    out.bridgeSecret = str(r.bridgeSecret, out.bridgeSecret)
  }
  if (live.femRxSupported) out.femRxgain = bool(r.femRxgain, out.femRxgain)
  if (live.femTxSupported) out.femTxgain = bool(r.femTxgain, out.femTxgain)
  if (live.extraSfSupported) out.extraSf = str(r.extraSf, out.extraSf)
  return out
}
