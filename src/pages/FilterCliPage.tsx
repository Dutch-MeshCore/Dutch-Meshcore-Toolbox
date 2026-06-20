import { useMemo, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { useToast } from '../hooks/useToast'
import Toast from '../components/ui/Toast'
import FilterSettingsForm from '../components/config/FilterSettingsForm'
import { buildFilterCommands, defaultFilterSettings, PAYLOAD_TYPES } from '../lib/config/filterCommands'

const copy = {
  nl: {
    title: 'Repeater Pakketfilter CLI',
    sub: 'Stel het pakketfilter in en krijg kant-en-klare CLI-opdrachten voor je repeater.',
    bannerTitle: 'Aangepaste DMC-firmware',
    bannerSub: 'Het pakketfilter is alleen beschikbaar in de aangepaste DutchMeshCore repeater-firmware.',
    intro: 'De opdrachten gaan ervan uit dat het filter op de standaardwaarden staat. Voer eerst "filter reset" uit als je twijfelt.',
    output: 'Gegenereerde opdrachten',
    copyAll: 'Alles kopiëren',
    copy: 'Kopieer', copied: 'Gekopieerd!',
    empty: 'Pas instellingen aan om opdrachten te genereren.',
    copiedAll: 'Alle opdrachten gekopieerd!', nothing: 'Nog niets om te kopiëren.',
    help: 'Commandoreferentie', footer: 'Repeater Pakketfilter CLI - 2026',
  },
  en: {
    title: 'Repeater Packet-Filter CLI',
    sub: 'Configure the packet filter and get ready-to-paste CLI commands for your repeater.',
    bannerTitle: 'Custom DMC firmware',
    bannerSub: 'The packet filter is only available in the custom DutchMeshCore repeater firmware.',
    intro: 'The commands assume the filter is at its default settings. Run "filter reset" first if unsure.',
    output: 'Generated commands',
    copyAll: 'Copy all',
    copy: 'Copy', copied: 'Copied!',
    empty: 'Adjust settings to generate commands.',
    copiedAll: 'All commands copied!', nothing: 'Nothing to copy yet.',
    help: 'Command reference', footer: 'Repeater Packet-Filter CLI - 2026',
  },
}

export default function FilterCliPage() {
  const { lang } = useLang()
  const c = copy[lang]
  const { toasts, toast } = useToast()
  const [settings, setSettings] = useState(defaultFilterSettings)
  const [copiedLine, setCopiedLine] = useState<number | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const commands = useMemo(
    () => buildFilterCommands(settings, defaultFilterSettings()),
    [settings],
  )

  async function copyCommand(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopiedLine(index)
    window.setTimeout(() => setCopiedLine(null), 1500)
  }

  async function copyAll() {
    if (commands.length === 0) { toast(c.nothing, 'err'); return }
    await navigator.clipboard.writeText(commands.join('\n'))
    toast(c.copiedAll, 'ok')
  }

  return (
    <>
      <Navbar />
      <main className="page mqtt-page">
        <div className="fw-banner">
          <span className="fw-banner-icon">🇳🇱</span>
          <div className="fw-banner-text">
            <strong>{c.bannerTitle}</strong>
            <p>{c.bannerSub}</p>
          </div>
          <a href="https://dutchmeshcore.nl" target="_blank" rel="noopener noreferrer">dutchmeshcore.nl</a>
        </div>

        <div className="header">
          <h1>{c.title}</h1>
          <p>{c.sub}</p>
        </div>

        <div className="info-box privacy-box"><span>ℹ</span><p>{c.intro}</p></div>

        <FilterSettingsForm value={settings} onChange={setSettings} />

        <div className="output-section">
          <div className="output-header">
            <p className="section-title">{c.output}</p>
            <div className="output-actions">
              <button className="icon-btn" onClick={() => setHelpOpen(true)} title={c.help}>?</button>
              <button className="btn btn-accent" onClick={copyAll}>{c.copyAll}</button>
            </div>
          </div>
          <div className="output-box">
            {commands.length === 0 ? (
              <p className="empty-msg">{c.empty}</p>
            ) : commands.map((line, index) => (
              <div key={index} className="cmd-line">
                <code>{line}</code>
                <button
                  className={`btn btn-sm${copiedLine === index ? ' copied' : ''}`}
                  onClick={() => copyCommand(line, index)}
                >
                  {copiedLine === index ? c.copied : c.copy}
                </button>
              </div>
            ))}
          </div>
        </div>

        <footer className="site-footer">
          <a href="https://dutchmeshcore.nl" target="_blank" rel="noopener noreferrer">DutchMeshCore.nl</a>
          {' '}— {c.footer}
        </footer>
      </main>

      {helpOpen && (
        <div className="help-overlay open" role="dialog" aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setHelpOpen(false) }}>
          <div className="help-dialog">
            <div className="help-dialog-head">
              <h3>{c.help}</h3>
              <button className="help-close-btn" onClick={() => setHelpOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="help-body">
              <table className="help-cmd-table">
                <tbody>
                  <tr><td><code>filter on</code> / <code>filter off</code></td><td>{lang === 'nl' ? 'Filter in-/uitschakelen.' : 'Enable/disable the filter.'}</td></tr>
                  <tr><td><code>filter reset</code></td><td>{lang === 'nl' ? 'Herstel standaardwaarden.' : 'Restore default settings.'}</td></tr>
                  <tr><td><code>filter hops &lt;type&gt; &lt;0–64&gt;</code></td><td>{lang === 'nl' ? 'Max. hops per payload-type.' : 'Max hops per payload type.'}</td></tr>
                  <tr><td><code>filter rate &lt;type&gt; &lt;limit&gt; &lt;secs&gt;</code></td><td>{lang === 'nl' ? 'Snelheidslimiet per type.' : 'Rate limit per type.'}</td></tr>
                  <tr><td><code>filter channel add|remove &lt;#name|Public&gt;</code></td><td>{lang === 'nl' ? 'Blokkeer GRP_TXT-kanaal.' : 'Block a GRP_TXT channel.'}</td></tr>
                  <tr><td><code>filter hash &lt;1–3&gt;</code></td><td>{lang === 'nl' ? 'Min. path-hash bytes.' : 'Min path-hash bytes.'}</td></tr>
                  <tr><td><code>filter malformed on|off</code></td><td>{lang === 'nl' ? 'Scan op ongeldige UTF-8.' : 'Scan for malformed UTF-8.'}</td></tr>
                </tbody>
              </table>
              <p className="help-section-title">{lang === 'nl' ? 'Payload-types' : 'Payload types'}</p>
              <p>{PAYLOAD_TYPES.map(pt => `${String(pt.index).padStart(2, '0')}=${pt.name}`).join('  ')}</p>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </>
  )
}
