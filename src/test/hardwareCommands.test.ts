import { describe, expect, it } from 'vitest'
import {
  defaultHardwareSettings, cloneHardwareSettings, hasAnyHardware, hardwareGetCommands,
  assembleHardwareSettings, buildHardwareCommands, sanitizeImportedHardware,
  BRIDGE_MAX_BAUD,
} from '../lib/config/hardwareCommands'

describe('hardware model', () => {
  it('defaults to nothing supported', () => {
    const s = defaultHardwareSettings()
    expect(hasAnyHardware(s)).toBe(false)
    expect(s.bridgeBaud).toBe(BRIDGE_MAX_BAUD)
    expect(s.bridgeSource).toBe('tx')
  })
  it('requests every capability probe', () => {
    const cmds = hardwareGetCommands()
    for (const k of ['bridge.type', 'bridge.enabled', 'bridge.delay', 'bridge.source',
      'bridge.baud', 'bridge.channel', 'bridge.secret', 'radio.fem.rxgain',
      'radio.fem.txgain', 'extra.sf']) expect(cmds).toContain(k)
  })
})

describe('assembleHardwareSettings capability detection', () => {
  it('detects an MQTT-bridge board (enabled/delay/source, no RS232/ESP-NOW/FEM)', () => {
    const s = assembleHardwareSettings({
      'bridge.type': '> none',
      'bridge.enabled': '> on',
      'bridge.delay': '> 250',
      'bridge.source': '> logRx',
      'bridge.baud': '??: bridge.baud',
      'bridge.channel': '??: bridge.channel',
      'bridge.secret': '??: bridge.secret',
      'radio.fem.rxgain': 'Error: unsupported',
      'radio.fem.txgain': 'Error: unsupported',
      'extra.sf': 'No extra SF configured',
    })
    expect(s.bridgeSupported).toBe(true)
    expect(s.bridgeEnabled).toBe(true)
    expect(s.bridgeDelay).toBe(250)
    expect(s.bridgeSource).toBe('rx') // logRx -> rx
    expect(s.rs232Supported).toBe(false)
    expect(s.espnowSupported).toBe(false)
    expect(s.femRxSupported).toBe(false)
    expect(s.femTxSupported).toBe(false)
    expect(s.extraSfSupported).toBe(false)
    expect(hasAnyHardware(s)).toBe(true)
  })
  it('detects RS232 + ESP-NOW + FEM + LR2021 when present', () => {
    const s = assembleHardwareSettings({
      'bridge.type': '> rs232',
      'bridge.enabled': '> off',
      'bridge.delay': '> 0',
      'bridge.source': '> logTx',
      'bridge.baud': '> 57600',
      'bridge.channel': '> 6',
      'bridge.secret': '> s3cret',
      'radio.fem.rxgain': '> on',
      'radio.fem.txgain': '> off',
      'extra.sf': '9,11',
    })
    expect(s.bridgeType).toBe('rs232')
    expect(s.bridgeSource).toBe('tx')
    expect(s.rs232Supported).toBe(true)
    expect(s.bridgeBaud).toBe(57600)
    expect(s.espnowSupported).toBe(true)
    expect(s.bridgeChannel).toBe(6)
    expect(s.bridgeSecret).toBe('s3cret')
    expect(s.femRxSupported).toBe(true)
    expect(s.femRxgain).toBe(true)
    expect(s.femTxSupported).toBe(true)
    expect(s.femTxgain).toBe(false)
    expect(s.extraSfSupported).toBe(true)
    expect(s.extraSf).toBe('9,11')
  })
  it('treats a board with no bridge/FEM/LR2021 as empty', () => {
    const s = assembleHardwareSettings({
      'bridge.type': '> none',
      'bridge.enabled': '??: bridge.enabled',
      'radio.fem.rxgain': 'Error: unsupported',
      'radio.fem.txgain': 'Error: unsupported',
      'extra.sf': 'No extra SF configured',
    })
    expect(hasAnyHardware(s)).toBe(false)
  })
})

describe('buildHardwareCommands', () => {
  it('emits nothing when unchanged', () => {
    const base = assembleHardwareSettings({
      'bridge.enabled': '> on', 'bridge.delay': '> 0', 'bridge.source': '> logTx',
    })
    expect(buildHardwareCommands(cloneHardwareSettings(base), base)).toEqual({ cmds: [], needsReboot: false })
  })
  it('emits only supported, changed fields', () => {
    const base = assembleHardwareSettings({
      'bridge.type': '> rs232', 'bridge.enabled': '> off', 'bridge.delay': '> 0',
      'bridge.source': '> logTx', 'bridge.baud': '> 9600',
      'radio.fem.rxgain': '> off', 'radio.fem.txgain': '> off',
    })
    const next = cloneHardwareSettings(base)
    next.bridgeEnabled = true
    next.bridgeSource = 'rx'
    next.bridgeBaud = 115200
    next.femRxgain = true
    const { cmds } = buildHardwareCommands(next, base)
    expect(cmds).toContain('set bridge.enabled on')
    expect(cmds).toContain('set bridge.source rx')
    expect(cmds).toContain('set bridge.baud 115200')
    expect(cmds).toContain('set radio.fem.rxgain on')
  })
  it('never emits for an unsupported group even if the value differs', () => {
    const base = defaultHardwareSettings() // nothing supported
    const next = cloneHardwareSettings(base)
    next.bridgeEnabled = true
    next.femRxgain = true
    next.bridgeBaud = 57600
    expect(buildHardwareCommands(next, base).cmds).toEqual([])
  })
})

describe('sanitizeImportedHardware', () => {
  it('applies file values only where the live device supports them', () => {
    const live = assembleHardwareSettings({
      'bridge.enabled': '> off', 'bridge.delay': '> 0', 'bridge.source': '> logTx',
    }) // bridge supported, no RS232/ESP-NOW/FEM
    const imported = sanitizeImportedHardware(
      { bridgeEnabled: true, bridgeDelay: 500, bridgeBaud: 57600, femRxgain: true }, live)
    expect(imported.bridgeEnabled).toBe(true) // supported -> applied
    expect(imported.bridgeDelay).toBe(500)
    expect(imported.bridgeBaud).toBe(live.bridgeBaud) // rs232 unsupported -> unchanged
    expect(imported.femRxgain).toBe(false) // fem unsupported -> unchanged
    expect(imported.bridgeSupported).toBe(true) // capability from live, not file
  })
  it('ignores a file-provided capability flag', () => {
    const live = defaultHardwareSettings()
    const imported = sanitizeImportedHardware({ bridgeSupported: true, bridgeEnabled: true }, live)
    expect(imported.bridgeSupported).toBe(false)
    expect(imported.bridgeEnabled).toBe(false)
  })
})
