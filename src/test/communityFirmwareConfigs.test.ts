import { describe, it, expect, vi } from 'vitest'
import {
  parseMeshcomodAsset,
  meshcomodConfigFromReleases,
} from '../utils/communityFirmwareConfigs'

// GitHub Releases of Elektr0Vodka/meshcomod. Each companion release carries, per env:
//   <env>-vX.Y.Z.W-<sha>.bin         app image   (kept)
//   <env>-vX.Y.Z.W-<sha>-merged.bin  full flash  (kept)
//   <env>.bin                        app copy    (ignored)
//   <env>-YYYYMMDD_HHMMSS-<sha>.bin  timestamped (ignored)
//   <env>.partsig                    OTA sig     (ignored)

const DL = 'https://github.com/Elektr0Vodka/meshcomod/releases/download'

function envAssets(tag: string, env: string, sha = 'abc1234') {
  const v = tag.replace('companion-', '')
  return [
    `${env}-${v}-${sha}.bin`,
    `${env}-${v}-${sha}-merged.bin`,
    `${env}.bin`,
    `${env}-20261016_120000-${sha}.bin`,
    `${env}.partsig`,
  ].map(name => ({ name, browser_download_url: `${DL}/${tag}/${name}` }))
}

function release(tag: string, envs: string[], extra: { prerelease?: boolean; draft?: boolean } = {}) {
  return {
    tag_name: tag,
    prerelease: extra.prerelease ?? false,
    draft: extra.draft ?? false,
    assets: envs.flatMap(env => envAssets(tag, env)),
  }
}

const ALL_ENVS = [
  'heltec_v4_companion_radio_usb_tcp',
  'Heltec_v3_companion_radio_usb_tcp',
  'Heltec_Wireless_Paper_companion_radio_usb_tcp',
  'Xiao_S3_WIO_companion_radio_usb_tcp',
  'heltec_v4_r8_companion_radio_usb_tcp',
  'heltec_v4_r8_tft_companion_radio_usb_tcp',
  'heltec_v4_tft_companion_radio_usb_tcp',
  'Heltec_WSL3_companion_radio_usb_tcp',
  'ThinkNode_M7_companion_radio_ble',
  'ThinkNode_M7_companion_radio_ethernet',
]

type Config = ReturnType<typeof meshcomodConfigFromReleases>

function versionsOf(cfg: Config, deviceName: string, role: string): string[] {
  const dev = cfg.device.find(d => d.name === deviceName)
  const fw = dev?.firmware.find(f => f.role === role)
  return Object.keys(fw?.version ?? {})
}

describe('parseMeshcomodAsset', () => {
  it('keeps all four version parts', () => {
    const a = parseMeshcomodAsset('heltec_v4_companion_radio_usb_tcp-v1.18.0.1-abc1234.bin', 'u1')
    const b = parseMeshcomodAsset('heltec_v4_companion_radio_usb_tcp-v1.18.0.2-abc1234.bin', 'u2')
    expect(a).toMatchObject({ deviceKey: 'heltec_v4', role: 'companion_radio_usb_tcp', versionKey: 'v1.18.0.1', isMerged: false })
    expect(b?.versionKey).toBe('v1.18.0.2')
  })

  it('keeps the pre-release suffix of a pre-release asset', () => {
    expect(parseMeshcomodAsset('Heltec_v3_companion_radio_usb_tcp-v1.18.0.1-pre2-a6cda50-merged.bin', 'u'))
      .toMatchObject({ deviceKey: 'Heltec_v3', versionKey: 'v1.18.0.1-pre2', isMerged: true })
  })

  it('recognises the merged full-flash image', () => {
    expect(parseMeshcomodAsset('Heltec_v3_companion_radio_usb_tcp-v1.18.0.1-abc1234-merged.bin', 'u'))
      .toMatchObject({ deviceKey: 'Heltec_v3', versionKey: 'v1.18.0.1', isMerged: true, ext: 'bin' })
  })

  it('ignores the plain copy, the timestamped copy and the partition signature', () => {
    expect(parseMeshcomodAsset('heltec_v4_companion_radio_usb_tcp.bin', 'u')).toBeNull()
    expect(parseMeshcomodAsset('heltec_v4_companion_radio_usb_tcp-20261016_120000-abc1234.bin', 'u')).toBeNull()
    expect(parseMeshcomodAsset('heltec_v4_companion_radio_usb_tcp.partsig', 'u')).toBeNull()
  })

  it('does not match a role separator that runs on into a longer role name', () => {
    expect(parseMeshcomodAsset('heltec_v4_tft_companion_radio_usb_tcp_touch-v1.18.0.1-abc1234.bin', 'u')).toBeNull()
    expect(parseMeshcomodAsset('heltec_v4_tft_companion_radio_usb_tcp_touch.bin', 'u')).toBeNull()
  })

  it('parses the ThinkNode M7 BLE and Ethernet roles', () => {
    expect(parseMeshcomodAsset('ThinkNode_M7_companion_radio_ble-v1.18.0.1-abc1234.bin', 'u'))
      .toMatchObject({ deviceKey: 'ThinkNode_M7', role: 'companion_radio_ble' })
    expect(parseMeshcomodAsset('ThinkNode_M7_companion_radio_ethernet-v1.18.0.1-abc1234-merged.bin', 'u'))
      .toMatchObject({ deviceKey: 'ThinkNode_M7', role: 'companion_radio_ethernet', isMerged: true })
  })
})

describe('meshcomodConfigFromReleases', () => {
  it('lists every stable companion release as a version, newest first', () => {
    // API order is not guaranteed to be version order; v1.18.0.10 must sort above v1.18.0.9.
    const cfg = meshcomodConfigFromReleases([
      release('companion-v1.18.0.9', ['heltec_v4_companion_radio_usb_tcp']),
      release('companion-v1.18.0.10', ['heltec_v4_companion_radio_usb_tcp']),
      release('companion-v1.18.0.2', ['heltec_v4_companion_radio_usb_tcp']),
    ])
    expect(versionsOf(cfg, 'Heltec V4', 'companion_radio_usb_tcp')).toEqual([
      'v1.18.0.10 – App update',
      'v1.18.0.10 – Full flash',
      'v1.18.0.9 – App update',
      'v1.18.0.9 – Full flash',
      'v1.18.0.2 – App update',
      'v1.18.0.2 – Full flash',
    ])
  })

  it('points each version at the asset of its own release', () => {
    const cfg = meshcomodConfigFromReleases([
      release('companion-v1.18.0.2', ['heltec_v4_companion_radio_usb_tcp']),
      release('companion-v1.18.0.1', ['heltec_v4_companion_radio_usb_tcp']),
    ])
    const fw = cfg.device.find(d => d.name === 'Heltec V4')!.firmware[0]
    expect(fw.version['v1.18.0.1 – App update'].files[0].name)
      .toBe(`${DL}/companion-v1.18.0.1/heltec_v4_companion_radio_usb_tcp-v1.18.0.1-abc1234.bin`)
    expect(fw.version['v1.18.0.2 – Full flash'].files[0].name)
      .toBe(`${DL}/companion-v1.18.0.2/heltec_v4_companion_radio_usb_tcp-v1.18.0.2-abc1234-merged.bin`)
  })

  it('emits only the app and merged images per env, never the ignored copies', () => {
    const cfg = meshcomodConfigFromReleases([release('companion-v1.18.0.1', ['heltec_v4_companion_radio_usb_tcp'])])
    const urls = cfg.device.flatMap(d => d.firmware.flatMap(f => Object.values(f.version).flatMap(v => v.files.map(x => x.name))))
    expect(urls).toHaveLength(2)
    expect(urls.every(u => /-v1\.18\.0\.1-abc1234(-merged)?\.bin$/.test(u))).toBe(true)
  })

  it('skips drafts and non-companion tags', () => {
    const env = ['heltec_v4_companion_radio_usb_tcp']
    const cfg = meshcomodConfigFromReleases([
      release('companion-v1.18.0.4', env, { draft: true }),
      release('companion-v1.18.0.4-pre1', env, { prerelease: true, draft: true }),
      release('repeater-v1.18.0.1', ['heltec_v4_repeater_tcp']),
      release('room-v1.18.0.1', env),
      release('companion-v1.18.0.1', env),
    ])
    expect(versionsOf(cfg, 'Heltec V4', 'companion_radio_usb_tcp')).toEqual([
      'v1.18.0.1 – App update',
      'v1.18.0.1 – Full flash',
    ])
  })

  it('lists a pre-release as the dev build of its version, above the stable one', () => {
    const env = ['heltec_v4_companion_radio_usb_tcp']
    const cfg = meshcomodConfigFromReleases([
      release('companion-v1.18.0.1', env),
      release('companion-v1.18.0.2-pre2', env, { prerelease: true }),
    ])
    expect(versionsOf(cfg, 'Heltec V4', 'companion_radio_usb_tcp')).toEqual([
      'v1.18.0.2-dev – App update',
      'v1.18.0.2-dev – Full flash',
      'v1.18.0.1 – App update',
      'v1.18.0.1 – Full flash',
    ])
    const fw = cfg.device.find(d => d.name === 'Heltec V4')!.firmware[0]
    expect(fw.version['v1.18.0.2-dev – Full flash'].files[0].name)
      .toBe(`${DL}/companion-v1.18.0.2-pre2/heltec_v4_companion_radio_usb_tcp-v1.18.0.2-pre2-abc1234-merged.bin`)
  })

  it('treats a suffixed tag or a flagged release as dev, and keeps the newest pre-release per version', () => {
    const env = ['heltec_v4_companion_radio_usb_tcp']
    const cfg = meshcomodConfigFromReleases([
      release('companion-v1.18.0.3-pre9', env, { prerelease: true }),
      release('companion-v1.18.0.3-pre10', env, { prerelease: true }),
      release('companion-v1.18.0.3-pre2', env, { prerelease: true }),
      release('companion-v1.18.0.4-rc1', env),
      release('companion-v1.18.0.5', env, { prerelease: true }),
    ])
    expect(versionsOf(cfg, 'Heltec V4', 'companion_radio_usb_tcp')).toEqual([
      'v1.18.0.5-dev – App update',
      'v1.18.0.5-dev – Full flash',
      'v1.18.0.4-dev – App update',
      'v1.18.0.4-dev – Full flash',
      'v1.18.0.3-dev – App update',
      'v1.18.0.3-dev – Full flash',
    ])
    const fw = cfg.device.find(d => d.name === 'Heltec V4')!.firmware[0]
    expect(fw.version['v1.18.0.3-dev – App update'].files[0].name).toContain('/companion-v1.18.0.3-pre10/')
  })

  it('ignores an asset whose version does not match its release tag', () => {
    const rel = release('companion-v1.18.0.2', [])
    rel.assets.push({ name: 'heltec_v4_companion_radio_usb_tcp-v1.18.0.1-abc1234.bin', browser_download_url: 'stray' })
    expect(meshcomodConfigFromReleases([rel]).device).toEqual([])
  })

  it('labels every env of a companion release', () => {
    const cfg = meshcomodConfigFromReleases([release('companion-v1.18.0.1', ALL_ENVS)])
    expect(cfg.device.map(d => d.name).sort()).toEqual([
      'Heltec V3',
      'Heltec V4',
      'Heltec V4 R8',
      'Heltec V4 R8 TFT',
      'Heltec V4 TFT',
      'Heltec WSL3',
      'Heltec Wireless Paper',
      'ThinkNode M7',
      'Xiao S3 WIO',
    ])
    const m7 = cfg.device.find(d => d.name === 'ThinkNode M7')!
    expect(m7.firmware.map(f => f.role).sort()).toEqual(['companion_radio_ble', 'companion_radio_ethernet'])
    expect(cfg.role.companion_radio_ethernet).toBeDefined()
  })

  it('credits the fork as the maker', () => {
    const cfg = meshcomodConfigFromReleases([release('companion-v1.18.0.1', ALL_ENVS)])
    expect(cfg.maker.meshcomod.repo).toBe('https://github.com/Elektr0Vodka/meshcomod')
    expect(cfg.device.every(d => d.maker === 'meshcomod')).toBe(true)
  })

  it('copes with zero companion releases', () => {
    expect(meshcomodConfigFromReleases([]).device).toEqual([])
    expect(meshcomodConfigFromReleases([
      release('companion-v1.18.0.1', ['heltec_v4_companion_radio_usb_tcp'], { draft: true }),
      release('repeater-v1.18.0.1', ['heltec_v4_repeater_tcp']),
    ]).device).toEqual([])
  })
})

describe('scripts/update-firmware-list.js mirror', () => {
  // The generator script and the TS fallback must produce the same meshcomod config.
  const loadScript = async () => {
    const path = '../../scripts/update-firmware-list.js'
    return import(/* @vite-ignore */ path)
  }

  it('matches the TS mirror for a full release set', async () => {
    const script = await loadScript()
    const releases = [
      release('companion-v1.18.0.2', ALL_ENVS),
      release('companion-v1.18.0.1', ALL_ENVS.slice(0, 6)),
      release('companion-v1.18.0.3-pre1', ALL_ENVS, { prerelease: true }),
      release('repeater-v1.18.0.1', ['heltec_v4_repeater_tcp']),
    ]
    // The script's role map also carries the DMC roles, so compare roles per meshcomod role.
    const fromScript = script.meshcomodConfigFromReleases(releases)
    const fromTs = meshcomodConfigFromReleases(releases)
    expect({ ...fromScript, role: undefined }).toEqual({ ...fromTs, role: undefined })
    for (const role of ['companion_radio_usb_tcp', 'companion_radio_ble', 'companion_radio_ethernet']) {
      expect(fromScript.role[role]).toEqual(fromTs.role[role])
    }
  })

  it('warns and produces no devices when there is no companion release', async () => {
    const script = await loadScript()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(script.meshcomodConfigFromReleases([]).device).toEqual([])
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/no companion release/i))
    } finally {
      warn.mockRestore()
    }
  })
})
