// src/lib/cli/firmwareRegistry.ts
// Typed CLI command catalog for the toolbox CLI Wiki.
// Ported and updated from meshcore.js/public/ui/firmware-registry.js.
// Pure data + pure functions – no DOM, unit-testable in isolation.

import type { StringKey } from '../../i18n'
import { CLI_DESC_NL } from './descriptions.nl'
import { CLI_DESC_DE } from './descriptions.de'

export type DeviceTypeKey = 'companion' | 'repeater' | 'roomserver' | 'sensor'

export type CategoryKey =
  | 'system' | 'radio' | 'networking' | 'timing' | 'security' | 'wifi'
  | 'mqtt' | 'timezone' | 'snmp' | 'ota' | 'region' | 'stats' | 'logging'
  | 'neighbors' | 'bridge' | 'gps' | 'sensor' | 'power' | 'alert' | 'filter'

export interface DeviceType {
  id: number
  name: string
  nameKey: StringKey
  icon: string
  descKey: StringKey
}

export interface CliCommand {
  cmd: string
  category: CategoryKey
  deviceTypes: 'all' | DeviceTypeKey[]
  desc: string
  placeholder?: string
  sinceVersion?: string
  note?: 'build-dependent' | 'serial-only' | 'command-contact'
  // Key into the NL/DE description maps when the same token means something else
  // on another firmware (e.g. the companion receive filter). Defaults to `cmd`.
  descKey?: string
}

export interface FirmwareDoc {
  labelKey: StringKey
  href: string
}

export interface FirmwareVariant {
  id: string
  name: string
  shortDescKey: StringKey
  fullDescKey: StringKey
  source: string
  /** Reference pages for the variant's own features (OID tables, filter, OTA). */
  docs?: FirmwareDoc[]
  deviceTypes: DeviceTypeKey[]
  commands: CliCommand[]
}

export const FW_DEVICE_TYPES: Record<DeviceTypeKey, DeviceType> = {
  companion:  { id: 1, name: 'Companion',   nameKey: 'wiki_dt_companion',  icon: '📱', descKey: 'wiki_dt_companion_desc' },
  repeater:   { id: 2, name: 'Repeater',    nameKey: 'wiki_dt_repeater',   icon: '📡', descKey: 'wiki_dt_repeater_desc' },
  roomserver: { id: 3, name: 'Room Server', nameKey: 'wiki_dt_roomserver', icon: '🏠', descKey: 'wiki_dt_roomserver_desc' },
  sensor:     { id: 4, name: 'Sensor',      nameKey: 'wiki_dt_sensor',     icon: '📊', descKey: 'wiki_dt_sensor_desc' },
}

export const FW_CATEGORIES: Record<CategoryKey, string> = {
  system: 'System', radio: 'Radio', networking: 'Networking', timing: 'Timing',
  security: 'Security', wifi: 'WiFi', mqtt: 'On-device MQTT', timezone: 'Timezone',
  snmp: 'SNMP', ota: 'OTA Update', region: 'Region', stats: 'Statistics',
  logging: 'Logging', neighbors: 'Neighbors', bridge: 'Bridge', gps: 'GPS',
  sensor: 'Sensor', power: 'Power', alert: 'Alerts', filter: 'Packet Filter',
}

// i18n keys for the translated category headings shown in the CLI Wiki.
export const FW_CATEGORY_LABEL_KEYS: Record<CategoryKey, StringKey> = {
  system: 'wiki_cat_system', radio: 'wiki_cat_radio', networking: 'wiki_cat_networking',
  timing: 'wiki_cat_timing', security: 'wiki_cat_security', wifi: 'wiki_cat_wifi',
  mqtt: 'wiki_cat_mqtt', timezone: 'wiki_cat_timezone', snmp: 'wiki_cat_snmp',
  ota: 'wiki_cat_ota', region: 'wiki_cat_region', stats: 'wiki_cat_stats',
  logging: 'wiki_cat_logging', neighbors: 'wiki_cat_neighbors', bridge: 'wiki_cat_bridge',
  gps: 'wiki_cat_gps', sensor: 'wiki_cat_sensor', power: 'wiki_cat_power',
  alert: 'wiki_cat_alert', filter: 'wiki_cat_filter',
}

// i18n keys for the small note tags shown on individual commands.
export const FW_NOTE_LABEL_KEYS: Record<NonNullable<CliCommand['note']>, StringKey> = {
  'build-dependent': 'wiki_note_build',
  'serial-only': 'wiki_note_serial',
  'command-contact': 'wiki_note_cmdcontact',
}

// The roles that run the shared server CLI (CommonCLI). Since v1.18 the companion has a
// smaller CLI of its own (examples/companion_radio/MyMesh.cpp handleCommand): the radio
// settings (CommonRadioPrefs), board commands, name, PIN, timezone and WiFi. Commands
// that only CommonCLI handles are therefore limited to these roles.
const SERVER_ROLES: DeviceTypeKey[] = ['repeater', 'roomserver', 'sensor']

// Baseline MeshCore command catalog, ported from meshcore.js/public/ui/firmware-registry.js
export const MESHCORE_COMMANDS: CliCommand[] = [

  // System
  { cmd: 'ver',             category: 'system',  deviceTypes: 'all',                      desc: 'Show firmware version string.' },
  { cmd: 'board',           category: 'system',  deviceTypes: 'all',                      desc: 'Show board/hardware info.' },
  { cmd: 'reboot',          category: 'system',  deviceTypes: 'all',                      desc: 'Reboot the device.' },
  { cmd: 'clkreboot',       category: 'system',  deviceTypes: SERVER_ROLES,               desc: 'Clock-sync then reboot.' },
  { cmd: 'poweroff',        category: 'system',  deviceTypes: 'all',                      desc: 'Power off the device (nRF52 only).' },
  { cmd: 'clock',           category: 'system',  deviceTypes: SERVER_ROLES,               desc: 'Show current device clock.' },
  { cmd: 'clock sync',      category: 'system',  deviceTypes: SERVER_ROLES,               desc: 'Sync device clock.' },
  { cmd: 'time ',           category: 'system',  deviceTypes: SERVER_ROLES, placeholder: 'time ', desc: 'Set epoch time. Example: time 1700000000' },
  { cmd: 'get name',        category: 'system',  deviceTypes: 'all',                      desc: 'Show device name/advert.' },
  { cmd: 'get lat',         category: 'system',  deviceTypes: SERVER_ROLES,               desc: 'Show configured latitude.' },
  { cmd: 'get lon',         category: 'system',  deviceTypes: SERVER_ROLES,               desc: 'Show configured longitude.' },
  { cmd: 'get prv.key',     category: 'system',  deviceTypes: SERVER_ROLES,               desc: 'Show private key.' },
  { cmd: 'get public.key',  category: 'system',  deviceTypes: SERVER_ROLES,               desc: 'Show public key.' },
  { cmd: 'get role',        category: 'system',  deviceTypes: SERVER_ROLES,               desc: 'Show device role.' },
  { cmd: 'erase',           category: 'system',  deviceTypes: SERVER_ROLES, desc: 'Erase stored config (serial only).', note: 'serial-only' },

  // Radio
  { cmd: 'get radio',              category: 'radio', deviceTypes: 'all',                    desc: 'Show current radio parameters.' },
  { cmd: 'get freq',               category: 'radio', deviceTypes: 'all',                    desc: 'Show radio frequency.' },
  { cmd: 'get tx',                 category: 'radio', deviceTypes: 'all',                    desc: 'Show TX power level.' },
  { cmd: 'get radio.rxgain',       category: 'radio', deviceTypes: 'all',                    desc: 'Show RX gain setting.' },
  { cmd: 'set radio.rxgain on',    category: 'radio', deviceTypes: 'all',                    desc: 'Enable RX gain boost.' },
  { cmd: 'set radio.rxgain off',   category: 'radio', deviceTypes: 'all',                    desc: 'Disable RX gain boost.' },
  { cmd: 'get dutycycle',          category: 'radio', deviceTypes: 'all',                    desc: 'Show current duty-cycle limit (%).' },
  { cmd: 'set dutycycle ',         category: 'radio', deviceTypes: 'all', placeholder: 'set dutycycle ', desc: 'Set duty-cycle limit. Range: 1-100.' },
  { cmd: 'get af',                 category: 'radio', deviceTypes: 'all',                    desc: 'Show airtime factor (duty-cycle budget).' },
  { cmd: 'set af ',                category: 'radio', deviceTypes: 'all', placeholder: 'set af ',        desc: 'Set airtime factor directly (duty-cycle budget), 0-9.' },
  // v1.17 duty-cycle region gating (off by default; thresh 35 % true TX duty, hyst 10 %)
  { cmd: 'get dc.gate',            category: 'radio', deviceTypes: ['repeater','roomserver'],                    desc: 'Show duty-cycle region-gating state.', sinceVersion: 'v1.17' },
  { cmd: 'set dc.gate ',           category: 'radio', deviceTypes: ['repeater','roomserver'], placeholder: 'set dc.gate ',        desc: 'Enable or disable duty-cycle region gating: on|off (1/0 also accepted).', sinceVersion: 'v1.17' },
  { cmd: 'get dc.gate.thresh',     category: 'radio', deviceTypes: ['repeater','roomserver'],                    desc: 'Show the true TX duty cycle (%) above which gating activates.', sinceVersion: 'v1.17' },
  { cmd: 'set dc.gate.thresh ',    category: 'radio', deviceTypes: ['repeater','roomserver'], placeholder: 'set dc.gate.thresh ', desc: 'Set gating threshold as true TX duty cycle: % of wall-clock time spent transmitting over the last 60 s (1-100). Default 35.', sinceVersion: 'v1.17' },
  { cmd: 'get dc.gate.hyst',       category: 'radio', deviceTypes: ['repeater','roomserver'],                    desc: 'Show gating hysteresis margin.', sinceVersion: 'v1.17' },
  { cmd: 'set dc.gate.hyst ',      category: 'radio', deviceTypes: ['repeater','roomserver'], placeholder: 'set dc.gate.hyst ',   desc: 'Set gating hysteresis in percentage points (0-50). Regions reopen below thresh minus hyst. Default 10.', sinceVersion: 'v1.17' },
  { cmd: 'get dc.gate.status',     category: 'radio', deviceTypes: ['repeater','roomserver'],                    desc: 'Show the live true TX duty cycle (%) and the current gate level (level/max).', sinceVersion: 'v1.17' },
  { cmd: 'get int.thresh',         category: 'radio', deviceTypes: 'all',                    desc: 'Show interference threshold.' },
  { cmd: 'set int.thresh ',        category: 'radio', deviceTypes: 'all', placeholder: 'set int.thresh ', desc: 'Set interference threshold.' },
  { cmd: 'get agc.reset.interval', category: 'radio', deviceTypes: 'all',                    desc: 'Show AGC reset interval.' },
  { cmd: 'set agc.reset.interval ', category: 'radio', deviceTypes: 'all', placeholder: 'set agc.reset.interval ', desc: 'Set AGC reset interval in seconds (0-1020, rounded to a multiple of 4).' },
  { cmd: 'get cad',                category: 'radio', deviceTypes: 'all',                    desc: 'Show whether channel activity detection (listen before talk) is on.', sinceVersion: 'v1.17' },
  { cmd: 'set cad ',               category: 'radio', deviceTypes: 'all', placeholder: 'set cad ', desc: 'Turn channel activity detection on or off: on|off. With CAD on the radio waits while another transmission is in progress.', sinceVersion: 'v1.17' },
  { cmd: 'tempradio ',             category: 'radio', deviceTypes: SERVER_ROLES, placeholder: 'tempradio ', desc: 'Temporarily change radio params. Example: tempradio 868100,125000,7,5,10 (freq,bw,sf,cr,timeout_mins)' },

  // Timing
  { cmd: 'get advert.interval',       category: 'timing', deviceTypes: SERVER_ROLES,             desc: 'Show advert broadcast interval.' },
  { cmd: 'set advert.interval ',      category: 'timing', deviceTypes: SERVER_ROLES, placeholder: 'set advert.interval ', desc: 'Set advert interval in minutes (60-240), or 0 to disable.' },
  { cmd: 'get flood.advert.interval', category: 'timing', deviceTypes: SERVER_ROLES,             desc: 'Show flood-advert interval.' },
  { cmd: 'set flood.advert.interval ', category: 'timing', deviceTypes: SERVER_ROLES, placeholder: 'set flood.advert.interval ', desc: 'Set flood-advert interval in hours (3-168), or 0 to disable. Default 47 (v1.16+).', sinceVersion: 'v1.16' },
  { cmd: 'get path.hash.mode',        category: 'timing', deviceTypes: 'all',                    desc: 'Show path hash mode.' },
  { cmd: 'set path.hash.mode ',       category: 'timing', deviceTypes: 'all', placeholder: 'set path.hash.mode ', desc: 'Set path hash mode.' },
  { cmd: 'get rxdelay',               category: 'timing', deviceTypes: 'all',                    desc: 'Show RX delay.' },
  { cmd: 'set rxdelay ',              category: 'timing', deviceTypes: 'all', placeholder: 'set rxdelay ', desc: 'Set RX delay.' },
  { cmd: 'get txdelay',               category: 'timing', deviceTypes: 'all',                    desc: 'Show TX delay.' },
  { cmd: 'set txdelay ',              category: 'timing', deviceTypes: 'all', placeholder: 'set txdelay ', desc: 'Set TX delay.' },
  { cmd: 'get direct.txdelay',        category: 'timing', deviceTypes: 'all',                    desc: 'Show direct TX delay.' },
  { cmd: 'set direct.txdelay ',       category: 'timing', deviceTypes: 'all', placeholder: 'set direct.txdelay ', desc: 'Set direct TX delay.' },

  // Networking
  { cmd: 'get repeat',            category: 'networking', deviceTypes: SERVER_ROLES,             desc: 'Show repeat (relay) mode.' },
  { cmd: 'set repeat on',         category: 'networking', deviceTypes: SERVER_ROLES,             desc: 'Enable packet repeating. Room servers on v1.18+ refuse it (ERR - repeat now deprecated).' },
  { cmd: 'set repeat off',        category: 'networking', deviceTypes: SERVER_ROLES,             desc: 'Disable packet repeating.' },
  { cmd: 'get flood.max',         category: 'networking', deviceTypes: SERVER_ROLES,             desc: 'Show maximum flood hops.' },
  { cmd: 'set flood.max ',        category: 'networking', deviceTypes: SERVER_ROLES, placeholder: 'set flood.max ', desc: 'Set maximum flood hops.' },
  { cmd: 'get flood.max.unscoped', category: 'networking', deviceTypes: SERVER_ROLES,            desc: 'Show cap on unscoped flood traffic (v1.16+). Default 64.', sinceVersion: 'v1.16' },
  { cmd: 'set flood.max.unscoped ', category: 'networking', deviceTypes: SERVER_ROLES, placeholder: 'set flood.max.unscoped ', desc: 'Cap unscoped flood traffic (v1.16+). Default 64.', sinceVersion: 'v1.16' },
  { cmd: 'get flood.max.advert',  category: 'networking', deviceTypes: SERVER_ROLES,             desc: 'Show cap on flooded advert packets (v1.16+). Default 8.', sinceVersion: 'v1.16' },
  { cmd: 'set flood.max.advert ', category: 'networking', deviceTypes: SERVER_ROLES, placeholder: 'set flood.max.advert ', desc: 'Cap flooded advert packets (v1.16+). Default 8.', sinceVersion: 'v1.16' },
  { cmd: 'get allow.read.only',   category: 'networking', deviceTypes: SERVER_ROLES,             desc: 'Show read-only access setting.' },
  { cmd: 'set allow.read.only on',  category: 'networking', deviceTypes: SERVER_ROLES,           desc: 'Allow read-only access.' },
  { cmd: 'set allow.read.only off', category: 'networking', deviceTypes: SERVER_ROLES,           desc: 'Disallow read-only access.' },
  { cmd: 'get loop.detect',       category: 'networking', deviceTypes: SERVER_ROLES,             desc: 'Show loop detection mode.' },
  { cmd: 'set loop.detect ',      category: 'networking', deviceTypes: SERVER_ROLES, placeholder: 'set loop.detect ', desc: 'Set loop detection. Values: off/minimal/moderate/strict. New repeater installs default to minimal (v1.18).' },
  { cmd: 'get multi.acks',        category: 'networking', deviceTypes: 'all',                    desc: 'Show multi-ack setting.' },
  { cmd: 'set multi.acks ',       category: 'networking', deviceTypes: 'all', placeholder: 'set multi.acks ', desc: 'Set multi-ack value.' },

  // Neighbors
  { cmd: 'neighbors',          category: 'neighbors', deviceTypes: SERVER_ROLES,            desc: 'List known neighbors.' },
  { cmd: 'neighbor.remove ',   category: 'neighbors', deviceTypes: SERVER_ROLES, placeholder: 'neighbor.remove ', desc: 'Remove neighbor by pubkey.' },
  { cmd: 'discover.neighbors', category: 'neighbors', deviceTypes: ['repeater'],                                  desc: 'Trigger neighbor discovery (repeater only).' },

  // Security
  { cmd: 'get guest.password',  category: 'security', deviceTypes: SERVER_ROLES,                                   desc: 'Show guest password.' },
  { cmd: 'set guest.password ', category: 'security', deviceTypes: SERVER_ROLES, placeholder: 'set guest.password ',      desc: 'Set guest password.' },
  { cmd: 'get owner.info',      category: 'security', deviceTypes: SERVER_ROLES,                                   desc: 'Show owner info string.' },
  { cmd: 'set owner.info ',     category: 'security', deviceTypes: SERVER_ROLES, placeholder: 'set owner.info ',          desc: 'Set owner info string.' },
  { cmd: 'password ',           category: 'security', deviceTypes: SERVER_ROLES, placeholder: 'password ', desc: 'Change admin password.' },
  { cmd: 'setperm ',            category: 'security', deviceTypes: SERVER_ROLES, placeholder: 'setperm ', desc: 'Set ACL permissions for a node. Example: setperm <pubkey> <0-3>' },
  { cmd: 'get acl',             category: 'security', deviceTypes: SERVER_ROLES,                       desc: 'Show access control list (local serial only).', note: 'serial-only' },

  // Statistics
  { cmd: 'stats-core',    category: 'stats', deviceTypes: SERVER_ROLES, desc: 'Show battery, uptime, queue.' },
  { cmd: 'stats-radio',   category: 'stats', deviceTypes: SERVER_ROLES, desc: 'Show noise floor, RSSI/SNR, airtime, errors.' },
  { cmd: 'stats-packets', category: 'stats', deviceTypes: SERVER_ROLES, desc: 'Show packet RX/TX counters.' },
  { cmd: 'clear stats',   category: 'stats', deviceTypes: SERVER_ROLES, desc: 'Clear statistics counters.' },

  // Logging
  { cmd: 'log',       category: 'logging', deviceTypes: SERVER_ROLES, desc: 'Dump log.' },
  { cmd: 'log start', category: 'logging', deviceTypes: SERVER_ROLES, desc: 'Start log capture.' },
  { cmd: 'log stop',  category: 'logging', deviceTypes: SERVER_ROLES, desc: 'Stop log capture.' },
  { cmd: 'log erase', category: 'logging', deviceTypes: SERVER_ROLES, desc: 'Erase stored log.' },

  // Companion CLI (v1.18): reached from the app's command console (CMD_RUN_CLI_COMMAND),
  // USB serial, or as remote CLI from a contact allowed to use it.
  { cmd: 'set pin ',       category: 'security', deviceTypes: ['companion'], placeholder: 'set pin ', desc: 'Set the BLE pairing PIN (6 digits). Replies with the new PIN.', sinceVersion: 'v1.18' },
  { cmd: 'get tz.offset',  category: 'timezone', deviceTypes: ['companion'],                          desc: 'Show the UTC offset in hours.', sinceVersion: 'v1.18' },
  { cmd: 'set tz.offset ', category: 'timezone', deviceTypes: ['companion'], placeholder: 'set tz.offset ', desc: 'Set the UTC offset in whole hours (-12 to +14).', sinceVersion: 'v1.18' },

  // WiFi: the server roles have no runtime WiFi CLI in official MeshCore (build-time
  // `#ifdef WIFI_SSID` only; the DMC observer set below adds one). Since v1.18 WiFi companion
  // builds (ENABLE_WIFI_INTERFACE) accept these; changes apply after a reboot.
  { cmd: 'set wifi.ssid ',    category: 'wifi', deviceTypes: ['companion'], placeholder: 'set wifi.ssid ',    desc: 'Set WiFi SSID (reboot to reconnect).', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'set wifi.pwd ',     category: 'wifi', deviceTypes: ['companion'], placeholder: 'set wifi.pwd ',     desc: 'Set WiFi password (reboot to reconnect).', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'get wifi.ssid',     category: 'wifi', deviceTypes: ['companion'], desc: 'Show WiFi SSID.', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'get wifi.pwd',      category: 'wifi', deviceTypes: ['companion'], desc: 'Show WiFi password.', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'set wifi.clear',    category: 'wifi', deviceTypes: ['companion'], desc: 'Forget the WiFi SSID and password (reboot to apply).', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'get wifi.enabled',  category: 'wifi', deviceTypes: ['companion'], desc: 'Show whether WiFi is enabled (1/0).', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'set wifi.enabled ', category: 'wifi', deviceTypes: ['companion'], placeholder: 'set wifi.enabled ', desc: 'Enable or disable WiFi: 1|0 (reboot to apply).', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'get wifi.status',   category: 'wifi', deviceTypes: ['companion'], desc: 'Show whether WiFi is connected.', sinceVersion: 'v1.18', note: 'build-dependent', descKey: 'companion:get wifi.status' },
  { cmd: 'get wifi.ip',       category: 'wifi', deviceTypes: ['companion'], desc: 'Show the WiFi IP address, or (not connected).', sinceVersion: 'v1.18', note: 'build-dependent' },

  // OTA
  { cmd: 'start ota', category: 'ota', deviceTypes: SERVER_ROLES, desc: 'Start OTA firmware update mode.' },
  { cmd: 'start ota ap', category: 'ota', deviceTypes: SERVER_ROLES, desc: 'Start OTA update mode on the MeshCore-OTA hotspot, even when joined to a WiFi network (for networks with client isolation).' },

  // Region
  { cmd: 'region',           category: 'region', deviceTypes: SERVER_ROLES,                desc: 'Show region hierarchy.' },
  { cmd: 'region save',      category: 'region', deviceTypes: SERVER_ROLES,                desc: 'Save region configuration.' },
  { cmd: 'region home ',     category: 'region', deviceTypes: SERVER_ROLES, placeholder: 'region home ',    desc: 'Set home region.' },
  { cmd: 'region default ',  category: 'region', deviceTypes: SERVER_ROLES, placeholder: 'region default ', desc: 'Set default region.' },
  { cmd: 'region def ',      category: 'region', deviceTypes: SERVER_ROLES, placeholder: 'region def ', desc: 'Define a region with shorthand nesting notation (v1.16+).', sinceVersion: 'v1.16' },
  { cmd: 'region put ',      category: 'region', deviceTypes: SERVER_ROLES, placeholder: 'region put ', desc: 'Register a region code. Example: region put NL-ZH *' },
  { cmd: 'region get ',      category: 'region', deviceTypes: SERVER_ROLES, placeholder: 'region get ',    desc: 'Get a region entry.' },
  { cmd: 'region remove ',   category: 'region', deviceTypes: SERVER_ROLES, placeholder: 'region remove ', desc: 'Remove a region entry.' },
  { cmd: 'region allowf ',   category: 'region', deviceTypes: SERVER_ROLES, placeholder: 'region allowf ', desc: 'Allow-list a region filter.' },
  { cmd: 'region denyf ',    category: 'region', deviceTypes: SERVER_ROLES, placeholder: 'region denyf ',  desc: 'Deny-list a region filter.' },
  { cmd: 'region list',      category: 'region', deviceTypes: SERVER_ROLES,                desc: 'List regions.' },
  { cmd: 'region list allowed', category: 'region', deviceTypes: SERVER_ROLES,            desc: 'List regions permitting flood.', sinceVersion: 'v1.17' },
  { cmd: 'region list denied',  category: 'region', deviceTypes: SERVER_ROLES,            desc: 'List regions blocking flood.', sinceVersion: 'v1.17' },
  { cmd: 'region load',      category: 'region', deviceTypes: SERVER_ROLES,                desc: 'Start a multi-line region import: send the region lines next, then a blank line to finish.' },

  // Setters paired with existing getters (official v1.16 CommonCLI)
  { cmd: 'set name ',     category: 'system', deviceTypes: 'all', placeholder: 'set name ',     desc: 'Set device name/advert.' },
  { cmd: 'set lat ',      category: 'system', deviceTypes: SERVER_ROLES, placeholder: 'set lat ',      desc: 'Set latitude.' },
  { cmd: 'set lon ',      category: 'system', deviceTypes: SERVER_ROLES, placeholder: 'set lon ',      desc: 'Set longitude.' },
  { cmd: 'set prv.key ',  category: 'system', deviceTypes: SERVER_ROLES, placeholder: 'set prv.key ', desc: 'Set private key.' },
  { cmd: 'set freq ',     category: 'radio',  deviceTypes: SERVER_ROLES, placeholder: 'set freq ',     desc: 'Set radio frequency (serial only).', note: 'serial-only' },
  { cmd: 'set radio ',    category: 'radio',  deviceTypes: 'all', placeholder: 'set radio ',    desc: 'Set full radio params: freq,bw,sf,cr.' },
  { cmd: 'set tx ',       category: 'radio',  deviceTypes: 'all', placeholder: 'set tx ',       desc: 'Set TX power (dBm).' },

  // Advert triggers / power (official CommonCLI)
  { cmd: 'advert',          category: 'timing', deviceTypes: SERVER_ROLES,               desc: 'Send a flood advert now.' },
  { cmd: 'advert.zerohop',  category: 'timing', deviceTypes: SERVER_ROLES,               desc: 'Send a zero-hop advert now.' },
  { cmd: 'shutdown',        category: 'system', deviceTypes: 'all',                      desc: 'Power off the device.' },
  { cmd: 'powersaving on',  category: 'system', deviceTypes: SERVER_ROLES,               desc: 'Enable power saving (build-dependent).', note: 'build-dependent' },
  { cmd: 'powersaving off', category: 'system', deviceTypes: SERVER_ROLES,               desc: 'Disable power saving (build-dependent).', note: 'build-dependent' },

  // ADC / power management / bootloader (official; build-dependent – only on builds that compile them in)
  { cmd: 'get adc.multiplier',     category: 'radio',  deviceTypes: SERVER_ROLES,               desc: 'Show ADC multiplier (build-dependent).', note: 'build-dependent' },
  { cmd: 'set adc.multiplier ',    category: 'radio',  deviceTypes: SERVER_ROLES, placeholder: 'set adc.multiplier ', desc: 'Set ADC multiplier (build-dependent).', note: 'build-dependent' },
  { cmd: 'get bootloader.ver',     category: 'system', deviceTypes: SERVER_ROLES,               desc: 'Show bootloader version (nRF52 builds).' },
  { cmd: 'power',                  category: 'power',  deviceTypes: SERVER_ROLES, desc: 'Show battery mV and USB / solar / external power and charger state.', sinceVersion: 'v1.18' },
  { cmd: 'get pwrmgt.support',     category: 'power',  deviceTypes: SERVER_ROLES,               desc: 'Show power-management support (nRF52 builds).' },
  { cmd: 'get pwrmgt.source',      category: 'power',  deviceTypes: SERVER_ROLES,               desc: 'Show power source (nRF52 builds).' },
  { cmd: 'get pwrmgt.bootreason',  category: 'power',  deviceTypes: SERVER_ROLES,               desc: 'Show boot reason (nRF52 builds).' },
  { cmd: 'get pwrmgt.bootmv',      category: 'power',  deviceTypes: SERVER_ROLES,               desc: 'Show boot voltage mV (nRF52 builds).' },

  // GPS (official; only when the ENV_INCLUDE_GPS build flag is set)
  { cmd: 'gps on',     category: 'gps', deviceTypes: SERVER_ROLES, desc: 'Enable GPS (build-dependent).', note: 'build-dependent' },
  { cmd: 'gps off',    category: 'gps', deviceTypes: SERVER_ROLES, desc: 'Disable GPS (build-dependent).', note: 'build-dependent' },
  { cmd: 'gps sync',   category: 'gps', deviceTypes: SERVER_ROLES, desc: 'Sync time from GPS (build-dependent).', note: 'build-dependent' },
  { cmd: 'gps setloc', category: 'gps', deviceTypes: SERVER_ROLES, desc: 'Set location from GPS (build-dependent).', note: 'build-dependent' },
  { cmd: 'gps advert', category: 'gps', deviceTypes: SERVER_ROLES, desc: 'Advertise GPS location (build-dependent).', note: 'build-dependent' },
  { cmd: 'gps diag',   category: 'gps', deviceTypes: SERVER_ROLES, desc: 'Show GPS provider diagnostics (build-dependent).', sinceVersion: 'v1.18', note: 'build-dependent' },

  // Board commands. Since v1.18 each board handles its own (MainBoard::handleCommand), so
  // they work on every role of a board that has the hardware.
  // External-FEM gain: RX on Heltec T096, Tracker V2, V4, V4 R8, Station G3 and Wio Tracker
  // L1 1W; TX only on Station G3 and Wio Tracker L1 1W.
  { cmd: 'get radio.fem.rxgain',    category: 'radio', deviceTypes: 'all',                                  desc: 'Show external-FEM RX LNA gain state (Heltec T096, Tracker V2, V4, V4 R8, Station G3, Wio Tracker L1 1W).', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set radio.fem.rxgain on', category: 'radio', deviceTypes: 'all',                                  desc: 'Enable external-FEM RX LNA gain.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set radio.fem.rxgain off',category: 'radio', deviceTypes: 'all',                                  desc: 'Disable external-FEM RX LNA gain.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'get radio.fem.txgain',    category: 'radio', deviceTypes: 'all',                                  desc: 'Show external-FEM TX PA gain state (Station G3, Wio Tracker L1 1W).', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set radio.fem.txgain on', category: 'radio', deviceTypes: 'all',                                  desc: 'Enable external-FEM TX PA gain.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set radio.fem.txgain off',category: 'radio', deviceTypes: 'all',                                  desc: 'Disable external-FEM TX PA gain.', sinceVersion: 'v1.17', note: 'build-dependent' },

  // Fan control (T-Beam 1W, the only board with a software-controlled fan)
  { cmd: 'get fan', category: 'power', deviceTypes: 'all', desc: 'Show fan mode, measured temperature, fan state and cooldown, e.g. auto 52.4C fan=on cd=18s.', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'set fan ', category: 'power', deviceTypes: 'all', placeholder: 'set fan ', desc: 'Set fan mode: on | off | auto (default).', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'set fan.lo ', category: 'power', deviceTypes: 'all', placeholder: 'set fan.lo ', desc: 'In auto, stop the fan below this temperature (°C, 0-100, below fan.hi). Default 45.', sinceVersion: 'v1.18', note: 'build-dependent' },
  { cmd: 'set fan.hi ', category: 'power', deviceTypes: 'all', placeholder: 'set fan.hi ', desc: 'In auto, start the fan above this temperature (°C, up to 120, above fan.lo). Default 60.', sinceVersion: 'v1.18', note: 'build-dependent' },

  // Bridge (official; only when a WITH_*_BRIDGE build flag is set)
  { cmd: 'get bridge.type',     category: 'bridge', deviceTypes: SERVER_ROLES,               desc: 'Show bridge type (build-dependent).', note: 'build-dependent' },
  { cmd: 'get bridge.enabled',  category: 'bridge', deviceTypes: SERVER_ROLES,               desc: 'Show bridge enabled (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.enabled ', category: 'bridge', deviceTypes: SERVER_ROLES, placeholder: 'set bridge.enabled ', desc: 'Enable/disable bridge (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.delay ',   category: 'bridge', deviceTypes: SERVER_ROLES, placeholder: 'set bridge.delay ',   desc: 'Set bridge delay (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.source ',  category: 'bridge', deviceTypes: SERVER_ROLES, placeholder: 'set bridge.source ',  desc: 'Set bridge source (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.baud ',    category: 'bridge', deviceTypes: SERVER_ROLES, placeholder: 'set bridge.baud ',    desc: 'Set RS232 bridge baud (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.channel ', category: 'bridge', deviceTypes: SERVER_ROLES, placeholder: 'set bridge.channel ', desc: 'Set ESP-NOW bridge channel (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.secret ',  category: 'bridge', deviceTypes: SERVER_ROLES, placeholder: 'set bridge.secret ',  desc: 'Set ESP-NOW bridge secret (build-dependent).', note: 'build-dependent' },

  // Sensor / GPIO (official; sensor builds)
  { cmd: 'sensor list',  category: 'sensor', deviceTypes: ['sensor'],                       desc: 'List sensor variables.' },
  { cmd: 'sensor get ',  category: 'sensor', deviceTypes: ['sensor'], placeholder: 'sensor get ', desc: 'Get a sensor variable.' },
  { cmd: 'sensor set ',  category: 'sensor', deviceTypes: ['sensor'], placeholder: 'sensor set ', desc: 'Set a sensor variable.' },
  { cmd: 'io ',          category: 'sensor', deviceTypes: ['sensor'], placeholder: 'io ',         desc: 'GPIO read/set/reset/toggle. e.g. io / io s<hex> / io r<hex> / io t<hex>' },
]

// DutchMeshCore repeater build: additions over the MeshCore baseline.
// Tokens verified against the toolbox's own config code (src/lib/config/filterCommands.ts,
// hardwareCommands.ts) and the dmc-observer-dev-1-17 firmware docs
// (packet_filter_reference.md, cli_commands.md).
export const DMC_REPEATER_COMMANDS: CliCommand[] = [

  // RF packet filter (examples/simple_repeater/Filter.{h,cpp}) – v1.17.
  { cmd: 'filter',                  category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Show packet-filter status and per-type blocking summary.', sinceVersion: 'v1.17' },
  { cmd: 'filter help',             category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'List every filter subcommand.', sinceVersion: 'v1.17' },
  { cmd: 'filter types',            category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'List all packet-type IDs and names (0-11).', sinceVersion: 'v1.17' },
  { cmd: 'filter on',               category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Enable the RF packet filter.', sinceVersion: 'v1.17' },
  { cmd: 'filter off',              category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Disable the RF packet filter.', sinceVersion: 'v1.17' },
  { cmd: 'filter reset',            category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Restore filter defaults.', sinceVersion: 'v1.17' },
  { cmd: 'filter hops ',            category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter hops ',    desc: 'Set max hop count per payload type. Example: filter hops 5 20 (type,max_hops). Bare "filter hops" shows current limits.', sinceVersion: 'v1.17' },
  { cmd: 'filter rate ',            category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter rate ',    desc: 'Rate-limit a payload type. Example: filter rate 2 20 60 (type,limit,seconds[,soft]). Optional soft cutoff (below limit, 0 = off) drops probabilistically. Bare "filter rate" shows config.', sinceVersion: 'v1.17' },
  { cmd: 'filter channel list',     category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'List blocked channels.', sinceVersion: 'v1.17' },
  { cmd: 'filter channel add ',     category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter channel add ',    desc: 'Block a channel by name. Example: filter channel add Public', sinceVersion: 'v1.17' },
  { cmd: 'filter channel remove ',  category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter channel remove ', desc: 'Unblock a channel by name.', sinceVersion: 'v1.17' },
  { cmd: 'filter hash ',            category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter hash ',    desc: 'Set minimum path-hash bytes (1-3). Bare "filter hash" shows the current value.', sinceVersion: 'v1.17' },
  { cmd: 'filter malformed',        category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Show the malformed-text scan state.', sinceVersion: 'v1.17' },
  { cmd: 'filter malformed on',     category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Drop public-channel text with malformed UTF-8.', sinceVersion: 'v1.17' },
  { cmd: 'filter malformed off',    category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Allow malformed public-channel text.', sinceVersion: 'v1.17' },
  { cmd: 'filter count',            category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Show per-payload-type blocking statistics.', sinceVersion: 'v1.17' },
  { cmd: 'filter stats ',           category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter stats ',   desc: 'Show detailed drop stats for a topic: hops | rate | hash | channel | malformed | top, and on current dev builds advert | path | air | sender | text | age. This is the data published to the MQTT filter topic on observer builds.', sinceVersion: 'v1.17' },

  // Filter additions on the dev builds (dmc-dev PR #11, now v1.18.0-dev): dry-run, per-origin advert
  // window, message age limit, blocked path prefixes, sender/text rules and their watch list.
  { cmd: 'filter dryrun', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show the dry-run state.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter dryrun on', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Count every drop but keep forwarding, to size a setting before enforcing it. The status line then ends in (dry-run).', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter dryrun off', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Enforce the filter again (drops are real).', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter advert', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show the per-origin advert window and cache fill.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter advert ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter advert ', desc: 'Forward each origin\'s flood advert at most once per N hours (0-720, 0 = off). Example: filter advert 48', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter advert clear', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Forget every remembered advert origin (window unchanged).', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter age', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show the message age limit and its drops.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter age ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter age ', desc: 'Drop group texts older than N minutes (1-10080), or "off". Needs a set clock on the repeater.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter path list', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'List blocked path prefixes.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter path add ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter path add ', desc: 'Block everything relayed by a repeater ID prefix (2-8 hex digits, max 8). Example: filter path add a1b2', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter path remove ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter path remove ', desc: 'Unblock a path prefix.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter sender list', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'List sender rules in evaluation order.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter sender add ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter sender add ', desc: 'Block, throttle or dose a group-text sender: <name> [secs] [prob]. secs 0 = block, else one message per secs passes; prob 1-100 = share of matches decided. End a name with * for a prefix. Example: filter sender add Bob 60', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter sender remove ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter sender remove ', desc: 'Remove a sender rule.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter text list', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'List text rules in evaluation order.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter text add ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter text add ', desc: 'Block, throttle or dose group texts containing a word: <pattern> [secs] [prob]. Start with ^ to match only at the beginning. Example: filter text add ^BEACON', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter text remove ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter text remove ', desc: 'Remove a text rule.', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter watch list', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'List the channels the rules can read (Public plus the watch list).', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter watch add ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter watch add ', desc: 'Let the sender/text rules and age limit read a #channel (max 4). Example: filter watch add #bots', sinceVersion: 'v1.18-dev' },
  { cmd: 'filter watch remove ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter watch remove ', desc: 'Stop reading a watched #channel.', sinceVersion: 'v1.18-dev' },

  // Duty-cycle limit derived from the frequency (dmc-dev PR #5)
  { cmd: 'set dutycycle auto', category: 'radio', deviceTypes: ['repeater','roomserver'], desc: 'Follow the regulatory duty-cycle limit of the configured frequency (863-870 MHz ETSI table, e.g. 10% at 869.4-869.65 MHz; no limit outside it). Default.', sinceVersion: 'v1.18-dev' },

  // v1.17 radio watchdog (auto-reset the radio after N minutes without RX; 0 = off)
  { cmd: 'get radio.watchdog',      category: 'radio', deviceTypes: ['repeater','roomserver'],                                  desc: 'Show radio-watchdog timeout (minutes).', sinceVersion: 'v1.17' },
  { cmd: 'set radio.watchdog ',     category: 'radio', deviceTypes: ['repeater','roomserver'], placeholder: 'set radio.watchdog ', desc: 'Set radio-watchdog timeout in minutes (0-120, 0 = off).', sinceVersion: 'v1.17' },
]

// DutchMeshCore MQTT / observer build: additions ON TOP of the repeater build.
// The on-device MQTT bridge, WiFi, timezone, SNMP and alert blocks are ported from
// meshcore.js/public/ui/firmware-registry.js (DMC_MQTT_COMMANDS). Token accuracy is
// cross-checked against the toolbox's own src/lib/config/mqttCommands.ts, which emits
// exactly these strings. The v1.17 per-broker filter + neighbour-publishing additions
// are verified against mqtt_broker_filter_reference.md and neighbour_discovery_reference.md.
export const DMC_MQTT_COMMANDS: CliCommand[] = [

  // MQTT bridge – global
  { cmd: 'set mqtt.origin ',      category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt.origin ', desc: 'Set MQTT origin / device name in topic (blank to clear).' },
  { cmd: 'get mqtt.origin',       category: 'mqtt', deviceTypes: 'all', desc: 'Show effective MQTT origin.' },
  { cmd: 'set mqtt.iata ',        category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt.iata ', desc: 'Set MQTT IATA code.' },
  { cmd: 'get mqtt.iata',         category: 'mqtt', deviceTypes: 'all', desc: 'Show MQTT IATA code.' },
  { cmd: 'set mqtt.status on',    category: 'mqtt', deviceTypes: 'all', desc: 'Enable periodic status publishing.' },
  { cmd: 'set mqtt.status off',   category: 'mqtt', deviceTypes: 'all', desc: 'Disable periodic status publishing.' },
  { cmd: 'get mqtt.status',       category: 'mqtt', deviceTypes: 'all', desc: 'Show MQTT connection status report.' },
  { cmd: 'set mqtt.packets on',   category: 'mqtt', deviceTypes: 'all', desc: 'Enable per-packet publishing.' },
  { cmd: 'set mqtt.packets off',  category: 'mqtt', deviceTypes: 'all', desc: 'Disable per-packet publishing.' },
  { cmd: 'get mqtt.packets',      category: 'mqtt', deviceTypes: 'all', desc: 'Show per-packet publishing state.' },
  { cmd: 'set mqtt.raw on',       category: 'mqtt', deviceTypes: 'all', desc: 'Enable raw payload publishing.' },
  { cmd: 'set mqtt.raw off',      category: 'mqtt', deviceTypes: 'all', desc: 'Disable raw payload publishing.' },
  { cmd: 'get mqtt.raw',          category: 'mqtt', deviceTypes: 'all', desc: 'Show raw-payload publishing state.' },
  { cmd: 'set mqtt.tx ',          category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt.tx ', desc: 'TX publishing: on|off|advert.' },
  { cmd: 'get mqtt.tx',           category: 'mqtt', deviceTypes: 'all', desc: 'Show TX publishing mode (on/off/advert).' },
  { cmd: 'set mqtt.rx on',        category: 'mqtt', deviceTypes: 'all', desc: 'Enable received (RX) packet publishing.' },
  { cmd: 'set mqtt.rx off',       category: 'mqtt', deviceTypes: 'all', desc: 'Disable received (RX) packet publishing.' },
  { cmd: 'get mqtt.rx',           category: 'mqtt', deviceTypes: 'all', desc: 'Show RX publishing state.' },
  { cmd: 'set mqtt.interval ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt.interval ', desc: 'Status interval, 1-60 minutes.' },
  { cmd: 'get mqtt.interval',     category: 'mqtt', deviceTypes: 'all', desc: 'Show status interval.' },
  { cmd: 'set mqtt.ntp ',         category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt.ntp ', desc: 'Set NTP server ("none" = pool.ntp.org default).' },
  { cmd: 'get mqtt.ntp',          category: 'mqtt', deviceTypes: 'all', desc: 'Show configured NTP server.' },
  { cmd: 'get mqtt.ntp.diag',     category: 'mqtt', deviceTypes: 'all', desc: 'Show NTP sync diagnostics.' },
  { cmd: 'set mqtt.owner ',       category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt.owner ', desc: 'Set owner public key (64 hex).' },
  { cmd: 'get mqtt.owner',        category: 'mqtt', deviceTypes: 'all', desc: 'Show owner public key (serial only).', note: 'serial-only' },
  { cmd: 'set mqtt.email ',       category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt.email ', desc: 'Set owner email.' },
  { cmd: 'get mqtt.email',        category: 'mqtt', deviceTypes: 'all', desc: 'Show owner email (serial only).', note: 'serial-only' },
  { cmd: 'get mqtt.presets',      category: 'mqtt', deviceTypes: 'all', desc: 'List built-in broker presets (e.g. dutchmeshcore-1, dutchmeshcore-2, meshcore-analyzer-eu).' },
  { cmd: 'set mqtt.config on',    category: 'mqtt', deviceTypes: 'all', desc: "Enable opt-in publishing of this node's configuration to the MQTT config topic." },
  { cmd: 'set mqtt.config off',   category: 'mqtt', deviceTypes: 'all', desc: "Disable publishing this node's configuration to the MQTT config topic." },
  { cmd: 'get mqtt.config',       category: 'mqtt', deviceTypes: 'all', desc: 'Show whether config publishing is enabled.' },
  { cmd: 'get mqtt.config.valid', category: 'mqtt', deviceTypes: 'all', desc: 'Show whether the MQTT config is valid.' },
  { cmd: 'get mqtt.advert.verify', category: 'mqtt', deviceTypes: 'all', desc: 'Show whether received adverts are signature-checked before publishing.', sinceVersion: 'v1.18-dev' },
  { cmd: 'set mqtt.advert.verify on', category: 'mqtt', deviceTypes: 'all', desc: 'Skip publishing received adverts whose Ed25519 signature fails (counted as badsig= in get mqtt.stats).', sinceVersion: 'v1.18-dev' },
  { cmd: 'set mqtt.advert.verify off', category: 'mqtt', deviceTypes: 'all', desc: 'Publish received adverts as heard (default), so over-the-air corruption stays visible to collectors.', sinceVersion: 'v1.18-dev' },

  // MQTT bridge – per slot (firmware exposes N=1..6; the toolbox drives all six)
  { cmd: 'set mqtt1.preset ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt1.preset ',   desc: 'Slot 1 preset (e.g. dutchmeshcore-1, meshcore-analyzer-eu, custom, none).' },
  { cmd: 'set mqtt1.server ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt1.server ',   desc: 'Slot 1 broker host (custom preset).' },
  { cmd: 'set mqtt1.port ',     category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt1.port ',     desc: 'Slot 1 port (1-65535).' },
  { cmd: 'set mqtt1.username ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt1.username ', desc: 'Slot 1 username.' },
  { cmd: 'set mqtt1.password ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt1.password ', desc: 'Slot 1 password.' },
  { cmd: 'set mqtt1.token ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt1.token ',    desc: 'Slot 1 JWT token.' },
  { cmd: 'set mqtt1.topic ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt1.topic ',    desc: 'Slot 1 topic template (custom preset only).' },
  { cmd: 'set mqtt1.audience ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt1.audience ', desc: 'Slot 1 JWT audience (blank to clear).' },
  { cmd: 'get mqtt1.diag',      category: 'mqtt', deviceTypes: 'all', desc: 'Slot 1 connection diagnostics.' },
  { cmd: 'set mqtt2.preset ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt2.preset ',   desc: 'Slot 2 preset (e.g. dutchmeshcore-2, meshcore-analyzer-eu, custom, none).' },
  { cmd: 'set mqtt2.server ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt2.server ',   desc: 'Slot 2 broker host (custom preset).' },
  { cmd: 'set mqtt2.port ',     category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt2.port ',     desc: 'Slot 2 port (1-65535).' },
  { cmd: 'set mqtt2.username ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt2.username ', desc: 'Slot 2 username.' },
  { cmd: 'set mqtt2.password ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt2.password ', desc: 'Slot 2 password.' },
  { cmd: 'set mqtt2.token ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt2.token ',    desc: 'Slot 2 JWT token.' },
  { cmd: 'set mqtt2.topic ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt2.topic ',    desc: 'Slot 2 topic template (custom preset only).' },
  { cmd: 'set mqtt2.audience ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt2.audience ', desc: 'Slot 2 JWT audience (blank to clear).' },
  { cmd: 'get mqtt2.diag',      category: 'mqtt', deviceTypes: 'all', desc: 'Slot 2 connection diagnostics.' },
  { cmd: 'set mqtt3.preset ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt3.preset ',   desc: 'Slot 3 preset (e.g. meshcore-analyzer-eu, custom, none).' },
  { cmd: 'set mqtt3.server ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt3.server ',   desc: 'Slot 3 broker host (custom preset).' },
  { cmd: 'set mqtt3.port ',     category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt3.port ',     desc: 'Slot 3 port (1-65535).' },
  { cmd: 'set mqtt3.username ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt3.username ', desc: 'Slot 3 username.' },
  { cmd: 'set mqtt3.password ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt3.password ', desc: 'Slot 3 password.' },
  { cmd: 'set mqtt3.token ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt3.token ',    desc: 'Slot 3 JWT token.' },
  { cmd: 'set mqtt3.topic ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt3.topic ',    desc: 'Slot 3 topic template (custom preset only).' },
  { cmd: 'set mqtt3.audience ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt3.audience ', desc: 'Slot 3 JWT audience (blank to clear).' },
  { cmd: 'get mqtt3.diag',      category: 'mqtt', deviceTypes: 'all', desc: 'Slot 3 connection diagnostics.' },
  { cmd: 'set mqtt4.preset ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt4.preset ',   desc: 'Slot 4 preset (e.g. meshcore-analyzer-eu, custom, none).' },
  { cmd: 'set mqtt4.server ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt4.server ',   desc: 'Slot 4 broker host (custom preset).' },
  { cmd: 'set mqtt4.port ',     category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt4.port ',     desc: 'Slot 4 port (1-65535).' },
  { cmd: 'set mqtt4.username ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt4.username ', desc: 'Slot 4 username.' },
  { cmd: 'set mqtt4.password ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt4.password ', desc: 'Slot 4 password.' },
  { cmd: 'set mqtt4.token ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt4.token ',    desc: 'Slot 4 JWT token.' },
  { cmd: 'set mqtt4.topic ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt4.topic ',    desc: 'Slot 4 topic template (custom preset only).' },
  { cmd: 'set mqtt4.audience ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt4.audience ', desc: 'Slot 4 JWT audience (blank to clear).' },
  { cmd: 'get mqtt4.diag',      category: 'mqtt', deviceTypes: 'all', desc: 'Slot 4 connection diagnostics.' },
  { cmd: 'set mqtt5.preset ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt5.preset ',   desc: 'Slot 5 preset (e.g. meshcore-analyzer-eu, custom, none).' },
  { cmd: 'set mqtt5.server ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt5.server ',   desc: 'Slot 5 broker host (custom preset).' },
  { cmd: 'set mqtt5.port ',     category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt5.port ',     desc: 'Slot 5 port (1-65535).' },
  { cmd: 'set mqtt5.username ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt5.username ', desc: 'Slot 5 username.' },
  { cmd: 'set mqtt5.password ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt5.password ', desc: 'Slot 5 password.' },
  { cmd: 'set mqtt5.token ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt5.token ',    desc: 'Slot 5 JWT token.' },
  { cmd: 'set mqtt5.topic ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt5.topic ',    desc: 'Slot 5 topic template (custom preset only).' },
  { cmd: 'set mqtt5.audience ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt5.audience ', desc: 'Slot 5 JWT audience (blank to clear).' },
  { cmd: 'get mqtt5.diag',      category: 'mqtt', deviceTypes: 'all', desc: 'Slot 5 connection diagnostics.' },
  { cmd: 'set mqtt6.preset ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt6.preset ',   desc: 'Slot 6 preset (e.g. meshcore-analyzer-eu, custom, none).' },
  { cmd: 'set mqtt6.server ',   category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt6.server ',   desc: 'Slot 6 broker host (custom preset).' },
  { cmd: 'set mqtt6.port ',     category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt6.port ',     desc: 'Slot 6 port (1-65535).' },
  { cmd: 'set mqtt6.username ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt6.username ', desc: 'Slot 6 username.' },
  { cmd: 'set mqtt6.password ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt6.password ', desc: 'Slot 6 password.' },
  { cmd: 'set mqtt6.token ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt6.token ',    desc: 'Slot 6 JWT token.' },
  { cmd: 'set mqtt6.topic ',    category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt6.topic ',    desc: 'Slot 6 topic template (custom preset only).' },
  { cmd: 'set mqtt6.audience ', category: 'mqtt', deviceTypes: 'all', placeholder: 'set mqtt6.audience ', desc: 'Slot 6 JWT audience (blank to clear).' },
  { cmd: 'get mqtt6.diag',      category: 'mqtt', deviceTypes: 'all', desc: 'Slot 6 connection diagnostics.' },

  // v1.17 per-broker packet filter (mqtt_broker_filter_reference.md)
  { cmd: 'set mqtt1.filter ',   category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt1.filter ', desc: 'Slot 1 publish filter: all | none | CSV of type names/numbers. Example: set mqtt1.filter txt_msg,advert', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt1.filter',    category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show slot 1 publish filter.', sinceVersion: 'v1.17' },
  { cmd: 'set mqtt2.filter ',   category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt2.filter ', desc: 'Slot 2 publish filter: all | none | CSV of type names/numbers.', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt2.filter',    category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show slot 2 publish filter.', sinceVersion: 'v1.17' },
  { cmd: 'set mqtt3.filter ',   category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt3.filter ', desc: 'Slot 3 publish filter: all | none | CSV of type names/numbers.', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt3.filter',    category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show slot 3 publish filter.', sinceVersion: 'v1.17' },
  { cmd: 'set mqtt4.filter ',   category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt4.filter ', desc: 'Slot 4 publish filter: all | none | CSV of type names/numbers.', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt4.filter',    category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show slot 4 publish filter.', sinceVersion: 'v1.17' },
  { cmd: 'set mqtt5.filter ',   category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt5.filter ', desc: 'Slot 5 publish filter: all | none | CSV of type names/numbers.', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt5.filter',    category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show slot 5 publish filter.', sinceVersion: 'v1.17' },
  { cmd: 'set mqtt6.filter ',   category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt6.filter ', desc: 'Slot 6 publish filter: all | none | CSV of type names/numbers.', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt6.filter',    category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show slot 6 publish filter.', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt.filter.interval', category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show filter-stats MQTT publish interval (seconds).', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set mqtt.filter.interval ', category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt.filter.interval ', desc: 'Set filter-stats MQTT publish interval in seconds (60-600, 0 = disable the filter topic). Default 60.', sinceVersion: 'v1.17', note: 'build-dependent' },

  // v1.17 neighbour publishing (neighbour_discovery_reference.md). PSRAM-only (WITH_MQTT_NEIGHBORS).
  { cmd: 'discover.scopes',            category: 'neighbors', deviceTypes: ['repeater','roomserver'], desc: 'Refresh the neighbour table and publish it to MQTT now (one-shot).', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt.neighbors',         category: 'neighbors', deviceTypes: ['repeater','roomserver'], desc: 'Show periodic neighbour-publishing state.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set mqtt.neighbors on',      category: 'neighbors', deviceTypes: ['repeater','roomserver'], desc: 'Enable periodic neighbour publishing.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set mqtt.neighbors off',     category: 'neighbors', deviceTypes: ['repeater','roomserver'], desc: 'Disable periodic neighbour publishing.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'get mqtt.neighbors.interval', category: 'neighbors', deviceTypes: ['repeater','roomserver'], desc: 'Show neighbour-publish interval (hours).', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set mqtt.neighbors.interval ', category: 'neighbors', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt.neighbors.interval ', desc: 'Set neighbour-publish interval in hours (12-336).', sinceVersion: 'v1.17', note: 'build-dependent' },

  // WiFi (esp32 observer transport the MQTT bridge runs on)
  { cmd: 'set wifi.ssid ',      category: 'wifi', deviceTypes: 'all', placeholder: 'set wifi.ssid ',      desc: 'Set WiFi SSID (reboot to reconnect).' },
  { cmd: 'set wifi.pwd ',       category: 'wifi', deviceTypes: 'all', placeholder: 'set wifi.pwd ',       desc: 'Set WiFi password (reboot to reconnect).' },
  { cmd: 'set wifi.powersave ', category: 'wifi', deviceTypes: 'all', placeholder: 'set wifi.powersave ', desc: 'WiFi power-save: none|min|max.' },
  { cmd: 'set wifi.ipv6 ',      category: 'wifi', deviceTypes: 'all', placeholder: 'set wifi.ipv6 ',      desc: 'WiFi IPv6 (IPv6-first MQTT, IPv4 fallback): on|off.' },
  { cmd: 'get wifi.ssid',       category: 'wifi', deviceTypes: 'all', desc: 'Show WiFi SSID.' },
  { cmd: 'get wifi.pwd',        category: 'wifi', deviceTypes: 'all', desc: 'Show WiFi password.' },
  { cmd: 'get wifi.powersave',  category: 'wifi', deviceTypes: 'all', desc: 'Show WiFi power-save mode.' },
  { cmd: 'get wifi.ipv6',       category: 'wifi', deviceTypes: 'all', desc: 'Show whether WiFi IPv6 is on.' },
  { cmd: 'get link.status', category: 'wifi', deviceTypes: 'all', desc: 'Show the selected network medium (Ethernet or WiFi), connection status, IP, signal and uptime. Replaces get wifi.status.', sinceVersion: 'v1.18-dev' },
  { cmd: 'get link.diag', category: 'wifi', deviceTypes: 'all', desc: 'Explain the automatic Ethernet / WiFi selection (ThinkNode M7 Ethernet builds).', sinceVersion: 'v1.18-dev' },
  { cmd: 'get link.dns', category: 'wifi', deviceTypes: 'all', desc: 'Show the live DNS resolvers, the gateway and the DNS each medium\'s DHCP lease installed.', sinceVersion: 'v1.18-dev' },
  { cmd: 'get wifi.status', category: 'wifi', deviceTypes: 'all', desc: 'WiFi-only compatibility alias of get link.status; reports n/a when another medium is selected.' },

  // Pull-based OTA over the observer WiFi connection (ota.dutchmeshcore.nl)
  { cmd: 'ota check',  category: 'ota', deviceTypes: ['repeater','roomserver'], desc: 'Check ota.dutchmeshcore.nl for a newer DutchMeshCore release over the observer WiFi connection.', sinceVersion: 'v1.17' },
  { cmd: 'ota update', category: 'ota', deviceTypes: ['repeater','roomserver'], desc: 'Download and install the latest DutchMeshCore firmware over the observer WiFi connection (pull-based OTA).', sinceVersion: 'v1.17' },
  { cmd: 'ota branch', category: 'ota', deviceTypes: ['repeater','roomserver'], desc: 'Show the selected OTA channel (prod or beta), the channel this build was made for, and the manifest base ota check / ota update use.', sinceVersion: 'v1.17' },
  { cmd: 'ota branch ', category: 'ota', deviceTypes: ['repeater','roomserver'], placeholder: 'ota branch ', desc: 'Switch the OTA channel this node pulls from: prod (alias stable), beta (alias dev), or default (follow the build). Persisted; run ota update to switch.', sinceVersion: 'v1.17' },
  { cmd: 'stop ota', category: 'ota', deviceTypes: 'all', desc: 'Stop an idle manual-OTA web server (start ota) and release port 80. Refuses while an upload is in progress; the session also stops by itself after 15 minutes.', sinceVersion: 'v1.18-dev' },

  // Timezone
  { cmd: 'set timezone ',        category: 'timezone', deviceTypes: 'all', placeholder: 'set timezone ', desc: 'Set IANA timezone (e.g. Europe/Amsterdam).' },
  { cmd: 'get timezone',         category: 'timezone', deviceTypes: 'all', desc: 'Show timezone.' },
  { cmd: 'set timezone.offset ', category: 'timezone', deviceTypes: 'all', placeholder: 'set timezone.offset ', desc: 'Set UTC offset (-12..14).' },
  { cmd: 'get timezone.offset',  category: 'timezone', deviceTypes: 'all', desc: 'Show UTC offset.' },

  // SNMP
  { cmd: 'set snmp on',          category: 'snmp', deviceTypes: 'all', desc: 'Enable the SNMP agent (reboot to apply).' },
  { cmd: 'set snmp off',         category: 'snmp', deviceTypes: 'all', desc: 'Disable the SNMP agent (reboot to apply).' },
  { cmd: 'get snmp',             category: 'snmp', deviceTypes: 'all', desc: 'Show SNMP enabled state.' },
  { cmd: 'set snmp.community ',  category: 'snmp', deviceTypes: 'all', placeholder: 'set snmp.community ', desc: 'Set SNMP community string.' },
  { cmd: 'get snmp.community',   category: 'snmp', deviceTypes: 'all', desc: 'Show SNMP community string.' },

  // Fault alerts (mesh-channel alerting on WiFi/MQTT outages)
  { cmd: 'set alert on',         category: 'alert', deviceTypes: 'all', desc: 'Enable automatic fault alerts.' },
  { cmd: 'set alert off',        category: 'alert', deviceTypes: 'all', desc: 'Disable automatic fault alerts.' },
  { cmd: 'get alert',            category: 'alert', deviceTypes: 'all', desc: 'Show alert enabled state.' },
  { cmd: 'set alert.psk ',       category: 'alert', deviceTypes: 'all', placeholder: 'set alert.psk ',     desc: 'Alert channel PSK (32 hex; blank to clear).' },
  { cmd: 'get alert.psk',        category: 'alert', deviceTypes: 'all', desc: 'Show alert PSK (serial only).', note: 'serial-only' },
  { cmd: 'set alert.hashtag ',   category: 'alert', deviceTypes: 'all', placeholder: 'set alert.hashtag ', desc: 'Derive the alert channel PSK from a #hashtag.' },
  { cmd: 'get alert.hashtag',    category: 'alert', deviceTypes: 'all', desc: 'Show alert hashtag.' },
  { cmd: 'set alert.region ',    category: 'alert', deviceTypes: 'all', placeholder: 'set alert.region ',  desc: 'Override the scope region for alerts.' },
  { cmd: 'get alert.region',     category: 'alert', deviceTypes: 'all', desc: 'Show alert region override.' },
  { cmd: 'set alert.wifi ',      category: 'alert', deviceTypes: 'all', placeholder: 'set alert.wifi ',     desc: 'WiFi-down alert threshold minutes (0-1440, 0 = off).' },
  { cmd: 'get alert.wifi',       category: 'alert', deviceTypes: 'all', desc: 'Show WiFi alert threshold.' },
  { cmd: 'set alert.mqtt ',      category: 'alert', deviceTypes: 'all', placeholder: 'set alert.mqtt ',     desc: 'MQTT-down alert threshold minutes (0-10080, 0 = off).' },
  { cmd: 'get alert.mqtt',       category: 'alert', deviceTypes: 'all', desc: 'Show MQTT alert threshold.' },
  { cmd: 'set alert.interval ',  category: 'alert', deviceTypes: 'all', placeholder: 'set alert.interval ', desc: 'Minimum re-fire interval (60-10080 min).' },
  { cmd: 'get alert.interval',   category: 'alert', deviceTypes: 'all', desc: 'Show alert re-fire interval.' },
  { cmd: 'alert test',           category: 'alert', deviceTypes: 'all', desc: 'Send a one-off test alert.' },
]

// Meshcomod (EV Fork) companion: Elektr0Vodka/meshcomod, examples/companion_radio.
// Its companion CLI maps the v1.18 commands onto meshcomod's own prefs layout. These
// answer "Error: unsupported" there (no prefs field), so they are left out:
const MESHCOMOD_UNSUPPORTED = new Set([
  'get cad', 'set cad ', 'get int.thresh', 'set int.thresh ',
  'get agc.reset.interval', 'set agc.reset.interval ', 'get txdelay', 'set txdelay ',
  'get direct.txdelay', 'set direct.txdelay ', 'get tz.offset', 'set tz.offset ',
])

const MESHCOMOD_BASE = MESHCORE_COMMANDS.filter(c =>
  (c.deviceTypes === 'all' || c.deviceTypes.includes('companion')) &&
  c.category !== 'wifi' && !MESHCOMOD_UNSUPPORTED.has(c.cmd))

// Additions in the fork, all first released in the companion-v1.18.0.1-pre2 pre-release.
export const MESHCOMOD_COMMANDS: CliCommand[] = [

  // WiFi (usb_tcp builds). Settings live in NVS and apply live, unlike upstream.
  { cmd: 'set wifi.ssid ',    category: 'wifi', deviceTypes: ['companion'], placeholder: 'set wifi.ssid ', desc: 'Set WiFi SSID; set wifi.pwd next to connect.', note: 'build-dependent', descKey: 'meshcomod:set wifi.ssid ' },
  { cmd: 'set wifi.pwd ',     category: 'wifi', deviceTypes: ['companion'], placeholder: 'set wifi.pwd ',  desc: 'Set WiFi password and reconnect right away.', note: 'build-dependent', descKey: 'meshcomod:set wifi.pwd ' },
  { cmd: 'get wifi.ssid',     category: 'wifi', deviceTypes: ['companion'], desc: 'Show WiFi SSID.', note: 'build-dependent' },
  { cmd: 'get wifi.pwd',      category: 'wifi', deviceTypes: ['companion'], desc: 'Show WiFi password (local only; remote CLI gets an error).', note: 'build-dependent', descKey: 'meshcomod:get wifi.pwd' },
  { cmd: 'set wifi.clear',    category: 'wifi', deviceTypes: ['companion'], desc: 'Forget the WiFi SSID and password and disconnect.', note: 'build-dependent', descKey: 'meshcomod:set wifi.clear' },
  { cmd: 'wifi.apply',        category: 'wifi', deviceTypes: ['companion'], desc: 'Reconnect with the stored WiFi settings.', note: 'build-dependent' },
  { cmd: 'get wifi.enabled',  category: 'wifi', deviceTypes: ['companion'], desc: 'Show whether WiFi is enabled (1/0).', note: 'build-dependent' },
  { cmd: 'set wifi.enabled ', category: 'wifi', deviceTypes: ['companion'], placeholder: 'set wifi.enabled ', desc: 'Turn WiFi on or off: 1|0 (applies live).', note: 'build-dependent', descKey: 'meshcomod:set wifi.enabled ' },
  { cmd: 'get wifi.status',   category: 'wifi', deviceTypes: ['companion'], desc: 'Show whether WiFi is connected.', note: 'build-dependent', descKey: 'companion:get wifi.status' },
  { cmd: 'get wifi.ip',       category: 'wifi', deviceTypes: ['companion'], desc: 'Show the WiFi IP address, or (not connected).', note: 'build-dependent' },

  // Receive filter (docs/companion_receive_filter.md). Same rule engine and list syntax as
  // the DMC repeater filter, but it hides messages from the app instead of dropping
  // traffic: only malformed, age and path drop; sender and text rules still repeat.
  { cmd: 'filter',                category: 'filter', deviceTypes: ['companion'], desc: 'Show the receive-filter state and how many messages each check caught: Malformed, Age, Path, Sender, Text.', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter' },
  { cmd: 'filter help',           category: 'filter', deviceTypes: ['companion'], desc: 'List every filter subcommand.', sinceVersion: 'v1.18.0.1-dev' },
  { cmd: 'filter on',             category: 'filter', deviceTypes: ['companion'], desc: 'Enable the receive filter (off by default).', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter on' },
  { cmd: 'filter off',            category: 'filter', deviceTypes: ['companion'], desc: 'Disable the receive filter; every setting is kept.', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter off' },
  { cmd: 'filter reset',          category: 'filter', deviceTypes: ['companion'], desc: 'Restore the defaults (everything off, all lists empty). Counters are kept.', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter reset' },
  { cmd: 'filter malformed',      category: 'filter', deviceTypes: ['companion'], desc: 'Show the malformed-text scan state.', sinceVersion: 'v1.18.0.1-dev' },
  { cmd: 'filter malformed on',   category: 'filter', deviceTypes: ['companion'], desc: 'Drop group text with a zero or implausible timestamp, empty text or invalid UTF-8, on every channel the companion holds.', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter malformed on' },
  { cmd: 'filter malformed off',  category: 'filter', deviceTypes: ['companion'], desc: 'Allow malformed group text.', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter malformed off' },
  { cmd: 'filter age',            category: 'filter', deviceTypes: ['companion'], desc: 'Show the message age limit.', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter age' },
  { cmd: 'filter age ',           category: 'filter', deviceTypes: ['companion'], placeholder: 'filter age ', desc: 'Drop group text older than N minutes (1-10080), or "off". Inactive until the clock is set, which the app usually does.', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter age ' },
  { cmd: 'filter path list',      category: 'filter', deviceTypes: ['companion'], desc: 'List blocked path prefixes.', sinceVersion: 'v1.18.0.1-dev' },
  { cmd: 'filter path add ',      category: 'filter', deviceTypes: ['companion'], placeholder: 'filter path add ', desc: 'Drop flood adverts, group text and group data relayed by a repeater ID prefix (2-8 hex digits, max 8). A blocked advert no longer refreshes the contact. Example: filter path add a1b2', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter path add ' },
  { cmd: 'filter path remove ',   category: 'filter', deviceTypes: ['companion'], placeholder: 'filter path remove ', desc: 'Unblock a path prefix.', sinceVersion: 'v1.18.0.1-dev' },
  { cmd: 'filter sender list',    category: 'filter', deviceTypes: ['companion'], desc: 'List sender rules in evaluation order.', sinceVersion: 'v1.18.0.1-dev' },
  { cmd: 'filter sender add ',    category: 'filter', deviceTypes: ['companion'], placeholder: 'filter sender add ', desc: 'Hide or throttle group text from a sender: <name> [secs] [prob]. secs 0 = hide every match, else one message per secs is shown; prob 1-100 = share of matches decided. End a name with * for a prefix. Max 15 characters, 8 rules. Example: filter sender add Bot*', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter sender add ' },
  { cmd: 'filter sender remove ', category: 'filter', deviceTypes: ['companion'], placeholder: 'filter sender remove ', desc: 'Remove a sender rule.', sinceVersion: 'v1.18.0.1-dev' },
  { cmd: 'filter text list',      category: 'filter', deviceTypes: ['companion'], desc: 'List text rules in evaluation order.', sinceVersion: 'v1.18.0.1-dev' },
  { cmd: 'filter text add ',      category: 'filter', deviceTypes: ['companion'], placeholder: 'filter text add ', desc: 'Hide or throttle group text containing a word: <pattern> [secs] [prob]. Start with ^ to match only at the beginning. Max 23 characters, 8 rules. Example: filter text add ^!ping 300', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter text add ' },
  { cmd: 'filter text remove ',   category: 'filter', deviceTypes: ['companion'], placeholder: 'filter text remove ', desc: 'Remove a text rule.', sinceVersion: 'v1.18.0.1-dev' },
  { cmd: 'filter stats ',         category: 'filter', deviceTypes: ['companion'], placeholder: 'filter stats ', desc: 'Show the counts for one check: malformed | age | path | sender | text. Counters restart at zero after a reboot.', sinceVersion: 'v1.18.0.1-dev', descKey: 'cfilter:filter stats ' },

  // SNMPv2c agent (docs/companion_snmp.md), read-only on UDP 161, usb_tcp builds
  { cmd: 'get snmp',             category: 'snmp', deviceTypes: ['companion'], desc: 'Show SNMP enabled state.', sinceVersion: 'v1.18.0.1-dev', note: 'build-dependent' },
  { cmd: 'set snmp on',          category: 'snmp', deviceTypes: ['companion'], desc: 'Enable the SNMPv2c agent on UDP 161 (applies live, no reboot). It runs while WiFi has an address. Poll 1.3.6.1.4.1.99999: the DMC observer tree plus .9 (clients, contacts, channels) and .10 (receive-filter counters).', sinceVersion: 'v1.18.0.1-dev', note: 'build-dependent', descKey: 'meshcomod:set snmp on' },
  { cmd: 'set snmp off',         category: 'snmp', deviceTypes: ['companion'], desc: 'Disable the SNMP agent (applies live, no reboot).', sinceVersion: 'v1.18.0.1-dev', note: 'build-dependent', descKey: 'meshcomod:set snmp off' },
  { cmd: 'get snmp.status',      category: 'snmp', deviceTypes: ['companion'], desc: 'Show the agent state: running on udp/161, on and waiting for WiFi, or off.', sinceVersion: 'v1.18.0.1-dev', note: 'build-dependent' },
  { cmd: 'set snmp.community ',  category: 'snmp', deviceTypes: ['companion'], placeholder: 'set snmp.community ', desc: 'Set the SNMP community string (1-23 characters, applies live). It is the only access control and travels in clear text, so change it from public.', sinceVersion: 'v1.18.0.1-dev', note: 'build-dependent', descKey: 'meshcomod:set snmp.community ' },
  { cmd: 'get snmp.community',   category: 'snmp', deviceTypes: ['companion'], desc: 'Show the SNMP community string (local only; remote CLI gets an error).', sinceVersion: 'v1.18.0.1-dev', note: 'build-dependent', descKey: 'meshcomod:get snmp.community' },

  // Manifest OTA (docs/companion_manifest_ota.md): text commands for the meshcomod
  // command contact, not the CLI. Pre-releases are not served over the air.
  { cmd: 'ota check',  category: 'ota', deviceTypes: ['companion'], desc: 'Check ota.dutchmeshcore.nl for a newer meshcomod build of this env over WiFi.', sinceVersion: 'v1.18.0.1-dev', note: 'command-contact', descKey: 'meshcomod:ota check' },
  { cmd: 'ota update', category: 'ota', deviceTypes: ['companion'], desc: 'Download and install the newer build found by ota check. Start it from a WiFi TCP or WebSocket session; a partition-layout change needs a USB flash.', sinceVersion: 'v1.18.0.1-dev', note: 'command-contact', descKey: 'meshcomod:ota update' },
  { cmd: 'ota url ',   category: 'ota', deviceTypes: ['companion'], placeholder: 'ota url ', desc: 'Download and install an app image (not -merged) from an https URL.', note: 'command-contact' },
]

export const FIRMWARE_VARIANTS: Record<string, FirmwareVariant> = {
  'meshcore': {
    id: 'meshcore',
    name: 'MeshCore',
    shortDescKey: 'wiki_fw_meshcore_short',
    fullDescKey: 'wiki_fw_meshcore_full',
    source: 'https://github.com/meshcore-dev/MeshCore',
    deviceTypes: ['companion', 'repeater', 'roomserver', 'sensor'],
    commands: MESHCORE_COMMANDS,
  },
  'dmc-repeater': {
    id: 'dmc-repeater',
    name: 'DutchMeshCore – Repeater',
    shortDescKey: 'wiki_fw_dmcrep_short',
    fullDescKey: 'wiki_fw_dmcrep_full',
    source: 'https://github.com/Dutch-MeshCore/MeshCore',
    deviceTypes: ['repeater', 'roomserver'],
    commands: [...MESHCORE_COMMANDS, ...DMC_REPEATER_COMMANDS],
  },
  'dmc-mqtt': {
    id: 'dmc-mqtt',
    name: 'DutchMeshCore – MQTT / Observer',
    shortDescKey: 'wiki_fw_dmcmqtt_short',
    fullDescKey: 'wiki_fw_dmcmqtt_full',
    source: 'https://github.com/Dutch-MeshCore/MeshCore',
    docs: [
      { labelKey: 'wiki_doc_cli', href: 'https://github.com/Dutch-MeshCore/MeshCore/blob/dmc-observer-dev/docs/cli_commands.md' },
      { labelKey: 'wiki_doc_snmp', href: 'https://github.com/Dutch-MeshCore/MeshCore/blob/dmc-observer-dev/MQTT_SNMP.md' },
    ],
    deviceTypes: ['repeater', 'roomserver'],
    commands: [...MESHCORE_COMMANDS, ...DMC_REPEATER_COMMANDS, ...DMC_MQTT_COMMANDS],
  },
  'meshcomod': {
    id: 'meshcomod',
    name: 'Meshcomod (EV Fork) – Companion',
    shortDescKey: 'wiki_fw_meshcomod_short',
    fullDescKey: 'wiki_fw_meshcomod_full',
    source: 'https://github.com/Elektr0Vodka/meshcomod',
    docs: [
      { labelKey: 'wiki_doc_filter', href: 'https://github.com/Elektr0Vodka/meshcomod/blob/main/docs/companion_receive_filter.md' },
      { labelKey: 'wiki_doc_snmp', href: 'https://github.com/Elektr0Vodka/meshcomod/blob/main/docs/companion_snmp.md' },
      { labelKey: 'wiki_doc_ota', href: 'https://github.com/Elektr0Vodka/meshcomod/blob/main/docs/companion_manifest_ota.md' },
      { labelKey: 'wiki_doc_changelog', href: 'https://github.com/Elektr0Vodka/meshcomod/blob/main/changelog_ev.md' },
    ],
    deviceTypes: ['companion'],
    commands: [...MESHCOMOD_BASE, ...MESHCOMOD_COMMANDS],
  },
}

export function variantById(id: string): FirmwareVariant {
  return FIRMWARE_VARIANTS[id] ?? FIRMWARE_VARIANTS['meshcore']
}

export function getCommandsForContext(variantId: string, deviceTypeId: number): CliCommand[] {
  const fw = variantById(variantId)
  const typeKey = (Object.keys(FW_DEVICE_TYPES) as DeviceTypeKey[])
    .find(k => FW_DEVICE_TYPES[k].id === deviceTypeId)
  if (!typeKey) return []
  return fw.commands.filter(c =>
    c.deviceTypes === 'all' || (Array.isArray(c.deviceTypes) && c.deviceTypes.includes(typeKey))
  )
}

export function searchCommands(list: CliCommand[], query: string): CliCommand[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter(c =>
    c.cmd.toLowerCase().includes(q) ||
    c.desc.toLowerCase().includes(q) ||
    (CLI_DESC_NL[descKeyOf(c)] ?? '').toLowerCase().includes(q)
  )
}

// The key a command's translations are stored under in CLI_DESC_NL / CLI_DESC_DE.
export function descKeyOf(cmd: CliCommand): string {
  return cmd.descKey ?? cmd.cmd
}

// The command description in the requested language. Descriptions are content
// (not UI chrome): English lives on the command, Dutch in CLI_DESC_NL. Falls
// back to English when no translation exists.
export function localizedDesc(cmd: CliCommand, lang: string): string {
  const key = descKeyOf(cmd)
  return lang === 'de' ? (CLI_DESC_DE[key] ?? cmd.desc) : lang === 'nl' ? (CLI_DESC_NL[key] ?? cmd.desc) : cmd.desc
}
