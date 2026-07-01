import { describe, it, expect } from 'vitest'
import { deviceImageSrc } from '../utils/deviceImage'

describe('deviceImageSrc', () => {
  it('maps a device name straight to its board SVG', () => {
    expect(deviceImageSrc({ name: 'Heltec V4' })).toBe('/img/heltec_v4.svg')
    expect(deviceImageSrc({ name: 'ThinkNode M1' })).toBe('/img/thinknode_m1.svg')
    expect(deviceImageSrc({ name: 'SenseCAP Solar' })).toBe('/img/sensecap_solar.svg')
  })

  it('maps names whose SVG slug differs from the label', () => {
    expect(deviceImageSrc({ name: 'Heltec V4 Expansion Kit' })).toBe('/img/heltec_v4_exp.svg')
    expect(deviceImageSrc({ name: 'RAK4631' })).toBe('/img/rak_4631.svg')
    expect(deviceImageSrc({ name: 'PicoW' })).toBe('/img/rpi_picow.svg')
    expect(deviceImageSrc({ name: 't1000e' })).toBe('/img/sensecap_t1000e.svg')
    expect(deviceImageSrc({ name: 'Mesh pocket' })).toBe('/img/heltec_meshpocket.svg')
    expect(deviceImageSrc({ name: 'Nano G2 Ultra' })).toBe('/img/nano_g2.svg')
  })

  it('normalizes punctuation/case/spacing and variant suffixes', () => {
    expect(deviceImageSrc({ name: 'Heltec T114 (No Display)' })).toBe('/img/heltec_t114.svg')
    expect(deviceImageSrc({ name: 'Station G2 logging' })).toBe('/img/station_g2.svg')
    expect(deviceImageSrc({ name: 'WioTrackerL1Eink' })).toBe('/img/wio_tracker_l1_eink.svg')
    expect(deviceImageSrc({ name: 'Xiao S3 WIO' })).toBe('/img/xiao_esp32s3.svg')
  })

  it('shares one SVG across a device family', () => {
    expect(deviceImageSrc({ name: 'iKoka Nano NRF 22dBm' })).toBe('/img/ikoka_nano.svg')
    expect(deviceImageSrc({ name: 'iKoka Nano NRF 33dBm' })).toBe('/img/ikoka_nano.svg')
    expect(deviceImageSrc({ name: 'T-Beam SX1262' })).toBe('/img/lilygo_tbeam.svg')
    expect(deviceImageSrc({ name: 'T-Beam SX1276' })).toBe('/img/lilygo_tbeam.svg')
  })

  it('returns null for devices with no board art', () => {
    expect(deviceImageSrc({ name: 'Generic E22 SX1262' })).toBeNull()
    expect(deviceImageSrc({ name: 'Ebyte EoRa-S3' })).toBeNull()
    expect(deviceImageSrc({ name: 'Station G3 ESP32' })).toBeNull()
    expect(deviceImageSrc({ name: 'Totally Unknown Device' })).toBeNull()
  })
})
