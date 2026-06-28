import { describe, it, expect } from 'vitest'
import { firmwareFetchUrl } from '../utils/flasherUtils'

describe('firmwareFetchUrl', () => {
  const release =
    'https://github.com/Dutch-MeshCore/MeshCore/releases/download/dmc-repeater-v1.16.0-dev/Heltec_t114_repeater-dev-0130fc3.zip'

  it('routes GitHub release downloads through the proxy', () => {
    expect(firmwareFetchUrl(release, 'https://proxy.test')).toBe(
      'https://proxy.test?url=' + encodeURIComponent(release)
    )
  })

  it('supports a same-origin path proxy (CF Pages function)', () => {
    expect(firmwareFetchUrl(release, '/fw-proxy')).toBe(
      '/fw-proxy?url=' + encodeURIComponent(release)
    )
  })

  it('strips a trailing slash on the proxy base', () => {
    expect(firmwareFetchUrl(release, 'https://proxy.test/')).toBe(
      'https://proxy.test?url=' + encodeURIComponent(release)
    )
  })

  it('leaves CORS-friendly URLs (raw.githubusercontent) unchanged', () => {
    const raw = 'https://raw.githubusercontent.com/a/b/main/x.bin'
    expect(firmwareFetchUrl(raw, 'https://proxy.test')).toBe(raw)
  })

  it('passes through unchanged when no proxy is configured', () => {
    expect(firmwareFetchUrl(release, '')).toBe(release)
  })
})
