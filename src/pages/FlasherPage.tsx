import { useEffect, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import DeviceList from '../components/flasher/DeviceList'
import RoleSelector from '../components/flasher/RoleSelector'
import FlashOptions from '../components/flasher/FlashOptions'
import FlashProgress from '../components/flasher/FlashProgress'
import SerialConsole from '../components/flasher/SerialConsole'
import { useFlasher } from '../hooks/useFlasher'
import { useSerialConsole } from '../hooks/useSerialConsole'
import { useLang } from '../hooks/useLang'
import type { FlasherConfig, FlasherDevice, DeviceFirmware, FlasherStep } from '../types'
import { fetchDmcConfig } from '../utils/dutchFlasherConfig'

interface State {
  step: FlasherStep
  device: FlasherDevice | null
  firmware: DeviceFirmware | null
}

type Action =
  | { type: 'SELECT_DEVICE';   device: FlasherDevice }
  | { type: 'SELECT_FIRMWARE'; firmware: DeviceFirmware }
  | { type: 'FLASH_START' }
  | { type: 'FLASH_DONE' }
  | { type: 'FLASH_ERROR' }
  | { type: 'BACK' }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_DEVICE':
      return { step: 'device_selected', device: action.device, firmware: null }
    case 'SELECT_FIRMWARE':
      return { ...state, step: 'role_selected', firmware: action.firmware }
    case 'FLASH_START':
      return { ...state, step: 'flashing' }
    case 'FLASH_DONE':
      return { ...state, step: 'done' }
    case 'FLASH_ERROR':
      return { ...state, step: 'error' }
    case 'BACK':
      if (state.step === 'role_selected') return { ...state, step: 'device_selected', firmware: null }
      if (state.step === 'device_selected') return { step: 'idle', device: null, firmware: null }
      return state
    case 'RESET':
      return { step: 'idle', device: null, firmware: null }
    default:
      return state
  }
}

export default function FlasherPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [sel, dispatch] = useReducer(reducer, { step: 'idle', device: null, firmware: null })

  const [config, setConfig] = useState<FlasherConfig | null>(null)
  const [configError, setConfigError] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)

  const flasher = useFlasher()
  const console_ = useSerialConsole()

  useEffect(() => {
    loadConfig()
  }, [])

  function loadConfig() {
    setConfigLoading(true)
    setConfigError(false)
    fetchDmcConfig()
      .then(data => { setConfig(data); setConfigLoading(false) })
      .catch(() => { setConfigError(true); setConfigLoading(false) })
  }

  async function handleFlash(opts: { version: string; wipe: boolean }) {
    if (!config || !sel.device || !sel.firmware) return
    dispatch({ type: 'FLASH_START' })
    await flasher.flash(sel.device, sel.firmware, config, opts)
    if (flasher.error) dispatch({ type: 'FLASH_ERROR' })
    else dispatch({ type: 'FLASH_DONE' })
  }

  function handleRetry() {
    flasher.reset()
    dispatch({ type: 'RESET' })
  }

  function retryConfig() {
    loadConfig()
  }

  return (
    <>
      <Navbar />
      <main className="device-page">
        <div className="device-page-header">
          <h1>⚡ {t('flasher_title')}</h1>
          {config && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
              <button className="btn" onClick={() => console_.open()} title={t('flasher_console')}>
                🖥 {t('flasher_console')}
              </button>
              <button className="btn" onClick={() => navigate('/usb-config')} title={t('flasher_repeater_setup')}>
                🔧 {t('flasher_repeater_setup')}
              </button>
            </div>
          )}
        </div>

        {!flasher.supported && (
          <div className="info-banner warn">{t('flasher_unsupported')}</div>
        )}

        {configLoading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

        {configError && (
          <div className="info-banner error">
            {t('flasher_config_error')}{' '}
            <button className="btn" onClick={retryConfig}>
              {t('flasher_config_retry')}
            </button>
          </div>
        )}

        {config && sel.step === 'idle' && (
          <DeviceList devices={config.device} onSelect={d => dispatch({ type: 'SELECT_DEVICE', device: d })} />
        )}

        {config && sel.step === 'device_selected' && sel.device && (
          <RoleSelector
            device={sel.device}
            config={config}
            onSelect={fw => dispatch({ type: 'SELECT_FIRMWARE', firmware: fw })}
            onBack={() => dispatch({ type: 'BACK' })}
          />
        )}

        {config && (sel.step === 'role_selected' || sel.step === 'ready') && sel.device && sel.firmware && (
          <FlashOptions
            device={sel.device}
            firmware={sel.firmware}
            config={config}
            supported={flasher.supported}
            onFlash={handleFlash}
            onBack={() => dispatch({ type: 'BACK' })}
            dfuComplete={flasher.dfuComplete}
            nrfEraserPercent={flasher.nrfEraserPercent}
            nrfEraserFlashing={flasher.nrfEraserFlashing}
            onDfuMode={flasher.dfuMode}
            onNrfErase={() => config && sel.device && flasher.nrfErase(sel.device, config)}
          />
        )}

        {config && (sel.step === 'flashing' || sel.step === 'done' || sel.step === 'error') && sel.device && sel.firmware && (
          <FlashProgress
            device={sel.device}
            firmware={sel.firmware}
            config={config}
            percent={flasher.percent}
            log={flasher.log}
            error={flasher.error}
            onRetry={handleRetry}
            onClose={handleRetry}
            onConfigureUsb={() => navigate('/usb-config')}
          />
        )}

        <footer className="device-page-footer">
          {t('flasher_source')}{' '}
          <a href="https://github.com/meshcore-dev/flasher.meshcore.io" target="_blank" rel="noopener noreferrer">
            flasher.meshcore.io
          </a>
        </footer>
      </main>

      {console_.open_ && (
        <SerialConsole
          content={console_.content}
          onSend={console_.send}
          onClose={console_.close}
        />
      )}
    </>
  )
}
