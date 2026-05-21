import { describe, it, expect } from 'vitest'
import type { FlasherDevice, FirmwareFile } from '../types'

describe('FlasherConfig types', () => {
  it('FirmwareFile has required fields', () => {
    const f: FirmwareFile = { type: 'flash-wipe', name: 'file.bin', title: 'Combined bin' }
    expect(f.type).toBe('flash-wipe')
    expect(f.name).toBe('file.bin')
    expect(f.title).toBe('Combined bin')
  })

  it('FlasherDevice has class and type discriminators', () => {
    const d: FlasherDevice = {
      maker: 'heltec',
      class: 'ripple',
      name: 'Heltec V3',
      type: 'esp32',
      firmware: [],
    }
    expect(d.class).toBe('ripple')
    expect(d.type).toBe('esp32')
  })

  it('groupDevicesByClass groups correctly', async () => {
    const { groupDevicesByClass } = await import('../utils/flasherUtils')
    const devices: FlasherDevice[] = [
      { maker: 'h', class: 'ripple', name: 'A', type: 'esp32', firmware: [] },
      { maker: 'h', class: 'community', name: 'B', type: 'nrf52', firmware: [] },
      { maker: 'h', class: 'ripple', name: 'C', type: 'esp32', firmware: [] },
    ]
    const groups = groupDevicesByClass(devices)
    expect(groups.ripple).toHaveLength(2)
    expect(groups.community).toHaveLength(1)
    expect(groups.meshos).toBeUndefined()
  })
})
