import { useLang } from '../../hooks/useLang'
import type { VanityPhase } from '../../hooks/useVanityKey'

interface Props {
  open: boolean
  phase: VanityPhase
  prefix: string
  attempts: number
  progress: number
  elapsed: string
  keysPerSec: string
  estimatedTime: string
  resultPubKey: string
  resultPrvKey: string
  onPrefixChange: (p: string) => void
  onGenerate: () => void
  onCancel: () => void
  onApply: (pubKey: string, prvKey: string) => void
}

export default function VanityKeyDialog({
  open, phase, prefix, attempts, progress, elapsed, keysPerSec,
  estimatedTime, resultPubKey, resultPrvKey, onPrefixChange, onGenerate, onCancel, onApply,
}: Props) {
  const { t } = useLang()
  if (!open) return null

  const reserved = prefix.length >= 2 &&
    (prefix.toUpperCase().startsWith('00') || prefix.toUpperCase().startsWith('FF'))

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{t('vanity_title')}</h2>
          <button className="btn" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">

          {phase === 'input' && (
            <>
              <div className="field-group">
                <label>{t('vanity_prefix_label')}</label>
                <input
                  value={prefix}
                  maxLength={6}
                  placeholder="e.g. ab"
                  onChange={e => onPrefixChange(e.target.value)}
                />
              </div>
              {reserved && (
                <div className="info-banner warn">{t('vanity_reserved_warn')}</div>
              )}
              {prefix.length > 0 && (
                <table style={{ width: '100%', fontSize: '.85rem', borderCollapse: 'collapse', marginBottom: '.75rem' }}>
                  <tbody>
                    <tr><td style={{ color: 'var(--muted)', padding: '.2rem .5rem' }}>{t('vanity_prefix_col')}</td><td><code>{prefix.toLowerCase()}…</code></td></tr>
                    <tr><td style={{ color: 'var(--muted)', padding: '.2rem .5rem' }}>{t('vanity_attempts_col')}</td><td>{Math.pow(16, prefix.length).toLocaleString()}</td></tr>
                    <tr><td style={{ color: 'var(--muted)', padding: '.2rem .5rem' }}>{t('vanity_time_col')}</td><td>{estimatedTime}</td></tr>
                  </tbody>
                </table>
              )}
            </>
          )}

          {phase === 'generating' && (
            <>
              <p style={{ fontSize: '.9rem' }}>{t('vanity_searching')} <code>{prefix.toLowerCase()}…</code></p>
              <div className="flash-progress-bar"><div className="flash-progress-bar-fill" style={{ width: `${progress}%` }} /></div>
              <table style={{ width: '100%', fontSize: '.85rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ color: 'var(--muted)', padding: '.2rem .5rem' }}>{t('vanity_attempts')}</td><td>{attempts.toLocaleString()}</td></tr>
                  <tr><td style={{ color: 'var(--muted)', padding: '.2rem .5rem' }}>{t('vanity_elapsed')}</td><td>{elapsed}</td></tr>
                  <tr><td style={{ color: 'var(--muted)', padding: '.2rem .5rem' }}>{t('vanity_speed')}</td><td>{keysPerSec} {t('vanity_keys_sec')}</td></tr>
                </tbody>
              </table>
            </>
          )}

          {phase === 'result' && (
            <>
              <div className="info-banner info">✓ {t('vanity_found')} {attempts.toLocaleString()} {t('vanity_found2')} ({elapsed})</div>
              <div className="field-group">
                <label>{t('vanity_pubkey')}</label>
                <input value={resultPubKey} readOnly />
              </div>
              <div className="field-group">
                <label>{t('vanity_privkey')}</label>
                <input type="password" value={resultPrvKey} readOnly />
              </div>
              <div className="info-banner warn">{t('vanity_apply_warn')}</div>
            </>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onCancel}>{t('vanity_cancel')}</button>
          {phase === 'input' && (
            <button className="btn btn-accent" onClick={onGenerate} disabled={!prefix || reserved}>
              {t('vanity_generate')}
            </button>
          )}
          {phase === 'generating' && (
            <button className="btn" onClick={onCancel}>{t('vanity_stop')}</button>
          )}
          {phase === 'result' && (
            <button className="btn btn-accent" onClick={() => onApply(resultPubKey, resultPrvKey)}>
              {t('vanity_use_key')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
