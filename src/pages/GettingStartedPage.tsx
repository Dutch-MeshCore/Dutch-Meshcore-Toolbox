import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'

const copy = {
  en: {
    title: 'Coming from official MeshCore?',
    intro: 'DutchMeshCore (DMC) firmware is a fork of the official meshcore.io firmware, tuned for the Dutch network. This guide explains what it adds and how to switch.',
    s1h: 'What is DutchMeshCore firmware?',
    s1: 'DMC firmware takes official MeshCore and adds features the Dutch network relies on – packet filtering, MQTT observer reporting, and NL broker presets – while staying compatible with the wider MeshCore mesh.',
    s2h: 'What each build adds',
    s2official: 'the meshcore.io baseline. Companion, repeater and room-server roles.',
    s2rep: 'official plus the RF packet filter and rate limiting, to keep the mesh clean.',
    s2packetlog: 'the repeater build plus per-packet RX/TX logging to the USB serial console (MESH_PACKET_LOGGING). Lets an external tool – such as an MC-to-MQTT bridge or logger – ingest live packet data over serial, without the on-device MQTT stack.',
    s2mqtt: 'everything in the repeater build plus the MQTT observer bridge, per-broker packet filter, neighbour publishing, WebConfig, SNMP, fault alerts and pull-based OTA – run "ota check" then "ota update" to upgrade the node to the latest DMC firmware over its existing WiFi connection, no re-flash needed.',
    s2roomserver: 'a room server (store-and-forward group-chat hub) with the same MQTT observer bridge, per-broker filter and neighbour publishing as the MQTT build – for boards that host a public room.',
    s3h: 'Which build do I want?',
    s3: 'Chatting from a handheld? Stay on the companion (official) firmware. Running a relay? Use the DMC repeater build. Feeding packet data to an external MC-to-MQTT bridge or logger over serial? Use the DMC Repeater PacketLog build. Want your node to show up on the analyzers and the map on its own? Use the MQTT/observer build. Hosting a group-chat room? Use the DMC Room Server MQTT build.',
    s4h: 'Flash it',
    s4: 'Open the Flasher, pick your board and the DMC firmware, and use the merged “Full flash” image for a first install so the partition table is written. Export your config first if you are re-flashing – flashing can wipe settings.',
    s5h: 'Configure it',
    s5: 'Use USB Setup for a repeater or room-server over serial, MQTT CLI to generate broker commands, and Filter CLI for the packet filter. The recommended NL radio settings are on the home page.',
    s6h: 'Verify',
    s6: 'Send an advert, then check an analyzer to see your node. Use the CLI Wiki to look up ver, stats-core and the rest.',
    goFlash: 'Open the Flasher', goUsb: 'USB Setup', goMqtt: 'MQTT CLI',
    goFilter: 'Filter CLI', goWiki: 'CLI Wiki', goHome: 'Radio settings',
  },
  nl: {
    title: 'Kom je van de officiële MeshCore?',
    intro: 'DutchMeshCore (DMC)-firmware is een fork van de officiële meshcore.io-firmware, afgestemd op het Nederlandse netwerk. Deze gids legt uit wat het toevoegt en hoe je overstapt.',
    s1h: 'Wat is DutchMeshCore-firmware?',
    s1: 'DMC-firmware neemt de officiële MeshCore en voegt functies toe waar het Nederlandse netwerk op leunt – packetfiltering, MQTT-observer-rapportage en NL-brokerpresets – en blijft compatibel met het bredere MeshCore-mesh.',
    s2h: 'Wat elke build toevoegt',
    s2official: 'de meshcore.io-basis. Companion-, repeater- en room-server-rollen.',
    s2rep: 'officieel plus het RF-packetfilter en rate limiting, om het mesh schoon te houden.',
    s2packetlog: 'de repeater-build plus per-pakket RX/TX-logging naar de USB-seriële console (MESH_PACKET_LOGGING). Laat een externe tool – zoals een MC-naar-MQTT-bridge of logger – live pakketdata via serieel inlezen, zonder de MQTT-stack op het apparaat.',
    s2mqtt: 'alles uit de repeater-build plus de MQTT-observer-bridge, packetfilter per broker, buurpublicatie, WebConfig, SNMP, storingsmeldingen en pull-gebaseerde OTA – draai "ota check" en daarna "ota update" om de node via zijn bestaande WiFi-verbinding naar de nieuwste DMC-firmware bij te werken, zonder opnieuw te flashen.',
    s2roomserver: 'een room-server (store-and-forward groepschat-hub) met dezelfde MQTT-observer-bridge, filter per broker en buurpublicatie als de MQTT-build – voor boards die een publieke room hosten.',
    s3h: 'Welke build wil ik?',
    s3: 'Chatten vanaf een handheld? Blijf op de companion-firmware (officieel). Draai je een relay? Gebruik de DMC-repeater-build. Wil je pakketdata via serieel naar een externe MC-naar-MQTT-bridge of logger sturen? Gebruik de DMC Repeater PacketLog-build. Wil je dat je node zelf op de analyzers en de kaart verschijnt? Gebruik de MQTT/observer-build. Host je een groepschat-room? Gebruik de DMC Room Server MQTT-build.',
    s4h: 'Flashen',
    s4: 'Open de Flasher, kies je board en de DMC-firmware, en gebruik het merged “Full flash”-image voor een eerste installatie zodat de partitietabel wordt geschreven. Exporteer eerst je config als je opnieuw flasht – flashen kan instellingen wissen.',
    s5h: 'Configureren',
    s5: 'Gebruik USB-instellingen voor een repeater of room-server via serieel, MQTT CLI om broker-commando’s te maken en Filter CLI voor het packetfilter. De aanbevolen NL-radio-instellingen staan op de startpagina.',
    s6h: 'Controleren',
    s6: 'Stuur een advert en bekijk daarna een analyzer om je node te zien. Gebruik de CLI-wiki om ver, stats-core en de rest op te zoeken.',
    goFlash: 'Open de Flasher', goUsb: 'USB-instellingen', goMqtt: 'MQTT CLI',
    goFilter: 'Filter CLI', goWiki: 'CLI-wiki', goHome: 'Radio-instellingen',
  },
  de: {
    title: 'Kommst du von offiziellem MeshCore?',
    intro: 'DutchMeshCore (DMC)-Firmware ist ein Fork der offiziellen meshcore.io-Firmware, abgestimmt auf das niederländische Netz. Diese Anleitung erklärt, was sie hinzufügt und wie du umsteigst.',
    s1h: 'Was ist DutchMeshCore-Firmware?',
    s1: 'DMC-Firmware nimmt das offizielle MeshCore und ergänzt Funktionen, auf die sich das niederländische Netz stützt – Paketfilter, MQTT-Observer-Berichte und NL-Broker-Presets – und bleibt dabei mit dem breiteren MeshCore-Mesh kompatibel.',
    s2h: 'Was jeder Build hinzufügt',
    s2official: 'die meshcore.io-Basis. Companion-, Repeater- und Room-Server-Rollen.',
    s2rep: 'offiziell plus den RF-Paketfilter und Rate-Limiting, um das Mesh sauber zu halten.',
    s2packetlog: 'der Repeater-Build plus RX/TX-Logging pro Paket auf die serielle USB-Konsole (MESH_PACKET_LOGGING). Lässt ein externes Tool – etwa eine MC-to-MQTT-Bridge oder einen Logger – Live-Paketdaten über seriell einlesen, ohne den MQTT-Stack auf dem Gerät.',
    s2mqtt: 'alles aus dem Repeater-Build plus die MQTT-Observer-Bridge, Paketfilter pro Broker, Nachbarn-Veröffentlichung, WebConfig, SNMP, Störungsmeldungen und Pull-basiertes OTA – führe "ota check" und danach "ota update" aus, um den Knoten über seine bestehende WiFi-Verbindung auf die neueste DMC-Firmware zu aktualisieren, ohne erneut zu flashen.',
    s2roomserver: 'ein Room-Server (Store-and-Forward-Gruppenchat-Hub) mit derselben MQTT-Observer-Bridge, Filter pro Broker und Nachbarn-Veröffentlichung wie der MQTT-Build – für Boards, die einen öffentlichen Room hosten.',
    s3h: 'Welchen Build will ich?',
    s3: 'Chattest du von einem Handheld? Bleib bei der Companion-Firmware (offiziell). Betreibst du ein Relais? Nimm den DMC-Repeater-Build. Willst du Paketdaten über seriell an eine externe MC-to-MQTT-Bridge oder einen Logger senden? Nimm den DMC Repeater PacketLog-Build. Willst du, dass dein Knoten von allein auf den Analyzern und der Karte erscheint? Nimm den MQTT/Observer-Build. Hostest du einen Gruppenchat-Room? Nimm den DMC Room Server MQTT-Build.',
    s4h: 'Flashen',
    s4: 'Öffne den Flasher, wähle dein Board und die DMC-Firmware und nutze das zusammengeführte „Voll-Flash“-Image für eine Erstinstallation, damit die Partitionstabelle geschrieben wird. Exportiere zuerst deine Konfiguration, wenn du neu flashst – Flashen kann Einstellungen löschen.',
    s5h: 'Konfigurieren',
    s5: 'Nutze USB Setup für einen Repeater oder Room-Server über seriell, MQTT CLI zum Erzeugen von Broker-Befehlen und Filter CLI für den Paketfilter. Die empfohlenen NL-Funkeinstellungen stehen auf der Startseite.',
    s6h: 'Überprüfen',
    s6: 'Sende ein Advert und prüfe dann einen Analyzer, um deinen Knoten zu sehen. Nutze das CLI Wiki, um ver, stats-core und den Rest nachzuschlagen.',
    goFlash: 'Flasher öffnen', goUsb: 'USB Setup', goMqtt: 'MQTT CLI',
    goFilter: 'Filter CLI', goWiki: 'CLI Wiki', goHome: 'Funkeinstellungen',
  },
} as const

export default function GettingStartedPage() {
  const { lang } = useLang()
  const c = copy[lang as 'en' | 'nl' | 'de'] ?? copy.en
  return (
    <>
      <Navbar />
      <main className="page getting-started-page">
        <div className="device-page-header">
          <h1>🚀 {c.title}</h1>
          <p>{c.intro}</p>
        </div>

        <div className="panel"><div className="panel-legend">{c.s1h}</div><p>{c.s1}</p></div>

        <div className="panel">
          <div className="panel-legend">{c.s2h}</div>
          <ul className="gs-tier-list">
            <li><strong>MeshCore</strong> – {c.s2official}</li>
            <li><strong>DMC Repeater</strong> – {c.s2rep}</li>
            <li><strong>DMC Repeater PacketLog</strong> – {c.s2packetlog}</li>
            <li><strong>DMC MQTT / Observer</strong> – {c.s2mqtt}</li>
            <li><strong>DMC Room Server MQTT</strong> – {c.s2roomserver}</li>
          </ul>
          <Link className="btn btn-sm" to="/cli-wiki">{c.goWiki} →</Link>
        </div>

        <div className="panel"><div className="panel-legend">{c.s3h}</div><p>{c.s3}</p></div>

        <div className="panel">
          <div className="panel-legend">{c.s4h}</div><p>{c.s4}</p>
          <Link className="btn" to="/flasher">{c.goFlash}</Link>
        </div>

        <div className="panel">
          <div className="panel-legend">{c.s5h}</div><p>{c.s5}</p>
          <div className="gs-links">
            <Link className="btn btn-sm" to="/usb-config">{c.goUsb}</Link>
            <Link className="btn btn-sm" to="/mqtt-cli">{c.goMqtt}</Link>
            <Link className="btn btn-sm" to="/filter-cli">{c.goFilter}</Link>
            <Link className="btn btn-sm" to="/">{c.goHome}</Link>
          </div>
        </div>

        <div className="panel">
          <div className="panel-legend">{c.s6h}</div><p>{c.s6}</p>
          <Link className="btn btn-sm" to="/cli-wiki">{c.goWiki}</Link>
        </div>
      </main>
    </>
  )
}
