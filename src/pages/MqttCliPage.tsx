import { useMemo, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { useToast } from '../hooks/useToast'
import Toast from '../components/ui/Toast'

type AuthMode = 'none' | 'jwt' | 'token' | 'pass'

interface Preset {
  id: string
  label: string
  auth: AuthMode
  needsIata: boolean
  region: string
}

const PRESETS: Preset[] = [
  { id: 'none', label: 'None (disabled)', auth: 'none', needsIata: false, region: '' },
  { id: 'dutchmeshcore-1', label: 'DutchMeshCore 1', auth: 'jwt', needsIata: true, region: 'NL' },
  { id: 'dutchmeshcore-2', label: 'DutchMeshCore 2', auth: 'jwt', needsIata: true, region: 'NL' },
  { id: 'analyzer-us', label: 'Analyzer US (LetsMesh)', auth: 'jwt', needsIata: true, region: 'US' },
  { id: 'analyzer-eu', label: 'Analyzer EU (LetsMesh)', auth: 'jwt', needsIata: true, region: 'EU' },
  { id: 'meshmapper', label: 'MeshMapper', auth: 'jwt', needsIata: true, region: 'Global' },
  { id: 'meshrank', label: 'MeshRank', auth: 'token', needsIata: false, region: 'Global' },
  { id: 'waev', label: 'WAEV', auth: 'jwt', needsIata: true, region: 'AU' },
  { id: 'meshomatic', label: 'MeshOmatic (US East)', auth: 'jwt', needsIata: true, region: 'US' },
  { id: 'cascadiamesh', label: 'CascadiaMesh', auth: 'jwt', needsIata: true, region: 'US' },
  { id: 'tennmesh', label: 'TennMesh', auth: 'pass', needsIata: true, region: 'US' },
  { id: 'nashmesh', label: 'NashMe.sh', auth: 'pass', needsIata: true, region: 'US' },
  { id: 'chimesh', label: 'ChiMesh', auth: 'jwt', needsIata: true, region: 'US' },
  { id: 'meshat.se', label: 'Meshat.se', auth: 'pass', needsIata: true, region: 'SE' },
]

const AIRPORTS = [
  ['AMS', 'Schiphol Airport'],
  ['DHR', 'Den Helder Airport'],
  ['EIN', 'Eindhoven Airport'],
  ['ENS', 'Enschede Airport'],
  ['GLZ', 'Gilze-Rijen Airbase'],
  ['GRQ', 'Eelde Airport'],
  ['LEY', 'Lelystad Airport'],
  ['LID', 'Valkenburg Airbase (Closed)'],
  ['LWR', 'Leeuwarden Airbase'],
  ['MST', 'Maastricht Airport'],
  ['QAR', 'Deelen Airbase'],
  ['RTM', 'Rotterdam Airport'],
  ['UDE', 'Volkel Airbase'],
  ['UTC', 'Soesterberg Airbase (Closed)'],
  ['WOE', 'Woensdrecht Airbase'],
]

const copy = {
  nl: {
    title: 'MeshCore MQTT Instelling',
    sub: 'Stel je MQTT-slots in en krijg kant-en-klare CLI-opdrachten voor je node.',
    bannerTitle: 'DutchMeshCore Firmware',
    bannerSub: 'Deze tool is afgestemd op de DutchMeshCore MQTT-firmware en het Nederlandse meshnetwerk.',
    stepsTitle: 'Hoe gebruik je deze tool',
    steps: 'Kies een IATA-luchthavencode, kies de MQTT-presets die je wil inschakelen, vul tokens in waar nodig en kopieer de gegenereerde opdrachten naar de MeshCore CLI.',
    defaultsTitle: 'Standaard slots',
    defaults: 'DutchMeshCore firmware gebruikt standaard slot 1 voor dutchmeshcore-1 en slot 2 voor dutchmeshcore-2. Meestal hoef je alleen je IATA-code te zetten.',
    beta: 'Gegenereerde opdrachten kunnen onvolledig of onjuist zijn. Controleer altijd de uitvoer voordat je deze toepast op je node.',
    privacy: 'Deze pagina slaat niets op en verstuurt niets. Alles wordt alleen lokaal gebruikt om opdrachten te genereren.',
    global: 'Algemene instellingen',
    airport: 'IATA Luchthavencode',
    pick: 'Kies een luchthaven',
    other: 'Anders',
    custom: 'Aangepaste IATA-code',
    email: 'E-mailadres eigenaar',
    emailHint: 'Optioneel, voor eigendomsverificatie of observermeldingen.',
    slots: 'MQTT-slots (1-6)',
    slotWarningTitle: 'Experimentele slots 3-6',
    slotWarning: 'Slots 3 tot en met 6 werken alleen op modules met PSRAM wanneer je zelf firmware bouwt met -D MAX_MQTT_BROKERS=6. Deze ondersteuning is zeer experimenteel.',
    output: 'Gegenereerde opdrachten',
    copyAll: 'Alles kopiëren',
    copy: 'Kopieer',
    copied: 'Gekopieerd!',
    empty: 'Selecteer een preset om opdrachten te genereren.',
    token: 'Token',
    tokenHint: 'Haal je MeshRank-token op via',
    copiedAll: 'Alle opdrachten gekopieerd!',
    nothing: 'Nog niets om te kopiëren.',
    help: 'Commandoreferentie',
    footer: 'MeshCore MQTT Insteltool - 2026',
  },
  en: {
    title: 'MeshCore MQTT Setup',
    sub: 'Configure MQTT slots and get ready-to-paste CLI commands for your node.',
    bannerTitle: 'DutchMeshCore Firmware',
    bannerSub: 'This tool is tailored for DutchMeshCore MQTT firmware and the Dutch mesh network.',
    stepsTitle: 'How to use this tool',
    steps: 'Choose an IATA airport code, pick the MQTT presets you want to enable, fill tokens where needed, and copy the generated commands into the MeshCore CLI.',
    defaultsTitle: 'Default slots',
    defaults: 'DutchMeshCore firmware uses slot 1 for dutchmeshcore-1 and slot 2 for dutchmeshcore-2 by default. Usually you only need to set your IATA code.',
    beta: 'Generated commands may be incomplete or incorrect. Always review the output before applying it to your node.',
    privacy: 'This page does not store or send anything. Everything is only used locally to generate commands.',
    global: 'Global settings',
    airport: 'IATA Airport Code',
    pick: 'Pick an airport',
    other: 'Other',
    custom: 'Custom IATA code',
    email: 'Owner email address',
    emailHint: 'Optional, for ownership verification or observer notifications.',
    slots: 'MQTT slots (1-6)',
    slotWarningTitle: 'Experimental slots 3-6',
    slotWarning: 'Slots 3 through 6 only work on modules with PSRAM when you build your own firmware with -D MAX_MQTT_BROKERS=6. This support is highly experimental.',
    output: 'Generated commands',
    copyAll: 'Copy all',
    copy: 'Copy',
    copied: 'Copied!',
    empty: 'Select a preset to generate commands.',
    token: 'Token',
    tokenHint: 'Get your MeshRank token at',
    copiedAll: 'All commands copied!',
    nothing: 'Nothing to copy yet.',
    help: 'Command reference',
    footer: 'MeshCore MQTT Setup Tool - 2026',
  },
}

function normalizeIata(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

function authBadge(auth: AuthMode) {
  if (auth === 'jwt') return ['badge-jwt', 'JWT']
  if (auth === 'token') return ['badge-token', 'Token']
  if (auth === 'pass') return ['badge-pass', 'User/Pass']
  return ['badge-none', 'none']
}

export default function MqttCliPage() {
  const { lang } = useLang()
  const c = copy[lang]
  const { toasts, toast } = useToast()
  const [iataSelect, setIataSelect] = useState('')
  const [iataCustom, setIataCustom] = useState('')
  const [email, setEmail] = useState('')
  const [slots, setSlots] = useState(['dutchmeshcore-1', 'dutchmeshcore-2', 'none', 'none', 'none', 'none'])
  const [tokens, setTokens] = useState(['', '', '', '', '', ''])
  const [copiedLine, setCopiedLine] = useState<number | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const presetMap = useMemo(() => Object.fromEntries(PRESETS.map(p => [p.id, p])) as Record<string, Preset>, [])
  const iata = iataSelect === 'other' ? normalizeIata(iataCustom) : iataSelect

  const commands = useMemo(() => {
    const lines: Array<{ type: 'comment' | 'cmd'; text: string }> = []
    const active = slots.map((id, idx) => ({ preset: presetMap[id], idx })).filter(s => s.preset.id !== 'none')
    if (active.length === 0) return lines

    if (active.some(s => s.preset.needsIata)) {
      lines.push({ type: 'comment', text: lang === 'nl' ? 'Stel je IATA-code in' : 'Set your IATA code' })
      lines.push({ type: 'cmd', text: `set mqtt.iata ${iata || 'XXX'}` })
    }

    if (email.trim()) {
      lines.push({ type: 'comment', text: lang === 'nl' ? 'Stel je e-mailadres in' : 'Set your email address' })
      lines.push({ type: 'cmd', text: `set mqtt.email ${email.trim()}` })
    }

    for (const { preset, idx } of active) {
      lines.push({ type: 'comment', text: `Slot ${idx + 1} - ${preset.label}` })
      lines.push({ type: 'cmd', text: `set mqtt${idx + 1}.preset ${preset.id}` })
      if (preset.auth === 'token') {
        lines.push({ type: 'cmd', text: `set mqtt${idx + 1}.token ${tokens[idx] || '<your-meshrank-token>'}` })
      }
    }
    lines.push({ type: 'comment', text: lang === 'nl' ? 'Herstart om instellingen toe te passen' : 'Reboot to apply settings' })
    lines.push({ type: 'cmd', text: 'reboot' })
    return lines
  }, [email, iata, lang, presetMap, slots, tokens])

  function updateSlot(index: number, value: string) {
    setSlots(current => current.map((slot, i) => i === index ? value : slot))
  }

  function updateToken(index: number, value: string) {
    setTokens(current => current.map((token, i) => i === index ? value.trim() : token))
  }

  async function copyCommand(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopiedLine(index)
    window.setTimeout(() => setCopiedLine(null), 1500)
  }

  async function copyAll() {
    const lines = commands.filter(line => line.type === 'cmd').map(line => line.text)
    if (lines.length === 0) {
      toast(c.nothing, 'err')
      return
    }
    await navigator.clipboard.writeText(lines.join('\n'))
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

        <div className="beta-banner">
          <span className="beta-banner-icon">⚠</span>
          <span className="beta-banner-text"><strong>Beta — </strong>{c.beta}</span>
        </div>

        <div className="header">
          <h1>{c.title}</h1>
          <p>{c.sub}</p>
        </div>

        <details className="info-panel" open>
          <summary><span>{c.stepsTitle}</span><span className="arrow">▼</span></summary>
          <div className="info-panel-body">
            <div className="info-box">
              <h4>{c.stepsTitle}</h4>
              <p>{c.steps}</p>
            </div>
            <div className="info-box warn">
              <h4>{c.defaultsTitle}</h4>
              <p>{c.defaults}</p>
            </div>
            <div className="info-box">
              <h4>Links</h4>
              <div className="quick-links">
                <a className="quick-link" href="https://www.iata.org/en/publications/directories/code-search/" target="_blank" rel="noopener noreferrer">IATA</a>
                <a className="quick-link" href="https://meshrank.net" target="_blank" rel="noopener noreferrer">MeshRank</a>
                <a className="quick-link" href="https://flasher.meshcore.io/" target="_blank" rel="noopener noreferrer">MeshCore Flasher</a>
                <a className="quick-link" href="https://github.com/Dutch-MeshCore/Dutch-MeshCore-MQTT" target="_blank" rel="noopener noreferrer">Firmware Repo</a>
              </div>
            </div>
          </div>
        </details>

        <div className="info-box privacy-box">
          <span>🔒</span>
          <p>{c.privacy}</p>
        </div>

        <p className="section-title">{c.global}</p>
        <div className="global-card">
          <div className="global-card-inner">
            <div className="field-group">
              <label htmlFor="iataselect">{c.airport}</label>
              <select id="iataselect" value={iataSelect} onChange={event => setIataSelect(event.target.value)}>
                <option value="">{c.pick}</option>
                {AIRPORTS.map(([code, name]) => <option key={code} value={code}>{code} - {name}</option>)}
                <option value="other">{c.other}</option>
              </select>
            </div>
            {iataSelect === 'other' && (
              <div className="field-group">
                <label htmlFor="iatainput">{c.custom}</label>
                <input id="iatainput" className="iata-input" value={iataCustom} onChange={event => setIataCustom(normalizeIata(event.target.value))} placeholder="AMS" />
              </div>
            )}
            <div className="field-group">
              <label htmlFor="emailinput">{c.email}</label>
              <input id="emailinput" type="text" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.nl" />
              <span className="field-hint">{c.emailHint}</span>
            </div>
            <div className="field-group iata-display">{iata || '---'}</div>
          </div>
        </div>

        <p className="section-title">{c.slots}</p>
        <div className="info-box warn slot-warning">
          <h4>{c.slotWarningTitle}</h4>
          <p>{c.slotWarning}</p>
        </div>
        <div className="slots-grid">
          {slots.map((slot, index) => {
            const preset = presetMap[slot]
            const [badgeClass, badgeLabel] = authBadge(preset.auth)
            return (
              <div key={index} className={`slot-card${slot !== 'none' ? ' has-preset' : ''}`}>
                <div className="slot-head">
                  <span className="slot-label">mqtt{index + 1}</span>
                  <span className={`slot-badge ${badgeClass}`}>{badgeLabel}</span>
                </div>
                <select className="slot-select" value={slot} onChange={event => updateSlot(index, event.target.value)}>
                  {PRESETS.map(presetOption => (
                    <option key={presetOption.id} value={presetOption.id}>
                      {presetOption.region ? `${presetOption.region} ` : ''}{presetOption.label}
                    </option>
                  ))}
                </select>
                {preset.auth === 'token' && (
                  <div className="slot-extra">
                    <div className="field-group">
                      <label htmlFor={`slot-token-${index}`}>{c.token}</label>
                      <input id={`slot-token-${index}`} value={tokens[index]} onChange={event => updateToken(index, event.target.value)} placeholder="..." />
                      <span className="field-hint">{c.tokenHint} <a href="https://meshrank.net" target="_blank" rel="noopener noreferrer">meshrank.net</a></span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

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
            ) : commands.map((line, index) => line.type === 'comment' ? (
              <span key={index} className="cmd-comment"># {line.text}</span>
            ) : (
              <div key={index} className="cmd-line">
                <code>{line.text}</code>
                <button className={`btn btn-sm${copiedLine === index ? ' copied' : ''}`} onClick={() => copyCommand(line.text, index)}>
                  {copiedLine === index ? c.copied : c.copy}
                </button>
              </div>
            ))}
          </div>
        </div>

        <footer className="site-footer">
          <a href="https://dutchmeshcore.nl" target="_blank" rel="noopener noreferrer">DutchMeshCore.nl</a>
          {' '}— <a href="https://github.com/Dutch-MeshCore/Dutch-Meshcore-Toolbox" target="_blank" rel="noopener noreferrer">Toolbox Repo</a>
          {' '}— {c.footer}
        </footer>
      </main>

      {helpOpen && (
        <div className="help-overlay open" role="dialog" aria-modal="true" onClick={event => { if (event.target === event.currentTarget) setHelpOpen(false) }}>
          <div className="help-dialog">
            <div className="help-dialog-head">
              <h3>{c.help}</h3>
              <button className="help-close-btn" onClick={() => setHelpOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="help-body">
              <table className="help-cmd-table">
                <tbody>
                  <tr><td><code>set mqtt.iata &lt;code&gt;</code></td><td>{lang === 'nl' ? 'Stelt de IATA-code in.' : 'Sets the IATA code.'}</td></tr>
                  <tr><td><code>set mqtt.email &lt;email&gt;</code></td><td>{lang === 'nl' ? 'Stelt het eigenaaradres in.' : 'Sets the owner email address.'}</td></tr>
                  <tr><td><code>set mqtt&lt;N&gt;.preset &lt;name&gt;</code></td><td>{lang === 'nl' ? 'Kiest de preset voor slot N.' : 'Selects the preset for slot N.'}</td></tr>
                  <tr><td><code>set mqtt&lt;N&gt;.token &lt;token&gt;</code></td><td>{lang === 'nl' ? 'Stelt een token in voor token-presets.' : 'Sets a token for token presets.'}</td></tr>
                  <tr><td><code>reboot</code></td><td>{lang === 'nl' ? 'Herstart de node.' : 'Reboots the node.'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </>
  )
}
