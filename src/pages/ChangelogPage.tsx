import { useState, type ReactNode } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'

// Firmware docs live in the MeshCore repo. This points at the published observer
// branch; update the ref here if/when dmc-observer-dev is renamed.
const FW_REPO = 'https://github.com/Dutch-MeshCore/MeshCore'
const FW_REF = 'dmc-observer-dev'
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
        version: 'v1.18.0 · dev',
        date: '2026-10-15',
        title: 'All DMC branches',
        items: [
          <>Merged upstream MeshCore <strong>v1.18.0</strong> into <code>dmc-dev</code>, <code>dmc-observer-dev</code> and <code>dmc-dev-packetlog</code>. The rolling dev builds have been rebuilt on it and show as <strong>1.18.0-dev</strong> in the Flasher. <Doc href="https://blog.meshcore.io/2026/10/15/release-1-18-0">Upstream release notes</Doc>.</>,
          <>New upstream commands <code>power</code> (battery and power-source state) and <code>gps diag</code>.</>,
          <><strong>RAK3112</strong> fixes: octal PSRAM enabled, battery voltage reading corrected, Heltec V3 pin leftovers removed.</>,
          <>Observer: caught up with agessaman observer-firmware. <strong>ThinkNode M7</strong> now prefers its onboard Ethernet with WiFi fallback (<code>get link.status</code> / <code>link.diag</code> / <code>link.dns</code>), new <code>set mqtt.advert.verify on|off</code> to skip adverts with a bad signature, <code>stop ota</code> to end an idle manual-OTA session, stricter NTP reply validation, and three new broker presets (<code>ntxmesh</code>, <code>bsmesh</code>, <code>marwoj</code>).</>,
          <><code>ota branch</code> now reports the channels as <strong>prod</strong> / <strong>beta</strong>; <code>stable</code> and <code>dev</code> keep working as aliases. T-Beam 1W builds gain fan control (<code>get fan</code>, <code>set fan on|off|auto</code>, <code>fan.lo</code> / <code>fan.hi</code>).</>,
          <>PacketLog: serial packet logging enabled on the Waveshare S3 LR1121 repeater and room server.</>,
        ],
      },
      {
        version: 'v1.17.1-dev · Repeater & PacketLog',
        date: '2026-10-14',
        title: 'Repeater (dev channel)',
        items: [
          <>New rolling <strong>dev pre-releases</strong> for the plain DMC repeater and the PacketLog builds, next to the MQTT observer dev channel. Flash the <strong>1.17.1-dev</strong> builds from the DutchMeshCore Firmware and PacketLog groups in the Flasher. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-dev">Release: dmc-repeater-dev</Doc> · <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-packetlog-dev">dmc-repeater-packetlog-dev</Doc>.</>,
          <>Dev builds report their version as <code>v1.17.1-dev-dutchmeshcore.nl-&lt;hash&gt;</code> (new <code>DMC_CHANNEL</code> build marker); stable builds are unchanged.</>,
          <><strong>Packet filter</strong> additions: <code>filter dryrun</code> (count drops but keep forwarding), a per-origin <strong>advert window</strong> (<code>filter advert &lt;hours&gt;</code>), blocked <strong>path prefixes</strong> (<code>filter path</code>), <strong>sender and text rules</strong> that block, throttle or dose a bot (<code>filter sender</code> / <code>filter text</code>, readable channels via <code>filter watch</code>), a <strong>message age limit</strong> (<code>filter age</code>), and saved-airtime stats (<code>filter stats air</code>). <Doc href={DOCS.packetFilter}>Packet filter reference</Doc>.</>,
          <><code>set dc.gate</code> now accepts <code>on</code> / <code>off</code> (and rejects anything else instead of silently disabling), and the docs now state that the <code>dc.gate</code> threshold is a share of the <strong>duty-cycle budget</strong>, not of wall-clock time.</>,
        ],
      },
      {
        version: 'v1.17.1.01',
        date: '2026-09-11',
        title: 'Repeater',
        items: [
          <>Consolidated every DMC repeater feature onto <code>dmc-dev</code> on top of upstream <code>dev</code>: filter drop <strong>statistics</strong> (<code>filter stats</code>) and the <strong>soft cutoff</strong> for rate limits (<code>filter rate &lt;type&gt; &lt;limit&gt; &lt;secs&gt; [soft]</code>).</>,
          <><strong>Duty-cycle region gating</strong> (<code>dc.gate</code>) is no longer observer-only: the plain repeater has it too.</>,
          <>New <code>set dutycycle auto</code> (the default): the limit follows the configured frequency using the 863-870 MHz ETSI table, e.g. 10% at 869.4-869.65 MHz.</>,
        ],
      },
      {
        version: 'v1.17.1-dev',
        date: '2026-09-14',
        title: 'MQTT Observer (dev channel)',
        items: [
          <>New rolling <strong>dev pre-release</strong> of the MQTT Observer firmware, based on upstream MeshCore <strong>v1.17.1</strong> (<code>dmc-observer-dev</code>). Flash the new <strong>1.17.1-dev</strong> builds from the <strong>DutchMeshCore-MQTT-Firmware</strong> group in the Flasher. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/observer-mqtt-dev">Release: observer-mqtt-dev</Doc>.</>,
          <>New on-device <code>ota branch [stable|dev|default]</code> command: switch the OTA channel a node pulls from at runtime (persisted, no re-flash). A node flashed from the dev channel keeps receiving dev updates until you switch it back with <code>ota branch stable</code>.</>,
          <>The dev channel is served from <code>ota.dutchmeshcore.nl</code> and is a <strong>rolling</strong> tag (assets are replaced in place), so builds report their version as <code>v1.17.1-dev-…-observer-mqtt-&lt;hash&gt;</code>.</>,
        ],
      },
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
        version: 'CLI Wiki & filter: v1.18 companion and Meshcomod',
        date: '2026-10-16',
        items: [
          <><strong>CLI Wiki</strong>: since v1.18 the companion has a small CLI of its own (app command line, USB serial, remote CLI). The companion view now lists only what it answers, and adds <code>set pin</code>, <code>get</code> / <code>set tz.offset</code> and the WiFi commands of WiFi builds (<code>wifi.enabled</code>, <code>wifi.clear</code>, <code>get wifi.ip</code>). Also new: <code>get</code> / <code>set cad</code>.</>,
          <>FEM gain (<code>radio.fem.rxgain</code> / <code>txgain</code>) and fan control are board commands upstream in v1.18, so they now show for every role, with the boards named. Commands only on DMC dev builds carry a <strong>v1.18-dev</strong> badge. Notes added for <code>set repeat on</code> on room servers, <code>set af</code> (0-9), <code>agc.reset.interval</code> (seconds) and the <code>loop.detect</code> default; <code>region load</code> is described as the multi-line import it is.</>,
          <>New CLI Wiki variant <strong>Meshcomod (EV Fork) – Companion</strong>: its companion CLI, the receive filter, SNMP, live WiFi settings and <code>ota check</code> / <code>ota update</code> / <code>ota url</code> for the command contact.</>,
          <>CLI Wiki variants now link their own docs: the Meshcomod receive filter, <strong>SNMP OID table</strong> (the DMC observer tree plus companion values under <code>.9</code> and receive-filter counters under <code>.10</code>), OTA and fork changelog, and the DMC observer CLI and SNMP references.</>,
          <><strong>Filter CLI generator</strong>: new <strong>Meshcomod companion</strong> target that only emits the commands the companion receive filter has. USB Setup and the filter guide recognise its status line (<code>Filter on: Hidden [...]</code>) and only offer its settings; the guide has a new companion section on hidden vs dropped messages.</>,
          <><strong>USB Setup</strong>: on room servers with v1.18 or later the repeat box can only be turned off, because the firmware refuses <code>set repeat on</code>.</>,
          <><strong>USB Setup</strong> now connects to a v1.18 <strong>companion</strong> on its serial console (the official firmware in CLI Rescue, Meshcomod at any time on ESP32): name, radio and the advanced radio settings it answers, plus the receive filter on Meshcomod. Sections a companion does not have are hidden.</>,
          <><strong>Flasher</strong>: the Meshcomod nRF52 builds (Seeed Wio Tracker L1, BLE and USB companion) are now listed. Only its ESP32 builds were picked up before.</>,
        ],
      },
      {
        version: 'Filter, CLI & flasher: current DMC dev firmware',
        date: '2026-10-15',
        items: [
          <>USB Setup and the <strong>Filter CLI generator</strong> now cover the new packet-filter settings: dry-run, the soft cutoff per type, the advert window, the message age limit, blocked path prefixes, sender / text rules and the watch list. Each is read from the device and only shown when the connected firmware answers it, so v1.17.1 builds keep working. Share files from before still import.</>,
          <><strong>Fix:</strong> on firmware with the soft cutoff, USB Setup read every rate limit back as the default (the reply gained a third column), and saving wiped any configured soft cutoff.</>,
          <><strong>Region Gating</strong> panel: the help text wrongly described <code>dc.gate</code> as neighbour-count based; it now explains the duty-cycle budget model in NL / EN / DE. The panel now shows on any DMC firmware that answers <code>get dc.gate</code> with on/off, and no longer on firmware that replies <code>??: dc.gate</code>.</>,
          <><strong>CLI Wiki</strong>: added the new filter commands, <code>set dutycycle auto</code>, <code>stop ota</code>, <code>start ota ap</code>, <code>ota branch</code> prod/beta, <code>get link.status</code> / <code>link.diag</code> / <code>link.dns</code>, <code>mqtt.advert.verify</code>, fan control, <code>power</code> and <code>gps diag</code>, and corrected the <code>dc.gate</code> descriptions.</>,
          <>MQTT broker presets updated to all <strong>38</strong> (adds <code>ntxmesh</code>, <code>bsmesh</code>, <code>marwoj</code>).</>,
          <><strong>Flasher</strong>: the rolling <code>dmc-repeater-dev</code> and <code>dmc-repeater-packetlog-dev</code> builds are listed with the version from the file name (now <strong>1.18.0-dev</strong>) instead of a bare "dev".</>,
        ],
      },
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
        version: 'v1.18.0 · dev',
        date: '2026-10-15',
        title: 'Alle DMC-branches',
        items: [
          <>Upstream MeshCore <strong>v1.18.0</strong> samengevoegd in <code>dmc-dev</code>, <code>dmc-observer-dev</code> en <code>dmc-dev-packetlog</code>. De doorlopende dev-builds zijn hierop opnieuw gebouwd en staan als <strong>1.18.0-dev</strong> in de Flasher. <Doc href="https://blog.meshcore.io/2026/10/15/release-1-18-0">Upstream-releasenotes</Doc>.</>,
          <>Nieuwe upstream-commando's <code>power</code> (status van batterij en voeding) en <code>gps diag</code>.</>,
          <><strong>RAK3112</strong>-fixes: octal PSRAM ingeschakeld, uitlezing van de batterijspanning gecorrigeerd, overgebleven Heltec V3-pinnen verwijderd.</>,
          <>Observer: bijgewerkt naar agessaman observer-firmware. <strong>ThinkNode M7</strong> gebruikt nu bij voorkeur zijn ingebouwde Ethernet met wifi als terugval (<code>get link.status</code> / <code>link.diag</code> / <code>link.dns</code>), nieuw <code>set mqtt.advert.verify on|off</code> om advertenties met een ongeldige handtekening over te slaan, <code>stop ota</code> om een inactieve handmatige OTA-sessie te beëindigen, strengere controle van NTP-antwoorden en drie nieuwe broker-presets (<code>ntxmesh</code>, <code>bsmesh</code>, <code>marwoj</code>).</>,
          <><code>ota branch</code> noemt de kanalen nu <strong>prod</strong> / <strong>beta</strong>; <code>stable</code> en <code>dev</code> blijven werken als alias. T-Beam 1W-builds krijgen ventilatorbediening (<code>get fan</code>, <code>set fan on|off|auto</code>, <code>fan.lo</code> / <code>fan.hi</code>).</>,
          <>PacketLog: seriële pakketlogging ingeschakeld op de Waveshare S3 LR1121-repeater en room-server.</>,
        ],
      },
      {
        version: 'v1.17.1-dev · Repeater & PacketLog',
        date: '2026-10-14',
        title: 'Repeater (dev-kanaal)',
        items: [
          <>Nieuwe doorlopende <strong>dev-prereleases</strong> voor de gewone DMC-repeater en de PacketLog-builds, naast het dev-kanaal van de MQTT-observer. Flash de <strong>1.17.1-dev</strong>-builds via de groepen DutchMeshCore Firmware en PacketLog in de Flasher. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-dev">Release: dmc-repeater-dev</Doc> · <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-packetlog-dev">dmc-repeater-packetlog-dev</Doc>.</>,
          <>Dev-builds melden hun versie als <code>v1.17.1-dev-dutchmeshcore.nl-&lt;hash&gt;</code> (nieuwe <code>DMC_CHANNEL</code>-buildmarkering); stabiele builds blijven ongewijzigd.</>,
          <>Uitbreidingen van het <strong>pakketfilter</strong>: <code>filter dryrun</code> (drops tellen maar wel doorsturen), een <strong>advertentievenster</strong> per afzender (<code>filter advert &lt;uren&gt;</code>), geblokkeerde <strong>pad-prefixen</strong> (<code>filter path</code>), <strong>afzender- en tekstregels</strong> die een bot blokkeren, afremmen of doseren (<code>filter sender</code> / <code>filter text</code>, leesbare kanalen via <code>filter watch</code>), een <strong>maximale berichtleeftijd</strong> (<code>filter age</code>) en statistieken over bespaarde zendtijd (<code>filter stats air</code>). <Doc href={DOCS.packetFilter}>Referentie pakketfilter</Doc>.</>,
          <><code>set dc.gate</code> accepteert nu <code>on</code> / <code>off</code> (en weigert andere waarden in plaats van stil uit te schakelen), en de documentatie vermeldt nu dat de <code>dc.gate</code>-drempel een deel van het <strong>duty-cycle-budget</strong> is, niet van de kloktijd.</>,
        ],
      },
      {
        version: 'v1.17.1.01',
        date: '2026-09-11',
        title: 'Repeater',
        items: [
          <>Alle DMC-repeaterfuncties samengebracht op <code>dmc-dev</code> bovenop upstream <code>dev</code>: drop-<strong>statistieken</strong> van het filter (<code>filter stats</code>) en de <strong>zachte grens</strong> voor snelheidslimieten (<code>filter rate &lt;type&gt; &lt;limiet&gt; &lt;secs&gt; [soft]</code>).</>,
          <><strong>Duty-cycle-regiogating</strong> (<code>dc.gate</code>) is niet langer alleen voor de observer: de gewone repeater heeft het ook.</>,
          <>Nieuw <code>set dutycycle auto</code> (de standaard): de limiet volgt de ingestelde frequentie volgens de ETSI-tabel voor 863-870 MHz, bijv. 10% op 869,4-869,65 MHz.</>,
        ],
      },
      {
        version: 'v1.17.1-dev',
        date: '2026-09-14',
        title: 'MQTT Observer (dev-kanaal)',
        items: [
          <>Nieuwe doorlopende <strong>dev-prerelease</strong> van de MQTT Observer-firmware, gebaseerd op upstream MeshCore <strong>v1.17.1</strong> (<code>dmc-observer-dev</code>). Flash de nieuwe <strong>1.17.1-dev</strong>-builds via de <strong>DutchMeshCore-MQTT-Firmware</strong>-groep in de Flasher. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/observer-mqtt-dev">Release: observer-mqtt-dev</Doc>.</>,
          <>Nieuw commando op het apparaat <code>ota branch [stable|dev|default]</code>: wissel tijdens runtime het OTA-kanaal waarvan een node updates haalt (bewaard, zonder opnieuw te flashen). Een node die vanaf het dev-kanaal is geflasht blijft dev-updates ontvangen totdat je hem terugzet met <code>ota branch stable</code>.</>,
          <>Het dev-kanaal wordt geserveerd vanaf <code>ota.dutchmeshcore.nl</code> en is een <strong>doorlopende</strong> tag (assets worden ter plekke vervangen), dus builds melden hun versie als <code>v1.17.1-dev-…-observer-mqtt-&lt;hash&gt;</code>.</>,
        ],
      },
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
        version: 'CLI Wiki & filter: v1.18-companion en Meshcomod',
        date: '2026-10-16',
        items: [
          <><strong>CLI Wiki</strong>: sinds v1.18 heeft de companion een kleine eigen CLI (opdrachtregel van de app, USB-serieel, remote CLI). Het companion-overzicht toont nu alleen wat hij beantwoordt, en voegt <code>set pin</code>, <code>get</code> / <code>set tz.offset</code> en de WiFi-opdrachten van WiFi-builds toe (<code>wifi.enabled</code>, <code>wifi.clear</code>, <code>get wifi.ip</code>). Ook nieuw: <code>get</code> / <code>set cad</code>.</>,
          <>FEM-versterking (<code>radio.fem.rxgain</code> / <code>txgain</code>) en ventilatorbediening zijn in v1.18 upstream board-opdrachten, dus ze staan nu bij elke rol, met de boards erbij. Opdrachten die alleen in DMC-dev-builds zitten, hebben een <strong>v1.18-dev</strong>-badge. Toelichting toegevoegd bij <code>set repeat on</code> op room-servers, <code>set af</code> (0-9), <code>agc.reset.interval</code> (seconden) en de standaard van <code>loop.detect</code>; <code>region load</code> staat nu beschreven als de import over meerdere regels die het is.</>,
          <>Nieuwe CLI Wiki-variant <strong>Meshcomod (EV Fork) – Companion</strong>: de companion-CLI, het ontvangstfilter, SNMP, WiFi-instellingen die direct werken en <code>ota check</code> / <code>ota update</code> / <code>ota url</code> voor het commandocontact.</>,
          <>CLI Wiki-varianten linken nu naar hun eigen documentatie: het Meshcomod-ontvangstfilter, de <strong>SNMP-OID-tabel</strong> (de boom van de DMC-observer plus companion-waarden onder <code>.9</code> en tellers van het ontvangstfilter onder <code>.10</code>), OTA en de changelog van de fork, en de CLI- en SNMP-referentie van de DMC-observer.</>,
          <><strong>Filter CLI-generator</strong>: nieuw doel <strong>Meshcomod-companion</strong> dat alleen de opdrachten van het ontvangstfilter van de companion maakt. USB Setup en de filtergids herkennen de statusregel (<code>Filter on: Hidden [...]</code>) en tonen alleen die instellingen; de gids heeft een nieuw companion-deel over verborgen en verwijderde berichten.</>,
          <><strong>USB Setup</strong>: op room-servers met v1.18 of nieuwer kan het vakje voor herhalen alleen nog uit, omdat de firmware <code>set repeat on</code> weigert.</>,
          <><strong>USB Setup</strong> verbindt nu ook met een v1.18-<strong>companion</strong> via zijn seriële console (de officiële firmware in CLI Rescue, Meshcomod op ESP32 altijd): naam, radio en de geavanceerde radio-instellingen die hij beantwoordt, plus het ontvangstfilter op Meshcomod. Onderdelen die een companion niet heeft, worden verborgen.</>,
          <><strong>Flasher</strong>: de nRF52-builds van Meshcomod (Seeed Wio Tracker L1, BLE- en USB-companion) staan er nu ook in. Eerder werden alleen de ESP32-builds opgepikt.</>,
        ],
      },
      {
        version: 'Filter, CLI & flasher: actuele DMC-dev-firmware',
        date: '2026-10-15',
        items: [
          <>USB-instellingen en de <strong>Filter CLI-generator</strong> ondersteunen nu de nieuwe pakketfilter-instellingen: dry-run, de zachte grens per type, het advertentievenster, de maximale berichtleeftijd, geblokkeerde pad-prefixen, afzender-/tekstregels en de volglijst. Elke instelling wordt van het apparaat gelezen en alleen getoond als de aangesloten firmware hem kent, dus v1.17.1-builds blijven werken. Oudere deelbestanden zijn nog steeds te importeren.</>,
          <><strong>Fix:</strong> op firmware met de zachte grens las USB-instellingen elke snelheidslimiet terug als standaardwaarde (het antwoord kreeg een derde kolom), en opslaan wiste een ingestelde zachte grens.</>,
          <><strong>Regiogating</strong>-paneel: de helptekst beschreef <code>dc.gate</code> ten onrechte als gebaseerd op het aantal buren; hij legt nu het duty-cycle-budgetmodel uit in NL / EN / DE. Het paneel verschijnt nu op elke DMC-firmware die <code>get dc.gate</code> met on/off beantwoordt, en niet meer op firmware die <code>??: dc.gate</code> antwoordt.</>,
          <><strong>CLI-wiki</strong>: de nieuwe filtercommando's toegevoegd, plus <code>set dutycycle auto</code>, <code>stop ota</code>, <code>start ota ap</code>, <code>ota branch</code> prod/beta, <code>get link.status</code> / <code>link.diag</code> / <code>link.dns</code>, <code>mqtt.advert.verify</code>, ventilatorbediening, <code>power</code> en <code>gps diag</code>, en de <code>dc.gate</code>-beschrijvingen gecorrigeerd.</>,
          <>MQTT-broker-presets bijgewerkt naar alle <strong>38</strong> (voegt <code>ntxmesh</code>, <code>bsmesh</code>, <code>marwoj</code> toe).</>,
          <><strong>Flasher</strong>: de doorlopende <code>dmc-repeater-dev</code>- en <code>dmc-repeater-packetlog-dev</code>-builds staan nu met de versie uit de bestandsnaam in de lijst (nu <strong>1.18.0-dev</strong>) in plaats van alleen "dev".</>,
        ],
      },
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
        version: 'v1.18.0 · dev',
        date: '2026-10-15',
        title: 'Alle DMC-Branches',
        items: [
          <>Upstream-MeshCore <strong>v1.18.0</strong> in <code>dmc-dev</code>, <code>dmc-observer-dev</code> und <code>dmc-dev-packetlog</code> zusammengeführt. Die rollierenden Dev-Builds wurden darauf neu gebaut und erscheinen als <strong>1.18.0-dev</strong> im Flasher. <Doc href="https://blog.meshcore.io/2026/10/15/release-1-18-0">Upstream-Release-Notes</Doc>.</>,
          <>Neue Upstream-Befehle <code>power</code> (Status von Batterie und Stromversorgung) und <code>gps diag</code>.</>,
          <><strong>RAK3112</strong>-Fixes: Octal-PSRAM aktiviert, Batteriespannungsmessung korrigiert, übrig gebliebene Heltec-V3-Pins entfernt.</>,
          <>Observer: auf den Stand der agessaman-observer-Firmware gebracht. <strong>ThinkNode M7</strong> nutzt nun bevorzugt sein eingebautes Ethernet mit WLAN als Rückfall (<code>get link.status</code> / <code>link.diag</code> / <code>link.dns</code>), neu <code>set mqtt.advert.verify on|off</code>, um Adverts mit ungültiger Signatur zu überspringen, <code>stop ota</code> zum Beenden einer untätigen manuellen OTA-Sitzung, strengere Prüfung von NTP-Antworten und drei neue Broker-Presets (<code>ntxmesh</code>, <code>bsmesh</code>, <code>marwoj</code>).</>,
          <><code>ota branch</code> nennt die Kanäle nun <strong>prod</strong> / <strong>beta</strong>; <code>stable</code> und <code>dev</code> funktionieren weiter als Alias. T-Beam-1W-Builds erhalten eine Lüftersteuerung (<code>get fan</code>, <code>set fan on|off|auto</code>, <code>fan.lo</code> / <code>fan.hi</code>).</>,
          <>PacketLog: serielles Paket-Logging auf dem Waveshare-S3-LR1121-Repeater und -Room-Server aktiviert.</>,
        ],
      },
      {
        version: 'v1.17.1-dev · Repeater & PacketLog',
        date: '2026-10-14',
        title: 'Repeater (Dev-Kanal)',
        items: [
          <>Neue rollierende <strong>Dev-Vorabversionen</strong> für den normalen DMC-Repeater und die PacketLog-Builds, neben dem Dev-Kanal des MQTT-Observers. Flashe die <strong>1.17.1-dev</strong>-Builds über die Gruppen DutchMeshCore Firmware und PacketLog im Flasher. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-dev">Release: dmc-repeater-dev</Doc> · <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/dmc-repeater-packetlog-dev">dmc-repeater-packetlog-dev</Doc>.</>,
          <>Dev-Builds melden ihre Version als <code>v1.17.1-dev-dutchmeshcore.nl-&lt;hash&gt;</code> (neue <code>DMC_CHANNEL</code>-Build-Markierung); stabile Builds bleiben unverändert.</>,
          <>Erweiterungen des <strong>Paketfilters</strong>: <code>filter dryrun</code> (Drops zählen, aber weiterleiten), ein <strong>Advert-Fenster</strong> pro Absender (<code>filter advert &lt;Stunden&gt;</code>), blockierte <strong>Pfad-Präfixe</strong> (<code>filter path</code>), <strong>Absender- und Textregeln</strong>, die einen Bot blockieren, drosseln oder dosieren (<code>filter sender</code> / <code>filter text</code>, lesbare Kanäle über <code>filter watch</code>), ein <strong>maximales Nachrichtenalter</strong> (<code>filter age</code>) und Statistiken zur gesparten Sendezeit (<code>filter stats air</code>). <Doc href={DOCS.packetFilter}>Referenz Paketfilter</Doc>.</>,
          <><code>set dc.gate</code> akzeptiert nun <code>on</code> / <code>off</code> (und lehnt andere Werte ab, statt still abzuschalten), und die Doku stellt klar, dass die <code>dc.gate</code>-Schwelle ein Anteil des <strong>Duty-Cycle-Budgets</strong> ist, nicht der Uhrzeit.</>,
        ],
      },
      {
        version: 'v1.17.1.01',
        date: '2026-09-11',
        title: 'Repeater',
        items: [
          <>Alle DMC-Repeater-Funktionen auf <code>dmc-dev</code> über Upstream-<code>dev</code> zusammengeführt: Drop-<strong>Statistiken</strong> des Filters (<code>filter stats</code>) und die <strong>weiche Grenze</strong> für Ratenlimits (<code>filter rate &lt;Typ&gt; &lt;Limit&gt; &lt;secs&gt; [soft]</code>).</>,
          <><strong>Duty-Cycle-Regionen-Gating</strong> (<code>dc.gate</code>) ist nicht mehr nur für den Observer: der normale Repeater hat es auch.</>,
          <>Neu <code>set dutycycle auto</code> (Standard): das Limit folgt der eingestellten Frequenz nach der ETSI-Tabelle für 863-870 MHz, z. B. 10% bei 869,4-869,65 MHz.</>,
        ],
      },
      {
        version: 'v1.17.1-dev',
        date: '2026-09-14',
        title: 'MQTT Observer (Dev-Kanal)',
        items: [
          <>Neue rollierende <strong>Dev-Vorabversion</strong> der MQTT-Observer-Firmware, basierend auf Upstream-MeshCore <strong>v1.17.1</strong> (<code>dmc-observer-dev</code>). Flashe die neuen <strong>1.17.1-dev</strong>-Builds über die Gruppe <strong>DutchMeshCore-MQTT-Firmware</strong> im Flasher. <Doc href="https://github.com/Dutch-MeshCore/MeshCore/releases/tag/observer-mqtt-dev">Release: observer-mqtt-dev</Doc>.</>,
          <>Neuer Gerätebefehl <code>ota branch [stable|dev|default]</code>: Wechsle zur Laufzeit den OTA-Kanal, aus dem ein Knoten Updates bezieht (persistent, ohne erneutes Flashen). Ein vom Dev-Kanal geflashter Knoten erhält weiterhin Dev-Updates, bis du ihn mit <code>ota branch stable</code> zurückstellst.</>,
          <>Der Dev-Kanal wird von <code>ota.dutchmeshcore.nl</code> bereitgestellt und ist ein <strong>rollierender</strong> Tag (Assets werden an Ort und Stelle ersetzt), daher melden Builds ihre Version als <code>v1.17.1-dev-…-observer-mqtt-&lt;hash&gt;</code>.</>,
        ],
      },
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
        version: 'CLI Wiki & Filter: v1.18-Companion und Meshcomod',
        date: '2026-10-16',
        items: [
          <><strong>CLI Wiki</strong>: seit v1.18 hat der Companion eine kleine eigene CLI (Befehlszeile der App, USB-seriell, Remote-CLI). Die Companion-Ansicht zeigt nur noch, was er beantwortet, und ergänzt <code>set pin</code>, <code>get</code> / <code>set tz.offset</code> sowie die WiFi-Befehle der WiFi-Builds (<code>wifi.enabled</code>, <code>wifi.clear</code>, <code>get wifi.ip</code>). Ebenfalls neu: <code>get</code> / <code>set cad</code>.</>,
          <>FEM-Verstärkung (<code>radio.fem.rxgain</code> / <code>txgain</code>) und Lüftersteuerung sind in v1.18 upstream Board-Befehle und erscheinen daher bei jeder Rolle, mit den Boards. Befehle, die nur in DMC-Dev-Builds stecken, tragen ein <strong>v1.18-dev</strong>-Abzeichen. Hinweise ergänzt zu <code>set repeat on</code> auf Room-Servern, <code>set af</code> (0-9), <code>agc.reset.interval</code> (Sekunden) und dem Standard von <code>loop.detect</code>; <code>region load</code> ist jetzt als mehrzeiliger Import beschrieben.</>,
          <>Neue CLI-Wiki-Variante <strong>Meshcomod (EV Fork) – Companion</strong>: die Companion-CLI, der Empfangsfilter, SNMP, sofort wirksame WiFi-Einstellungen und <code>ota check</code> / <code>ota update</code> / <code>ota url</code> für den Befehlskontakt.</>,
          <>CLI-Wiki-Varianten verlinken jetzt ihre eigene Dokumentation: den Meshcomod-Empfangsfilter, die <strong>SNMP-OID-Tabelle</strong> (der Baum des DMC-Observers plus Companion-Werte unter <code>.9</code> und Zähler des Empfangsfilters unter <code>.10</code>), OTA und das Changelog des Forks sowie die CLI- und SNMP-Referenz des DMC-Observers.</>,
          <><strong>Filter-CLI-Generator</strong>: neues Ziel <strong>Meshcomod-Companion</strong>, das nur die Befehle des Companion-Empfangsfilters erzeugt. USB Setup und der Filter-Leitfaden erkennen dessen Statuszeile (<code>Filter on: Hidden [...]</code>) und bieten nur dessen Einstellungen an; der Leitfaden hat einen neuen Companion-Abschnitt zu ausgeblendeten und verworfenen Nachrichten.</>,
          <><strong>USB Setup</strong>: auf Room-Servern ab v1.18 lässt sich das Weiterleiten-Kästchen nur noch ausschalten, weil die Firmware <code>set repeat on</code> ablehnt.</>,
          <><strong>USB Setup</strong> verbindet sich jetzt auch mit einem v1.18-<strong>Companion</strong> über dessen serielle Konsole (die offizielle Firmware im CLI Rescue, Meshcomod auf ESP32 jederzeit): Name, Funk und die erweiterten Funkeinstellungen, die er beantwortet, dazu der Empfangsfilter bei Meshcomod. Bereiche, die ein Companion nicht hat, werden ausgeblendet.</>,
          <><strong>Flasher</strong>: Die nRF52-Builds von Meshcomod (Seeed Wio Tracker L1, BLE- und USB-Companion) werden jetzt aufgeführt. Vorher wurden nur die ESP32-Builds erkannt.</>,
        ],
      },
      {
        version: 'Filter, CLI & Flasher: aktuelle DMC-Dev-Firmware',
        date: '2026-10-15',
        items: [
          <>Das USB-Setup und der <strong>Filter-CLI-Generator</strong> unterstützen nun die neuen Paketfilter-Einstellungen: Dry-run, die weiche Grenze pro Typ, das Advert-Fenster, das maximale Nachrichtenalter, blockierte Pfad-Präfixe, Absender-/Textregeln und die Beobachtungsliste. Jede Einstellung wird vom Gerät gelesen und nur angezeigt, wenn die angeschlossene Firmware sie kennt, sodass v1.17.1-Builds weiter funktionieren. Ältere Freigabedateien lassen sich weiterhin importieren.</>,
          <><strong>Fix:</strong> auf Firmware mit weicher Grenze las das USB-Setup jedes Ratenlimit als Standardwert zurück (die Antwort bekam eine dritte Spalte), und Speichern löschte eine eingestellte weiche Grenze.</>,
          <><strong>Regionen-Gating</strong>-Panel: der Hilfetext beschrieb <code>dc.gate</code> fälschlich als nachbarzahlbasiert; er erklärt nun das Duty-Cycle-Budget-Modell in NL / EN / DE. Das Panel erscheint nun auf jeder DMC-Firmware, die <code>get dc.gate</code> mit on/off beantwortet, und nicht mehr auf Firmware, die <code>??: dc.gate</code> antwortet.</>,
          <><strong>CLI Wiki</strong>: die neuen Filterbefehle ergänzt, dazu <code>set dutycycle auto</code>, <code>stop ota</code>, <code>start ota ap</code>, <code>ota branch</code> prod/beta, <code>get link.status</code> / <code>link.diag</code> / <code>link.dns</code>, <code>mqtt.advert.verify</code>, Lüftersteuerung, <code>power</code> und <code>gps diag</code>, und die <code>dc.gate</code>-Beschreibungen korrigiert.</>,
          <>MQTT-Broker-Presets auf alle <strong>38</strong> aktualisiert (ergänzt <code>ntxmesh</code>, <code>bsmesh</code>, <code>marwoj</code>).</>,
          <><strong>Flasher</strong>: die rollierenden Builds <code>dmc-repeater-dev</code> und <code>dmc-repeater-packetlog-dev</code> stehen nun mit der Version aus dem Dateinamen in der Liste (jetzt <strong>1.18.0-dev</strong>) statt nur "dev".</>,
        ],
      },
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
  // Newest first by date; the sort is stable, so same-day entries keep their order.
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      {sorted.map(e => (
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
