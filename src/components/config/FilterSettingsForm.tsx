import { useState } from 'react'
import { PAYLOAD_TYPES, cloneFilterSettings, type FilterSettings } from '../../lib/config/filterCommands'

interface Props {
  value: FilterSettings
  onChange: (next: FilterSettings) => void
}

function clampInt(v: string, min: number, max: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export default function FilterSettingsForm({ value, onChange }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [channelInput, setChannelInput] = useState('')

  function patch(mutate: (s: FilterSettings) => void) {
    const next = cloneFilterSettings(value)
    mutate(next)
    onChange(next)
  }

  function addChannel() {
    const name = channelInput.trim()
    if (!name || value.channels.length >= 16) return
    if (!value.channels.includes(name)) patch(s => { s.channels.push(name) })
    setChannelInput('')
  }

  return (
    <div className="filter-form">
      <label className="check-row">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={e => patch(s => { s.enabled = e.target.checked })}
        />
        Enable packet filter
      </label>

      <div className="field-row" style={{ marginTop: '.5rem' }}>
        <div className="field-group">
          <label>Min path-hash bytes (1–3)</label>
          <input
            type="number" min={1} max={3}
            value={value.minHashBytes}
            onChange={e => patch(s => { s.minHashBytes = clampInt(e.target.value, 1, 3) })}
          />
        </div>
        <div className="field-group">
          <label className="check-row" style={{ marginTop: '1.7rem' }}>
            <input
              type="checkbox"
              checked={value.malformed}
              onChange={e => patch(s => { s.malformed = e.target.checked })}
            />
            Scan public-channel text for malformed UTF-8
          </label>
        </div>
      </div>

      <div className="field-group" style={{ marginTop: '.5rem' }}>
        <label>Blocked channels ({value.channels.length}/16)</label>
        <div className="filter-channel-list">
          {value.channels.length === 0 && <span className="field-hint">None</span>}
          {value.channels.map(ch => (
            <span key={ch} className="filter-channel-chip">
              {ch}
              <button
                type="button" className="chip-remove" aria-label={`Remove ${ch}`}
                onClick={() => patch(s => { s.channels = s.channels.filter(c => c !== ch) })}
              >×</button>
            </span>
          ))}
        </div>
        <div className="filter-channel-add">
          <input
            value={channelInput}
            onChange={e => setChannelInput(e.target.value)}
            placeholder="#channel or Public"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChannel() } }}
          />
          <button type="button" className="btn" onClick={addChannel} disabled={value.channels.length >= 16}>
            Add
          </button>
        </div>
      </div>

      <button
        type="button" className="btn" style={{ marginTop: '.6rem' }}
        onClick={() => setAdvancedOpen(o => !o)}
      >
        {advancedOpen ? '▲' : '▼'} Advanced — per payload type
      </button>

      {advancedOpen && (
        <table className="filter-type-table">
          <thead>
            <tr><th>Type</th><th>Max hops (0–64)</th><th>Rate limit</th><th>Window (s)</th></tr>
          </thead>
          <tbody>
            {PAYLOAD_TYPES.map(pt => (
              <tr key={pt.index}>
                <td><code>{String(pt.index).padStart(2, '0')}</code> {pt.name}</td>
                <td>
                  <input
                    type="number" min={0} max={64}
                    value={value.perType[pt.index].hops}
                    onChange={e => patch(s => { s.perType[pt.index].hops = clampInt(e.target.value, 0, 64) })}
                  />
                </td>
                <td>
                  <input
                    type="number" min={0}
                    value={value.perType[pt.index].rateLimit}
                    onChange={e => patch(s => { s.perType[pt.index].rateLimit = clampInt(e.target.value, 0, 65535) })}
                  />
                </td>
                <td>
                  <input
                    type="number" min={0}
                    value={value.perType[pt.index].rateSecs}
                    onChange={e => patch(s => { s.perType[pt.index].rateSecs = clampInt(e.target.value, 0, 4294967295) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
