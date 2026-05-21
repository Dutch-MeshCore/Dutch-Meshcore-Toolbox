import { useRef, useState, useCallback } from 'react'
import type { SerialDeviceInfo, DeviceVars, ConnectionState } from '../types'
import { DEFAULT_DEVICE_VARS, VAR_MIN_VERSION } from '../types'
import { parseFirmwareVersion, versionAtLeast } from '../utils/configUtils'

export function useSerialDevice() {
  const supported = typeof navigator !== 'undefined' && 'serial' in navigator
  const [state, setState] = useState<ConnectionState>('disconnected')
  const [device, setDevice] = useState<SerialDeviceInfo | null>(null)
  const [busy, setBusy] = useState('')
  const cliRef = useRef<unknown>(null)

  const connect = useCallback(async () => {
    if (!supported) return
    setState('connecting')
    try {
      // @ts-ignore
      const { SerialCLI } = await import('../lib/config/serial-cli.js')
      const cli = new SerialCLI(false)
      const ok = await cli.connect(115200)
      if (!ok) throw new Error('Connection failed')
      cliRef.current = cli
      setState('connected')
      await _getData(cli)
    } catch {
      setState('disconnected')
    }
  }, [supported])

  const disconnect = useCallback(async () => {
    try {
      const cli = cliRef.current as { disconnect: () => Promise<void> } | null
      await cli?.disconnect()
    } catch { /* ignore */ }
    cliRef.current = null
    setDevice(null)
    setState('disconnected')
  }, [])

  async function _getData(cli: {
    getVersion: () => Promise<string>
    getClock: () => Promise<string>
    getRole: () => Promise<string>
    getPubKey: () => Promise<string>
    getVariable: (k: string) => Promise<string>
    parseVariableResponse: (r: string) => unknown
  }) {
    setBusy('Reading configuration…')
    const vers = await cli.getVersion()
    const clock = await cli.getClock()
    const role = await cli.getRole()
    const pubKey = await cli.getPubKey()

    let prvKey = ''
    try {
      const r = await cli.getVariable('prv.key')
      prvKey = String(cli.parseVariableResponse(r) ?? '')
    } catch { /* optional field */ }

    const fwVer = parseFirmwareVersion(vers)
    const vars: DeviceVars = { ...DEFAULT_DEVICE_VARS }
    const varsDevice: Partial<DeviceVars> = {}

    for (const key of Object.keys(DEFAULT_DEVICE_VARS) as Array<keyof DeviceVars>) {
      const req = VAR_MIN_VERSION[key]
      if (req && !versionAtLeast(fwVer, req)) continue
      const resp = await cli.getVariable(key)
      let value = cli.parseVariableResponse(resp) as unknown

      if (value === null) {
        if (typeof vars[key] === 'string') value = ''
        else continue
      }

      if (key === 'radio') {
        const [freq, bw, sf, cr] = String(value).split(',')
        value = { freq: Number(freq).toFixed(3), bw: bw?.replace('.0', '') ?? '125', sf: sf ?? '9', cr: cr ?? '5' }
      }
      if (key === 'owner.info') value = String(value).replace(/\|/g, '\n')
      if (['rxdelay', 'txdelay', 'direct.txdelay'].includes(key) && typeof value === 'number') {
        value = Math.round((value as number) * 10) / 10
      }
      if (['lat', 'lon'].includes(key) && typeof value === 'number') {
        value = Math.round((value as number) * 100000) / 100000
      }
      if (key === 'loop.detect') value = value === false ? 'off' : String(value)
      if (key === 'multi.acks') value = String(Number(value))

      ;(vars as unknown as Record<string, unknown>)[key] = value
      ;(varsDevice as unknown as Record<string, unknown>)[key] = typeof value === 'object' ? { ...(value as object) } : value
    }

    setDevice({ version: vers, clock, role, pubKey, prvKey, password: '', vars, varsDevice })
    setBusy('')
  }

  const setData = useCallback(async () => {
    if (!device) return
    const cli = cliRef.current as {
      setVariable: (k: string, v: unknown) => Promise<void>
      sendCommand: (cmd: string) => Promise<string>
      reboot: () => void
    } | null
    if (!cli) return

    setBusy('Saving configuration…')
    const { vars, varsDevice } = device
    const fwVer = parseFirmwareVersion(device.version)
    const rebootKeys = new Set(['radio', 'prv.key'])
    let needsReboot = false

    try {
      for (const key of Object.keys(vars) as Array<keyof DeviceVars>) {
        const req = VAR_MIN_VERSION[key]
        if (req && !versionAtLeast(fwVer, req)) continue
        if (JSON.stringify(vars[key]) === JSON.stringify(varsDevice[key])) continue
        if (!(key in varsDevice)) continue
        if (rebootKeys.has(key)) needsReboot = true

        let value: unknown = vars[key]
        if (key === 'repeat' || key === 'allow.read.only') value = value ? 'on' : 'off'
        if (key === 'owner.info') value = String(value).replace(/\n/g, '|')
        if (key === 'radio') {
          const r = vars.radio
          value = `${r.freq},${r.bw}.0,${r.sf},${r.cr}`
        }
        await cli.setVariable(key, value)
      }

      if (device.password) {
        await cli.sendCommand(`password ${device.password}`)
        setDevice(d => d ? { ...d, password: '' } : d)
      }

      await _getData(cliRef.current as unknown as Parameters<typeof _getData>[0])
      setBusy('')
      return { needsReboot }
    } catch (err) {
      setBusy('')
      throw err
    }
  }, [device])

  const sendCommand = useCallback(async (cmd: string) => {
    const cli = cliRef.current as { sendCommand: (c: string) => Promise<string> } | null
    return cli?.sendCommand(cmd) ?? ''
  }, [])

  const updateDevice = useCallback((patch: Partial<SerialDeviceInfo>) => {
    setDevice(d => d ? { ...d, ...patch } : d)
  }, [])

  return { supported, state, device, busy, connect, disconnect, setData, sendCommand, updateDevice }
}
