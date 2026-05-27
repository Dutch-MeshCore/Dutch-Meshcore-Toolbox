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
  heltec_v4:                  'Heltec V4',
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

    const device = map.get(parsed.deviceKey) ?? { deviceKey: parsed.deviceKey, roles: new Map() }
    const role = device.roles.get(parsed.role) ?? { role: parsed.role, versions: new Map() }
    const variant = role.versions.get(parsed.versionKey) ?? {
      versionKey: parsed.versionKey,
      mergedUrl: '',
      appUrl: '',
    }

    if (parsed.isMerged) variant.mergedUrl = url
    else                 variant.appUrl = url

    role.versions.set(parsed.versionKey, variant)
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
