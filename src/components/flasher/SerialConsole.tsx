import { useRef, useState, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { useLang } from '../../hooks/useLang'

interface Props {
  content: string
  onSend: (cmd: string) => void
  onClose: () => void
}

export default function SerialConsole({ content, onSend, onClose }: Props) {
  const { t } = useLang()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [content])

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      onSend(input)
      setInput('')
    }
  }

  return (
    <div className="serial-overlay">
      <div className="serial-overlay-header">
        <button className="btn" onClick={onClose}>← {t('flasher_close')}</button>
        <span style={{ fontWeight: 600 }}>{t('flasher_console')}</span>
      </div>
      <pre className="serial-console" ref={scrollRef}>{content}</pre>
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
        />
      </div>
    </div>
  )
}
