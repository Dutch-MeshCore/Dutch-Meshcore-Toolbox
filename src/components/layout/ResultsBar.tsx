import { PAGE_SIZE_OPTIONS } from '../../hooks/usePagination'
import { useLang } from '../../hooks/useLang'

interface Props {
  count: number
  total: number
  isFiltered: boolean
  onClearFilters: () => void
  pageSize: number
  onPageSizeChange: (n: number) => void
}

export default function ResultsBar({
  count,
  total,
  isFiltered,
  onClearFilters,
  pageSize,
  onPageSizeChange,
}: Props) {
  const { t } = useLang()

  return (
    <div className="results-bar">
      <span>
        {t('showing')} <strong>{count}</strong>{isFiltered ? ` ${t('of')} ${total}` : ''} {t('channels_word')}
        {isFiltered && (
          <> &nbsp;·&nbsp; <button className="btn-link" onClick={onClearFilters}>{t('clear_filters')}</button></>
        )}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
          {t('per_page')}
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            style={{ minWidth: 0, padding: '3px 6px', fontSize: 12 }}
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n === 0 ? t('all_opt') : n}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
