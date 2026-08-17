import { useMemo, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { copyText } from '../utils/clipboard'
import {
  FIRMWARE_VARIANTS, FW_DEVICE_TYPES, FW_CATEGORIES,
  FW_CATEGORY_LABEL_KEYS, FW_NOTE_LABEL_KEYS,
  getCommandsForContext, searchCommands, localizedDesc,
  type DeviceTypeKey, type CliCommand, type CategoryKey,
} from '../lib/cli/firmwareRegistry'

const VARIANT_ORDER = ['meshcore', 'dmc-repeater', 'dmc-mqtt']

export default function CliWikiPage() {
  const { t, lang } = useLang()
  const [variantId, setVariantId] = useState('meshcore')
  const variant = FIRMWARE_VARIANTS[variantId]
  const [deviceType, setDeviceType] = useState<DeviceTypeKey>(variant.deviceTypes[0])
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const activeDeviceType = variant.deviceTypes.includes(deviceType) ? deviceType : variant.deviceTypes[0]

  const commands = useMemo(() => {
    const ctx = getCommandsForContext(variantId, FW_DEVICE_TYPES[activeDeviceType].id)
    return searchCommands(ctx, query)
  }, [variantId, activeDeviceType, query])

  const byCategory = useMemo(() => {
    const groups = new Map<CategoryKey, CliCommand[]>()
    for (const c of commands) {
      if (!groups.has(c.category)) groups.set(c.category, [])
      groups.get(c.category)!.push(c)
    }
    return [...groups.entries()].sort(
      (a, b) => Object.keys(FW_CATEGORIES).indexOf(a[0]) - Object.keys(FW_CATEGORIES).indexOf(b[0])
    )
  }, [commands])

  async function copyCmd(cmd: string) {
    if (await copyText(cmd.trim())) {
      setCopied(cmd)
      window.setTimeout(() => setCopied(null), 1500)
    }
  }

  return (
    <>
      <Navbar />
      <main className="page cli-wiki-page">
        <div className="device-page-header">
          <h1>📖 {t('wiki_title')}</h1>
          <p>{t('wiki_intro')}</p>
        </div>

        <div className="wiki-controls">
          <label className="wiki-control-label">{t('wiki_variant')}</label>
          <div className="wiki-variant-tabs" role="tablist">
            {VARIANT_ORDER.map(id => (
              <button
                key={id}
                role="tab"
                aria-selected={variantId === id}
                className={`btn${variantId === id ? ' btn-accent' : ''}`}
                title={t(FIRMWARE_VARIANTS[id].shortDescKey)}
                onClick={() => setVariantId(id)}
              >
                {FIRMWARE_VARIANTS[id].name}
              </button>
            ))}
          </div>
          <p className="wiki-variant-desc">{t(variant.fullDescKey)}</p>
          <a className="wiki-variant-src" href={variant.source} target="_blank" rel="noopener noreferrer">{t('wiki_view_source')}</a>

          <label className="wiki-control-label">{t('wiki_device')}</label>
          <div className="wiki-device-chips">
            {variant.deviceTypes.map(dt => (
              <button
                key={dt}
                className={`chip${activeDeviceType === dt ? ' chip-active' : ''}`}
                onClick={() => setDeviceType(dt)}
              >
                {FW_DEVICE_TYPES[dt].icon} {t(FW_DEVICE_TYPES[dt].nameKey)}
              </button>
            ))}
          </div>
          <p className="wiki-device-desc">{t(FW_DEVICE_TYPES[activeDeviceType].descKey)}</p>

          <input
            className="wiki-search"
            type="search"
            placeholder={t('wiki_search')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {byCategory.length === 0 ? (
          <p className="wiki-empty">{t('wiki_none')}</p>
        ) : (
          byCategory.map(([cat, cmds]) => (
            <div className="panel wiki-category" key={cat}>
              <div className="panel-legend">{t(FW_CATEGORY_LABEL_KEYS[cat])}</div>
              <ul className="wiki-cmd-list">
                {cmds.map(c => (
                  <li className="wiki-cmd" key={c.cmd}>
                    <code className="wiki-cmd-code">{c.cmd.trim()}</code>
                    {c.sinceVersion && <span className="wiki-badge">{c.sinceVersion}</span>}
                    {c.note && <span className="wiki-note-tag">{t(FW_NOTE_LABEL_KEYS[c.note])}</span>}
                    <span className="wiki-cmd-desc">{localizedDesc(c, lang)}</span>
                    <button
                      className={`btn btn-sm btn-copy${copied === c.cmd ? ' copied' : ''}`}
                      onClick={() => copyCmd(c.cmd)}
                    >
                      {copied === c.cmd ? t('wiki_copied') : t('wiki_copy')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </main>
    </>
  )
}
