import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFlasher } from '../hooks/useFlasher'
import type { FlasherDevice, DeviceFirmware, FlasherConfig } from '../types'

// Records every serial-control call the flasher makes, in order, so the tests can
// assert on the reset sequence that follows a flash.
const calls: string[] = []
let writeFlashError: Error | null = null

vi.mock('../lib/flasher/esp32.js', () => {
  class Transport {
    constructor(public port: unknown, public tracing: boolean) {}
    async setRTS(v: boolean) { calls.push(`rts:${v}`) }
    async setDTR(v: boolean) { calls.push(`dtr:${v}`) }
    async disconnect() { calls.push('disconnect') }
  }
  class HardReset {
    // Mirrors the bundled esptool-js: only releases RTS, never asserts it.
    constructor(public transport: Transport) {}
    async reset() { await this.transport.setRTS(false) }
  }
  class ESPLoader {
    transport: Transport
    constructor(opts: { transport: Transport }) { this.transport = opts.transport }
    async main() { calls.push('main') }
    async eraseFlash() { calls.push('erase') }
    async writeFlash() {
      calls.push('write')
      if (writeFlashError) throw writeFlashError
    }
    async after(mode: string) {
      calls.push(`after:${mode}`)
      await new HardReset(this.transport).reset()
    }
  }
  return { ESPLoader, Transport, HardReset }
})

const device: FlasherDevice = {
  maker: 'test', class: 'community', name: 'Test ESP32', type: 'esp32', firmware: [],
}
const firmware: DeviceFirmware = {
  role: 'repeater',
  version: {
    '1.0.0': {
      files: [{
        type: 'flash-update', name: 'fw.bin', title: 'fw.bin',
        file: new File([new Uint8Array([1, 2, 3])], 'fw.bin'),
      }],
    },
  },
}
const config: FlasherConfig = { staticPath: '', role: {}, notice: {}, maker: {}, device: [] }

describe('useFlasher', () => {
  it('initial state: supported false in jsdom', () => {
    const { result } = renderHook(() => useFlasher())
    expect(result.current.supported).toBe(false)
  })

  it('initial state: not active', () => {
    const { result } = renderHook(() => useFlasher())
    expect(result.current.active).toBe(false)
    expect(result.current.percent).toBe(0)
    expect(result.current.error).toBe('')
  })
})

describe('useFlasher ESP32 reset step', () => {
  beforeEach(() => {
    calls.length = 0
    writeFlashError = null
    Object.defineProperty(navigator, 'serial', {
      configurable: true,
      value: { requestPort: vi.fn(async () => ({})) },
    })
  })

  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>).serial
  })

  it('pulses RTS after flashing so the board reboots into the new firmware', async () => {
    const { result } = renderHook(() => useFlasher())
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.flash(device, firmware, config, { version: '1.0.0', wipe: false }) })

    expect(ok).toBe(true)
    expect(result.current.error).toBe('')
    expect(calls.slice(calls.indexOf('write'))).toEqual([
      'write', 'after:hard_reset', 'rts:false', 'rts:true', 'rts:false', 'disconnect',
    ])
    expect(result.current.percent).toBe(100)
  })

  it('still resets the board and releases the port when writing fails', async () => {
    writeFlashError = new Error('boom')
    const { result } = renderHook(() => useFlasher())
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.flash(device, firmware, config, { version: '1.0.0', wipe: false }) })

    // The page decides between its "done" and "error" steps from this return value;
    // hook state read right after the await would still be the pre-flash render's.
    expect(ok).toBe(false)
    expect(result.current.error).toContain('boom')
    expect(calls.slice(calls.indexOf('write'))).toEqual([
      'write', 'rts:true', 'rts:false', 'disconnect',
    ])
  })
})
