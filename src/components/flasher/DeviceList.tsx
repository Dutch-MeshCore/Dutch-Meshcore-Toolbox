import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { FlasherDevice, FlasherMakerDef } from '../../types'
import { groupDevicesByMaker, filterDevices } from '../../utils/flasherUtils'
import { deviceImageSrc } from '../../utils/deviceImage'
import { useLang } from '../../hooks/useLang'

interface Preview {
  src: string
  name: string
  x: number
  y: number
}

// Position the board preview next to the cursor: to its right when it fits,
// otherwise to its left — always clamped so it stays within the viewport.
function previewStyle(x: number, y: number): React.CSSProperties {
  const gap = 16
  const width = 320 // keep in sync with .device-preview max-width
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = x + gap
  if (left + width > vw - 8) left = x - gap - width
  left = Math.max(8, Math.min(left, vw - width - 8))

  const top = Math.max(8, Math.min(y, vh - 8))
  return { left, top }
}

function getGroupVersions(devices: FlasherDevice[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const device of devices) {
    for (const fw of device.firmware) {
      for (const key of Object.keys(fw.version ?? {})) {
        const v = key.split(' — ')[0]
        if (!seen.has(v)) { seen.add(v); result.push(v) }
      }
    }
  }
  return result.sort((a, b) => b.localeCompare(a))
}

function deviceHasVersion(device: FlasherDevice, version: string): boolean {
  return device.firmware.some(fw =>
    Object.keys(fw.version ?? {}).some(k => k.startsWith(version))
  )
}

const MAKER_ORDER_FIRST = ['dutchmeshcore_repeater', 'dutchmeshcore']

interface Props {
  devices: FlasherDevice[]
  makerNames: Record<string, FlasherMakerDef>
  onSelect: (device: FlasherDevice) => void
}

export default function DeviceList({ devices, makerNames, onSelect }: Props) {
  const { t } = useLang()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(MAKER_ORDER_FIRST))
  const [versionFilter, setVersionFilter] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<Preview | null>(null)

  function showPreview(device: FlasherDevice, x: number, y: number) {
    const src = deviceImageSrc(device)
    if (!src) { setPreview(null); return }
    setPreview({ src, name: device.name, x, y })
  }
  function hidePreview() { setPreview(null) }
  const filtered = filterDevices(devices, query)
  const groups = groupDevicesByMaker(filtered)
  const isSearching = query.trim().length > 0

  // Pin known makers first, then the rest sorted alphabetically by display name
  const makerKeys = Object.keys(groups).sort((a, b) => {
    const aFirst = MAKER_ORDER_FIRST.indexOf(a)
    const bFirst = MAKER_ORDER_FIRST.indexOf(b)
    if (aFirst !== -1 || bFirst !== -1) {
      if (aFirst === -1) return 1
      if (bFirst === -1) return -1
      return aFirst - bFirst
    }
    const aName = makerNames[a]?.name ?? a
    const bName = makerNames[b]?.name ?? b
    return aName.localeCompare(bName)
  })

  function toggleMaker(key: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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

      {makerKeys.map(makerKey => {
        const group = groups[makerKey]
        if (!group?.length) return null
        const maker = makerNames[makerKey]
        const makerName = maker?.name ?? makerKey
        const open = isSearching || expanded.has(makerKey)
        const versions = getGroupVersions(group)
        const selectedVersion = versionFilter[makerKey] ?? versions[0] ?? ''
        const visibleDevices = selectedVersion
          ? group.filter(d => deviceHasVersion(d, selectedVersion))
          : group
        return (
          <div className="device-group" key={makerKey}>
            <button
              className="device-group-header device-group-toggle"
              onClick={() => toggleMaker(makerKey)}
              aria-expanded={open}
            >
              <span className="device-group-title">{makerName}</span>
              {versions.length > 0 && (
                <select
                  value={selectedVersion}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    e.stopPropagation()
                    setVersionFilter(prev => ({ ...prev, [makerKey]: e.target.value }))
                  }}
                  className="device-group-version"
                >
                  {versions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              )}
              <span className="device-group-links">
                {maker?.website && (
                  <a
                    className="device-group-link"
                    href={maker.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}
                {maker?.repo && (
                  <a
                    className="device-group-link"
                    href={maker.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                  >
                    GitHub
                  </a>
                )}
                <span className="device-group-chevron">{open ? '▾' : '▸'}</span>
              </span>
            </button>
            {open && (
              <ul className="device-list">
                {visibleDevices.map(device => (
                  <li key={`${device.maker}-${device.name}`}>
                    <button
                      className="device-list-btn"
                      onClick={() => onSelect(device)}
                      onMouseEnter={e => showPreview(device, e.clientX, e.clientY)}
                      onMouseMove={e => showPreview(device, e.clientX, e.clientY)}
                      onMouseLeave={hidePreview}
                      onFocus={e => {
                        const r = e.currentTarget.getBoundingClientRect()
                        showPreview(device, r.right, r.top + r.height / 2)
                      }}
                      onBlur={hidePreview}
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
            )}
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
                  const isMergedBin = file.name.toLowerCase().endsWith('-merged.bin')
                  onSelect({
                    maker: 'custom',
                    class: 'community',
                    name: file.name,
                    type: file.name.endsWith('.zip') ? 'nrf52' : 'esp32',
                    firmware: [{
                      role: 'custom',
                      icon: '📄',
                      title: t('flasher_group_custom'),
                      subTitle: file.name,
                      tooltip: t('flasher_custom_tooltip'),
                      version: {
                        custom: {
                          files: [{
                            type: isMergedBin ? 'flash-wipe' : 'flash-update',
                            name: file.name,
                            title: file.name,
                            file,
                          }],
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

      {preview && createPortal(
        <div
          className="device-preview"
          data-testid="device-preview"
          style={previewStyle(preview.x, preview.y)}
        >
          <img src={preview.src} alt={preview.name} />
        </div>,
        document.body,
      )}
    </div>
  )
}
