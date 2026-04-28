import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'

export default function HowToPage() {
  const { t } = useLang()

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="header">
          <h1>{t('howto_page_title')}</h1>
          <p>{t('howto_page_sub')}</p>
        </div>

        <div className="how-to-intro">
          <p>
            {t('howto_intro_p1')} <strong>{t('howto_intro_discovered')}</strong> {t('howto_intro_p1c')}{' '}
            <strong>{t('howto_intro_rtfm')}</strong> {t('howto_intro_p1e')}
          </p>
          <p style={{ marginTop: 6 }}>
            {t('howto_intro_p2a')} <strong>{t('howto_intro_browser')}</strong> {t('howto_intro_p2c')}{' '}
            <strong>{t('howto_intro_editor')}</strong> {t('howto_intro_p2e')}
          </p>
        </div>

        {/* ── Channel Browser ──────────────────────────────────────────────── */}
        <details className="info-panel" open>
          <summary>
            <span>{t('howto_browse_title')}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_search_title')}</h4>
              <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.7 }}>
                <li>{t('howto_search_li1a')} <strong>{t('howto_search_li1b')}</strong> {t('howto_search_li1c')}</li>
                <li>{t('howto_search_li2a')} <strong>{t('howto_search_li2b')}</strong> {t('howto_search_li2c')}</li>
                <li>{t('howto_search_li3a')} <strong>{t('howto_search_li3b')}</strong> {t('howto_search_li3c')}</li>
                <li>{t('howto_search_li4a')} <strong>{t('howto_search_li4b')}</strong> {t('howto_search_li4c')}</li>
              </ul>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_sort_title')}</h4>
              <p>
                {t('howto_sort_body')} <strong>{t('howto_sort_cols')}</strong>.
              </p>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_details_title')}</h4>
              <p>
                {t('howto_details_body')} <strong>ℹ</strong> {t('howto_details_body2')}
              </p>
            </div>
          </div>
        </details>

        {/* ── Exporting ────────────────────────────────────────────────────── */}
        <details className="info-panel">
          <summary>
            <span>{t('howto_export_title')}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_formats_title')}</h4>
              <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.7 }}>
                <li><strong>⬇ JSON</strong> {t('howto_formats_li1')}</li>
                <li><strong>⬇ TXT</strong> {t('howto_formats_li2')}</li>
                <li><strong>⬇ RTfM</strong> {t('howto_formats_li3')}</li>
              </ul>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_selection_title')}</h4>
              <p>{t('howto_selection_body')}</p>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_import_title')}</h4>
              <ol style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.7 }}>
                <li>{t('howto_import_li1a')} <strong>{t('howto_import_li1c')}</strong></li>
                <li>{t('howto_import_li2')}</li>
                <li>{t('howto_import_li3a')} <strong>Channels → Import</strong></li>
                <li>{t('howto_import_li4')}</li>
              </ol>
            </div>
          </div>
        </details>

        {/* ── Local Editor ─────────────────────────────────────────────────── */}
        <details className="info-panel">
          <summary>
            <span>{t('howto_editor_title')}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_editor_what_title')}</h4>
              <p>
                {t('howto_editor_what_p')} <strong>{t('howto_editor_what_name')}</strong> {t('howto_editor_what_body')}
              </p>
            </div>
            <div className="info-box warn">
              <h4>{t('howto_storage_title')}</h4>
              <p>
                {t('howto_storage_body1')} <strong>{t('howto_storage_bold')}</strong>{t('howto_storage_body2')}
                {' '}<strong>{t('howto_storage_export')}</strong> {t('howto_storage_body3')}
              </p>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_server_title')}</h4>
              <p>
                {t('howto_server_body1')} <code>npm run server</code>{t('howto_server_body2')}
                {' '}<code>docs/data/channels.json</code> {t('howto_server_body3')}{' '}
                <strong>{t('howto_server_section')}</strong> {t('howto_server_body4')}
              </p>
            </div>
          </div>
        </details>

        {/* ── Running locally ──────────────────────────────────────────────── */}
        <details className="info-panel">
          <summary>
            <span>{t('howto_local_title')}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_req_title')}</h4>
              <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.7 }}>
                <li><strong>Node.js</strong> 18 or newer</li>
                <li><strong>npm</strong> 9 or newer</li>
                <li>Git</li>
              </ul>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_clone_title')}</h4>
              <pre>{`git clone https://github.com/Elektr0Vodka/meshcore-nl-discovered-channels.git
cd meshcore-nl-discovered-channels
npm install`}</pre>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_dev_title')}</h4>
              <pre>{`npm run dev`}</pre>
              <p style={{ marginTop: 6 }}>
                {t('howto_dev_body1')} <strong>http://localhost:5173</strong> {t('howto_dev_body2')}
              </p>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_api_title')}</h4>
              <pre>{`npm run server`}</pre>
              <p style={{ marginTop: 6 }}>
                {t('howto_api_body1')} <strong>port 8080</strong>{t('howto_api_body2')}{' '}
                <code>npm run dev</code>{t('howto_api_body3')}{' '}
                <code>docs/data/channels.json</code> {t('howto_api_body4')}
              </p>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_build_title')}</h4>
              <pre>{`npm run build`}</pre>
              <p style={{ marginTop: 6 }}>
                {t('howto_build_body1')} <code>docs/</code>{t('howto_build_body2')}
              </p>
            </div>
          </div>
        </details>

        {/* ── Contributing ─────────────────────────────────────────────────── */}
        <details className="info-panel">
          <summary>
            <span>{t('howto_contrib_title')}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_contrib_how')}</h4>
              <p>
                {t('howto_contrib_body1')}{' '}
                <a
                  href="https://github.com/Elektr0Vodka/meshcore-nl-discovered-channels/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Issues
                </a>{' '}
                {t('howto_contrib_body2')}
              </p>
              <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.7 }}>
                <li>{t('howto_contrib_li1')} <code>docs/data/channels.json</code></li>
                <li>{t('howto_contrib_li2')}</li>
                <li>{t('howto_contrib_li3')}</li>
                <li>{t('howto_contrib_li4')}</li>
              </ul>
            </div>
            <div className="info-box">
              <h4 style={{ color: '#93c5fd' }}>{t('howto_schema_title')}</h4>
              <p>{t('howto_schema_body')}</p>
              <pre>{`{
  "channel": "#channel-name",
  "channel_hash": "32charhexkey",
  "category": "Regional",
  "subcategory": "City",
  "country": "Netherlands",
  "region": "Noord-Holland",
  "language": ["NL"],
  "scopes": ["nl", "nl-nh"],
  "status": "active",
  "source": "radio",
  "verified": false,
  "recommended": false,
  "tags": [],
  "notes": ""
}`}</pre>
            </div>
          </div>
        </details>

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        <details className="info-panel">
          <summary>
            <span>{t('howto_notes_title')}</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="info-panel-body">
            <div className="info-box">
              <ul style={{ paddingLeft: 18, lineHeight: 1.7 }}>
                <li>{t('howto_notes_li1a')} <strong>{t('howto_notes_li1b')}</strong> {t('howto_notes_li1c')}</li>
                <li>{t('howto_notes_li2')}</li>
                <li>{t('howto_notes_li3')}</li>
                <li>{t('howto_notes_li4')}</li>
              </ul>
            </div>
          </div>
        </details>

        <footer className="site-footer">
          <a
            href="https://github.com/Elektr0Vodka/meshcore-nl-discovered-channels"
            target="_blank"
            rel="noopener noreferrer"
          >
            ElektroVodka
          </a>
          {' '}&mdash; {t('footer')}
        </footer>
      </div>
    </>
  )
}
