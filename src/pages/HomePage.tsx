import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { copyText } from '../utils/clipboard'

const copy = {
  nl: {
    hero: 'Een verzameling tools voor het Nederlandse MeshCore-netwerk.',
    tools: 'Beschikbare tools',
    browserDesc: 'Bekijk, filter en exporteer ontdekte MeshCore-kanalen met community-metadata zoals regio, scope en activiteit.',
    mqttDesc: 'Stel MQTT-slots in en genereer kant-en-klare CLI-opdrachten voor DutchMeshCore-firmware.',
    tomlDesc: 'Genereer een MCtoMQTT-configuratiebestand voor de DutchMeshCore MQTT collectors.',
    firmwareDesc: 'Kies je apparaat en download direct succesvolle DutchMeshCore MQTT release-builds.',
    live: 'Live',
    linksTitle: 'Handige links',
    linksSub: 'Actuele referenties voor MeshCore NL, regio-indeling, firmware en community-tools.',
    communities: 'MeshCore Nederland Communities',
    communitiesSub: 'Handige MeshCore NL-communities om te volgen of aan deel te nemen.',
    analyzers: 'MeshCore Analyzers',
    analyzersSub: 'Dashboards voor live netwerkuitvoer en kanaalactiviteit op DutchMeshCore-data.',
    mqttTitle: 'DutchMeshCore MQTT verbindingsinformatie',
    mqttSub: 'Collectorservers voor observer-data en community-analyzers.',
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
    hero: 'A collection of tools for the Dutch MeshCore network.',
    tools: 'Available tools',
    browserDesc: 'Browse, filter, and export discovered MeshCore channels with community metadata such as region, scope, and activity.',
    mqttDesc: 'Configure MQTT slots and generate ready-to-paste CLI commands for DutchMeshCore firmware.',
    tomlDesc: 'Generate a MCtoMQTT configuration file for the DutchMeshCore MQTT collectors.',
    firmwareDesc: 'Choose your device and directly download successful DutchMeshCore MQTT release builds.',
    live: 'Live',
    linksTitle: 'Useful links',
    linksSub: 'Current references for MeshCore NL, region naming, firmware, and community tools.',
    communities: 'MeshCore Nederland Communities',
    communitiesSub: 'Useful MeshCore NL communities to follow or join.',
    analyzers: 'MeshCore Analyzers',
    analyzersSub: 'Dashboards for live network output and channel activity based on DutchMeshCore data.',
    mqttTitle: 'DutchMeshCore MQTT connection info',
    mqttSub: 'Collector servers for observer data and community analyzers.',
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
        </section>

        <p className="section-label">{c.tools}</p>
        <div className="tools-grid">
          <Link className="tool-card" to="/channel-browser">
            <img
              className="tool-icon"
              src="https://avatars.githubusercontent.com/u/279831159?s=400&u=f8b17fbf4860043026f3b7bb5233968cfd98aec9&v=4"
              alt="DutchMeshCore logo"
            />
            <span className="tool-name">
              Channel Browser
              <span className="tool-badge">{c.live}</span>
            </span>
            <p className="tool-desc">{c.browserDesc}</p>
            <span className="tool-arrow">→</span>
          </Link>

          <Link className="tool-card" to="/mqtt-cli">
            <span className="tool-icon tool-icon-text">⚙</span>
            <span className="tool-name">
              MQTT CLI Setup
              <span className="tool-badge">{c.live}</span>
            </span>
            <p className="tool-desc">{c.mqttDesc}</p>
            <span className="tool-arrow">→</span>
          </Link>

          <Link className="tool-card" to="/mcmqtt-toml">
            <span className="tool-icon tool-icon-text">📄</span>
            <span className="tool-name">
              MCtoMQTT
              <span className="tool-badge">{c.live}</span>
            </span>
            <p className="tool-desc">{c.tomlDesc}</p>
            <span className="tool-arrow">→</span>
          </Link>

          <Link className="tool-card" to="/firmware">
            <span className="tool-icon tool-icon-text">⬇</span>
            <span className="tool-name">
              Firmware
              <span className="tool-badge">{c.live}</span>
            </span>
            <p className="tool-desc">{c.firmwareDesc}</p>
            <span className="tool-arrow">→</span>
          </Link>
        </div>

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
