export interface ChannelMeta {
  channel: string
  channel_hash?: string | null
  category?: string
  subcategory?: string
  country?: string
  region?: string
  language?: string[]
  scopes?: string[]
  tags?: string[]
  notes?: string
  alias_of?: string | null
  status?: string
  source?: string
  first_seen?: string | null
  last_seen?: string | null
  added?: string | null
  verified?: boolean
  recommended?: boolean
  message_amount?: number
}

export interface Channel extends ChannelMeta {
  _key: string
  _hasMeta: boolean
  _localEdit: boolean
}

export type SortField = 'alpha' | 'category' | 'subcategory' | 'country' | 'region' | 'scope' | 'first_seen' | 'last_seen' | 'message_amount'
export type SortDir = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list'
export type ToastType = 'ok' | 'err'

export interface ToastMsg {
  id: number
  msg: string
  type: ToastType
}

export interface FilterState {
  search: string
  category: string
  subcategory: string
  region: string
  scope: string
  country: string
  onlyScoped: boolean
  onlyBare: boolean
  minMessages: number
}

// ── Flasher ──────────────────────────────────────────────────────────────────

export interface FirmwareFile {
  type: string   // e.g. "flash-wipe" | "flash-update" | "uf2"
  name: string   // filename or absolute URL
  title: string  // display label
  file?: File     // local custom firmware selected from the browser
}

export interface FirmwareVersion {
  files: FirmwareFile[]
  notes?: string
}

export interface DeviceFirmware {
  role: string                              // e.g. "gui" | "repeater" | "roomServer"
  version: Record<string, FirmwareVersion>
  notice?: string
  icon?: string
  title?: string
  subTitle?: string
  tooltip?: string
  class?: string
  customFile?: boolean
  github?: {
    type: string
    files: Record<string, string>
  }
}

export interface FlasherDevice {
  maker: string
  class: 'ripple' | 'meshos' | 'community'
  name: string
  type: 'esp32' | 'nrf52' | 'noflash'
  tooltip?: string
  icon?: string
  erase?: string
  bootloader?: string
  firmware: DeviceFirmware[]
}

export interface FlasherRoleDef {
  icon: string
  title: string
  subTitle?: string
  tooltip?: string
  class?: string
}

export interface FlasherConfig {
  staticPath: string
  role: Record<string, FlasherRoleDef>
  notice: Record<string, string>
  maker: Record<string, { name: string }>
  device: FlasherDevice[]
}

export type FlasherStep =
  | 'idle'
  | 'device_selected'
  | 'role_selected'
  | 'ready'
  | 'flashing'
  | 'done'
  | 'error'

export type DeviceClass = 'ripple' | 'meshos' | 'community'
export type DeviceGroups = Partial<Record<DeviceClass, FlasherDevice[]>>

// ── USB Config ────────────────────────────────────────────────────────────────

export interface RadioSettings {
  freq: string
  bw: string
  sf: string
  cr: string
}

export interface DeviceVars {
  name: string
  repeat: boolean
  'allow.read.only': boolean
  radio: RadioSettings
  tx: number
  af: number
  rxdelay: number
  txdelay: number
  'direct.txdelay': number
  'flood.max': number
  'flood.advert.interval': number
  'advert.interval': number
  'guest.password': string
  lat: number | string
  lon: number | string
  'int.thresh': number
  'agc.reset.interval': number
  'multi.acks': string
  'owner.info': string
  'path.hash.mode': string
  'loop.detect': string
}

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
}

export interface RadioPreset {
  title: string
  frequency?: number
  spreading_factor?: number
  bandwidth?: number
  coding_rate?: number
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected'

export const VAR_MIN_VERSION: Record<string, [number, number, number]> = {
  'owner.info':      [1, 12, 0],
  'path.hash.mode':  [1, 14, 0],
  'loop.detect':     [1, 14, 0],
}

export const DEFAULT_DEVICE_VARS: DeviceVars = {
  name: '', repeat: false, 'allow.read.only': false,
  radio: { freq: '0', bw: '0', sf: '0', cr: '0' },
  tx: 0, af: 0, rxdelay: 0, txdelay: 0, 'direct.txdelay': 0,
  'flood.max': 0, 'flood.advert.interval': 0, 'advert.interval': 0,
  'guest.password': '', lat: 0, lon: 0, 'int.thresh': 0,
  'agc.reset.interval': 0, 'multi.acks': '0', 'owner.info': '',
  'path.hash.mode': '0', 'loop.detect': 'off',
}
