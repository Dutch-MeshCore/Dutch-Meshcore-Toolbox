import { useCallback, useEffect, useRef, useState } from 'react'
import { Point } from '@noble/ed25519'

// ── Types ─────────────────────────────────────────────────────────────────────

export type KeygenStatus = 'idle' | 'running' | 'found' | 'stopped' | 'error'
export type KeygenMode   = 'wasm' | 'gpu'
export type GpuStatus    = 'detecting' | 'available' | 'unavailable'

export interface KeygenResult {
  publicKey:  string
  privateKey: string
  attempts:   number
  elapsed:    number
  rate:       number
}

export interface KeygenState {
  status:      KeygenStatus
  mode:        KeygenMode
  attempts:    number
  rate:        number
  elapsed:     number
  statusText:  string
  result:      KeygenResult | null
  error:       string | null
  workerCount: number
}

interface GpuScanner {
  initialize():                                                                 Promise<boolean>
  autotuneWorkgroupSize(batchSize: number):                                     Promise<void>
  warmup():                                                                     Promise<void>
  scanBatchMatches(sw: Uint32Array, pb: number[], nl: number):                  Promise<number[]>
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ED25519_ORDER    = 0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3edn
const GPU_BATCH_SIZE   = 131072
const MAX_HASH_WORKERS = 6

// Inline blob-worker: generates SHA-512 scalar candidates for the GPU pipeline
const HASH_WORKER_SCRIPT = `
self.onmessage = async (event) => {
  const { type, batchSize } = event.data;
  if (type !== 'generate') return;
  const scalarWords = new Uint32Array(batchSize * 8);
  const suffixes    = new Uint8Array(batchSize * 32);
  for (let i = 0; i < batchSize; i++) {
    const seed   = crypto.getRandomValues(new Uint8Array(32));
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-512', seed));
    const c0  = digest[0] & 248;
    const c31 = (digest[31] & 63) | 64;
    const wo  = i * 8;
    scalarWords[wo]   = c0        | (digest[1]  << 8) | (digest[2]  << 16) | (digest[3]  << 24);
    scalarWords[wo+1] = digest[4] | (digest[5]  << 8) | (digest[6]  << 16) | (digest[7]  << 24);
    scalarWords[wo+2] = digest[8] | (digest[9]  << 8) | (digest[10] << 16) | (digest[11] << 24);
    scalarWords[wo+3] = digest[12]| (digest[13] << 8) | (digest[14] << 16) | (digest[15] << 24);
    scalarWords[wo+4] = digest[16]| (digest[17] << 8) | (digest[18] << 16) | (digest[19] << 24);
    scalarWords[wo+5] = digest[20]| (digest[21] << 8) | (digest[22] << 16) | (digest[23] << 24);
    scalarWords[wo+6] = digest[24]| (digest[25] << 8) | (digest[26] << 16) | (digest[27] << 24);
    scalarWords[wo+7] = digest[28]| (digest[29] << 8) | (digest[30] << 16) | (c31        << 24);
    for (let b = 0; b < 32; b++) suffixes[i * 32 + b] = digest[32 + b];
  }
  self.postMessage(
    { type: 'results', scalarWords: scalarWords.buffer, suffixes: suffixes.buffer },
    [scalarWords.buffer, suffixes.buffer]
  );
};
`

// ── Helpers ────────────────────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function prefixToBytes(prefix: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < prefix.length; i += 2)
    bytes.push(parseInt(prefix.slice(i, i + 2).padEnd(2, '0'), 16))
  return bytes
}

function unpackScalarBytes(scalarWords: Uint32Array, index: number): Uint8Array {
  const bytes = new Uint8Array(32)
  const wo = index * 8
  for (let w = 0; w < 8; w++) {
    const v = scalarWords[wo + w], b = w * 4
    bytes[b] = v & 255; bytes[b+1] = (v >>> 8) & 255
    bytes[b+2] = (v >>> 16) & 255; bytes[b+3] = (v >>> 24) & 255
  }
  return bytes
}

function derivePublicKey(clampedScalar: Uint8Array): Uint8Array {
  let v = 0n
  for (let i = 0; i < 32; i++) v |= BigInt(clampedScalar[i]) << BigInt(i * 8)
  const scalar = v % ED25519_ORDER
  if (scalar === 0n) throw new Error('Scalar reduced to zero')
  return Point.BASE.multiply(scalar).toBytes()
}

// ── Hook ───────────────────────────────────────────────────────────────────────

const INITIAL_STATE: KeygenState = {
  status: 'idle', mode: 'wasm', attempts: 0,
  rate: 0, elapsed: 0, statusText: '', result: null, error: null, workerCount: 0,
}

export function useKeygen() {
  const [gpuStatus, setGpuStatus] = useState<GpuStatus>('detecting')
  const [state, setState]         = useState<KeygenState>(INITIAL_STATE)

  // WASM worker refs
  const wasmWorkersRef = useRef<Worker[]>([])

  // GPU refs
  const gpuScannerRef      = useRef<GpuScanner | null>(null)
  const gpuReadyRef        = useRef(false)
  const hashWorkerUrlRef   = useRef<string | null>(null)
  const hashWorkersRef     = useRef<Worker[]>([])

  // Shared
  const startTimeRef  = useRef(0)
  const attemptsRef   = useRef(0)
  const jobIdRef      = useRef(0)
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── GPU detection ──────────────────────────────────────────────────────────

  useEffect(() => {
    ;(async () => {
      if (!(navigator as Navigator & { gpu?: unknown }).gpu) {
        setGpuStatus('unavailable')
        return
      }
      try {
        if (!(globalThis as { MeshCoreGpuModule?: unknown }).MeshCoreGpuModule) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script')
            s.src = import.meta.env.BASE_URL + 'vendor/webgpu-ed25519.js'
            s.onload = () => resolve()
            s.onerror = reject
            document.head.appendChild(s)
          })
        }
        const { WebGpuEd25519Scanner } = (globalThis as unknown as { MeshCoreGpuModule: { WebGpuEd25519Scanner: new () => GpuScanner } }).MeshCoreGpuModule
        const scanner = new WebGpuEd25519Scanner()
        if (await scanner.initialize()) {
          gpuScannerRef.current = scanner
          setGpuStatus('available')
          return
        }
      } catch (e) {
        console.warn('[GPU] detection failed:', e)
      }
      setGpuStatus('unavailable')
    })()
  }, [])

  // ── Cleanup ────────────────────────────────────────────────────────────────

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const terminateWasmWorkers = useCallback(() => {
    wasmWorkersRef.current.forEach(w => { try { w.postMessage({ type: 'stop' }) } catch { /* ok */ }; w.terminate() })
    wasmWorkersRef.current = []
  }, [])

  const terminateHashWorkers = useCallback(() => {
    hashWorkersRef.current.forEach(w => w.terminate())
    hashWorkersRef.current = []
    if (hashWorkerUrlRef.current) { URL.revokeObjectURL(hashWorkerUrlRef.current); hashWorkerUrlRef.current = null }
  }, [])

  useEffect(() => () => {
    terminateWasmWorkers()
    terminateHashWorkers()
    clearTimer()
  }, [terminateWasmWorkers, terminateHashWorkers])

  const stop = useCallback(() => {
    jobIdRef.current++           // kills GPU loop via stale job ID
    terminateWasmWorkers()
    terminateHashWorkers()
    clearTimer()
    setState(s => s.status === 'running' ? { ...s, status: 'stopped', statusText: '' } : s)
  }, [terminateWasmWorkers, terminateHashWorkers])

  // ── Hash workers (GPU pipeline) ────────────────────────────────────────────

  function initHashWorkers(): Worker[] {
    const blob = new Blob([HASH_WORKER_SCRIPT], { type: 'application/javascript' })
    const url  = URL.createObjectURL(blob)
    hashWorkerUrlRef.current = url
    const count = Math.min(MAX_HASH_WORKERS, navigator.hardwareConcurrency ?? 4)
    const workers = Array.from({ length: count }, () => new Worker(url))
    hashWorkersRef.current = workers
    return workers
  }

  async function generateHashBatch(workers: Worker[]): Promise<{ scalarWords: Uint32Array; suffixes: Uint8Array }> {
    const perWorker = Math.ceil(GPU_BATCH_SIZE / workers.length)
    const batches = await Promise.all(workers.map(worker =>
      new Promise<{ scalarWords: Uint32Array; suffixes: Uint8Array }>((resolve, reject) => {
        const t = setTimeout(() => { cleanup(); reject(new Error('Hash worker timeout')) }, 30000)
        const onMsg = (e: MessageEvent) => {
          if (e.data.type !== 'results') return
          cleanup()
          resolve({ scalarWords: new Uint32Array(e.data.scalarWords), suffixes: new Uint8Array(e.data.suffixes) })
        }
        const onErr = (e: ErrorEvent) => { cleanup(); reject(e) }
        const cleanup = () => { clearTimeout(t); worker.removeEventListener('message', onMsg); worker.removeEventListener('error', onErr) }
        worker.addEventListener('message', onMsg)
        worker.addEventListener('error', onErr)
        worker.postMessage({ type: 'generate', batchSize: perWorker })
      })
    ))
    const sw = new Uint32Array(batches.reduce((s, b) => s + b.scalarWords.length, 0))
    const sf = new Uint8Array(batches.reduce((s, b) => s + b.suffixes.length, 0))
    let wo = 0, so = 0
    for (const b of batches) { sw.set(b.scalarWords, wo); sf.set(b.suffixes, so); wo += b.scalarWords.length; so += b.suffixes.length }
    return { scalarWords: sw, suffixes: sf }
  }

  // ── Start ──────────────────────────────────────────────────────────────────

  const start = useCallback((prefix: string, useGpu = false) => {
    jobIdRef.current++
    terminateWasmWorkers()
    terminateHashWorkers()
    clearTimer()

    const localJobId    = jobIdRef.current
    const targetPrefix  = prefix.toUpperCase()
    startTimeRef.current = Date.now()
    attemptsRef.current  = 0

    timerRef.current = setInterval(() => {
      if (jobIdRef.current !== localJobId) return
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const rate    = Math.round(attemptsRef.current / Math.max(elapsed, 0.001))
      setState(s => s.status === 'running' ? { ...s, elapsed: Math.round(elapsed), rate } : s)
    }, 250)

    // ── GPU path ────────────────────────────────────────────────────────────
    if (useGpu && gpuScannerRef.current) {
      const scanner = gpuScannerRef.current

      setState({ ...INITIAL_STATE, status: 'running', mode: 'gpu', statusText: gpuReadyRef.current ? '' : 'Autotuning GPU…' })

      ;(async () => {
        try {
          if (!gpuReadyRef.current) {
            await scanner.autotuneWorkgroupSize(GPU_BATCH_SIZE)
            await scanner.warmup()
            gpuReadyRef.current = true
          }
          if (jobIdRef.current !== localJobId) return

          setState(s => ({ ...s, statusText: '' }))

          const hashWorkers  = initHashWorkers()
          const prefixBytes  = prefixToBytes(targetPrefix)
          const prefixLen    = targetPrefix.length
          let nextBatch      = generateHashBatch(hashWorkers)

          while (jobIdRef.current === localJobId) {
            let batch: { scalarWords: Uint32Array; suffixes: Uint8Array }
            try { batch = await nextBatch } catch { nextBatch = generateHashBatch(hashWorkers); continue }
            if (jobIdRef.current !== localJobId) break

            nextBatch = generateHashBatch(hashWorkers) // pipeline next batch

            const matchedIdxs = await scanner.scanBatchMatches(batch.scalarWords, prefixBytes, prefixLen)
            attemptsRef.current += batch.scalarWords.length / 8
            if (jobIdRef.current !== localJobId) break

            for (const idx of matchedIdxs) {
              const privBytes = new Uint8Array(64)
              privBytes.set(unpackScalarBytes(batch.scalarWords, idx), 0)
              privBytes.set(batch.suffixes.slice(idx * 32, idx * 32 + 32), 32)

              let pubBytes: Uint8Array
              try { pubBytes = derivePublicKey(privBytes.slice(0, 32)) } catch { continue }

              const pubHex = bytesToHex(pubBytes)
              if (pubHex.startsWith('00') || pubHex.startsWith('FF') || !pubHex.startsWith(targetPrefix)) continue

              jobIdRef.current++ // stop the loop
              terminateHashWorkers()
              clearTimer()
              const elapsed = (Date.now() - startTimeRef.current) / 1000
              const rate    = Math.round(attemptsRef.current / Math.max(elapsed, 0.001))
              setState({ status: 'found', mode: 'gpu', attempts: attemptsRef.current, rate, elapsed, statusText: '',
                result: { publicKey: pubHex, privateKey: bytesToHex(privBytes), attempts: attemptsRef.current, elapsed, rate },
                error: null, workerCount: 0 })
              return
            }
            await new Promise(r => setTimeout(r, 0))
          }
          terminateHashWorkers()
        } catch (err) {
          if (jobIdRef.current !== localJobId) return
          clearTimer()
          terminateHashWorkers()
          setState(s => ({ ...s, status: 'error', error: String(err) }))
        }
      })()

      return
    }

    // ── WASM workers path ───────────────────────────────────────────────────
    const numWorkers = Math.max(1, Math.min((navigator.hardwareConcurrency ?? 4) - 1, 8))
    setState({ ...INITIAL_STATE, status: 'running', mode: 'wasm', workerCount: numWorkers, statusText: '' })

    const workers: Worker[] = []
    let errorCount = 0

    const handleMessage = (e: MessageEvent) => {
      if (jobIdRef.current !== localJobId) return
      if (e.data.type === 'progress') {
        attemptsRef.current += e.data.attemptedDelta ?? 0
      } else if (e.data.type === 'match') {
        attemptsRef.current += e.data.attemptedDelta ?? 0
        jobIdRef.current++
        terminateWasmWorkers()
        clearTimer()
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        const rate    = Math.round(attemptsRef.current / Math.max(elapsed, 0.001))
        setState({ status: 'found', mode: 'wasm', attempts: attemptsRef.current, rate, elapsed, statusText: '',
          result: { publicKey: e.data.result.publicKey, privateKey: e.data.result.privateKey, attempts: attemptsRef.current, elapsed, rate },
          error: null, workerCount: numWorkers })
      }
    }

    const handleError = (e: ErrorEvent) => {
      if (jobIdRef.current !== localJobId) return
      errorCount++
      if (errorCount >= numWorkers) {
        clearTimer()
        terminateWasmWorkers()
        setState(s => ({ ...s, status: 'error', error: `Worker error: ${e.message}. WebAssembly module workers may not be supported.` }))
      }
    }

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(import.meta.env.BASE_URL + 'wasm/worker.js', { type: 'module' })
      worker.onmessage = handleMessage
      worker.onerror   = handleError
      workers.push(worker)
    }
    wasmWorkersRef.current = workers
    workers.forEach(w => w.postMessage({ type: 'start', jobId: localJobId, targetPrefix,
      batchSize: 1024, adaptiveBatching: true, targetBatchMs: 16,
      minBatchSize: 512, maxBatchSize: 65536, progressIntervalMs: 150 }))

  }, [terminateWasmWorkers, terminateHashWorkers])

  return { state, gpuStatus, start, stop }
}
