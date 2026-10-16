import { useState } from 'react'
import {
  PAYLOAD_TYPES, cloneFilterSettings, isValidPathPrefix, ALL_FILTER_FEATURES,
  FILTER_CHANNEL_MAX, FILTER_PATH_MAX, FILTER_RULE_MAX, FILTER_WATCH_MAX,
  FILTER_SENDER_LEN, FILTER_TEXT_LEN, FILTER_ADVERT_MAX_HOURS, FILTER_AGE_MAX_MINS,
  type FilterSettings, type FilterFeatures, type FilterRule,
} from '../../lib/config/filterCommands'
import { useLang } from '../../hooks/useLang'

interface Props {
  value: FilterSettings
  onChange: (next: FilterSettings) => void
  /** Features the connected firmware supports; omit for the generator (all features). */
  features?: FilterFeatures
}

const copy = {
  en: {
    enable: 'Enable packet filter',
    dryrun: 'Dry-run: count drops but keep forwarding',
    minHash: 'Min path-hash bytes (1–3)',
    malformed: 'Scan public-channel text for malformed UTF-8',
    blocked: 'Blocked channels',
    none: 'None',
    channelPlaceholder: '#channel or Public',
    add: 'Add',
    advanced: 'Advanced – per payload type',
    colType: 'Type',
    colHops: 'Max hops (0–64)',
    colRate: 'Rate limit',
    colWindow: 'Window (s)',
    colSoft: 'Soft cutoff (0 = off)',
    remove: (ch: string) => `Remove ${ch}`,
    advertHours: 'Advert window per origin (hours, 0 = off)',
    ageMins: 'Message age limit (minutes, 0 = off)',
    ageHint: 'Needs a set clock on the repeater; inactive until then.',
    rules: 'Paths, senders & text rules',
    paths: 'Blocked path prefixes',
    pathPlaceholder: 'hex, e.g. A1B2',
    watch: 'Watched #channels (Public is always read)',
    watchPlaceholder: '#channel',
    senders: 'Sender rules',
    texts: 'Text rules',
    senderPlaceholder: 'Name or Prefix*',
    textPlaceholder: 'word or ^start',
    colPattern: 'Pattern',
    colSecs: 'Throttle (s, 0 = block)',
    colProb: 'Applies to (%)',
    rulesHint: 'Rules are checked top to bottom; the first rule that decides drops the message.',
    cEnable: 'Enable receive filter',
    cNotice: 'Companion receive filter: malformed, too old and blocked-path messages are dropped; sender and text rules only hide a message from the app, it is still repeated when repeat is on.',
    cMalformed: 'Drop malformed group text (bad timestamp, empty, invalid UTF-8) on every channel',
    cAgeHint: 'Needs a set clock on the companion (the app usually sets it); inactive until then.',
    cRulesHint: 'Rules are checked top to bottom; the first rule that decides hides the message.',
  },
  nl: {
    enable: 'Pakketfilter inschakelen',
    dryrun: 'Dry-run: drops tellen maar wel doorsturen',
    minHash: 'Min. path-hash bytes (1–3)',
    malformed: 'Scan tekst op publieke kanalen op ongeldige UTF-8',
    blocked: 'Geblokkeerde kanalen',
    none: 'Geen',
    channelPlaceholder: '#kanaal of Public',
    add: 'Toevoegen',
    advanced: 'Geavanceerd – per payload-type',
    colType: 'Type',
    colHops: 'Max. hops (0–64)',
    colRate: 'Snelheidslimiet',
    colWindow: 'Venster (s)',
    colSoft: 'Zachte grens (0 = uit)',
    remove: (ch: string) => `${ch} verwijderen`,
    advertHours: 'Advertentievenster per afzender (uren, 0 = uit)',
    ageMins: 'Maximale berichtleeftijd (minuten, 0 = uit)',
    ageHint: 'Werkt pas als de klok van de repeater is ingesteld.',
    rules: 'Paden, afzenders & tekstregels',
    paths: 'Geblokkeerde pad-prefixen',
    pathPlaceholder: 'hex, bijv. A1B2',
    watch: 'Gevolgde #kanalen (Public wordt altijd gelezen)',
    watchPlaceholder: '#kanaal',
    senders: 'Afzenderregels',
    texts: 'Tekstregels',
    senderPlaceholder: 'Naam of Prefix*',
    textPlaceholder: 'woord of ^begin',
    colPattern: 'Patroon',
    colSecs: 'Afremmen (s, 0 = blokkeren)',
    colProb: 'Geldt voor (%)',
    rulesHint: 'Regels worden van boven naar beneden gecontroleerd; de eerste regel die beslist, laat het bericht vallen.',
    cEnable: 'Ontvangstfilter inschakelen',
    cNotice: 'Ontvangstfilter van de companion: onjuiste, te oude en via een geblokkeerd pad ontvangen berichten vallen weg; afzender- en tekstregels verbergen een bericht alleen in de app, met repeat aan wordt het nog steeds doorgestuurd.',
    cMalformed: 'Onjuiste groepstekst (foute tijdstempel, leeg, ongeldige UTF-8) op elk kanaal laten vallen',
    cAgeHint: 'Werkt pas als de klok van de companion is ingesteld (meestal door de app).',
    cRulesHint: 'Regels worden van boven naar beneden gecontroleerd; de eerste regel die beslist, verbergt het bericht.',
  },
  de: {
    enable: 'Paketfilter aktivieren',
    dryrun: 'Dry-run: Drops zählen, aber weiterleiten',
    minHash: 'Min. Path-Hash-Bytes (1–3)',
    malformed: 'Text öffentlicher Kanäle auf fehlerhaftes UTF-8 prüfen',
    blocked: 'Blockierte Kanäle',
    none: 'Keine',
    channelPlaceholder: '#Kanal oder Public',
    add: 'Hinzufügen',
    advanced: 'Erweitert – pro Payload-Typ',
    colType: 'Typ',
    colHops: 'Max. Hops (0–64)',
    colRate: 'Ratenlimit',
    colWindow: 'Fenster (s)',
    colSoft: 'Weiche Grenze (0 = aus)',
    remove: (ch: string) => `${ch} entfernen`,
    advertHours: 'Advert-Fenster pro Absender (Stunden, 0 = aus)',
    ageMins: 'Maximales Nachrichtenalter (Minuten, 0 = aus)',
    ageHint: 'Wirkt erst, wenn die Uhr des Repeaters gestellt ist.',
    rules: 'Pfade, Absender- & Textregeln',
    paths: 'Blockierte Pfad-Präfixe',
    pathPlaceholder: 'Hex, z. B. A1B2',
    watch: 'Beobachtete #Kanäle (Public wird immer gelesen)',
    watchPlaceholder: '#Kanal',
    senders: 'Absenderregeln',
    texts: 'Textregeln',
    senderPlaceholder: 'Name oder Präfix*',
    textPlaceholder: 'Wort oder ^Anfang',
    colPattern: 'Muster',
    colSecs: 'Drosseln (s, 0 = blockieren)',
    colProb: 'Gilt für (%)',
    rulesHint: 'Regeln werden von oben nach unten geprüft; die erste Regel, die entscheidet, verwirft die Nachricht.',
    cEnable: 'Empfangsfilter aktivieren',
    cNotice: 'Empfangsfilter des Companions: fehlerhafte, zu alte und über einen blockierten Pfad empfangene Nachrichten werden verworfen; Absender- und Textregeln blenden eine Nachricht nur in der App aus, mit repeat an wird sie weiterhin weitergeleitet.',
    cMalformed: 'Fehlerhaften Gruppentext (falscher Zeitstempel, leer, ungültiges UTF-8) auf jedem Kanal verwerfen',
    cAgeHint: 'Wirkt erst, wenn die Uhr des Companions gestellt ist (meist durch die App).',
    cRulesHint: 'Regeln werden von oben nach unten geprüft; die erste Regel, die entscheidet, blendet die Nachricht aus.',
  },
} as const

type Copy = (typeof copy)[keyof typeof copy]

function clampInt(v: string, min: number, max: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/** Removable chips plus an add box; `normalize` returns null to reject the input. */
function ChipList({ label, items, max, placeholder, c, normalize, onChange }: {
  label: string
  items: string[]
  max: number
  placeholder: string
  c: Copy
  normalize: (raw: string) => string | null
  onChange: (next: string[]) => void
}) {
  const [input, setInput] = useState('')
  function add() {
    const v = normalize(input.trim())
    if (v === null || items.length >= max) return
    if (!items.includes(v)) onChange([...items, v])
    setInput('')
  }
  return (
    <div className="field-group" style={{ marginTop: '.5rem' }}>
      <label>{label} ({items.length}/{max})</label>
      <div className="filter-channel-list">
        {items.length === 0 && <span className="field-hint">{c.none}</span>}
        {items.map(it => (
          <span key={it} className="filter-channel-chip">
            {it}
            <button
              type="button" className="chip-remove" aria-label={c.remove(it)}
              onClick={() => onChange(items.filter(x => x !== it))}
            >×</button>
          </span>
        ))}
      </div>
      <div className="filter-channel-add">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button type="button" className="btn" onClick={add} disabled={items.length >= max}>
          {c.add}
        </button>
      </div>
    </div>
  )
}

/** Ordered sender/text rule editor: pattern, throttle seconds, dosing percentage. */
function RuleTable({ label, rules, maxLen, placeholder, c, onChange }: {
  label: string
  rules: FilterRule[]
  maxLen: number
  placeholder: string
  c: Copy
  onChange: (next: FilterRule[]) => void
}) {
  const [input, setInput] = useState('')
  function add() {
    const p = input.trim()
    // The device splits on spaces and lists rules comma-separated.
    if (!p || /[\s,]/.test(p) || p.length > maxLen || rules.length >= FILTER_RULE_MAX) return
    if (!rules.some(r => r.pattern === p)) onChange([...rules, { pattern: p, secs: 0, prob: 100 }])
    setInput('')
  }
  function patchRule(i: number, r: Partial<FilterRule>) {
    onChange(rules.map((x, j) => (j === i ? { ...x, ...r } : x)))
  }
  return (
    <div className="field-group" style={{ marginTop: '.5rem' }}>
      <label>{label} ({rules.length}/{FILTER_RULE_MAX})</label>
      {rules.length === 0 ? (
        <span className="field-hint">{c.none}</span>
      ) : (
        <table className="filter-type-table" aria-label={label}>
          <thead>
            <tr><th>{c.colPattern}</th><th>{c.colSecs}</th><th>{c.colProb}</th><th /></tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={r.pattern}>
                <td><code>{r.pattern}</code></td>
                <td>
                  <input
                    type="number" min={0} max={65535} value={r.secs}
                    onChange={e => patchRule(i, { secs: clampInt(e.target.value, 0, 65535) })}
                  />
                </td>
                <td>
                  <input
                    type="number" min={1} max={100} value={r.prob}
                    onChange={e => patchRule(i, { prob: clampInt(e.target.value, 1, 100) })}
                  />
                </td>
                <td>
                  <button
                    type="button" className="chip-remove" aria-label={c.remove(r.pattern)}
                    onClick={() => onChange(rules.filter((_, j) => j !== i))}
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="filter-channel-add">
        <input
          value={input}
          maxLength={maxLen}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button type="button" className="btn" onClick={add} disabled={rules.length >= FILTER_RULE_MAX}>
          {c.add}
        </button>
      </div>
    </div>
  )
}

export default function FilterSettingsForm({ value, onChange, features = ALL_FILTER_FEATURES }: Props) {
  const { lang } = useLang()
  const c = copy[lang]
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const hasRuleSection = features.path || features.rules
  // The companion filter has no hash, channel, per-type or watch settings.
  const repeater = !features.companion

  function patch(mutate: (s: FilterSettings) => void) {
    const next = cloneFilterSettings(value)
    mutate(next)
    onChange(next)
  }

  const malformedBox = (
    <input
      type="checkbox"
      checked={value.malformed}
      onChange={e => patch(s => { s.malformed = e.target.checked })}
    />
  )

  return (
    <div className="filter-form">
      <label className="check-row">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={e => patch(s => { s.enabled = e.target.checked })}
        />
        {repeater ? c.enable : c.cEnable}
      </label>
      {!repeater && <p className="field-hint">{c.cNotice}</p>}
      {features.dryrun && (
        <label className="check-row">
          <input
            type="checkbox"
            checked={value.dryrun}
            onChange={e => patch(s => { s.dryrun = e.target.checked })}
          />
          {c.dryrun}
        </label>
      )}

      {repeater ? (
        <div className="field-row" style={{ marginTop: '.5rem' }}>
          <div className="field-group">
            <label htmlFor="filter-min-hash">{c.minHash}</label>
            <input
              id="filter-min-hash"
              type="number" min={1} max={3}
              value={value.minHashBytes}
              onChange={e => patch(s => { s.minHashBytes = clampInt(e.target.value, 1, 3) })}
            />
          </div>
          <div className="field-group">
            <label className="check-row" style={{ marginTop: '1.7rem' }}>
              {malformedBox}
              {c.malformed}
            </label>
          </div>
        </div>
      ) : (
        <label className="check-row">
          {malformedBox}
          {c.cMalformed}
        </label>
      )}

      {(features.advert || features.age) && (
        <div className="field-row" style={{ marginTop: '.5rem' }}>
          {features.advert && (
            <div className="field-group">
              <label htmlFor="filter-advert-hours">{c.advertHours}</label>
              <input
                id="filter-advert-hours"
                type="number" min={0} max={FILTER_ADVERT_MAX_HOURS}
                value={value.advertHours}
                onChange={e => patch(s => { s.advertHours = clampInt(e.target.value, 0, FILTER_ADVERT_MAX_HOURS) })}
              />
            </div>
          )}
          {features.age && (
            <div className="field-group">
              <label htmlFor="filter-age-mins">{c.ageMins}</label>
              <input
                id="filter-age-mins"
                type="number" min={0} max={FILTER_AGE_MAX_MINS}
                value={value.ageMins}
                onChange={e => patch(s => { s.ageMins = clampInt(e.target.value, 0, FILTER_AGE_MAX_MINS) })}
              />
              <span className="field-hint">{repeater ? c.ageHint : c.cAgeHint}</span>
            </div>
          )}
        </div>
      )}

      {repeater && (
        <ChipList
          label={c.blocked} items={value.channels} max={FILTER_CHANNEL_MAX}
          placeholder={c.channelPlaceholder} c={c}
          // The device splits CLI args on spaces, so a name with whitespace would be
          // silently truncated on-device – reject it here.
          normalize={v => (v && !/\s/.test(v) ? v : null)}
          onChange={channels => patch(s => { s.channels = channels })}
        />
      )}

      {repeater && (
        <button
          type="button" className="btn" style={{ marginTop: '.6rem' }}
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen(o => !o)}
        >
          {advancedOpen ? '▲' : '▼'} {c.advanced}
        </button>
      )}

      {repeater && advancedOpen && (
        <table className="filter-type-table" aria-label="Per-payload-type settings">
          <thead>
            <tr>
              <th>{c.colType}</th><th>{c.colHops}</th><th>{c.colRate}</th><th>{c.colWindow}</th>
              {features.soft && <th>{c.colSoft}</th>}
            </tr>
          </thead>
          <tbody>
            {PAYLOAD_TYPES.map(pt => (
              <tr key={pt.index}>
                <td><code>{String(pt.index).padStart(2, '0')}</code> {pt.name}</td>
                <td>
                  <input
                    type="number" min={0} max={64}
                    value={value.perType[pt.index].hops}
                    onChange={e => patch(s => { s.perType[pt.index].hops = clampInt(e.target.value, 0, 64) })}
                  />
                </td>
                <td>
                  <input
                    type="number" min={0}
                    value={value.perType[pt.index].rateLimit}
                    onChange={e => patch(s => {
                      const p = s.perType[pt.index]
                      p.rateLimit = clampInt(e.target.value, 0, 65535)
                      // The firmware rejects a soft cutoff at or above the limit.
                      if (p.soft >= p.rateLimit) p.soft = 0
                    })}
                  />
                </td>
                <td>
                  <input
                    type="number" min={0}
                    value={value.perType[pt.index].rateSecs}
                    onChange={e => patch(s => { s.perType[pt.index].rateSecs = clampInt(e.target.value, 0, 4294967295) })}
                  />
                </td>
                {features.soft && (
                  <td>
                    <input
                      type="number" min={0} max={Math.max(0, value.perType[pt.index].rateLimit - 1)}
                      value={value.perType[pt.index].soft}
                      onChange={e => patch(s => {
                        const p = s.perType[pt.index]
                        p.soft = clampInt(e.target.value, 0, Math.max(0, p.rateLimit - 1))
                      })}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {hasRuleSection && (
        <button
          type="button" className="btn" style={{ marginTop: '.6rem', marginLeft: repeater ? '.5rem' : 0 }}
          aria-expanded={rulesOpen}
          onClick={() => setRulesOpen(o => !o)}
        >
          {rulesOpen ? '▲' : '▼'} {c.rules}
        </button>
      )}

      {hasRuleSection && rulesOpen && (
        <div>
          {features.path && (
            <ChipList
              label={c.paths} items={value.paths} max={FILTER_PATH_MAX}
              placeholder={c.pathPlaceholder} c={c}
              normalize={v => (isValidPathPrefix(v) ? v.toUpperCase() : null)}
              onChange={paths => patch(s => { s.paths = paths })}
            />
          )}
          {features.rules && (
            <>
              {repeater && (
                <ChipList
                  label={c.watch} items={value.watch} max={FILTER_WATCH_MAX}
                  placeholder={c.watchPlaceholder} c={c}
                  normalize={v => (/^#\S+$/.test(v) && v.length < 32 ? v : null)}
                  onChange={watch => patch(s => { s.watch = watch })}
                />
              )}
              <p className="field-hint" style={{ marginTop: '.5rem' }}>{repeater ? c.rulesHint : c.cRulesHint}</p>
              <RuleTable
                label={c.senders} rules={value.senders} maxLen={FILTER_SENDER_LEN}
                placeholder={c.senderPlaceholder} c={c}
                onChange={senders => patch(s => { s.senders = senders })}
              />
              <RuleTable
                label={c.texts} rules={value.texts} maxLen={FILTER_TEXT_LEN}
                placeholder={c.textPlaceholder} c={c}
                onChange={texts => patch(s => { s.texts = texts })}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
