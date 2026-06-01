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

export function getFirmwarePath(file: { name: string }, staticPath: string, base: string): string {
  if (file.name.startsWith('http://') || file.name.startsWith('https://')) return file.name
  if (file.name.startsWith('/')) return base + file.name
  return `${base}${staticPath}/${file.name}`
}

export const FLASHER_BASE_URL = 'https://flasher.dutchmeshcore.nl'
export const CONFIG_JSON_URL =
  'https://raw.githubusercontent.com/Elektr0Vodka/flasher.dutchmeshcore.nl/main/config.json'
