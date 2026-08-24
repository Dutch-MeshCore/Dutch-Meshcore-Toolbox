import { useState } from 'react'
import { useLang } from '../../hooks/useLang'
import {
  type RegionSettings,
  cloneRegionSettings, parseDcGateStatus,
} from '../../lib/config/regionCommands'

interface Props {
  value: RegionSettings
  onChange: (next: RegionSettings) => void
  onSendCommand: (cmd: string) => Promise<string>
}

// Duty-cycle region gating only. DMC MQTT observer firmware feature, gated on
// device.dcGateSupported by the parent. The region tree and neighbour discovery
// are base repeater features and live in RegionSettingsForm.
export default function RegionGatingForm({ value, onChange, onSendCommand }: Props) {
  const { t } = useLang()
  const [gateStatus, setGateStatus] = useState<string>('')

  const patch = (p: Partial<RegionSettings>) => onChange({ ...cloneRegionSettings(value), ...p })

  return (
    <div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={value.dcGate.enabled}
          onChange={e => patch({ dcGate: { ...value.dcGate, enabled: e.target.checked } })}
        />
        {t('region_dcgate_enable')}
      </label>
      <div className="field-row">
        <div className="field-group">
          <label>{t('region_dcgate_thresh')}</label>
          <input
            type="number" min={1} max={100}
            value={value.dcGate.thresh}
            onChange={e => patch({ dcGate: { ...value.dcGate, thresh: Number(e.target.value) } })}
          />
        </div>
        <div className="field-group">
          <label>{t('region_dcgate_hyst')}</label>
          <input
            type="number" min={0} max={50}
            value={value.dcGate.hyst}
            onChange={e => patch({ dcGate: { ...value.dcGate, hyst: Number(e.target.value) } })}
          />
        </div>
      </div>
      <button
        className="btn" type="button"
        onClick={async () => {
          const s = parseDcGateStatus(await onSendCommand('get dc.gate.status'))
          setGateStatus(s ? `duty ${s.dutyPct}% / level ${s.level}/${s.maxLevel}` : '-')
        }}
      >
        {t('region_dcgate_status')}
      </button>
      {gateStatus && <span style={{ marginLeft: '.5rem' }}>{gateStatus}</span>}
    </div>
  )
}
