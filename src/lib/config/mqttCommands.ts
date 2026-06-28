// Canonical model + command builders/parsers for the DMC MQTT observer settings.
// Mirrors MeshCore/src/helpers/CommonCLI.cpp (dmc-observer-dev branch).
//
// All `get` replies are `> <value>`; bools are `> on`/`> off`; ints like
// `> 30 min` / `> 5 minutes (300000 ms)`; unset strings use sentinels such as
// `(unset)`, `(not set)`, `(default: …)`. `set …` replies are `OK`/`Error: …`.

export const MQTT_SLOT_COUNT = 6

/** Built-in broker presets (mirrors the MQTT_IMPLEMENTATION.md preset table). */
export const MQTT_PRESETS: readonly string[] = [
  'analyzer-us', 'analyzer-eu', 'nz-analyzer', 'meshmapper', 'meshrank', 'waev',
  'meshomatic', 'cascadiamesh', 'tennmesh', 'nashmesh', 'ctmesh', 'chimesh',
  'meshat.se', 'eastidahomesh', 'dutchmeshcore-1', 'dutchmeshcore-2', 'coloradomesh',
  'meshcore-ca-1', 'meshcore-ca-2', 'bostonmesh', 'inwmesh',
] as const

export interface MqttSlot {
  preset: string // a preset name, 'custom', or 'none'
  server: string
  port: number
  username: string
  password: string
  token: string
  topic: string
  audience: string
}

export interface MqttSettings {
  origin: string
  iata: string
  status: boolean // write-only: firmware can't report it (see notes); default on
  packets: boolean
  raw: boolean
  tx: 'off' | 'on' | 'advert'
  rx: boolean
  interval: number
  ntp: string
  owner: string
  email: string
  slots: MqttSlot[]
  alert: boolean
  alertPsk: string
  alertHashtag: string
  alertRegion: string
  alertWifi: number
  alertMqtt: number
  alertInterval: number
  snmp: boolean
  snmpCommunity: string
}

export function defaultMqttSlot(): MqttSlot {
  return { preset: 'none', server: '', port: 0, username: '', password: '', token: '', topic: '', audience: '' }
}

export function defaultMqttSettings(): MqttSettings {
  return {
    origin: '', iata: '', status: true, packets: true, raw: false, tx: 'advert', rx: true,
    interval: 5, ntp: '', owner: '', email: '',
    slots: Array.from({ length: MQTT_SLOT_COUNT }, defaultMqttSlot),
    alert: false, alertPsk: '', alertHashtag: '', alertRegion: '',
    alertWifi: 30, alertMqtt: 240, alertInterval: 60,
    snmp: false, snmpCommunity: 'public',
  }
}

export function cloneMqttSettings(s: MqttSettings): MqttSettings {
  return { ...s, slots: s.slots.map(sl => ({ ...sl })) }
}

/** Strip the firmware's leading "> " prompt from a get reply. */
export function stripReply(reply: string): string {
  return reply.replace(/^>\s?/, '').trim()
}

/** True for the `get mqtt.config.valid` reply on observer firmware. */
export function isMqttSupportedReply(reply: string): boolean {
  const v = stripReply(reply).toLowerCase()
  return v === 'valid' || v === 'invalid'
}

// ─── Read path ──────────────────────────────────────────────────────────────

const SENTINEL = /^\((unset|not set|default:)/i

function parseStr(reply: string): string {
  const v = stripReply(reply)
  return SENTINEL.test(v) ? '' : v
}
function parseBool(reply: string): boolean {
  return stripReply(reply).toLowerCase() === 'on'
}
function parseFirstInt(reply: string): number {
  const m = stripReply(reply).match(/-?\d+/)
  return m ? parseInt(m[0], 10) : 0
}
function parseTx(reply: string): 'off' | 'on' | 'advert' {
  const v = stripReply(reply).toLowerCase()
  return v === 'advert' ? 'advert' : v === 'on' ? 'on' : 'off'
}

/** Every `get` key needed to populate the editable model (mqtt.status excluded). */
export function mqttGetCommands(): string[] {
  const cmds = [
    'mqtt.origin', 'mqtt.iata', 'mqtt.packets', 'mqtt.raw', 'mqtt.tx', 'mqtt.rx',
    'mqtt.interval', 'mqtt.ntp', 'mqtt.owner', 'mqtt.email',
    'alert', 'alert.psk', 'alert.hashtag', 'alert.region', 'alert.wifi', 'alert.mqtt', 'alert.interval',
    'snmp', 'snmp.community',
  ]
  for (let n = 1; n <= MQTT_SLOT_COUNT; n++) {
    cmds.push(
      `mqtt${n}.preset`, `mqtt${n}.server`, `mqtt${n}.port`, `mqtt${n}.username`,
      `mqtt${n}.password`, `mqtt${n}.token`, `mqtt${n}.topic`, `mqtt${n}.audience`,
    )
  }
  return cmds
}

/** Build an MqttSettings from a map of get-command -> raw reply. */
export function assembleMqttSettings(r: Record<string, string>): MqttSettings {
  const s = defaultMqttSettings()
  const g = (k: string) => r[k] ?? ''
  // mqtt.status intentionally not read (get returns a report, not the flag).
  s.origin = parseStr(g('mqtt.origin'))
  s.iata = parseStr(g('mqtt.iata'))
  s.packets = parseBool(g('mqtt.packets'))
  s.raw = parseBool(g('mqtt.raw'))
  s.tx = parseTx(g('mqtt.tx'))
  s.rx = parseBool(g('mqtt.rx'))
  s.interval = parseFirstInt(g('mqtt.interval')) || s.interval
  s.ntp = parseStr(g('mqtt.ntp'))
  s.owner = parseStr(g('mqtt.owner'))
  s.email = parseStr(g('mqtt.email'))
  s.alert = parseBool(g('alert'))
  s.alertPsk = parseStr(g('alert.psk'))
  s.alertHashtag = parseStr(g('alert.hashtag'))
  s.alertRegion = parseStr(g('alert.region'))
  s.alertWifi = parseFirstInt(g('alert.wifi'))
  s.alertMqtt = parseFirstInt(g('alert.mqtt'))
  s.alertInterval = parseFirstInt(g('alert.interval')) || s.alertInterval
  s.snmp = parseBool(g('snmp'))
  s.snmpCommunity = parseStr(g('snmp.community')) || s.snmpCommunity
  for (let i = 0; i < MQTT_SLOT_COUNT; i++) {
    const n = i + 1
    const sl = s.slots[i]
    sl.preset = parseStr(g(`mqtt${n}.preset`)) || 'none'
    sl.server = parseStr(g(`mqtt${n}.server`))
    sl.port = parseFirstInt(g(`mqtt${n}.port`))
    sl.username = parseStr(g(`mqtt${n}.username`))
    sl.password = parseStr(g(`mqtt${n}.password`))
    sl.token = parseStr(g(`mqtt${n}.token`))
    sl.topic = parseStr(g(`mqtt${n}.topic`))
    sl.audience = parseStr(g(`mqtt${n}.audience`))
  }
  return s
}

// ─── Write path ─────────────────────────────────────────────────────────────

/** Minimal ordered list of `set …` commands to turn `base` into `next`.
 *  needsReboot is true iff an SNMP field changed (firmware needs a restart). */
export function buildMqttCommands(
  next: MqttSettings, base: MqttSettings,
): { cmds: string[]; needsReboot: boolean } {
  const cmds: string[] = []
  const onoff = (b: boolean) => (b ? 'on' : 'off')

  // Bridge globals
  if (next.origin !== base.origin) cmds.push(next.origin ? `set mqtt.origin ${next.origin}` : 'set mqtt.origin')
  if (next.iata !== base.iata && next.iata) cmds.push(`set mqtt.iata ${next.iata}`)
  if (next.status !== base.status) cmds.push(`set mqtt.status ${onoff(next.status)}`)
  if (next.packets !== base.packets) cmds.push(`set mqtt.packets ${onoff(next.packets)}`)
  if (next.raw !== base.raw) cmds.push(`set mqtt.raw ${onoff(next.raw)}`)
  if (next.tx !== base.tx) cmds.push(`set mqtt.tx ${next.tx}`)
  if (next.rx !== base.rx) cmds.push(`set mqtt.rx ${onoff(next.rx)}`)
  if (next.interval !== base.interval) cmds.push(`set mqtt.interval ${next.interval}`)
  if (next.ntp !== base.ntp) cmds.push(next.ntp ? `set mqtt.ntp ${next.ntp}` : 'set mqtt.ntp none')
  if (next.owner !== base.owner && next.owner) cmds.push(`set mqtt.owner ${next.owner}`)
  if (next.email !== base.email && next.email) cmds.push(`set mqtt.email ${next.email}`)

  // Slots — preset first so the slot type is in place before custom fields
  for (let i = 0; i < MQTT_SLOT_COUNT; i++) {
    const n = i + 1, a = next.slots[i], b = base.slots[i]
    if (a.preset !== b.preset) cmds.push(`set mqtt${n}.preset ${a.preset}`)
    if (a.preset === 'custom') {
      if (a.server !== b.server && a.server) cmds.push(`set mqtt${n}.server ${a.server}`)
      if (a.port !== b.port && a.port) cmds.push(`set mqtt${n}.port ${a.port}`)
      if (a.username !== b.username && a.username) cmds.push(`set mqtt${n}.username ${a.username}`)
      if (a.password !== b.password && a.password) cmds.push(`set mqtt${n}.password ${a.password}`)
      if (a.token !== b.token && a.token) cmds.push(`set mqtt${n}.token ${a.token}`)
      if (a.topic !== b.topic && a.topic) cmds.push(`set mqtt${n}.topic ${a.topic}`)
      if (a.audience !== b.audience && a.audience) cmds.push(`set mqtt${n}.audience ${a.audience}`)
    }
  }

  // Alerts — configure sub-settings, then flip the master toggle last
  if (next.alertPsk !== base.alertPsk) cmds.push(next.alertPsk ? `set alert.psk ${next.alertPsk}` : 'set alert.psk')
  if (next.alertHashtag !== base.alertHashtag) cmds.push(next.alertHashtag ? `set alert.hashtag ${next.alertHashtag}` : 'set alert.hashtag')
  if (next.alertRegion !== base.alertRegion) cmds.push(next.alertRegion ? `set alert.region ${next.alertRegion}` : 'set alert.region')
  if (next.alertWifi !== base.alertWifi) cmds.push(`set alert.wifi ${next.alertWifi}`)
  if (next.alertMqtt !== base.alertMqtt) cmds.push(`set alert.mqtt ${next.alertMqtt}`)
  if (next.alertInterval !== base.alertInterval) cmds.push(`set alert.interval ${next.alertInterval}`)
  if (next.alert !== base.alert) cmds.push(`set alert ${onoff(next.alert)}`)

  // SNMP — reboot required
  let needsReboot = false
  if (next.snmp !== base.snmp) { cmds.push(`set snmp ${onoff(next.snmp)}`); needsReboot = true }
  if (next.snmpCommunity !== base.snmpCommunity && next.snmpCommunity) {
    cmds.push(`set snmp.community ${next.snmpCommunity}`); needsReboot = true
  }

  return { cmds, needsReboot }
}
