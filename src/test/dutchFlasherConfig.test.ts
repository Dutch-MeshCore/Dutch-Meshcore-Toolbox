import { describe, expect, it } from 'vitest'
import { buildDmcConfig, PREBUILT_RAW_BASE } from '../utils/dutchFlasherConfig'

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
})
