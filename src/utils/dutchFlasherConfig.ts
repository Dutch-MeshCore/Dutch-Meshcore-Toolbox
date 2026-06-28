/**
 * Builds a FlasherConfig from the Dutch MeshCore .prebuilt firmware directory.
 *
 * Files follow the naming pattern:
 *   {DeviceKey}_{firmwareRole}-{version}[-merged].bin
 *
 * Supported firmware roles:
 *   repeater_observer_mqtt
 *   room_server_observer_mqtt
 *
 * The GitHub API is queried at runtime so the flasher automatically picks up
 * new firmware releases whenever the branch is updated.
 */

import type { FlasherConfig, FlasherDevice } from '../types'

const PREBUILT_REPO   = 'Dutch-MeshCore/DutchMeshCore.nl-MQTT'
const PREBUILT_BRANCH = 'mqtt-bridge-implementation-flex-dmc'

// Retained as the legacy raw-URL fallback inside buildDmcConfig (release assets
// always carry a download_url, so it is effectively unused for live fetches).
export const PREBUILT_RAW_BASE =
  `https://raw.githubusercontent.com/${PREBUILT_REPO}/${PREBUILT_BRANCH}/.prebuilt`

// All DMC firmware is published as GitHub Releases on the fork below: tags containing
// `mqtt` are the MQTT bridge firmware; `dmc-repeater-*` tags are the non-MQTT repeater.
const MESHCORE_REPO       = 'Dutch-MeshCore/MeshCore'
const REPEATER_TAG_PREFIX = 'dmc-repeater-'

const DMC_RELEASES_URL =
  `https://api.github.com/repos/${MESHCORE_REPO}/releases?per_page=100`

// MQTT and non-MQTT repeater firmware are shown as two separate maker groups.
const DMC_MQTT_MAKER     = 'dutchmeshcore'
const DMC_REPEATER_MAKER = 'dutchmeshcore_repeater'

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

/** Human-readable labels for each device key found in the filenames. */
const DEVICE_LABELS: Record<string, string> = {
  Heltec_T190:                'Heltec T190',
  Heltec_t114:                'Heltec T114',
  Heltec_WSL3:                'Heltec WSL3',
  Heltec_v3:                  'Heltec V3',
  Heltec_v4:                  'Heltec V4',
  heltec_v4:                  'Heltec V4',
  heltec_v4_expansionkit:     'Heltec V4 Expansion Kit',
  'LilyGo_T-Echo':            'LilyGo T-Echo',
  LilyGo_T3S3_sx1262:         'LilyGo T3S3 SX1262',
  LilyGo_TLora_V2_1_1_6:     'LilyGo T-LoRa V2.1.1.6',
  RAK_3112:                   'RAK3112',
  RAK_4631:                   'RAK4631',
  SenseCap_Solar:             'SenseCAP Solar',
  Station_G2:                 'Station G2',
  T_Beam_S3_Supreme_SX1262:   'T-Beam S3 Supreme SX1262',
  Tbeam_SX1262:               'T-Beam SX1262',
  Tbeam_SX1276:               'T-Beam SX1276',
  Xiao_S3_WIO:                'Xiao S3 WIO',
}

const ROLE_DEFS = [
  {
    separator: '_repeater_observer_mqtt-',
    role: 'dutchmeshcore_mqtt',
    icon: '📡',
    title: 'DutchMeshCore MQTT',
    subTitle: 'Repeater + Observer + MQTT',
  },
  {
    separator: '_room_server_observer_mqtt-',
    role: 'dutchmeshcore_roomserver_mqtt',
    icon: '🏠',
    title: 'DutchMeshCore Roomserver MQTT',
    subTitle: 'Room Server + Observer + MQTT',
  },
  {
    separator: '_room_server_mqtt-',
    role: 'dutchmeshcore_roomserver_mqtt',
    icon: '🏠',
    title: 'DutchMeshCore Roomserver MQTT',
    subTitle: 'Room Server + MQTT',
  },
  {
    separator: '_roomserver_mqtt-',
    role: 'dutchmeshcore_roomserver_mqtt',
    icon: '🏠',
    title: 'DutchMeshCore Roomserver MQTT',
    subTitle: 'Room Server + MQTT',
  },
] as const

const ROLE_ORDER = ROLE_DEFS.filter(
  (roleDef, index, all) => all.findIndex(def => def.role === roleDef.role) === index
)

interface GHFile {
  name: string
  download_url: string | null
  /** Optional version override (e.g. derived from a release tag) used when the
   *  asset filename carries no semver. Falls back to the parsed filename version. */
  version?: string
}

interface FirmwareVariant {
  versionKey: string     // e.g. "v1.15.0"
  mergedUrl:  string     // full flash — address 0x0
  appUrl:     string     // app-only — address 0x10000
}

interface RoleEntry {
  role: string
  versions: Map<string, FirmwareVariant>
}

interface DeviceEntry {
  deviceKey: string
  roles: Map<string, RoleEntry>
}

function parseFirmwareName(name: string) {
  for (const roleDef of ROLE_DEFS) {
    const sepIdx = name.indexOf(roleDef.separator)
    if (sepIdx < 0) continue

    const deviceKey = name.slice(0, sepIdx)
    const rest = name.slice(sepIdx + roleDef.separator.length)
    const isMerged = rest.endsWith('-merged.bin')
    const versionFull = isMerged
      ? rest.slice(0, -'-merged.bin'.length)
      : rest.slice(0, -'.bin'.length)
    const versionKey = versionFull.match(/^(v?\d+\.\d+\.\d+)/)?.[1] ?? versionFull

    return { deviceKey, role: roleDef.role, versionKey, isMerged }
  }

  return null
}

/**
 * Parse a list of GitHub API file objects into a FlasherConfig.
 * Each pair of `{Device}_{Role}...bin` / `{Device}_{Role}...-merged.bin`
 * becomes one firmware role with both file variants in the same version.
 */
export function buildDmcConfig(files: GHFile[]): FlasherConfig {
  const map = new Map<string, DeviceEntry>()

  for (const f of files) {
    if (!f.name.endsWith('.bin')) continue

    const parsed = parseFirmwareName(f.name)
    if (!parsed) continue

    // Prefer the download_url from the API; construct a fallback if null
    const url = f.download_url ?? `${PREBUILT_RAW_BASE}/${f.name}`
    // Release tags carry the canonical version; some assets (e.g. room-server) have
    // only `dev-<hash>` in the filename, so prefer the tag-derived override.
    const versionKey = f.version ?? parsed.versionKey

    const device = map.get(parsed.deviceKey) ?? { deviceKey: parsed.deviceKey, roles: new Map() }
    const role = device.roles.get(parsed.role) ?? { role: parsed.role, versions: new Map() }
    const variant = role.versions.get(versionKey) ?? {
      versionKey,
      mergedUrl: '',
      appUrl: '',
    }

    if (parsed.isMerged) variant.mergedUrl = url
    else                 variant.appUrl = url

    role.versions.set(versionKey, variant)
    device.roles.set(parsed.role, role)
    map.set(parsed.deviceKey, device)
  }

  const devices = [...map.values()]
    .map(({ deviceKey, roles }) => {
      const firmware = ROLE_ORDER
        .map(roleDef => roles.get(roleDef.role))
        .filter((role): role is RoleEntry => Boolean(role))
        .map(role => ({
          role: role.role,
          tooltip: 'App update keeps bootloader & settings. Full flash is for new or factory-reset devices.',
          version: Object.fromEntries(
            [...role.versions.values()].flatMap(({ versionKey, mergedUrl, appUrl }) => [
              ...(appUrl ? [[
                `${versionKey} — App update`,
                {
                  files: [{
                    type: 'flash-update' as const,
                    name: appUrl,
                    title: 'App update — keeps bootloader, partition table & config',
                  }],
                  notes: 'Updates firmware only. Bootloader and saved settings (pubkey, config) are preserved.',
                },
              ]] : []),
              ...(mergedUrl ? [[
                `${versionKey} — Full flash`,
                {
                  files: [{
                    type: 'flash-wipe' as const,
                    name: mergedUrl,
                    title: 'Full flash — merged bin (bootloader + partition + app)',
                  }],
                  notes: 'Flashes the complete merged binary to 0x0. Use for new devices or factory resets. ⚠ Overwrites all existing firmware.',
                },
              ]] : []),
            ])
          ),
        }))

      return {
        maker: 'dutchmeshcore',
        class: 'community' as const,
        name: DEVICE_LABELS[deviceKey] ?? deviceKey.replace(/_/g, ' '),
        type: 'esp32' as const,
        firmware,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    staticPath: '',
    role: Object.fromEntries(
      ROLE_ORDER.map(({ role, icon, title, subTitle }) => [role, { icon, title, subTitle }])
    ),
    notice:  {},
    maker:   { [DMC_MQTT_MAKER]: DMC_MQTT_MAKER_META },
    device:  devices,
  }
}

// ─── Non-MQTT repeater firmware (GitHub Releases) ───────────────────────────────

const REPEATER_SEPARATOR = '_repeater-'
const REPEATER_ROLE = {
  role:     'dutchmeshcore_repeater',
  icon:     '📡',
  title:    'DutchMeshCore Repeater',
  subTitle: 'Repeater (non-MQTT)',
} as const

interface GHReleaseAsset {
  name: string
  browser_download_url: string
}

interface GHRelease {
  tag_name: string
  assets: GHReleaseAsset[]
}

function extOf(name: string): 'bin' | 'uf2' | 'zip' | null {
  if (name.endsWith('.bin')) return 'bin'
  if (name.endsWith('.uf2')) return 'uf2'
  if (name.endsWith('.zip')) return 'zip'
  return null
}

/** Derive the display version from a release tag: dmc-repeater-v1.16.0-dev → 1.16.0-dev */
function repeaterVersion(tag: string): string {
  return tag.replace(REPEATER_TAG_PREFIX, '').replace(/^v/, '')
}

/**
 * Build a FlasherConfig from `dmc-repeater-*` GitHub Releases. Filenames carry no
 * semver (`{Device}_repeater-dev-{hash}[-merged].{ext}`) so the version comes from
 * the release tag. Handles esp32 (.bin app/merged) and nRF52 (.uf2/.zip) devices.
 */
export function buildDmcRepeaterConfig(releases: GHRelease[]): FlasherConfig {
  type Variant = { type: 'esp32' | 'nrf52'; appUrl: string; mergedUrl: string }
  // deviceKey -> versionKey -> Variant
  const deviceMap = new Map<string, Map<string, Variant>>()

  const setVariant = (deviceKey: string, versionKey: string, patch: Partial<Variant> & { type: Variant['type'] }) => {
    if (!deviceMap.has(deviceKey)) deviceMap.set(deviceKey, new Map())
    const versions = deviceMap.get(deviceKey)!
    const entry = versions.get(versionKey) ?? { type: patch.type, appUrl: '', mergedUrl: '' }
    versions.set(versionKey, { ...entry, ...patch })
  }

  for (const release of releases) {
    const versionKey = repeaterVersion(release.tag_name)
    for (const asset of release.assets) {
      const ext = extOf(asset.name)
      if (!ext) continue
      const sepIdx = asset.name.indexOf(REPEATER_SEPARATOR)
      if (sepIdx < 0) continue

      const deviceKey = asset.name.slice(0, sepIdx)
      const url = asset.browser_download_url

      if (ext === 'bin') {
        const isMerged = asset.name.endsWith('-merged.bin')
        setVariant(deviceKey, versionKey, isMerged
          ? { type: 'esp32', mergedUrl: url }
          : { type: 'esp32', appUrl: url })
      } else {
        // nRF52: single file per version, prefer .zip (DFU) over .uf2
        const existing = deviceMap.get(deviceKey)?.get(versionKey)
        if (!existing || (ext === 'zip' && existing.appUrl.endsWith('.uf2'))) {
          setVariant(deviceKey, versionKey, { type: 'nrf52', appUrl: url })
        }
      }
    }
  }

  const devices: FlasherDevice[] = [...deviceMap.entries()]
    .map(([deviceKey, versionMap]) => {
      const deviceType = [...versionMap.values()][0]?.type ?? 'esp32'
      const version: FlasherDevice['firmware'][number]['version'] = {}

      for (const [versionKey, entry] of [...versionMap.entries()].sort(([a], [b]) => b.localeCompare(a))) {
        if (entry.type === 'esp32') {
          if (entry.appUrl) {
            version[`${versionKey} — App update`] = {
              files: [{ type: 'flash-update', name: entry.appUrl, title: 'App update — keeps bootloader, partition table & config' }],
              notes: 'Updates firmware only. Bootloader and saved settings (pubkey, config) are preserved.',
            }
          }
          if (entry.mergedUrl) {
            version[`${versionKey} — Full flash`] = {
              files: [{ type: 'flash-wipe', name: entry.mergedUrl, title: 'Full flash — merged bin (bootloader + partition + app)' }],
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
        maker: DMC_REPEATER_MAKER,
        class: 'community' as const,
        name:  DEVICE_LABELS[deviceKey] ?? deviceKey.replace(/_/g, ' '),
        type:  deviceType,
        firmware: [{
          role: REPEATER_ROLE.role,
          tooltip: deviceType === 'esp32'
            ? 'App update keeps bootloader & settings. Full flash is for new or factory-reset devices.'
            : undefined,
          version,
        }],
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    staticPath: '',
    role: { [REPEATER_ROLE.role]: { icon: REPEATER_ROLE.icon, title: REPEATER_ROLE.title, subTitle: REPEATER_ROLE.subTitle } },
    notice: {},
    maker: { [DMC_REPEATER_MAKER]: DMC_REPEATER_MAKER_META },
    device: devices,
  }
}

/**
 * Combine the repeater and MQTT DMC configs into one FlasherConfig that carries
 * both makers — they render as two separate groups (repeater first) in the flasher.
 */
export function mergeDmcConfigs(repeater: FlasherConfig, mqtt: FlasherConfig): FlasherConfig {
  return {
    staticPath: '',
    role:   { ...mqtt.role, ...repeater.role },
    notice: { ...mqtt.notice, ...repeater.notice },
    maker:  { ...mqtt.maker, ...repeater.maker },
    device: [...repeater.device, ...mqtt.device],
  }
}

const DMC_CACHE_KEY = 'dmt_dmc_fw_v1'
const CACHE_TTL_MS  = 10 * 60 * 1000 // 10 minutes

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

/** Fetch the .prebuilt directory listing from GitHub and build a FlasherConfig.
 *  Prefers the pre-built static JSON (public/dmc-firmware.json) to avoid
 *  GitHub API rate limiting. Falls back to live GitHub API if the file is missing. */
export async function fetchDmcConfig(): Promise<FlasherConfig> {
  const cached = readCache<FlasherConfig>(DMC_CACHE_KEY)
  if (cached) return cached

  // Try the pre-built static list first
  try {
    const resp = await fetch('/dmc-firmware.json')
    if (resp.ok) {
      const data = await resp.json() as FlasherConfig
      if (data.device?.length) {
        writeCache(DMC_CACHE_KEY, data)
        return data
      }
    }
  } catch {}

  // Fall back to the live GitHub API (may hit rate limits unauthenticated). All DMC
  // firmware lives in MeshCore releases: `mqtt`-tagged releases feed the MQTT bridge
  // config; `dmc-repeater-*` releases feed the non-MQTT repeater config.
  const releases = await fetchMeshcoreReleases()

  const mqttFiles: GHFile[] = releases
    .filter(r => /mqtt/i.test(r.tag_name))
    .flatMap(r => {
      const version = dmcTagVersion(r.tag_name)
      return r.assets.map(a => ({ name: a.name, download_url: a.browser_download_url, version }))
    })
  const repeaterReleases = releases.filter(r => r.tag_name.startsWith(REPEATER_TAG_PREFIX))

  const config = mergeDmcConfigs(buildDmcRepeaterConfig(repeaterReleases), buildDmcConfig(mqttFiles))
  writeCache(DMC_CACHE_KEY, config)
  return config
}

/** Extract a semver-ish version from a release tag, e.g. `repeater-mqtt-v1.16.0`
 *  -> `1.16.0`, `dmc-room-server-mqtt-v1.16.0-dev` -> `1.16.0-dev`. The `v` is
 *  stripped to match the repeater list's label style. */
function dmcTagVersion(tag: string): string | undefined {
  return tag.match(/v?\d+\.\d+\.\d+(?:-[\w.]+)?/)?.[0]?.replace(/^v/, '')
}

async function fetchMeshcoreReleases(): Promise<GHRelease[]> {
  const resp = await fetch(DMC_RELEASES_URL, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  })
  if (!resp.ok) throw new Error(`GitHub API ${resp.status}: ${resp.statusText}`)
  return resp.json()
}
