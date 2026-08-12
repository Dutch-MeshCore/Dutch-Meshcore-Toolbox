import { describe, expect, it } from 'vitest'
import {
  defaultMqttSettings, cloneMqttSettings, isMqttSupportedReply, MQTT_SLOT_COUNT,
  mqttGetCommands, assembleMqttSettings, buildMqttCommands,
  MQTT_PRESETS, PACKET_TYPES, parsePacketFilter, formatPacketFilter,
  normalizePacketFilter, sanitizeImportedMqtt,
} from '../lib/config/mqttCommands'

describe('mqtt model', () => {
  it('has 6 slots defaulting to none and firmware defaults', () => {
    const s = defaultMqttSettings()
    expect(s.slots).toHaveLength(MQTT_SLOT_COUNT)
    expect(s.slots.every(sl => sl.preset === 'none')).toBe(true)
    expect(s.tx).toBe('advert')
    expect(s.interval).toBe(5)
    expect(s.alertWifi).toBe(30)
    expect(s.alertMqtt).toBe(240)
    expect(s.alertInterval).toBe(60)
    expect(s.snmpCommunity).toBe('public')
  })

  it('clone is a deep copy of slots', () => {
    const s = defaultMqttSettings()
    const c = cloneMqttSettings(s)
    c.slots[0].preset = 'custom'
    expect(s.slots[0].preset).toBe('none')
  })
})

describe('isMqttSupportedReply', () => {
  it('accepts valid/invalid and rejects unknown command', () => {
    expect(isMqttSupportedReply('> valid')).toBe(true)
    expect(isMqttSupportedReply('> invalid')).toBe(true)
    expect(isMqttSupportedReply('Unknown command')).toBe(false)
    expect(isMqttSupportedReply('')).toBe(false)
  })
})

describe('mqttGetCommands', () => {
  it('lists globals, alerts, snmp and 8 fields per slot; excludes mqtt.status', () => {
    const cmds = mqttGetCommands()
    expect(cmds).toContain('mqtt.origin')
    expect(cmds).toContain('alert.wifi')
    expect(cmds).toContain('snmp.community')
    expect(cmds).toContain('mqtt1.preset')
    expect(cmds).toContain('mqtt6.audience')
    expect(cmds).toContain('wifi.ssid')
    expect(cmds).toContain('timezone.offset')
    expect(cmds).not.toContain('mqtt.status') // get returns a report, not the flag
  })
})

describe('wifi + timezone', () => {
  it('assembles wifi and timezone settings', () => {
    const s = assembleMqttSettings({
      'wifi.ssid': '> MyNet',
      'wifi.pwd': '> hunter2',
      'wifi.powersave': '> none',
      'timezone': '> Europe/Amsterdam',
      'timezone.offset': '> 2',
    })
    expect(s.wifiSsid).toBe('MyNet')
    expect(s.wifiPassword).toBe('hunter2')
    expect(s.wifiPowersave).toBe('none')
    expect(s.timezone).toBe('Europe/Amsterdam')
    expect(s.timezoneOffset).toBe(2)
  })

  it('flags reboot when wifi ssid or password change', () => {
    const base = defaultMqttSettings()
    const next = cloneMqttSettings(base)
    next.wifiSsid = 'Net'
    next.wifiPassword = 'pw'
    const { cmds, needsReboot } = buildMqttCommands(next, base)
    expect(cmds).toContain('set wifi.ssid Net')
    expect(cmds).toContain('set wifi.pwd pw')
    expect(needsReboot).toBe(true)
  })

  it('does not reboot for powersave/timezone changes', () => {
    const base = defaultMqttSettings()
    const next = cloneMqttSettings(base)
    next.wifiPowersave = 'max'
    next.timezoneOffset = 1
    const { cmds, needsReboot } = buildMqttCommands(next, base)
    expect(cmds).toContain('set wifi.powersave max')
    expect(cmds).toContain('set timezone.offset 1')
    expect(needsReboot).toBe(false)
  })
})

describe('assembleMqttSettings', () => {
  it('parses globals, alerts, snmp and a custom slot from device replies', () => {
    const r: Record<string, string> = {
      'mqtt.origin': '> MyObserver',
      'mqtt.iata': '> AMS',
      'mqtt.packets': '> on',
      'mqtt.raw': '> off',
      'mqtt.tx': '> advert',
      'mqtt.rx': '> on',
      'mqtt.interval': '> 5 minutes (300000 ms)',
      'mqtt.ntp': '> pool.ntp.org',
      'mqtt.owner': '> (not set)',
      'mqtt.email': '> ops@example.nl',
      'alert': '> on',
      'alert.psk': '> (unset)',
      'alert.hashtag': '> #ops',
      'alert.region': '> (unset, using default scope)',
      'alert.wifi': '> 10 min',
      'alert.mqtt': '> 0 min (disabled)',
      'alert.interval': '> 60 min',
      'snmp': '> off',
      'snmp.community': '> public',
      'mqtt1.preset': '> dutchmeshcore-1',
      'mqtt2.preset': '> custom',
      'mqtt2.server': '> broker.example.nl',
      'mqtt2.port': '> 8883',
      'mqtt2.username': '> user',
      'mqtt2.password': '> secret',
      'mqtt2.token': '> (not set)',
      'mqtt2.topic': '> (default: meshcore/{iata}/{device}/{type})',
      'mqtt2.audience': '> (not set — custom slots use username/password auth)',
    }
    const s = assembleMqttSettings(r)
    expect(s.origin).toBe('MyObserver')
    expect(s.iata).toBe('AMS')
    expect(s.tx).toBe('advert')
    expect(s.interval).toBe(5)
    expect(s.owner).toBe('')        // sentinel -> empty
    expect(s.email).toBe('ops@example.nl')
    expect(s.alert).toBe(true)
    expect(s.alertHashtag).toBe('#ops')
    expect(s.alertRegion).toBe('')  // sentinel -> empty
    expect(s.alertWifi).toBe(10)
    expect(s.alertMqtt).toBe(0)
    expect(s.slots[0].preset).toBe('dutchmeshcore-1')
    expect(s.slots[1].preset).toBe('custom')
    expect(s.slots[1].server).toBe('broker.example.nl')
    expect(s.slots[1].port).toBe(8883)
    expect(s.slots[1].password).toBe('secret')
    expect(s.slots[1].topic).toBe('')   // sentinel -> empty
  })
})

describe('buildMqttCommands', () => {
  it('returns no commands and no reboot when unchanged', () => {
    const base = defaultMqttSettings()
    const next = cloneMqttSettings(base)
    expect(buildMqttCommands(next, base)).toEqual({ cmds: [], needsReboot: false })
  })

  it('emits minimal global diffs with correct on/off and clear semantics', () => {
    const base = defaultMqttSettings()
    const next = cloneMqttSettings(base)
    next.raw = true
    next.tx = 'on'
    next.interval = 10
    next.origin = 'Obs'
    const { cmds } = buildMqttCommands(next, base)
    expect(cmds).toContain('set mqtt.raw on')
    expect(cmds).toContain('set mqtt.tx on')
    expect(cmds).toContain('set mqtt.interval 10')
    expect(cmds).toContain('set mqtt.origin Obs')
  })

  it('clears ntp with "none" and origin with a bare command', () => {
    const base = cloneMqttSettings(defaultMqttSettings())
    base.ntp = 'time.example.nl'; base.origin = 'Old'
    const next = cloneMqttSettings(base)
    next.ntp = ''; next.origin = ''
    const { cmds } = buildMqttCommands(next, base)
    expect(cmds).toContain('set mqtt.ntp none')
    expect(cmds).toContain('set mqtt.origin')
  })

  it('orders slot preset before custom fields', () => {
    const base = defaultMqttSettings()
    const next = cloneMqttSettings(base)
    next.slots[0].preset = 'custom'
    next.slots[0].server = 'h.example.nl'
    next.slots[0].port = 8883
    const { cmds } = buildMqttCommands(next, base)
    expect(cmds[0]).toBe('set mqtt1.preset custom')
    expect(cmds).toContain('set mqtt1.server h.example.nl')
    expect(cmds).toContain('set mqtt1.port 8883')
  })

  it('emits alert sub-settings before the master toggle', () => {
    const base = defaultMqttSettings()
    const next = cloneMqttSettings(base)
    next.alertHashtag = '#ops'
    next.alert = true
    const { cmds } = buildMqttCommands(next, base)
    expect(cmds.indexOf('set alert.hashtag #ops')).toBeLessThan(cmds.indexOf('set alert on'))
  })

  it('flags reboot only when snmp changes', () => {
    const base = defaultMqttSettings()
    const a = cloneMqttSettings(base); a.snmp = true
    expect(buildMqttCommands(a, base)).toEqual({ cmds: ['set snmp on'], needsReboot: true })
    const b = cloneMqttSettings(base); b.raw = true
    expect(buildMqttCommands(b, base).needsReboot).toBe(false)
  })
})

describe('preset table parity with firmware', () => {
  it('mirrors MQTTPresets.h (35 built-ins incl. the DMC defaults)', () => {
    expect(MQTT_PRESETS).toHaveLength(35)
    expect(MQTT_PRESETS).toContain('dutchmeshcore-1')
    expect(MQTT_PRESETS).toContain('dutchmeshcore-2')
    expect(MQTT_PRESETS).toContain('meshcore-analyzer-eu') // slot-3 default
  })
})

describe('packet filter helpers', () => {
  it('treats all/empty as all and none as none', () => {
    expect(normalizePacketFilter('all')).toBe('all')
    expect(normalizePacketFilter('')).toBe('all')
    expect(normalizePacketFilter('none')).toBe('none')
  })
  it('parses names and numbers to an ascending numeric CSV', () => {
    expect(normalizePacketFilter('advert,txt_msg')).toBe('2,4')
    expect(normalizePacketFilter('4,2')).toBe('2,4')
    expect(normalizePacketFilter('txt_msg')).toBe('2')
  })
  it('ignores unknown/out-of-range tokens', () => {
    expect(normalizePacketFilter('advert,bogus,99')).toBe('4')
  })
  it('collapses a full named set back to all', () => {
    const allNames = PACKET_TYPES.map(p => p.name).join(',')
    expect(normalizePacketFilter(allNames)).toBe('all')
  })
  it('parse/format round-trips a partial set', () => {
    expect(formatPacketFilter(parsePacketFilter('2,4'))).toBe('2,4')
    expect(parsePacketFilter('all').size).toBe(PACKET_TYPES.length)
    expect(parsePacketFilter('none').size).toBe(0)
  })
})

describe('neighbors / watchdog / per-slot filter', () => {
  it('defaults: watchdog 5, neighbors off + unsupported, slot filter all', () => {
    const s = defaultMqttSettings()
    expect(s.radioWatchdog).toBe(5)
    expect(s.neighbors).toBe(false)
    expect(s.neighborsSupported).toBe(false)
    expect(s.slots[0].filter).toBe('all')
  })
  it('requests the new get keys', () => {
    const cmds = mqttGetCommands()
    expect(cmds).toContain('mqtt.neighbors')
    expect(cmds).toContain('mqtt.neighbors.interval')
    expect(cmds).toContain('radio.watchdog')
    expect(cmds).toContain('mqtt1.filter')
    expect(cmds).toContain('mqtt6.filter')
  })
  it('assembles support flag, interval, watchdog and slot filter', () => {
    const s = assembleMqttSettings({
      'mqtt.neighbors': '> on',
      'mqtt.neighbors.interval': '> 24 hours',
      'radio.watchdog': '> 10 min',
      'mqtt1.preset': '> dutchmeshcore-1',
      'mqtt1.filter': '> 2,4',
    })
    expect(s.neighborsSupported).toBe(true)
    expect(s.neighbors).toBe(true)
    expect(s.neighborsInterval).toBe(24)
    expect(s.radioWatchdog).toBe(10)
    expect(s.slots[0].filter).toBe('2,4')
  })
  it('marks neighbors unsupported when the firmware rejects the get', () => {
    expect(assembleMqttSettings({ 'mqtt.neighbors': '> Unknown command' }).neighborsSupported).toBe(false)
  })
  it('emits watchdog and per-slot filter for active slots', () => {
    const base = defaultMqttSettings()
    const next = cloneMqttSettings(base)
    next.radioWatchdog = 0
    next.slots[0].preset = 'dutchmeshcore-1'
    next.slots[0].filter = '2,4'
    const { cmds } = buildMqttCommands(next, base)
    expect(cmds).toContain('set radio.watchdog 0')
    expect(cmds).toContain('set mqtt1.filter 2,4')
  })
  it('gates neighbors commands on live support', () => {
    const base = defaultMqttSettings() // unsupported
    const a = cloneMqttSettings(base); a.neighbors = true
    expect(buildMqttCommands(a, base).cmds).not.toContain('set mqtt.neighbors on')
    const base2 = cloneMqttSettings(base); base2.neighborsSupported = true
    const b = cloneMqttSettings(base2); b.neighbors = true
    expect(buildMqttCommands(b, base2).cmds).toContain('set mqtt.neighbors on')
  })
  it('does not push a filter for a disabled (none) slot', () => {
    const base = defaultMqttSettings()
    const next = cloneMqttSettings(base)
    next.slots[0].filter = 'none' // preset still 'none'
    expect(buildMqttCommands(next, base).cmds).not.toContain('set mqtt1.filter none')
  })
})

describe('sanitizeImportedMqtt', () => {
  it('fills fields missing from an older backup and forces live neighbor support', () => {
    const s = sanitizeImportedMqtt({ origin: 'X', slots: [{ preset: 'dutchmeshcore-1' }] }, true)
    expect(s.origin).toBe('X')
    expect(s.radioWatchdog).toBe(5)       // absent in file -> default
    expect(s.slots).toHaveLength(MQTT_SLOT_COUNT)
    expect(s.slots[0].filter).toBe('all') // absent in file -> default
    expect(s.neighborsSupported).toBe(true)
  })
  it('never trusts a file-provided neighborsSupported', () => {
    expect(sanitizeImportedMqtt({ neighborsSupported: true }, false).neighborsSupported).toBe(false)
  })
})
