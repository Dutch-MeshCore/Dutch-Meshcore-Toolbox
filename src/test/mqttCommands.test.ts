import { describe, expect, it } from 'vitest'
import {
  defaultMqttSettings, cloneMqttSettings, isMqttSupportedReply, MQTT_SLOT_COUNT,
  mqttGetCommands, assembleMqttSettings, buildMqttCommands,
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
