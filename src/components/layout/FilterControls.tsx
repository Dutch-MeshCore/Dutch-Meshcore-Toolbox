import type { Channel, FilterState, ViewMode } from '../../types'
import { useLang } from '../../hooks/useLang'

interface Props {
  allChannels: Channel[]
  filters: FilterState
  setFilter: <K extends keyof FilterState>(key: K, val: FilterState[K]) => void
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void
}

export default function FilterControls({
  allChannels,
  filters,
  setFilter,
  viewMode,
  setViewMode,
}: Props) {
  const { t } = useLang()

  const regions   = [...new Set(allChannels.flatMap(c => c.regions   || []))].sort()
  const scopes    = [...new Set(allChannels.flatMap(c => c.scopes    || []))].sort()
  const countries = [...new Set(allChannels.flatMap(c => c.countries || []))].sort()

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
    </div>
  )
}
