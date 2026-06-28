#!/usr/bin/env node
/**
 * Builds public/community-firmware.json from community MeshCore fork releases.
 *
 * Run locally:   node scripts/update-firmware-list.js
 * With token:    GITHUB_TOKEN=ghp_xxx node scripts/update-firmware-list.js
 *
 * Requires Node.js 18+ (built-in fetch).
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT     = join(ROOT, 'public', 'community-firmware.json')
const DMC_OUT = join(ROOT, 'public', 'dmc-firmware.json')

// Load .env.local if present (keeps GITHUB_TOKEN off disk and out of git)
try {
  const envPath = join(ROOT, '.env.local')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const [key, ...rest] = line.trim().split('=')
    if (key && !key.startsWith('#') && rest.length) {
      process.env[key] = rest.join('=').replace(/^["']|["']$/g, '')
    }
  }
} catch {}

const GH_TOKEN  = process.env.GITHUB_TOKEN
const GH_HEADERS = {
  Accept: 'application/vnd.github.v3+json',
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
}

// ─── Role definitions (mirrors communityFirmwareConfigs.ts) ──────────────────

const MESHCORE_DEV_ROLES = [
  { separator: '_companion_radio_ble-',     role: 'companion_radio_ble',  icon: '📻', title: 'Companion Radio',  subTitle: 'BLE transport'                  },
  { separator: '_companion_radio_usb-',     role: 'companion_radio_usb',  icon: '🔌', title: 'Companion Radio',  subTitle: 'USB transport'                  },
  { separator: '_room_server-',             role: 'room_server',          icon: '🏠', title: 'Room Server',      subTitle: ''                               },
  { separator: '_repeater_observer-',       role: 'repeater_observer',    icon: '📡', title: 'Repeater',         subTitle: 'Observer mode'                  },
  { separator: '_repeater-',               role: 'repeater',             icon: '📡', title: 'Repeater',         subTitle: ''                               },
]

const MESHCOMOD_ROLES = [
  { separator: '_companion_radio_usb_tcp',   role: 'companion_radio_usb_tcp',   icon: '🔌', title: 'Companion Radio', subTitle: 'USB + TCP transport' },
  { separator: '_companion_radio_touch',     role: 'companion_radio_touch',     icon: '📱', title: 'Companion Radio', subTitle: 'Touch display'       },
  { separator: '_room_server_multitransport',role: 'room_server_multitransport',icon: '🏠', title: 'Room Server',     subTitle: 'Multi-transport'     },
  { separator: '_repeater_tcp',              role: 'repeater_tcp',              icon: '📡', title: 'Repeater',        subTitle: 'TCP transport'       },
]

const DMC_ROLE_DEFS = [
  { separator: '_repeater_observer_mqtt-',    role: 'dutchmeshcore_mqtt',            icon: '📡', title: 'DutchMeshCore MQTT',            subTitle: 'Repeater + Observer + MQTT'   },
  { separator: '_room_server_observer_mqtt-', role: 'dutchmeshcore_roomserver_mqtt', icon: '🏠', title: 'DutchMeshCore Roomserver MQTT', subTitle: 'Room Server + Observer + MQTT' },
  { separator: '_room_server_mqtt-',          role: 'dutchmeshcore_roomserver_mqtt', icon: '🏠', title: 'DutchMeshCore Roomserver MQTT', subTitle: 'Room Server + MQTT'            },
  { separator: '_roomserver_mqtt-',           role: 'dutchmeshcore_roomserver_mqtt', icon: '🏠', title: 'DutchMeshCore Roomserver MQTT', subTitle: 'Room Server + MQTT'            },
]

// Non-MQTT repeater firmware (separate GitHub Releases source — see buildDmcRepeaterConfig)
const DMC_REPEATER_ROLE = { separator: '_repeater-', role: 'dutchmeshcore_repeater', icon: '📡', title: 'DutchMeshCore Repeater', subTitle: 'Repeater (non-MQTT)' }

const ALL_ROLE_DEFS = [
  ...MESHCORE_DEV_ROLES,
  ...MESHCOMOD_ROLES,
  ...DMC_ROLE_DEFS,
  DMC_REPEATER_ROLE,
]

// MQTT and non-MQTT repeater firmware render as two separate maker groups.
const DMC_MQTT_MAKER_META = {
  name:    'DutchMeshCore-MQTT-Firmware',
  repo:    'https://github.com/Dutch-MeshCore/MeshCore/releases/tag/repeater-mqtt-v1.16.0',
  website: 'https://dutchmeshcore.nl',
}

const DMC_REPEATER_MAKER_META = {
  name:    'DutchMeshCore Firmware',
  repo:    'https://github.com/Dutch-MeshCore/MeshCore',
  website: 'https://dutchmeshcore.nl',
}

const ROLE_DISPLAY = Object.fromEntries(
  ALL_ROLE_DEFS.map(rd => [rd.role, { icon: rd.icon, title: rd.title, subTitle: rd.subTitle }])
)

// ─── Device labels ────────────────────────────────────────────────────────────

const DEVICE_LABELS = {
  'Ebyte_EoRa-S3':              'Ebyte EoRa-S3',
  GAT562_30S_Mesh_Kit:          'GAT562 30S Mesh Kit',
  GAT562_Mesh_EVB_Pro:          'GAT562 Mesh EVB Pro',
  GAT562_Mesh_Tracker_Pro:      'GAT562 Mesh Tracker Pro',
  GAT562_Mesh_Watch13:          'GAT562 Mesh Watch 13',
  Generic_E22_sx1262:           'Generic E22 SX1262',
  Generic_E22_sx1268:           'Generic E22 SX1268',
  Heltec_ct62:                  'Heltec CT62',
  Heltec_E213:                  'Heltec E213',
  Heltec_E290:                  'Heltec E290',
  Heltec_mesh_solar:            'Heltec Mesh Solar',
  Heltec_T190:                  'Heltec T190',
  Heltec_t096:                  'Heltec T096',
  Heltec_t1:                    'Heltec T1',
  Heltec_t114:                  'Heltec T114',
  Heltec_t114_without_display:  'Heltec T114 (No Display)',
  heltec_tracker_v2:            'Heltec Tracker V2',
  Heltec_v2:                    'Heltec V2',
  Heltec_v3:                    'Heltec V3',
  heltec_v3:                    'Heltec V3',
  heltec_v4:                    'Heltec V4',
  Heltec_v4:                    'Heltec V4',
  heltec_v4_expansionkit:       'Heltec V4 Expansion Kit',
  heltec_v4_tft:                'Heltec V4 TFT',
  Heltec_WSL3:                  'Heltec WSL3',
  Heltec_Wireless_Paper:        'Heltec Wireless Paper',
  Heltec_Wireless_Tracker:      'Heltec Wireless Tracker',
  ikoka_handheld_nrf_e22_30dbm: 'iKoka Handheld NRF E22 30dBm',
  ikoka_nano_nrf_22dbm:         'iKoka Nano NRF 22dBm',
  ikoka_nano_nrf_30dbm:         'iKoka Nano NRF 30dBm',
  ikoka_nano_nrf_33dbm:         'iKoka Nano NRF 33dBm',
  ikoka_stick_nrf_22dbm:        'iKoka Stick NRF 22dBm',
  ikoka_stick_nrf_30dbm:        'iKoka Stick NRF 30dBm',
  ikoka_stick_nrf_33dbm:        'iKoka Stick NRF 33dBm',
  KeepteenLT1:                  'Keepteen LT1',
  'LilyGo_T-Echo':              'LilyGo T-Echo',
  'LilyGo_T-Echo-Lite':         'LilyGo T-Echo Lite',
  LilyGo_TBeam_1W:              'LilyGo T-Beam 1W',
  LilyGo_TDeck:                 'LilyGo T-Deck',
  LilyGo_TETH_Elite_sx1262:     'LilyGo T-ETH Elite SX1262',
  LilyGo_T3S3_sx1262:           'LilyGo T3S3 SX1262',
  LilyGo_TLora_V2_1_1_6:       'LilyGo T-LoRa V2.1.1.6',
  RAK_3112:                     'RAK3112',
  RAK_4631:                     'RAK4631',
  SenseCap_Solar:               'SenseCAP Solar',
  Station_G2:                   'Station G2',
  T_Beam_S3_Supreme_SX1262:    'T-Beam S3 Supreme SX1262',
  Tbeam_SX1262:                 'T-Beam SX1262',
  Tbeam_SX1276:                 'T-Beam SX1276',
  Xiao_S3_WIO:                  'Xiao S3 WIO',
}

function deviceLabel(key) {
  return DEVICE_LABELS[key] ?? key.replace(/_/g, ' ')
}

// ─── Filename parsers ─────────────────────────────────────────────────────────

function extOf(name) {
  if (name.endsWith('.bin')) return 'bin'
  if (name.endsWith('.uf2')) return 'uf2'
  if (name.endsWith('.zip')) return 'zip'
  return null
}

function parseReleaseAsset(name, url, roleDefs) {
  const ext = extOf(name)
  if (!ext) return null
  for (const rd of roleDefs) {
    const sepIdx = name.indexOf(rd.separator)
    if (sepIdx < 0) continue
    const deviceKey = name.slice(0, sepIdx)
    let rest = name.slice(sepIdx + rd.separator.length)
    const suffix = '-merged.' + ext
    const isMerged = rest.endsWith(suffix)
    rest = isMerged ? rest.slice(0, -suffix.length) : rest.slice(0, -('.' + ext).length)
    const versionKey = rest.match(/^(v?\d+\.\d+\.\d+)/)?.[1] ?? rest
    return { deviceKey, role: rd.role, versionKey, isMerged, ext, url }
  }
  return null
}

function parseDirAsset(name, url, roleDefs) {
  if (!name.endsWith('.bin')) return null
  for (const rd of roleDefs) {
    const sepIdx = name.indexOf(rd.separator)
    if (sepIdx < 0) continue
    const deviceKey = name.slice(0, sepIdx)
    const rest = name.slice(sepIdx + rd.separator.length)
    const isMerged = rest === '-merged.bin'
    if (rest !== '.bin' && rest !== '-merged.bin') continue
    return { deviceKey, role: rd.role, versionKey: 'Latest', isMerged, ext: 'bin', url }
  }
  return null
}

function parseDmcAsset(name, url) {
  if (!name.endsWith('.bin')) return null
  for (const rd of DMC_ROLE_DEFS) {
    const sepIdx = name.indexOf(rd.separator)
    if (sepIdx < 0) continue
    const deviceKey = name.slice(0, sepIdx)
    const rest = name.slice(sepIdx + rd.separator.length)
    const isMerged = rest.endsWith('-merged.bin')
    const versionFull = isMerged ? rest.slice(0, -'-merged.bin'.length) : rest.slice(0, -'.bin'.length)
    const versionKey = versionFull.match(/^(v?\d+\.\d+\.\d+)/)?.[1] ?? versionFull
    return { deviceKey, role: rd.role, versionKey, isMerged, ext: 'bin', url }
  }
  return null
}

// ─── Config builder ───────────────────────────────────────────────────────────

function buildConfig(files, makerKey, makerMeta) {
  const esp32Map = new Map()
  const nrf52Map = new Map()

  for (const f of files) {
    const k = `${f.deviceKey}/${f.role}/${f.versionKey}`
    if (f.ext === 'bin') {
      const entry = esp32Map.get(k) ?? { appUrl: '', mergedUrl: '' }
      if (f.isMerged) entry.mergedUrl = f.url
      else            entry.appUrl    = f.url
      esp32Map.set(k, entry)
    } else {
      const existing = nrf52Map.get(k)
      if (!existing || (f.ext === 'zip' && existing.ext === 'uf2')) {
        nrf52Map.set(k, { url: f.url, ext: f.ext })
      }
    }
  }

  const deviceMap = new Map()

  for (const [k, { appUrl, mergedUrl }] of esp32Map) {
    const [deviceKey, role, versionKey] = k.split('/')
    if (!deviceMap.has(deviceKey)) deviceMap.set(deviceKey, new Map())
    const roleMap = deviceMap.get(deviceKey)
    if (!roleMap.has(role)) roleMap.set(role, new Map())
    roleMap.get(role).set(versionKey, { type: 'esp32', appUrl, mergedUrl })
  }

  for (const [k, { url }] of nrf52Map) {
    const [deviceKey, role, versionKey] = k.split('/')
    if (!deviceMap.has(deviceKey)) deviceMap.set(deviceKey, new Map())
    const roleMap = deviceMap.get(deviceKey)
    if (!roleMap.has(role)) roleMap.set(role, new Map())
    roleMap.get(role).set(versionKey, { type: 'nrf52', appUrl: url, mergedUrl: '' })
  }

  const devices = [...deviceMap.entries()]
    .map(([deviceKey, roleMap]) => {
      const firstEntry = [...[...roleMap.values()][0]?.values() ?? []].at(0)
      const deviceType = firstEntry?.type ?? 'esp32'

      const firmware = [...roleMap.entries()].map(([role, versionMap]) => {
        const roleDisplay = ROLE_DISPLAY[role]
        const version = {}

        for (const [versionKey, entry] of [...versionMap.entries()].sort(([a], [b]) => b.localeCompare(a))) {
          if (entry.type === 'esp32') {
            if (entry.appUrl) {
              version[`${versionKey} — App update`] = {
                files: [{ type: 'flash-update', name: entry.appUrl, title: 'App update — keeps bootloader, partition table & config' }],
                notes: 'Updates firmware only. Bootloader and saved settings are preserved.',
              }
            }
            if (entry.mergedUrl) {
              version[`${versionKey} — Full flash`] = {
                files: [{ type: 'flash-wipe', name: entry.mergedUrl, title: 'Full flash — merged binary (bootloader + partition + app)' }],
                notes: 'Flashes the complete merged binary to 0x0. Use for new devices or factory resets. ⚠ Overwrites all existing firmware.',
              }
            }
          } else {
            const fileType = entry.appUrl.endsWith('.zip') ? 'nrf-dfu-zip' : 'uf2'
            version[versionKey] = {
              files: [{ type: fileType, name: entry.appUrl, title: 'Firmware update' }],
            }
          }
        }

        return {
          role,
          tooltip: deviceType === 'esp32'
            ? 'App update keeps bootloader & settings. Full flash is for new or factory-reset devices.'
            : undefined,
          icon:     roleDisplay?.icon,
          title:    roleDisplay?.title,
          subTitle: roleDisplay?.subTitle,
          version,
        }
      })

      return {
        maker: makerKey,
        class: 'community',
        name:  deviceLabel(deviceKey),
        type:  deviceType,
        firmware,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    staticPath: '',
    role: ROLE_DISPLAY,
    notice: {},
    maker: { [makerKey]: makerMeta },
    device: devices,
  }
}

function mergeConfigs(configs) {
  return {
    staticPath: '',
    role:   Object.assign({}, ...configs.map(c => c.role)),
    notice: Object.assign({}, ...configs.map(c => c.notice)),
    maker:  Object.assign({}, ...configs.map(c => c.maker)),
    device: configs.flatMap(c => c.device),
  }
}

// ─── GitHub fetchers ──────────────────────────────────────────────────────────

async function fetchReleaseAssets(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=20`
  console.log(`  GET ${url}`)
  const resp = await fetch(url, { headers: GH_HEADERS })
  if (!resp.ok) {
    console.warn(`  ⚠ ${owner}/${repo} releases: HTTP ${resp.status}`)
    return []
  }
  const releases = await resp.json()
  console.log(`  → ${releases.length} releases, ${releases.reduce((n, r) => n + r.assets.length, 0)} assets`)
  return releases.flatMap(r => r.assets)
}

async function fetchDirFiles(owner, repo, path) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  console.log(`  GET ${url}`)
  const resp = await fetch(url, { headers: GH_HEADERS })
  if (!resp.ok) {
    console.warn(`  ⚠ ${owner}/${repo}/${path}: HTTP ${resp.status}`)
    return []
  }
  const files = await resp.json()
  console.log(`  → ${files.length} files`)
  return files
}

async function fetchReleases(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`
  console.log(`  GET ${url}`)
  const resp = await fetch(url, { headers: GH_HEADERS })
  if (!resp.ok) {
    console.warn(`  ⚠ ${owner}/${repo} releases: HTTP ${resp.status}`)
    return []
  }
  const releases = await resp.json()
  console.log(`  → ${releases.length} releases`)
  return releases
}

// ─── Per-source builders ──────────────────────────────────────────────────────

async function buildMeshcoreDevConfig() {
  console.log('meshcore-dev/MeshCore')
  const assets = await fetchReleaseAssets('meshcore-dev', 'MeshCore')
  const files = assets.flatMap(a => {
    const p = parseReleaseAsset(a.name, a.browser_download_url, MESHCORE_DEV_ROLES)
    return p ? [p] : []
  })
  return buildConfig(files, 'meshcore_dev', {
    name: 'MeshCore.io Firmware (Official)',
    repo: 'https://github.com/meshcore-dev/MeshCore',
    website: 'https://meshcore.io',
  })
}

async function buildMeshcomodConfig() {
  console.log('ALLFATHER-BV/meshcomod')
  const ghFiles = await fetchDirFiles('ALLFATHER-BV', 'meshcomod', 'prebuilt')
  const files = ghFiles.flatMap(f => {
    const url = f.download_url ?? `https://raw.githubusercontent.com/ALLFATHER-BV/meshcomod/main/prebuilt/${f.name}`
    const p = parseDirAsset(f.name, url, MESHCOMOD_ROLES)
    return p ? [p] : []
  })
  return buildConfig(files, 'meshcomod', {
    name: 'Meshcomod Firmware',
    repo: 'https://github.com/ALLFATHER-BV/meshcomod',
    website: 'https://meshcomod.com',
  })
}

// MQTT observer firmware — GitHub Releases on the fork whose tag contains `mqtt`
// (e.g. `repeater-mqtt-*`, `dmc-room-server-mqtt-*`). The `dmc-repeater-*` (non-MQTT)
// releases are excluded by the tag filter. Asset filenames carry the version, so the
// existing `_repeater_observer_mqtt-` / `_room_server_observer_mqtt-` parser is reused.
async function buildDmcFirmwareConfig() {
  console.log('Dutch-MeshCore/MeshCore (mqtt releases)')
  const releases = (await fetchReleases('Dutch-MeshCore', 'MeshCore'))
    .filter(r => typeof r.tag_name === 'string' && /mqtt/i.test(r.tag_name))
  const files = releases.flatMap(rel => {
    // Some assets (e.g. room-server) carry only `dev-<hash>` in the filename, so take
    // the canonical version from the release tag (sans `v` to match the repeater list).
    const tagVer = ((rel.tag_name.match(/v?\d+\.\d+\.\d+(?:-[\w.]+)?/) || [])[0] || '').replace(/^v/, '')
    return (rel.assets ?? []).flatMap(a => {
      const p = parseDmcAsset(a.name, a.browser_download_url)
      return p ? [{ ...p, versionKey: tagVer || p.versionKey }] : []
    })
  })
  console.log(`  → ${releases.length} mqtt releases, ${files.length} firmware files`)
  return buildConfig(files, 'dutchmeshcore', DMC_MQTT_MAKER_META)
}

// Non-MQTT repeater firmware — GitHub Releases tagged `dmc-repeater-*` on the fork.
// Filenames carry no semver, so the version comes from the release tag. Rendered as
// its own maker group (separate from the MQTT firmware).
async function buildDmcRepeaterConfig() {
  console.log('Dutch-MeshCore/MeshCore (dmc-repeater releases)')
  const releases = (await fetchReleases('Dutch-MeshCore', 'MeshCore'))
    .filter(r => typeof r.tag_name === 'string' && r.tag_name.startsWith('dmc-repeater-'))

  const files = releases.flatMap(rel => {
    const versionKey = rel.tag_name.replace('dmc-repeater-', '').replace(/^v/, '')
    return (rel.assets ?? []).flatMap(a => {
      const ext = extOf(a.name)
      if (!ext) return []
      const sepIdx = a.name.indexOf('_repeater-')
      if (sepIdx < 0) return []
      const deviceKey = a.name.slice(0, sepIdx)
      const isMerged = a.name.endsWith('-merged.' + ext)
      return [{ deviceKey, role: 'dutchmeshcore_repeater', versionKey, isMerged, ext, url: a.browser_download_url }]
    })
  })
  console.log(`  → ${releases.length} dmc-repeater releases, ${files.length} firmware files`)
  return buildConfig(files, 'dutchmeshcore_repeater', DMC_REPEATER_MAKER_META)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Building community firmware list…')
  if (!GH_TOKEN) {
    console.warn('GITHUB_TOKEN not set — using unauthenticated API (60 req/hr limit)\n')
  }

  const results = await Promise.allSettled([
    buildMeshcoreDevConfig(),
    buildMeshcomodConfig(),
  ])

  const configs = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.device.length > 0) configs.push(result.value)
    } else {
      console.error('Source failed:', result.reason)
    }
  }

  if (!configs.length) {
    console.error('All sources failed — nothing to write.')
    process.exit(1)
  }

  const merged = mergeConfigs(configs)
  const output = { generated: new Date().toISOString(), ...merged }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(output, null, 2))

  const deviceCount = merged.device.length
  const makerCount  = Object.keys(merged.maker).length
  console.log(`\n✓ Wrote ${OUT}`)
  console.log(`  ${makerCount} makers, ${deviceCount} devices`)

  // ── DMC firmware (MQTT + non-MQTT repeater) ───────────────────────────────
  console.log('\nBuilding DutchMeshCore firmware list…')
  try {
    const [mqttRes, repeaterRes] = await Promise.allSettled([
      buildDmcFirmwareConfig(),
      buildDmcRepeaterConfig(),
    ])
    const emptyConfig = { staticPath: '', role: {}, notice: {}, maker: {}, device: [] }
    const dmcMqtt     = mqttRes.status === 'fulfilled' ? mqttRes.value : emptyConfig
    const dmcRepeater = repeaterRes.status === 'fulfilled' ? repeaterRes.value : emptyConfig
    if (mqttRes.status === 'rejected')     console.error('DMC MQTT build failed:', mqttRes.reason)
    if (repeaterRes.status === 'rejected') console.error('DMC repeater build failed:', repeaterRes.reason)

    // Two maker groups (repeater first, then MQTT) in one config.
    const dmcConfig = mergeConfigs([dmcRepeater, dmcMqtt])
    if (dmcConfig.device.length) {
      const dmcOutput = { generated: new Date().toISOString(), ...dmcConfig }
      writeFileSync(DMC_OUT, JSON.stringify(dmcOutput, null, 2))
      console.log(`✓ Wrote ${DMC_OUT}`)
      console.log(`  ${dmcConfig.device.length} devices`)
    } else {
      console.warn('DMC: no devices parsed — skipping write')
    }
  } catch (err) {
    console.error('DMC build failed:', err.message)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
