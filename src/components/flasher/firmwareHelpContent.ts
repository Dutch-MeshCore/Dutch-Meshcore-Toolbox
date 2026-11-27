import type { Lang } from '../../i18n'
import type { HelpContent } from '../config/panelHelpContent'

// Help text behind the "?" next to each firmware group in the Flasher: what the
// firmware does and who would flash it. Keyed by the maker key used in
// dmc-firmware.json / community-firmware.json. A group without an entry simply
// shows no "?" button.
export type FirmwareHelpId =
  | 'dutchmeshcore_repeater'
  | 'dutchmeshcore'
  | 'dutchmeshcore_packetlog'
  | 'dutchmeshcore_companion'
  | 'dutchmeshcore_comp_obs'
  | 'meshcomod'
  | 'meshcore_dev'

export const FIRMWARE_HELP_IDS: readonly FirmwareHelpId[] = [
  'dutchmeshcore_repeater', 'dutchmeshcore', 'dutchmeshcore_packetlog',
  'dutchmeshcore_companion', 'dutchmeshcore_comp_obs', 'meshcomod', 'meshcore_dev',
]

const LABELS: Record<Lang, { what: string; who: string; note: string }> = {
  nl: { what: 'Wat doet het', who: 'Voor wie', note: 'Goed om te weten' },
  en: { what: 'What it does', who: 'Who is it for', note: 'Good to know' },
  de: { what: 'Was es macht', who: 'Für wen', note: 'Gut zu wissen' },
}

function entry(lang: Lang, title: string, intro: string, what: string, who: string, note?: string): HelpContent {
  const l = LABELS[lang]
  const fields = [
    { label: l.what, body: what },
    { label: l.who, body: who },
  ]
  if (note) fields.push({ label: l.note, body: note })
  return { title, intro, fields }
}

export const FIRMWARE_HELP: Record<FirmwareHelpId, Record<Lang, HelpContent>> = {
  dutchmeshcore_repeater: {
    nl: entry('nl', 'DutchMeshCore Firmware',
      'De DMC-repeater-build zonder MQTT: de officiële MeshCore-repeater, aangevuld met wat het Nederlandse netwerk schoon houdt.',
      'Officiële MeshCore-repeater plus het RF-packetfilter en rate limiting. Pakketten die niets toevoegen aan het mesh worden niet doorgestuurd.',
      'Iedereen die een vaste repeater op het Nederlandse netwerk draait en geen MQTT of WiFi nodig heeft. Een goede standaardkeuze voor een relay op een dak of mast.',
      'Het filter stel je in met de Filter CLI of via USB Setup. Wil je dat je node vanzelf op de analyzers en de kaart verschijnt, kies dan de MQTT-firmware.'),
    en: entry('en', 'DutchMeshCore Firmware',
      'The DMC repeater build without MQTT: the official MeshCore repeater plus what keeps the Dutch network clean.',
      'Official MeshCore repeater plus the RF packet filter and rate limiting. Packets that add nothing to the mesh are not forwarded.',
      'Anyone running a fixed repeater on the Dutch network who does not need MQTT or WiFi. A solid default for a relay on a roof or mast.',
      'Configure the filter with the Filter CLI or USB Setup. Want your node to show up on the analyzers and the map on its own? Pick the MQTT firmware instead.'),
    de: entry('de', 'DutchMeshCore Firmware',
      'Der DMC-Repeater-Build ohne MQTT: der offizielle MeshCore-Repeater plus das, was das niederländische Netz sauber hält.',
      'Offizieller MeshCore-Repeater plus RF-Paketfilter und Rate Limiting. Pakete, die dem Mesh nichts bringen, werden nicht weitergeleitet.',
      'Alle, die einen festen Repeater im niederländischen Netz betreiben und kein MQTT oder WLAN brauchen. Eine gute Standardwahl für ein Relais auf Dach oder Mast.',
      'Den Filter stellst du mit der Filter CLI oder im USB Setup ein. Soll dein Node von selbst in den Analyzern und auf der Karte erscheinen, nimm die MQTT-Firmware.'),
  },

  dutchmeshcore: {
    nl: entry('nl', 'DutchMeshCore-MQTT-Firmware',
      'Alles uit de DMC-repeater-build plus een MQTT-observer-bridge: de node meldt wat hij hoort zelf aan de MQTT-brokers via WiFi.',
      'Repeater (of room-server) met de MQTT-observer-bridge, packetfilter per broker, buurpublicatie, WebConfig, SNMP, storingsmeldingen en OTA. Met "ota check" en "ota update" werk je de node via WiFi bij zonder opnieuw te flashen.',
      'Beheerders van een repeater of room-server met WiFi in de buurt die hun node op de analyzers en de kaart willen zien en het netwerk mee in kaart willen brengen.',
      'Kies bij een eerste installatie de "Full flash" (merged), want die schrijft de juiste partitietabel. Brokers stel je in met de MQTT CLI of via USB Setup.'),
    en: entry('en', 'DutchMeshCore-MQTT-Firmware',
      'Everything in the DMC repeater build plus an MQTT observer bridge: the node reports what it hears to the MQTT brokers over WiFi on its own.',
      'Repeater (or room server) with the MQTT observer bridge, per-broker packet filter, neighbour publishing, WebConfig, SNMP, fault alerts and OTA. Run "ota check" then "ota update" to upgrade over WiFi without re-flashing.',
      'Operators of a repeater or room server with WiFi nearby who want their node on the analyzers and the map, and want to help map the network.',
      'Use the "Full flash" (merged) image for a first install so the partition table is written. Set up brokers with the MQTT CLI or USB Setup.'),
    de: entry('de', 'DutchMeshCore-MQTT-Firmware',
      'Alles aus dem DMC-Repeater-Build plus eine MQTT-Observer-Bridge: Der Node meldet selbst über WLAN, was er hört, an die MQTT-Broker.',
      'Repeater (oder Room-Server) mit MQTT-Observer-Bridge, Paketfilter pro Broker, Nachbarn-Veröffentlichung, WebConfig, SNMP, Störungsmeldungen und OTA. Mit "ota check" und "ota update" aktualisierst du über WLAN ohne neu zu flashen.',
      'Betreiber eines Repeaters oder Room-Servers mit WLAN in der Nähe, die ihren Node in den Analyzern und auf der Karte sehen und das Netz mitkartieren wollen.',
      'Nimm bei der Erstinstallation den "Full flash" (merged), da er die richtige Partitionstabelle schreibt. Broker richtest du mit der MQTT CLI oder im USB Setup ein.'),
  },

  dutchmeshcore_packetlog: {
    nl: entry('nl', 'DutchMeshCore-PacketLog-Firmware',
      'De DMC-repeater-build die elk ontvangen en verzonden pakket naar de USB-seriële console logt.',
      'Repeater met per-pakket RX/TX-logging via USB (MESH_PACKET_LOGGING). Een externe tool, zoals een MC-naar-MQTT-bridge of logger, leest de live pakketdata via serieel in.',
      'Wie een repeater aan een computer of Raspberry Pi hangt en de pakketdata daar wil verwerken, zonder de MQTT-stack op het apparaat zelf. Ook handig voor debuggen.',
      'De node moet via USB aan de computer blijven hangen om de logging op te vangen.'),
    en: entry('en', 'DutchMeshCore-PacketLog-Firmware',
      'The DMC repeater build that logs every received and sent packet to the USB serial console.',
      'Repeater with per-packet RX/TX logging over USB (MESH_PACKET_LOGGING). An external tool, such as an MC-to-MQTT bridge or logger, ingests the live packet data over serial.',
      'Anyone hooking a repeater up to a computer or Raspberry Pi to process packet data there, without the MQTT stack on the device itself. Also handy for debugging.',
      'The node has to stay connected over USB for the log to be captured.'),
    de: entry('de', 'DutchMeshCore-PacketLog-Firmware',
      'Der DMC-Repeater-Build, der jedes empfangene und gesendete Paket auf die serielle USB-Konsole loggt.',
      'Repeater mit RX/TX-Logging pro Paket über USB (MESH_PACKET_LOGGING). Ein externes Tool, etwa eine MC-to-MQTT-Bridge oder ein Logger, liest die Live-Paketdaten über seriell ein.',
      'Alle, die einen Repeater an einen Computer oder Raspberry Pi hängen und die Paketdaten dort verarbeiten wollen, ohne MQTT-Stack auf dem Gerät. Auch praktisch zum Debuggen.',
      'Der Node muss per USB verbunden bleiben, damit das Log erfasst wird.'),
  },

  dutchmeshcore_companion: {
    nl: entry('nl', 'DutchMeshCore Companion Filter Firmware',
      'Companion-firmware voor gebruik met de MeshCore-app, met het DMC-ontvangstfilter erin.',
      'Een companion-radio (via BLE of WiFi) die met een ontvangstfilter rommel en ongewenste kanaalberichten verbergt voordat ze in de app verschijnen.',
      'Gebruikers van een handheld of companion-node die chatten via de app en minder spam en ruis in hun kanalen willen zien.',
      'Kies BLE voor een telefoon die direct verbindt, of WiFi als de app via het netwerk verbindt. Het filter gebruikt dezelfde opdrachten als Meshcomod.'),
    en: entry('en', 'DutchMeshCore Companion Filter Firmware',
      'Companion firmware for use with the MeshCore app, with the DMC receive filter built in.',
      'A companion radio (over BLE or WiFi) whose receive filter hides junk and unwanted channel messages before they reach the app.',
      'Users of a handheld or companion node who chat from the app and want less spam and noise in their channels.',
      'Pick BLE for a phone that pairs directly, or WiFi when the app connects over the network. The filter uses the same commands as Meshcomod.'),
    de: entry('de', 'DutchMeshCore Companion Filter Firmware',
      'Companion-Firmware für die MeshCore-App, mit eingebautem DMC-Empfangsfilter.',
      'Ein Companion-Radio (über BLE oder WLAN), dessen Empfangsfilter Müll und unerwünschte Kanalnachrichten ausblendet, bevor sie in der App landen.',
      'Nutzer eines Handhelds oder Companion-Nodes, die über die App chatten und weniger Spam und Rauschen in ihren Kanälen wollen.',
      'Nimm BLE für ein Telefon, das direkt koppelt, oder WLAN, wenn die App über das Netzwerk verbindet. Der Filter nutzt dieselben Befehle wie Meshcomod.'),
  },

  dutchmeshcore_comp_obs: {
    nl: entry('nl', 'DutchMeshCore Companion Observer Firmware',
      'Een companion-radio en een MQTT-observer in één image.',
      'De app verbindt via WiFi (TCP 5000) terwijl de node gehoorde pakketten doorstuurt naar de MQTT-brokers. Bevat het DMC-ontvangstfilter en deelt /mqtt.json en identiteit met de repeater-observer.',
      'Wie thuis een vaste companion-node via WiFi gebruikt en tegelijk het netwerk wil helpen observeren, zonder een aparte repeater neer te zetten.',
      'Nog niet op hardware getest. Geen OTA, SNMP, webportaal, storingsmeldingen of buurpublicatie. Kies bij een eerste installatie de "Full flash" (merged).'),
    en: entry('en', 'DutchMeshCore Companion Observer Firmware',
      'A companion radio and an MQTT observer in one image.',
      'The app connects over WiFi (TCP 5000) while the node forwards heard packets to the MQTT brokers. Includes the DMC receive filter and shares /mqtt.json and identity with the repeater observer.',
      'Anyone running a fixed companion node at home over WiFi who also wants to help observe the network, without setting up a separate repeater.',
      'Not yet tested on hardware. No OTA, SNMP, web portal, fault alerts or neighbour publishing. Use the "Full flash" (merged) image for a first install.'),
    de: entry('de', 'DutchMeshCore Companion Observer Firmware',
      'Ein Companion-Radio und ein MQTT-Observer in einem Image.',
      'Die App verbindet sich über WLAN (TCP 5000), während der Node gehörte Pakete an die MQTT-Broker weiterleitet. Enthält den DMC-Empfangsfilter und teilt /mqtt.json und Identität mit dem Repeater-Observer.',
      'Alle, die zu Hause einen festen Companion-Node über WLAN nutzen und gleichzeitig das Netz mitbeobachten wollen, ohne einen eigenen Repeater aufzustellen.',
      'Noch nicht auf Hardware getestet. Kein OTA, SNMP, Webportal, Störungsmeldungen oder Nachbarn-Veröffentlichung. Nimm bei der Erstinstallation den "Full flash" (merged).'),
  },

  meshcomod: {
    nl: entry('nl', 'Meshcomod (EV Fork) Companion Filter Firmware',
      'De companion-firmware van de meshcomod-fork van Elektr0Vodka, gebaseerd op MeshCore v1.18.',
      'De companion-CLI plus een ontvangstfilter dat rommel en ongewenste kanaalberichten voor de app verbergt. Op ESP32-borden ook een SNMP-agent en OTA via ota.dutchmeshcore.nl. Naast BLE en USB zijn er ook TCP- en Ethernet-varianten.',
      'Companion-gebruikers die een filter willen en graag nieuwe functies vroeg uitproberen.',
      'Pre-release (v1.18.0.1-dev), nog niet op hardware getest. Stel het filter in via USB Setup of met de Filter CLI (doel Meshcomod-companion).'),
    en: entry('en', 'Meshcomod (EV Fork) Companion Filter Firmware',
      'The companion firmware of Elektr0Vodka\'s meshcomod fork, based on MeshCore v1.18.',
      'The companion CLI plus a receive filter that hides junk and unwanted channel messages from the app. On ESP32 boards also an SNMP agent and OTA from ota.dutchmeshcore.nl. Besides BLE and USB there are TCP and Ethernet variants.',
      'Companion users who want a filter and like trying new features early.',
      'Pre-release (v1.18.0.1-dev), not yet tested on hardware. Set the filter in USB Setup or with the Filter CLI (Meshcomod companion target).'),
    de: entry('de', 'Meshcomod (EV Fork) Companion Filter Firmware',
      'Die Companion-Firmware des meshcomod-Forks von Elektr0Vodka, basierend auf MeshCore v1.18.',
      'Die Companion-CLI plus ein Empfangsfilter, der Müll und unerwünschte Kanalnachrichten vor der App verbirgt. Auf ESP32-Boards außerdem ein SNMP-Agent und OTA über ota.dutchmeshcore.nl. Neben BLE und USB gibt es TCP- und Ethernet-Varianten.',
      'Companion-Nutzer, die einen Filter wollen und neue Funktionen gern früh ausprobieren.',
      'Pre-Release (v1.18.0.1-dev), noch nicht auf Hardware getestet. Stelle den Filter im USB Setup oder mit der Filter CLI (Ziel Meshcomod-Companion) ein.'),
  },

  meshcore_dev: {
    nl: entry('nl', 'MeshCore.io Firmware (Officieel)',
      'De officiële MeshCore-firmware van meshcore.io. Alle DMC-builds bouwen hierop voort.',
      'De standaard companion-, repeater- en room-server-rollen, zonder DMC-toevoegingen.',
      'Wie de officiële versie wil, of een handheld gebruikt om te chatten via de app. Voor een companion is dit de gewone keuze.',
      'Draai je een repeater op het Nederlandse netwerk, overweeg dan de DMC-build met packetfilter en rate limiting.'),
    en: entry('en', 'MeshCore.io Firmware (Official)',
      'The official MeshCore firmware by meshcore.io. All DMC builds add to this base.',
      'The standard companion, repeater and room server roles, without any DMC additions.',
      'Anyone who wants the official release, or uses a handheld to chat from the app. For a companion this is the usual choice.',
      'Running a repeater on the Dutch network? Consider the DMC build with the packet filter and rate limiting.'),
    de: entry('de', 'MeshCore.io Firmware (Offiziell)',
      'Die offizielle MeshCore-Firmware von meshcore.io. Alle DMC-Builds bauen darauf auf.',
      'Die Standard-Rollen Companion, Repeater und Room-Server, ohne DMC-Ergänzungen.',
      'Alle, die die offizielle Version wollen oder mit einem Handheld über die App chatten. Für einen Companion ist das die übliche Wahl.',
      'Betreibst du einen Repeater im niederländischen Netz? Dann zieh den DMC-Build mit Paketfilter und Rate Limiting in Betracht.'),
  },
}

export function firmwareHelpFor(makerKey: string, lang: Lang): HelpContent | undefined {
  return (FIRMWARE_HELP as Record<string, Record<Lang, HelpContent>>)[makerKey]?.[lang]
}
