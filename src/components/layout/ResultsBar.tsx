import { PAGE_SIZE_OPTIONS } from '../../hooks/usePagination'
import { useLang } from '../../hooks/useLang'

interface Props {
  count: number
  total: number
  isFiltered: boolean
  onClearFilters: () => void
  pageSize: number
  onPageSizeChange: (n: number) => void
  localEditsCount?: number
  serverMode?: boolean
  onExportLocalEdits?: () => void
}

export default function ResultsBar({
  count,
  total,
  isFiltered,
  onClearFilters,
  pageSize,
  onPageSizeChange,
  localEditsCount = 0,
  serverMode = false,
  onExportLocalEdits,
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
        {!serverMode && localEditsCount > 0 && (
          <span className="local-edits-note">
            ✏ {localEditsCount} {localEditsCount !== 1 ? t('local_edits_p') : t('local_edit_s')}
            {onExportLocalEdits && (
              <> · <button className="btn-link" onClick={onExportLocalEdits}>{t('export_link')}</button></>
            )}
          </span>
        )}
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
