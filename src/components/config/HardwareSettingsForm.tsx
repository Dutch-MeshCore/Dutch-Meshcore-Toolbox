import { BRIDGE_MAX_BAUD, cloneHardwareSettings, type HardwareSettings } from '../../lib/config/hardwareCommands'

interface Props {
  value: HardwareSettings
  onChange: (next: HardwareSettings) => void
}

function clampInt(v: string, min: number, max: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/** Advanced base-firmware settings that are capability-gated on the device: the
 *  packet bridge (RS232 / ESP-NOW / MQTT), external-FEM gain toggles, and LR2021
 *  side-detector SFs. Only the groups the connected firmware reported are rendered. */
export default function HardwareSettingsForm({ value, onChange }: Props) {
  function patch(mutate: (s: HardwareSettings) => void) {
    const next = cloneHardwareSettings(value)
    mutate(next)
    onChange(next)
  }

  return (
    <div className="hardware-form">
      {value.bridgeSupported && (
        <div className="panel-inner">
          <div className="panel-legend-sub">Packet bridge{value.bridgeType !== 'none' ? ` (${value.bridgeType})` : ''}</div>
          <label className="check-row">
            <input type="checkbox" checked={value.bridgeEnabled} onChange={e => patch(s => { s.bridgeEnabled = e.target.checked })} />
            Enable bridge
          </label>
          <div className="field-row">
            <div className="field-group">
              <label>Bridge delay (0-10000 ms)</label>
              <input type="number" min={0} max={10000} value={value.bridgeDelay}
                onChange={e => patch(s => { s.bridgeDelay = clampInt(e.target.value, 0, 10000) })} />
            </div>
            <div className="field-group">
              <label>Bridge source</label>
              <select value={value.bridgeSource} onChange={e => patch(s => { s.bridgeSource = e.target.value as HardwareSettings['bridgeSource'] })}>
                <option value="tx">Log TX (transmitted)</option>
                <option value="rx">Log RX (received)</option>
              </select>
            </div>
          </div>

          {value.rs232Supported && (
            <div className="field-group">
              <label>RS232 baud (9600-{BRIDGE_MAX_BAUD})</label>
              <input type="number" min={9600} max={BRIDGE_MAX_BAUD} value={value.bridgeBaud}
                onChange={e => patch(s => { s.bridgeBaud = clampInt(e.target.value, 9600, BRIDGE_MAX_BAUD) })} />
            </div>
          )}

          {value.espnowSupported && (
            <div className="field-row">
              <div className="field-group">
                <label>ESP-NOW channel (1-14)</label>
                <input type="number" min={1} max={14} value={value.bridgeChannel}
                  onChange={e => patch(s => { s.bridgeChannel = clampInt(e.target.value, 1, 14) })} />
              </div>
              <div className="field-group">
                <label>ESP-NOW secret</label>
                <input type="password" value={value.bridgeSecret} maxLength={16}
                  onChange={e => patch(s => { s.bridgeSecret = e.target.value })} />
              </div>
            </div>
          )}
        </div>
      )}

      {(value.femRxSupported || value.femTxSupported) && (
        <div className="panel-inner">
          <div className="panel-legend-sub">External FEM gain</div>
          {value.femRxSupported && (
            <label className="check-row">
              <input type="checkbox" checked={value.femRxgain} onChange={e => patch(s => { s.femRxgain = e.target.checked })} />
              RX LNA gain
            </label>
          )}
          {value.femTxSupported && (
            <label className="check-row">
              <input type="checkbox" checked={value.femTxgain} onChange={e => patch(s => { s.femTxgain = e.target.checked })} />
              TX PA gain
            </label>
          )}
        </div>
      )}

      {value.extraSfSupported && (
        <div className="panel-inner">
          <div className="panel-legend-sub">LR2021 side detectors</div>
          <div className="field-group">
            <label>Extra spreading factors <span className="field-hint">(comma-separated, e.g. 9,11)</span></label>
            <input value={value.extraSf} placeholder="9,11"
              onChange={e => patch(s => { s.extraSf = e.target.value })} />
          </div>
        </div>
      )}
    </div>
  )
}
