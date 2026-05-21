import type { FlasherDevice, DeviceFirmware, FlasherConfig } from '../../types'
import { getRoleFwValue } from '../../utils/flasherUtils'
import { useLang } from '../../hooks/useLang'

interface Props {
  device: FlasherDevice
  firmware: DeviceFirmware
  config: FlasherConfig
  percent: number
  log: string
  error: string
  onRetry: () => void
  onClose: () => void
  onConfigureUsb: () => void
}

export default function FlashProgress({
  device, firmware, config, percent, log, error, onRetry, onClose, onConfigureUsb,
}: Props) {
  const { t } = useLang()
  const title = getRoleFwValue(firmware, config.role, 'title')
  const isRepeaterRole = firmware.role === 'repeater' || firmware.role === 'roomServer'

  return (
    <div>
      <div className="device-page-header">
        <span>💾</span>
        <span>{device.name} → {title}</span>
      </div>

      {error ? (
        <div className="panel">
          <h3 style={{ color: 'var(--red)' }}>{t('flasher_error_title')}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>{error}</p>
          <div className="action-bar">
            <button className="btn btn-accent" onClick={onRetry}>{t('flasher_retry')}</button>
            <button className="btn" onClick={onClose}>{t('flasher_close')}</button>
          </div>
        </div>
      ) : (
        <div className="panel">
          {percent < 100 ? (
            <>
              <h3>⏳ {t('flasher_flashing')}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{t('flasher_dont_disconnect')}</p>
            </>
          ) : (
            <>
              <h3 style={{ color: 'var(--green)' }}>✓ {t('flasher_done')}</h3>
              <div className="action-bar" style={{ marginTop: '.75rem' }}>
                {isRepeaterRole && (
                  <button className="btn btn-accent" onClick={onConfigureUsb}>
                    🔧 {t('flasher_configure_usb')}
                  </button>
                )}
                <button className="btn" onClick={onClose}>{t('flasher_close')}</button>
                <button className="btn" onClick={onRetry}>{t('flasher_flash_again')}</button>
              </div>
            </>
          )}

          <div className="flash-progress-bar">
            <div className="flash-progress-bar-fill" style={{ width: `${percent}%` }} />
          </div>

          {log && <pre className="flash-log">{log}</pre>}
        </div>
      )}
    </div>
  )
}
