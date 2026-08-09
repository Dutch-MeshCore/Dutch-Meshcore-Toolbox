import { useState } from 'react'
import type { Channel } from '../../types'
import { copyText } from '../../utils/clipboard'
import { fmtDate, relativeTime } from '../../utils/formatDate'
import { useLang } from '../../hooks/useLang'

interface Props {
  channel: Channel
  selected: boolean
  onToggleSelect: (name: string) => void
  onCopy: (msg: string) => void
  onEdit: (ch: Channel) => void
  onInfo: (ch: Channel) => void
  /** When true only the ℹ button is shown; copy-key and edit are hidden. */
  readOnlyActions?: boolean
}

export default function ChannelCard({ channel: c, selected, onToggleSelect, onCopy, onEdit: _onEdit, onInfo, readOnlyActions = false }: Props) {
  const { t } = useLang()
  const [copiedName, setCopiedName] = useState(false)
  const [copiedKey,  setCopiedKey]  = useState(false)

  async function handleCopyName() {
    const name = c.channel.replace(/^#/, '')
    const ok = await copyText(name)
    if (ok) { onCopy(`Copied ${name}`); setCopiedName(true); setTimeout(() => setCopiedName(false), 1500) }
  }

  async function handleCopyKey() {
    const ok = await copyText(c._key)
    if (ok) { onCopy(`Copied key`); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 1500) }
  }

  const cardClass = [
    'card',
    selected ? 'selected' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClass}>
      <div className="card-head">
        <div className="card-head-left">
          <input
            type="checkbox"
            className="card-cb"
            checked={selected}
            onChange={() => onToggleSelect(c.channel)}
          />
          <span
            className="channel-name"
            title={t('card_title_name')}
            onClick={handleCopyName}
          >
            {c.channel}
          </span>
        </div>
        {c.encrypted && <div className="badges"><span className="scope-tag">🔒 {t('card_encrypted')}</span></div>}
      </div>

      <div
        className="hex-key"
        title={t('card_title_key')}
        onClick={handleCopyKey}
      >
        {c._key}
      </div>

      {(c.countries?.length || c.regions?.length) ? (
        <div className="card-meta">
          {c.countries?.length ? <><span className="mk">{t('card_country')}</span><span className="mv">{c.countries.join(', ')}</span></> : null}
          {c.regions?.length   ? <><span className="mk">{t('card_region')}</span><span className="mv">{c.regions.join(', ')}</span></> : null}
        </div>
      ) : null}

      {c.scopes?.length ? (
        <div className="scopes-row">
          {c.scopes.map(s => <span key={s} className="scope-tag">{s}</span>)}
        </div>
      ) : null}

      {(c.last_seen || c.message_amount != null) && (
        <div className="card-dates">
          {c.last_seen && (
            <span className="cd-item" title={fmtDate(c.last_seen)}>
              <span className="cd-label">{t('card_last_seen')}</span>
              {relativeTime(c.last_seen)}
            </span>
          )}
          {c.message_amount != null && (
            <span className="cd-item">
              <span className="cd-label">{t('card_messages')}</span>
              {c.message_amount.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {c.last_message && (
        <div className="notes-text" title={c.last_sender ? `${t('card_last_sender')}: ${c.last_sender}` : undefined}>
          {c.last_sender ? <strong>{c.last_sender}: </strong> : null}{c.last_message}
        </div>
      )}

      <div className="card-actions">
        {!readOnlyActions && (
          <button
            className={`act${copiedName ? ' copied' : ''}`}
            onClick={handleCopyName}
          >
            {copiedName ? t('card_copied') : t('card_copy_name')}
          </button>
        )}
        {!readOnlyActions && (
          <button
            className={`act${copiedKey ? ' copied' : ''}`}
            onClick={handleCopyKey}
          >
            {copiedKey ? t('card_copied') : t('card_copy_key')}
          </button>
        )}
        <button className="act" onClick={() => onInfo(c)}>
          {t('card_details')}
        </button>
      </div>
    </div>
  )
}
