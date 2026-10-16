import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildDmcConfig,
  buildDmcRepeaterConfig,
  buildDmcPacketlogConfig,
  buildDmcCompanionConfig,
  fetchDmcConfig,
  mergeDmcConfigs,
  PREBUILT_RAW_BASE,
} from '../utils/dutchFlasherConfig'
import type { FlasherConfig } from '../types'

describe('buildDmcConfig', () => {
  it('builds repeater observer MQTT firmware from prebuilt bin pairs', () => {
    const config = buildDmcConfig([
      {
        name: 'Heltec_v3_repeater_observer_mqtt-v1.15.0-dutchmeshcore.nl-ebb7801d.bin',
        download_url: 'https://example.test/heltec-v3-app.bin',
      },
      {
        name: 'Heltec_v3_repeater_observer_mqtt-v1.15.0-dutchmeshcore.nl-ebb7801d-merged.bin',
        download_url: 'https://example.test/heltec-v3-merged.bin',
      },
    ])

    expect(config.device).toHaveLength(1)
    expect(config.device[0].name).toBe('Heltec V3')
    expect(config.device[0].firmware[0].role).toBe('dutchmeshcore_mqtt')
    expect(config.device[0].firmware[0].version['v1.15.0 - App update'].files[0]).toMatchObject({
      type: 'flash-update',
      name: 'https://example.test/heltec-v3-app.bin',
    })
    expect(config.device[0].firmware[0].version['v1.15.0 - Full flash'].files[0]).toMatchObject({
      type: 'flash-wipe',
      name: 'https://example.test/heltec-v3-merged.bin',
    })
  })

  it('adds roomserver MQTT firmware as a separate selectable role on the same device', () => {
    const config = buildDmcConfig([
      {
        name: 'Heltec_v3_repeater_observer_mqtt-v1.15.0-dutchmeshcore.nl-ebb7801d.bin',
        download_url: 'https://example.test/repeater-app.bin',
      },
      {
        name: 'Heltec_v3_room_server_observer_mqtt-v1.15.0-dutchmeshcore.nl-ebb7801d.bin',
        download_url: 'https://example.test/roomserver-app.bin',
      },
      {
        name: 'Heltec_v3_room_server_observer_mqtt-v1.15.0-dutchmeshcore.nl-ebb7801d-merged.bin',
        download_url: 'https://example.test/roomserver-merged.bin',
      },
    ])

    const device = config.device[0]
    expect(device.firmware.map(fw => fw.role)).toEqual([
      'dutchmeshcore_mqtt',
      'dutchmeshcore_roomserver_mqtt',
    ])
    expect(config.role.dutchmeshcore_roomserver_mqtt).toMatchObject({
      title: 'DutchMeshCore Roomserver MQTT',
      subTitle: 'Room Server + Observer + MQTT',
    })

    const roomserver = device.firmware[1]
    expect(roomserver.version['v1.15.0 - App update'].files[0].name).toBe('https://example.test/roomserver-app.bin')
    expect(roomserver.version['v1.15.0 - Full flash'].files[0].name).toBe('https://example.test/roomserver-merged.bin')
  })

  it('builds roomserver observer MQTT firmware from the Dutch release filename shape', () => {
    const config = buildDmcConfig([
      {
        name: 'Heltec_Wireless_Tracker_room_server_observer_mqtt-1.15.0-dutchmeshcore.nl-0a493182.bin',
        download_url: 'https://example.test/tracker-roomserver-app.bin',
      },
      {
        name: 'Heltec_Wireless_Tracker_room_server_observer_mqtt-1.15.0-dutchmeshcore.nl-0a493182-merged.bin',
        download_url: 'https://example.test/tracker-roomserver-merged.bin',
      },
    ])

    expect(config.device).toHaveLength(1)
    expect(config.device[0].name).toBe('Heltec Wireless Tracker')
    const roomserver = config.device[0].firmware[0]
    expect(roomserver.role).toBe('dutchmeshcore_roomserver_mqtt')
    expect(roomserver.version['1.15.0 - App update'].files[0].name).toBe(
      'https://example.test/tracker-roomserver-app.bin'
    )
    expect(roomserver.version['1.15.0 - Full flash'].files[0].name).toBe(
      'https://example.test/tracker-roomserver-merged.bin'
    )
  })

  it('accepts roomserver_mqtt as an alias and falls back to raw GitHub URLs', () => {
    const config = buildDmcConfig([
      {
        name: 'Heltec_v3_roomserver_mqtt-v1.15.0-dutchmeshcore.nl-ebb7801d.bin',
        download_url: null,
      },
    ])

    const roomserver = config.device[0].firmware[0]
    expect(roomserver.role).toBe('dutchmeshcore_roomserver_mqtt')
    expect(roomserver.version['v1.15.0 - App update'].files[0].name).toBe(
      `${PREBUILT_RAW_BASE}/Heltec_v3_roomserver_mqtt-v1.15.0-dutchmeshcore.nl-ebb7801d.bin`
    )
  })

  it('ignores unsupported firmware roles', () => {
    const config = buildDmcConfig([
      {
        name: 'Heltec_v3_companion_radio_usb-v1.15.0-dee3e26.bin',
        download_url: 'https://example.test/companion.bin',
      },
    ])

    expect(config.device).toHaveLength(0)
  })

  it('uses the release-tag version override, ignoring the filename version', () => {
    const config = buildDmcConfig([
      {
        name: 'Heltec_v3_room_server_observer_mqtt-dev-f57f8c2.bin',
        download_url: 'https://example.test/rs-app.bin',
        version: 'v1.16.0-dev',
      },
    ])
    const rs = config.device[0].firmware[0]
    expect(rs.role).toBe('dutchmeshcore_roomserver_mqtt')
    expect(rs.version['v1.16.0-dev - App update'].files[0].name).toBe('https://example.test/rs-app.bin')
  })

  it('labels rolling dev-channel builds `<semver>-dev` from the filename version', () => {
    // The `observer-mqtt-dev` release has no semver in its tag, so fetchDmcConfig marks
    // its files devChannel and the version must come from the filename with a `-dev`
    // suffix, never a bare `v1.17.1` that collides with the stable 1.17.1 MQTT builds.
    const config = buildDmcConfig([
      {
        name: 'Heltec_v3_repeater_observer_mqtt-v1.17.1-29011959.bin',
        download_url: 'https://example.test/dev-app.bin',
        devChannel: true,
      },
      {
        name: 'Heltec_v3_repeater_observer_mqtt-v1.17.1-29011959-merged.bin',
        download_url: 'https://example.test/dev-merged.bin',
        devChannel: true,
      },
    ])

    const fw = config.device[0].firmware[0]
    expect(fw.role).toBe('dutchmeshcore_mqtt')
    expect(Object.keys(fw.version)).toEqual(['1.17.1-dev - App update', '1.17.1-dev - Full flash'])
    expect(fw.version['1.17.1-dev - App update'].files[0].name).toBe('https://example.test/dev-app.bin')
    expect(fw.version['1.17.1-dev - Full flash'].files[0].name).toBe('https://example.test/dev-merged.bin')
  })
})

describe('buildDmcRepeaterConfig', () => {
  it('builds esp32 repeater firmware with the version derived from the release tag', () => {
    const config = buildDmcRepeaterConfig([
      {
        tag_name: 'dmc-repeater-v1.16.0-dev',
        assets: [
          { name: 'Heltec_v3_repeater-dev-0130fc3.bin', browser_download_url: 'https://example.test/v3-app.bin' },
          { name: 'Heltec_v3_repeater-dev-0130fc3-merged.bin', browser_download_url: 'https://example.test/v3-merged.bin' },
        ],
      },
    ])

    expect(config.device).toHaveLength(1)
    const device = config.device[0]
    expect(device.name).toBe('Heltec V3')
    expect(device.type).toBe('esp32')
    expect(device.maker).toBe('dutchmeshcore_repeater')
    expect(device.firmware[0].role).toBe('dutchmeshcore_repeater')
    expect(device.firmware[0].version['1.16.0-dev - App update'].files[0]).toMatchObject({
      type: 'flash-update',
      name: 'https://example.test/v3-app.bin',
    })
    expect(device.firmware[0].version['1.16.0-dev - Full flash'].files[0]).toMatchObject({
      type: 'flash-wipe',
      name: 'https://example.test/v3-merged.bin',
    })
    expect(config.maker.dutchmeshcore_repeater.name).toBe('DutchMeshCore Firmware')
    expect(config.role.dutchmeshcore_repeater).toMatchObject({
      title: 'DutchMeshCore Repeater',
      subTitle: 'Repeater (non-MQTT)',
    })
  })

  it('labels the rolling dmc-repeater-dev / packetlog-dev builds `<semver>-dev` from the filename', () => {
    const repeater = buildDmcRepeaterConfig([
      {
        tag_name: 'dmc-repeater-dev',
        assets: [
          { name: 'Heltec_v3_repeater-v1.17.1-a75332f9.bin', browser_download_url: 'https://example.test/v3-app.bin' },
          { name: 'Heltec_v3_repeater-v1.17.1-a75332f9-merged.bin', browser_download_url: 'https://example.test/v3-merged.bin' },
        ],
      },
      {
        tag_name: 'dmc-repeater-v1.17.1',
        assets: [
          { name: 'Heltec_v3_repeater-v1.17.1-85c7273.bin', browser_download_url: 'https://example.test/v3-stable.bin' },
        ],
      },
    ])
    expect(Object.keys(repeater.device[0].firmware[0].version)).toEqual([
      '1.17.1-dev - App update', '1.17.1-dev - Full flash', '1.17.1 - App update',
    ])

    const packetlog = buildDmcPacketlogConfig([
      {
        tag_name: 'dmc-repeater-packetlog-dev',
        assets: [
          { name: 'RAK_4631_repeater-v1.17.1-packetlog-1ebe0339.zip', browser_download_url: 'https://example.test/rak.zip' },
        ],
      },
    ])
    expect(packetlog.device[0].firmware[0].version['1.17.1-dev'].files[0].name).toBe('https://example.test/rak.zip')
  })

  it('builds nrf52 repeater firmware as a single entry, preferring zip over uf2', () => {
    const config = buildDmcRepeaterConfig([
      {
        tag_name: 'dmc-repeater-v1.16.0-dev',
        assets: [
          { name: 'Heltec_t114_repeater-dev-0130fc3.uf2', browser_download_url: 'https://example.test/t114.uf2' },
          { name: 'Heltec_t114_repeater-dev-0130fc3.zip', browser_download_url: 'https://example.test/t114.zip' },
        ],
      },
    ])

    expect(config.device).toHaveLength(1)
    const device = config.device[0]
    expect(device.name).toBe('Heltec T114')
    expect(device.type).toBe('nrf52')
    expect(device.firmware[0].version['1.16.0-dev'].files[0]).toMatchObject({
      type: 'nrf-dfu-zip',
      name: 'https://example.test/t114.zip',
    })
  })

  it('labels known device keys and ignores assets without the repeater separator', () => {
    const config = buildDmcRepeaterConfig([
      {
        tag_name: 'dmc-repeater-v1.16.0-dev',
        assets: [
          { name: 'SenseCap_Solar_repeater-dev-0130fc3.zip', browser_download_url: 'https://example.test/sensecap.zip' },
          { name: 'README.md', browser_download_url: 'https://example.test/readme' },
          { name: 'Heltec_v3_room_server_observer_mqtt-1.16.0-x.bin', browser_download_url: 'https://example.test/mqtt.bin' },
        ],
      },
    ])

    expect(config.device.map(d => d.name)).toEqual(['SenseCAP Solar'])
  })
})

describe('buildDmcPacketlogConfig', () => {
  it('builds packetlog firmware under its own maker/role with the tag-derived version', () => {
    const config = buildDmcPacketlogConfig([
      {
        tag_name: 'dmc-repeater-packetlog-v1.17.1',
        assets: [
          { name: 'Heltec_v3_repeater-v1.17.1-packetlog-42d5c835.bin', browser_download_url: 'https://example.test/v3-app.bin' },
          { name: 'Heltec_v3_repeater-v1.17.1-packetlog-42d5c835-merged.bin', browser_download_url: 'https://example.test/v3-merged.bin' },
        ],
      },
    ])

    expect(config.device).toHaveLength(1)
    const device = config.device[0]
    expect(device.name).toBe('Heltec V3')
    expect(device.maker).toBe('dutchmeshcore_packetlog')
    expect(device.firmware[0].role).toBe('dutchmeshcore_packetlog')
    // Version comes from the tag with the packetlog prefix (and leading v) stripped.
    expect(device.firmware[0].version['1.17.1 - App update'].files[0]).toMatchObject({
      type: 'flash-update',
      name: 'https://example.test/v3-app.bin',
    })
    expect(config.maker.dutchmeshcore_packetlog.name).toBe('DutchMeshCore-PacketLog-Firmware')
    expect(config.role.dutchmeshcore_packetlog).toMatchObject({
      title: 'DutchMeshCore Repeater PacketLog',
      subTitle: 'Repeater + packet logging',
    })
  })

  it('keeps packetlog, repeater and mqtt as three separate maker groups', () => {
    const repeater = buildDmcRepeaterConfig([
      { tag_name: 'dmc-repeater-v1.17.1', assets: [
        { name: 'Heltec_v3_repeater-v1.17.1-abc.bin', browser_download_url: 'https://example.test/rep.bin' },
      ] },
    ])
    const packetlog = buildDmcPacketlogConfig([
      { tag_name: 'dmc-repeater-packetlog-v1.17.1', assets: [
        { name: 'Heltec_v3_repeater-v1.17.1-packetlog-abc.bin', browser_download_url: 'https://example.test/pl.bin' },
      ] },
    ])
    const mqtt = buildDmcConfig([
      { name: 'Heltec_v3_repeater_observer_mqtt-v1.17.1-dutchmeshcore.nl-abc.bin', download_url: 'https://example.test/mqtt.bin' },
    ])

    const merged = mergeDmcConfigs(repeater, packetlog, mqtt)
    expect(Object.keys(merged.maker).sort()).toEqual(
      ['dutchmeshcore', 'dutchmeshcore_packetlog', 'dutchmeshcore_repeater'],
    )
    const v3 = merged.device.filter(d => d.name === 'Heltec V3')
    expect(v3.map(d => d.maker).sort()).toEqual(
      ['dutchmeshcore', 'dutchmeshcore_packetlog', 'dutchmeshcore_repeater'],
    )
  })
})

describe('mergeDmcConfigs', () => {
  it('keeps the repeater and mqtt firmware as two separate maker groups', () => {
    const repeater = buildDmcRepeaterConfig([
      {
        tag_name: 'dmc-repeater-v1.16.0-dev',
        assets: [
          { name: 'Heltec_v3_repeater-dev-0130fc3.bin', browser_download_url: 'https://example.test/v3-app.bin' },
        ],
      },
    ])
    const mqtt = buildDmcConfig([
      {
        name: 'Heltec_v3_repeater_observer_mqtt-v1.16.0-dutchmeshcore.nl-ebb7801d.bin',
        download_url: 'https://example.test/v3-mqtt.bin',
      },
    ])

    const merged = mergeDmcConfigs(repeater, mqtt)

    expect(merged.maker.dutchmeshcore_repeater.name).toBe('DutchMeshCore Firmware')
    expect(merged.maker.dutchmeshcore.name).toBe('DutchMeshCore-MQTT-Firmware')

    // A shared device name appears once under each maker - two separate blocks.
    const v3 = merged.device.filter(d => d.name === 'Heltec V3')
    expect(v3.map(d => d.maker).sort()).toEqual(['dutchmeshcore', 'dutchmeshcore_repeater'])
  })

  it('exposes both role-display maps in the merged config', () => {
    const repeater = buildDmcRepeaterConfig([
      {
        tag_name: 'dmc-repeater-v1.16.0-dev',
        assets: [
          { name: 'Xiao_S3_WIO_repeater-dev-0130fc3.bin', browser_download_url: 'https://example.test/xiao.bin' },
        ],
      },
    ])
    const mqtt = buildDmcConfig([
      {
        name: 'Heltec_T190_repeater_observer_mqtt-1.16.0-dutchmeshcore.nl-x.bin',
        download_url: 'https://example.test/t190-mqtt.bin',
      },
    ])

    const merged = mergeDmcConfigs(repeater, mqtt)

    expect(merged.role.dutchmeshcore_repeater).toBeTruthy()
    expect(merged.role.dutchmeshcore_mqtt).toBeTruthy()
    expect(merged.device.map(d => d.name).sort()).toEqual(['Heltec T190', 'Xiao S3 WIO'])
  })
})

// ─── DMC companion (receive filter) firmware ─────────────────────────────────────

const asset = (name: string) => ({ name, browser_download_url: `https://example.test/${name}` })

const COMPANION_STABLE = {
  tag_name: 'dmc-companion-v1.18.0',
  assets: [
    asset('Heltec_v3_companion_radio_ble-v1.18.0-abc1234.bin'),
    asset('Heltec_v3_companion_radio_ble-v1.18.0-abc1234-merged.bin'),
    asset('Heltec_v3_companion_radio_wifi-v1.18.0-abc1234.bin'),
    asset('Heltec_v3_companion_radio_wifi-v1.18.0-abc1234-merged.bin'),
    asset('RAK_4631_companion_radio_ble-v1.18.0-abc1234.uf2'),
    asset('RAK_4631_companion_radio_ble-v1.18.0-abc1234.zip'),
    asset('PicoW_companion_radio_wifi-v1.18.0-abc1234.bin'),
    asset('PicoW_companion_radio_wifi-v1.18.0-abc1234.uf2'),
  ],
}

const COMPANION_DEV = {
  tag_name: 'dmc-companion-dev',
  assets: [
    asset('Heltec_v3_companion_radio_ble-v1.18.0-def5678.bin'),
    asset('Heltec_v3_companion_radio_ble-v1.18.0-def5678-merged.bin'),
    asset('RAK_4631_companion_radio_ble-v1.18.0-def5678.uf2'),
  ],
}

describe('buildDmcCompanionConfig', () => {
  it('builds the companion group with the version from a stable dmc-companion-vX.Y.Z tag', () => {
    const config = buildDmcCompanionConfig([COMPANION_STABLE])

    expect(config.maker).toEqual({
      dutchmeshcore_companion: {
        name: 'DutchMeshCore Companion Filter Firmware',
        repo: 'https://github.com/Dutch-MeshCore/MeshCore/releases?q=dmc-companion',
        website: 'https://dutchmeshcore.nl',
      },
    })
    expect(config.device.map(d => d.name)).toEqual(['Heltec V3', 'PicoW', 'RAK4631'])
    expect(config.device.every(d => d.maker === 'dutchmeshcore_companion')).toBe(true)
    const v3 = config.device.find(d => d.name === 'Heltec V3')!
    expect(Object.keys(v3.firmware[0].version)).toEqual(['1.18.0 - App update', '1.18.0 - Full flash'])
  })

  it('splits BLE and Wi-Fi builds into two roles, distinct from the meshcomod companion roles', () => {
    const config = buildDmcCompanionConfig([COMPANION_STABLE])
    const v3 = config.device.find(d => d.name === 'Heltec V3')!

    expect(v3.firmware.map(fw => fw.role)).toEqual(['dutchmeshcore_companion_ble', 'dutchmeshcore_companion_wifi'])
    expect(v3.firmware[0].version['1.18.0 - App update'].files[0].name)
      .toBe('https://example.test/Heltec_v3_companion_radio_ble-v1.18.0-abc1234.bin')
    expect(v3.firmware[1].version['1.18.0 - App update'].files[0].name)
      .toBe('https://example.test/Heltec_v3_companion_radio_wifi-v1.18.0-abc1234.bin')
    expect(config.role).toEqual({
      dutchmeshcore_companion_ble:  { icon: '📻', title: 'DutchMeshCore Companion', subTitle: 'BLE + receive filter' },
      dutchmeshcore_companion_wifi: { icon: '📶', title: 'DutchMeshCore Companion', subTitle: 'Wi-Fi + receive filter' },
    })
    expect(config.role.companion_radio_ble).toBeUndefined()
  })

  it('maps the ESP32 app bin to an app update and the -merged bin to a full flash', () => {
    const v3 = buildDmcCompanionConfig([COMPANION_STABLE]).device.find(d => d.name === 'Heltec V3')!
    expect(v3.type).toBe('esp32')
    expect(v3.firmware[1].version['1.18.0 - App update'].files[0]).toMatchObject({
      type: 'flash-update',
      name: 'https://example.test/Heltec_v3_companion_radio_wifi-v1.18.0-abc1234.bin',
    })
    expect(v3.firmware[1].version['1.18.0 - Full flash'].files[0]).toMatchObject({
      type: 'flash-wipe',
      name: 'https://example.test/Heltec_v3_companion_radio_wifi-v1.18.0-abc1234-merged.bin',
    })
  })

  it('lists nRF52 builds as one entry preferring the DFU zip, and RP2040 builds as uf2 only', () => {
    const config = buildDmcCompanionConfig([COMPANION_STABLE])
    const rak = config.device.find(d => d.name === 'RAK4631')!
    expect(rak.type).toBe('nrf52')
    expect(rak.firmware.map(fw => fw.role)).toEqual(['dutchmeshcore_companion_ble'])
    expect(rak.firmware[0].version['1.18.0'].files[0]).toMatchObject({
      type: 'nrf-dfu-zip',
      name: 'https://example.test/RAK_4631_companion_radio_ble-v1.18.0-abc1234.zip',
    })

    // The RP2040 Wi-Fi build ships a .bin next to the .uf2; only the uf2 is flashable.
    const pico = config.device.find(d => d.name === 'PicoW')!
    expect(pico.type).toBe('nrf52')
    expect(pico.firmware.map(fw => fw.role)).toEqual(['dutchmeshcore_companion_wifi'])
    expect(pico.firmware[0].version).toEqual({
      '1.18.0': { files: [{ type: 'uf2', name: 'https://example.test/PicoW_companion_radio_wifi-v1.18.0-abc1234.uf2', title: 'Firmware update' }] },
    })
  })

  it('labels the rolling dmc-companion-dev build `<semver>-dev` from the filename, next to the stable build', () => {
    const config = buildDmcCompanionConfig([COMPANION_DEV, COMPANION_STABLE])
    const v3 = config.device.find(d => d.name === 'Heltec V3')!
    expect(Object.keys(v3.firmware[0].version)).toEqual([
      '1.18.0-dev - App update', '1.18.0-dev - Full flash', '1.18.0 - App update', '1.18.0 - Full flash',
    ])
    expect(v3.firmware[0].version['1.18.0-dev - App update'].files[0].name)
      .toBe('https://example.test/Heltec_v3_companion_radio_ble-v1.18.0-def5678.bin')
    const rak = config.device.find(d => d.name === 'RAK4631')!
    expect(rak.firmware[0].version['1.18.0-dev'].files[0]).toMatchObject({ type: 'uf2' })
  })

  it('ignores drafts, other tags and assets without a companion separator', () => {
    const config = buildDmcCompanionConfig([
      { ...COMPANION_STABLE, tag_name: 'dmc-companion-v1.19.0', draft: true },
      { tag_name: 'companion-v1.18.0.2', assets: [asset('heltec_v4_companion_radio_ble-v1.18.0.2-abc-merged.bin')] },
      { tag_name: 'dmc-repeater-v1.18.0', assets: [asset('Heltec_v3_companion_radio_ble-v1.18.0-abc.bin')] },
      { tag_name: 'dmc-companion-v1.18.0', assets: [
        asset('Heltec_v3_companion_radio_usb-v1.18.0-abc.bin'),
        asset('Heltec_v3_repeater-v1.18.0-abc.bin'),
        asset('README.md'),
      ] },
    ])
    expect(config.device).toEqual([])
  })
})

describe('DMC group isolation', () => {
  const RELEASES = [
    COMPANION_DEV,
    COMPANION_STABLE,
    { tag_name: 'dmc-repeater-v1.18.0', assets: [asset('Heltec_v3_repeater-v1.18.0-r1.bin')] },
    { tag_name: 'dmc-repeater-dev', assets: [asset('Heltec_v3_repeater-v1.18.0-r2.bin')] },
    { tag_name: 'dmc-repeater-packetlog-v1.18.0', assets: [asset('Heltec_v3_repeater-v1.18.0-packetlog-p1.bin')] },
    { tag_name: 'repeater-mqtt-v1.18.0', assets: [asset('Heltec_v3_repeater_observer_mqtt-v1.18.0-m1.bin')] },
  ]

  const urlsByMaker = (config: FlasherConfig) => {
    const out: Record<string, string[]> = {}
    for (const d of config.device) {
      for (const fw of d.firmware) {
        for (const v of Object.values(fw.version)) {
          for (const f of v.files) (out[d.maker] ??= []).push(f.name)
        }
      }
    }
    return out
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('keeps companion assets out of the repeater/PacketLog/MQTT groups and theirs out of the companion group', async () => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url === '/dmc-firmware.json'
      ? { ok: false, json: async () => ({}) }
      : { ok: true, json: async () => RELEASES }))

    const config = await fetchDmcConfig()
    const urls = urlsByMaker(config)

    expect(Object.keys(urls).sort()).toEqual([
      'dutchmeshcore', 'dutchmeshcore_companion', 'dutchmeshcore_packetlog', 'dutchmeshcore_repeater',
    ])
    expect(urls.dutchmeshcore_companion.length).toBeGreaterThan(0)
    expect(urls.dutchmeshcore_companion.every(u => u.includes('_companion_radio_'))).toBe(true)
    for (const maker of ['dutchmeshcore', 'dutchmeshcore_packetlog', 'dutchmeshcore_repeater']) {
      expect(urls[maker].length).toBeGreaterThan(0)
      expect(urls[maker].some(u => u.includes('_companion_radio_'))).toBe(false)
    }
    expect(urls.dutchmeshcore_repeater.some(u => u.includes('packetlog'))).toBe(false)
    expect(config.maker.dutchmeshcore_companion.name).toBe('DutchMeshCore Companion Filter Firmware')
  })
})

describe('scripts/update-firmware-list.js DMC companion mirror', () => {
  // The generator script (public/dmc-firmware.json) and this TS live-API fallback must
  // list the same companion firmware. The script labels versions with an en dash.
  const loadScript = async () => {
    const path = '../../scripts/update-firmware-list.js'
    return import(/* @vite-ignore */ path)
  }

  const normalize = (config: FlasherConfig) => config.device.map(d => ({
    maker: d.maker,
    name:  d.name,
    type:  d.type,
    roles: Object.fromEntries(d.firmware.map(fw => [fw.role, Object.fromEntries(
      Object.entries(fw.version).map(([key, v]) => [
        key.replace(' – ', ' - '),
        v.files.map(f => ({ type: f.type, name: f.name })),
      ]),
    )])),
  }))

  it('repeaterVersion keeps the repeater/PacketLog labels and reads a companion separator', async () => {
    const { repeaterVersion } = await loadScript()
    expect(repeaterVersion('dmc-repeater-v1.17.1', 'dmc-repeater-', 'Heltec_v3_repeater-v1.17.1-85c7273.bin')).toBe('1.17.1')
    expect(repeaterVersion('dmc-repeater-v1.16.0-dev', 'dmc-repeater-', 'Heltec_v3_repeater-dev-0130fc3.bin')).toBe('1.16.0-dev')
    expect(repeaterVersion('dmc-repeater-dev', 'dmc-repeater-', 'Heltec_v3_repeater-v1.17.1-a75332f9.bin')).toBe('1.17.1-dev')
    expect(repeaterVersion('dmc-repeater-packetlog-dev', 'dmc-repeater-packetlog-',
      'RAK_4631_repeater-v1.17.1-packetlog-1ebe0339.zip')).toBe('1.17.1-dev')
    expect(repeaterVersion('dmc-companion-dev', 'dmc-companion-',
      'Heltec_v3_companion_radio_wifi-v1.18.0-def5678.bin', '_companion_radio_wifi-')).toBe('1.18.0-dev')
    expect(repeaterVersion('dmc-companion-v1.18.0', 'dmc-companion-',
      'Heltec_v3_companion_radio_ble-v1.18.0-abc1234.bin', '_companion_radio_ble-')).toBe('1.18.0')
  })

  it('matches the TS companion config for stable, dev, draft and foreign releases', async () => {
    const { dmcCompanionConfigFromReleases } = await loadScript()
    const releases = [
      COMPANION_DEV,
      COMPANION_STABLE,
      { ...COMPANION_STABLE, tag_name: 'dmc-companion-v1.19.0', draft: true },
      { tag_name: 'dmc-repeater-v1.18.0', assets: [asset('Heltec_v3_repeater-v1.18.0-r1.bin')] },
      { tag_name: 'companion-v1.18.0.2', assets: [asset('heltec_v4_companion_radio_ble-v1.18.0.2-abc-merged.bin')] },
    ]
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const fromScript = dmcCompanionConfigFromReleases(releases) as FlasherConfig
      const fromTs = buildDmcCompanionConfig(releases)
      expect(normalize(fromScript)).toEqual(normalize(fromTs))
      expect(fromScript.maker).toEqual(fromTs.maker)
      for (const role of ['dutchmeshcore_companion_ble', 'dutchmeshcore_companion_wifi']) {
        expect(fromScript.role[role]).toEqual(fromTs.role[role])
      }
    } finally {
      log.mockRestore()
    }
  })
})
