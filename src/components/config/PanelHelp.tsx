import { useState } from 'react'
import { useLang } from '../../hooks/useLang'
import HelpDialog from '../ui/HelpDialog'
import { PANEL_HELP, type PanelHelpId } from './panelHelpContent'

interface Props {
  id: PanelHelpId
}

export default function PanelHelp({ id }: Props) {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const content = PANEL_HELP[id]?.[lang]

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

      {open && <HelpDialog content={content} onClose={() => setOpen(false)} />}
    </>
  )
}
