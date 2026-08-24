import { useState } from 'react'
import { useLang } from '../../hooks/useLang'
import {
  serializeRegionSettings,
  parseSharedRegionSettings,
  type RegionSettings,
} from '../../lib/config/regionCommands'

interface Props {
  value: RegionSettings
  onImport: (next: RegionSettings) => void
  onToast?: (msg: string, kind: 'ok' | 'err') => void
}

const copy = {
  en: {
    title: 'Share settings',
    hint: 'Export the current settings to share, or import a config someone shared with you.',
    copy: 'Copy', download: 'Download', importFile: 'Import file', load: 'Load',
    paste: 'Paste shared settings here to import',
    copied: 'Settings copied to clipboard.', copyErr: 'Could not copy to clipboard.',
    imported: 'Settings imported. Review, then apply or copy.',
    importErr: 'Could not read those settings. Check the text or file.',
  },
  nl: {
    title: 'Instellingen delen',
    hint: 'Exporteer de huidige instellingen om te delen, of importeer een config die iemand met je deelde.',
    copy: 'Kopieer', download: 'Download', importFile: 'Bestand importeren', load: 'Laden',
    paste: 'Plak hier gedeelde instellingen om te importeren',
    copied: 'Instellingen naar klembord gekopieerd.', copyErr: 'Kon niet naar het klembord kopiëren.',
    imported: 'Instellingen geïmporteerd. Controleer en pas toe of kopieer.',
    importErr: 'Kon die instellingen niet lezen. Controleer de tekst of het bestand.',
  },
  de: {
    title: 'Einstellungen teilen',
    hint: 'Exportiere die aktuellen Einstellungen zum Teilen oder importiere eine geteilte Konfiguration.',
    copy: 'Kopieren', download: 'Download', importFile: 'Datei importieren', load: 'Laden',
    paste: 'Geteilte Einstellungen hier zum Importieren einfügen',
    copied: 'Einstellungen in die Zwischenablage kopiert.', copyErr: 'Kopieren in die Zwischenablage fehlgeschlagen.',
    imported: 'Einstellungen importiert. Prüfen, dann anwenden oder kopieren.',
    importErr: 'Diese Einstellungen konnten nicht gelesen werden. Prüfe Text oder Datei.',
  },
} as const

export default function RegionShareControls({ value, onImport, onToast }: Props) {
  const { lang } = useLang()
  const c = copy[lang]
  const [pasteText, setPasteText] = useState('')

  function toast(msg: string, kind: 'ok' | 'err') { onToast?.(msg, kind) }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(serializeRegionSettings(value))
      toast(c.copied, 'ok')
    } catch {
      toast(c.copyErr, 'err')
    }
  }

  function download() {
    const blob = new Blob([serializeRegionSettings(value)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dmc-region.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function applyImported(text: string): boolean {
    const parsed = parseSharedRegionSettings(text)
    if (!parsed) { toast(c.importErr, 'err'); return false }
    onImport(parsed)
    toast(c.imported, 'ok')
    return true
  }

  function loadFromPaste() {
    if (applyImported(pasteText)) setPasteText('')
  }

  function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => applyImported(String(reader.result ?? ''))
    reader.onerror = () => toast(c.importErr, 'err')
    reader.readAsText(file)
  }

  return (
    <div className="filter-share">
      <p className="section-title">{c.title}</p>
      <p className="field-hint">{c.hint}</p>
      <div className="filter-share-actions">
        <button type="button" className="btn btn-sm" onClick={copyToClipboard}>⎘ {c.copy}</button>
        <button type="button" className="btn btn-sm" onClick={download}>⬇ {c.download}</button>
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
          ⬆ {c.importFile}
          <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={importFile} />
        </label>
      </div>
      <div className="filter-share-paste">
        <textarea
          className="filter-share-textarea"
          rows={2}
          placeholder={c.paste}
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
        />
        <button type="button" className="btn btn-sm" onClick={loadFromPaste} disabled={!pasteText.trim()}>
          {c.load}
        </button>
      </div>
    </div>
  )
}
