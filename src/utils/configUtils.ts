import type { RadioPreset } from '../types'

export function parseFirmwareVersion(verString: string): [number, number, number] {
  const match = verString.match(/v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) return [0, 0, 0]
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
}

export function versionAtLeast(
  current: [number, number, number],
  required: [number, number, number]
): boolean {
  for (let i = 0; i < 3; i++) {
    if (current[i] > required[i]) return true
    if (current[i] < required[i]) return false
  }
  return true
}

export function afToDutyCycle(af: number): number {
  return Math.round(100 / (Number(af) + 1))
}

export function dutyCycleToAf(dc: number): number {
  return parseFloat(((100 / dc) - 1).toFixed(1))
}

export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

export function nameMaxBytes(lat: number | string, lon: number | string): number {
  return (Number(lat) !== 0 || Number(lon) !== 0) ? 24 : 32
}

export function ownerInfoBytes(text: string): number {
  return utf8ByteLength(String(text || '').replace(/\n/g, '|'))
}

export function matchPreset(presets: RadioPreset[], radio: { freq: string; sf: string; bw: string; cr: string }): RadioPreset {
  for (const p of presets) {
    if (
      Number(p.frequency) === Number(radio.freq) &&
      Number(p.spreading_factor) === Number(radio.sf) &&
      Number(p.bandwidth) === Number(radio.bw) &&
      Number(p.coding_rate) === Number(radio.cr)
    ) return p
  }
  return presets[0] ?? { title: 'Custom' }
}

/** True when the connected device reports the custom DutchMeshCore firmware. */
export function isDmcFirmware(version: string): boolean {
  return /dutchmeshcore/i.test(version || '')
}

export const PRESETS_URL = 'https://api.meshcore.nz/api/v1/config'
