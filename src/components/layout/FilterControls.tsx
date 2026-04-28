import type { Channel, FilterState, ViewMode } from '../../types'
import type { CategoryEntry } from '../../hooks/useCategoryMap'
import { useLang } from '../../hooks/useLang'

interface Props {
  allChannels: Channel[]
  filters: FilterState
  setFilter: <K extends keyof FilterState>(key: K, val: FilterState[K]) => void
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void
  onExportJson: () => void
  onExportTxt: () => void
  onExportRtfm: () => void
  onExportCoreScope?: () => void
  isEditor?: boolean
  categoryMap: Record<string, CategoryEntry>
}

export default function FilterControls({
  allChannels,
  filters,
  setFilter,
  viewMode,
  setViewMode,
  onExportJson,
  onExportTxt,
  onExportRtfm,
  onExportCoreScope,
  isEditor = false,
  categoryMap,
}: Props) {
  const { t } = useLang()

  const regions = [...new Set(allChannels.map(c => c.region).filter(Boolean))].sort() as string[]
  const scopes  = [...new Set(allChannels.flatMap(c => c.scopes || []))].sort()
  const countries = [...new Set(allChannels.map(c => c.country).filter(Boolean))].sort() as string[]

  const selectedCatKey = filters.category.toLowerCase()
  const subcategories = selectedCatKey && categoryMap[selectedCatKey]
    ? [...categoryMap[selectedCatKey].subs].sort()
    : [...new Set(allChannels.map(c => c.subcategory).filter(Boolean))].sort() as string[]

  return (
    <div className="controls">
      <div className="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="search"
          placeholder={t('search_placeholder')}
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          autoComplete="off"
        />
      </div>

      <select
        value={filters.category}
        onChange={e => { setFilter('category', e.target.value); setFilter('subcategory', '') }}
      >
        <option value="">{t('all_categories')}</option>
        {Object.values(categoryMap).map(entry => (
          <option key={entry.display} value={entry.display}>{entry.display}</option>
        ))}
      </select>

      <select
        value={filters.subcategory}
        onChange={e => setFilter('subcategory', e.target.value)}
      >
        <option value="">{t('all_subcategories')}</option>
        {subcategories.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={filters.region}
        onChange={e => setFilter('region', e.target.value)}
      >
        <option value="">{t('all_regions')}</option>
        {regions.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <select
        value={filters.scope}
        onChange={e => setFilter('scope', e.target.value)}
      >
        <option value="">{t('all_scopes')}</option>
        {scopes.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={filters.country}
        onChange={e => setFilter('country', e.target.value)}
      >
        <option value="">{t('all_countries')}</option>
        {countries.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label className="toggle-wrap">
        <input
          type="checkbox"
          checked={filters.onlyScoped}
          onChange={e => setFilter('onlyScoped', e.target.checked)}
        />
        <span className="toggle" />
        <span className="toggle-label">{t('scoped_only')}</span>
      </label>

      <label className="toggle-wrap">
        <input
          type="checkbox"
          checked={filters.onlyBare}
          onChange={e => setFilter('onlyBare', e.target.checked)}
        />
        <span className="toggle" />
        <span className="toggle-label">{t('no_meta_only')}</span>
      </label>

      <div className="input-wrap">
        <label htmlFor="min-messages">{t('min_messages')}</label>
        <input
          id="min-messages"
          type="number"
          min="0"
          value={filters.minMessages}
          onChange={e => setFilter('minMessages', Math.max(0, parseInt(e.target.value) || 0))}
          placeholder="0"
        />
      </div>

      <div className="vr" />

      <div className="view-btns">
        <button
          className={`view-btn${viewMode === 'grid' ? ' active' : ''}`}
          title="Grid view"
          onClick={() => setViewMode('grid')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="8" height="8" rx="1"/>
            <rect x="13" y="3" width="8" height="8" rx="1"/>
            <rect x="3" y="13" width="8" height="8" rx="1"/>
            <rect x="13" y="13" width="8" height="8" rx="1"/>
          </svg>
        </button>
        <button
          className={`view-btn${viewMode === 'list' ? ' active' : ''}`}
          title="List view"
          onClick={() => setViewMode('list')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
      </div>

      {isEditor && (
        <>
          <div className="vr" />
          <button className="btn" onClick={onExportJson} title="Export filtered channels as JSON">⬇ JSON</button>
          <button className="btn" onClick={onExportTxt}  title="Export filtered channel names">⬇ TXT</button>
          <button className="btn" onClick={onExportRtfm} title="Export filtered as RTfM format">⬇ RTfM</button>
          {onExportCoreScope && <button className="btn" onClick={onExportCoreScope} title="Export filtered as CoreScope format">⬇ CoreScope</button>}
        </>
      )}
    </div>
  )
}
