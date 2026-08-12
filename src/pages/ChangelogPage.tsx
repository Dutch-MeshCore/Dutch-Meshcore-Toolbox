import { useState, type ReactNode } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'

// Firmware docs live in the MeshCore repo. This points at the published observer
// branch; update the ref here if/when dmc-observer-dev-1-17 is renamed.
const FW_REPO = 'https://github.com/Dutch-MeshCore/MeshCore'
const FW_REF = 'dmc-observer-dev-1-17'
const DOCS = {
  brokerFilter: `${FW_REPO}/blob/${FW_REF}/docs/mqtt_broker_filter_reference.md`,
  neighbours: `${FW_REPO}/blob/${FW_REF}/docs/neighbour_discovery_reference.md`,
  packetFilter: `${FW_REPO}/blob/${FW_REF}/docs/packet_filter_reference.md`,
  cli: `${FW_REPO}/blob/${FW_REF}/docs/cli_commands.md`,
  mqttImpl: `${FW_REPO}/blob/${FW_REF}/MQTT_IMPLEMENTATION.md`,
  branch: `${FW_REPO}/tree/${FW_REF}`,
}

function Doc({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
}

interface Entry {
  version: string
  date: string
  title?: string
  items: ReactNode[]
}

type LangKey = 'en' | 'nl'

const content: Record<LangKey, { firmware: Entry[]; toolbox: Entry[] }> = {
  en: {
    firmware: [
      {
        version: 'v1.17.0',
        date: '2026-08-12',
        title: 'MQTT Observer',
        items: [
          <>Rebuilt cleanly on upstream MeshCore <strong>v1.17.0</strong> as a merge of the observer firmware and the DutchMeshCore fork (branding, boards, CI). <Doc href={DOCS.branch}>Branch: dmc-observer-dev-1-17</Doc>.</>,
          <>MQTT observer bridge: up to 6 broker slots, 35 built-in broker presets, and status / packets / raw / TX / RX publishing. <Doc href={DOCS.mqttImpl}>MQTT implementation guide</Doc>.</>,
          <><strong>Per-broker packet filter</strong>: a per-slot allowlist of MeshCore payload types (<code>set mqttN.filter all|none|list</code>), so each broker can receive a different packet mix. <Doc href={DOCS.brokerFilter}>Per-broker filter reference</Doc>.</>,
          <><strong>Neighbour discovery</strong>: publish the zero-hop neighbour table (SNR, last-heard age, region scopes) to the <code>neighbors</code> topic, one-shot (<code>discover.scopes</code>) or periodically (<code>mqtt.neighbors</code>). <Doc href={DOCS.neighbours}>Neighbour discovery reference</Doc>.</>,
          <><strong>Repeater packet filter</strong> (RF): drop flooded packets by hop count, per-type rate, channel, path-hash size, and malformed group messages. <Doc href={DOCS.packetFilter}>Packet filter reference</Doc>.</>,
          <>On-device <strong>WebConfig</strong> captive-portal, radio watchdog, SNMP agent, and fault alerts.</>,
          <>Pull-based <strong>OTA</strong> pointed at DutchMeshCore releases (<code>ota.dutchmeshcore.nl</code>); default broker slots <code>dutchmeshcore-1</code> / <code>dutchmeshcore-2</code> / <code>meshcore-analyzer-eu</code>, timezone Europe/Amsterdam.</>,
          <>Heltec Wireless Tracker v1.1 fixes (ST7735 HSPI guard, PA-power guard, active-high VEXT) and non-PSRAM board support (3 MQTT slots, tight-heap tuning).</>,
          <>Merged the latest upstream board and radio fixes: Heltec T096 pins, T-Echo Card TCXO, ProMicro pinmap, T-Beam Supreme S3 display recovery, Station G3 external FEM prefs, LR2021 preamble / IRQ-timeout.</>,
          <>Full CLI reference for every command. <Doc href={DOCS.cli}>CLI commands</Doc>.</>,
        ],
      },
    ],
    toolbox: [
      {
        version: 'USB Setup: full firmware parity',
        date: '2026-08-12',
        items: [
          <>Added the <strong>per-broker packet filter</strong> per slot (All / None plus a checkbox per packet type), mirroring the firmware. <Doc href={DOCS.brokerFilter}>Filter reference</Doc>.</>,
          <>Refreshed the broker-preset dropdown to all <strong>35</strong> presets (adds <code>meshcore-analyzer-eu</code> and others).</>,
          <><strong>Neighbour publishing</strong> controls (enable plus interval) and the <strong>radio watchdog</strong> setting, shown only on firmware that supports them. <Doc href={DOCS.neighbours}>Neighbour discovery reference</Doc>.</>,
          <>Serial <strong>bridge</strong> (RS232 / ESP-NOW), external <strong>FEM gain</strong> (RX/TX), and LR2021 side-detector SFs, capability-gated to what the connected device reports.</>,
          <><strong>Import / Export</strong> now round-trips all of the above, so a backup restores the complete observer configuration.</>,
        ],
      },
      {
        version: 'Flasher: safer flashing',
        date: '2026-08-12',
        items: [
          <>A pre-flash <strong>backup reminder</strong> that urges exporting the device config first (with a shortcut to USB Setup), because flashing can wipe MQTT / observer settings, per-slot filters, WiFi and alerts.</>,
          <>A <strong>first-time-observer warning</strong>: installing observer firmware as an app-only image is flagged, steering to the merged "Full flash" image so the partition table is written. Works for uploaded observer <code>.bin</code> files too.</>,
          <>Wording is firmware-neutral, so agessaman observer-firmware users are covered as well.</>,
        ],
      },
    ],
  },
  nl: {
    firmware: [
      {
        version: 'v1.17.0',
        date: '2026-08-12',
        title: 'MQTT Observer',
        items: [
          <>Opnieuw opgebouwd op upstream MeshCore <strong>v1.17.0</strong> als samenvoeging van de observer-firmware en de DutchMeshCore-fork (branding, boards, CI). <Doc href={DOCS.branch}>Branch: dmc-observer-dev-1-17</Doc>.</>,
          <>MQTT observer-bridge: tot 6 broker-slots, 35 ingebouwde broker-presets en publiceren van status / packets / raw / TX / RX. <Doc href={DOCS.mqttImpl}>MQTT-implementatiegids</Doc>.</>,
          <><strong>Packetfilter per broker</strong>: een allowlist per slot van MeshCore-payloadtypes (<code>set mqttN.filter all|none|list</code>), zodat elke broker een andere packetmix kan ontvangen. <Doc href={DOCS.brokerFilter}>Referentie packetfilter per broker</Doc>.</>,
          <><strong>Buurontdekking</strong>: publiceer de zero-hop buurtabel (SNR, laatst gehoord, regio-scopes) naar het <code>neighbors</code>-topic, eenmalig (<code>discover.scopes</code>) of periodiek (<code>mqtt.neighbors</code>). <Doc href={DOCS.neighbours}>Referentie buurontdekking</Doc>.</>,
          <><strong>Repeater-packetfilter</strong> (RF): blokkeer geflooded packets op hop-aantal, snelheid per type, kanaal, path-hash-grootte en misvormde groepsberichten. <Doc href={DOCS.packetFilter}>Referentie packetfilter</Doc>.</>,
          <><strong>WebConfig</strong> captive-portal op het apparaat, radio-watchdog, SNMP-agent en storingsmeldingen.</>,
          <>Pull-gebaseerde <strong>OTA</strong> gericht op DutchMeshCore-releases (<code>ota.dutchmeshcore.nl</code>); standaard broker-slots <code>dutchmeshcore-1</code> / <code>dutchmeshcore-2</code> / <code>meshcore-analyzer-eu</code>, tijdzone Europe/Amsterdam.</>,
          <>Heltec Wireless Tracker v1.1-fixes (ST7735 HSPI-guard, PA-power-guard, active-high VEXT) en ondersteuning voor niet-PSRAM-boards (3 MQTT-slots, krappe-heap-afstemming).</>,
          <>De nieuwste upstream board- en radio-fixes samengevoegd: Heltec T096-pinnen, T-Echo Card TCXO, ProMicro-pinmap, T-Beam Supreme S3 display-herstel, Station G3 externe FEM-prefs, LR2021 preamble / IRQ-timeout.</>,
          <>Volledige CLI-referentie voor elk commando. <Doc href={DOCS.cli}>CLI-commando's</Doc>.</>,
        ],
      },
    ],
    toolbox: [
      {
        version: 'USB-instellingen: volledige firmware-pariteit',
        date: '2026-08-12',
        items: [
          <>Het <strong>packetfilter per broker</strong> toegevoegd per slot (Alles / Geen plus een selectievakje per packettype), gelijk aan de firmware. <Doc href={DOCS.brokerFilter}>Referentie filter</Doc>.</>,
          <>Broker-preset-dropdown bijgewerkt naar alle <strong>35</strong> presets (voegt <code>meshcore-analyzer-eu</code> en andere toe).</>,
          <>Bediening voor <strong>buur-publicatie</strong> (aan plus interval) en de <strong>radio-watchdog</strong>-instelling, alleen getoond op firmware die ze ondersteunt. <Doc href={DOCS.neighbours}>Referentie buurontdekking</Doc>.</>,
          <>Seriële <strong>bridge</strong> (RS232 / ESP-NOW), externe <strong>FEM-versterking</strong> (RX/TX) en LR2021 side-detector-SF's, afhankelijk van wat het aangesloten apparaat meldt.</>,
          <><strong>Import / Export</strong> verwerkt nu al het bovenstaande, zodat een back-up de volledige observer-configuratie herstelt.</>,
        ],
      },
      {
        version: 'Flasher: veiliger flashen',
        date: '2026-08-12',
        items: [
          <>Een <strong>back-upherinnering</strong> vóór het flashen die aanraadt eerst de apparaatconfiguratie te exporteren (met een snelkoppeling naar USB-instellingen), omdat flashen MQTT-/observer-instellingen, filters per slot, wifi en meldingen kan wissen.</>,
          <>Een <strong>waarschuwing bij een eerste observer-installatie</strong>: observer-firmware als alleen-app-image installeren wordt gemarkeerd, met verwijzing naar de merged "Full flash"-image zodat de partitietabel wordt geschreven. Werkt ook voor geüploade observer-<code>.bin</code>-bestanden.</>,
          <>De tekst is firmware-neutraal, dus ook agessaman-observer-firmwaregebruikers zijn gedekt.</>,
        ],
      },
    ],
  },
}

function ChangeList({ entries }: { entries: Entry[] }) {
  return (
    <>
      {entries.map(e => (
        <div className="panel" key={e.version}>
          <div className="panel-legend">
            {e.version}
            {e.title ? ` · ${e.title}` : ''}
            <span className="changelog-date"> · {e.date}</span>
          </div>
          <ul className="changelog-list">
            {e.items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </div>
      ))}
    </>
  )
}

export default function ChangelogPage() {
  const { t, lang } = useLang()
  const [tab, setTab] = useState<'firmware' | 'toolbox'>('firmware')
  const c = content[lang as LangKey] ?? content.en

  return (
    <>
      <Navbar />
      <main className="page changelog-page">
        <div className="device-page-header">
          <h1>📜 {t('changelog_title')}</h1>
        </div>

        <div className="changelog-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'firmware'}
            className={`btn${tab === 'firmware' ? ' btn-accent' : ''}`}
            onClick={() => setTab('firmware')}
          >
            {t('changelog_tab_firmware')}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'toolbox'}
            className={`btn${tab === 'toolbox' ? ' btn-accent' : ''}`}
            onClick={() => setTab('toolbox')}
          >
            {t('changelog_tab_toolbox')}
          </button>
        </div>

        {tab === 'firmware' ? <ChangeList entries={c.firmware} /> : <ChangeList entries={c.toolbox} />}
      </main>
    </>
  )
}
