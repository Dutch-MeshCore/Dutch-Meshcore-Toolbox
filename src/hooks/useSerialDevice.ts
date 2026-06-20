import { useRef, useState, useCallback } from 'react'
import type { SerialDeviceInfo, DeviceVars, ConnectionState } from '../types'
import { DEFAULT_DEVICE_VARS, VAR_MIN_VERSION } from '../types'
import { parseFirmwareVersion, versionAtLeast } from '../utils/configUtils'
import {
  assembleFilterSettings,
  buildFilterCommands,
  isFilterStatusReply,
  cloneFilterSettings,
  type FilterSettings,
} from '../lib/config/filterCommands'

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
    sendCommand: (cmd: string) => Promise<string>
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

    // Detect packet-filter support by capability, not firmware name: probe the
    // `filter` command and only read the rest if it answers with a status line.
    // Stock firmware replies "> Unknown command"; custom-named DMC builds still match.
    let filter: FilterSettings | undefined
    let filterDevice: FilterSettings | undefined
    try {
      const status = await cli.sendCommand('filter')
      if (isFilterStatusReply(status)) {
        setBusy('Reading packet filter…')
        filter = assembleFilterSettings({
          status,
          hops: await cli.sendCommand('filter hops'),
          rate: await cli.sendCommand('filter rate'),
          channels: await cli.sendCommand('filter channel list'),
          hash: await cli.sendCommand('filter hash'),
          malformed: await cli.sendCommand('filter malformed'),
        })
        filterDevice = cloneFilterSettings(filter)
      }
    } catch { /* filter is optional; ignore if unsupported or unresponsive */ }

    setDevice({ version: vers, clock, role, pubKey, prvKey, password: '', vars, varsDevice, filter, filterDevice })
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
    const rebootKeys = new Set(['radio'])
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

      if (device.importPrvKey) {
        await cli.setVariable('prv.key', device.importPrvKey)
        needsReboot = true
      }

      if (device.password) {
        await cli.sendCommand(`password ${device.password}`)
        setDevice(d => d ? { ...d, password: '' } : d)
      }

      if (device.filter && device.filterDevice) {
        const filterCmds = buildFilterCommands(device.filter, device.filterDevice)
        for (const cmd of filterCmds) {
          await cli.sendCommand(cmd)
        }
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

  const exportConfig = useCallback(async () => {
    if (!device) return
    const cli = cliRef.current as {
      getVariable: (k: string) => Promise<string>
      parseVariableResponse: (r: string) => unknown
    } | null
    if (!cli) return

    const { vars, varsDevice } = device
    const fwVer = parseFirmwareVersion(device.version)
    const plainVars: Record<string, unknown> = {}

    for (const key of Object.keys(vars) as Array<keyof DeviceVars>) {
      if (!(key in varsDevice)) continue
      const req = VAR_MIN_VERSION[key]
      if (req && !versionAtLeast(fwVer, req)) continue
      const val = vars[key]
      plainVars[key] = typeof val === 'object' && val !== null ? { ...(val as object) } : val
    }

    try {
      const r = await cli.getVariable('prv.key')
      const prvKey = cli.parseVariableResponse(r)
      if (prvKey) plainVars['prv.key'] = prvKey
    } catch { /* optional */ }

    const safeName = (s: string) => (s || '').replace(/[^a-zA-Z0-9_-]/g, '_')
    const blob = new Blob([JSON.stringify({ vars: plainVars }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `config-${safeName(device.role) || 'unknown'}-${safeName(device.vars.name) || 'noname'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [device])

  const importFromJson = useCallback((json: string): boolean => {
    if (!device) return false
    const data = JSON.parse(json) // let caller catch
    if (!data.vars || typeof data.vars !== 'object') throw new Error('Invalid config file: missing vars.')

    const { vars } = device
    const fwVer = parseFirmwareVersion(device.version)
    const newVars = { ...vars }

    for (const key of Object.keys(vars) as Array<keyof DeviceVars>) {
      if (!(key in data.vars)) continue
      const req = VAR_MIN_VERSION[key]
      if (req && !versionAtLeast(fwVer, req)) continue
      const val = data.vars[key]
      ;(newVars as unknown as Record<string, unknown>)[key] =
        typeof val === 'object' && val !== null ? { ...(val as object) } : val
    }

    const patch: Partial<SerialDeviceInfo> = { vars: newVars }
    if (data.vars['prv.key']) patch.importPrvKey = data.vars['prv.key']
    setDevice(d => d ? { ...d, ...patch } : d)
    return true
  }, [device])

  return { supported, state, device, busy, connect, disconnect, setData, sendCommand, updateDevice, exportConfig, importFromJson }
}
