import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme, type Theme } from '../../hooks/useTheme'
import { useLang } from '../../hooks/useLang'

const THEMES: { id: Theme; icon: string; label: string }[] = [
  { id: 'dark',  icon: '🌙', label: 'Dark'       },
  { id: 'light', icon: '☀',  label: 'Light'      },
  { id: 'win95', icon: '🖥',  label: 'Windows 95' },
  { id: 'minimalistic', icon: '◦', label: 'Minimalistic' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLang()
  const inChannelBrowser = pathname.startsWith('/channel-browser')
  const [menuOpen, setMenuOpen] = useState(false)

  const close = () => setMenuOpen(false)

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link className="nav-brand" to="/" onClick={close}>
          <img
            className="brand-logo-img"
            src="https://avatars.githubusercontent.com/u/279831159?s=400&u=f8b17fbf4860043026f3b7bb5233968cfd98aec9&v=4"
            alt="DutchMeshCore logo"
          />
          DutchMeshCore <span>Toolbox</span>
        </Link>

        <button
          className={`nav-hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>

        <div className={`nav-menu${menuOpen ? ' open' : ''}`}>
          <div className="nav-links">
            <Link to="/" className={pathname === '/' ? 'active' : ''} onClick={close}>{t('nav_home')}</Link>
            <div className="nav-dropdown">
              <Link to="/channel-browser" className={`nav-dropdown-trigger${inChannelBrowser ? ' active' : ''}`} onClick={close}>
                {t('nav_browser')} <span className="nav-caret" aria-hidden="true">▾</span>
              </Link>
              <div className="nav-dropdown-menu">
                <Link to="/channel-browser" className={pathname === '/channel-browser' ? 'active' : ''} onClick={close}>{t('nav_browser')}</Link>
                <Link to="/channel-browser/editor" className={pathname === '/channel-browser/editor' ? 'active' : ''} onClick={close}>{t('nav_editor')}</Link>
                <Link to="/channel-browser/how-to" className={pathname === '/channel-browser/how-to' ? 'active' : ''} onClick={close}>{t('nav_howto')}</Link>
              </div>
            </div>
            <Link to="/mqtt-cli" className={pathname === '/mqtt-cli' ? 'active' : ''} onClick={close}>{t('nav_mqtt')}</Link>
            <Link to="/firmware" className={pathname === '/firmware' ? 'active' : ''} onClick={close}>{t('nav_firmware')}</Link>
            <Link to="/keygen" className={pathname === '/keygen' ? 'active' : ''} onClick={close}>{t('nav_keygen')}</Link>
          </div>
          <div className="nav-actions">
            <a
              href="http://discord.dutchmeshcore.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="discord-btn"
              title="Join DutchMeshCore Discord"
              aria-label="Join DutchMeshCore Discord"
              onClick={close}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Join Discord</span>
            </a>
            <button
              className="icon-btn lang-toggle"
              title="Switch language / Taal wisselen"
              onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}
            >
              {lang === 'nl' ? '🇬🇧 EN' : '🇳🇱 NL'}
            </button>
            <div className="view-btns" title="Switch theme">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`view-btn${theme === t.id ? ' active' : ''}`}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={theme === t.id}
                >
                  {t.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
