import { useState, useEffect } from "react";
import type { Channel, ViewMode } from "../types";
import { useLocalEdits } from "../hooks/useLocalEdits";
import { useChannelData } from "../hooks/useChannelData";
import { useChannelView } from "../hooks/useChannelView";
import { useSelection } from "../hooks/useSelection";
import { useToast } from "../hooks/useToast";
import { useCategoryMap } from "../hooks/useCategoryMap";
import { usePagination } from "../hooks/usePagination";
import { useLang } from "../hooks/useLang";
import Navbar from "../components/layout/Navbar";
import StatsInsights from "../components/layout/StatsInsights";
import FilterControls from "../components/layout/FilterControls";
import ResultsBar from "../components/layout/ResultsBar";
import Pagination from "../components/layout/Pagination";
import SelectionBar from "../components/layout/SelectionBar";
import ChannelCard from "../components/channels/ChannelCard";
import ChannelRow from "../components/channels/ChannelRow";
import ChannelInfoModal from "../components/channels/ChannelInfoModal";
import Toast from "../components/ui/Toast";
import { exportJson, exportTxt, exportRtfm, exportCoreScope } from "../utils/export";

const LS_VIEW = "meshcore-view";

export default function IndexPage() {
  const { t } = useLang();
  const { localEdits } = useLocalEdits();
  const { allChannels, loading, error } = useChannelData(false, localEdits);
  const {
    filtered,
    filters,
    setFilter,
    clearFilters,
    isFiltered,
    sortBy,
    sortDir,
    setSort,
  } = useChannelView(allChannels);
  const { page, setPage, pageSize, setPageSize, totalPages, paged } =
    usePagination(filtered);
  const {
    selection,
    toggle,
    selectAllFiltered,
    clear: clearSelection,
  } = useSelection(filtered);
  const { toasts, toast } = useToast();
  const categoryMap = useCategoryMap(allChannels);

  const [viewMode, setViewModeRaw] = useState<ViewMode>(
    () => (localStorage.getItem(LS_VIEW) as ViewMode) || "grid",
  );
  const [infoChannel, setInfoChannel] = useState<Channel | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  function setViewMode(m: ViewMode) {
    setViewModeRaw(m);
    localStorage.setItem(LS_VIEW, m);
  }

  useEffect(() => {
    function onScroll() {
      setShowScrollTop(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function selectedChannels() {
    return filtered.filter((c) => selection.has(c.channel));
  }

  if (loading) return <div className="loading">{t('loading')}</div>;
  if (error) return <div className="loading">Error: {error}</div>;

  return (
    <>
      <Navbar />

      <div className="page">
        <div className="header">
          <h1>{t('index_title')}</h1>
          <p>{t('index_sub')}</p>
        </div>

        <div className="rtfm-warning">
          <h3>{t('rtfm_title')}</h3>
          <p>
            This channel list was generated using our fork of{" "}
            <a
              href="https://github.com/Elektr0Vodka/Remote-Terminal-for-MeshCore"
              target="_blank"
              rel="noopener noreferrer"
            >
              Remote Terminal for MeshCore
            </a>
            , currently the only fork supporting{" "}
            <strong>channel importing and exporting</strong>.
          </p>
          <p>{t('rtfm_p2')}</p>
          <p>{t('rtfm_p3')}</p>
          <p>{t('rtfm_p4')}</p>
          <div className="danger-notice">
            <p>{t('rtfm_warn_title')}</p>
            <p>
              {t('rtfm_warn_p_a')} <strong>{t('rtfm_warn_p_b')}</strong> {t('rtfm_warn_p_c')}{" "}
              <strong>{t('rtfm_warn_p_d')}</strong> {t('rtfm_warn_p_e')}
              <strong> {t('rtfm_warn_p_f')}</strong>
            </p>
          </div>
        </div>

        <details className="info-panel" open>
          <summary>
            <span>{t('info_scope_guidelines')}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box warn">
              <h4 style={{ color: "#facc15" }}>{t('info_scope_title')}</h4>
              <p>{t('info_scope_body')}</p>
            </div>
            <div className="info-box danger">
              <h4 style={{ color: "#fbbf24" }}>{t('info_ghpages_title')}</h4>
              <p>{t('info_ghpages_body')}</p>
            </div>
            <div className="info-box">
              <h4 style={{ color: "#93c5fd" }}>{t('info_project_title')}</h4>
              <p>{t('info_project_body')}</p>
            </div>
          </div>
        </details>

        <StatsInsights channels={allChannels} />

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
          categoryMap={categoryMap}
        />

        <ResultsBar
          count={filtered.length}
          total={allChannels.length}
          isFiltered={isFiltered}
          onClearFilters={clearFilters}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          serverMode={false}
        />

        {filtered.length === 0 ? (
          <div className="empty">
            <h3>{t('no_channels')}</h3>
            <p>{t('no_channels_sub')}</p>
          </div>
        ) : viewMode === "grid" ? (
          <>
            <div className="grid">
              {paged.map((c) => (
                <ChannelCard
                  key={c.channel}
                  channel={c}
                  selected={selection.has(c.channel)}
                  onToggleSelect={toggle}
                  onCopy={(msg) => toast(msg, "ok")}
                  onEdit={setInfoChannel}
                  onInfo={setInfoChannel}
                  readOnlyActions
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
                    <th
                      className={`sortable${sortBy === "alpha" ? ` sort-${sortDir}` : ""}`}
                      onClick={() => setSort("alpha")}
                    >
                      {t('th_channel')}
                    </th>
                    <th>{t('th_key')}</th>
                    <th title="First byte of SHA-256(key)">
                      {t('th_hash')}
                    </th>
                    <th
                      className={`sortable${sortBy === "category" ? ` sort-${sortDir}` : ""}`}
                      onClick={() => setSort("category")}
                    >
                      {t('th_category')}
                    </th>
                    <th
                      className={`sortable${sortBy === "country" ? ` sort-${sortDir}` : ""}`}
                      onClick={() => setSort("country")}
                    >
                      {t('th_countries')}
                    </th>
                    <th
                      className={`sortable${sortBy === "region" ? ` sort-${sortDir}` : ""}`}
                      onClick={() => setSort("region")}
                    >
                      {t('th_region')}
                    </th>
                    <th
                      className={`sortable${sortBy === "scope" ? ` sort-${sortDir}` : ""}`}
                      onClick={() => setSort("scope")}
                    >
                      {t('th_scopes')}
                    </th>
                    <th
                      className={`sortable${sortBy === "first_seen" ? ` sort-${sortDir}` : ""}`}
                      onClick={() => setSort("first_seen")}
                    >
                      {t('th_first_seen')}
                    </th>
                    <th
                      className={`sortable${sortBy === "last_seen" ? ` sort-${sortDir}` : ""}`}
                      onClick={() => setSort("last_seen")}
                    >
                      {t('th_last_seen')}
                    </th>
                    <th
                      className={`sortable${sortBy === "message_amount" ? ` sort-${sortDir}` : ""}`}
                      onClick={() => setSort("message_amount")}
                    >
                      {t('th_messages')}
                    </th>
                    <th>{t('th_source')}</th>
                    <th>{t('th_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c) => (
                    <ChannelRow
                      key={c.channel}
                      channel={c}
                      selected={selection.has(c.channel)}
                      onToggleSelect={toggle}
                      onCopy={(msg) => toast(msg, "ok")}
                      onEdit={setInfoChannel}
                      onInfo={setInfoChannel}
                      readOnlyActions
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}

        <footer className="site-footer">
          <a
            href="https://github.com/Elektr0Vodka/meshcore-nl-discovered-channels"
            target="_blank"
            rel="noopener noreferrer"
          >
            ElektroVodka
          </a>{" "}
          &mdash; {t('footer')}
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

      {infoChannel && (
        <ChannelInfoModal
          channel={infoChannel}
          onClose={() => setInfoChannel(null)}
        />
      )}

      <Toast toasts={toasts} />

      <button
        id="scrollTopBtn"
        className={showScrollTop ? "show" : ""}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title="Back to top"
      >
        ↑
      </button>
    </>
  );
}
