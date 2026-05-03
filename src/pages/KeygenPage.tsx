import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { useKeygen } from '../hooks/useKeygen'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatRate(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M/s`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K/s`
  return `${n}/s`
}

function expectedAttempts(len: number): string {
  return formatNumber(Math.pow(16, len))
}

function difficultyInfo(len: number): { label: string; color: string } {
  if (len <= 2) return { label: 'Instant',   color: '#4ade80' }
  if (len <= 4) return { label: 'Fast',       color: '#a3e635' }
  if (len <= 5) return { label: 'Moderate',   color: '#facc15' }
  if (len <= 6) return { label: 'Slow',       color: '#fb923c' }
  return         { label: 'Very slow',  color: '#f87171' }
}

function downloadJson(publicKey: string, privateKey: string) {
  const blob = new Blob(
    [JSON.stringify({ public_key: publicKey, private_key: privateKey }, null, 2)],
    { type: 'application/json' }
  )
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = `meshcore-key-${publicKey.slice(0, 8).toLowerCase()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function KeygenPage() {
  const { t } = useLang()
  const { state, gpuStatus, start, stop } = useKeygen()

  const [prefix,      setPrefix]      = useState('')
  const [useGpu,      setUseGpu]      = useState(false)
  const [copied,      setCopied]      = useState<string | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [openFaq,     setOpenFaq]     = useState<number | null>(null)

  const upper      = prefix.toUpperCase()
  const isReserved = upper.startsWith('00') || upper.startsWith('FF')
  const isValid    = /^[0-9A-Fa-f]{1,8}$/.test(prefix) && !isReserved
  const prefixLen  = prefix.length
  const diff       = prefixLen > 0 ? difficultyInfo(prefixLen) : null

  const isRunning  = state.status === 'running'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) start(prefix, useGpu)
  }

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const progressPct = state.attempts > 0 && prefixLen > 0
    ? Math.min((state.attempts / Math.pow(16, prefixLen)) * 100, 99)
    : 0

  const faqItems = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: undefined, table: true },
    { q: t('faq_q6'), a: t('faq_a6') },
    { q: t('faq_q7'), a: undefined, list: true },
  ]

  return (
    <>
      <Navbar />
      <main className="page home-page keygen-page">
        <section className="hero">
          <img
            className="hero-logo"
            src="https://avatars.githubusercontent.com/u/279831159?s=400&u=f8b17fbf4860043026f3b7bb5233968cfd98aec9&v=4"
            alt="DutchMeshCore logo"
          />
          <h1>DutchMeshCore <em>{t('keygen_title')}</em></h1>
          <p>{t('keygen_subtitle')}</p>
        </section>

        <div className="info-box keygen-info-box">
          <h4>{t('keygen_info_title')}</h4>
          <p>{t('keygen_info_body')}</p>
        </div>

        <section className="keygen-panel">
          <form onSubmit={handleSubmit} className="keygen-form">
            {/* Prefix input */}
            <div className="keygen-field">
              <label htmlFor="kgn-prefix">{t('keygen_prefix_label')}</label>
              <div className="keygen-input-row">
                <input
                  id="kgn-prefix"
                  type="text"
                  className="keygen-input"
                  value={prefix}
                  onChange={e => setPrefix(e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 8))}
                  placeholder="e.g. F8"
                  maxLength={8}
                  spellCheck={false}
                  autoComplete="off"
                  disabled={isRunning}
                />
                {diff && (
                  <span className="keygen-difficulty" style={{ color: diff.color }}>
                    {diff.label} — ~{expectedAttempts(prefixLen)} {t('keygen_attempts_avg')}
                  </span>
                )}
              </div>
              {isReserved && <p className="keygen-warn">{t('keygen_reserved_warn')}</p>}
              {!prefix    && <p className="keygen-hint">{t('keygen_prefix_hint')}</p>}
            </div>

            {/* GPU toggle */}
            {gpuStatus === 'available' && (
              <div className="keygen-field">
                <label className="keygen-gpu-label">
                  <input
                    type="checkbox"
                    checked={useGpu}
                    onChange={e => setUseGpu(e.target.checked)}
                    disabled={isRunning}
                  />
                  <span>⚡ {t('keygen_gpu_toggle')}</span>
                </label>
                <p className="keygen-hint">{t('keygen_gpu_hint')}</p>
              </div>
            )}
            {gpuStatus === 'detecting' && (
              <p className="keygen-hint">{t('keygen_gpu_detecting')}</p>
            )}

            {/* Buttons */}
            <div className="keygen-buttons">
              <button type="submit" className="btn btn-accent" disabled={!isValid || isRunning}>
                {t('keygen_generate')}
              </button>
              <button type="button" className="btn" onClick={stop} disabled={!isRunning}>
                {t('keygen_stop')}
              </button>
            </div>
          </form>

          {/* Progress */}
          {isRunning && (
            <div className="keygen-progress">
              {state.statusText ? (
                <p className="keygen-hint" style={{ fontStyle: 'italic' }}>{state.statusText}</p>
              ) : (
                <>
                  <div className="keygen-progress-bar">
                    <div className="keygen-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="keygen-stats">
                    <span>{t('keygen_attempts')}: <strong>{formatNumber(state.attempts)}</strong></span>
                    <span>{t('keygen_rate')}: <strong>{formatRate(state.rate)}</strong></span>
                    <span>{t('keygen_elapsed')}: <strong>{state.elapsed}s</strong></span>
                    <span>{t('keygen_mode')}: <strong>{state.mode === 'gpu' ? '⚡ GPU' : `${t('keygen_mode_wasm')} ×${state.workerCount}`}</strong></span>
                  </div>
                </>
              )}
            </div>
          )}

          {state.status === 'stopped' && (
            <p className="keygen-hint">{t('keygen_stopped')}</p>
          )}

          {state.status === 'error' && (
            <div className="info-box danger">
              <strong>{t('keygen_error')}</strong>
              <p>{state.error}</p>
            </div>
          )}

          {/* Result */}
          {state.status === 'found' && state.result && (
            <div className="keygen-result">
              <h3>{t('keygen_result_title')}</h3>
              <div className="keygen-result-stats">
                <span>{formatNumber(state.result.attempts)} {t('keygen_attempts')}</span>
                <span>{state.result.elapsed.toFixed(1)}s</span>
                <span>{formatRate(state.result.rate)}</span>
                <span>{state.mode === 'gpu' ? '⚡ GPU' : `WASM ×${state.workerCount}`}</span>
              </div>

              <div className="keygen-key-block">
                <label>{t('keygen_pubkey')}</label>
                <div className="keygen-key-row">
                  <code className="keygen-key">{state.result.publicKey}</code>
                  <button className="btn keygen-copy-btn" onClick={() => copyToClipboard(state.result!.publicKey, 'pub')}>
                    {copied === 'pub' ? t('keygen_copied') : t('keygen_copy')}
                  </button>
                </div>
              </div>

              <div className="keygen-key-block">
                <label>{t('keygen_privkey')}</label>
                <div className="keygen-key-row">
                  <code className="keygen-key keygen-key-private">{state.result.privateKey}</code>
                  <button className="btn keygen-copy-btn" onClick={() => copyToClipboard(state.result!.privateKey, 'priv')}>
                    {copied === 'priv' ? t('keygen_copied') : t('keygen_copy')}
                  </button>
                </div>
              </div>

              <p className="keygen-validation">✓ {t('keygen_validation')}</p>

              <div className="keygen-result-actions">
                <button className="btn btn-accent" onClick={() => downloadJson(state.result!.publicKey, state.result!.privateKey)}>
                  {t('keygen_download')}
                </button>
                <button className="btn" onClick={() => setShowModal(true)}>
                  📋 {t('keygen_how_to_import')}
                </button>
                <button className="btn" onClick={() => start(prefix, useGpu)}>
                  {t('keygen_regenerate')}
                </button>
              </div>

              <div className="info-box warn" style={{ marginTop: '16px' }}>
                <strong>{t('keygen_privkey_warn_title')}</strong>
                <p>{t('keygen_privkey_warn_body')}</p>
              </div>
            </div>
          )}
        </section>

        {/* FAQ */}
        <section className="keygen-faq">
          <h2>{t('faq_title')}</h2>
          {faqItems.map((item, i) => (
            <div key={i} className="keygen-faq-item">
              <button
                className="keygen-faq-q"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span>{item.q}</span>
                <span className="keygen-faq-arrow">{openFaq === i ? '▲' : '▼'}</span>
              </button>
              {openFaq === i && (
                <div className="keygen-faq-body">
                  {item.a && <p>{item.a}</p>}
                  {item.table && (
                    <>
                      <p>{t('faq_a5_intro')}</p>
                      <table className="keygen-perf-table">
                        <thead><tr><th>{t('faq_table_len')}</th><th>{t('faq_table_time')}</th></tr></thead>
                        <tbody>
                          <tr><td>{t('faq_table_2')}</td><td>{t('faq_table_2t')}</td></tr>
                          <tr><td>{t('faq_table_4')}</td><td>{t('faq_table_4t')}</td></tr>
                          <tr><td>{t('faq_table_6')}</td><td>{t('faq_table_6t')}</td></tr>
                          <tr><td>{t('faq_table_8')}</td><td>{t('faq_table_8t')}</td></tr>
                        </tbody>
                      </table>
                    </>
                  )}
                  {item.list && (
                    <ul>
                      <li><strong>{t('faq_ts1_title')}</strong> {t('faq_ts1_body')}</li>
                      <li><strong>{t('faq_ts2_title')}</strong> {t('faq_ts2_body')}</li>
                      <li><strong>{t('faq_ts3_title')}</strong> {t('faq_ts3_body')}</li>
                      <li><strong>{t('faq_ts4_title')}</strong> {t('faq_ts4_body')}</li>
                      <li><strong>{t('faq_ts5_title')}</strong> {t('faq_ts5_body')}</li>
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>

        <footer className="site-footer">
          <a href="https://github.com/Dutch-MeshCore" target="_blank" rel="noopener noreferrer">Dutch-MeshCore</a>
          {' '}— {t('footer')}
        </footer>
      </main>

      {/* Import instructions modal */}
      {showModal && (
        <div className="keygen-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="keygen-modal" onClick={e => e.stopPropagation()}>
            <div className="keygen-modal-head">
              <h3>📋 {t('modal_title')}</h3>
              <button className="keygen-modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="keygen-modal-body">
              <div className="keygen-import-section">
                <h4>🔧 {t('modal_companion_title')}</h4>
                <ol>
                  <li>{t('modal_companion_1')}</li>
                  <li>{t('modal_companion_2')}</li>
                  <li>{t('modal_companion_3')}</li>
                  <li dangerouslySetInnerHTML={{ __html: t('modal_companion_4') }} />
                  <li>{t('modal_companion_5')}</li>
                  <li><strong>{t('modal_companion_6')}</strong></li>
                </ol>
              </div>
              <div className="keygen-import-section">
                <h4>💻 {t('modal_usb_title')}</h4>
                <ol>
                  <li>{t('modal_usb_1')}</li>
                  <li dangerouslySetInnerHTML={{ __html: t('modal_usb_2') }} />
                  <li dangerouslySetInnerHTML={{ __html: t('modal_usb_3') }} />
                  <li>{t('modal_usb_4')}</li>
                </ol>
              </div>
              <div className="keygen-import-section">
                <h4>📡 {t('modal_lora_title')}</h4>
                <ol>
                  <li>{t('modal_lora_1')}</li>
                  <li>{t('modal_lora_2')}</li>
                  <li>{t('modal_lora_3')}</li>
                  <li dangerouslySetInnerHTML={{ __html: t('modal_lora_4') }} />
                  <li>{t('modal_lora_5')}</li>
                </ol>
              </div>
              <div className="keygen-import-section">
                <h4>📄 {t('modal_json_title')}</h4>
                <ol>
                  <li>{t('modal_json_1')}</li>
                  <li>{t('modal_json_2')}</li>
                  <li>{t('modal_json_3')}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
