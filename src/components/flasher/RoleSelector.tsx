import type { FlasherDevice, FlasherConfig, DeviceFirmware } from '../../types'
import { firmwareHasData, getRoleFwValue } from '../../utils/flasherUtils'

interface Props {
  device: FlasherDevice
  config: FlasherConfig
  onSelect: (firmware: DeviceFirmware) => void
  onBack: () => void
}

export default function RoleSelector({ device, config, onSelect, onBack }: Props) {
  const available = device.firmware.filter(fw => firmwareHasData(fw))

  return (
    <div>
      <div className="device-page-header">
        <button className="btn" onClick={onBack} aria-label="Back">← {device.name}</button>
      </div>
      <ul className="role-list">
        {available.map((fw, i) => {
          const icon     = getRoleFwValue(fw, config.role, 'icon')
          const title    = getRoleFwValue(fw, config.role, 'title')
          const subTitle = getRoleFwValue(fw, config.role, 'subTitle')
          const tooltip  = getRoleFwValue(fw, config.role, 'tooltip')
          return (
            <li key={i}>
              <button className="role-btn" onClick={() => onSelect(fw)} title={tooltip}>
                <span className="role-icon">{icon}</span>
                <span>
                  {title}{subTitle ? ` — ${subTitle}` : ''}
                  {tooltip && <span className="role-desc">{tooltip}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
