import { useState } from 'react'
import { useLang } from '../../hooks/useLang'
import HelpDialog from '../ui/HelpDialog'
import { firmwareHelpFor } from './firmwareHelpContent'

interface Props {
  makerKey: string
}

// The "?" behind a firmware group name in the Flasher. The group header is itself a
// <button>, so this is a focusable span with button semantics (a nested <button> is
// invalid HTML) and every activation stops propagation so it never toggles the group.
export default function FirmwareHelp({ makerKey }: Props) {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const content = firmwareHelpFor(makerKey, lang)

  if (!content) return null

  const label = `${t('flasher_fw_help')}: ${content.title}`

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        className="device-group-help"
        aria-label={label}
        title={label}
        onClick={e => { e.stopPropagation(); setOpen(true) }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            setOpen(true)
          }
        }}
      >
        ?
      </span>
      {open && <HelpDialog content={content} onClose={() => setOpen(false)} />}
    </>
  )
}
