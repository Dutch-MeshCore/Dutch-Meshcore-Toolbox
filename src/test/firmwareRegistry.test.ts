import { describe, it, expect } from 'vitest'
import {
  FW_DEVICE_TYPES,
  FW_CATEGORIES,
  FIRMWARE_VARIANTS,
  getCommandsForContext,
  searchCommands,
  variantById,
  localizedDesc,
  descKeyOf,
} from '../lib/cli/firmwareRegistry'
import { CLI_DESC_NL } from '../lib/cli/descriptions.nl'
import { CLI_DESC_DE } from '../lib/cli/descriptions.de'

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

  it.each([['NL', CLI_DESC_NL], ['DE', CLI_DESC_DE]] as const)('every command has a %s description', (_lang, map) => {
    const missing = new Set<string>()
    for (const v of Object.values(FIRMWARE_VARIANTS)) {
      for (const c of v.commands) {
        if (!map[descKeyOf(c)]) missing.add(descKeyOf(c))
      }
    }
    expect([...missing], `missing translation for: ${[...missing].join(', ')}`).toEqual([])
  })

  it('every description key belongs to a command', () => {
    const used = new Set(Object.values(FIRMWARE_VARIANTS).flatMap(v => v.commands.map(descKeyOf)))
    expect(Object.keys(CLI_DESC_NL).filter(k => !used.has(k))).toEqual([])
    expect(Object.keys(CLI_DESC_DE).filter(k => !used.has(k))).toEqual([])
  })

  it('no variant lists the same command twice for one device type', () => {
    for (const v of Object.values(FIRMWARE_VARIANTS)) {
      for (const dt of v.deviceTypes) {
        const cmds = getCommandsForContext(v.id, FW_DEVICE_TYPES[dt].id).map(c => c.cmd)
        expect(cmds.filter((c, i) => cmds.indexOf(c) !== i), `${v.id}/${dt}`).toEqual([])
      }
    }
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

describe('v1.18 companion CLI', () => {
  const companion = getCommandsForContext('meshcore', FW_DEVICE_TYPES.companion.id)
  const has = (cmd: string) => companion.some(c => c.cmd === cmd)

  it('lists what the companion handles', () => {
    for (const cmd of ['ver', 'board', 'reboot', 'poweroff', 'set name ', 'set radio ', 'get cad', 'set pin ', 'set tz.offset ', 'get wifi.ip', 'get fan', 'get radio.fem.rxgain']) {
      expect(has(cmd), cmd).toBe(true)
    }
  })

  it('leaves out commands only the server CLI handles', () => {
    for (const cmd of ['clock', 'advert', 'region put ', 'gps diag', 'set repeat on', 'start ota', 'set freq ']) {
      expect(has(cmd), cmd).toBe(false)
    }
  })

  it('keeps server roles unchanged', () => {
    const repeater = getCommandsForContext('meshcore', FW_DEVICE_TYPES.repeater.id)
    for (const cmd of ['clock', 'advert', 'region put ', 'gps diag', 'get fan', 'get cad']) {
      expect(repeater.some(c => c.cmd === cmd), cmd).toBe(true)
    }
    expect(repeater.some(c => c.cmd === 'set pin ')).toBe(false)
  })

  it('no longer tags DMC dev commands with the v1.17.1 dev version', () => {
    const all = Object.values(FIRMWARE_VARIANTS).flatMap(v => v.commands)
    expect(all.filter(c => c.sinceVersion === 'v1.17.1-dev')).toEqual([])
  })
})

describe('meshcomod companion variant', () => {
  const mc = FIRMWARE_VARIANTS['meshcomod']
  const byCmd = (cmd: string) => mc.commands.find(c => c.cmd === cmd)

  it('is a companion-only variant', () => {
    expect(mc.deviceTypes).toEqual(['companion'])
  })

  it('has the companion receive filter subset only', () => {
    for (const cmd of ['filter', 'filter on', 'filter age ', 'filter path add ', 'filter sender add ', 'filter text add ', 'filter stats ']) {
      expect(byCmd(cmd), cmd).toBeDefined()
    }
    for (const cmd of ['filter hops ', 'filter rate ', 'filter channel add ', 'filter hash ', 'filter watch add ', 'filter dryrun on']) {
      expect(byCmd(cmd), cmd).toBeUndefined()
    }
  })

  it('describes the companion filter apart from the repeater filter', () => {
    const rep = FIRMWARE_VARIANTS['dmc-repeater'].commands.find(c => c.cmd === 'filter on')!
    expect(localizedDesc(byCmd('filter on')!, 'nl')).not.toBe(localizedDesc(rep, 'nl'))
  })

  it('leaves out the settings meshcomod answers unsupported', () => {
    for (const cmd of ['get cad', 'set int.thresh ', 'set txdelay ', 'set tz.offset ']) {
      expect(byCmd(cmd), cmd).toBeUndefined()
    }
  })

  it('adds SNMP and the command-contact OTA commands', () => {
    expect(byCmd('get snmp.status')).toBeDefined()
    expect(byCmd('ota check')?.note).toBe('command-contact')
  })
})
