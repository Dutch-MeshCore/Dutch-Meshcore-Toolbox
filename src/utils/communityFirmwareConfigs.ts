/**
 * Fetches prebuilt firmware from community MeshCore forks and returns a
 * combined FlasherConfig ready to be merged with the main DutchMeshCore config.
 *
 * Sources (GitHub Releases):
 *   meshcore-dev/MeshCore   – companion, room-server, repeater
 *   Elektr0Vodka/meshcomod  – `companion-vX.Y.Z.W` releases, pre-releases as `-dev` (companion-radio-*)
 */

import type { FlasherConfig } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleDef {
  separator: string
  role: string
  icon: string
  title: string
  subTitle: string
}

interface GHReleaseAsset {
  name: string
  browser_download_url: string
}

interface GHRelease {
  tag_name?: string
  prerelease?: boolean
  draft?: boolean
  assets: GHReleaseAsset[]
}

interface ParsedFile {
  deviceKey: string
  role: string
  versionKey: string
  isMerged: boolean
  ext: 'bin' | 'uf2' | 'zip'
  url: string
}

// ─── Device labels ────────────────────────────────────────────────────────────

const DEVICE_LABELS: Record<string, string> = {
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
  heltec_v4_r8:                 'Heltec V4 R8',
  heltec_v4_r8_tft:             'Heltec V4 R8 TFT',
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
  ThinkNode_M7:                 'ThinkNode M7',
  Xiao_S3_WIO:                  'Xiao S3 WIO',
}

function deviceLabel(key: string): string {
  return DEVICE_LABELS[key] ?? key.replace(/_/g, ' ')
}

// ─── Role definitions per source ──────────────────────────────────────────────

// More specific separators must come before less specific ones within each array
// to avoid partial matches (e.g. _repeater_observer- before _repeater-).

const MESHCORE_DEV_ROLES: RoleDef[] = [
  { separator: '_companion_radio_ble-',     role: 'companion_radio_ble',  icon: '📻', title: 'Companion Radio',  subTitle: 'BLE transport'  },
  { separator: '_companion_radio_usb-',     role: 'companion_radio_usb',  icon: '🔌', title: 'Companion Radio',  subTitle: 'USB transport'  },
  { separator: '_room_server-',             role: 'room_server',          icon: '🏠', title: 'Room Server',      subTitle: ''               },
  { separator: '_repeater_observer-',       role: 'repeater_observer',    icon: '📡', title: 'Repeater',         subTitle: 'Observer mode'  },
  { separator: '_repeater-',               role: 'repeater',             icon: '📡', title: 'Repeater',         subTitle: ''               },
]

// meshcomod companion envs (Elektr0Vodka/meshcomod build.sh MESHCOMOD_COMPANION_ENVS).
// A separator only matches when the version follows it (see MESHCOMOD_ASSET_TAIL).
const MESHCOMOD_ROLES: RoleDef[] = [
  { separator: '_companion_radio_usb_tcp',      role: 'companion_radio_usb_tcp',      icon: '🔌', title: 'Companion Radio', subTitle: 'USB + TCP transport' },
  { separator: '_companion_radio_ethernet',     role: 'companion_radio_ethernet',     icon: '🌐', title: 'Companion Radio', subTitle: 'Ethernet transport'  },
  { separator: '_companion_radio_ble',          role: 'companion_radio_ble',          icon: '📻', title: 'Companion Radio', subTitle: 'BLE transport'       },
]

// Merged role display map used in the FlasherConfig.role record
const ALL_ROLE_DEFS = [
  ...MESHCORE_DEV_ROLES,
  ...MESHCOMOD_ROLES,
]
const ROLE_DISPLAY = Object.fromEntries(
  ALL_ROLE_DEFS.map(rd => [rd.role, { icon: rd.icon, title: rd.title, subTitle: rd.subTitle }])
)

// ─── Filename parsers ─────────────────────────────────────────────────────────

function extOf(name: string): 'bin' | 'uf2' | 'zip' | null {
  if (name.endsWith('.bin')) return 'bin'
  if (name.endsWith('.uf2')) return 'uf2'
  if (name.endsWith('.zip')) return 'zip'
  return null
}

/** Parse a GitHub Releases asset: {Device}_{role}-{version}-{hash}[-merged].{ext} */
function parseReleaseAsset(name: string, url: string, roleDefs: RoleDef[]): ParsedFile | null {
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

// What must follow the role separator in a meshcomod release asset:
// `-vX.Y.Z.W[-preN]-<sha>[-merged].bin`. The plain `<env>.bin` copy, the timestamped
// `<env>-YYYYMMDD_HHMMSS-<sha>.bin` copy and `<env>.partsig` do not match.
const MESHCOMOD_ASSET_TAIL = /^-(v\d+\.\d+\.\d+\.\d+(?:-[A-Za-z]+\d*)?)-[0-9a-f]+(-merged)?\.bin$/

// Companion release tag: `companion-vX.Y.Z.W`, or with a `-preN` / `-rcN` suffix for a pre-release.
const MESHCOMOD_TAG = /^companion-(v\d+\.\d+\.\d+\.\d+)(-[A-Za-z]+\d*)?$/

/** Parse a meshcomod release asset: {Device}_{role}-vX.Y.Z.W[-preN]-{sha}[-merged].bin */
export function parseMeshcomodAsset(name: string, url: string): ParsedFile | null {
  for (const rd of MESHCOMOD_ROLES) {
    // Try every occurrence, so `_companion_radio_usb_tcp_touch` cannot match `_companion_radio_usb_tcp`.
    for (let sepIdx = name.indexOf(rd.separator); sepIdx >= 0; sepIdx = name.indexOf(rd.separator, sepIdx + 1)) {
      const m = name.slice(sepIdx + rd.separator.length).match(MESHCOMOD_ASSET_TAIL)
      if (!m) continue
      return { deviceKey: name.slice(0, sepIdx), role: rd.role, versionKey: m[1], isMerged: !!m[2], ext: 'bin', url }
    }
  }
  return null
}

/**
 * Picks the companion releases to list. A stable release is listed as `vX.Y.Z.W`; a
 * pre-release (flagged, or with a `-preN` / `-rcN` tag) as the dev build `vX.Y.Z.W-dev`,
 * like the DMC dev channel. Drafts are skipped (their assets are not public).
 */
function meshcomodReleaseVersions(releases: GHRelease[]): { rel: GHRelease; tagVersion: string; versionKey: string }[] {
  const picked = new Map<string, { rel: GHRelease; tagVersion: string; versionKey: string }>()
  for (const rel of releases) {
    const m = rel.tag_name?.match(MESHCOMOD_TAG)
    if (!m || rel.draft) continue
    const tagVersion = m[1] + (m[2] ?? '')
    const versionKey = rel.prerelease || m[2] ? `${m[1]}-dev` : m[1]
    // Pre-releases of one version share its `-dev` slot: the newest tag wins (pre10 over pre9).
    const prev = picked.get(versionKey)
    if (!prev || tagVersion.localeCompare(prev.tagVersion, undefined, { numeric: true }) > 0) {
      picked.set(versionKey, { rel, tagVersion, versionKey })
    }
  }
  return [...picked.values()]
}

/** Firmware files of the picked releases; an asset must carry its release's version. */
function meshcomodFilesFromReleases(releases: GHRelease[]): ParsedFile[] {
  return meshcomodReleaseVersions(releases).flatMap(({ rel, tagVersion, versionKey }) =>
    (rel.assets ?? []).flatMap(a => {
      const p = parseMeshcomodAsset(a.name, a.browser_download_url)
      return p && p.versionKey === tagVersion ? [{ ...p, versionKey }] : []
    }))
}

// ─── Config builder ───────────────────────────────────────────────────────────

/**
 * Converts a flat list of parsed firmware files into a FlasherConfig.
 *
 * For ESP32 (.bin):  creates "vX – App update" and "vX – Full flash" entries.
 * For nRF52 (.zip):  creates a single "vX" entry (prefers .zip over .uf2).
 * Versions are listed in `compareVersions` order (default: reverse string order).
 */
interface MakerMeta {
  name: string
  repo?: string
  website?: string
}

function buildConfig(
  files: ParsedFile[],
  makerKey: string,
  makerMeta: MakerMeta,
  compareVersions: (a: string, b: string) => number = (a, b) => b.localeCompare(a),
): FlasherConfig {
  // esp32 devices: { `${deviceKey}/${role}/${versionKey}` -> { appUrl, mergedUrl } }
  const esp32Map = new Map<string, { appUrl: string; mergedUrl: string }>()
  // nrf52 devices: { `${deviceKey}/${role}/${versionKey}` -> url }  (zip preferred over uf2)
  const nrf52Map = new Map<string, { url: string; ext: 'zip' | 'uf2' }>()

  for (const f of files) {
    const k = `${f.deviceKey}/${f.role}/${f.versionKey}`

    if (f.ext === 'bin') {
      const entry = esp32Map.get(k) ?? { appUrl: '', mergedUrl: '' }
      if (f.isMerged) entry.mergedUrl = f.url
      else            entry.appUrl    = f.url
      esp32Map.set(k, entry)
    } else {
      // zip preferred over uf2
      const existing = nrf52Map.get(k)
      if (!existing || (f.ext === 'zip' && existing.ext === 'uf2')) {
        nrf52Map.set(k, { url: f.url, ext: f.ext })
      }
    }
  }

  // Group into { deviceKey -> { role -> { versionKey -> ... } } }
  type DeviceMap = Map<string, Map<string, Map<string, { type: 'esp32' | 'nrf52'; appUrl: string; mergedUrl: string }>>>
  const deviceMap: DeviceMap = new Map()

  for (const [k, { appUrl, mergedUrl }] of esp32Map) {
    const [deviceKey, role, versionKey] = k.split('/')
    if (!deviceMap.has(deviceKey)) deviceMap.set(deviceKey, new Map())
    const roleMap = deviceMap.get(deviceKey)!
    if (!roleMap.has(role)) roleMap.set(role, new Map())
    roleMap.get(role)!.set(versionKey, { type: 'esp32', appUrl, mergedUrl })
  }

  for (const [k, { url }] of nrf52Map) {
    const [deviceKey, role, versionKey] = k.split('/')
    if (!deviceMap.has(deviceKey)) deviceMap.set(deviceKey, new Map())
    const roleMap = deviceMap.get(deviceKey)!
    if (!roleMap.has(role)) roleMap.set(role, new Map())
    roleMap.get(role)!.set(versionKey, { type: 'nrf52', appUrl: url, mergedUrl: '' })
  }

  const devices = [...deviceMap.entries()]
    .map(([deviceKey, roleMap]) => {
      // Determine device type from the first file seen
      const firstVersion = [...roleMap.values()][0]
      const firstEntry = firstVersion ? [...firstVersion.values()][0] : null
      const deviceType = firstEntry?.type ?? 'esp32'

      const firmware = [...roleMap.entries()].map(([role, versionMap]) => {
        const roleDisplay = ROLE_DISPLAY[role]

        const version: Record<string, { files: { type: string; name: string; title: string }[]; notes?: string }> = {}

        for (const [versionKey, entry] of [...versionMap.entries()].sort(([a], [b]) => compareVersions(a, b))) {
          if (entry.type === 'esp32') {
            if (entry.appUrl) {
              version[`${versionKey} – App update`] = {
                files: [{ type: 'flash-update', name: entry.appUrl, title: 'App update – keeps bootloader, partition table & config' }],
                notes: 'Updates firmware only. Bootloader and saved settings are preserved.',
              }
            }
            if (entry.mergedUrl) {
              version[`${versionKey} – Full flash`] = {
                files: [{ type: 'flash-wipe', name: entry.mergedUrl, title: 'Full flash – merged binary (bootloader + partition + app)' }],
                notes: 'Flashes the complete merged binary to 0x0. Use for new devices or factory resets. ⚠ Overwrites all existing firmware.',
              }
            }
          } else {
            // nRF52: single firmware file per version
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
        class: 'community' as const,
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

// ─── Merge utility ────────────────────────────────────────────────────────────

export function mergeFlasherConfigs(configs: FlasherConfig[]): FlasherConfig {
  return {
    staticPath: '',
    role:   Object.assign({}, ...configs.map(c => c.role)),
    notice: Object.assign({}, ...configs.map(c => c.notice)),
    maker:  Object.assign({}, ...configs.map(c => c.maker)),
    device: configs.flatMap(c => c.device),
  }
}

// ─── Per-source fetchers ──────────────────────────────────────────────────────

const GH_API = 'https://api.github.com'
const GH_HEADERS = { Accept: 'application/vnd.github.v3+json' }
const COMMUNITY_CACHE_KEY = 'dmt_community_fw_v1'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number }
    return Date.now() - ts < CACHE_TTL_MS ? data : null
  } catch { return null }
}

function writeCache<T>(key: string, data: T): void {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

// Fetch one page of releases – enough to cover all current role types per repo.
// Using a single call instead of paginating keeps us well within the 60 req/hour
// unauthenticated GitHub API rate limit.
async function fetchReleaseAssets(owner: string, repo: string): Promise<GHReleaseAsset[]> {
  const url = `${GH_API}/repos/${owner}/${repo}/releases?per_page=20`
  const resp = await fetch(url, { headers: GH_HEADERS })
  if (!resp.ok) return []
  const releases: GHRelease[] = await resp.json()
  return releases.flatMap(r => r.assets)
}

async function fetchMeshcoreDevConfig(): Promise<FlasherConfig> {
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

/** meshcomod config from the fork's releases, newest version first. No companion release → no devices. */
export function meshcomodConfigFromReleases(releases: GHRelease[]): FlasherConfig {
  return buildConfig(meshcomodFilesFromReleases(releases), 'meshcomod', {
    name: 'Meshcomod (EV Fork) Companion Filter Firmware',
    repo: 'https://github.com/Elektr0Vodka/meshcomod',
  }, (a, b) => b.localeCompare(a, undefined, { numeric: true }))
}

async function fetchMeshcomodConfig(): Promise<FlasherConfig> {
  const url = `${GH_API}/repos/Elektr0Vodka/meshcomod/releases?per_page=100`
  const resp = await fetch(url, { headers: GH_HEADERS })
  if (!resp.ok) throw new Error(`GitHub API ${resp.status}: ${resp.statusText}`)
  const releases: GHRelease[] = await resp.json()
  return meshcomodConfigFromReleases(releases)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetch all community firmware configs.
 *  Prefers the pre-built static JSON (public/community-firmware.json) to avoid
 *  GitHub API rate limiting. Falls back to live GitHub API calls if the file is
 *  missing. Results are cached in sessionStorage for 10 minutes. */
export async function fetchAllCommunityConfigs(): Promise<FlasherConfig> {
  const cached = readCache<FlasherConfig>(COMMUNITY_CACHE_KEY)
  if (cached) return cached

  // Try the pre-built static list first
  try {
    const resp = await fetch('/community-firmware.json')
    if (resp.ok) {
      const data = await resp.json() as FlasherConfig
      if (data.device?.length) {
        writeCache(COMMUNITY_CACHE_KEY, data)
        return data
      }
    }
  } catch {}

  // Fall back to live GitHub API (may hit rate limits on unauthenticated requests)
  const results = await Promise.allSettled([
    fetchMeshcoreDevConfig(),
    fetchMeshcomodConfig(),
  ])

  const configs = results
    .filter((r): r is PromiseFulfilledResult<FlasherConfig> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(c => c.device.length > 0)

  const merged = configs.length
    ? mergeFlasherConfigs(configs)
    : { staticPath: '', role: {}, notice: {}, maker: {}, device: [] as FlasherConfig['device'] }

  writeCache(COMMUNITY_CACHE_KEY, merged)
  return merged
}
