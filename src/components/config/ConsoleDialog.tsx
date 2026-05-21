import { useRef, useState, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { useLang } from '../../hooks/useLang'

interface Props {
  open: boolean
  content: string
  onSend: (cmd: string) => Promise<string>
  onClose: () => void
}

export default function ConsoleDialog({ open, content, onSend, onClose }: Props) {
  const { t } = useLang()
  const [input, setInput] = useState('')
  const [localLog, setLocalLog] = useState('')
  const scrollRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    setLocalLog(content)
  }, [content])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [localLog])

  if (!open) return null

  async function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !input.trim()) return
    const cmd = input
    setInput('')
    setLocalLog(l => l + `\n> ${cmd}`)
    try {
      const resp = await onSend(cmd)
      if (resp) setLocalLog(l => l + '\n' + resp)
    } catch { /* ignore */ }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{t('config_console')}</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <pre className="serial-console" ref={scrollRef} style={{ maxHeight: 380 }}>{localLog}</pre>
          <div className="serial-input-row">
            <span className="serial-prompt">&gt;&nbsp;</span>
            <input
              className="serial-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              placeholder="type command…"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
