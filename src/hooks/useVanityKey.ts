import { useRef, useState } from 'react'

export type VanityPhase = 'input' | 'generating' | 'result'

export interface VanityKeyState {
  phase: VanityPhase
  prefix: string
  attempts: number
  progress: number
  elapsed: string
  keysPerSec: string
  estimatedTime: string
  resultPubKey: string
  resultPrvKey: string
}

const KEYS_PER_SEC_PER_CORE = 500

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export function useVanityKey() {
  const genRef = useRef<{
    generate: (prefix: string) => Promise<{ privKey: string; pubKey: string; attempts: number }>
    cancel: () => void
    onProgress: ((n: number) => void) | null
    attempts: number
  } | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)

  const [state, setState] = useState<VanityKeyState>({
    phase: 'input',
    prefix: '',
    attempts: 0,
    progress: 0,
    elapsed: '0s',
    keysPerSec: '0',
    estimatedTime: '',
    resultPubKey: '',
    resultPrvKey: '',
  })

  function setPrefix(prefix: string) {
    const p = prefix.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
    let estimatedTime = ''
    if (p.length > 0) {
      const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4
      const keysPerSec = cores * KEYS_PER_SEC_PER_CORE
      const expected = Math.pow(16, p.length)
      const secs = expected / keysPerSec
      estimatedTime = secs < 1 ? '< 1s' : `~${Math.ceil(secs)}s`
    }
    setState(s => ({ ...s, prefix: p, estimatedTime }))
  }

  async function start(prefix: string) {
    // @ts-ignore
    const { VanityKeyGenerator } = await import('../lib/config/vanity-key-generator.js')
    const gen = new VanityKeyGenerator()
    genRef.current = gen

    startRef.current = Date.now()
    setState(s => ({ ...s, phase: 'generating', attempts: 0, progress: 0, elapsed: '0s', keysPerSec: '0' }))

    gen.onProgress = (total: number) => {
      const elapsedMs = Date.now() - startRef.current
      const kps = Math.round(total / (elapsedMs / 1000))
      const expected = Math.pow(16, prefix.length)
      setState(s => ({
        ...s,
        attempts: total,
        progress: Math.min(99, Math.round((total / expected) * 100)),
        elapsed: formatElapsed(elapsedMs),
        keysPerSec: kps.toLocaleString(),
      }))
    }

    try {
      const result = await gen.generate(prefix)
      if (timerRef.current) clearInterval(timerRef.current)
      setState(s => ({
        ...s,
        phase: 'result',
        attempts: result.attempts,
        elapsed: formatElapsed(Date.now() - startRef.current),
        resultPubKey: result.pubKey,
        resultPrvKey: result.privKey,
      }))
    } catch {
      setState(s => ({ ...s, phase: 'input' }))
    }
  }

  function cancel() {
    genRef.current?.cancel()
    if (timerRef.current) clearInterval(timerRef.current)
    setState(s => ({ ...s, phase: 'input' }))
  }

  function reset() {
    setState({
      phase: 'input', prefix: '', attempts: 0, progress: 0,
      elapsed: '0s', keysPerSec: '0', estimatedTime: '',
      resultPubKey: '', resultPrvKey: '',
    })
  }

  return { ...state, setPrefix, start, cancel, reset }
}
