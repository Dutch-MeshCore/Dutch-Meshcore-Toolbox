import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { copyText } from '../utils/clipboard'

const copy = {
  nl: {
    hero: 'Tools voor het Nederlandse MeshCore-netwerk.',
    heroSub: 'Kies wat je wilt doen. De technische pagina\'s blijven beschikbaar, maar de startpagina wijst je sneller naar de juiste tool.',
    startTitle: 'Nieuw hier?',
    startBody: 'DutchMeshCore helpt je kanalen vinden, nodes configureren, firmware flashen en community-projecten ontdekken.',
    primaryChannels: 'Kanalen bekijken',
    primaryMqtt: 'MQTT instellen',
    primaryFlash: 'Firmware flashen',
    tools: 'Kies je taak',
    toolBrowser: 'Kanalen vinden',
    toolBrowserMeta: 'Channel Browser',
    browserDesc: 'Zoek kanalen, kopieer sleutels en exporteer lijsten voor MeshCore NL.',
    toolMqtt: 'MQTT commando\'s maken',
    toolMqttMeta: 'MQTT CLI Setup',
    mqttDesc: 'Vul brokergegevens in en krijg kant-en-klare CLI-opdrachten voor je node.',
    toolToml: 'Bridge-config maken',
    toolTomlMeta: 'MCtoMQTT',
    tomlDesc: 'Genereer een TOML- of legacy-config voor een MCtoMQTT bridge, Home Assistant en andere MQTT-koppelingen.',
    toolFlasher: 'Device flashen',
    toolFlasherMeta: 'Flasher',
    flasherDesc: 'Flash firmware direct vanuit de browser naar ondersteunde MeshCore-apparaten.',
    toolUsb: 'Repeater instellen',
    toolUsbMeta: 'USB Config',
    usbDesc: 'Configureer een repeater of room server via USB-serieel.',
    toolKeygen: 'Sleutel genereren',
    toolKeygenMeta: 'MC-Keygen',
    keygenDesc: 'Maak een vanity Ed25519-sleutelpaar voor een herkenbare node-prefix.',
    toolProjects: 'Community-projecten bekijken',
    toolProjectsMeta: 'Community Projects',
    projectsDesc: 'Bekijk apps, analyzers en projecten rond DutchMeshCore-data.',
    live: 'Live',
    linksTitle: 'Handige links',
    linksSub: 'Actuele referenties voor MeshCore NL, regio-indeling, firmware en community-tools.',
    communities: 'MeshCore Nederland Communities',
    communitiesSub: 'Handige MeshCore NL-communities om te volgen of aan deel te nemen.',
    analyzers: 'MeshCore Analyzers',
    analyzersSub: 'Dashboards voor live netwerkuitvoer en kanaalactiviteit op DutchMeshCore-data.',
    mqttTitle: 'DutchMeshCore MQTT verbindingsinformatie',
    mqttSub: 'Collectorservers voor observer-data en community-analyzers.',
    radioTitle: 'NL Radio Settings',
    radioSub: 'Aanbevolen radio-instellingen voor MeshCore NL.',
    radioParam: 'Parameter',
    radioValue: 'Waarde',
    radioPreset: 'Radio preset',
    radioPresetValue: 'Custom',
    radioSf: 'Spreading factor',
    radioSfValue: 'SF7',
    radioCr: 'Coding rate',
    radioCrValue: 'CR5 (Deze kun je op 8 zetten als je op 5 niks binnen krijgt)',
    radioFrequency: 'Frequentie',
    radioFrequencyValue: '869.618 MHz',
    radioBandwidth: 'Bandbreedte',
    radioBandwidthValue: '62.5 kHz',
    radioAdvert: 'Advert interval',
    radioAdvertValue: '50 uur minimum (flood adverts)',
    radioFirmware: 'Firmware',
    radioFirmwareValue: '1.15 of nieuwer',
    server: 'Server',
    protocol: 'Protocol',
    tls: 'TLS',
    audience: 'Audience',
    auth: 'Authenticatie',
    topicFormat: 'Topic-formaat',
    collector: 'Collector',
    copied: 'Gekopieerd!',
    copy: 'Kopieer',
    useAsBroker: 'Gebruik als aangepaste broker',
    footer: 'Community tools voor MeshCore NL - 2026',
  },
  en: {
    hero: 'Tools for the Dutch MeshCore network.',
    heroSub: 'Choose what you want to do. The technical pages are still here, but the start page gets you to the right tool faster.',
    startTitle: 'New here?',
    startBody: 'DutchMeshCore helps you find channels, configure nodes, flash firmware, and discover community projects.',
    primaryChannels: 'Browse channels',
    primaryMqtt: 'Set up MQTT',
    primaryFlash: 'Flash firmware',
    tools: 'Choose your task',
    toolBrowser: 'Find channels',
    toolBrowserMeta: 'Channel Browser',
    browserDesc: 'Search channels, copy keys, and export lists for MeshCore NL.',
    toolMqtt: 'Create MQTT commands',
    toolMqttMeta: 'MQTT CLI Setup',
    mqttDesc: 'Fill in broker details and get ready-to-paste CLI commands for your node.',
    toolToml: 'Build bridge config',
    toolTomlMeta: 'MCtoMQTT',
    tomlDesc: 'Generate TOML or legacy config for an MCtoMQTT bridge, Home Assistant, and other MQTT integrations.',
    toolFlasher: 'Flash a device',
    toolFlasherMeta: 'Flasher',
    flasherDesc: 'Flash firmware from the browser to supported MeshCore devices.',
    toolUsb: 'Set up a repeater',
    toolUsbMeta: 'USB Config',
    usbDesc: 'Configure a repeater or room server over USB serial.',
    toolKeygen: 'Generate a key',
    toolKeygenMeta: 'MC-Keygen',
    keygenDesc: 'Create a vanity Ed25519 key pair for a recognizable node prefix.',
    toolProjects: 'Explore community projects',
    toolProjectsMeta: 'Community Projects',
    projectsDesc: 'See apps, analyzers, and projects around DutchMeshCore data.',
    live: 'Live',
    linksTitle: 'Useful links',
    linksSub: 'Current references for MeshCore NL, region naming, firmware, and community tools.',
    communities: 'MeshCore Nederland Communities',
    communitiesSub: 'Useful MeshCore NL communities to follow or join.',
    analyzers: 'MeshCore Analyzers',
    analyzersSub: 'Dashboards for live network output and channel activity based on DutchMeshCore data.',
    mqttTitle: 'DutchMeshCore MQTT connection info',
    mqttSub: 'Collector servers for observer data and community analyzers.',
    radioTitle: 'NL Radio Settings',
    radioSub: 'Recommended radio settings for MeshCore NL.',
    radioParam: 'Parameter',
    radioValue: 'Value',
    radioPreset: 'Radio preset',
    radioPresetValue: 'Custom',
    radioSf: 'Spreading factor',
    radioSfValue: 'SF7',
    radioCr: 'Coding rate',
    radioCrValue: 'CR5 (set this to 8 if you receive nothing on 5)',
    radioFrequency: 'Frequency',
    radioFrequencyValue: '869.618 MHz',
    radioBandwidth: 'Bandwidth',
    radioBandwidthValue: '62.5 kHz',
    radioAdvert: 'Advert interval',
    radioAdvertValue: '50 hours minimum (flood adverts)',
    radioFirmware: 'Firmware',
    radioFirmwareValue: '1.15 or newer',
    server: 'Server',
    protocol: 'Protocol',
    tls: 'TLS',
    audience: 'Audience',
    auth: 'Auth',
    topicFormat: 'Topic format',
    collector: 'Collector',
    copied: 'Copied!',
    copy: 'Copy',
    useAsBroker: 'Use as custom broker',
    footer: 'Community tools for MeshCore NL - 2026',
  },
}

export default function HomePage() {
  const { lang } = useLang()
  const c = copy[lang]

  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const navigate = useNavigate()

  const taskCards = [
    {
      to: '/channel-browser',
      icon: 'https://avatars.githubusercontent.com/u/279831159?s=400&u=f8b17fbf4860043026f3b7bb5233968cfd98aec9&v=4',
      title: c.toolBrowser,
      meta: c.toolBrowserMeta,
      desc: c.browserDesc,
      primary: true,
    },
    {
      to: '/mqtt-cli',
      iconText: '⚙',
      title: c.toolMqtt,
      meta: c.toolMqttMeta,
      desc: c.mqttDesc,
      primary: true,
    },
    {
      to: '/flasher',
      iconText: '↯',
      title: c.toolFlasher,
      meta: c.toolFlasherMeta,
      desc: c.flasherDesc,
      primary: true,
    },
    {
      to: '/mcmqtt-toml',
      iconText: '▣',
      title: c.toolToml,
      meta: c.toolTomlMeta,
      desc: c.tomlDesc,
    },
    {
      to: '/usb-config',
      iconText: '⌁',
      title: c.toolUsb,
      meta: c.toolUsbMeta,
      desc: c.usbDesc,
    },
    {
      to: '/keygen',
      iconText: '◇',
      title: c.toolKeygen,
      meta: c.toolKeygenMeta,
      desc: c.keygenDesc,
    },
    {
      to: '/connected-brokers',
      iconText: '◎',
      title: c.toolProjects,
      meta: c.toolProjectsMeta,
      desc: c.projectsDesc,
    },
  ]

  async function copyValue(value: string, key: string) {
    const ok = await copyText(value)
    if (ok) {
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 1500)
    }
  }

  return (
    <>
      <Navbar />
      <main className="page home-page">
        <section className="hero">
          <img
            className="hero-logo"
            src="https://avatars.githubusercontent.com/u/279831159?s=400&u=f8b17fbf4860043026f3b7bb5233968cfd98aec9&v=4"
            alt="DutchMeshCore logo"
          />
          <h1>DutchMeshCore <em>Toolbox</em></h1>
          <p>{c.hero}</p>
          <p className="hero-sub">{c.heroSub}</p>
        </section>

        <section className="start-panel">
          <div className="start-panel-copy">
            <span className="start-kicker">{c.startTitle}</span>
            <p>{c.startBody}</p>
          </div>
          <div className="start-actions">
            <Link className="btn btn-accent" to="/channel-browser">{c.primaryChannels}</Link>
            <Link className="btn" to="/mqtt-cli">{c.primaryMqtt}</Link>
            <Link className="btn" to="/flasher">{c.primaryFlash}</Link>
          </div>
        </section>

        <p className="section-label">{c.tools}</p>
        <div className="tools-grid">
          {taskCards.map((card) => (
            <Link
              key={card.to}
              className={`tool-card${card.primary ? ' tool-card-primary' : ''}`}
              to={card.to}
            >
              {card.icon ? (
                <img className="tool-icon" src={card.icon} alt="DutchMeshCore logo" />
              ) : (
                <span className="tool-icon tool-icon-text">{card.iconText}</span>
              )}
              <span className="tool-name">
                {card.title}
                <span className="tool-badge">{card.meta}</span>
              </span>
              <p className="tool-desc">{card.desc}</p>
              <span className="tool-arrow">→</span>
            </Link>
          ))}
        </div>

        <details className="info-panel" open>
          <summary>
            <span>{c.radioTitle}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box">
              <h4>{c.radioSub}</h4>
              <table className="mqtt-table radio-settings-table">
                <thead>
                  <tr>
                    <th>{c.radioParam}</th>
                    <th>{c.radioValue}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>{c.radioPreset}</td><td><code>{c.radioPresetValue}</code></td></tr>
                  <tr><td>{c.radioSf}</td><td><code>{c.radioSfValue}</code></td></tr>
                  <tr><td>{c.radioCr}</td><td><code>{c.radioCrValue}</code></td></tr>
                  <tr><td>{c.radioFrequency}</td><td><code>{c.radioFrequencyValue}</code></td></tr>
                  <tr><td>{c.radioBandwidth}</td><td><code>{c.radioBandwidthValue}</code></td></tr>
                  <tr><td>{c.radioAdvert}</td><td><code>{c.radioAdvertValue}</code></td></tr>
                  <tr><td>{c.radioFirmware}</td><td><code>{c.radioFirmwareValue}</code></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </details>

        <details className="info-panel" open>
          <summary>
            <span>{c.mqttTitle}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="mqtt-collectors-grid">

              <div className="info-box">
                <h4>{c.collector} 1</h4>
                <table className="mqtt-table">
                  <tbody>
                    <tr>
                      <td>URL</td>
                      <td>
                        <code>wss://collector1.dutchmeshcore.nl:443/mqtt</code>
                        <button
                          className={`btn btn-sm btn-copy${copiedKey === 'c1-url' ? ' copied' : ''}`}
                          onClick={() => copyValue('wss://collector1.dutchmeshcore.nl:443/mqtt', 'c1-url')}
                        >
                          {copiedKey === 'c1-url' ? c.copied : c.copy}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Port</td>
                      <td>
                        <code>443</code>
                        <button
                          className={`btn btn-sm btn-copy${copiedKey === 'c1-port' ? ' copied' : ''}`}
                          onClick={() => copyValue('443', 'c1-port')}
                        >
                          {copiedKey === 'c1-port' ? c.copied : c.copy}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>{c.audience}</td>
                      <td>
                        <code>collector1.dutchmeshcore.nl</code>
                        <button
                          className={`btn btn-sm btn-copy${copiedKey === 'c1-audience' ? ' copied' : ''}`}
                          onClick={() => copyValue('collector1.dutchmeshcore.nl', 'c1-audience')}
                        >
                          {copiedKey === 'c1-audience' ? c.copied : c.copy}
                        </button>
                      </td>
                    </tr>
                    <tr><td>{c.auth}</td><td><code>JWT (Ed25519)</code></td></tr>
                    <tr><td>{c.tls}</td><td><code>enabled</code></td></tr>
                  </tbody>
                </table>
                <button
                  className="btn btn-use-broker"
                  onClick={() => navigate('/mqtt-cli', {
                    state: {
                      prefill: {
                        server: 'wss://collector1.dutchmeshcore.nl:443/mqtt',
                        port: '443',
                        audience: 'collector1.dutchmeshcore.nl',
                        authMode: 'jwt' as const,
                      }
                    }
                  })}
                >
                  {c.useAsBroker}
                </button>
              </div>

              <div className="info-box">
                <h4>{c.collector} 2</h4>
                <table className="mqtt-table">
                  <tbody>
                    <tr>
                      <td>URL</td>
                      <td>
                        <code>wss://collector2.dutchmeshcore.nl:443/mqtt</code>
                        <button
                          className={`btn btn-sm btn-copy${copiedKey === 'c2-url' ? ' copied' : ''}`}
                          onClick={() => copyValue('wss://collector2.dutchmeshcore.nl:443/mqtt', 'c2-url')}
                        >
                          {copiedKey === 'c2-url' ? c.copied : c.copy}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Port</td>
                      <td>
                        <code>443</code>
                        <button
                          className={`btn btn-sm btn-copy${copiedKey === 'c2-port' ? ' copied' : ''}`}
                          onClick={() => copyValue('443', 'c2-port')}
                        >
                          {copiedKey === 'c2-port' ? c.copied : c.copy}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>{c.audience}</td>
                      <td>
                        <code>collector2.dutchmeshcore.nl</code>
                        <button
                          className={`btn btn-sm btn-copy${copiedKey === 'c2-audience' ? ' copied' : ''}`}
                          onClick={() => copyValue('collector2.dutchmeshcore.nl', 'c2-audience')}
                        >
                          {copiedKey === 'c2-audience' ? c.copied : c.copy}
                        </button>
                      </td>
                    </tr>
                    <tr><td>{c.auth}</td><td><code>JWT (Ed25519)</code></td></tr>
                    <tr><td>{c.tls}</td><td><code>enabled</code></td></tr>
                  </tbody>
                </table>
                <button
                  className="btn btn-use-broker"
                  onClick={() => navigate('/mqtt-cli', {
                    state: {
                      prefill: {
                        server: 'wss://collector2.dutchmeshcore.nl:443/mqtt',
                        port: '443',
                        audience: 'collector2.dutchmeshcore.nl',
                        authMode: 'jwt' as const,
                      }
                    }
                  })}
                >
                  {c.useAsBroker}
                </button>
              </div>

            </div>

            <div className="mqtt-topic-row">
              <span className="mqtt-topic-label">{c.topicFormat}</span>
              <code>{'meshcore/{iata}/{device}/{type}'}</code>
              <button
                className={`btn btn-sm btn-copy${copiedKey === 'topic' ? ' copied' : ''}`}
                onClick={() => copyValue('meshcore/{iata}/{device}/{type}', 'topic')}
              >
                {copiedKey === 'topic' ? c.copied : c.copy}
              </button>
            </div>
          </div>
        </details>

        <details className="info-panel" open>
          <summary>
            <span>{c.linksTitle}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box">
              <h4>{c.linksTitle}</h4>
              <p>{c.linksSub}</p>
              <div className="quick-links">
                <a className="quick-link" href="https://meshwiki.nl/wiki/The_switch/draft" target="_blank" rel="noopener noreferrer">SF8 → SF7 Switch</a>
                <a className="quick-link" href="https://meshwiki.nl/wiki/Lijst_van_regio%27s" target="_blank" rel="noopener noreferrer">Scope / Region Guide</a>
                <a className="quick-link" href="https://flasher.meshcore.io/" target="_blank" rel="noopener noreferrer">MeshCore Flasher</a>
                <a className="quick-link" href="https://github.com/Dutch-MeshCore/Dutch-Meshcore-Toolbox" target="_blank" rel="noopener noreferrer">Toolbox Repo</a>
                <a className="quick-link" href="https://github.com/Dutch-MeshCore/Dutch-MeshCore-MQTT" target="_blank" rel="noopener noreferrer">Firmware Repo</a>
              </div>
            </div>

            <div className="info-box">
              <h4>{c.communities}</h4>
              <p>{c.communitiesSub}</p>
              <div className="quick-links">
                <a className="quick-link" href="https://meshwiki.nl" target="_blank" rel="noopener noreferrer">MeshWiki</a>
                <a className="quick-link" href="https://www.localmesh.nl/" target="_blank" rel="noopener noreferrer">Localmesh</a>
                <a className="quick-link" href="https://discord.dutchmeshcore.nl" target="_blank" rel="noopener noreferrer">Discord</a>
              </div>
            </div>

            <div className="info-box">
              <h4>{c.analyzers}</h4>
              <p>{c.analyzersSub}</p>
              <div className="quick-links">
                <a className="quick-link" href="https://cornmeister.nl" target="_blank" rel="noopener noreferrer">Cornmeister.nl</a>
                <a className="quick-link" href="https://mc-radar.woodwar.com/" target="_blank" rel="noopener noreferrer">MC-Radar</a>
                <a className="quick-link" href="https://meshrank.net" target="_blank" rel="noopener noreferrer">MeshRank</a>
                <a className="quick-link" href="https://analyzer.letsmesh.net/" target="_blank" rel="noopener noreferrer">LetsMesh Analyzer</a>
              </div>
            </div>
          </div>
        </details>

        <footer className="site-footer">
          <a href="https://github.com/Dutch-MeshCore" target="_blank" rel="noopener noreferrer">Dutch-MeshCore</a>
          {' '}— {c.footer}
        </footer>
      </main>
    </>
  )
}
