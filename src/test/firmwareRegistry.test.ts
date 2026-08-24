import { describe, it, expect } from 'vitest'
import {
  FW_DEVICE_TYPES,
  FW_CATEGORIES,
  FIRMWARE_VARIANTS,
  getCommandsForContext,
  searchCommands,
  variantById,
  localizedDesc,
} from '../lib/cli/firmwareRegistry'
import { CLI_DESC_NL } from '../lib/cli/descriptions.nl'

describe('firmwareRegistry helpers', () => {
  it('variantById falls back to meshcore for unknown id', () => {
    expect(variantById('does-not-exist').id).toBe('meshcore')
    expect(variantById('dmc-mqtt').id).toBe('dmc-mqtt')
  })

  it('getCommandsForContext filters by device type', () => {
    const repeaterId = FW_DEVICE_TYPES.repeater.id
    const cmds = getCommandsForContext('meshcore', repeaterId)
    expect(cmds.length).toBeGreaterThan(0)
    for (const c of cmds) {
      const ok = c.deviceTypes === 'all' || c.deviceTypes.includes('repeater')
      expect(ok).toBe(true)
    }
  })

  it('getCommandsForContext returns [] for unknown device type id', () => {
    expect(getCommandsForContext('meshcore', 999)).toEqual([])
  })

  it('searchCommands matches command name and description', () => {
    const all = FIRMWARE_VARIANTS['meshcore'].commands
    expect(searchCommands(all, 'reboot').some(c => c.cmd.includes('reboot'))).toBe(true)
    expect(searchCommands(all, 'firmware version').length).toBeGreaterThan(0)
  })

  it('every command references a defined category', () => {
    for (const v of Object.values(FIRMWARE_VARIANTS)) {
      for (const c of v.commands) {
        expect(FW_CATEGORIES[c.category]).toBeDefined()
      }
    }
  })

  it('baseline catalog is fully populated', () => {
    expect(FIRMWARE_VARIANTS['meshcore'].commands.length).toBeGreaterThan(100)
    const companionCmds = getCommandsForContext('meshcore', FW_DEVICE_TYPES.companion.id)
    expect(companionCmds.some(c => c.cmd === 'neighbors')).toBe(false)
    expect(companionCmds.some(c => c.cmd === 'ver')).toBe(true)
  })

  it('DMC repeater tier adds the packet filter, excludes MQTT commands', () => {
    const rep = FIRMWARE_VARIANTS['dmc-repeater'].commands
    expect(rep.some(c => c.category === 'filter')).toBe(true)
    expect(rep.some(c => c.category === 'mqtt')).toBe(false)
  })

  it('DMC MQTT tier includes packet filter AND MQTT bridge commands', () => {
    const mq = FIRMWARE_VARIANTS['dmc-mqtt'].commands
    expect(mq.some(c => c.category === 'mqtt')).toBe(true)
    expect(mq.some(c => c.category === 'filter')).toBe(true)
  })

  it('v1.17 additions carry a sinceVersion badge', () => {
    const all = FIRMWARE_VARIANTS['dmc-mqtt'].commands
    expect(all.some(c => c.sinceVersion === 'v1.17')).toBe(true)
  })

  it('every command has a Dutch description', () => {
    const missing: string[] = []
    const seen = new Set<string>()
    for (const v of Object.values(FIRMWARE_VARIANTS)) {
      for (const c of v.commands) {
        if (seen.has(c.cmd)) continue
        seen.add(c.cmd)
        if (!CLI_DESC_NL[c.cmd]) missing.push(c.cmd)
      }
    }
    expect(missing, `missing NL translation for: ${missing.join(', ')}`).toEqual([])
  })

  it('localizedDesc returns Dutch for nl and English for en', () => {
    const ver = FIRMWARE_VARIANTS['meshcore'].commands.find(c => c.cmd === 'ver')!
    expect(localizedDesc(ver, 'en')).toBe(ver.desc)
    expect(localizedDesc(ver, 'nl')).toBe(CLI_DESC_NL['ver'])
    expect(localizedDesc(ver, 'nl')).not.toBe(ver.desc)
  })

  it('searchCommands matches Dutch descriptions too', () => {
    const all = FIRMWARE_VARIANTS['meshcore'].commands
    // 'firmwareversie' appears only in the Dutch description of `ver`.
    expect(searchCommands(all, 'firmwareversie').some(c => c.cmd === 'ver')).toBe(true)
  })
})

describe('v1.17 region-gating / region-list / filter-interval registry entries', () => {
  // dmc-mqtt is the widest variant: it folds in every command array.
  const all = FIRMWARE_VARIANTS['dmc-mqtt'].commands
  const byCmd = (cmd: string) => all.find(c => c.cmd === cmd)

  it('exposes the full dc.gate duty-cycle gating family', () => {
    const cmds = [
      'get dc.gate',
      'set dc.gate ',
      'get dc.gate.thresh',
      'set dc.gate.thresh ',
      'get dc.gate.hyst',
      'set dc.gate.hyst ',
      'get dc.gate.status',
    ]
    for (const cmd of cmds) {
      expect(byCmd(cmd), `missing registry entry: ${cmd}`).toBeDefined()
    }
  })

  it('adds region list allowed / denied sub-variants', () => {
    expect(byCmd('region list allowed')).toBeDefined()
    expect(byCmd('region list denied')).toBeDefined()
  })

  it('adds the mqtt.filter.interval pair', () => {
    expect(byCmd('get mqtt.filter.interval')).toBeDefined()
    expect(byCmd('set mqtt.filter.interval ')).toBeDefined()
  })

  it('describes af as airtime factor, not filter', () => {
    expect(byCmd('get af')!.desc).toMatch(/airtime factor/i)
    expect(byCmd('set af ')!.desc).toMatch(/airtime factor/i)
  })
})
