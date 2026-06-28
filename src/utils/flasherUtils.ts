import type { FlasherDevice, DeviceGroups, DeviceFirmware, FlasherRoleDef } from '../types'

export function groupDevicesByClass(devices: FlasherDevice[]): DeviceGroups {
  return devices.reduce<DeviceGroups>((acc, device) => {
    const key = device.class
    if (!acc[key]) acc[key] = []
    acc[key]!.push(device)
    return acc
  }, {})
}

export function groupDevicesByMaker(devices: FlasherDevice[]): Record<string, FlasherDevice[]> {
  return devices.reduce<Record<string, FlasherDevice[]>>((acc, device) => {
    const key = device.maker
    if (!acc[key]) acc[key] = []
    acc[key]!.push(device)
    return acc
  }, {})
}

export function filterDevices(devices: FlasherDevice[], query: string): FlasherDevice[] {
  if (!query.trim()) return devices
  const q = query.toLowerCase()
  return devices.filter(d => d.name.toLowerCase().includes(q))
}

export function firmwareHasData(fw: DeviceFirmware): boolean {
  const first = Object.keys(fw.version ?? {})[0]
  if (!first) return false
  return (fw.version[first]?.files?.length ?? 0) > 0
}

export function getRoleFwValue(
  fw: DeviceFirmware,
  roleMap: Record<string, FlasherRoleDef>,
  key: keyof (DeviceFirmware & FlasherRoleDef)
): string {
  const role = roleMap[fw.role] ?? {} as FlasherRoleDef
  return ((fw as unknown) as Record<string, unknown>)[key as string] as string
    ?? ((role as unknown) as Record<string, unknown>)[key as string] as string
    ?? ''
}

/**
 * Compare two version strings (e.g. "1.16.0" vs "1.9.0") so the newest sorts
 * first. Numeric segments are compared numerically (so 16 > 9), falling back to
 * a string compare for any non-numeric remainder.
 */
export function compareVersionsDesc(a: string, b: string): number {
  const pa = a.split(/[.\-+]/)
  const pb = b.split(/[.\-+]/)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const sa = pa[i] ?? ''
    const sb = pb[i] ?? ''
    const na = Number(sa)
    const nb = Number(sb)
    const bothNumeric = sa !== '' && sb !== '' && !Number.isNaN(na) && !Number.isNaN(nb)
    if (bothNumeric) {
      if (na !== nb) return nb - na
    } else if (sa !== sb) {
      return sb.localeCompare(sa)
    }
  }
  return 0
}

/** Sort version strings newest-first (latest version at the top). */
export function sortVersionsDesc(versions: string[]): string[] {
  return [...versions].sort(compareVersionsDesc)
}

export function getFirmwarePath(file: { name: string }, staticPath: string, base: string): string {
  if (file.name.startsWith('http://') || file.name.startsWith('https://')) return file.name
  if (file.name.startsWith('/')) return base + file.name
  return `${base}${staticPath}/${file.name}`
}

export const FLASHER_BASE_URL = 'https://flasher.dutchmeshcore.nl'
export const CONFIG_JSON_URL =
  'https://raw.githubusercontent.com/Elektr0Vodka/flasher.dutchmeshcore.nl/main/config.json'

/**
 * GitHub *release-asset* downloads (github.com/.../releases/download/...) don't send
 * `Access-Control-Allow-Origin`, so the in-browser flasher can't `fetch()` them to
 * flash from the list. We proxy them through a Cloudflare Pages Function served
 * same-origin at `/fw-proxy` (see functions/fw-proxy.js) — same-origin means the
 * browser applies no CORS at all.
 *
 * Set to '' to disable (release-hosted firmware then only flashes via the
 * "Custom firmware" upload — download + local file, no fetch).
 */
export const FIRMWARE_CORS_PROXY = '/fw-proxy'

/**
 * Route GitHub release-download URLs through `FIRMWARE_CORS_PROXY`. Other URLs
 * (raw.githubusercontent.com — already CORS-enabled — and same-origin/relative
 * paths) are returned unchanged. Local files never reach here (no fetch).
 */
export function firmwareFetchUrl(url: string, proxy: string = FIRMWARE_CORS_PROXY): string {
  if (!proxy) return url
  const isGithubRelease = /^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\//.test(url)
  return isGithubRelease ? `${proxy.replace(/\/+$/, '')}?url=${encodeURIComponent(url)}` : url
}
