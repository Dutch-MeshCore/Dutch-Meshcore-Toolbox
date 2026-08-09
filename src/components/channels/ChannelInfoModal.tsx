import { useState } from 'react'
import type { Channel } from '../../types'
import { copyText } from '../../utils/clipboard'
import { fmtDate } from '../../utils/formatDate'

interface Props {
  channel: Channel
  onClose: () => void
}

export default function ChannelInfoModal({ channel: c, onClose }: Props) {
  const [copiedKey, setCopiedKey] = useState(false)

  async function handleCopyKey() {
    const ok = await copyText(c._key)
    if (ok) { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 1500) }
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Details for ${c.channel}`}>

        <div className="modal-head">
          <div>
            <h2>{c.channel}</h2>
            {c._key && (
              <div
                className="channel-sub"
                title="Click to copy hex key"
                onClick={handleCopyKey}
                style={{ cursor: 'pointer' }}
              >
                {copiedKey ? '✓ Copied' : c._key}
              </div>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">

          {/* Location */}
          {(c.countries?.length || c.regions?.length) ? (
            <div className="info-row">
              <span className="info-label">Location</span>
              <span className="info-value">
                {[(c.countries || []).join(', '), (c.regions || []).join(', ')].filter(Boolean).join(' — ')}
              </span>
            </div>
          ) : null}

          {/* Scopes */}
          {c.scopes && c.scopes.length > 0 && (
            <div className="info-row">
              <span className="info-label">Scopes</span>
              <span className="info-value">{c.scopes.join(', ')}</span>
            </div>
          )}

          {/* Encrypted */}
          <div className="info-row">
            <span className="info-label">Encrypted</span>
            <span className="info-value">{c.encrypted ? 'Yes' : 'No'}</span>
          </div>

          {/* Messages */}
          {c.message_amount != null && (
            <div className="info-row">
              <span className="info-label">Messages</span>
              <span className="info-value">{c.message_amount.toLocaleString()}</span>
            </div>
          )}

          {/* Last seen */}
          {c.last_seen && (
            <div className="info-row">
              <span className="info-label">Last activity</span>
              <span className="info-value">{fmtDate(c.last_seen)}</span>
            </div>
          )}

          {/* Last sender */}
          {c.last_sender && (
            <div className="info-row">
              <span className="info-label">Last sender</span>
              <span className="info-value">{c.last_sender}</span>
            </div>
          )}

          {/* Last message */}
          {c.last_message && (
            <div className="info-row info-row--block">
              <span className="info-label">Last message</span>
              <span className="info-value" style={{ whiteSpace: 'pre-wrap' }}>{c.last_message}</span>
            </div>
          )}

        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  )
}
