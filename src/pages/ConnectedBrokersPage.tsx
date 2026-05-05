import React from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'

const copy = {
  nl: {
    title: 'Verbonden Projecten',
    subtitle: 'Projecten en analyzers die momenteel live data ontvangen van DutchMeshCore subscriber-data.',
    publicTitle: 'Projecten verbonden met de DutchMeshCore servers',
    privateTitle: 'Privéprojecten',
    privateNote: 'Er zijn ook enkele privéprojecten actief die nog niet openbaar gedeeld worden.',
    privateCard: 'Privéproject',
    privateCardDesc: 'Details worden nog niet gedeeld. Meer informatie volgt wanneer eventuele projecten publiek worden.',
    visitSite: 'Bezoek website',
    openWiki: 'Open wiki',
    openAnalyzer: 'Open analyzer',
    type_analyzer: 'Analyzer',
    type_map: 'Kaartvisualisatie',
    type_wiki: 'Wiki',
    cornmeisterDesc: 'Live MQTT-analyzer voor DutchMeshCore-observer data. Toont ruwe pakketuitvoer en netwerkactiviteit in realtime.',
    mcradarDesc: 'Kaartgebaseerde visualizer die MeshCore-nodes en pakketroutes weergeeft op basis van DutchMeshCore subscriber-data.',
    meshwikiDesc: 'De MeshWiki MQTT-broker ontvangt DutchMeshCore observer-data en stelt deze beschikbaar voor de MeshWiki.nl community.',
    dataNote: 'Al deze projecten ontvangen data via de DutchMeshCore MQTT subscriber. Wil je je eigen analyzer aansluiten? Bekijk de',
    dataNoteLinkText: 'Config Generatoren',
    dataNote2: 'voor de juiste brokerinstellingen.',
    dataNote2Link: 'gratis subscriber account vereist',
    footer: 'Community tools voor MeshCore NL - 2026',
  },
  en: {
    title: 'Connected Projects',
    subtitle: 'Projects and analyzers currently receiving live data from the DutchMeshCore subscriber feed.',
    publicTitle: 'Projects connected to the DutchMeshCore servers',
    privateTitle: 'Private projects',
    privateNote: 'A number of private projects are also active but have not been publicly shared yet.',
    privateCard: 'Private project',
    privateCardDesc: 'Details are not yet shared. More information will follow when eventual projects go public.',
    visitSite: 'Visit website',
    openWiki: 'Open wiki',
    openAnalyzer: 'Open analyzer',
    type_analyzer: 'Analyzer',
    type_map: 'Map visualizer',
    type_wiki: 'Wiki',
    cornmeisterDesc: 'Live MQTT analyzer for DutchMeshCore observer data. Displays raw packet output and network activity in real time.',
    mcradarDesc: 'Map-based visualizer displaying MeshCore nodes and packet routes based on DutchMeshCore subscriber data.',
    meshwikiDesc: 'The MeshWiki MQTT broker receives DutchMeshCore observer data and makes it available to the MeshWiki.nl community.',
    dataNote: 'All these projects receive data via the DutchMeshCore MQTT subscriber. Want to connect your own analyzer? Check the',
    dataNoteLinkText: 'Config Generators',
    dataNote2: 'for the correct broker settings.',
    dataNote2Link: 'free subscriber account required',
    footer: 'Community tools for MeshCore NL - 2026',
  },
}

type CopyKey = keyof typeof copy.en

interface BrokerLink {
  labelKey: CopyKey
  url: string
}

interface BrokerEntry {
  name: string
  url: string
  typeKey: 'type_analyzer' | 'type_map'
  extraTags?: CopyKey[]
  descKey: 'cornmeisterDesc' | 'mcradarDesc' | 'meshwikiDesc'
  icon: string
  iconImg?: string
  iconImgTransparent?: boolean
  iconNode?: React.ReactNode
  links?: BrokerLink[]
}

const PUBLIC_BROKERS: BrokerEntry[] = [
  {
    name: 'Cornmeister.nl',
    url: 'https://cornmeister.nl',
    typeKey: 'type_analyzer',
    extraTags: ['type_map'],
    descKey: 'cornmeisterDesc',
    icon: '📡',
    iconNode: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
        <defs>
          <linearGradient id="cornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Center circle */}
        <circle cx="50" cy="50" r="6" fill="url(#cornGrad)" />
        {/* Inner arcs */}
        <path d="M 57.5 37 A 15 15 0 0 1 57.5 63" fill="none" stroke="url(#cornGrad)" strokeWidth="5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="0s" repeatCount="indefinite" />
        </path>
        <path d="M 42.5 37 A 15 15 0 0 0 42.5 63" fill="none" stroke="url(#cornGrad)" strokeWidth="5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="0s" repeatCount="indefinite" />
        </path>
        {/* Middle arcs */}
        <path d="M 63.5 26.6 A 27 27 0 0 1 63.5 73.4" fill="none" stroke="url(#cornGrad)" strokeWidth="5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
        </path>
        <path d="M 36.5 26.6 A 27 27 0 0 0 36.5 73.4" fill="none" stroke="url(#cornGrad)" strokeWidth="5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
        </path>
        {/* Outer arcs */}
        <path d="M 69.5 16.2 A 39 39 0 0 1 69.5 83.8" fill="none" stroke="url(#cornGrad)" strokeWidth="5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="1s" repeatCount="indefinite" />
        </path>
        <path d="M 30.5 16.2 A 39 39 0 0 0 30.5 83.8" fill="none" stroke="url(#cornGrad)" strokeWidth="5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="1s" repeatCount="indefinite" />
        </path>
      </svg>
    ),
  },
  {
    name: 'MC-Radar by woodwar.com',
    url: 'https://mc-radar.woodwar.com/',
    typeKey: 'type_analyzer',
    extraTags: ['type_map'],
    descKey: 'mcradarDesc',
    icon: '🗺',
    iconNode: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
        <defs>
          <linearGradient id="mcradarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path d="M50 20 L80 70 L20 70 Z" fill="none" stroke="url(#mcradarGrad)" strokeWidth="6" strokeLinejoin="round" />
        <circle cx="50" cy="20" r="12" fill="url(#mcradarGrad)" />
        <circle cx="80" cy="70" r="12" fill="url(#mcradarGrad)" />
        <circle cx="20" cy="70" r="12" fill="url(#mcradarGrad)" />
        <circle cx="50" cy="20" r="18" fill="url(#mcradarGrad)" fillOpacity="0.2">
          <animate attributeName="r" values="12;22;12" dur="3s" repeatCount="indefinite" />
          <animate attributeName="fillOpacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
  },
  {
    name: 'MeshWiki.nl',
    url: 'https://meshwiki.nl',
    typeKey: 'type_analyzer',
    descKey: 'meshwikiDesc',
    icon: '📖',
    iconNode: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
        <defs>
          <linearGradient id="meshwikiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%">
              <animate attributeName="stop-color" values="#38bdf8;#7dd3fc;#38bdf8" dur="2.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%">
              <animate attributeName="stop-color" values="#1d4ed8;#3b82f6;#1d4ed8" dur="2.5s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        {/* Mesh lines */}
        <g stroke="url(#meshwikiGrad)" strokeWidth="3" strokeLinecap="round" fill="none">
          {/* Outer octagon ring */}
          <line x1="50" y1="7"  x2="80" y2="20" />
          <line x1="80" y1="20" x2="93" y2="50" />
          <line x1="93" y1="50" x2="80" y2="80" />
          <line x1="80" y1="80" x2="50" y2="93" />
          <line x1="50" y1="93" x2="20" y2="80" />
          <line x1="20" y1="80" x2="7"  y2="50" />
          <line x1="7"  y1="50" x2="20" y2="20" />
          <line x1="20" y1="20" x2="50" y2="7"  />
          {/* W shape — left-peak → left-valley → center-peak → right-valley → right-peak */}
          <line x1="28" y1="28" x2="36" y2="62" />
          <line x1="36" y1="62" x2="50" y2="38" />
          <line x1="50" y1="38" x2="64" y2="62" />
          <line x1="64" y1="62" x2="72" y2="28" />
          {/* W triangulation */}
          <line x1="28" y1="28" x2="50" y2="38" />
          <line x1="50" y1="38" x2="72" y2="28" />
          {/* Top spoke from apex to W center peak */}
          <line x1="50" y1="7"  x2="50" y2="38" />
          {/* Outer ring to W peaks */}
          <line x1="50" y1="7"  x2="28" y2="28" />
          <line x1="50" y1="7"  x2="72" y2="28" />
          <line x1="20" y1="20" x2="28" y2="28" />
          <line x1="80" y1="20" x2="72" y2="28" />
          {/* Outer ring to W valleys */}
          <line x1="7"  y1="50" x2="36" y2="62" />
          <line x1="93" y1="50" x2="64" y2="62" />
          {/* Bottom closing node connections */}
          <line x1="36" y1="62" x2="50" y2="74" />
          <line x1="64" y1="62" x2="50" y2="74" />
          <line x1="20" y1="80" x2="50" y2="74" />
          <line x1="80" y1="80" x2="50" y2="74" />
          <line x1="50" y1="93" x2="50" y2="74" />
          {/* Side fills */}
          <line x1="7"  y1="50" x2="28" y2="28" />
          <line x1="93" y1="50" x2="72" y2="28" />
          <line x1="20" y1="80" x2="36" y2="62" />
          <line x1="80" y1="80" x2="64" y2="62" />
        </g>
        {/* W center peak — pulse first */}
        <circle cx="50" cy="38" r="5" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="5;7;5" dur="2.5s" begin="0s" repeatCount="indefinite" />
        </circle>
        {/* W outer peaks — pulse second */}
        <circle cx="28" cy="28" r="4.5" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4.5;6.5;4.5" dur="2.5s" begin="0.25s" repeatCount="indefinite" />
        </circle>
        <circle cx="72" cy="28" r="4.5" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4.5;6.5;4.5" dur="2.5s" begin="0.25s" repeatCount="indefinite" />
        </circle>
        {/* W valleys — pulse third */}
        <circle cx="36" cy="62" r="4.5" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4.5;6.5;4.5" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="64" cy="62" r="4.5" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4.5;6.5;4.5" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        {/* Bottom closing node */}
        <circle cx="50" cy="74" r="4.5" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4.5;6.5;4.5" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        {/* Outer ring — pulse last */}
        <circle cx="50" cy="7"  r="4" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4;6;4" dur="2.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="20" r="4" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4;6;4" dur="2.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
        <circle cx="93" cy="50" r="4" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4;6;4" dur="2.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="80" r="4" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4;6;4" dur="2.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="93" r="4" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4;6;4" dur="2.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="80" r="4" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4;6;4" dur="2.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
        <circle cx="7"  cy="50" r="4" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4;6;4" dur="2.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="20" r="4" fill="url(#meshwikiGrad)">
          <animate attributeName="r" values="4;6;4" dur="2.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    extraTags: ['type_wiki'],
    links: [
      { labelKey: 'openWiki', url: 'https://meshwiki.nl' },
      { labelKey: 'openAnalyzer', url: 'https://analyser.meshwiki.nl' },
    ],
  },
]

const PRIVATE_COUNT = 1

export default function ConnectedBrokersPage() {
  const { lang } = useLang()
  const c = copy[lang]

  return (
    <>
      <Navbar />
      <main className="page home-page connected-brokers-page">
        <section className="hero">
          <img
            className="hero-logo"
            src="https://avatars.githubusercontent.com/u/279831159?s=400&u=f8b17fbf4860043026f3b7bb5233968cfd98aec9&v=4"
            alt="DutchMeshCore logo"
          />
          <h1>DutchMeshCore <em>{c.title}</em></h1>
          <p>{c.subtitle}</p>
        </section>

        <section className="brokers-section">
          <h2 className="brokers-section-title">{c.publicTitle}</h2>
          <div className="broker-cards">
            {PUBLIC_BROKERS.map(b => (
              <div key={b.url} className="broker-card">
                <div className="broker-card-icon">
                  {b.iconNode
                    ? b.iconNode
                    : b.iconImg
                      ? <img src={b.iconImg} alt={b.name} className={`broker-card-icon-img${b.iconImgTransparent ? ' broker-card-icon-img--transparent' : ''}`} />
                      : b.icon}
                </div>
                <div className="broker-card-body">
                  <div className="broker-card-header">
                    <span className="broker-card-name">{b.name}</span>
                    <span className="broker-type-badge">{c[b.typeKey]}</span>
                    {b.extraTags?.map(tag => (
                      <span key={tag} className="broker-type-badge">{c[tag]}</span>
                    ))}
                  </div>
                  <p className="broker-card-desc">{c[b.descKey]}</p>
                  <div className="broker-card-actions">
                    {b.links ? (
                      b.links.map(link => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="broker-visit-btn"
                        >
                          {c[link.labelKey]} ↗
                        </a>
                      ))
                    ) : (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="broker-visit-btn"
                      >
                        {c.openAnalyzer} ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="brokers-section">
          <h2 className="brokers-section-title">{c.privateTitle}</h2>
          <p className="brokers-private-note">{c.privateNote}</p>
          <div className="broker-cards">
            {Array.from({ length: PRIVATE_COUNT }).map((_, i) => (
              <div key={i} className="broker-card broker-card-private">
                <div className="broker-card-icon">🔒</div>
                <div className="broker-card-body">
                  <div className="broker-card-header">
                    <span className="broker-card-name">{c.privateCard}</span>
                    <span className="broker-type-badge broker-type-private">?</span>
                  </div>
                  <p className="broker-card-desc broker-card-desc-muted">{c.privateCardDesc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="brokers-data-note">
          {c.dataNote}{' '}
          <a href="#/mqtt-cli">{c.dataNoteLinkText}</a>
          {' '}{c.dataNote2}{' '}
          <a href="https://portal.dutchmeshcore.nl" target="_blank" rel="noopener noreferrer">
            {c.dataNote2Link}
          </a>
        </p>
        <footer className="site-footer">
          <a href="https://github.com/Dutch-MeshCore" target="_blank" rel="noopener noreferrer">Dutch-MeshCore</a>
          {' '}— {c.footer}
        </footer>
      </main>
    </>
  )
}
