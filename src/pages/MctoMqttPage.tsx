import { useMemo, useRef, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { useToast } from '../hooks/useToast'
import Toast from '../components/ui/Toast'

type ConfigMode = 'toml' | 'legacy'

interface BrokerState {
  enabled: boolean
}

const ALL_BROKERS = [
  {
    id: 'dutch-meshcore-1',
    label: 'dutchmeshcore.nl (1)',
    server: 'collector1.dutchmeshcore.nl',
    port: 443,
    transport: 'websockets',
    auth: 'token' as const,
    audience: 'collector1.dutchmeshcore.nl',
    badge: ':443 WSS · TLS · token',
  },
  {
    id: 'dutch-meshcore-2',
    label: 'dutchmeshcore.nl (2)',
    server: 'collector2.dutchmeshcore.nl',
    port: 443,
    transport: 'websockets',
    auth: 'token' as const,
    audience: 'collector2.dutchmeshcore.nl',
    badge: ':443 WSS · TLS · token',
  },
  {
    id: 'letsmesh-eu',
    label: 'LetsMesh.net (EU)',
    server: 'mqtt-eu-v1.letsmesh.net',
    port: 443,
    transport: 'websockets',
    auth: 'token' as const,
    audience: 'mqtt-eu-v1.letsmesh.net',
    badge: ':443 WSS · TLS · token',
  },
  {
    id: 'cornmeister',
    label: 'cornmeister.nl',
    server: 'mqtt.cornmeister.nl',
    port: 8883,
    transport: 'tcp',
    auth: 'password' as const,
    username: 'observer',
    password: 'hiermetdiedata',
    badge: ':8883 TCP · TLS · password',
  },
] as const

type BrokerDef = (typeof ALL_BROKERS)[number]

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
] as const

function normalizeIata(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

const SEPARATOR = [
  ``,
  ``,
  `# ${'─'.repeat(77)}`,
  `# DutchMeshCore Toolbox — gegenereerde toevoegingen / generated additions`,
  `#`,
  `# ⚠  Controleer dit gedeelte zorgvuldig voor je het toepast.`,
  `#    Kopieer dit niet blindelings over je bestaande configuratie heen.`,
  `#`,
  `# ⚠  Review this section carefully before applying it.`,
  `#    Do not blindly copy it over your existing configuration.`,
  `# ${'─'.repeat(77)}`,
  ``,
  ``,
].join('\n')

const copy = {
  nl: {
    title: 'MCtoMQTT Configuratie Generator',
    sub: 'Genereer een MCtoMQTT-configuratiebestand voor de DutchMeshCore collectors.',
    modeToml: 'TOML (nieuw)',
    modeLegacy: 'Legacy .env',
    infoTitle: 'Wat is MCtoMQTT?',
    infoBody: 'MCtoMQTT is een brug-applicatie die MeshCore-apparaten verbindt met MQTT-brokers. Het configuratiebestand bepaalt met welke brokers verbinding wordt gemaakt en hoe authenticatie verloopt.',
    beta: 'Gegenereerde configuratie kan onvolledig of onjuist zijn. Controleer altijd de uitvoer voordat je deze toepast op je systeem.',
    privacyNote: 'Niets verlaat je apparaat — ook geüploade bestanden worden volledig lokaal in je browser verwerkt en nooit verstuurd.',
    importTitle: 'Bestaande configuratie importeren (optioneel)',
    importHint: '.toml of .env bestand — wordt alleen lokaal gelezen, verlaat je apparaat niet.',
    importBtn: 'Bestand kiezen',
    importClear: 'Verwijderen',
    importWarnTitle: 'Controleer voor gebruik',
    importWarnBody: 'De gegenereerde toevoegingen staan onderaan je originele configuratie. Controleer het gecombineerde resultaat zorgvuldig voordat je het toepast — kopieer dit niet blindelings over je bestaande bestand heen zonder het te controleren.',
    settingsTitle: 'Instellingen',
    ownerLabel: 'Publieke sleutel eigenaar (64 hex tekens)',
    ownerHint: 'De publieke sleutel van je MeshCore companion device — 64 hexadecimale tekens.',
    ownerInvalid: 'Voer precies 64 hexadecimale tekens in (0–9, a–f / A–F).',
    emailLabel: 'E-mailadres eigenaar (optioneel)',
    emailHint: 'Optioneel e-mailadres van de node-eigenaar.',
    iataLabel: 'IATA-luchthavencode',
    iataPick: 'Kies een luchthaven',
    iataOther: 'Anders',
    iataCustom: 'Aangepaste IATA-code',
    iataHint: 'Locatiecode van je node, bijv. RTM voor Rotterdam.',
    serialLabel: 'Seriële poorten (optioneel)',
    serialHint: 'Kommagescheiden lijst van seriële poorten, bijv. /dev/ttyUSB0. Leeg laten voor automatische detectie.',
    brokersTitle: 'Brokers',
    brokerEnabled: 'Ingeschakeld',
    authPassword: 'wachtwoord (vast)',
    outputTitleToml: 'Gegenereerde configuratie (MCtoMQTT.toml)',
    outputTitleLegacy: 'Gegenereerde configuratie (override.env)',
    outputTitleMergedToml: 'Gecombineerde configuratie (MCtoMQTT.toml)',
    outputTitleMergedLegacy: 'Gecombineerde configuratie (override.env)',
    copyAll: 'Kopieer alles',
    copiedAll: 'Configuratie gekopieerd!',
    download: 'Downloaden',
    footer: 'MCtoMQTT Configuratie Generator - 2026',
  },
  en: {
    title: 'MCtoMQTT Configuration Generator',
    sub: 'Generate a MCtoMQTT configuration file for the DutchMeshCore collectors.',
    modeToml: 'TOML (new)',
    modeLegacy: 'Legacy .env',
    infoTitle: 'What is MCtoMQTT?',
    infoBody: 'MCtoMQTT is a bridge application that connects MeshCore devices to MQTT brokers. The configuration file defines which brokers to connect to and how authentication is handled.',
    beta: 'Generated configuration may be incomplete or incorrect. Always review the output before applying it to your system.',
    privacyNote: 'Nothing leaves your device — uploaded files are processed entirely in your browser and are never sent anywhere.',
    importTitle: 'Import existing config (optional)',
    importHint: '.toml or .env file — read locally only, never leaves your device.',
    importBtn: 'Choose file',
    importClear: 'Remove',
    importWarnTitle: 'Review before applying',
    importWarnBody: 'The generated additions are appended below your original config. Review the combined result carefully before applying it — do not blindly copy it over your existing file without checking.',
    settingsTitle: 'Settings',
    ownerLabel: 'Owner public key (64 hex chars)',
    ownerHint: 'The public key of your MeshCore companion device — 64 hexadecimal characters.',
    ownerInvalid: 'Enter exactly 64 hexadecimal characters (0–9, a–f / A–F).',
    emailLabel: 'Owner email address (optional)',
    emailHint: 'Optional e-mail address of the node owner.',
    iataLabel: 'IATA airport code',
    iataPick: 'Pick an airport',
    iataOther: 'Other',
    iataCustom: 'Custom IATA code',
    iataHint: 'Location code for your node, e.g. RTM for Rotterdam.',
    serialLabel: 'Serial ports (optional)',
    serialHint: 'Comma-separated list of serial ports, e.g. /dev/ttyUSB0. Leave empty for auto-detection.',
    brokersTitle: 'Brokers',
    brokerEnabled: 'Enabled',
    authPassword: 'password (fixed)',
    outputTitleToml: 'Generated configuration (MCtoMQTT.toml)',
    outputTitleLegacy: 'Generated configuration (override.env)',
    outputTitleMergedToml: 'Combined configuration (MCtoMQTT.toml)',
    outputTitleMergedLegacy: 'Combined configuration (override.env)',
    copyAll: 'Copy all',
    copiedAll: 'Configuration copied!',
    download: 'Download',
    footer: 'MCtoMQTT Configuration Generator - 2026',
  },
}

function isValidHex64(val: string) {
  return /^[0-9a-fA-F]{64}$/.test(val)
}

function toTomlArray(csv: string): string {
  const ports = csv.split(',').map(s => s.trim()).filter(Boolean)
  if (ports.length === 0) return '[]'
  return '[' + ports.map(p => `"${p}"`).join(', ') + ']'
}

function buildToml(owner: string, email: string, iata: string, serialPorts: string, states: BrokerState[]) {
  const header = [
    `[general]`,
    `iata = "${iata}"`,
    ``,
    `[serial]`,
    `ports = ${toTomlArray(serialPorts)}`,
  ].join('\n')

  const blocks: string[] = []
  ALL_BROKERS.forEach((broker, i) => {
    const authLines =
      broker.auth === 'token'
        ? [
            `method = "token"`,
            `audience = "${broker.audience}"`,
            `# owner: public key of the owner's MeshCore companion device (64 hex chars)`,
            `owner = "${owner}"`,
            `# email: e-mail of the node owner (optional)`,
            `email = "${email}"`,
          ]
        : [
            `method = "password"`,
            `username = "${(broker as Extract<BrokerDef, { auth: 'password' }>).username}"`,
            `password = "${(broker as Extract<BrokerDef, { auth: 'password' }>).password}"`,
          ]

    blocks.push(
      [
        `[[broker]]`,
        `name = "${broker.id}"`,
        `enabled = ${states[i].enabled}`,
        `server = "${broker.server}"`,
        `port = ${broker.port}`,
        `transport = "${broker.transport}"`,
        `keepalive = 60`,
        `qos = 0`,
        `retain = true`,
        ``,
        `[broker.tls]`,
        `enabled = true`,
        `verify = true`,
        ``,
        `[broker.auth]`,
        ...authLines,
      ].join('\n'),
    )
  })
  return header + '\n\n\n' + blocks.join('\n\n\n')
}

function buildLegacy(
  owner: string,
  email: string,
  iata: string,
  serialPorts: string,
  states: BrokerState[],
) {
  const lines: string[] = [
    `# MeshCore to MQTT Configuration`,
    `# This file contains your local overrides to the defaults in .env`,
    ``,
    `# Update source (configured by installer)`,
    `MCTOMQTT_UPDATE_REPO=Cisien/meshcoretomqtt`,
    `MCTOMQTT_UPDATE_BRANCH=main`,
    ``,
    `# Serial Configuration`,
    `MCTOMQTT_SERIAL_PORTS=${serialPorts}`,
    ``,
    `# Location Code`,
    `MCTOMQTT_IATA=${iata}`,
  ]

  ALL_BROKERS.forEach((broker, i) => {
    const num = i + 1
    lines.push(``)
    lines.push(`# MQTT Broker ${num} - ${broker.label}`)
    lines.push(`MCTOMQTT_MQTT${num}_ENABLED=${states[i].enabled}`)
    lines.push(`MCTOMQTT_MQTT${num}_SERVER=${broker.server}`)
    lines.push(`MCTOMQTT_MQTT${num}_PORT=${broker.port}`)
    lines.push(`MCTOMQTT_MQTT${num}_TRANSPORT=${broker.transport}`)
    lines.push(`MCTOMQTT_MQTT${num}_USE_TLS=true`)

    if (broker.auth === 'token') {
      lines.push(`MCTOMQTT_MQTT${num}_USE_AUTH_TOKEN=true`)
      lines.push(`MCTOMQTT_MQTT${num}_TOKEN_AUDIENCE=${broker.audience}`)
      lines.push(`MCTOMQTT_MQTT${num}_TOKEN_OWNER=${owner}`)
      lines.push(`MCTOMQTT_MQTT${num}_TOKEN_EMAIL=${email}`)
    } else {
      const pb = broker as Extract<BrokerDef, { auth: 'password' }>
      lines.push(`MCTOMQTT_MQTT${num}_USE_AUTH_TOKEN=false`)
      lines.push(`MCTOMQTT_MQTT${num}_USERNAME=${pb.username}`)
      lines.push(`MCTOMQTT_MQTT${num}_PASSWORD=${pb.password}`)
    }
  })

  return lines.join('\n')
}

export default function MctoMqttPage() {
  const { lang } = useLang()
  const c = copy[lang]
  const { toasts, toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<ConfigMode>('toml')
  const [owner, setOwner] = useState('')
  const [email, setEmail] = useState('')
  const [iataSelect, setIataSelect] = useState('')
  const [iataCustom, setIataCustom] = useState('')
  const [serialPorts, setSerialPorts] = useState('')

  const iata = iataSelect === 'other' ? normalizeIata(iataCustom) : iataSelect
  const [brokerStates, setBrokerStates] = useState<BrokerState[]>(
    ALL_BROKERS.map(() => ({ enabled: true })),
  )
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadedContent, setUploadedContent] = useState<string | null>(null)
  const [btnCopied, setBtnCopied] = useState(false)

  const ownerError = owner !== '' && !isValidHex64(owner)

  const output = useMemo(() => {
    const generated =
      mode === 'toml'
        ? buildToml(owner, email, iata, serialPorts, brokerStates)
        : buildLegacy(owner, email, iata, serialPorts, brokerStates)

    if (!uploadedContent) return generated
    return uploadedContent.trimEnd() + SEPARATOR + generated
  }, [mode, owner, email, iata, serialPorts, brokerStates, uploadedContent])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setUploadedContent(ev.target?.result as string)
      setUploadedFileName(file.name)
    }
    reader.readAsText(file)
    // Reset input so the same file can be re-selected after clearing
    e.target.value = ''
  }

  function clearUpload() {
    setUploadedContent(null)
    setUploadedFileName(null)
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(output)
      setBtnCopied(true)
      setTimeout(() => setBtnCopied(false), 2000)
      toast(c.copiedAll, 'ok')
    } catch {
      toast('Copy failed', 'err')
    }
  }

  function downloadConfig() {
    const filename = mode === 'toml' ? 'MCtoMQTT.toml' : 'override.env'
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleBroker(i: number) {
    setBrokerStates(prev =>
      prev.map((b, idx) => (idx === i ? { ...b, enabled: !b.enabled } : b)),
    )
  }

  const isMerged = !!uploadedContent
  const outputTitle = isMerged
    ? (mode === 'toml' ? c.outputTitleMergedToml : c.outputTitleMergedLegacy)
    : (mode === 'toml' ? c.outputTitleToml : c.outputTitleLegacy)

  return (
    <>
      <Navbar />
      <main className="page mqtt-page mcmqtt-page">
        <h1 className="page-title">{c.title}</h1>
        <p className="page-sub">{c.sub}</p>

        <div className="mcmqtt-mode-toggle">
          <button
            className={`mcmqtt-mode-btn${mode === 'toml' ? ' active' : ''}`}
            onClick={() => { setMode('toml'); clearUpload() }}
          >
            {c.modeToml}
          </button>
          <button
            className={`mcmqtt-mode-btn${mode === 'legacy' ? ' active' : ''}`}
            onClick={() => { setMode('legacy'); clearUpload() }}
          >
            {c.modeLegacy}
          </button>
        </div>

        <div className="beta-banner">
          <span className="beta-banner-icon">⚠</span>
          <span className="beta-banner-text"><strong>Beta — </strong>{c.beta}</span>
        </div>

        <details className="info-panel" open>
          <summary>
            <span>{c.infoTitle}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box">
              <p>{c.infoBody}</p>
              <p className="mcmqtt-privacy-note">{c.privacyNote}</p>
            </div>
          </div>
        </details>

        {/* Import existing config */}
        <div className="global-card mcmqtt-import-card">
          <h3 className="section-label">{c.importTitle}</h3>

          <input
            ref={fileInputRef}
            type="file"
            accept={mode === 'toml' ? '.toml' : '.env,.txt,text/plain'}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          {!uploadedFileName ? (
            <button
              className="mcmqtt-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="mcmqtt-upload-icon">📂</span>
              {c.importBtn}
              <span className="field-hint" style={{ display: 'block', marginTop: 4 }}>
                {c.importHint}
              </span>
            </button>
          ) : (
            <div className="mcmqtt-uploaded-row">
              <span className="mcmqtt-upload-icon">📄</span>
              <span className="mcmqtt-filename">{uploadedFileName}</span>
              <button className="btn btn-sm" onClick={clearUpload}>{c.importClear}</button>
            </div>
          )}

          {isMerged && (
            <div className="mcmqtt-import-warn">
              <strong>⚠ {c.importWarnTitle}</strong>
              <p>{c.importWarnBody}</p>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="global-card">
          <h3 className="section-label">{c.settingsTitle}</h3>

          <div className="field-group">
            <label htmlFor="mcmqtt-owner">{c.ownerLabel}</label>
            <input
              id="mcmqtt-owner"
              className={ownerError ? 'input-error' : ''}
              value={owner}
              onChange={e => setOwner(e.target.value.trim())}
              placeholder="0000000000000000000000000000000000000000000000000000000000000000"
              maxLength={64}
              spellCheck={false}
              autoComplete="off"
            />
            {ownerError
              ? <span className="field-error">{c.ownerInvalid}</span>
              : <span className="field-hint">{c.ownerHint}</span>
            }
          </div>

          <div className="field-group">
            <label htmlFor="mcmqtt-email">{c.emailLabel}</label>
            <input
              id="mcmqtt-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              placeholder="user@example.com"
            />
            <span className="field-hint">{c.emailHint}</span>
          </div>

          <div className="field-group">
            <label htmlFor="mcmqtt-iata">{c.iataLabel}</label>
            <select
              id="mcmqtt-iata"
              value={iataSelect}
              onChange={e => setIataSelect(e.target.value)}
            >
              <option value="">{c.iataPick}</option>
              {AIRPORTS.map(([code, name]) => (
                <option key={code} value={code}>{code} — {name}</option>
              ))}
              <option value="other">{c.iataOther}</option>
            </select>
            <span className="field-hint">{c.iataHint}</span>
          </div>
          {iataSelect === 'other' && (
            <div className="field-group">
              <label htmlFor="mcmqtt-iata-custom">{c.iataCustom}</label>
              <input
                id="mcmqtt-iata-custom"
                className="iata-input"
                value={iataCustom}
                onChange={e => setIataCustom(normalizeIata(e.target.value))}
                placeholder="AMS"
              />
            </div>
          )}

          <div className="field-group">
            <label htmlFor="mcmqtt-serial">{c.serialLabel}</label>
            <input
              id="mcmqtt-serial"
              value={serialPorts}
              onChange={e => setSerialPorts(e.target.value.trim())}
              placeholder="/dev/serial/by-id/usb-Heltec_…"
              spellCheck={false}
              autoComplete="off"
            />
            <span className="field-hint">{c.serialHint}</span>
          </div>
        </div>

        {/* Broker toggles */}
        <div className="slots-section">
          <h3 className="section-label">{c.brokersTitle}</h3>
          <div className="slots-grid mcmqtt-brokers">
            {ALL_BROKERS.map((broker, i) => (
              <div
                key={broker.id}
                className={`slot-card mcmqtt-broker-card${brokerStates[i].enabled ? '' : ' slot-disabled'}`}
              >
                <div className="slot-header">
                  <span className="slot-name">
                    {broker.id}
                    {broker.auth === 'password' && (
                      <span className="mcmqtt-badge mcmqtt-badge-fixed">
                        {c.authPassword}
                      </span>
                    )}
                  </span>
                  <label className="mcmqtt-toggle">
                    <input
                      type="checkbox"
                      checked={brokerStates[i].enabled}
                      onChange={() => toggleBroker(i)}
                    />
                    <span>{c.brokerEnabled}</span>
                  </label>
                </div>
                <div className="slot-meta">
                  <span className="mcmqtt-server">{broker.server}</span>
                  <span className="mcmqtt-badge">{broker.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="output-section">
          <div className="output-header">
            <h3>
              {outputTitle}
              {isMerged && <span className="mcmqtt-merged-pill">merged</span>}
            </h3>
            <div className="output-actions">
              <button className="btn btn-sm" onClick={downloadConfig}>
                {c.download}
              </button>
              <button
                className={`btn btn-accent btn-sm${btnCopied ? ' copied' : ''}`}
                onClick={copyAll}
              >
                {btnCopied ? '✓' : c.copyAll}
              </button>
            </div>
          </div>
          <pre className="output-box toml-output"><code>{output}</code></pre>
        </div>

        <footer className="page-footer">
          <p>{c.footer}</p>
        </footer>
      </main>
      <Toast toasts={toasts} />
    </>
  )
}
