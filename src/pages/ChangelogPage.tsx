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

type LangKey = 'en' | 'nl' | 'de'

const content: Record<LangKey, { firmware: Entry[]; toolbox: Entry[] }> = {
  en: {
    firmware: [
      {
        version: 'v1.17.1 · PacketLog',
        date: '2026-08-19',
        title: 'Repeater PacketLog',
        items: [
          <>New <strong>DutchMeshCore Repeater PacketLog</strong> builds: the DMC repeater firmware with per-packet RX/TX logging (<code>MESH_PACKET_LOGGING</code>) written to the USB serial console, for all 88 repeater boards. Lets an external tool – such as an <strong>MC-to-MQTT</strong> bridge or logger – ingest live packet data over serial, without the on-device MQTT stack. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-packetlog-v1.17.1">Release: dmc-repeater-packetlog-v1.17.1</Doc>.</>,
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
        version: 'USB Setup: region & region gating',
        date: '2026-08-24',
        items: [
          <>New <strong>Region</strong> panel in USB Setup: edit the repeater's region tree (add / rename / remove regions, flood allow / deny, and pick the <strong>home</strong> and <strong>default</strong> scope), discover zero-hop <strong>neighbours</strong> (<code>discover.neighbors</code> / <code>discover.scopes</code>), and share or import the config as JSON aligned with config.meshcore.io. Region is a base repeater feature (v1.10+), shown for any region-capable device.</>,
          <>Separate <strong>Region Gating</strong> panel for <strong>duty-cycle region gating</strong> (<code>dc.gate</code> enable, threshold and hysteresis, plus a live status read), shown only on DMC MQTT observer firmware that answers <code>get dc.gate</code>.</>,
          <>Saving applies the tree to the device with discrete <code>region put</code> / <code>remove</code> / <code>allowf</code> / <code>denyf</code> commands, and <strong>Import / Export</strong> round-trips the whole region config.</>,
          <>Documented the new region and <code>dc.gate</code> CLI commands (and corrected <code>af</code> to "airtime factor") in the CLI reference, in NL / EN / DE.</>,
        ],
      },
      {
        version: 'UI refresh: navbar, German & fonts',
        date: '2026-08-19',
        items: [
          <>Rebuilt the <strong>navbar</strong> into five grouped menus (Tools / Configure / Info) with single <strong>theme</strong> and <strong>language</strong> pickers, so it no longer wraps on longer labels; the active menu is now highlighted.</>,
          <>Added a full <strong>German (Deutsch)</strong> translation across the app, switchable via the new three-language picker (NL / EN / DE).</>,
          <>New typography: <strong>Aldrich</strong> headings, <strong>IBM Plex Sans</strong> body and <strong>IBM Plex Mono</strong> code.</>,
          <><strong>Getting Started</strong> now covers the <strong>DMC Room Server MQTT</strong> build and the WiFi OTA flow (<code>ota check</code> / <code>ota update</code>), which the CLI Wiki lists for both repeater and room-server builds.</>,
          <>New quick links: <strong>Node Settings</strong> (settings.dutchmeshcore.nl) on the home page and <strong>Triangulator</strong> in the Tools menu. MCtoMQTT now notes it needs the PacketLog firmware.</>,
          <>Accuracy fixes: corrected the PacketLog board count, fixed the USB Setup OTA / factory-reset commands (<code>start ota</code> / <code>erase</code>), documented MQTT slots 3-6 in the CLI Wiki, and refreshed stale firmware links.</>,
        ],
      },
      {
        version: 'Flasher: PacketLog firmware group',
        date: '2026-08-19',
        items: [
          <>Added the <strong>DutchMeshCore-PacketLog-Firmware</strong> group – the DMC repeater builds with serial packet logging (88 boards, v1.17.1) – alongside the existing repeater and MQTT groups.</>,
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
          <>Nieuwe <strong>DutchMeshCore Repeater PacketLog</strong>-builds: de DMC-repeater-firmware met per-pakket RX/TX-logging (<code>MESH_PACKET_LOGGING</code>) naar de USB-seriële console, voor alle 88 repeater-boards. Laat een externe tool – zoals een <strong>MC-naar-MQTT</strong>-bridge of logger – live pakketdata via serieel inlezen, zonder de MQTT-stack op het apparaat. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-packetlog-v1.17.1">Release: dmc-repeater-packetlog-v1.17.1</Doc>.</>,
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
        version: 'USB-instellingen: regio & regiogating',
        date: '2026-08-24',
        items: [
          <>Nieuw <strong>Regio</strong>-paneel in USB-instellingen: bewerk de regioboom van de repeater (regio's toevoegen / hernoemen / verwijderen, flood toestaan / weigeren, en de <strong>thuis</strong>- en <strong>standaard</strong>-scope kiezen), ontdek zero-hop <strong>buren</strong> (<code>discover.neighbors</code> / <code>discover.scopes</code>), en deel of importeer de config als JSON, afgestemd op config.meshcore.io. Regio is een basis-repeaterfunctie (v1.10+), getoond voor elk regio-capabel apparaat.</>,
          <>Apart <strong>Regiogating</strong>-paneel voor <strong>duty-cycle-regiogating</strong> (<code>dc.gate</code> aan/uit, drempel en hysterese, plus live status uitlezen), alleen getoond op DMC MQTT observer-firmware die <code>get dc.gate</code> ondersteunt.</>,
          <>Opslaan past de boom toe op het apparaat met losse commando's <code>region put</code> / <code>remove</code> / <code>allowf</code> / <code>denyf</code>, en <strong>Import / Export</strong> verwerkt de volledige regioconfiguratie.</>,
          <>De nieuwe regio- en <code>dc.gate</code>-CLI-commando's gedocumenteerd (en <code>af</code> gecorrigeerd naar "airtime factor") in de CLI-referentie, in NL / EN / DE.</>,
        ],
      },
      {
        version: 'UI-vernieuwing: navbar, Duits & lettertypen',
        date: '2026-08-19',
        items: [
          <>De <strong>navbar</strong> herbouwd tot vijf gegroepeerde menu's (Tools / Configureren / Info) met losse kiezers voor <strong>thema</strong> en <strong>taal</strong>, zodat hij niet meer omslaat bij langere labels; het actieve menu wordt nu gemarkeerd.</>,
          <>Een volledige <strong>Duitse (Deutsch)</strong> vertaling toegevoegd, te kiezen via de nieuwe drietalige kiezer (NL / EN / DE).</>,
          <>Nieuwe typografie: <strong>Aldrich</strong>-koppen, <strong>IBM Plex Sans</strong>-tekst en <strong>IBM Plex Mono</strong>-code.</>,
          <><strong>Aan de slag</strong> behandelt nu de <strong>DMC Room Server MQTT</strong>-build en de wifi-OTA (<code>ota check</code> / <code>ota update</code>), die de CLI-wiki toont voor zowel repeater- als room-server-builds.</>,
          <>Nieuwe snelkoppelingen: <strong>Node-instellingen</strong> (settings.dutchmeshcore.nl) op de startpagina en <strong>Triangulator</strong> in het Tools-menu. MCtoMQTT vermeldt nu dat de PacketLog-firmware nodig is.</>,
          <>Correcties: het PacketLog-boardaantal gecorrigeerd, de OTA-/fabrieksreset-commando's in USB-instellingen hersteld (<code>start ota</code> / <code>erase</code>), MQTT-slots 3-6 gedocumenteerd in de CLI-wiki en verouderde firmware-links vernieuwd.</>,
        ],
      },
      {
        version: 'Flasher: PacketLog-firmwaregroep',
        date: '2026-08-19',
        items: [
          <>De <strong>DutchMeshCore-PacketLog-Firmware</strong>-groep toegevoegd – de DMC-repeater-builds met seriële packetlogging (88 boards, v1.17.1) – naast de bestaande repeater- en MQTT-groepen.</>,
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
  de: {
    firmware: [
      {
        version: 'v1.17.1 · PacketLog',
        date: '2026-08-19',
        title: 'Repeater PacketLog',
        items: [
          <>Neue <strong>DutchMeshCore Repeater PacketLog</strong>-Builds: die DMC-Repeater-Firmware mit Logging pro Paket für RX/TX (<code>MESH_PACKET_LOGGING</code>) auf die serielle USB-Konsole, für alle 88 Repeater-Boards. Ermöglicht einem externen Tool – etwa einer <strong>MC-zu-MQTT</strong>-bridge oder einem Logger – das Einlesen von Live-Paketdaten über die serielle Schnittstelle, ohne den MQTT-Stack auf dem Gerät. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-packetlog-v1.17.1">Release: dmc-repeater-packetlog-v1.17.1</Doc>.</>,
          <>Gebaut auf der Nicht-MQTT-Basis <code>dmc-dev</code>, daher ist der <strong>Paketfilter</strong> zur Laufzeit (<code>filter</code>-CLI) enthalten. Companion- und room-server-Builds sind unverändert. Flashe sie über die neue Gruppe <strong>DutchMeshCore-PacketLog-Firmware</strong> im Flasher.</>,
        ],
      },
      {
        version: 'v1.17.1',
        date: '2026-08-14',
        title: 'MQTT Observer',
        items: [
          <>Upstream-MeshCore <strong>v1.17.1</strong> in den observer-Branch zusammengeführt, sodass Knoten nun <code>v1.17.1</code> als Version melden (zuvor konnte man nur am Commit-Hash erkennen, dass ein Build der neueste war). <Doc href={DOCS.branch}>Branch: dmc-observer-dev-1-17</Doc>.</>,
          <><strong>Fix für Scoped-Reply-Routing</strong>: Antworten werden nicht mehr verworfen, wenn <code>flood.max.unscoped</code> niedrig ist.</>,
          <>Neuer Befehl <code>radio.fem.txgain on|off</code> und ein Fix, damit <code>radio.fem.rxgain</code> erhalten bleibt, für Boards mit einer steuerbaren FEM-PA (Station G3). Das Toolbox-USB-Setup verwaltet bereits beides.</>,
          <>Weitere Upstream-Fixes zusammengeführt: nRF52-Radio-Entropie kombiniert mit dem CC310-Hardware-RNG, dazu Pin-Fixes für Heltec T1, Heltec MeshPocket und LilyGo T-Echo Lite.</>,
        ],
      },
      {
        version: 'v1.17.0',
        date: '2026-08-12',
        title: 'MQTT Observer',
        items: [
          <>Sauber auf Upstream-MeshCore <strong>v1.17.0</strong> neu aufgebaut als Zusammenführung der observer-Firmware und des DutchMeshCore-Forks (Branding, Boards, CI). <Doc href={DOCS.branch}>Branch: dmc-observer-dev-1-17</Doc>.</>,
          <>MQTT-observer-bridge: bis zu 6 Broker-Slots, 35 integrierte Broker-Presets und Veröffentlichung von status / packets / raw / TX / RX. <Doc href={DOCS.mqttImpl}>MQTT-Implementierungsleitfaden</Doc>.</>,
          <><strong>Paketfilter pro Broker</strong>: eine Allowlist pro Slot für MeshCore-Payload-Typen (<code>set mqttN.filter all|none|list</code>), sodass jeder Broker eine andere Paketmischung empfangen kann. <Doc href={DOCS.brokerFilter}>Referenz Filter pro Broker</Doc>.</>,
          <><strong>Nachbar-Erkennung</strong>: Veröffentliche die Zero-Hop-Nachbartabelle (SNR, Alter des letzten Empfangs, Region-Scopes) im <code>neighbors</code>-Topic, einmalig (<code>discover.scopes</code>) oder periodisch (<code>mqtt.neighbors</code>). <Doc href={DOCS.neighbours}>Referenz Nachbar-Erkennung</Doc>.</>,
          <><strong>Repeater-Paketfilter</strong> (RF): Verwerfe geflutete Pakete nach Hop-Anzahl, Rate pro Typ, Kanal, Path-Hash-Größe und fehlerhafte Gruppennachrichten. <Doc href={DOCS.packetFilter}>Referenz Paketfilter</Doc>.</>,
          <><strong>WebConfig</strong>-Captive-Portal auf dem Gerät, Radio-Watchdog, SNMP-Agent und Störungsmeldungen.</>,
          <>Pull-basiertes <strong>OTA</strong> auf DutchMeshCore-Releases ausgerichtet (<code>ota.dutchmeshcore.nl</code>); Standard-Broker-Slots <code>dutchmeshcore-1</code> / <code>dutchmeshcore-2</code> / <code>meshcore-analyzer-eu</code>, Zeitzone Europe/Amsterdam.</>,
          <>Heltec Wireless Tracker v1.1-Fixes (ST7735-HSPI-Guard, PA-Power-Guard, active-high VEXT) und Unterstützung für Boards ohne PSRAM (3 MQTT-Slots, Abstimmung für knappen Heap).</>,
          <>Die neuesten Upstream-Board- und Radio-Fixes zusammengeführt: Heltec T096-Pins, T-Echo Card TCXO, ProMicro-Pinmap, T-Beam Supreme S3 Display-Wiederherstellung, Station G3 externe FEM-Prefs, LR2021 Preamble / IRQ-Timeout.</>,
          <>Vollständige CLI-Referenz für jeden Befehl. <Doc href={DOCS.cli}>CLI-Befehle</Doc>.</>,
        ],
      },
    ],
    toolbox: [
      {
        version: 'USB-Setup: Regionen & Regionen-Gating',
        date: '2026-08-24',
        items: [
          <>Neues <strong>Regionen</strong>-Panel im USB-Setup: den Regionenbaum des Repeaters bearbeiten (Regionen hinzufügen / umbenennen / entfernen, Flooding erlauben / verweigern und den <strong>Heimat</strong>- und <strong>Standard</strong>-Scope wählen), Zero-Hop-<strong>Nachbarn</strong> ermitteln (<code>discover.neighbors</code> / <code>discover.scopes</code>) und die Konfiguration als JSON teilen oder importieren, abgestimmt auf config.meshcore.io. Regionen sind eine Basis-Repeater-Funktion (v1.10+), angezeigt für jedes regionsfähige Gerät.</>,
          <>Separates <strong>Regionen-Gating</strong>-Panel für <strong>Duty-Cycle-Regionen-Gating</strong> (<code>dc.gate</code> ein/aus, Schwelle und Hysterese, plus Live-Status-Abfrage), nur auf DMC-MQTT-observer-Firmware angezeigt, die <code>get dc.gate</code> unterstützt.</>,
          <>Beim Speichern wird der Baum mit einzelnen Befehlen <code>region put</code> / <code>remove</code> / <code>allowf</code> / <code>denyf</code> auf das Gerät angewendet, und <strong>Import / Export</strong> überträgt die gesamte Regionenkonfiguration.</>,
          <>Die neuen Regionen- und <code>dc.gate</code>-CLI-Befehle dokumentiert (und <code>af</code> zu "airtime factor" korrigiert) in der CLI-Referenz, in NL / EN / DE.</>,
        ],
      },
      {
        version: 'UI-Auffrischung: Navbar, Deutsch & Schriften',
        date: '2026-08-19',
        items: [
          <>Die <strong>Navbar</strong> in fünf gruppierte Menüs (Tools / Konfigurieren / Info) mit einzelnen Auswahlen für <strong>Thema</strong> und <strong>Sprache</strong> neu aufgebaut, sodass sie bei längeren Labels nicht mehr umbricht; das aktive Menü wird nun hervorgehoben.</>,
          <>Eine vollständige <strong>deutsche (Deutsch)</strong> Übersetzung der App hinzugefügt, wählbar über die neue dreisprachige Auswahl (NL / EN / DE).</>,
          <>Neue Typografie: <strong>Aldrich</strong>-Überschriften, <strong>IBM Plex Sans</strong>-Text und <strong>IBM Plex Mono</strong>-Code.</>,
          <><strong>Erste Schritte</strong> behandelt nun den <strong>DMC Room Server MQTT</strong>-Build und den WiFi-OTA-Ablauf (<code>ota check</code> / <code>ota update</code>), den das CLI Wiki für Repeater- und Room-Server-Builds anzeigt.</>,
          <>Neue Schnelllinks: <strong>Node-Einstellungen</strong> (settings.dutchmeshcore.nl) auf der Startseite und <strong>Triangulator</strong> im Tools-Menü. MCtoMQTT weist nun darauf hin, dass die PacketLog-Firmware benötigt wird.</>,
          <>Korrekturen: die PacketLog-Board-Anzahl korrigiert, die OTA-/Werksreset-Befehle im USB-Setup behoben (<code>start ota</code> / <code>erase</code>), MQTT-Slots 3-6 im CLI Wiki dokumentiert und veraltete Firmware-Links aktualisiert.</>,
        ],
      },
      {
        version: 'Flasher: PacketLog firmware group',
        date: '2026-08-19',
        items: [
          <>Die Gruppe <strong>DutchMeshCore-PacketLog-Firmware</strong> hinzugefügt – die DMC-Repeater-Builds mit seriellem Paket-Logging (88 Boards, v1.17.1) – neben den bestehenden repeater- und MQTT-Gruppen.</>,
          <>Alle Firmware-Maker-Gruppen <strong>starten jetzt eingeklappt</strong> für eine übersichtlichere Liste; klappe die gewünschte auf.</>,
        ],
      },
      {
        version: 'USB Setup: full firmware parity',
        date: '2026-08-12',
        items: [
          <>Den <strong>Paketfilter pro Broker</strong> pro Slot hinzugefügt (Alle / Keine plus ein Kontrollkästchen pro Pakettyp), passend zur Firmware. <Doc href={DOCS.brokerFilter}>Filter-Referenz</Doc>.</>,
          <>Das Broker-Preset-Dropdown auf alle <strong>35</strong> Presets aktualisiert (fügt <code>meshcore-analyzer-eu</code> und andere hinzu).</>,
          <>Bedienelemente für <strong>Nachbar-Veröffentlichung</strong> (aktivieren plus Intervall) und die <strong>Radio-Watchdog</strong>-Einstellung, nur auf Firmware angezeigt, die sie unterstützt. <Doc href={DOCS.neighbours}>Referenz Nachbar-Erkennung</Doc>.</>,
          <>Serielle <strong>bridge</strong> (RS232 / ESP-NOW), externe <strong>FEM-Verstärkung</strong> (RX/TX) und LR2021-Side-Detector-SFs, begrenzt auf das, was das angeschlossene Gerät meldet.</>,
          <><strong>Import / Export</strong> überträgt nun all das oben Genannte vollständig, sodass ein Backup die komplette observer-Konfiguration wiederherstellt.</>,
        ],
      },
      {
        version: 'Flasher: safer flashing',
        date: '2026-08-12',
        items: [
          <>Eine <strong>Backup-Erinnerung</strong> vor dem Flashen, die dazu anhält, zuerst die Gerätekonfiguration zu exportieren (mit einer Verknüpfung zum USB-Setup), da das Flashen MQTT-/observer-Einstellungen, Filter pro Slot, WiFi und Meldungen löschen kann.</>,
          <>Eine <strong>Warnung bei der ersten observer-Installation</strong>: observer-Firmware als reines App-Image zu installieren wird markiert, mit Hinweis auf das zusammengeführte "Full flash"-Image, damit die Partitionstabelle geschrieben wird. Funktioniert auch für hochgeladene observer-<code>.bin</code>-Dateien.</>,
          <>Die Formulierung ist firmware-neutral, sodass auch Nutzer der agessaman-observer-Firmware abgedeckt sind.</>,
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
