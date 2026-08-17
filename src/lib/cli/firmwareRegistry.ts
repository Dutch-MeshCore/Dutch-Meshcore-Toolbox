// src/lib/cli/firmwareRegistry.ts
// Typed CLI command catalog for the toolbox CLI Wiki.
// Ported and updated from meshcore.js/public/ui/firmware-registry.js.
// Pure data + pure functions – no DOM, unit-testable in isolation.

import type { StringKey } from '../../i18n'
import { CLI_DESC_NL } from './descriptions.nl'

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
  note?: 'build-dependent' | 'serial-only'
}

export interface FirmwareVariant {
  id: string
  name: string
  shortDescKey: StringKey
  fullDescKey: StringKey
  source: string
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
}

// Baseline MeshCore command catalog, ported from meshcore.js/public/ui/firmware-registry.js
export const MESHCORE_COMMANDS: CliCommand[] = [

  // System
  { cmd: 'ver',             category: 'system',  deviceTypes: 'all',                      desc: 'Show firmware version string.' },
  { cmd: 'board',           category: 'system',  deviceTypes: 'all',                      desc: 'Show board/hardware info.' },
  { cmd: 'reboot',          category: 'system',  deviceTypes: 'all',                      desc: 'Reboot the device.' },
  { cmd: 'clkreboot',       category: 'system',  deviceTypes: 'all',                      desc: 'Clock-sync then reboot.' },
  { cmd: 'poweroff',        category: 'system',  deviceTypes: ['repeater','roomserver','sensor'], desc: 'Power off the device (nRF52 only).' },
  { cmd: 'clock',           category: 'system',  deviceTypes: 'all',                      desc: 'Show current device clock.' },
  { cmd: 'clock sync',      category: 'system',  deviceTypes: 'all',                      desc: 'Sync device clock.' },
  { cmd: 'time ',           category: 'system',  deviceTypes: 'all',  placeholder: 'time ', desc: 'Set epoch time. Example: time 1700000000' },
  { cmd: 'get name',        category: 'system',  deviceTypes: 'all',                      desc: 'Show device name/advert.' },
  { cmd: 'get lat',         category: 'system',  deviceTypes: 'all',                      desc: 'Show configured latitude.' },
  { cmd: 'get lon',         category: 'system',  deviceTypes: 'all',                      desc: 'Show configured longitude.' },
  { cmd: 'get prv.key',     category: 'system',  deviceTypes: 'all',                      desc: 'Show private key.' },
  { cmd: 'get public.key',  category: 'system',  deviceTypes: 'all',                      desc: 'Show public key.' },
  { cmd: 'get role',        category: 'system',  deviceTypes: 'all',                      desc: 'Show device role.' },
  { cmd: 'erase',           category: 'system',  deviceTypes: ['repeater','roomserver','sensor'], desc: 'Erase stored config (serial only).', note: 'serial-only' },

  // Radio
  { cmd: 'get radio',              category: 'radio', deviceTypes: 'all',                    desc: 'Show current radio parameters.' },
  { cmd: 'get freq',               category: 'radio', deviceTypes: 'all',                    desc: 'Show radio frequency.' },
  { cmd: 'get tx',                 category: 'radio', deviceTypes: 'all',                    desc: 'Show TX power level.' },
  { cmd: 'get radio.rxgain',       category: 'radio', deviceTypes: 'all',                    desc: 'Show RX gain setting.' },
  { cmd: 'set radio.rxgain on',    category: 'radio', deviceTypes: 'all',                    desc: 'Enable RX gain boost.' },
  { cmd: 'set radio.rxgain off',   category: 'radio', deviceTypes: 'all',                    desc: 'Disable RX gain boost.' },
  { cmd: 'get dutycycle',          category: 'radio', deviceTypes: 'all',                    desc: 'Show current duty-cycle limit (%).' },
  { cmd: 'set dutycycle ',         category: 'radio', deviceTypes: 'all', placeholder: 'set dutycycle ', desc: 'Set duty-cycle limit. Range: 1-100.' },
  { cmd: 'get af',                 category: 'radio', deviceTypes: 'all',                    desc: 'Show airtime filter setting.' },
  { cmd: 'set af ',                category: 'radio', deviceTypes: 'all', placeholder: 'set af ',        desc: 'Set airtime filter value.' },
  { cmd: 'get int.thresh',         category: 'radio', deviceTypes: 'all',                    desc: 'Show interference threshold.' },
  { cmd: 'set int.thresh ',        category: 'radio', deviceTypes: 'all', placeholder: 'set int.thresh ', desc: 'Set interference threshold.' },
  { cmd: 'get agc.reset.interval', category: 'radio', deviceTypes: 'all',                    desc: 'Show AGC reset interval.' },
  { cmd: 'set agc.reset.interval ', category: 'radio', deviceTypes: 'all', placeholder: 'set agc.reset.interval ', desc: 'Set AGC reset interval.' },
  { cmd: 'tempradio ',             category: 'radio', deviceTypes: ['repeater','roomserver','sensor'], placeholder: 'tempradio ', desc: 'Temporarily change radio params. Example: tempradio 868100,125000,7,5,10 (freq,bw,sf,cr,timeout_mins)' },

  // Timing
  { cmd: 'get advert.interval',       category: 'timing', deviceTypes: 'all',                    desc: 'Show advert broadcast interval.' },
  { cmd: 'set advert.interval ',      category: 'timing', deviceTypes: 'all', placeholder: 'set advert.interval ', desc: 'Set advert interval in minutes (60-240), or 0 to disable.' },
  { cmd: 'get flood.advert.interval', category: 'timing', deviceTypes: 'all',                    desc: 'Show flood-advert interval.' },
  { cmd: 'set flood.advert.interval ', category: 'timing', deviceTypes: 'all', placeholder: 'set flood.advert.interval ', desc: 'Set flood-advert interval in hours (3-168), or 0 to disable. Default 47 (v1.16+).', sinceVersion: 'v1.16' },
  { cmd: 'get path.hash.mode',        category: 'timing', deviceTypes: 'all',                    desc: 'Show path hash mode.' },
  { cmd: 'set path.hash.mode ',       category: 'timing', deviceTypes: 'all', placeholder: 'set path.hash.mode ', desc: 'Set path hash mode.' },
  { cmd: 'get rxdelay',               category: 'timing', deviceTypes: 'all',                    desc: 'Show RX delay.' },
  { cmd: 'set rxdelay ',              category: 'timing', deviceTypes: 'all', placeholder: 'set rxdelay ', desc: 'Set RX delay.' },
  { cmd: 'get txdelay',               category: 'timing', deviceTypes: 'all',                    desc: 'Show TX delay.' },
  { cmd: 'set txdelay ',              category: 'timing', deviceTypes: 'all', placeholder: 'set txdelay ', desc: 'Set TX delay.' },
  { cmd: 'get direct.txdelay',        category: 'timing', deviceTypes: 'all',                    desc: 'Show direct TX delay.' },
  { cmd: 'set direct.txdelay ',       category: 'timing', deviceTypes: 'all', placeholder: 'set direct.txdelay ', desc: 'Set direct TX delay.' },

  // Networking
  { cmd: 'get repeat',            category: 'networking', deviceTypes: 'all',                    desc: 'Show repeat (relay) mode.' },
  { cmd: 'set repeat on',         category: 'networking', deviceTypes: 'all',                    desc: 'Enable packet repeating.' },
  { cmd: 'set repeat off',        category: 'networking', deviceTypes: 'all',                    desc: 'Disable packet repeating.' },
  { cmd: 'get flood.max',         category: 'networking', deviceTypes: 'all',                    desc: 'Show maximum flood hops.' },
  { cmd: 'set flood.max ',        category: 'networking', deviceTypes: 'all', placeholder: 'set flood.max ', desc: 'Set maximum flood hops.' },
  { cmd: 'get flood.max.unscoped', category: 'networking', deviceTypes: 'all',                   desc: 'Show cap on unscoped flood traffic (v1.16+). Default 64.', sinceVersion: 'v1.16' },
  { cmd: 'set flood.max.unscoped ', category: 'networking', deviceTypes: 'all', placeholder: 'set flood.max.unscoped ', desc: 'Cap unscoped flood traffic (v1.16+). Default 64.', sinceVersion: 'v1.16' },
  { cmd: 'get flood.max.advert',  category: 'networking', deviceTypes: 'all',                    desc: 'Show cap on flooded advert packets (v1.16+). Default 8.', sinceVersion: 'v1.16' },
  { cmd: 'set flood.max.advert ', category: 'networking', deviceTypes: 'all', placeholder: 'set flood.max.advert ', desc: 'Cap flooded advert packets (v1.16+). Default 8.', sinceVersion: 'v1.16' },
  { cmd: 'get allow.read.only',   category: 'networking', deviceTypes: 'all',                    desc: 'Show read-only access setting.' },
  { cmd: 'set allow.read.only on',  category: 'networking', deviceTypes: 'all',                  desc: 'Allow read-only access.' },
  { cmd: 'set allow.read.only off', category: 'networking', deviceTypes: 'all',                  desc: 'Disallow read-only access.' },
  { cmd: 'get loop.detect',       category: 'networking', deviceTypes: 'all',                    desc: 'Show loop detection mode.' },
  { cmd: 'set loop.detect ',      category: 'networking', deviceTypes: 'all', placeholder: 'set loop.detect ', desc: 'Set loop detection. Values: off/minimal/moderate/strict' },
  { cmd: 'get multi.acks',        category: 'networking', deviceTypes: 'all',                    desc: 'Show multi-ack setting.' },
  { cmd: 'set multi.acks ',       category: 'networking', deviceTypes: 'all', placeholder: 'set multi.acks ', desc: 'Set multi-ack value.' },

  // Neighbors
  { cmd: 'neighbors',          category: 'neighbors', deviceTypes: ['repeater','roomserver','sensor'],            desc: 'List known neighbors.' },
  { cmd: 'neighbor.remove ',   category: 'neighbors', deviceTypes: ['repeater','roomserver','sensor'], placeholder: 'neighbor.remove ', desc: 'Remove neighbor by pubkey.' },
  { cmd: 'discover.neighbors', category: 'neighbors', deviceTypes: ['repeater'],                                  desc: 'Trigger neighbor discovery (repeater only).' },

  // Security
  { cmd: 'get guest.password',  category: 'security', deviceTypes: 'all',                                          desc: 'Show guest password.' },
  { cmd: 'set guest.password ', category: 'security', deviceTypes: 'all', placeholder: 'set guest.password ',      desc: 'Set guest password.' },
  { cmd: 'get owner.info',      category: 'security', deviceTypes: 'all',                                          desc: 'Show owner info string.' },
  { cmd: 'set owner.info ',     category: 'security', deviceTypes: 'all', placeholder: 'set owner.info ',          desc: 'Set owner info string.' },
  { cmd: 'password ',           category: 'security', deviceTypes: ['repeater','roomserver','sensor'], placeholder: 'password ', desc: 'Change admin password.' },
  { cmd: 'setperm ',            category: 'security', deviceTypes: ['repeater','roomserver','sensor'], placeholder: 'setperm ', desc: 'Set ACL permissions for a node. Example: setperm <pubkey> <0-3>' },
  { cmd: 'get acl',             category: 'security', deviceTypes: ['repeater','roomserver','sensor'],                       desc: 'Show access control list (local serial only).', note: 'serial-only' },

  // Statistics
  { cmd: 'stats-core',    category: 'stats', deviceTypes: ['repeater','roomserver','sensor'], desc: 'Show battery, uptime, queue.' },
  { cmd: 'stats-radio',   category: 'stats', deviceTypes: ['repeater','roomserver','sensor'], desc: 'Show noise floor, RSSI/SNR, airtime, errors.' },
  { cmd: 'stats-packets', category: 'stats', deviceTypes: ['repeater','roomserver','sensor'], desc: 'Show packet RX/TX counters.' },
  { cmd: 'clear stats',   category: 'stats', deviceTypes: ['repeater','roomserver','sensor'], desc: 'Clear statistics counters.' },

  // Logging
  { cmd: 'log',       category: 'logging', deviceTypes: ['repeater','roomserver','sensor'], desc: 'Dump log.' },
  { cmd: 'log start', category: 'logging', deviceTypes: ['repeater','roomserver','sensor'], desc: 'Start log capture.' },
  { cmd: 'log stop',  category: 'logging', deviceTypes: ['repeater','roomserver','sensor'], desc: 'Stop log capture.' },
  { cmd: 'log erase', category: 'logging', deviceTypes: ['repeater','roomserver','sensor'], desc: 'Erase stored log.' },

  // WiFi: official MeshCore has NO runtime WiFi CLI (build-time `#ifdef WIFI_SSID` only).
  // Runtime WiFi commands are mod-specific (syntax differs per fork) – see the fork command sets below.

  // OTA
  { cmd: 'start ota', category: 'ota', deviceTypes: 'all', desc: 'Start OTA firmware update mode.' },

  // Region
  { cmd: 'region',           category: 'region', deviceTypes: ['repeater','roomserver','sensor'],                desc: 'Show region hierarchy.' },
  { cmd: 'region save',      category: 'region', deviceTypes: ['repeater','roomserver','sensor'],                desc: 'Save region configuration.' },
  { cmd: 'region home ',     category: 'region', deviceTypes: ['repeater','roomserver','sensor'], placeholder: 'region home ',    desc: 'Set home region.' },
  { cmd: 'region default ',  category: 'region', deviceTypes: ['repeater','roomserver','sensor'], placeholder: 'region default ', desc: 'Set default region.' },
  { cmd: 'region def ',      category: 'region', deviceTypes: ['repeater','roomserver','sensor'], placeholder: 'region def ', desc: 'Define a region with shorthand nesting notation (v1.16+).', sinceVersion: 'v1.16' },
  { cmd: 'region put ',      category: 'region', deviceTypes: 'all', placeholder: 'region put ', desc: 'Register a region code. Example: region put NL-ZH *' },
  { cmd: 'region get ',      category: 'region', deviceTypes: 'all', placeholder: 'region get ',    desc: 'Get a region entry.' },
  { cmd: 'region remove ',   category: 'region', deviceTypes: 'all', placeholder: 'region remove ', desc: 'Remove a region entry.' },
  { cmd: 'region allowf ',   category: 'region', deviceTypes: 'all', placeholder: 'region allowf ', desc: 'Allow-list a region filter.' },
  { cmd: 'region denyf ',    category: 'region', deviceTypes: 'all', placeholder: 'region denyf ',  desc: 'Deny-list a region filter.' },
  { cmd: 'region list',      category: 'region', deviceTypes: ['repeater','roomserver','sensor'],                desc: 'List regions.' },
  { cmd: 'region load ',     category: 'region', deviceTypes: 'all', placeholder: 'region load ', desc: 'Load region from storage.' },

  // Setters paired with existing getters (official v1.16 CommonCLI)
  { cmd: 'set name ',     category: 'system', deviceTypes: 'all', placeholder: 'set name ',     desc: 'Set device name/advert.' },
  { cmd: 'set lat ',      category: 'system', deviceTypes: 'all', placeholder: 'set lat ',      desc: 'Set latitude.' },
  { cmd: 'set lon ',      category: 'system', deviceTypes: 'all', placeholder: 'set lon ',      desc: 'Set longitude.' },
  { cmd: 'set prv.key ',  category: 'system', deviceTypes: 'all', placeholder: 'set prv.key ', desc: 'Set private key.' },
  { cmd: 'set freq ',     category: 'radio',  deviceTypes: 'all', placeholder: 'set freq ',     desc: 'Set radio frequency (serial only).', note: 'serial-only' },
  { cmd: 'set radio ',    category: 'radio',  deviceTypes: 'all', placeholder: 'set radio ',    desc: 'Set full radio params: freq,bw,sf,cr.' },
  { cmd: 'set tx ',       category: 'radio',  deviceTypes: 'all', placeholder: 'set tx ',       desc: 'Set TX power (dBm).' },

  // Advert triggers / power (official CommonCLI)
  { cmd: 'advert',          category: 'timing', deviceTypes: 'all',                      desc: 'Send a flood advert now.' },
  { cmd: 'advert.zerohop',  category: 'timing', deviceTypes: 'all',                      desc: 'Send a zero-hop advert now.' },
  { cmd: 'shutdown',        category: 'system', deviceTypes: ['repeater','roomserver','sensor'], desc: 'Power off the device.' },
  { cmd: 'powersaving on',  category: 'system', deviceTypes: 'all',                      desc: 'Enable power saving (build-dependent).', note: 'build-dependent' },
  { cmd: 'powersaving off', category: 'system', deviceTypes: 'all',                      desc: 'Disable power saving (build-dependent).', note: 'build-dependent' },

  // ADC / power management / bootloader (official; build-dependent – only on builds that compile them in)
  { cmd: 'get adc.multiplier',     category: 'radio',  deviceTypes: 'all',                      desc: 'Show ADC multiplier (build-dependent).', note: 'build-dependent' },
  { cmd: 'set adc.multiplier ',    category: 'radio',  deviceTypes: 'all', placeholder: 'set adc.multiplier ', desc: 'Set ADC multiplier (build-dependent).', note: 'build-dependent' },
  { cmd: 'get bootloader.ver',     category: 'system', deviceTypes: 'all',                      desc: 'Show bootloader version (nRF52 builds).' },
  { cmd: 'get pwrmgt.support',     category: 'power',  deviceTypes: 'all',                      desc: 'Show power-management support (nRF52 builds).' },
  { cmd: 'get pwrmgt.source',      category: 'power',  deviceTypes: 'all',                      desc: 'Show power source (nRF52 builds).' },
  { cmd: 'get pwrmgt.bootreason',  category: 'power',  deviceTypes: 'all',                      desc: 'Show boot reason (nRF52 builds).' },
  { cmd: 'get pwrmgt.bootmv',      category: 'power',  deviceTypes: 'all',                      desc: 'Show boot voltage mV (nRF52 builds).' },

  // GPS (official; only when the ENV_INCLUDE_GPS build flag is set)
  { cmd: 'gps on',     category: 'gps', deviceTypes: 'all', desc: 'Enable GPS (build-dependent).', note: 'build-dependent' },
  { cmd: 'gps off',    category: 'gps', deviceTypes: 'all', desc: 'Disable GPS (build-dependent).', note: 'build-dependent' },
  { cmd: 'gps sync',   category: 'gps', deviceTypes: 'all', desc: 'Sync time from GPS (build-dependent).', note: 'build-dependent' },
  { cmd: 'gps setloc', category: 'gps', deviceTypes: 'all', desc: 'Set location from GPS (build-dependent).', note: 'build-dependent' },
  { cmd: 'gps advert', category: 'gps', deviceTypes: 'all', desc: 'Advertise GPS location (build-dependent).', note: 'build-dependent' },

  // Bridge (official; only when a WITH_*_BRIDGE build flag is set)
  { cmd: 'get bridge.type',     category: 'bridge', deviceTypes: 'all',                      desc: 'Show bridge type (build-dependent).', note: 'build-dependent' },
  { cmd: 'get bridge.enabled',  category: 'bridge', deviceTypes: 'all',                      desc: 'Show bridge enabled (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.enabled ', category: 'bridge', deviceTypes: 'all', placeholder: 'set bridge.enabled ', desc: 'Enable/disable bridge (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.delay ',   category: 'bridge', deviceTypes: 'all', placeholder: 'set bridge.delay ',   desc: 'Set bridge delay (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.source ',  category: 'bridge', deviceTypes: 'all', placeholder: 'set bridge.source ',  desc: 'Set bridge source (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.baud ',    category: 'bridge', deviceTypes: 'all', placeholder: 'set bridge.baud ',    desc: 'Set RS232 bridge baud (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.channel ', category: 'bridge', deviceTypes: 'all', placeholder: 'set bridge.channel ', desc: 'Set ESP-NOW bridge channel (build-dependent).', note: 'build-dependent' },
  { cmd: 'set bridge.secret ',  category: 'bridge', deviceTypes: 'all', placeholder: 'set bridge.secret ',  desc: 'Set ESP-NOW bridge secret (build-dependent).', note: 'build-dependent' },

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
  { cmd: 'filter on',               category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Enable the RF packet filter.', sinceVersion: 'v1.17' },
  { cmd: 'filter off',              category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Disable the RF packet filter.', sinceVersion: 'v1.17' },
  { cmd: 'filter reset',            category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Restore filter defaults.', sinceVersion: 'v1.17' },
  { cmd: 'filter hops ',            category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter hops ',    desc: 'Set max hop count per payload type. Example: filter hops 5 20 (type,max_hops). Bare "filter hops" shows current limits.', sinceVersion: 'v1.17' },
  { cmd: 'filter rate ',            category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter rate ',    desc: 'Rate-limit a payload type. Example: filter rate 2 20 60 (type,limit,seconds). Bare "filter rate" shows config.', sinceVersion: 'v1.17' },
  { cmd: 'filter channel list',     category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'List blocked channels.', sinceVersion: 'v1.17' },
  { cmd: 'filter channel add ',     category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter channel add ',    desc: 'Block a channel by name. Example: filter channel add Public', sinceVersion: 'v1.17' },
  { cmd: 'filter channel remove ',  category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter channel remove ', desc: 'Unblock a channel by name.', sinceVersion: 'v1.17' },
  { cmd: 'filter hash ',            category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'filter hash ',    desc: 'Set minimum path-hash bytes (1-3). Bare "filter hash" shows the current value.', sinceVersion: 'v1.17' },
  { cmd: 'filter malformed on',     category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Drop public-channel text with malformed UTF-8.', sinceVersion: 'v1.17' },
  { cmd: 'filter malformed off',    category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Allow malformed public-channel text.', sinceVersion: 'v1.17' },
  { cmd: 'filter count',            category: 'filter', deviceTypes: ['repeater','roomserver'],                                 desc: 'Show per-payload-type blocking statistics.', sinceVersion: 'v1.17' },

  // v1.17 external-FEM gain (board-capability gated: canControlLoRaFemLna / …FemPaGain)
  { cmd: 'get radio.fem.rxgain',    category: 'radio', deviceTypes: ['repeater','roomserver'],                                  desc: 'Show external-FEM RX LNA gain state.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set radio.fem.rxgain on', category: 'radio', deviceTypes: ['repeater','roomserver'],                                  desc: 'Enable external-FEM RX LNA gain.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set radio.fem.rxgain off',category: 'radio', deviceTypes: ['repeater','roomserver'],                                  desc: 'Disable external-FEM RX LNA gain.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'get radio.fem.txgain',    category: 'radio', deviceTypes: ['repeater','roomserver'],                                  desc: 'Show external-FEM TX PA gain state.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set radio.fem.txgain on', category: 'radio', deviceTypes: ['repeater','roomserver'],                                  desc: 'Enable external-FEM TX PA gain.', sinceVersion: 'v1.17', note: 'build-dependent' },
  { cmd: 'set radio.fem.txgain off',category: 'radio', deviceTypes: ['repeater','roomserver'],                                  desc: 'Disable external-FEM TX PA gain.', sinceVersion: 'v1.17', note: 'build-dependent' },

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
  { cmd: 'get mqtt.config.valid', category: 'mqtt', deviceTypes: 'all', desc: 'Show whether the MQTT config is valid.' },

  // MQTT bridge – per slot (firmware exposes N=1..6; the toolbox drives slots 1-2)
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

  // v1.17 per-broker packet filter (mqtt_broker_filter_reference.md)
  { cmd: 'set mqtt1.filter ',   category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt1.filter ', desc: 'Slot 1 publish filter: all | none | CSV of type names/numbers. Example: set mqtt1.filter txt_msg,advert', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt1.filter',    category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show slot 1 publish filter.', sinceVersion: 'v1.17' },
  { cmd: 'set mqtt2.filter ',   category: 'filter', deviceTypes: ['repeater','roomserver'], placeholder: 'set mqtt2.filter ', desc: 'Slot 2 publish filter: all | none | CSV of type names/numbers.', sinceVersion: 'v1.17' },
  { cmd: 'get mqtt2.filter',    category: 'filter', deviceTypes: ['repeater','roomserver'], desc: 'Show slot 2 publish filter.', sinceVersion: 'v1.17' },

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
  { cmd: 'get wifi.ssid',       category: 'wifi', deviceTypes: 'all', desc: 'Show WiFi SSID.' },
  { cmd: 'get wifi.pwd',        category: 'wifi', deviceTypes: 'all', desc: 'Show WiFi password.' },
  { cmd: 'get wifi.powersave',  category: 'wifi', deviceTypes: 'all', desc: 'Show WiFi power-save mode.' },

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
    deviceTypes: ['repeater', 'roomserver'],
    commands: [...MESHCORE_COMMANDS, ...DMC_REPEATER_COMMANDS, ...DMC_MQTT_COMMANDS],
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
    (CLI_DESC_NL[c.cmd] ?? '').toLowerCase().includes(q)
  )
}

// The command description in the requested language. Descriptions are content
// (not UI chrome): English lives on the command, Dutch in CLI_DESC_NL. Falls
// back to English when no translation exists.
export function localizedDesc(cmd: CliCommand, lang: string): string {
  return lang === 'nl' ? (CLI_DESC_NL[cmd.cmd] ?? cmd.desc) : cmd.desc
}
