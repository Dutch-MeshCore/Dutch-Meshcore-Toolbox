import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'

const copy = {
  nl: {
    title: 'Verbonden Analyzers',
    subtitle: 'Projecten en analyzers die momenteel live data ontvangen van DutchMeshCore subscriber-data.',
    publicTitle: 'Publieke analyzers',
    privateTitle: 'Privéprojecten',
    privateNote: 'Er zijn ook enkele privéprojecten actief die nog niet openbaar gedeeld worden.',
    privateCard: 'Privéproject',
    privateCardDesc: 'Details worden nog niet gedeeld. Meer informatie volgt wanneer het project publiek wordt.',
    visitSite: 'Bezoek website',
    type_analyzer: 'Analyzer',
    type_map: 'Kaartvisualisatie',
    cornmeisterDesc: 'Live MQTT-analyzer voor DutchMeshCore-observer data. Toont ruwe pakketuitvoer en netwerkactiviteit in realtime.',
    mcradarDesc: 'Kaartgebaseerde visualizer die MeshCore-nodes en pakketroutes weergeeft op basis van DutchMeshCore subscriber-data.',
    meshwikiDesc: 'De MeshWiki MQTT-broker ontvangt DutchMeshCore observer-data en stelt deze beschikbaar voor de MeshWiki.nl community.',
    dataNote: 'Al deze projecten ontvangen data via de DutchMeshCore MQTT subscriber. Wil je je eigen analyzer aansluiten? Bekijk de',
    dataNoteLinkText: 'Config Generatoren',
    dataNote2: 'voor de juiste brokerinstellingen.',
  },
  en: {
    title: 'Connected Analyzers',
    subtitle: 'Projects and analyzers currently receiving live data from the DutchMeshCore subscriber feed.',
    publicTitle: 'Public analyzers',
    privateTitle: 'Private projects',
    privateNote: 'A number of private projects are also active but have not been publicly shared yet.',
    privateCard: 'Private project',
    privateCardDesc: 'Details are not yet shared. More information will follow when the project goes public.',
    visitSite: 'Visit website',
    type_analyzer: 'Analyzer',
    type_map: 'Map visualizer',
    cornmeisterDesc: 'Live MQTT analyzer for DutchMeshCore observer data. Displays raw packet output and network activity in real time.',
    mcradarDesc: 'Map-based visualizer displaying MeshCore nodes and packet routes based on DutchMeshCore subscriber data.',
    meshwikiDesc: 'The MeshWiki MQTT broker receives DutchMeshCore observer data and makes it available to the MeshWiki.nl community.',
    dataNote: 'All these projects receive data via the DutchMeshCore MQTT subscriber. Want to connect your own analyzer? Check the',
    dataNoteLinkText: 'Config Generators',
    dataNote2: 'for the correct broker settings.',
  },
}

interface BrokerEntry {
  name: string
  url: string
  typeKey: 'type_analyzer' | 'type_map'
  descKey: 'cornmeisterDesc' | 'mcradarDesc' | 'meshwikiDesc'
  icon: string
}

const PUBLIC_BROKERS: BrokerEntry[] = [
  {
    name: 'Cornmeister.nl',
    url: 'https://cornmeister.nl',
    typeKey: 'type_analyzer',
    descKey: 'cornmeisterDesc',
    icon: '📡',
  },
  {
    name: 'MC-Radar by woodwar.com',
    url: 'https://mc-radar.woodwar.com/',
    typeKey: 'type_map',
    descKey: 'mcradarDesc',
    icon: '🗺',
  },
  {
    name: 'MeshWiki.nl',
    url: 'https://meshwiki.nl',
    typeKey: 'type_analyzer',
    descKey: 'meshwikiDesc',
    icon: '📖',
  },
]

const PRIVATE_COUNT = 1

export default function ConnectedBrokersPage() {
  const { lang } = useLang()
  const c = copy[lang]

  return (
    <>
      <Navbar />
      <main className="page connected-brokers-page">
        <div className="page-header">
          <h1>{c.title}</h1>
          <p className="page-sub">{c.subtitle}</p>
        </div>

        <section className="brokers-section">
          <h2 className="brokers-section-title">{c.publicTitle}</h2>
          <div className="broker-cards">
            {PUBLIC_BROKERS.map(b => (
              <div key={b.url} className="broker-card">
                <div className="broker-card-icon">{b.icon}</div>
                <div className="broker-card-body">
                  <div className="broker-card-header">
                    <span className="broker-card-name">{b.name}</span>
                    <span className="broker-type-badge">{c[b.typeKey]}</span>
                  </div>
                  <p className="broker-card-desc">{c[b.descKey]}</p>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="broker-visit-btn"
                  >
                    {c.visitSite} ↗
                  </a>
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
          {' '}{c.dataNote2}
        </p>
      </main>
    </>
  )
}
