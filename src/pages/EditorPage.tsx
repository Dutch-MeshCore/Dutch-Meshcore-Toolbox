import { useState, useEffect } from 'react'
import type { Channel, ChannelMeta, ViewMode } from '../types'
import { useLocalEdits } from '../hooks/useLocalEdits'
import { useChannelData } from '../hooks/useChannelData'
import { useChannelView } from '../hooks/useChannelView'
import { useSelection } from '../hooks/useSelection'
import { useToast } from '../hooks/useToast'
import { useServerMode } from '../hooks/useServerMode'
import { useCategoryMap } from '../hooks/useCategoryMap'
import { usePagination } from '../hooks/usePagination'
import { useLang } from '../hooks/useLang'
import Navbar from '../components/layout/Navbar'
import ServerBar from '../components/layout/ServerBar'
import StatsBar from '../components/layout/StatsBar'
import FilterControls from '../components/layout/FilterControls'
import ResultsBar from '../components/layout/ResultsBar'
import Pagination from '../components/layout/Pagination'
import SelectionBar from '../components/layout/SelectionBar'
import ChannelCard from '../components/channels/ChannelCard'
import ChannelRow from '../components/channels/ChannelRow'
import EditModal from '../components/channels/EditModal'
import Toast from '../components/ui/Toast'
import { exportJson, exportTxt, exportRtfm, exportCoreScope } from '../utils/export'

const LS_VIEW = 'meshcore-view'

export default function EditorPage() {
  const { t } = useLang()
  const { status, serverMode } = useServerMode()
  const { localEdits, applyEdit, removeEdit, clearAll: clearLocalEdits } = useLocalEdits()
  const { allChannels, metaMap, loading, error, rebuildMeta } = useChannelData(serverMode, localEdits)
  const { filtered, filters, setFilter, clearFilters, isFiltered, sortBy, sortDir, setSort } = useChannelView(allChannels)
  const { page, setPage, pageSize, setPageSize, totalPages, paged } = usePagination(filtered)
  const { selection, toggle, selectAllFiltered, clear: clearSelection } = useSelection(filtered)
  const { toasts, toast } = useToast()
  const categoryMap = useCategoryMap(allChannels)

  const [viewMode, setViewModeRaw] = useState<ViewMode>(
    () => (localStorage.getItem(LS_VIEW) as ViewMode) || 'grid'
  )
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  function setViewMode(m: ViewMode) {
    setViewModeRaw(m)
    localStorage.setItem(LS_VIEW, m)
  }

  useEffect(() => {
    function onScroll() { setShowScrollTop(window.scrollY > 300) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const localEditsCount = Object.values(localEdits).filter(v => v !== null && Object.keys(v).length > 0).length

  async function handleSave(name: string, patch: Partial<ChannelMeta>) {
    if (serverMode) {
      try {
        const updatedMeta = { ...metaMap, [name]: { ...metaMap[name], ...patch } }
        const metaArr = Object.values(updatedMeta)
        const res = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metaArr),
        })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        rebuildMeta(updatedMeta)
        toast('Saved to server', 'ok')
      } catch (e) {
        toast((e as Error).message, 'err')
      }
    } else {
      applyEdit(name, patch)
      toast('Saved to localStorage', 'ok')
    }
  }

  async function handleClearMeta(name: string) {
    if (serverMode) {
      try {
        const updatedMeta = { ...metaMap }
        delete updatedMeta[name]
        const metaArr = Object.values(updatedMeta)
        const res = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metaArr),
        })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        rebuildMeta(updatedMeta)
        toast('Metadata cleared on server', 'ok')
      } catch (e) {
        toast((e as Error).message, 'err')
      }
    } else {
      removeEdit(name)
      toast('Local edit cleared', 'ok')
    }
  }

  function selectedChannels() {
    return filtered.filter(c => selection.has(c.channel))
  }

  if (loading) return (
    <>
      <ServerBar status={status} />
      <div className="loading">{t('loading')}</div>
    </>
  )
  if (error) return (
    <>
      <ServerBar status={status} />
      <div className="loading">Error: {error}</div>
    </>
  )

  return (
    <>
      <Navbar />

      <div className="page">
        <ServerBar status={status} />

        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div className="header-left">
            <h1>{t('editor_title')}</h1>
            <p>
              {serverMode ? `${t('editor_sub_server')}` : `${t('editor_sub_local')}`}
            </p>
          </div>
          {!serverMode && localEditsCount > 0 && (
            <button className="btn btn-danger" onClick={() => { if (confirm(t('editor_confirm_clear'))) clearLocalEdits() }}>
              {t('editor_clear_all')}
            </button>
          )}
        </div>

        <StatsBar channels={allChannels} />

        <FilterControls
          allChannels={allChannels}
          filters={filters}
          setFilter={setFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExportJson={() => exportJson(filtered)}
          onExportTxt={() => exportTxt(filtered)}
          onExportRtfm={() => exportRtfm(filtered)}
          onExportCoreScope={() => exportCoreScope(filtered)}
          isEditor
          categoryMap={categoryMap}
        />

        <ResultsBar
          count={filtered.length}
          total={allChannels.length}
          isFiltered={isFiltered}
          onClearFilters={clearFilters}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          localEditsCount={localEditsCount}
          serverMode={serverMode}
          onExportLocalEdits={() => exportJson(allChannels.filter(c => c._localEdit), 'local-edits.json')}
        />

        {filtered.length === 0 ? (
          <div className="empty">
            <h3>{t('no_channels')}</h3>
            <p>{t('no_channels_sub')}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid">
              {paged.map(c => (
                <ChannelCard
                  key={c.channel}
                  channel={c}
                  selected={selection.has(c.channel)}
                  onToggleSelect={toggle}
                  onCopy={msg => toast(msg, 'ok')}
                  onEdit={setEditingChannel}
                  onInfo={setEditingChannel}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        ) : (
          <>
            <div className="list-wrap">
              <table className="list-table">
                <thead>
                  <tr>
                    <th style={{ width: 24 }} />
                    <th className={`sortable${sortBy === 'alpha' ? ` sort-${sortDir}` : ''}`} onClick={() => setSort('alpha')}>{t('th_channel')}</th>
                    <th>{t('th_key')}</th>
                    <th className={`sortable${sortBy === 'category' ? ` sort-${sortDir}` : ''}`} onClick={() => setSort('category')}>{t('th_category')}</th>
                    <th className={`sortable${sortBy === 'country' ? ` sort-${sortDir}` : ''}`} onClick={() => setSort('country')}>{t('th_countries')}</th>
                    <th className={`sortable${sortBy === 'region' ? ` sort-${sortDir}` : ''}`} onClick={() => setSort('region')}>{t('th_region')}</th>
                    <th className={`sortable${sortBy === 'scope' ? ` sort-${sortDir}` : ''}`} onClick={() => setSort('scope')}>{t('th_scopes')}</th>
                    <th className={`sortable${sortBy === 'first_seen' ? ` sort-${sortDir}` : ''}`} onClick={() => setSort('first_seen')}>{t('th_first_seen')}</th>
                    <th className={`sortable${sortBy === 'last_seen' ? ` sort-${sortDir}` : ''}`} onClick={() => setSort('last_seen')}>{t('th_last_seen')}</th>
                    <th className={`sortable${sortBy === 'message_amount' ? ` sort-${sortDir}` : ''}`} onClick={() => setSort('message_amount')}>{t('th_messages')}</th>
                    <th>{t('th_source')}</th>
                    <th>{t('th_flags')}</th>
                    <th>{t('th_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(c => (
                    <ChannelRow
                      key={c.channel}
                      channel={c}
                      selected={selection.has(c.channel)}
                      onToggleSelect={toggle}
                      onCopy={msg => toast(msg, 'ok')}
                      onEdit={setEditingChannel}
                      onInfo={setEditingChannel}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}

        <footer className="site-footer">
          <a href="https://github.com/Elektr0Vodka/meshcore-nl-discovered-channels" target="_blank" rel="noopener noreferrer">
            ElektroVodka
          </a>
          {' '}&mdash; {t('footer')}
        </footer>
      </div>

      <SelectionBar
        selectionSize={selection.size}
        onSelectAll={selectAllFiltered}
        onClear={clearSelection}
        onExportTxt={() => exportTxt(selectedChannels())}
        onExportRtfm={() => exportRtfm(selectedChannels())}
        onExportJson={() => exportJson(selectedChannels())}
        onExportCoreScope={() => exportCoreScope(selectedChannels())}
      />

      {editingChannel && (
        <EditModal
          channel={editingChannel}
          serverMode={serverMode}
          categoryMap={categoryMap}
          onSave={handleSave}
          onClearMeta={handleClearMeta}
          onClose={() => setEditingChannel(null)}
        />
      )}

      <Toast toasts={toasts} />

      <button
        id="scrollTopBtn"
        className={showScrollTop ? 'show' : ''}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Back to top"
      >
        ↑
      </button>
    </>
  )
}
