import { useState, useEffect } from 'react'
import type { Channel } from '../../types'
import { copyText } from '../../utils/clipboard'
import { fmtDate, relativeTime } from '../../utils/formatDate'
import { computeChannelHash } from '../../utils/channelHash'

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

export default function ChannelRow({ channel: c, selected, onToggleSelect, onCopy, onEdit: _onEdit, onInfo, readOnlyActions = false }: Props) {
  const [copiedName, setCopiedName] = useState(false)
  const [copiedKey,  setCopiedKey]  = useState(false)
  const [channelHash, setChannelHash] = useState<string>('…')

  useEffect(() => {
    if (!c._key) return
    computeChannelHash(c._key).then(setChannelHash).catch(() => setChannelHash('??'))
  }, [c._key])

  async function handleCopyName() {
    const name = c.channel.replace(/^#/, '')
    const ok = await copyText(name)
    if (ok) { onCopy(`Copied ${name}`); setCopiedName(true); setTimeout(() => setCopiedName(false), 1500) }
  }

  async function handleCopyKey() {
    const ok = await copyText(c._key)
    if (ok) { onCopy('Copied key'); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 1500) }
  }

  const rowClass = [
    !c._hasMeta ? 'bare-row' : '',
    c._localEdit ? 'local-row' : '',
  ].filter(Boolean).join(' ')

  return (
    <tr className={rowClass}>
      <td>
        <input
          type="checkbox"
          className="card-cb"
          checked={selected}
          onChange={() => onToggleSelect(c.channel)}
        />
      </td>
      <td>
        <span
          className="lt-name"
          title="Click to copy channel name"
          onClick={handleCopyName}
          style={selected ? { color: 'var(--accent)' } : undefined}
        >
          {c.channel}
        </span>
      </td>
      <td>
        <span
          className="lt-key"
          title="Click to copy hex key"
          onClick={handleCopyKey}
        >
          {copiedKey ? '✓' : c._key.slice(0, 8) + '…'}
        </span>
      </td>
      <td><span className="lt-hash">{channelHash}</span></td>
      <td><span className="lt-cat">{c.category || ''}</span></td>
      <td><span className="lt-country">{c.country || ''}</span></td>
      <td><span className="lt-region">{c.region || ''}</span></td>
		<td>
		  <span className="lt-scope">
			{c.scopes?.join(', ') || ''}
		  </span>
		</td>
      <td><span className="lt-date" title={fmtDate(c.first_seen)}>{relativeTime(c.first_seen)}</span></td>
      <td><span className="lt-date" title={fmtDate(c.last_seen)}>{relativeTime(c.last_seen)}</span></td>
      <td><span className="lt-count">{c.message_amount != null ? c.message_amount.toLocaleString() : '—'}</span></td>
      <td><span className="lt-source">{c.source || ''}</span></td>
      <td>
        <div className="lt-acts">
          {!readOnlyActions && (
            <button
              className={`act${copiedName ? ' copied' : ''}`}
              onClick={handleCopyName}
              title="Copy name"
            >
              {copiedName ? '✓' : '⎘'}
            </button>
          )}
          {!readOnlyActions && (
            <button
              className={`act${copiedKey ? ' copied' : ''}`}
              onClick={handleCopyKey}
              title="Copy key"
            >
              {copiedKey ? '✓' : '🔑'}
            </button>
          )}
          <button className="act" onClick={() => onInfo(c)} title="View details">ℹ</button>
        </div>
      </td>
    </tr>
  )
}
