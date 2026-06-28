import { describe, expect, it } from 'vitest'
import {
  buildDmcConfig,
  buildDmcRepeaterConfig,
  mergeDmcConfigs,
  PREBUILT_RAW_BASE,
} from '../utils/dutchFlasherConfig'

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
    expect(config.device[0].firmware[0].version['v1.15.0 — App update'].files[0]).toMatchObject({
      type: 'flash-update',
      name: 'https://example.test/heltec-v3-app.bin',
    })
    expect(config.device[0].firmware[0].version['v1.15.0 — Full flash'].files[0]).toMatchObject({
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
    expect(roomserver.version['v1.15.0 — App update'].files[0].name).toBe('https://example.test/roomserver-app.bin')
    expect(roomserver.version['v1.15.0 — Full flash'].files[0].name).toBe('https://example.test/roomserver-merged.bin')
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
    expect(roomserver.version['1.15.0 — App update'].files[0].name).toBe(
      'https://example.test/tracker-roomserver-app.bin'
    )
    expect(roomserver.version['1.15.0 — Full flash'].files[0].name).toBe(
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
    expect(roomserver.version['v1.15.0 — App update'].files[0].name).toBe(
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
    expect(rs.version['v1.16.0-dev — App update'].files[0].name).toBe('https://example.test/rs-app.bin')
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
    expect(device.firmware[0].version['1.16.0-dev — App update'].files[0]).toMatchObject({
      type: 'flash-update',
      name: 'https://example.test/v3-app.bin',
    })
    expect(device.firmware[0].version['1.16.0-dev — Full flash'].files[0]).toMatchObject({
      type: 'flash-wipe',
      name: 'https://example.test/v3-merged.bin',
    })
    expect(config.maker.dutchmeshcore_repeater.name).toBe('DutchMeshCore Firmware')
    expect(config.role.dutchmeshcore_repeater).toMatchObject({
      title: 'DutchMeshCore Repeater',
      subTitle: 'Repeater (non-MQTT)',
    })
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

    // A shared device name appears once under each maker — two separate blocks.
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
