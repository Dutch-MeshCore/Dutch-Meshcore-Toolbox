import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { useToast } from '../hooks/useToast'
import Toast from '../components/ui/Toast'
import FilterSettingsForm from '../components/config/FilterSettingsForm'
import { useSerialDevice } from '../hooks/useSerialDevice'
import {
  PAYLOAD_TYPES,
  defaultFilterSettings,
  parseFilterBlockedCounts,
  parseFilterCount,
  type FilterBlockedCounts,
} from '../lib/config/filterCommands'

const copy = {
  en: {
    title: 'Repeater Packet Filter – in depth',
    intro: 'The packet filter selectively blocks forwarded packets on a DutchMeshCore repeater or room server, to keep the mesh clean. This page explains every setting and how to use it. It is available only in the custom DMC firmware.',
    bannerTitle: 'Custom DMC firmware',
    bannerSub: 'The packet filter is only available in the custom DutchMeshCore repeater and room-server firmware.',

    s_what_h: 'What the filter does',
    s_what: 'The filter can block forwarded packets based on hop count, per-type rate limits, minimum path-hash size, group-channel name, malformed group text, and packet type.',
    rule1: 'The filter is disabled by default; you have to enable it.',
    rule2: 'Only forwarded packets are filtered.',
    rule3: 'Direct-routed packets always bypass the filter, and priority packets involving known ACL contacts are exempt too.',

    s_enable_h: 'Enabling and resetting',
    s_enable: 'Use "filter" to show the status, "filter on" / "filter off" to toggle it, and "filter reset" to restore every setting to its default.',

    s_types_h: 'Packet types',
    s_types: 'Every rule targets a packet type by its two-digit ID. "filter types" lists them on the device:',

    s_hops_h: 'Hop-count filtering',
    s_hops: 'A packet that has already travelled more hops than the limit for its type is dropped. Set a limit with "filter hops <type> <max>", e.g. "filter hops 05 16". Show the current limits with "filter hops". Defaults:',

    s_rate_h: 'Rate limiting',
    s_rate: 'Caps how many packets of a type are forwarded within a time window. Configure with "filter rate <type> <limit> <seconds>": "filter rate 05 20 60" allows 20 Group Text packets every 60 seconds. A limit of 0 disables rate limiting for that type. Defaults:',

    s_channel_h: 'Channel blocking',
    s_channel: 'Stops a repeater from forwarding a noisy group channel: "filter channel add <name>", "filter channel remove <name>", "filter channel list". Up to 16 channels can be blocked. Only Group Text (GRP_TXT) packets are affected, and the repeater still receives them; it just does not forward them.',

    s_hash_h: 'Minimum path-hash size',
    s_hash: 'Discards packets whose path hash is smaller than the configured number of bytes: "filter hash <1|2|3>", default 1. Note that "filter hash 2" blocks (does not forward) all legacy packets that do not use multibyte paths.',

    s_malformed_h: 'Malformed group-message filtering',
    s_malformed: 'When on, Group Text packets are validated for a valid timestamp within ±1 week, a valid message structure, non-empty text, and valid UTF-8: "filter malformed on" / "filter malformed off", default off.',

    s_stats_h: 'Statistics',
    s_stats: 'The "filter" status line reports blocked counts, e.g. "Filter on: Blocked [ Hops: 3 | Rate: 12 | Channel: 1 | Hash: 0 | Malformed: 2 ]". "filter count" reports per-type counts: "05: 2,10" means packet type 05 (Group Text) had 2 blocked by the hop limit and 10 by rate limiting. Statistics reset together with the repeater statistics.',

    s_persist_h: 'Persistent configuration',
    s_persist: 'All filter settings are stored in /filter_prefs and survive reboots: the enabled state, hop limits, rate limits, blocked channels, minimum hash size, and malformed filtering.',

    s_reco_h: 'Recommended configurations',
    s_reco_note: 'To block the July 2026 spammer, make sure to include "filter rate 02 5 60" (it is in the busy example, not the typical one).',
    reco_typical_h: 'Typical public repeater',
    reco_busy_h: 'Busy or abused repeater',
    reco_busy_note: 'Note: "filter hash 2" will block all legacy packets that are not using multibyte paths.',
    reco_noisy_h: 'Blocking a noisy channel',
    reco_noisy: 'Add the channel, then watch "filter" and "filter count" to understand the effect. The repeater still receives the packets; it just stops forwarding them to other repeaters and companions.',

    tbl_id: 'ID', tbl_type: 'Type', tbl_maxhops: 'Max hops', tbl_limit: 'Limit', tbl_window: 'Window (s)',
    links_h: 'Related tools',
    go_cli: 'Filter CLI generator', go_usb: 'USB Setup', go_wiki: 'CLI Wiki',

    live_h: 'Manage your node live',
    live_intro: 'Connect a filter-capable node over USB and read, edit, and apply the filter directly.',
    live_connect: 'Connect', live_connecting: 'Connecting…',
    live_disconnect: 'Disconnect', live_apply: 'Apply to device', live_reread: 'Re-read from device',
    live_unsupported: 'Your browser does not support the Web Serial API. Please use Chrome or Edge on desktop.',
    live_nofilter: 'This device is connected but its firmware has no packet filter. Flash the custom DMC repeater firmware to use it.',
    live_applied: 'Filter applied to device.',
    live_stats_h: 'Live blocked counts', live_stats_refresh: 'Refresh stats',
    live_stats_updated: (t: string) => `updated ${t}`,
    live_stats_toast: 'Stats refreshed.', live_stats_error: 'Could not read stats from the device.',
    stat_hops: 'Hops', stat_rate: 'Rate', stat_channel: 'Channel', stat_hash: 'Hash', stat_malformed: 'Malformed',
  },
  nl: {
    title: 'Repeater-pakketfilter – in detail',
    intro: 'Het pakketfilter blokkeert selectief doorgestuurde pakketten op een DutchMeshCore-repeater of room-server, om het mesh schoon te houden. Deze pagina legt elke instelling uit en hoe je die gebruikt. Het is alleen beschikbaar in de aangepaste DMC-firmware.',
    bannerTitle: 'Aangepaste DMC-firmware',
    bannerSub: 'Het pakketfilter is alleen beschikbaar in de aangepaste DutchMeshCore repeater- en room-server-firmware.',

    s_what_h: 'Wat het filter doet',
    s_what: 'Het filter kan doorgestuurde pakketten blokkeren op basis van hop-aantal, snelheidslimieten per type, minimale path-hash-grootte, groepskanaalnaam, ongeldige groepstekst en pakkettype.',
    rule1: 'Het filter staat standaard uit; je moet het zelf inschakelen.',
    rule2: 'Alleen doorgestuurde pakketten worden gefilterd.',
    rule3: 'Direct gerouteerde pakketten omzeilen het filter altijd, en prioriteitspakketten met bekende ACL-contacten zijn eveneens vrijgesteld.',

    s_enable_h: 'Inschakelen en resetten',
    s_enable: 'Gebruik "filter" om de status te tonen, "filter on" / "filter off" om te schakelen en "filter reset" om alle instellingen terug te zetten naar de standaardwaarden.',

    s_types_h: 'Pakkettypes',
    s_types: 'Elke regel richt zich op een pakkettype via het tweecijferige ID. "filter types" toont ze op het apparaat:',

    s_hops_h: 'Filteren op hop-aantal',
    s_hops: 'Een pakket dat al meer hops heeft afgelegd dan de limiet voor zijn type, wordt weggegooid. Stel een limiet in met "filter hops <type> <max>", bijv. "filter hops 05 16". Toon de huidige limieten met "filter hops". Standaardwaarden:',

    s_rate_h: 'Snelheidslimiet',
    s_rate: 'Begrenst hoeveel pakketten van een type binnen een tijdvenster worden doorgestuurd. Stel in met "filter rate <type> <limiet> <seconden>": "filter rate 05 20 60" staat 20 Group Text-pakketten per 60 seconden toe. Een limiet van 0 schakelt de snelheidslimiet voor dat type uit. Standaardwaarden:',

    s_channel_h: 'Kanalen blokkeren',
    s_channel: 'Voorkomt dat een repeater een druk groepskanaal doorstuurt: "filter channel add <naam>", "filter channel remove <naam>", "filter channel list". Je kunt maximaal 16 kanalen blokkeren. Alleen Group Text (GRP_TXT)-pakketten worden geraakt, en de repeater ontvangt ze nog steeds; hij stuurt ze alleen niet door.',

    s_hash_h: 'Minimale path-hash-grootte',
    s_hash: 'Gooit pakketten weg waarvan de path-hash kleiner is dan het ingestelde aantal bytes: "filter hash <1|2|3>", standaard 1. Let op: "filter hash 2" blokkeert (stuurt niet door) alle legacy-pakketten die geen multibyte-paden gebruiken.',

    s_malformed_h: 'Filteren op ongeldige groepsberichten',
    s_malformed: 'Als dit aanstaat, worden Group Text-pakketten gecontroleerd op een geldige tijdstempel binnen ±1 week, een geldige berichtstructuur, niet-lege tekst en geldige UTF-8: "filter malformed on" / "filter malformed off", standaard uit.',

    s_stats_h: 'Statistieken',
    s_stats: 'De statusregel "filter" toont het aantal geblokkeerde pakketten, bijv. "Filter on: Blocked [ Hops: 3 | Rate: 12 | Channel: 1 | Hash: 0 | Malformed: 2 ]". "filter count" toont de aantallen per type: "05: 2,10" betekent dat pakkettype 05 (Group Text) 2 keer door de hop-limiet en 10 keer door de snelheidslimiet is geblokkeerd. Statistieken worden samen met de repeater-statistieken gereset.',

    s_persist_h: 'Blijvende configuratie',
    s_persist: 'Alle filterinstellingen worden opgeslagen in /filter_prefs en blijven na een herstart bewaard: de aan/uit-status, hop-limieten, snelheidslimieten, geblokkeerde kanalen, minimale hash-grootte en het filteren op ongeldige berichten.',

    s_reco_h: 'Aanbevolen configuraties',
    s_reco_note: 'Om de spammer van juli 2026 te blokkeren, neem "filter rate 02 5 60" op (het staat in het drukke voorbeeld, niet in het typische).',
    reco_typical_h: 'Typische publieke repeater',
    reco_busy_h: 'Drukke of misbruikte repeater',
    reco_busy_note: 'Let op: "filter hash 2" blokkeert alle legacy-pakketten die geen multibyte-paden gebruiken.',
    reco_noisy_h: 'Een druk kanaal blokkeren',
    reco_noisy: 'Voeg het kanaal toe en houd daarna "filter" en "filter count" in de gaten om het effect te zien. De repeater ontvangt de pakketten nog steeds; hij stopt alleen met doorsturen naar andere repeaters en companions.',

    tbl_id: 'ID', tbl_type: 'Type', tbl_maxhops: 'Max. hops', tbl_limit: 'Limiet', tbl_window: 'Venster (s)',
    links_h: 'Gerelateerde tools',
    go_cli: 'Filter CLI-generator', go_usb: 'USB-instellingen', go_wiki: 'CLI-wiki',

    live_h: 'Je node live beheren',
    live_intro: 'Verbind een filter-geschikte node via USB en lees, bewerk en pas het filter direct toe.',
    live_connect: 'Verbinden', live_connecting: 'Verbinden…',
    live_disconnect: 'Verbinding verbreken', live_apply: 'Toepassen op apparaat', live_reread: 'Opnieuw inlezen',
    live_unsupported: 'Je browser ondersteunt de Web Serial API niet. Gebruik Chrome of Edge op een desktop.',
    live_nofilter: 'Dit apparaat is verbonden, maar de firmware heeft geen pakketfilter. Flash de aangepaste DMC-repeater-firmware om het te gebruiken.',
    live_applied: 'Filter toegepast op apparaat.',
    live_stats_h: 'Live geblokkeerde aantallen', live_stats_refresh: 'Statistieken verversen',
    live_stats_updated: (t: string) => `bijgewerkt om ${t}`,
    live_stats_toast: 'Statistieken bijgewerkt.', live_stats_error: 'Kon statistieken niet van het apparaat lezen.',
    stat_hops: 'Hops', stat_rate: 'Snelheid', stat_channel: 'Kanaal', stat_hash: 'Hash', stat_malformed: 'Ongeldig',
  },
  de: {
    title: 'Repeater-Paketfilter – im Detail',
    intro: 'Der Paketfilter blockiert gezielt weitergeleitete Pakete auf einem DutchMeshCore-Repeater oder Room-Server, um das Mesh sauber zu halten. Diese Seite erklärt jede Einstellung und ihre Anwendung. Er ist nur in der angepassten DMC-Firmware verfügbar.',
    bannerTitle: 'Angepasste DMC-Firmware',
    bannerSub: 'Der Paketfilter ist nur in der angepassten DutchMeshCore repeater- und room-server-Firmware verfügbar.',

    s_what_h: 'Was der Filter macht',
    s_what: 'Der Filter kann weitergeleitete Pakete anhand von Hop-Anzahl, Ratenlimits pro Typ, minimaler Path-Hash-Größe, Gruppenkanalname, fehlerhaftem Gruppentext und Pakettyp blockieren.',
    rule1: 'Der Filter ist standardmäßig deaktiviert; du musst ihn aktivieren.',
    rule2: 'Nur weitergeleitete Pakete werden gefiltert.',
    rule3: 'Direkt geroutete Pakete umgehen den Filter immer, und Prioritätspakete mit bekannten ACL-Kontakten sind ebenfalls ausgenommen.',

    s_enable_h: 'Aktivieren und Zurücksetzen',
    s_enable: 'Nutze "filter", um den Status anzuzeigen, "filter on" / "filter off" zum Umschalten und "filter reset", um alle Einstellungen auf die Standardwerte zurückzusetzen.',

    s_types_h: 'Pakettypen',
    s_types: 'Jede Regel bezieht sich über die zweistellige ID auf einen Pakettyp. "filter types" listet sie auf dem Gerät auf:',

    s_hops_h: 'Filtern nach Hop-Anzahl',
    s_hops: 'Ein Paket, das bereits mehr Hops zurückgelegt hat als das Limit für seinen Typ, wird verworfen. Setze ein Limit mit "filter hops <Typ> <max>", z. B. "filter hops 05 16". Zeige die aktuellen Limits mit "filter hops". Standardwerte:',

    s_rate_h: 'Ratenlimit',
    s_rate: 'Begrenzt, wie viele Pakete eines Typs innerhalb eines Zeitfensters weitergeleitet werden. Konfiguriere mit "filter rate <Typ> <Limit> <Sekunden>": "filter rate 05 20 60" erlaubt 20 Group-Text-Pakete alle 60 Sekunden. Ein Limit von 0 deaktiviert das Ratenlimit für diesen Typ. Standardwerte:',

    s_channel_h: 'Kanäle blockieren',
    s_channel: 'Hindert einen Repeater daran, einen lauten Gruppenkanal weiterzuleiten: "filter channel add <Name>", "filter channel remove <Name>", "filter channel list". Bis zu 16 Kanäle können blockiert werden. Nur Group-Text (GRP_TXT)-Pakete sind betroffen, und der Repeater empfängt sie weiterhin; er leitet sie nur nicht weiter.',

    s_hash_h: 'Minimale Path-Hash-Größe',
    s_hash: 'Verwirft Pakete, deren Path-Hash kleiner ist als die konfigurierte Anzahl Bytes: "filter hash <1|2|3>", Standard 1. Beachte: "filter hash 2" blockiert (leitet nicht weiter) alle Legacy-Pakete, die keine Multibyte-Pfade verwenden.',

    s_malformed_h: 'Filtern fehlerhafter Gruppennachrichten',
    s_malformed: 'Wenn aktiv, werden Group-Text-Pakete auf einen gültigen Zeitstempel innerhalb von ±1 Woche, eine gültige Nachrichtenstruktur, nicht leeren Text und gültiges UTF-8 geprüft: "filter malformed on" / "filter malformed off", Standard aus.',

    s_stats_h: 'Statistiken',
    s_stats: 'Die Statuszeile "filter" meldet die blockierten Anzahlen, z. B. "Filter on: Blocked [ Hops: 3 | Rate: 12 | Channel: 1 | Hash: 0 | Malformed: 2 ]". "filter count" meldet die Anzahlen pro Typ: "05: 2,10" bedeutet, dass Pakettyp 05 (Group Text) 2-mal durch das Hop-Limit und 10-mal durch das Ratenlimit blockiert wurde. Die Statistiken werden zusammen mit den Repeater-Statistiken zurückgesetzt.',

    s_persist_h: 'Dauerhafte Konfiguration',
    s_persist: 'Alle Filtereinstellungen werden in /filter_prefs gespeichert und überstehen Neustarts: der Aktiv-Status, Hop-Limits, Ratenlimits, blockierte Kanäle, minimale Hash-Größe und das Filtern fehlerhafter Nachrichten.',

    s_reco_h: 'Empfohlene Konfigurationen',
    s_reco_note: 'Um den Spammer vom Juli 2026 zu blockieren, füge unbedingt "filter rate 02 5 60" hinzu (es steht im Beispiel für den ausgelasteten Repeater, nicht im typischen).',
    reco_typical_h: 'Typischer öffentlicher Repeater',
    reco_busy_h: 'Ausgelasteter oder missbrauchter Repeater',
    reco_busy_note: 'Hinweis: "filter hash 2" blockiert alle Legacy-Pakete, die keine Multibyte-Pfade verwenden.',
    reco_noisy_h: 'Einen lauten Kanal blockieren',
    reco_noisy: 'Füge den Kanal hinzu und beobachte dann "filter" und "filter count", um den Effekt zu verstehen. Der Repeater empfängt die Pakete weiterhin; er leitet sie nur nicht mehr an andere Repeater und Companions weiter.',

    tbl_id: 'ID', tbl_type: 'Typ', tbl_maxhops: 'Max. Hops', tbl_limit: 'Limit', tbl_window: 'Fenster (s)',
    links_h: 'Verwandte Tools',
    go_cli: 'Filter-CLI-Generator', go_usb: 'USB Setup', go_wiki: 'CLI-Wiki',

    live_h: 'Deinen Knoten live verwalten',
    live_intro: 'Verbinde einen filterfähigen Knoten über USB und lies, bearbeite und wende den Filter direkt an.',
    live_connect: 'Verbinden', live_connecting: 'Verbinde…',
    live_disconnect: 'Trennen', live_apply: 'Auf Gerät anwenden', live_reread: 'Erneut einlesen',
    live_unsupported: 'Dein Browser unterstützt die Web Serial API nicht. Bitte nutze Chrome oder Edge am Desktop.',
    live_nofilter: 'Dieses Gerät ist verbunden, aber seine Firmware hat keinen Paketfilter. Flashe die angepasste DMC-Repeater-Firmware, um ihn zu nutzen.',
    live_applied: 'Filter auf das Gerät angewendet.',
    live_stats_h: 'Live blockierte Anzahlen', live_stats_refresh: 'Statistiken aktualisieren',
    live_stats_updated: (t: string) => `aktualisiert um ${t}`,
    live_stats_toast: 'Statistiken aktualisiert.', live_stats_error: 'Statistiken konnten nicht vom Gerät gelesen werden.',
    stat_hops: 'Hops', stat_rate: 'Rate', stat_channel: 'Kanal', stat_hash: 'Hash', stat_malformed: 'Fehlerhaft',
  },
} as const

// Firmware defaults, sourced from the shared model so they match the device.
const DEFAULTS = defaultFilterSettings()

const TYPICAL_CONFIG = 'filter on\nfilter hash 1\nfilter malformed on\nfilter rate 05 20 60\nfilter rate 02 20 60\nfilter hops 05 32'
const BUSY_CONFIG = 'filter on\nfilter hash 2\nfilter malformed on\nfilter rate 05 10 60\nfilter rate 02 5 60\nfilter rate 04 5 60\nfilter hops 05 16\nfilter hops 02 16\nfilter hops 04 8'

export default function FilterGuidePage() {
  const { lang } = useLang()
  const c = copy[lang]

  const { supported, state, device, busy, connect, disconnect, setData, sendCommand, updateDevice, readFilter } = useSerialDevice()
  const { toasts, toast } = useToast()
  const [blocked, setBlocked] = useState<FilterBlockedCounts | null>(null)
  const [perType, setPerType] = useState<Record<number, { hops: number; rate: number }>>({})
  const [statsAt, setStatsAt] = useState<string | null>(null)

  async function refreshStats(notify = true) {
    try {
      const b = parseFilterBlockedCounts(await sendCommand('filter'))
      const pt = parseFilterCount(await sendCommand('filter count'))
      setBlocked(b)
      setPerType(pt)
      setStatsAt(new Date().toLocaleTimeString())
      if (notify) toast(c.live_stats_toast, 'ok')
    } catch {
      if (notify) toast(c.live_stats_error, 'err')
    }
  }

  async function applyFilter() {
    await setData()
    await refreshStats(false)
    toast(c.live_applied, 'ok')
  }

  return (
    <>
      <Navbar />
      <main className="page mqtt-page">
        <div className="fw-banner">
          <span className="fw-banner-icon">🇳🇱</span>
          <div className="fw-banner-text">
            <strong>{c.bannerTitle}</strong>
            <p>{c.bannerSub}</p>
          </div>
          <a href="https://dutchmeshcore.nl" target="_blank" rel="noopener noreferrer">dutchmeshcore.nl</a>
        </div>

        <div className="device-page-header">
          <h1>🛡 {c.title}</h1>
          <p>{c.intro}</p>
        </div>

        <div className="panel">
          <div className="panel-legend">{c.live_h}</div>
          <p>{c.live_intro}</p>
          {!supported ? (
            <div className="info-box"><span>⚠</span><p>{c.live_unsupported}</p></div>
          ) : state !== 'connected' ? (
            <button className="btn btn-accent" onClick={connect} disabled={state === 'connecting'}>
              {state === 'connecting' ? c.live_connecting : c.live_connect}
            </button>
          ) : !device?.filter ? (
            <>
              <div className="info-box"><span>ℹ</span><p>{c.live_nofilter}</p></div>
              <button className="btn" onClick={disconnect}>{c.live_disconnect}</button>
            </>
          ) : (
            <>
              <FilterSettingsForm value={device.filter} onChange={f => updateDevice({ filter: f })} />
              <div className="gs-links" style={{ marginTop: '.6rem' }}>
                <button className="btn btn-accent" onClick={applyFilter}>{c.live_apply}</button>
                <button className="btn btn-sm" onClick={readFilter}>{c.live_reread}</button>
                <button className="btn btn-sm" onClick={disconnect}>{c.live_disconnect}</button>
              </div>

              <div className="output-header" style={{ marginTop: '1rem' }}>
                <p className="section-title">
                  {c.live_stats_h}
                  {statsAt && <span className="field-hint"> · {c.live_stats_updated(statsAt)}</span>}
                </p>
                <button className="btn btn-sm" onClick={() => refreshStats()}>{c.live_stats_refresh}</button>
              </div>
              {blocked && (
                <p>
                  {c.stat_hops}: {blocked.hops} | {c.stat_rate}: {blocked.rate} | {c.stat_channel}: {blocked.channel} | {c.stat_hash}: {blocked.hash} | {c.stat_malformed}: {blocked.malformed}
                </p>
              )}
              {Object.keys(perType).length > 0 && (
                <table className="filter-type-table">
                  <thead><tr><th>{c.tbl_type}</th><th>{c.stat_hops}</th><th>{c.stat_rate}</th></tr></thead>
                  <tbody>
                    {Object.entries(perType).map(([idx, v]) => {
                      const pt = PAYLOAD_TYPES[Number(idx)]
                      return (
                        <tr key={idx}>
                          <td><code>{idx.padStart(2, '0')}</code> {pt?.name ?? ''}</td>
                          <td>{v.hops}</td><td>{v.rate}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
          {busy && <p className="field-hint">{busy}</p>}
        </div>

        <div className="panel">
          <div className="panel-legend">{c.s_what_h}</div>
          <p>{c.s_what}</p>
          <div className="info-box privacy-box"><span>ℹ</span><p>{c.rule1} {c.rule2} {c.rule3}</p></div>
        </div>

        <div className="panel"><div className="panel-legend">{c.s_enable_h}</div><p>{c.s_enable}</p></div>

        <div className="panel">
          <div className="panel-legend">{c.s_types_h}</div>
          <p>{c.s_types}</p>
          <table className="filter-type-table">
            <thead><tr><th>{c.tbl_id}</th><th>{c.tbl_type}</th></tr></thead>
            <tbody>
              {PAYLOAD_TYPES.map(pt => (
                <tr key={pt.index}><td><code>{String(pt.index).padStart(2, '0')}</code></td><td>{pt.name}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-legend">{c.s_hops_h}</div>
          <p>{c.s_hops}</p>
          <table className="filter-type-table">
            <thead><tr><th>{c.tbl_type}</th><th>{c.tbl_maxhops}</th></tr></thead>
            <tbody>
              {PAYLOAD_TYPES.map(pt => (
                <tr key={pt.index}><td><code>{String(pt.index).padStart(2, '0')}</code> {pt.name}</td><td>{DEFAULTS.perType[pt.index].hops}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-legend">{c.s_rate_h}</div>
          <p>{c.s_rate}</p>
          <table className="filter-type-table">
            <thead><tr><th>{c.tbl_type}</th><th>{c.tbl_limit}</th><th>{c.tbl_window}</th></tr></thead>
            <tbody>
              {PAYLOAD_TYPES.map(pt => (
                <tr key={pt.index}>
                  <td><code>{String(pt.index).padStart(2, '0')}</code> {pt.name}</td>
                  <td>{DEFAULTS.perType[pt.index].rateLimit}</td>
                  <td>{DEFAULTS.perType[pt.index].rateSecs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel"><div className="panel-legend">{c.s_channel_h}</div><p>{c.s_channel}</p></div>
        <div className="panel"><div className="panel-legend">{c.s_hash_h}</div><p>{c.s_hash}</p></div>
        <div className="panel"><div className="panel-legend">{c.s_malformed_h}</div><p>{c.s_malformed}</p></div>
        <div className="panel"><div className="panel-legend">{c.s_stats_h}</div><p>{c.s_stats}</p></div>
        <div className="panel"><div className="panel-legend">{c.s_persist_h}</div><p>{c.s_persist}</p></div>

        <div className="panel">
          <div className="panel-legend">{c.s_reco_h}</div>
          <div className="info-box"><span>⚠</span><p>{c.s_reco_note}</p></div>
          <p className="section-title">{c.reco_typical_h}</p>
          <pre className="cmd-block"><code>{TYPICAL_CONFIG}</code></pre>
          <p className="section-title">{c.reco_busy_h}</p>
          <pre className="cmd-block"><code>{BUSY_CONFIG}</code></pre>
          <p className="field-hint">{c.reco_busy_note}</p>
          <p className="section-title">{c.reco_noisy_h}</p>
          <p>{c.reco_noisy}</p>
        </div>

        <div className="panel">
          <div className="panel-legend">{c.links_h}</div>
          <div className="gs-links">
            <Link className="btn btn-sm" to="/filter-cli">{c.go_cli}</Link>
            <Link className="btn btn-sm" to="/usb-config">{c.go_usb}</Link>
            <Link className="btn btn-sm" to="/cli-wiki">{c.go_wiki}</Link>
          </div>
        </div>
      </main>

      <Toast toasts={toasts} />
    </>
  )
}
