import { useEffect, useState } from 'react'
import { useLang } from '../../hooks/useLang'
import { PANEL_HELP, type PanelHelpId } from './panelHelpContent'

interface Props {
  id: PanelHelpId
}

export default function PanelHelp({ id }: Props) {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const content = PANEL_HELP[id]?.[lang]

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!content) return null

  return (
    <>
      <button
        type="button"
        className="icon-btn"
        aria-label={t('config_help_button')}
        title={t('config_help_button')}
        onClick={() => setOpen(true)}
      >
        ?
      </button>

      {open && (
        <div
          className="help-overlay open"
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="help-dialog">
            <div className="help-dialog-head">
              <h3>{content.title}</h3>
              <button className="help-close-btn" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="help-body">
              <p>{content.intro}</p>
              {content.fields.length > 0 && (
                <dl className="help-field-list">
                  {content.fields.map(f => (
                    <div key={f.label}>
                      <dt>{f.label}</dt>
                      <dd>{f.body}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
