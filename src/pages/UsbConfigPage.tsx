import { useEffect, useState } from 'react'
import { useLang } from '../hooks/useLang'
import { useSerialDevice } from '../hooks/useSerialDevice'
import ConfigForm from '../components/config/ConfigForm'
import type { RadioPreset, SerialDeviceInfo } from '../types'
import { PRESETS_URL } from '../utils/configUtils'

export default function UsbConfigPage() {
  const { t } = useLang()
  const { supported, state, device, busy, connect, disconnect, setData, sendCommand, updateDevice } =
    useSerialDevice()
  const [presets, setPresets] = useState<RadioPreset[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [toast, setToast] = useState('')

  // Fetch radio presets once
  useEffect(() => {
    fetch(PRESETS_URL)
      .then(r => r.json())
      .then((data: RadioPreset[]) => setPresets(Array.isArray(data) ? data : []))
      .catch(() => setPresets([]))
  }, [])

  // Toast helper
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleSave() {
    try {
      const result = await setData()
      showToast(t('config_saved_toast'))
      if (result?.needsReboot) {
        if (window.confirm(t('config_reboot_confirm'))) {
          await sendCommand('reboot')
        }
      }
    } catch {
      // setData already resets busy; nothing more to do
    }
  }

  async function handleSendAdvert() {
    await sendCommand('advert')
  }

  async function handleStartOta() {
    await sendCommand('ota')
  }

  async function handleReboot() {
    await sendCommand('reboot')
  }

  async function handleFactoryReset() {
    await sendCommand('reset')
  }

  function handleExport() {
    if (!device) return
    const json = JSON.stringify(device.vars, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meshcore-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(json: string) {
    try {
      const parsed = JSON.parse(json)
      if (device && typeof parsed === 'object' && parsed !== null) {
        updateDevice({ vars: { ...device.vars, ...parsed } })
      }
    } catch { /* ignore invalid JSON */ }
  }

  // ── Unsupported browser ───────────────────────────────────────────────────────
  if (!supported) {
    return (
      <div className="page">
        <div className="connect-screen">
          <p className="info-banner warn">{t('config_unsupported')}</p>
        </div>
      </div>
    )
  }

  // ── Disconnected / connecting ─────────────────────────────────────────────────
  if (state !== 'connected' || !device) {
    return (
      <div className="page">
        <div className="connect-screen">
          <h2>{t('config_title')}</h2>
          <button
            className="btn btn-accent"
            onClick={connect}
            disabled={state === 'connecting'}
          >
            {state === 'connecting' ? t('config_connecting') : t('config_connect')}
          </button>
        </div>
      </div>
    )
  }

  // ── Connected ─────────────────────────────────────────────────────────────────
  return (
    <div className="page device-page">
      {/* Busy overlay */}
      {busy && (
        <div className="busy-overlay">
          <div className="spinner" />
          <span>{busy}</span>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Top bar */}
      <div className="device-page-topbar">
        <span className="device-page-title">{t('config_title')}</span>
        <button className="btn" onClick={disconnect}>{t('config_disconnect')}</button>
      </div>

      <ConfigForm
        device={device}
        busy={busy}
        presets={presets}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(v => !v)}
        onUpdate={(patch: Partial<SerialDeviceInfo>) => updateDevice(patch)}
        onSave={handleSave}
        onSendAdvert={handleSendAdvert}
        onStartOta={handleStartOta}
        onReboot={handleReboot}
        onFactoryReset={handleFactoryReset}
        onSendCommand={sendCommand}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Footer */}
      <footer className="page-footer">
        {t('config_source')}{' '}
        <a
          href="https://github.com/meshcore-dev/config.meshcore.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          config.meshcore.io
        </a>
      </footer>
    </div>
  )
}
