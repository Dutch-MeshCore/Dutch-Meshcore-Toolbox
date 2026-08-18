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
        version: 'v1.17.1 · PacketLog',
        date: '2026-08-19',
        title: 'Repeater PacketLog',
        items: [
          <>New <strong>DutchMeshCore Repeater PacketLog</strong> builds: the DMC repeater firmware with per-packet RX/TX logging (<code>MESH_PACKET_LOGGING</code>) written to the USB serial console, for all 91 repeater boards. Lets an external tool – such as an <strong>MC-to-MQTT</strong> bridge or logger – ingest live packet data over serial, without the on-device MQTT stack. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-packetlog-v1.17.1">Release: dmc-repeater-packetlog-v1.17.1</Doc>.</>,
          <>Built from the non-MQTT <code>dmc-dev</code> base, so the runtime <strong>packet filter</strong> (<code>filter</code> CLI) is included. Companion and room-server builds are unchanged. Flash it from the new <strong>DutchMeshCore-PacketLog-Firmware</strong> group in the Flasher.</>,
        ],
      },
      {
        version: 'v1.17.1',
        date: '2026-08-14',
        title: 'MQTT Observer',
        items: [
          <>Merged upstream MeshCore <strong>v1.17.1</strong> into the observer branch, so nodes now report <code>v1.17.1</code> as their version (previously only the commit hash told you a build was the latest). <Doc href={DOCS.branch}>Branch: dmc-observer-dev-1-17</Doc>.</>,
          <><strong>Scoped-reply routing fix</strong>: replies are no longer dropped when <code>flood.max.unscoped</code> is low.</>,
          <>New <code>radio.fem.txgain on|off</code> command, and a fix so <code>radio.fem.rxgain</code> persists, for boards with a controllable FEM PA (Station G3). The toolbox USB Setup already manages both.</>,
          <>Other upstream fixes merged: nRF52 radio entropy combined with the CC310 hardware RNG, plus pin fixes for Heltec T1, Heltec MeshPocket, and LilyGo T-Echo Lite.</>,
        ],
      },
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
        version: 'Flasher: PacketLog firmware group',
        date: '2026-08-19',
        items: [
          <>Added the <strong>DutchMeshCore-PacketLog-Firmware</strong> group – the DMC repeater builds with serial packet logging (91 boards, v1.17.1) – alongside the existing repeater and MQTT groups.</>,
          <>All firmware maker groups now <strong>start collapsed</strong> for a cleaner list; expand the one you want.</>,
        ],
      },
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
        version: 'v1.17.1 · PacketLog',
        date: '2026-08-19',
        title: 'Repeater PacketLog',
        items: [
          <>Nieuwe <strong>DutchMeshCore Repeater PacketLog</strong>-builds: de DMC-repeater-firmware met per-pakket RX/TX-logging (<code>MESH_PACKET_LOGGING</code>) naar de USB-seriële console, voor alle 91 repeater-boards. Laat een externe tool – zoals een <strong>MC-naar-MQTT</strong>-bridge of logger – live pakketdata via serieel inlezen, zonder de MQTT-stack op het apparaat. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-packetlog-v1.17.1">Release: dmc-repeater-packetlog-v1.17.1</Doc>.</>,
          <>Gebouwd op de niet-MQTT <code>dmc-dev</code>-basis, dus het runtime <strong>packetfilter</strong> (<code>filter</code>-CLI) is inbegrepen. Companion- en room-server-builds zijn ongewijzigd. Flash het via de nieuwe <strong>DutchMeshCore-PacketLog-Firmware</strong>-groep in de Flasher.</>,
        ],
      },
      {
        version: 'v1.17.1',
        date: '2026-08-14',
        title: 'MQTT Observer',
        items: [
          <>Upstream MeshCore <strong>v1.17.1</strong> samengevoegd in de observer-branch, zodat nodes nu <code>v1.17.1</code> als versie melden (voorheen kon je alleen aan de commit-hash zien dat een build de nieuwste was). <Doc href={DOCS.branch}>Branch: dmc-observer-dev-1-17</Doc>.</>,
          <><strong>Fix voor scoped-reply-routing</strong>: antwoorden worden niet meer verworpen wanneer <code>flood.max.unscoped</code> laag is.</>,
          <>Nieuw commando <code>radio.fem.txgain on|off</code>, en een fix zodat <code>radio.fem.rxgain</code> bewaard blijft, voor boards met een regelbare FEM-PA (Station G3). De toolbox USB-instellingen beheren beide al.</>,
          <>Overige upstream-fixes samengevoegd: nRF52-radio-entropie gecombineerd met de CC310-hardware-RNG, plus pin-fixes voor Heltec T1, Heltec MeshPocket en LilyGo T-Echo Lite.</>,
        ],
      },
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
        version: 'Flasher: PacketLog-firmwaregroep',
        date: '2026-08-19',
        items: [
          <>De <strong>DutchMeshCore-PacketLog-Firmware</strong>-groep toegevoegd – de DMC-repeater-builds met seriële packetlogging (91 boards, v1.17.1) – naast de bestaande repeater- en MQTT-groepen.</>,
          <>Alle firmware-groepen <strong>starten nu ingeklapt</strong> voor een overzichtelijkere lijst; klap de gewenste groep uit.</>,
        ],
      },
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
