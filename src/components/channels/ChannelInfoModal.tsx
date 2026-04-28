import { useState } from 'react'
import type { Channel } from '../../types'
import Badge from '../ui/Badge'
import { copyText } from '../../utils/clipboard'
import { fmtDate, fmtDateOnly } from '../../utils/formatDate'

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

          {/* Flags */}
          {(c.verified || c.recommended || !c._hasMeta) && (
            <div className="info-row">
              <span className="info-label">Flags</span>
              <span className="info-value info-badges">
                {c.verified    && <Badge variant="verified" />}
                {c.recommended && <Badge variant="recommended" />}
                {!c._hasMeta   && <Badge variant="no-meta" />}
              </span>
            </div>
          )}

          {/* Status + Source */}
          {(c.status || c.source) && (
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-value">{[c.status, c.source].filter(Boolean).join(' · ')}</span>
            </div>
          )}

          {/* Category / Subcategory */}
          {(c.category || c.subcategory) && (
            <div className="info-row">
              <span className="info-label">Category</span>
              <span className="info-value">
                {c.category}{c.subcategory ? ` › ${c.subcategory}` : ''}
              </span>
            </div>
          )}

          {/* Country / Region */}
          {(c.country || c.region) && (
            <div className="info-row">
              <span className="info-label">Location</span>
              <span className="info-value">{[c.country, c.region].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {/* Language */}
          {c.language && c.language.length > 0 && (
            <div className="info-row">
              <span className="info-label">Language</span>
              <span className="info-value">{c.language.join(', ')}</span>
            </div>
          )}

          {/* Scopes */}
          {c.scopes && c.scopes.length > 0 && (
            <div className="info-row">
              <span className="info-label">Scopes</span>
              <span className="info-value">{c.scopes.join(', ')}</span>
            </div>
          )}

          {/* Tags */}
          {c.tags && c.tags.length > 0 && (
            <div className="info-row">
              <span className="info-label">Tags</span>
              <span className="info-value">{c.tags.join(', ')}</span>
            </div>
          )}

          {/* Alias of */}
          {c.alias_of && (
            <div className="info-row">
              <span className="info-label">Alias of</span>
              <span className="info-value">{c.alias_of}</span>
            </div>
          )}

          {/* Notes */}
          {c.notes && (
            <div className="info-row info-row--block">
              <span className="info-label">Notes</span>
              <span className="info-value" style={{ whiteSpace: 'pre-wrap' }}>{c.notes}</span>
            </div>
          )}

          {/* Messages */}
          {c.message_amount != null && (
            <div className="info-row">
              <span className="info-label">Messages</span>
              <span className="info-value">{c.message_amount.toLocaleString()}</span>
            </div>
          )}

          {/* First seen */}
          {c.first_seen && (
            <div className="info-row">
              <span className="info-label">First seen</span>
              <span className="info-value">{fmtDate(c.first_seen)}</span>
            </div>
          )}

          {/* Last seen */}
          {c.last_seen && (
            <div className="info-row">
              <span className="info-label">Last seen</span>
              <span className="info-value">{fmtDate(c.last_seen)}</span>
            </div>
          )}

          {/* Added */}
          {c.added && (
            <div className="info-row">
              <span className="info-label">Added</span>
              <span className="info-value">{fmtDateOnly(c.added)}</span>
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
