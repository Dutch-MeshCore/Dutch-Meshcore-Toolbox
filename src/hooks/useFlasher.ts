import { useRef, useState } from 'react'
import type { FlasherDevice, DeviceFirmware, FlasherConfig } from '../types'
import { getFirmwarePath, FLASHER_BASE_URL } from '../utils/flasherUtils'

export interface FlasherState {
  supported: boolean
  active: boolean
  percent: number
  log: string
  error: string
  dfuComplete: boolean
  nrfEraserPercent: number
  nrfEraserFlashing: boolean
}

export function useFlasher() {
  const supported = typeof navigator !== 'undefined' && 'serial' in navigator

  const [state, setState] = useState<FlasherState>({
    supported,
    active: false,
    percent: 0,
    log: '',
    error: '',
    dfuComplete: false,
    nrfEraserPercent: 0,
    nrfEraserFlashing: false,
  })

  const instanceRef = useRef<unknown>(null)
  const transportRef = useRef<unknown>(null)
  const portRef = useRef<SerialPort | null>(null)

  function appendLog(text: string) {
    setState(s => ({ ...s, log: s.log + text }))
  }

  async function firmwareBlob(
    file: { name: string; file?: File },
    config: FlasherConfig
  ): Promise<Blob> {
    if (file.file) return file.file

    const url = getFirmwarePath(file, config.staticPath, FLASHER_BASE_URL)
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Firmware download ${resp.status}: ${resp.statusText}`)
    return resp.blob()
  }

  async function blobToBinaryString(blob: Blob): Promise<string> {
    return new Promise<string>((res, rej) => {
      const fr = new FileReader()
      fr.onload = () => res(fr.result as string)
      fr.onerror = rej
      fr.readAsBinaryString(blob)
    })
  }

  async function flash(
    device: FlasherDevice,
    firmware: DeviceFirmware,
    config: FlasherConfig,
    opts: { version: string; wipe: boolean }
  ) {
    if (!supported) return
    const versionData = firmware.version[opts.version]
    if (!versionData) return

    setState(s => ({ ...s, active: true, percent: 0, log: '', error: '' }))

    try {
      if (device.type === 'esp32') {
        // @ts-ignore — esp32.js has no TS types
        const { ESPLoader, Transport, HardReset } = await import('../lib/flasher/esp32.js')
        const port = await navigator.serial.requestPort()
        portRef.current = port
        const transport = new Transport(port, true)
        transportRef.current = transport
        const loader = new ESPLoader({
          transport,
          baudrate: 921600,
          romBaudrate: 115200,
          terminal: {
            clean: () => setState(s => ({ ...s, log: '' })),
            writeLine: (d: string) => appendLog(d + '\n'),
            write: (d: string) => appendLog(d),
          },
        })
        instanceRef.current = loader

        await loader.main()

        if (opts.wipe) {
          await loader.eraseFlash()
        }

        const fileArray: { data: string; address: number }[] = []
        for (const f of versionData.files) {
          const blob = await firmwareBlob(f, config)
          const data = await blobToBinaryString(blob)
          fileArray.push({ data, address: f.type === 'flash-wipe' ? 0x0 : 0x10000 })
        }

        await loader.writeFlash({
          fileArray,
          flashSize: 'keep',
          flashMode: 'keep',
          flashFreq: 'keep',
          eraseAll: false,
          compress: true,
          reportProgress: (_idx: number, written: number, total: number) => {
            setState(s => ({ ...s, percent: Math.round((written / total) * 100) }))
          },
          calculateMD5Hash: (_image: string) => '',
        })

        await new HardReset(transport).reset()
        await transport.disconnect()
        setState(s => ({ ...s, percent: 100 }))

      } else if (device.type === 'nrf52') {
        // @ts-ignore — dfu.js has no TS types
        const { Dfu } = await import('../lib/flasher/dfu.js')
        if (!portRef.current) {
          portRef.current = await navigator.serial.requestPort()
        }
        const port = portRef.current
        const dfu = new Dfu(port)
        instanceRef.current = dfu

        const blob = await firmwareBlob(versionData.files[0], config)

        await dfu.dfuUpdate(blob, (done: number, total: number) => {
          setState(s => ({ ...s, percent: Math.round((done / total) * 100) }))
          appendLog(`Progress: ${done}/${total}\n`)
        })
        setState(s => ({ ...s, percent: 100 }))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState(s => ({ ...s, error: msg }))
    }
  }

  async function dfuMode() {
    if (!supported) return
    try {
      // @ts-ignore
      const { Dfu } = await import('../lib/flasher/dfu.js')
      const port = await navigator.serial.requestPort()
      portRef.current = port
      const dfu = new Dfu(port)
      await dfu.enterDFU()
      setState(s => ({ ...s, dfuComplete: true }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState(s => ({ ...s, error: msg }))
    }
  }

  async function nrfErase(device: FlasherDevice, _config: FlasherConfig) {
    if (!supported || !device.erase) return
    setState(s => ({ ...s, nrfEraserFlashing: true, nrfEraserPercent: 0 }))
    try {
      // @ts-ignore
      const { Dfu } = await import('../lib/flasher/dfu.js')
      if (!portRef.current) {
        portRef.current = await navigator.serial.requestPort()
      }
      const dfu = new Dfu(portRef.current)
      const url = `${FLASHER_BASE_URL}/${device.erase.replace('.zip', '.uf2')}`
      const resp = await fetch(url)
      const blob = await resp.blob()
      await dfu.dfuUpdate(blob, (done: number, total: number) => {
        setState(s => ({ ...s, nrfEraserPercent: Math.round((done / total) * 100) }))
      })
      setState(s => ({ ...s, nrfEraserPercent: 100, nrfEraserFlashing: false }))
    } catch {
      setState(s => ({ ...s, nrfEraserFlashing: false }))
    }
  }

  function reset() {
    setState({
      supported,
      active: false,
      percent: 0,
      log: '',
      error: '',
      dfuComplete: false,
      nrfEraserPercent: 0,
      nrfEraserFlashing: false,
    })
    portRef.current = null
    instanceRef.current = null
    transportRef.current = null
  }

  return { ...state, flash, dfuMode, nrfErase, reset }
}
