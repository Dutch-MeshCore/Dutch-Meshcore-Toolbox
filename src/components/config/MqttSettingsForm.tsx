import { useState } from 'react'
import {
  MQTT_PRESETS, MQTT_SLOT_COUNT, cloneMqttSettings, type MqttSettings, type MqttSlot,
} from '../../lib/config/mqttCommands'

interface Props {
  value: MqttSettings
  onChange: (next: MqttSettings) => void
  onSendCommand: (cmd: string) => Promise<string>
}

function clampInt(v: string, min: number, max: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export default function MqttSettingsForm({ value, onChange, onSendCommand }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ bridge: true })
  const [alertResult, setAlertResult] = useState('')
  const [diag, setDiag] = useState('')
  const [diagBusy, setDiagBusy] = useState(false)

  function patch(mutate: (s: MqttSettings) => void) {
    const next = cloneMqttSettings(value)
    mutate(next)
    onChange(next)
  }
  function patchSlot(i: number, mutate: (sl: MqttSlot) => void) {
    patch(s => mutate(s.slots[i]))
  }
  const toggle = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }))

  async function runDiagnostics() {
    setDiagBusy(true)
    try {
      const cmds = ['mqtt.config.valid', 'mqtt.status', 'mqtt.ntp.diag',
        ...Array.from({ length: MQTT_SLOT_COUNT }, (_, i) => `mqtt${i + 1}.diag`)]
      const out: string[] = []
      for (const c of cmds) out.push(`$ get ${c}\n${await onSendCommand(`get ${c}`)}`)
      setDiag(out.join('\n\n'))
    } finally {
      setDiagBusy(false)
    }
  }

  return (
    <div className="mqtt-form">
      {/* ── Bridge ─────────────────────────────────────────── */}
      <button type="button" className="btn" aria-expanded={!!open.bridge} onClick={() => toggle('bridge')}>
        {open.bridge ? '▲' : '▼'} MQTT bridge
      </button>
      {open.bridge && (
        <div className="panel-inner">
          <div className="field-row">
            <div className="field-group">
              <label>Origin (device name in topic)</label>
              <input value={value.origin} maxLength={32} onChange={e => patch(s => { s.origin = e.target.value })} />
            </div>
            <div className="field-group">
              <label>IATA code</label>
              <input value={value.iata} maxLength={8} onChange={e => patch(s => { s.iata = e.target.value.toUpperCase() })} />
            </div>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={value.status} onChange={e => patch(s => { s.status = e.target.checked })} />
            Publish periodic status messages <span className="field-hint">(write-only — firmware does not report current state)</span>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={value.packets} onChange={e => patch(s => { s.packets = e.target.checked })} />
            Publish per-packet messages
          </label>
          <label className="check-row">
            <input type="checkbox" checked={value.raw} onChange={e => patch(s => { s.raw = e.target.checked })} />
            Publish raw packet payloads
          </label>
          <label className="check-row">
            <input type="checkbox" checked={value.rx} onChange={e => patch(s => { s.rx = e.target.checked })} />
            Publish received (RX) packets
          </label>
          <div className="field-row">
            <div className="field-group">
              <label>TX publishing</label>
              <select value={value.tx} onChange={e => patch(s => { s.tx = e.target.value as MqttSettings['tx'] })}>
                <option value="off">Off</option>
                <option value="on">On (all TX)</option>
                <option value="advert">Advert only</option>
              </select>
            </div>
            <div className="field-group">
              <label>Status interval (1–60 min)</label>
              <input type="number" min={1} max={60} value={value.interval}
                onChange={e => patch(s => { s.interval = clampInt(e.target.value, 1, 60) })} />
            </div>
          </div>
          <div className="field-group">
            <label>NTP server (blank = pool.ntp.org)</label>
            <input value={value.ntp} maxLength={64} onChange={e => patch(s => { s.ntp = e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>Owner public key (64 hex)</label>
              <input type="password" value={value.owner} maxLength={64} onChange={e => patch(s => { s.owner = e.target.value })} />
            </div>
            <div className="field-group">
              <label>Owner email</label>
              <input value={value.email} maxLength={64} onChange={e => patch(s => { s.email = e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* ── Slots ─────────────────────────────────────────── */}
      <button type="button" className="btn" aria-expanded={!!open.slots} onClick={() => toggle('slots')}>
        {open.slots ? '▲' : '▼'} Broker slots
      </button>
      {open.slots && (
        <div className="panel-inner">
          {Array.from({ length: MQTT_SLOT_COUNT }, (_, i) => {
            const sl = value.slots[i]
            return (
              <div key={i} className="mqtt-slot">
                <div className="field-group">
                  <label>Slot {i + 1} preset</label>
                  <select value={sl.preset} onChange={e => patchSlot(i, s => { s.preset = e.target.value })}>
                    <option value="none">none (disabled)</option>
                    <option value="custom">custom</option>
                    {MQTT_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                    {sl.preset !== 'none' && sl.preset !== 'custom' && !MQTT_PRESETS.includes(sl.preset) && (
                      <option value={sl.preset}>{sl.preset}</option>
                    )}
                  </select>
                </div>
                {sl.preset === 'custom' && (
                  <div className="mqtt-slot-custom">
                    <div className="field-row">
                      <div className="field-group">
                        <label>Server</label>
                        <input value={sl.server} maxLength={64} onChange={e => patchSlot(i, s => { s.server = e.target.value })} />
                      </div>
                      <div className="field-group">
                        <label>Port</label>
                        <input type="number" min={1} max={65535} value={sl.port || ''}
                          onChange={e => patchSlot(i, s => { s.port = clampInt(e.target.value, 0, 65535) })} />
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label>Username</label>
                        <input value={sl.username} maxLength={32} onChange={e => patchSlot(i, s => { s.username = e.target.value })} />
                      </div>
                      <div className="field-group">
                        <label>Password</label>
                        <input type="password" value={sl.password} maxLength={64} onChange={e => patchSlot(i, s => { s.password = e.target.value })} />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Topic template</label>
                      <input value={sl.topic} maxLength={96} placeholder="meshcore/{iata}/{device}/{type}"
                        onChange={e => patchSlot(i, s => { s.topic = e.target.value })} />
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label>Token</label>
                        <input type="password" value={sl.token} maxLength={48} onChange={e => patchSlot(i, s => { s.token = e.target.value })} />
                      </div>
                      <div className="field-group">
                        <label>JWT audience</label>
                        <input value={sl.audience} maxLength={64} onChange={e => patchSlot(i, s => { s.audience = e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Alerts ─────────────────────────────────────────── */}
      <button type="button" className="btn" aria-expanded={!!open.alerts} onClick={() => toggle('alerts')}>
        {open.alerts ? '▲' : '▼'} Fault alerts
      </button>
      {open.alerts && (
        <div className="panel-inner">
          <label className="check-row">
            <input type="checkbox" checked={value.alert} onChange={e => patch(s => { s.alert = e.target.checked })} />
            Enable automatic fault alerts
          </label>
          <div className="field-row">
            <div className="field-group">
              <label>Channel PSK (32 hex)</label>
              <input type="password" value={value.alertPsk} maxLength={32} onChange={e => patch(s => { s.alertPsk = e.target.value })} />
            </div>
            <div className="field-group">
              <label>Hashtag (derives PSK)</label>
              <input value={value.alertHashtag} maxLength={24} onChange={e => patch(s => { s.alertHashtag = e.target.value })} />
            </div>
          </div>
          <div className="field-group">
            <label>Region override (blank = default scope)</label>
            <input value={value.alertRegion} maxLength={31} onChange={e => patch(s => { s.alertRegion = e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>WiFi threshold (0–1440 min)</label>
              <input type="number" min={0} max={1440} value={value.alertWifi}
                onChange={e => patch(s => { s.alertWifi = clampInt(e.target.value, 0, 1440) })} />
            </div>
            <div className="field-group">
              <label>MQTT threshold (0–10080 min)</label>
              <input type="number" min={0} max={10080} value={value.alertMqtt}
                onChange={e => patch(s => { s.alertMqtt = clampInt(e.target.value, 0, 10080) })} />
            </div>
          </div>
          <div className="field-group">
            <label>Repeat interval (60–10080 min)</label>
            <input type="number" min={60} max={10080} value={value.alertInterval}
              onChange={e => patch(s => { s.alertInterval = clampInt(e.target.value, 60, 10080) })} />
          </div>
          <button type="button" className="btn" style={{ marginTop: '.5rem' }}
            onClick={async () => setAlertResult(await onSendCommand('alert test'))}>
            Send test alert
          </button>
          {alertResult && <div className="field-hint" style={{ marginTop: '.4rem' }}>{alertResult}</div>}
        </div>
      )}

      {/* ── SNMP ───────────────────────────────────────────── */}
      <button type="button" className="btn" aria-expanded={!!open.snmp} onClick={() => toggle('snmp')}>
        {open.snmp ? '▲' : '▼'} SNMP agent
      </button>
      {open.snmp && (
        <div className="panel-inner">
          <label className="check-row">
            <input type="checkbox" checked={value.snmp} onChange={e => patch(s => { s.snmp = e.target.checked })} />
            Enable SNMP agent <span className="field-hint">(reboot required to apply)</span>
          </label>
          <div className="field-group" style={{ marginTop: '.5rem' }}>
            <label>Community string</label>
            <input value={value.snmpCommunity} maxLength={24} onChange={e => patch(s => { s.snmpCommunity = e.target.value })} />
          </div>
        </div>
      )}

      {/* ── Diagnostics ────────────────────────────────────── */}
      <button type="button" className="btn" aria-expanded={!!open.diag} onClick={() => toggle('diag')}>
        {open.diag ? '▲' : '▼'} Diagnostics
      </button>
      {open.diag && (
        <div className="panel-inner">
          <button type="button" className="btn" onClick={runDiagnostics} disabled={diagBusy}>
            {diagBusy ? 'Reading…' : '↻ Refresh diagnostics'}
          </button>
          {diag && <pre className="mqtt-diag" style={{ whiteSpace: 'pre-wrap', marginTop: '.5rem' }}>{diag}</pre>}
        </div>
      )}
    </div>
  )
}
