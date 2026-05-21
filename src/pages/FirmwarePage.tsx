import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'
import { fetchDmcConfig } from '../utils/dutchFlasherConfig'
import type { FlasherConfig } from '../types'

const FIRMWARE_REPO = 'https://github.com/Dutch-MeshCore/DutchMeshCore.nl-MQTT'

const copy = {
  nl: {
    title: 'Firmware',
    subtitle: 'Download of flash DutchMeshCore MQTT-firmware rechtstreeks vanuit de GitHub-repo.',
    device: 'Apparaat',
    version: 'Versie',
    downloadBin: '⬇ Download app .bin',
    downloadMerged: '⬇ Download merged .bin',
    flash: '⚡ Direct flashen',
    allReleases: 'Alle releases',
    binNote: 'Gebruik voor updates op bestaande apparaten. Behoudt bootloader, instellingen en pubkey.',
    mergedNote: 'Gebruik voor nieuwe of fabrieksgereset apparaten. Schrijft alles opnieuw, inclusief bootloader.',
    loading: 'Firmware laden…',
    error: 'Kon firmware-lijst niet laden.',
    retry: 'Opnieuw proberen',
    pr_title: 'ℹ Over deze firmware-fork',
    pr_body: 'Het enige verschil ten opzichte van upstream MeshCore is dat we DutchMeshCore-serverpresets hebben toegevoegd. We hebben een PR ingediend om dit samen te voegen. Zodra die is goedgekeurd, schakelen we over op de officiële upstream.',
    pr_link: 'Bekijk de PR op GitHub',
    warn_title: '⚠ Niet getest op alle hardware',
    warn_body: 'De meeste firmware-builds op deze pagina zijn niet persoonlijk getest op hardware. Iets werkt niet of loop je ergens tegenaan?',
    warn_discord: 'Kom langs op onze Discord',
    vanilla: 'Vanilla (niet-MQTT) firmware flashen? Gebruik',
    footer: 'Community tools voor MeshCore NL - 2026',
  },
  en: {
    title: 'Firmware',
    subtitle: 'Download or flash DutchMeshCore MQTT firmware directly from the GitHub repo.',
    device: 'Device',
    version: 'Version',
    downloadBin: '⬇ Download app .bin',
    downloadMerged: '⬇ Download merged .bin',
    flash: '⚡ Flash directly',
    allReleases: 'All releases',
    binNote: 'For updates on existing devices. Keeps bootloader, settings and pubkey.',
    mergedNote: 'For new or factory-reset devices. Rewrites everything including bootloader.',
    loading: 'Loading firmware…',
    error: 'Could not load firmware list.',
    retry: 'Retry',
    pr_title: 'ℹ About this firmware fork',
    pr_body: 'The only difference from upstream MeshCore is that we added DutchMeshCore server presets. We have submitted a PR to get this merged. Once accepted, we will switch to official upstream firmware.',
    pr_link: 'View the PR on GitHub',
    warn_title: '⚠ Not tested on all hardware',
    warn_body: 'Most firmware builds on this page have not been personally tested on hardware. Something not working or running into an issue?',
    warn_discord: 'Join us on Discord',
    vanilla: 'Want to flash vanilla (non-MQTT) firmware? Use',
    footer: 'Community tools for MeshCore NL - 2026',
  },
}

export default function FirmwarePage() {
  const { lang } = useLang()
  const c = copy[lang]

  const [config, setConfig] = useState<FlasherConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedName, setSelectedName] = useState('')

  function load() {
    setLoading(true)
    setError(false)
    fetchDmcConfig()
      .then(cfg => {
        setConfig(cfg)
        if (cfg.device.length > 0) setSelectedName(cfg.device[0].name)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const device   = useMemo(() => config?.device.find(d => d.name === selectedName), [config, selectedName])
  const firmware = device?.firmware[0]
  const versions = Object.entries(firmware?.version ?? {})

  // Pull apart the two version entries (App update / Full flash)
  const appEntry    = versions.find(([k]) => k.includes('App update'))
  const mergedEntry = versions.find(([k]) => k.includes('Full flash'))
  const appFile     = appEntry?.[1].files[0]
  const mergedFile  = mergedEntry?.[1].files[0]
  const semver      = (appEntry ?? mergedEntry)?.[0].split(' — ')[0] ?? ''

  return (
    <>
      <Navbar />
      <main className="page home-page firmware-page">
        <section className="hero">
          <img
            className="hero-logo"
            src="https://avatars.githubusercontent.com/u/279831159?s=400&u=f8b17fbf4860043026f3b7bb5233968cfd98aec9&v=4"
            alt="DutchMeshCore logo"
          />
          <h1>DutchMeshCore <em>{c.title}</em></h1>
          <p>{c.subtitle}</p>
        </section>

        <div className="info-box firmware-warn">
          <h4>{c.pr_title}</h4>
          <p>
            {c.pr_body}{' '}
            <a href="https://github.com/agessaman/MeshCore/pull/10" target="_blank" rel="noopener noreferrer">
              {c.pr_link}
            </a>.
          </p>
        </div>

        <div className="info-box warn firmware-warn">
          <h4>{c.warn_title}</h4>
          <p>
            {c.warn_body}{' '}
            <a href="http://discord.dutchmeshcore.nl" target="_blank" rel="noopener noreferrer">
              {c.warn_discord}
            </a>.
          </p>
        </div>

        <section className="firmware-panel">
          <div className="firmware-panel-head">
            <div>
              <h2>DutchMeshCore MQTT</h2>
              <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
                {c.vanilla}{' '}
                <a href="https://flasher.meshcore.io" target="_blank" rel="noopener noreferrer">
                  flasher.meshcore.io
                </a>.
              </p>
            </div>
            <span className="tool-badge">GitHub .prebuilt</span>
          </div>

          {loading && (
            <p style={{ color: 'var(--muted)', padding: '.5rem 0' }}>{c.loading}</p>
          )}

          {error && (
            <div className="info-banner error" style={{ marginBottom: '1rem' }}>
              {c.error}{' '}
              <button className="btn" onClick={load}>{c.retry}</button>
            </div>
          )}

          {config && (
            <>
              <div className="firmware-form">
                <label>
                  <span>{c.device}</span>
                  <select value={selectedName} onChange={e => setSelectedName(e.target.value)}>
                    {config.device.map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              {semver && (
                <div className="firmware-result">
                  <div>
                    <span>{c.version}</span>
                    <strong>{selectedName} — {semver}</strong>
                  </div>
                  <div className="firmware-actions">
                    {appFile && (
                      <a className="btn btn-accent" href={appFile.name} download title={c.binNote}>
                        {c.downloadBin}
                      </a>
                    )}
                    {mergedFile && (
                      <a className="btn" href={mergedFile.name} download title={c.mergedNote}>
                        {c.downloadMerged}
                      </a>
                    )}
                    <a
                      className="btn"
                      href={`${FIRMWARE_REPO}/releases`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {c.allReleases}
                    </a>
                    <Link to="/flasher" className="btn">{c.flash}</Link>
                  </div>
                  <div className="firmware-bin-notes">
                    {appFile    && <p><strong>{c.downloadBin.replace('⬇ ', '')}:</strong> {c.binNote}</p>}
                    {mergedFile && <p><strong>{c.downloadMerged.replace('⬇ ', '')}:</strong> {c.mergedNote}</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="site-footer">
          <a href="https://github.com/Dutch-MeshCore" target="_blank" rel="noopener noreferrer">Dutch-MeshCore</a>
          {' '}— {c.footer}
        </footer>
      </main>
    </>
  )
}
