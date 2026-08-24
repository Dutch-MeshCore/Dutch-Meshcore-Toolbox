import type { Lang } from '../../i18n'

export type PanelHelpId =
  | 'location' | 'access' | 'room' | 'radio' | 'advert' | 'owner'
  | 'advanced' | 'filter' | 'region' | 'regionGating' | 'mqtt' | 'hardware'

export const PANEL_HELP_IDS: readonly PanelHelpId[] = [
  'location', 'access', 'room', 'radio', 'advert', 'owner',
  'advanced', 'filter', 'region', 'regionGating', 'mqtt', 'hardware',
]

export interface HelpField {
  label: string
  body: string
}

export interface HelpContent {
  title: string
  intro: string
  fields: HelpField[]
}

export const PANEL_HELP: Record<PanelHelpId, Record<Lang, HelpContent>> = {
  location: {
    nl: {
      title: 'Naam & Locatie',
      intro: 'Stelt de weergavenaam van de node in en de locatie die in adverts wordt uitgezonden. De naam is zichtbaar voor iedereen op het netwerk.',
      fields: [
        { label: 'Naam', body: 'De publieke naam van de node op het netwerk. De byteteller toont het verbruik; de limiet wordt kleiner zodra je een locatie instelt, omdat coordinaten mee in de advert passen.' },
        { label: 'Breedtegraad', body: 'Noord-zuidcoordinaat in decimale graden. Laat op 0 staan als je geen locatie wilt uitzenden.' },
        { label: 'Lengtegraad', body: 'Oost-westcoordinaat in decimale graden. Laat op 0 staan als je geen locatie wilt uitzenden.' },
        { label: 'Kies op kaart', body: 'Opent een kaart om de locatie aan te wijzen in plaats van coordinaten te typen. Vult breedte- en lengtegraad automatisch in.' },
      ],
    },
    en: {
      title: 'Name & Location',
      intro: 'Sets the display name of the node and the location broadcast in its adverts. The name is visible to everyone on the network.',
      fields: [
        { label: 'Name', body: 'The public name of the node on the network. The byte counter shows usage; the limit shrinks once you set a location, because the coordinates travel in the advert too.' },
        { label: 'Latitude', body: 'North-south coordinate in decimal degrees. Leave at 0 if you do not want to broadcast a location.' },
        { label: 'Longitude', body: 'East-west coordinate in decimal degrees. Leave at 0 if you do not want to broadcast a location.' },
        { label: 'Pick on map', body: 'Opens a map to point at the location instead of typing coordinates. Fills in latitude and longitude automatically.' },
      ],
    },
    de: {
      title: 'Name & Standort',
      intro: 'Legt den Anzeigenamen des Nodes und den in seinen Adverts gesendeten Standort fest. Der Name ist für alle im Netzwerk sichtbar.',
      fields: [
        { label: 'Name', body: 'Der öffentliche Name des Nodes im Netzwerk. Der Byte-Zähler zeigt die Auslastung; das Limit sinkt, sobald du einen Standort setzt, da die Koordinaten mit im Advert reisen.' },
        { label: 'Breitengrad', body: 'Nord-Süd-Koordinate in Dezimalgrad. Auf 0 lassen, wenn du keinen Standort senden möchtest.' },
        { label: 'Längengrad', body: 'Ost-West-Koordinate in Dezimalgrad. Auf 0 lassen, wenn du keinen Standort senden möchtest.' },
        { label: 'Auf Karte wählen', body: 'Öffnet eine Karte, um den Standort anzuzeigen, statt Koordinaten zu tippen. Füllt Breiten- und Längengrad automatisch aus.' },
      ],
    },
  },

  access: {
    nl: {
      title: 'Toegang',
      intro: 'Regelt wie het apparaat op afstand mag uitlezen of beheren. Gasten kunnen alleen-lezen meekijken; beheerders kunnen instellingen wijzigen.',
      fields: [
        { label: 'Alleen-lezen toegang toestaan', body: 'Laat clients zonder wachtwoord de status uitlezen, maar niets wijzigen. Zet dit uit om alle toegang af te schermen.' },
        { label: 'Gastwachtwoord', body: 'Wachtwoord voor alleen-lezen gasttoegang. Laat leeg om gasttoegang uit te schakelen.' },
        { label: 'Beheerderswachtwoord', body: 'Wachtwoord voor volledige beheertoegang. Laat leeg om het huidige wachtwoord te behouden; wissen op het apparaat gebeurt niet automatisch.' },
      ],
    },
    en: {
      title: 'Access',
      intro: 'Controls who may read or manage the device remotely. Guests get read-only visibility; admins can change settings.',
      fields: [
        { label: 'Allow read-only access', body: 'Lets clients read status without a password, but change nothing. Turn off to lock down all access.' },
        { label: 'Guest password', body: 'Password for read-only guest access. Leave blank to disable guest access.' },
        { label: 'Admin password', body: 'Password for full management access. Leave blank to keep the current one; it is not cleared automatically.' },
      ],
    },
    de: {
      title: 'Zugriff',
      intro: 'Legt fest, wer das Gerät aus der Ferne lesen oder verwalten darf. Gäste sehen nur lesend; Admins können Einstellungen ändern.',
      fields: [
        { label: 'Nur-Lese-Zugriff erlauben', body: 'Erlaubt Clients ohne Passwort den Status zu lesen, aber nichts zu ändern. Ausschalten, um jeglichen Zugriff zu sperren.' },
        { label: 'Gast-Passwort', body: 'Passwort für den Nur-Lese-Gastzugriff. Leer lassen, um den Gastzugriff zu deaktivieren.' },
        { label: 'Admin-Passwort', body: 'Passwort für den vollen Verwaltungszugriff. Leer lassen, um das aktuelle zu behalten; es wird nicht automatisch gelöscht.' },
      ],
    },
  },

  room: {
    nl: {
      title: 'Room server instellingen',
      intro: 'Instellingen die alleen gelden wanneer de node als room server draait. Een room server bewaart berichten zodat clients ze later kunnen ophalen.',
      fields: [
        { label: 'Herhalen inschakelen', body: 'Laat de room server ook als repeater werken en pakketten doorsturen naar de rest van het mesh. Uit: de server ontvangt alleen lokaal en herhaalt niets.' },
      ],
    },
    en: {
      title: 'Room server settings',
      intro: 'Settings that apply only when the node runs as a room server. A room server stores messages so clients can fetch them later.',
      fields: [
        { label: 'Enable repeat', body: 'Lets the room server also act as a repeater and forward packets on to the rest of the mesh. Off: the server only receives locally and repeats nothing.' },
      ],
    },
    de: {
      title: 'Room-Server-Einstellungen',
      intro: 'Einstellungen, die nur gelten, wenn der Node als Room-Server läuft. Ein Room-Server speichert Nachrichten, damit Clients sie später abrufen können.',
      fields: [
        { label: 'Weiterleiten aktivieren', body: 'Lässt den Room-Server auch als Repeater arbeiten und Pakete an den Rest des Mesh weiterleiten. Aus: der Server empfängt nur lokal und wiederholt nichts.' },
      ],
    },
  },

  radio: {
    nl: {
      title: 'Radio-instellingen',
      intro: 'Bepaalt de LoRa-parameters van de radio. Alle nodes die met elkaar praten moeten dezelfde frequentie, bandbreedte, spreading factor en coding rate gebruiken.',
      fields: [
        { label: 'Preset', body: 'Kiest een kant-en-klare set radio-instellingen voor jouw regio. Selecteren vult frequentie, bandbreedte, SF en coding rate in.' },
        { label: 'Frequentie (MHz)', body: 'Draaggolffrequentie. Moet binnen de voor jouw regio toegestane band vallen en gelijk zijn aan die van je buren.' },
        { label: 'Bandbreedte (kHz)', body: 'Kanaalbreedte. Breder is sneller maar minder gevoelig; smaller reikt verder maar is trager.' },
        { label: 'Spreading Factor', body: 'SF7 tot SF12. Hoger reikt verder en is robuuster, maar is trager en gebruikt meer zendtijd.' },
        { label: 'Coding Rate', body: 'Foutcorrectie (4/5 tot 4/8). Hoger is robuuster tegen storing maar trager.' },
        { label: 'TX-vermogen', body: 'Zendvermogen in dBm. Hoger bereik, maar blijf binnen de wettelijke limiet voor jouw band.' },
        { label: 'Duty cycle % (AF)', body: 'Begrenst hoeveel procent van de tijd de node mag zenden. De onderliggende AF-waarde wordt hieruit berekend; respecteer de regelgeving voor jouw band.' },
      ],
    },
    en: {
      title: 'Radio settings',
      intro: 'Sets the radio LoRa parameters. Every node that talks to each other must share the same frequency, bandwidth, spreading factor and coding rate.',
      fields: [
        { label: 'Preset', body: 'Picks a ready-made set of radio settings for your region. Selecting one fills in frequency, bandwidth, SF and coding rate.' },
        { label: 'Frequency (MHz)', body: 'Carrier frequency. Must fall in the band allowed for your region and match your neighbours.' },
        { label: 'Bandwidth (kHz)', body: 'Channel width. Wider is faster but less sensitive; narrower reaches further but is slower.' },
        { label: 'Spreading Factor', body: 'SF7 to SF12. Higher reaches further and is more robust, but is slower and uses more airtime.' },
        { label: 'Coding Rate', body: 'Forward error correction (4/5 to 4/8). Higher is more robust against interference but slower.' },
        { label: 'TX Power', body: 'Transmit power in dBm. More range, but stay within the legal limit for your band.' },
        { label: 'Duty cycle % (AF)', body: 'Caps the percentage of time the node may transmit. The underlying AF value is derived from this; respect the regulations for your band.' },
      ],
    },
    de: {
      title: 'Funkeinstellungen',
      intro: 'Legt die LoRa-Parameter des Funkmoduls fest. Alle Nodes, die miteinander kommunizieren, müssen dieselbe Frequenz, Bandbreite, Spreading Factor und Coding Rate verwenden.',
      fields: [
        { label: 'Preset', body: 'Wählt einen fertigen Satz Funkeinstellungen für deine Region. Die Auswahl füllt Frequenz, Bandbreite, SF und Coding Rate aus.' },
        { label: 'Frequenz (MHz)', body: 'Trägerfrequenz. Muss im für deine Region erlaubten Band liegen und mit deinen Nachbarn übereinstimmen.' },
        { label: 'Bandbreite (kHz)', body: 'Kanalbreite. Breiter ist schneller, aber weniger empfindlich; schmaler reicht weiter, ist aber langsamer.' },
        { label: 'Spreading Factor', body: 'SF7 bis SF12. Höher reicht weiter und ist robuster, aber langsamer und benötigt mehr Sendezeit.' },
        { label: 'Coding Rate', body: 'Vorwärtsfehlerkorrektur (4/5 bis 4/8). Höher ist robuster gegen Störungen, aber langsamer.' },
        { label: 'TX-Leistung', body: 'Sendeleistung in dBm. Mehr Reichweite, aber bleibe innerhalb des gesetzlichen Limits für dein Band.' },
        { label: 'Duty Cycle % (AF)', body: 'Begrenzt den Zeitanteil, in dem der Node senden darf. Der zugrunde liegende AF-Wert wird daraus berechnet; beachte die Vorschriften für dein Band.' },
      ],
    },
  },

  advert: {
    nl: {
      title: 'Adverteren',
      intro: 'Bepaalt hoe vaak de node zichzelf aankondigt op het netwerk. Adverts laten andere nodes weten dat deze node bestaat en waar routes naartoe lopen.',
      fields: [
        { label: 'Advert-interval (min)', body: 'Hoe vaak de node een directe advert stuurt, in minuten. 0 schakelt automatische adverts uit.' },
        { label: 'Flood-advert-interval (H)', body: 'Hoe vaak de node een flood-advert door het hele mesh stuurt, in uren. Vaker houdt routes vers maar kost meer zendtijd.' },
        { label: 'Flood max (hops)', body: 'Maximaal aantal hops dat een flood-advert mag afleggen voordat hij wordt gestopt. Houd dit laag om overbelasting van het mesh te voorkomen.' },
      ],
    },
    en: {
      title: 'Advertising',
      intro: 'Controls how often the node announces itself on the network. Adverts let other nodes know this node exists and where routes to it lead.',
      fields: [
        { label: 'Advert interval (min)', body: 'How often the node sends a direct advert, in minutes. 0 disables automatic adverts.' },
        { label: 'Flood advert interval (H)', body: 'How often the node sends a flood advert across the whole mesh, in hours. More often keeps routes fresh but costs more airtime.' },
        { label: 'Flood max (hops)', body: 'Maximum number of hops a flood advert may travel before it is stopped. Keep this low to avoid flooding the mesh.' },
      ],
    },
    de: {
      title: 'Bekanntmachung',
      intro: 'Legt fest, wie oft sich der Node im Netzwerk ankündigt. Adverts teilen anderen Nodes mit, dass dieser Node existiert und wohin Routen zu ihm führen.',
      fields: [
        { label: 'Advert-Intervall (Min)', body: 'Wie oft der Node ein direktes Advert sendet, in Minuten. 0 deaktiviert automatische Adverts.' },
        { label: 'Flood-Advert-Intervall (H)', body: 'Wie oft der Node ein Flood-Advert durch das gesamte Mesh sendet, in Stunden. Häufiger hält Routen frisch, kostet aber mehr Sendezeit.' },
        { label: 'Flood max (Hops)', body: 'Maximale Anzahl Hops, die ein Flood-Advert zurücklegen darf, bevor es gestoppt wird. Niedrig halten, um das Mesh nicht zu überfluten.' },
      ],
    },
  },

  owner: {
    nl: {
      title: 'Eigenaarsinformatie',
      intro: 'Vrije tekst over de eigenaar van de node, plus de publieke sleutel die de node identificeert. De eigenaarsinformatie is zichtbaar voor anderen.',
      fields: [
        { label: 'Eigenaarsinformatie', body: 'Vrije tekst, bijvoorbeeld naam en plaats. Een verticale streep ( | ) wordt op het apparaat een nieuwe regel. De byteteller bewaakt de limiet van 64 bytes.' },
        { label: 'Publieke sleutel', body: 'De unieke identiteit van de node. Met de knop Vanity kun je een sleutel genereren die met een gekozen reeks tekens begint.' },
      ],
    },
    en: {
      title: 'Owner info',
      intro: 'Free text about the owner of the node, plus the public key that identifies it. The owner info is visible to others.',
      fields: [
        { label: 'Owner info', body: 'Free text, for example name and city. A vertical bar ( | ) becomes a new line on the device. The byte counter guards the 64-byte limit.' },
        { label: 'Public key', body: 'The unique identity of the node. The Vanity button lets you generate a key that starts with a chosen run of characters.' },
      ],
    },
    de: {
      title: 'Eigentümerinformationen',
      intro: 'Freier Text über den Eigentümer des Nodes sowie der öffentliche Schlüssel, der ihn identifiziert. Die Eigentümerinformationen sind für andere sichtbar.',
      fields: [
        { label: 'Eigentümerinformationen', body: 'Freier Text, zum Beispiel Name und Ort. Ein senkrechter Strich ( | ) wird auf dem Gerät zu einer neuen Zeile. Der Byte-Zähler überwacht das Limit von 64 Bytes.' },
        { label: 'Öffentlicher Schlüssel', body: 'Die eindeutige Identität des Nodes. Mit der Schaltfläche Vanity kannst du einen Schlüssel erzeugen, der mit einer gewählten Zeichenfolge beginnt.' },
      ],
    },
  },

  advanced: {
    nl: {
      title: 'Geavanceerde instellingen',
      intro: 'Fijnafstelling van timing en radiogedrag. De standaardwaarden werken voor de meeste nodes; wijzig deze alleen als je weet wat het effect is.',
      fields: [
        { label: 'RX-vertraging (s)', body: 'Wachttijd voordat de node na ontvangst mag antwoorden. Helpt botsingen te spreiden.' },
        { label: 'TX-vertraging (s)', body: 'Wachttijd voordat de node een pakket doorstuurt. Spreidt de zendmomenten van repeaters.' },
        { label: 'Directe TX-vertraging (s)', body: 'Aparte zendvertraging voor direct geadresseerde pakketten.' },
        { label: 'Int.-drempel', body: 'Interferentiedrempel: hoe druk de band moet zijn voordat de node zendtijd uitstelt.' },
        { label: 'AGC-resetinterval (s)', body: 'Hoe vaak de automatische versterkingsregeling wordt teruggezet, in seconden.' },
        { label: 'Multi-ACKs', body: 'Regelt hoe meervoudige bevestigingen worden afgehandeld. Laat op de standaard staan tenzij geadviseerd.' },
        { label: 'Path hash-modus', body: 'Kiest hoe routes worden gehasht voor lusdetectie. Standaard (0) past voor de meeste netwerken.' },
        { label: 'Lusdetectie', body: 'Detecteert en stopt pakketten die in een lus rondgaan. Strict is het strengst.' },
        { label: 'Flood max unscoped (hops)', body: 'Maximale hops voor flood-pakketten zonder scope. Begrenst hoe ver ze reizen.' },
        { label: 'Flood max advert (hops)', body: 'Maximale hops specifiek voor flood-adverts, los van gewone floods.' },
        { label: 'Channel Activity Detection (CAD)', body: 'Luistert of de band vrij is voordat de node zendt. Vermindert botsingen, kost iets meer stroom.' },
        { label: 'Versterkte RX-gain', body: 'Verhoogt de ontvangstgevoeligheid van de radio. Kan zwakke signalen beter oppikken, maar ook meer ruis.' },
        { label: 'ADC-multiplier', body: 'Kalibratiefactor voor de accumeting. 0 gebruikt de standaard van het board.' },
      ],
    },
    en: {
      title: 'Advanced settings',
      intro: 'Fine-tuning of timing and radio behaviour. The defaults work for most nodes; change these only if you understand the effect.',
      fields: [
        { label: 'RX delay (s)', body: 'Wait time before the node may reply after receiving. Helps spread out collisions.' },
        { label: 'TX delay (s)', body: 'Wait time before the node forwards a packet. Staggers the transmit moments of repeaters.' },
        { label: 'Direct TX delay (s)', body: 'Separate transmit delay for directly addressed packets.' },
        { label: 'Int. threshold', body: 'Interference threshold: how busy the band must be before the node holds off airtime.' },
        { label: 'AGC reset interval (s)', body: 'How often the automatic gain control is reset, in seconds.' },
        { label: 'Multi ACKs', body: 'Controls how multiple acknowledgements are handled. Leave at the default unless advised.' },
        { label: 'Path hash mode', body: 'Chooses how routes are hashed for loop detection. Default (0) suits most networks.' },
        { label: 'Loop detect', body: 'Detects and stops packets circling in a loop. Strict is the most aggressive.' },
        { label: 'Flood max unscoped (hops)', body: 'Maximum hops for flood packets without a scope. Bounds how far they travel.' },
        { label: 'Flood max advert (hops)', body: 'Maximum hops specifically for flood adverts, separate from ordinary floods.' },
        { label: 'Channel Activity Detection (CAD)', body: 'Listens whether the band is clear before the node transmits. Reduces collisions at a small power cost.' },
        { label: 'Boosted RX gain', body: 'Raises the receive sensitivity of the radio. Can pick up weak signals better, but also more noise.' },
        { label: 'ADC multiplier', body: 'Calibration factor for the battery reading. 0 uses the board default.' },
      ],
    },
    de: {
      title: 'Erweiterte Einstellungen',
      intro: 'Feinabstimmung von Timing und Funkverhalten. Die Standardwerte passen für die meisten Nodes; ändere sie nur, wenn du die Wirkung verstehst.',
      fields: [
        { label: 'RX-Verzögerung (s)', body: 'Wartezeit, bevor der Node nach dem Empfang antworten darf. Hilft, Kollisionen zu verteilen.' },
        { label: 'TX-Verzögerung (s)', body: 'Wartezeit, bevor der Node ein Paket weiterleitet. Verteilt die Sendezeitpunkte von Repeatern.' },
        { label: 'Direkte TX-Verzögerung (s)', body: 'Separate Sendeverzögerung für direkt adressierte Pakete.' },
        { label: 'Int.-Schwelle', body: 'Interferenzschwelle: wie stark das Band belegt sein muss, bevor der Node Sendezeit zurückstellt.' },
        { label: 'AGC-Reset-Intervall (s)', body: 'Wie oft die automatische Verstärkungsregelung zurückgesetzt wird, in Sekunden.' },
        { label: 'Multi-ACKs', body: 'Steuert, wie mehrfache Bestätigungen behandelt werden. Auf dem Standard lassen, sofern nicht anders empfohlen.' },
        { label: 'Path-Hash-Modus', body: 'Wählt, wie Routen für die Schleifenerkennung gehasht werden. Standard (0) passt für die meisten Netze.' },
        { label: 'Schleifenerkennung', body: 'Erkennt und stoppt Pakete, die in einer Schleife kreisen. Strict ist am strengsten.' },
        { label: 'Flood max unscoped (Hops)', body: 'Maximale Hops für Flood-Pakete ohne Scope. Begrenzt, wie weit sie reisen.' },
        { label: 'Flood max advert (Hops)', body: 'Maximale Hops speziell für Flood-Adverts, getrennt von gewöhnlichen Floods.' },
        { label: 'Channel Activity Detection (CAD)', body: 'Prüft, ob das Band frei ist, bevor der Node sendet. Reduziert Kollisionen bei etwas höherem Stromverbrauch.' },
        { label: 'Verstärkte RX-Verstärkung', body: 'Erhöht die Empfangsempfindlichkeit des Funkmoduls. Kann schwache Signale besser aufnehmen, aber auch mehr Rauschen.' },
        { label: 'ADC-Multiplikator', body: 'Kalibrierungsfaktor für die Akku-Messung. 0 verwendet den Standard des Boards.' },
      ],
    },
  },

  filter: {
    nl: {
      title: 'Pakketfilter',
      intro: 'Alleen op aangepaste DMC-firmware. Laat de node pakketten van onbekende kanalen negeren, zodat hij alleen verkeer herhaalt dat je vertrouwt.',
      fields: [
        { label: 'Pakketten van onbekende kanalen herhalen', body: 'Aan: de node herhaalt ook verkeer van kanalen die hij niet kent. Uit: alleen bekende kanalen worden doorgestuurd.' },
        { label: 'Minimum hash-bits', body: 'Hoeveel bits van de kanaalhash moeten matchen voordat een pakket als bekend telt. Hoger is strenger.' },
        { label: 'Ook adverts blokkeren', body: 'Past het filter ook toe op advert-pakketten, niet alleen op berichten.' },
        { label: 'Geblokkeerde kanalen', body: 'Lijst met kanalen die de node nooit herhaalt (maximaal 16). Voeg een kanaal toe om het uit te sluiten.' },
        { label: 'Filter terugzetten naar standaard', body: 'Zet alle filterinstellingen terug naar de firmwarestandaard.' },
      ],
    },
    en: {
      title: 'Packet Filter',
      intro: 'Custom DMC firmware only. Lets the node ignore packets from unknown channels, so it only repeats traffic you trust.',
      fields: [
        { label: 'Repeat packets from unknown channels', body: 'On: the node also repeats traffic from channels it does not know. Off: only known channels are forwarded.' },
        { label: 'Minimum hash bits', body: 'How many bits of the channel hash must match before a packet counts as known. Higher is stricter.' },
        { label: 'Also block adverts', body: 'Applies the filter to advert packets too, not only to messages.' },
        { label: 'Blocked channels', body: 'List of channels the node never repeats (up to 16). Add a channel to exclude it.' },
        { label: 'Reset filter to defaults', body: 'Resets all filter settings to the firmware defaults.' },
      ],
    },
    de: {
      title: 'Paketfilter',
      intro: 'Nur bei angepasster DMC-Firmware. Lässt den Node Pakete von unbekannten Kanälen ignorieren, sodass er nur vertrauenswürdigen Verkehr wiederholt.',
      fields: [
        { label: 'Pakete von unbekannten Kanälen wiederholen', body: 'An: der Node wiederholt auch Verkehr von Kanälen, die er nicht kennt. Aus: nur bekannte Kanäle werden weitergeleitet.' },
        { label: 'Minimale Hash-Bits', body: 'Wie viele Bits des Kanal-Hashes übereinstimmen müssen, bevor ein Paket als bekannt gilt. Höher ist strenger.' },
        { label: 'Auch Adverts blockieren', body: 'Wendet den Filter auch auf Advert-Pakete an, nicht nur auf Nachrichten.' },
        { label: 'Blockierte Kanäle', body: 'Liste der Kanäle, die der Node nie wiederholt (bis zu 16). Füge einen Kanal hinzu, um ihn auszuschließen.' },
        { label: 'Filter auf Standard zurücksetzen', body: 'Setzt alle Filtereinstellungen auf die Firmware-Standardwerte zurück.' },
      ],
    },
  },

  region: {
    nl: {
      title: 'Regio',
      intro: 'Regio-instellingen bepalen onder welke scope de node opereert. Ze bakenen af welk verkeer bij welke regio hoort.',
      fields: [
        { label: 'Regiovlaggen', body: 'Schakelaars die de regioscopes van de node aan- of uitzetten. Zet de scopes aan die op jouw node van toepassing zijn.' },
      ],
    },
    en: {
      title: 'Region',
      intro: 'Region settings define the scope under which the node operates. They delimit which traffic belongs to which region.',
      fields: [
        { label: 'Region flags', body: 'Toggles that turn the node region scopes on or off. Enable the scopes that apply to your node.' },
      ],
    },
    de: {
      title: 'Regionen',
      intro: 'Regionseinstellungen legen den Bereich fest, in dem der Node arbeitet. Sie grenzen ab, welcher Verkehr zu welcher Region gehört.',
      fields: [
        { label: 'Regionsflags', body: 'Schalter, die die Regionsbereiche des Nodes ein- oder ausschalten. Aktiviere die Bereiche, die auf deinen Node zutreffen.' },
      ],
    },
  },

  regionGating: {
    nl: {
      title: 'Regiogating',
      intro: 'Alleen op DMC MQTT-observerfirmware. Regelt de dc.gate-drempel die bepaalt wanneer de node als gateway tussen regios optreedt op basis van naburige nodes.',
      fields: [
        { label: 'dc.gate inschakelen', body: 'Zet regiogating aan zodat de node kan optreden als poort tussen regios.' },
        { label: 'Drempel', body: 'Aantal buren dat nodig is voordat de gate activeert. Onder deze waarde blijft de gate dicht.' },
        { label: 'Hysterese', body: 'Marge die schommelen voorkomt: de gate gaat pas weer dicht als het aantal buren merkbaar onder de drempel zakt.' },
      ],
    },
    en: {
      title: 'Region gating',
      intro: 'DMC MQTT observer firmware only. Controls the dc.gate threshold that decides when the node acts as a gateway between regions, based on neighbouring nodes.',
      fields: [
        { label: 'Enable dc.gate', body: 'Turns region gating on so the node can act as a gate between regions.' },
        { label: 'Threshold', body: 'Number of neighbours needed before the gate activates. Below this value the gate stays closed.' },
        { label: 'Hysteresis', body: 'Margin that prevents flapping: the gate only closes again once the neighbour count drops noticeably below the threshold.' },
      ],
    },
    de: {
      title: 'Regionen-Gating',
      intro: 'Nur bei DMC-MQTT-Observer-Firmware. Steuert die dc.gate-Schwelle, die anhand benachbarter Nodes entscheidet, wann der Node als Gateway zwischen Regionen agiert.',
      fields: [
        { label: 'dc.gate aktivieren', body: 'Schaltet das Regionen-Gating ein, damit der Node als Tor zwischen Regionen agieren kann.' },
        { label: 'Schwelle', body: 'Anzahl der Nachbarn, die nötig ist, bevor das Gate aktiviert. Unter diesem Wert bleibt das Gate geschlossen.' },
        { label: 'Hysterese', body: 'Marge, die Flattern verhindert: das Gate schließt erst wieder, wenn die Nachbaranzahl merklich unter die Schwelle fällt.' },
      ],
    },
  },

  mqtt: {
    nl: {
      title: 'DMC MQTT-instellingen',
      intro: 'Alleen op MQTT-capabele firmware. Laat de node ontvangen verkeer en status naar een MQTT-broker uploaden, zodat het op kaarten en dashboards zichtbaar wordt. Elke veldgroep heeft ook eigen inline-uitleg.',
      fields: [
        { label: 'Pakkettypefilter', body: 'Selecteert welke pakkettypes worden geupload. Vink alleen de types aan die je wilt delen.' },
        { label: 'Statuspublicatie', body: 'Publiceert periodiek de status van de node. Deze instelling is write-only: de firmware rapporteert de huidige stand niet terug.' },
        { label: 'Buurtabellen', body: 'Publiceert tabellen van naburige nodes. Alleen op boards met PSRAM; stel ook het publicatie-interval in.' },
        { label: 'WiFi', body: 'SSID en wachtwoord voor de netwerkverbinding, plus power save. Wijzigen van SSID of wachtwoord vraagt een herstart.' },
        { label: 'Tijdzone', body: 'NTP-server en tijdzone (IANA of offset) voor correcte tijdstempels.' },
        { label: 'Broker-slots', body: 'Tot meerdere broker-configuraties met server, poort, inloggegevens, topic-template en token per slot.' },
        { label: 'Regio-override', body: 'Overschrijft de standaardscope die in topics wordt gebruikt. Laat leeg voor de standaard.' },
      ],
    },
    en: {
      title: 'DMC MQTT settings',
      intro: 'MQTT-capable firmware only. Lets the node upload received traffic and status to an MQTT broker, so it shows up on maps and dashboards. Each group of settings also carries its own inline hints.',
      fields: [
        { label: 'Packet-type filter', body: 'Selects which packet types are uploaded. Tick only the types you want to share.' },
        { label: 'Status publishing', body: 'Publishes the node status periodically. This setting is write-only: the firmware does not report the current state back.' },
        { label: 'Neighbor tables', body: 'Publishes tables of neighbouring nodes. PSRAM boards only; also set the publish interval.' },
        { label: 'WiFi', body: 'SSID and password for the network connection, plus power save. Changing SSID or password needs a reboot.' },
        { label: 'Timezone', body: 'NTP server and timezone (IANA or offset) for correct timestamps.' },
        { label: 'Broker slots', body: 'Up to several broker configurations with server, port, credentials, topic template and token per slot.' },
        { label: 'Region override', body: 'Overrides the default scope used in topics. Leave blank for the default.' },
      ],
    },
    de: {
      title: 'DMC-MQTT-Einstellungen',
      intro: 'Nur bei MQTT-fähiger Firmware. Lässt den Node empfangenen Verkehr und Status an einen MQTT-Broker senden, sodass er auf Karten und Dashboards erscheint. Jede Gruppe von Einstellungen trägt zusätzlich eigene Inline-Hinweise.',
      fields: [
        { label: 'Pakettyp-Filter', body: 'Wählt aus, welche Pakettypen hochgeladen werden. Hake nur die Typen an, die du teilen möchtest.' },
        { label: 'Statusveröffentlichung', body: 'Veröffentlicht den Node-Status periodisch. Diese Einstellung ist write-only: die Firmware meldet den aktuellen Stand nicht zurück.' },
        { label: 'Nachbartabellen', body: 'Veröffentlicht Tabellen benachbarter Nodes. Nur auf PSRAM-Boards; lege auch das Veröffentlichungsintervall fest.' },
        { label: 'WLAN', body: 'SSID und Passwort für die Netzwerkverbindung sowie Power Save. Das Ändern von SSID oder Passwort erfordert einen Neustart.' },
        { label: 'Zeitzone', body: 'NTP-Server und Zeitzone (IANA oder Offset) für korrekte Zeitstempel.' },
        { label: 'Broker-Slots', body: 'Bis zu mehrere Broker-Konfigurationen mit Server, Port, Zugangsdaten, Topic-Vorlage und Token pro Slot.' },
        { label: 'Regions-Override', body: 'Überschreibt den in Topics verwendeten Standardbereich. Leer lassen für den Standard.' },
      ],
    },
  },

  hardware: {
    nl: {
      title: 'Seriele bridge & hardware',
      intro: 'Hardwarespecifieke opties voor pakketbridging en versterking. Alleen relevant als je board de betreffende functie ondersteunt.',
      fields: [
        { label: 'Pakketbridge', body: 'Stuurt pakketten door via een seriele of ESP-NOW-verbinding. Stel het bridgetype, de vertraging, de bron, de RS232-baudrate en (voor ESP-NOW) kanaal en geheime sleutel in.' },
        { label: 'Externe FEM-gain', body: 'Instellingen voor een externe front-end module die het radiosignaal versterkt.' },
        { label: 'LR2021 side-detectoren', body: 'Extra spreading factors die de LR2021-radio parallel bewaakt, komma-gescheiden (bijv. 9,11).' },
      ],
    },
    en: {
      title: 'Serial bridge & hardware',
      intro: 'Hardware-specific options for packet bridging and amplification. Only relevant if your board supports the feature in question.',
      fields: [
        { label: 'Packet bridge', body: 'Forwards packets over a serial or ESP-NOW link. Set the bridge type, delay, source, RS232 baud rate and (for ESP-NOW) channel and secret.' },
        { label: 'External FEM gain', body: 'Settings for an external front-end module that amplifies the radio signal.' },
        { label: 'LR2021 side detectors', body: 'Extra spreading factors the LR2021 radio watches in parallel, comma-separated (e.g. 9,11).' },
      ],
    },
    de: {
      title: 'Serielle Bridge & Hardware',
      intro: 'Hardwarespezifische Optionen für Paket-Bridging und Verstärkung. Nur relevant, wenn dein Board die jeweilige Funktion unterstützt.',
      fields: [
        { label: 'Paket-Bridge', body: 'Leitet Pakete über eine serielle oder ESP-NOW-Verbindung weiter. Lege Bridge-Typ, Verzögerung, Quelle, RS232-Baudrate und (für ESP-NOW) Kanal und geheimen Schlüssel fest.' },
        { label: 'Externe FEM-Verstärkung', body: 'Einstellungen für ein externes Front-End-Modul, das das Funksignal verstärkt.' },
        { label: 'LR2021-Seitendetektoren', body: 'Zusätzliche Spreading Factors, die das LR2021-Funkmodul parallel überwacht, kommagetrennt (z. B. 9,11).' },
      ],
    },
  },
}
