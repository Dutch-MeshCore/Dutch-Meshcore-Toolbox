import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { HelpContent } from '../config/panelHelpContent'

interface Props {
  content: HelpContent
  onClose: () => void
}

// Modal "?" help dialog shared by the config panels and the Flasher firmware groups.
// Rendered in a portal on <body> so it is never nested inside interactive markup
// (the Flasher group header is a <button>). React still bubbles portal events to the
// owner, so clicks are stopped here to keep them from toggling that owner.
export default function HelpDialog({ content, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="help-overlay open"
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
      onClick={e => {
        e.stopPropagation()
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="help-dialog">
        <div className="help-dialog-head">
          <h3>{content.title}</h3>
          <button className="help-close-btn" onClick={onClose} aria-label="Close" autoFocus>×</button>
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
    </div>,
    document.body,
  )
}
