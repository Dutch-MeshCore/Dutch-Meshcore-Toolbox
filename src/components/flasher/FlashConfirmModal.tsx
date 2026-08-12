import { useNavigate } from 'react-router-dom'
import { useLang } from '../../hooks/useLang'

interface Props {
  /** True when an observer firmware is being flashed as an App update (app-only) —
   *  a first-time observer install needs the merged "Full flash" for the partitions. */
  observerAppUpdate: boolean
  onCancel: () => void
  onProceed: () => void
}

/** Pre-flash reminder: back up the device config (the DMC tools store extra MQTT /
 *  filter settings a flash can wipe), and — for a first-time observer install —
 *  steer the user to the merged "Full flash" image. */
export default function FlashConfirmModal({ observerAppUpdate, onCancel, onProceed }: Props) {
  const { t } = useLang()
  const navigate = useNavigate()

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={t('flash_confirm_title')} style={{ maxWidth: 560 }}>
        <div className="modal-head">
          <strong>💾 {t('flash_confirm_title')}</strong>
          <button className="modal-close" onClick={onCancel} aria-label={t('flash_confirm_cancel')}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ margin: '0 0 .75rem' }}>{t('flash_confirm_backup')}</p>
          {observerAppUpdate && (
            <div className="info-banner warn" style={{ margin: '0 0 .75rem' }}>
              {t('flash_confirm_observer_merged')}
            </div>
          )}
          <button className="btn" onClick={() => navigate('/usb-config')}>
            {t('flash_confirm_backup_btn')}
          </button>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onCancel}>{t('flash_confirm_cancel')}</button>
          <button className="btn btn-accent" onClick={onProceed}>⚡ {t('flash_confirm_proceed')}</button>
        </div>
      </div>
    </div>
  )
}
