import { useState } from 'react'
import type { FlasherDevice, DeviceFirmware, FlasherConfig } from '../../types'
import { getFirmwarePath, getRoleFwValue, sortVersionsDesc, FLASHER_BASE_URL } from '../../utils/flasherUtils'
import { useLang } from '../../hooks/useLang'

interface Props {
  device: FlasherDevice
  firmware: DeviceFirmware
  config: FlasherConfig
  supported: boolean
  onFlash: (opts: { version: string; wipe: boolean }) => void
  onBack: () => void
  dfuComplete?: boolean
  nrfEraserPercent?: number
  nrfEraserFlashing?: boolean
  onDfuMode?: () => void
  onNrfErase?: () => void
}

export default function FlashOptions({
  device, firmware, config, supported,
  onFlash, onBack,
  dfuComplete = false, nrfEraserPercent = 0, nrfEraserFlashing = false,
  onDfuMode, onNrfErase,
}: Props) {
  const { t } = useLang()
  const versions = sortVersionsDesc(Object.keys(firmware.version ?? {}))
  const [version, setVersion] = useState(versions[0] ?? '')
  const [wipe, setWipe] = useState(false)

  const versionData = firmware.version?.[version]
  const notes = versionData?.notes ?? ''
  const files = versionData?.files ?? []
  const title    = getRoleFwValue(firmware, config.role, 'title')
  const subTitle = getRoleFwValue(firmware, config.role, 'subTitle')
  const tooltip  = getRoleFwValue(firmware, config.role, 'tooltip')
  const notice   = firmware.notice ? config.notice[firmware.notice] ?? '' : ''

  return (
    <div>
      <div className="device-page-header">
        <button className="btn" onClick={onBack}>← {device.name}</button>
      </div>

      <div className="panel">
        <div className="panel-legend">{title}{subTitle ? ` — ${subTitle}` : ''}</div>
        {tooltip && <p style={{ fontSize: '.85rem', color: 'var(--muted)', margin: '0 0 .75rem' }}>{tooltip}</p>}
        {notice && <div className="info-banner warn" dangerouslySetInnerHTML={{ __html: notice }} />}

        <div className="field-group">
          <label>{t('flasher_version')}</label>
          <select value={version} onChange={e => setVersion(e.target.value)}>
            {versions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {notes && (
          <div style={{ fontSize: '.8rem', color: 'var(--muted)', whiteSpace: 'pre-wrap', margin: '.5rem 0' }}>
            <strong>{t('flasher_changelog')}</strong><br />
            <span dangerouslySetInnerHTML={{ __html: notes }} />
          </div>
        )}
      </div>

      {device.type === 'esp32' && (
        <div className="panel">
          <label className="check-row">
            <input type="checkbox" checked={wipe} onChange={e => setWipe(e.target.checked)} />
            {t('flasher_erase')}
          </label>
          {wipe && <div className="info-banner warn">{t('flasher_erase_warn')}</div>}
        </div>
      )}

      {device.type === 'nrf52' && (
        <div className="panel">
          <div className="action-bar">
            <button className="btn" onClick={onDfuMode} disabled={!supported}>
              {dfuComplete ? `✓ ${t('flasher_dfu_active')}` : t('flasher_dfu_enter')}
            </button>
            <button className="btn" onClick={onNrfErase} disabled={!supported || nrfEraserFlashing || nrfEraserPercent > 0}>
              {nrfEraserPercent === 100 ? `✓ ${t('flasher_nrf_erased')}`
                : nrfEraserFlashing ? `${t('flasher_nrf_erasing')} ${nrfEraserPercent}%`
                : t('flasher_nrf_erase')}
            </button>
          </div>
        </div>
      )}

      <div className="action-bar">
        <button
          className="btn btn-accent"
          onClick={() => onFlash({ version, wipe })}
          disabled={!supported || nrfEraserFlashing}
          title={supported ? t('flasher_flash_tooltip') : t('flasher_unsupported')}
        >
          ⚡ {t('flasher_flash_btn')}
        </button>
        {!firmware.customFile && files.map((f, i) => (
          <a
            key={i}
            className="btn"
            href={getFirmwarePath(f, config.staticPath, FLASHER_BASE_URL)}
            download
          >
            ⬇ {files.length > 1 ? f.title : t('flasher_download')}
          </a>
        ))}
      </div>
    </div>
  )
}
