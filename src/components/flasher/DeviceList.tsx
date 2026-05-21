import { useState } from 'react'
import type { FlasherDevice, DeviceGroups } from '../../types'
import { groupDevicesByClass, filterDevices } from '../../utils/flasherUtils'
import { useLang } from '../../hooks/useLang'

const GROUP_ORDER: Array<keyof DeviceGroups> = ['ripple', 'meshos', 'community']
const GROUP_LABEL_KEY: Record<string, string> = {
  ripple:    'flasher_group_ripple',
  meshos:    'flasher_group_meshos',
  community: 'flasher_group_community',
}

interface Props {
  devices: FlasherDevice[]
  onSelect: (device: FlasherDevice) => void
}

export default function DeviceList({ devices, onSelect }: Props) {
  const { t } = useLang()
  const [query, setQuery] = useState('')
  const filtered = filterDevices(devices, query)
  const groups = groupDevicesByClass(filtered)

  return (
    <div>
      <div className="device-search">
        <span className="device-search-icon">🔍</span>
        <input
          type="text"
          placeholder={t('flasher_filter')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {GROUP_ORDER.map(cls => {
        const group = groups[cls]
        if (!group?.length) return null
        return (
          <div className="device-group" key={cls}>
            <div className="device-group-header">{t(GROUP_LABEL_KEY[cls] as Parameters<typeof t>[0])}</div>
            <ul className="device-list">
              {group.map(device => (
                <li key={`${device.class}-${device.name}`}>
                  <button
                    className="device-list-btn"
                    onClick={() => onSelect(device)}
                  >
                    {device.type !== 'noflash' && (
                      <img
                        className="device-type-icon"
                        src={`/img/${device.type}.svg`}
                        alt={device.type}
                      />
                    )}
                    <span>{device.name}</span>
                    {device.icon && (
                      <img className="device-brand-icon" src={device.icon} alt="" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {/* Custom firmware entry */}
      <div className="device-group">
        <ul className="device-list">
          <li>
            <label className="device-list-btn" title={t('flasher_custom_tooltip')}>
              <span>📄</span>
              <span>{t('flasher_group_custom')}</span>
              <input
                type="file"
                accept=".zip,.bin"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  onSelect({
                    maker: 'custom',
                    class: 'community',
                    name: file.name,
                    type: file.name.endsWith('.zip') ? 'nrf52' : 'esp32',
                    firmware: [{
                      role: 'custom',
                      version: {
                        custom: {
                          files: [{ type: 'custom', name: '', title: file.name }],
                        },
                      },
                      customFile: true,
                    } as never],
                  })
                  e.target.value = ''
                }}
              />
            </label>
          </li>
        </ul>
      </div>
    </div>
  )
}
