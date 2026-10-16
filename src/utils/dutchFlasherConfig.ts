/**
 * Builds a FlasherConfig from the Dutch MeshCore .prebuilt firmware directory.
 *
 * Files follow the naming pattern:
 *   {DeviceKey}_{firmwareRole}-{version}[-merged].bin
 *
 * Supported MQTT firmware roles:
 *   repeater_observer_mqtt
 *   room_server_observer_mqtt / room_server_mqtt / roomserver_mqtt
 *
 * The non-MQTT repeater, PacketLog and companion (receive filter) releases are
 * handled as their own maker groups (see scripts/update-firmware-list.js), so the
 * flasher shows four DutchMeshCore groups in total.
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
const MESHCORE_REPO        = 'Dutch-MeshCore/MeshCore'
const REPEATER_TAG_PREFIX  = 'dmc-repeater-'
// PacketLog shares the `dmc-repeater-` prefix but is its own maker group.
const PACKETLOG_TAG_PREFIX = 'dmc-repeater-packetlog-'
// Companion firmware with the receive filter: `dmc-companion-dev` / `dmc-companion-vX.Y.Z`.
const COMPANION_TAG_PREFIX = 'dmc-companion-'

const DMC_RELEASES_URL =
  `https://api.github.com/repos/${MESHCORE_REPO}/releases?per_page=100`

// MQTT and non-MQTT repeater firmware are shown as two separate maker groups.
const DMC_MQTT_MAKER      = 'dutchmeshcore'
const DMC_REPEATER_MAKER  = 'dutchmeshcore_repeater'
const DMC_PACKETLOG_MAKER = 'dutchmeshcore_packetlog'
const DMC_COMPANION_MAKER = 'dutchmeshcore_companion'

const DMC_MQTT_MAKER_META = {
  name:    'DutchMeshCore-MQTT-Firmware',
  repo:    'https://github.com/Dutch-MeshCore/MeshCore/releases?q=mqtt',
  website: 'https://dutchmeshcore.nl',
}

const DMC_REPEATER_MAKER_META = {
  name:    'DutchMeshCore Firmware',
  repo:    'https://github.com/Dutch-MeshCore/MeshCore',
  website: 'https://dutchmeshcore.nl',
}

const DMC_PACKETLOG_MAKER_META = {
  name:    'DutchMeshCore-PacketLog-Firmware',
  repo:    'https://github.com/Dutch-MeshCore/MeshCore/releases?q=dmc-repeater-packetlog',
  website: 'https://dutchmeshcore.nl',
}

const DMC_COMPANION_MAKER_META = {
  name:    'DutchMeshCore Companion Filter Firmware',
  repo:    'https://github.com/Dutch-MeshCore/MeshCore/releases?q=dmc-companion',
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
  /** Rolling dev channel (e.g. `observer-mqtt-dev`): the version comes from the
   *  filename and is labelled `<semver>-dev` so it never collides with the stable
   *  MQTT builds of the same semver. */
  devChannel?: boolean
}

interface FirmwareVariant {
  versionKey: string     // e.g. "v1.15.0"
  mergedUrl:  string     // full flash - address 0x0
  appUrl:     string     // app-only - address 0x10000
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
    const versionKey = f.devChannel
      ? `${parsed.versionKey.replace(/^v/, '')}-dev`
      : f.version ?? parsed.versionKey

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
                `${versionKey} - App update`,
                {
                  files: [{
                    type: 'flash-update' as const,
                    name: appUrl,
                    title: 'App update - keeps bootloader, partition table & config',
                  }],
                  notes: 'Updates firmware only. Bootloader and saved settings (pubkey, config) are preserved.',
                },
              ]] : []),
              ...(mergedUrl ? [[
                `${versionKey} - Full flash`,
                {
                  files: [{
                    type: 'flash-wipe' as const,
                    name: mergedUrl,
                    title: 'Full flash - merged bin (bootloader + partition + app)',
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

interface ReleaseRoleDef {
  separator: string
  role:      string
  icon:      string
  title:     string
  subTitle:  string
}

const REPEATER_ROLE: ReleaseRoleDef = {
  separator: '_repeater-',
  role:      'dutchmeshcore_repeater',
  icon:      '📡',
  title:     'DutchMeshCore Repeater',
  subTitle:  'Repeater (non-MQTT)',
}

const PACKETLOG_ROLE: ReleaseRoleDef = {
  separator: '_repeater-',
  role:      'dutchmeshcore_packetlog',
  icon:      '📝',
  title:     'DutchMeshCore Repeater PacketLog',
  subTitle:  'Repeater + packet logging',
}

// DMC companion firmware with the receive filter. Role keys are kept distinct from
// meshcomod's `companion_radio_*` roles (see communityFirmwareConfigs.ts).
const COMPANION_ROLES: ReleaseRoleDef[] = [
  {
    separator: '_companion_radio_ble-',
    role:      'dutchmeshcore_companion_ble',
    icon:      '📻',
    title:     'DutchMeshCore Companion',
    subTitle:  'BLE + receive filter',
  },
  {
    separator: '_companion_radio_wifi-',
    role:      'dutchmeshcore_companion_wifi',
    icon:      '📶',
    title:     'DutchMeshCore Companion',
    subTitle:  'Wi-Fi + receive filter',
  },
]

// buildReleaseGroupConfig is shared by the plain repeater, PacketLog and companion
// groups; these options select the maker, the tag prefix and the roles (one per asset
// separator) for each.
interface ReleaseGroupOpts {
  maker:     string
  makerMeta: { name: string; repo: string; website: string }
  roles:     ReleaseRoleDef[]
  tagPrefix: string
  /** Drop an app .bin when the same device/role/version also ships a .uf2/.zip (the
   *  RP2040 companion Wi-Fi builds ship both; the flasher cannot write an RP2040 .bin). */
  preferImage?: boolean
}
const REPEATER_OPTS: ReleaseGroupOpts = {
  maker: DMC_REPEATER_MAKER, makerMeta: DMC_REPEATER_MAKER_META, roles: [REPEATER_ROLE], tagPrefix: REPEATER_TAG_PREFIX,
}
const PACKETLOG_OPTS: ReleaseGroupOpts = {
  maker: DMC_PACKETLOG_MAKER, makerMeta: DMC_PACKETLOG_MAKER_META, roles: [PACKETLOG_ROLE], tagPrefix: PACKETLOG_TAG_PREFIX,
}
const COMPANION_OPTS: ReleaseGroupOpts = {
  maker: DMC_COMPANION_MAKER, makerMeta: DMC_COMPANION_MAKER_META, roles: COMPANION_ROLES, tagPrefix: COMPANION_TAG_PREFIX,
  preferImage: true,
}

interface GHReleaseAsset {
  name: string
  browser_download_url: string
}

interface GHRelease {
  tag_name: string
  draft?: boolean
  assets: GHReleaseAsset[]
}

function extOf(name: string): 'bin' | 'uf2' | 'zip' | null {
  if (name.endsWith('.bin')) return 'bin'
  if (name.endsWith('.uf2')) return 'uf2'
  if (name.endsWith('.zip')) return 'zip'
  return null
}

/**
 * Derive the display version from a release tag: dmc-repeater-v1.16.0-dev → 1.16.0-dev.
 * A rolling dev tag (`dmc-repeater-dev`, `dmc-repeater-packetlog-dev`, `dmc-companion-dev`)
 * has no semver, so the semver comes from the asset filename after the role separator
 * (`{Device}_repeater-v1.17.1-{hash}.bin`) and is labelled `1.17.1-dev`, matching the
 * MQTT `observer-mqtt-dev` builds. Mirrors repeaterVersion() in update-firmware-list.js.
 */
function repeaterVersion(tag: string, prefix: string, assetName: string, separator: string): string {
  const fromTag = tag.replace(prefix, '').replace(/^v/, '')
  if (/^\d+\.\d+\.\d+/.test(fromTag) || !/(?:^|[-_])dev$/i.test(fromTag)) return fromTag
  const sepIdx = assetName.indexOf(separator)
  const tail = sepIdx < 0 ? '' : assetName.slice(sepIdx + separator.length)
  const semver = tail.match(/^v?(\d+\.\d+\.\d+)/)?.[1]
  return semver ? `${semver}-dev` : fromTag
}

/**
 * Build a FlasherConfig for one maker group from its GitHub Releases. The version
 * comes from the release tag (see repeaterVersion). Handles esp32 (.bin app/merged)
 * and nRF52 (.uf2/.zip) devices; each matching role becomes one firmware entry.
 */
function buildReleaseGroupConfig(releases: GHRelease[], opts: ReleaseGroupOpts): FlasherConfig {
  type Variant = { type: 'esp32' | 'nrf52'; appUrl: string; mergedUrl: string }
  type ParsedAsset = { deviceKey: string; role: string; versionKey: string; ext: 'bin' | 'uf2' | 'zip'; isMerged: boolean; url: string }

  const parsed: ParsedAsset[] = []
  for (const release of releases) {
    for (const asset of release.assets) {
      const ext = extOf(asset.name)
      if (!ext) continue
      const roleDef = opts.roles.find(r => asset.name.includes(r.separator))
      if (!roleDef) continue
      parsed.push({
        deviceKey:  asset.name.slice(0, asset.name.indexOf(roleDef.separator)),
        role:       roleDef.role,
        versionKey: repeaterVersion(release.tag_name, opts.tagPrefix, asset.name, roleDef.separator),
        ext,
        isMerged:   asset.name.endsWith(`-merged.${ext}`),
        url:        asset.browser_download_url,
      })
    }
  }

  const imageKey = (a: ParsedAsset) => `${a.deviceKey}/${a.role}/${a.versionKey}`
  const hasImage = new Set(opts.preferImage ? parsed.filter(a => a.ext !== 'bin').map(imageKey) : [])
  const assets = parsed.filter(a => a.ext !== 'bin' || !hasImage.has(imageKey(a)))

  // deviceKey -> role -> versionKey -> Variant
  const deviceMap = new Map<string, Map<string, Map<string, Variant>>>()

  for (const a of assets) {
    if (!deviceMap.has(a.deviceKey)) deviceMap.set(a.deviceKey, new Map())
    const roles = deviceMap.get(a.deviceKey)!
    if (!roles.has(a.role)) roles.set(a.role, new Map())
    const versions = roles.get(a.role)!
    const existing = versions.get(a.versionKey)

    if (a.ext === 'bin') {
      const entry = existing ?? { type: 'esp32' as const, appUrl: '', mergedUrl: '' }
      versions.set(a.versionKey, a.isMerged
        ? { ...entry, type: 'esp32', mergedUrl: a.url }
        : { ...entry, type: 'esp32', appUrl: a.url })
    } else if (!existing || (a.ext === 'zip' && existing.appUrl.endsWith('.uf2'))) {
      // nRF52: single file per version, prefer .zip (DFU) over .uf2
      versions.set(a.versionKey, { ...(existing ?? { mergedUrl: '' }), type: 'nrf52', appUrl: a.url })
    }
  }

  const devices: FlasherDevice[] = [...deviceMap.entries()]
    .map(([deviceKey, roleMap]) => {
      const deviceType = [...([...roleMap.values()][0]?.values() ?? [])][0]?.type ?? 'esp32'

      const firmware = opts.roles
        .filter((roleDef, i, all) => all.findIndex(r => r.role === roleDef.role) === i)
        .filter(roleDef => roleMap.has(roleDef.role))
        .map(roleDef => {
          const versionMap = roleMap.get(roleDef.role)!
          const version: FlasherDevice['firmware'][number]['version'] = {}

          for (const [versionKey, entry] of [...versionMap.entries()].sort(([a], [b]) => b.localeCompare(a))) {
            if (entry.type === 'esp32') {
              if (entry.appUrl) {
                version[`${versionKey} - App update`] = {
                  files: [{ type: 'flash-update', name: entry.appUrl, title: 'App update - keeps bootloader, partition table & config' }],
                  notes: 'Updates firmware only. Bootloader and saved settings (pubkey, config) are preserved.',
                }
              }
              if (entry.mergedUrl) {
                version[`${versionKey} - Full flash`] = {
                  files: [{ type: 'flash-wipe', name: entry.mergedUrl, title: 'Full flash - merged bin (bootloader + partition + app)' }],
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
            role: roleDef.role,
            tooltip: deviceType === 'esp32'
              ? 'App update keeps bootloader & settings. Full flash is for new or factory-reset devices.'
              : undefined,
            version,
          }
        })

      return {
        maker: opts.maker,
        class: 'community' as const,
        name:  DEVICE_LABELS[deviceKey] ?? deviceKey.replace(/_/g, ' '),
        type:  deviceType,
        firmware,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    staticPath: '',
    role: Object.fromEntries(
      opts.roles.map(({ role, icon, title, subTitle }) => [role, { icon, title, subTitle }])
    ),
    notice: {},
    maker: { [opts.maker]: opts.makerMeta },
    device: devices,
  }
}

/**
 * Build a FlasherConfig from `dmc-repeater-*` GitHub Releases. Filenames carry no
 * semver (`{Device}_repeater-dev-{hash}[-merged].{ext}`) so the version comes from
 * the release tag. Handles esp32 (.bin app/merged) and nRF52 (.uf2/.zip) devices.
 */
export function buildDmcRepeaterConfig(releases: GHRelease[]): FlasherConfig {
  return buildReleaseGroupConfig(releases, REPEATER_OPTS)
}

/** PacketLog repeater firmware (`dmc-repeater-packetlog-*` releases) – same builder,
 *  own maker/role/tag-prefix. Rendered as a separate group in the flasher. */
export function buildDmcPacketlogConfig(releases: GHRelease[]): FlasherConfig {
  return buildReleaseGroupConfig(releases, PACKETLOG_OPTS)
}

/**
 * DMC companion firmware with the receive filter (`dmc-companion-*` releases: the
 * rolling `dmc-companion-dev` prerelease and versioned `dmc-companion-vX.Y.Z`). Assets
 * are `{Device}_companion_radio_ble-…` / `{Device}_companion_radio_wifi-…`, one role
 * each. Releases with another tag prefix and drafts are ignored. Mirrors
 * dmcCompanionConfigFromReleases() in update-firmware-list.js.
 */
export function buildDmcCompanionConfig(releases: GHRelease[]): FlasherConfig {
  return buildReleaseGroupConfig(
    releases.filter(r => r.tag_name.startsWith(COMPANION_TAG_PREFIX) && !r.draft),
    COMPANION_OPTS,
  )
}

/**
 * Combine DMC configs (repeater, PacketLog, MQTT, companion) into one FlasherConfig carrying every
 * maker - they render as separate groups (repeater first) in the flasher.
 */
export function mergeDmcConfigs(...configs: FlasherConfig[]): FlasherConfig {
  return {
    staticPath: '',
    role:   Object.assign({}, ...configs.map(c => c.role)),
    notice: Object.assign({}, ...configs.map(c => c.notice)),
    maker:  Object.assign({}, ...configs.map(c => c.maker)),
    device: configs.flatMap(c => c.device),
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
  // config; `dmc-repeater-*` releases feed the non-MQTT repeater config; and the
  // `dmc-repeater-packetlog-*` subset feeds the PacketLog config; `dmc-companion-*`
  // releases feed the companion (receive filter) config.
  const releases = await fetchMeshcoreReleases()

  const mqttFiles: GHFile[] = releases
    .filter(r => /mqtt/i.test(r.tag_name))
    .flatMap(r => {
      const version = dmcTagVersion(r.tag_name)
      // Rolling dev channel (e.g. `observer-mqtt-dev`): tag has no semver, so the
      // filename semver is used and labelled `-dev` (see buildDmcConfig).
      const devChannel = !version && /(?:^|[-_])dev$/i.test(r.tag_name)
      return r.assets.map(a => ({ name: a.name, download_url: a.browser_download_url, version, devChannel }))
    })
  // PacketLog shares the `dmc-repeater-` prefix, so keep the two release sets disjoint.
  const packetlogReleases = releases.filter(r => r.tag_name.startsWith(PACKETLOG_TAG_PREFIX))
  const repeaterReleases  = releases.filter(r =>
    r.tag_name.startsWith(REPEATER_TAG_PREFIX) && !r.tag_name.startsWith(PACKETLOG_TAG_PREFIX))

  const config = mergeDmcConfigs(
    buildDmcRepeaterConfig(repeaterReleases),
    buildDmcPacketlogConfig(packetlogReleases),
    buildDmcConfig(mqttFiles),
    buildDmcCompanionConfig(releases),
  )
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
