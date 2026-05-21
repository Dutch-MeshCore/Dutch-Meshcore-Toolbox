/**
 * Builds a FlasherConfig from the Dutch MeshCore .prebuilt firmware directory.
 *
 * Files follow the naming pattern:
 *   {DeviceKey}_repeater_observer_mqtt-{version}[-merged].bin
 *
 * The GitHub API is queried at runtime so the flasher automatically picks up
 * new firmware releases whenever the branch is updated.
 */

import type { FlasherConfig } from '../types'

const PREBUILT_REPO   = 'Dutch-MeshCore/DutchMeshCore.nl-MQTT'
const PREBUILT_BRANCH = 'mqtt-bridge-implementation-flex-dmc'

export const PREBUILT_API_URL =
  `https://api.github.com/repos/${PREBUILT_REPO}/contents/.prebuilt?ref=${PREBUILT_BRANCH}`

export const PREBUILT_RAW_BASE =
  `https://raw.githubusercontent.com/${PREBUILT_REPO}/${PREBUILT_BRANCH}/.prebuilt`

/** Human-readable labels for each device key found in the filenames. */
const DEVICE_LABELS: Record<string, string> = {
  Heltec_T190:                'Heltec T190',
  Heltec_WSL3:                'Heltec WSL3',
  Heltec_v3:                  'Heltec V3',
  Heltec_v4:                  'Heltec V4',
  heltec_v4_expansionkit:     'Heltec V4 Expansion Kit',
  LilyGo_T3S3_sx1262:         'LilyGo T3S3 SX1262',
  LilyGo_TLora_V2_1_1_6:     'LilyGo T-LoRa V2.1.1.6',
  RAK_3112:                   'RAK3112',
  Station_G2:                 'Station G2',
  T_Beam_S3_Supreme_SX1262:   'T-Beam S3 Supreme SX1262',
  Tbeam_SX1262:               'T-Beam SX1262',
  Tbeam_SX1276:               'T-Beam SX1276',
  Xiao_S3_WIO:                'Xiao S3 WIO',
}

/** The fixed role segment that separates the device key from the version. */
const ROLE_SEP = '_repeater_observer_mqtt-'

interface GHFile {
  name: string
  download_url: string | null
}

interface DeviceEntry {
  deviceKey: string
  versionKey: string     // e.g. "v1.15.0"
  mergedUrl:  string     // full flash — address 0x0
  appUrl:     string     // app-only — address 0x10000
}

/**
 * Parse a list of GitHub API file objects into a FlasherConfig.
 * Each pair of `{Device}...bin` / `{Device}...-merged.bin` becomes one
 * FlasherDevice entry with both file variants in the same version.
 */
export function buildDmcConfig(files: GHFile[]): FlasherConfig {
  const map = new Map<string, DeviceEntry>()

  for (const f of files) {
    if (!f.name.endsWith('.bin')) continue

    const sepIdx = f.name.indexOf(ROLE_SEP)
    if (sepIdx < 0) continue

    const deviceKey  = f.name.slice(0, sepIdx)
    // rest = "v1.15.0-dutchmeshcore.nl-ebb7801d[-merged].bin"
    const rest       = f.name.slice(sepIdx + ROLE_SEP.length)
    const isMerged   = rest.endsWith('-merged.bin')
    const versionFull = isMerged
      ? rest.slice(0, -'-merged.bin'.length)
      : rest.slice(0, -'.bin'.length)

    // Use only the semver part (v1.15.0) as the visible dropdown key
    const versionKey = versionFull.match(/^(v\d+\.\d+\.\d+)/)?.[1] ?? versionFull

    // Prefer the download_url from the API; construct a fallback if null
    const url = f.download_url ?? `${PREBUILT_RAW_BASE}/${f.name}`

    const entry = map.get(deviceKey) ?? { deviceKey, versionKey, mergedUrl: '', appUrl: '' }
    if (isMerged) entry.mergedUrl = url
    else          entry.appUrl   = url
    map.set(deviceKey, entry)
  }

  const devices = [...map.values()]
    .map(({ deviceKey, versionKey, mergedUrl, appUrl }) => ({
      maker: 'dutchmeshcore',
      class: 'community' as const,
      name: DEVICE_LABELS[deviceKey] ?? deviceKey.replace(/_/g, ' '),
      type: 'esp32' as const,
      firmware: [{
        role: 'dutchmeshcore_mqtt',
        tooltip: 'App update keeps bootloader & settings. Full flash is for new or factory-reset devices.',
        version: {
          // App update first — the common case for existing devices
          ...(appUrl ? {
            [`${versionKey} — App update`]: {
              files: [{
                type: 'flash-update' as const,
                name: appUrl,
                title: 'App update — keeps bootloader, partition table & config',
              }],
              notes: 'Updates firmware only. Bootloader and saved settings (pubkey, config) are preserved.',
            },
          } : {}),
          // Full flash second — for new or factory-reset devices
          ...(mergedUrl ? {
            [`${versionKey} — Full flash`]: {
              files: [{
                type: 'flash-wipe' as const,
                name: mergedUrl,
                title: 'Full flash — merged bin (bootloader + partition + app)',
              }],
              notes: 'Flashes the complete merged binary to 0x0. Use for new devices or factory resets. ⚠ Overwrites all existing firmware.',
            },
          } : {}),
        },
      }],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    staticPath: '',
    role: {
      dutchmeshcore_mqtt: {
        icon:     '📡',
        title:    'DutchMeshCore MQTT',
        subTitle: 'Repeater + Observer + MQTT',
      },
    },
    notice:  {},
    maker:   { dutchmeshcore: { name: 'DutchMeshCore' } },
    device:  devices,
  }
}

/** Fetch the .prebuilt directory listing from GitHub and build a FlasherConfig. */
export async function fetchDmcConfig(): Promise<FlasherConfig> {
  const resp = await fetch(PREBUILT_API_URL, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  })
  if (!resp.ok) throw new Error(`GitHub API ${resp.status}: ${resp.statusText}`)
  const files: GHFile[] = await resp.json()
  return buildDmcConfig(files)
}
