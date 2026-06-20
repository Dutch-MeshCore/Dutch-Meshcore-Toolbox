import { useState } from 'react'
import { useLang } from '../../hooks/useLang'
import type { SerialDeviceInfo, DeviceVars, RadioPreset } from '../../types'
import { utf8ByteLength, nameMaxBytes, ownerInfoBytes, afToDutyCycle, dutyCycleToAf, matchPreset } from '../../utils/configUtils'
import VanityKeyDialog from './VanityKeyDialog'
import ConsoleDialog from './ConsoleDialog'
import MapDialog from './MapDialog'
import { useVanityKey } from '../../hooks/useVanityKey'
import FilterSettingsForm from './FilterSettingsForm'
import { defaultFilterSettings } from '../../lib/config/filterCommands'

interface Props {
  device: SerialDeviceInfo
  busy: string
  presets: RadioPreset[]
  showAdvanced: boolean
  onToggleAdvanced: () => void
  onUpdate: (patch: Partial<SerialDeviceInfo>) => void
  onSave: () => void
  onSendAdvert: () => void
  onStartOta: () => void
  onReboot: () => void
  onFactoryReset: () => void
  onSendCommand: (cmd: string) => Promise<string>
  onExport: () => void
  onImport: (json: string) => void
}

export default function ConfigForm({
  device, busy, presets, showAdvanced, onToggleAdvanced,
  onUpdate, onSave, onSendAdvert, onStartOta, onReboot, onFactoryReset,
  onSendCommand, onExport, onImport,
}: Props) {
  const { t } = useLang()
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [vanityOpen, setVanityOpen] = useState(false)
  const [showDmc, setShowDmc] = useState(false)
  const vanity = useVanityKey()

  const vars = device.vars
  const nameBytes = utf8ByteLength(vars.name)
  const nameMax = nameMaxBytes(vars.lat, vars.lon)

  function patchVars(patch: Partial<DeviceVars>) {
    onUpdate({ vars: { ...vars, ...patch } })
  }

  // ── Section: Info & Actions ──────────────────────────────────────────────────
  const InfoSection = (
    <div className="panel">
      <div className="panel-legend">{t('config_section_info')}</div>

      <div className="field-row">
        <div className="field-group">
          <label>Version</label>
          <input value={device.version} readOnly />
        </div>
        <div className="field-group">
          <label>Clock</label>
          <input value={device.clock} readOnly />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>Role</label>
          <input value={device.role} readOnly />
        </div>
        <div className="field-group">
          <label>Public Key</label>
          <input value={device.pubKey} readOnly />
        </div>
      </div>

      <div className="action-bar" style={{ marginTop: '.5rem' }}>
        <button className="btn" onClick={() => setConsoleOpen(true)}>🖥 {t('config_console')}</button>
        <button className="btn" onClick={onExport}>⬆ {t('config_export')}</button>
        <label className="btn" style={{ cursor: 'pointer' }}>
          ⬇ {t('config_import')}
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
            const f = e.target.files?.[0]
            if (!f) return
            const reader = new FileReader()
            reader.onload = () => { try { onImport(reader.result as string) } catch { /* ignore */ } }
            reader.readAsText(f)
            e.target.value = ''
          }} />
        </label>
        <button className="btn" onClick={onSendAdvert}>{t('config_send_advert')}</button>
        <button className="btn" onClick={onStartOta}>{t('config_start_ota')}</button>
        <button className="btn" onClick={onReboot}>{t('config_reboot')}</button>
        <button className="btn" onClick={onFactoryReset}>{t('config_factory_reset')}</button>
      </div>
    </div>
  )

  // ── Section: Name & Location ─────────────────────────────────────────────────
  const LocationSection = (
    <div className="panel">
      <div className="panel-legend">{t('config_section_location')}</div>

      <div className="field-group">
        <label>Name</label>
        <input
          value={vars.name}
          maxLength={nameMax}
          onChange={e => patchVars({ name: e.target.value })}
        />
        <div className={`byte-counter${nameBytes > nameMax ? ' over' : ''}`}>
          {nameBytes}/{nameMax} bytes
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>Latitude</label>
          <input
            type="number"
            step="0.00001"
            value={vars.lat}
            onChange={e => patchVars({ lat: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="field-group">
          <label>Longitude</label>
          <input
            type="number"
            step="0.00001"
            value={vars.lon}
            onChange={e => patchVars({ lon: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <button className="btn" onClick={() => setMapOpen(true)}>🗺 Pick on map</button>
    </div>
  )

  // ── Section: Access ───────────────────────────────────────────────────────────
  const AccessSection = (
    <div className="panel">
      <div className="panel-legend">{t('config_section_access')}</div>

      <label className="check-row">
        <input
          type="checkbox"
          checked={vars['allow.read.only']}
          onChange={e => patchVars({ 'allow.read.only': e.target.checked })}
        />
        Allow read-only access
      </label>

      <div className="field-group" style={{ marginTop: '.5rem' }}>
        <label>Guest password</label>
        <input
          value={vars['guest.password']}
          onChange={e => patchVars({ 'guest.password': e.target.value })}
          placeholder="leave blank to disable"
        />
      </div>

      <div className="field-group">
        <label>Admin password</label>
        <input
          type="password"
          value={device.password}
          onChange={e => onUpdate({ password: e.target.value })}
          placeholder="leave blank to keep current"
        />
      </div>
    </div>
  )

  // ── Section: Room Server ──────────────────────────────────────────────────────
  const RoomSection = device.role === 'roomServer' ? (
    <div className="panel">
      <div className="panel-legend">{t('config_section_room')}</div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={vars.repeat}
          onChange={e => patchVars({ repeat: e.target.checked })}
        />
        Enable repeat
      </label>
    </div>
  ) : null

  // ── Section: Radio ────────────────────────────────────────────────────────────
  const currentPreset = matchPreset(presets, vars.radio)
  const dutyCycle = afToDutyCycle(vars.af)

  const RadioSection = (
    <div className="panel">
      <div className="panel-legend">{t('config_section_radio')}</div>

      {presets.length > 0 && (
        <div className="field-group">
          <label>Preset</label>
          <select
            value={currentPreset.title}
            onChange={e => {
              const p = presets.find(x => x.title === e.target.value)
              if (!p) return
              patchVars({
                radio: {
                  freq: p.frequency ? p.frequency.toFixed(3) : vars.radio.freq,
                  bw: p.bandwidth ? String(p.bandwidth) : vars.radio.bw,
                  sf: p.spreading_factor ? String(p.spreading_factor) : vars.radio.sf,
                  cr: p.coding_rate ? String(p.coding_rate) : vars.radio.cr,
                },
              })
            }}
          >
            {presets.map(p => <option key={p.title} value={p.title}>{p.title}</option>)}
            {!presets.some(p => p.title === currentPreset.title) && (
              <option value={currentPreset.title}>{currentPreset.title}</option>
            )}
          </select>
        </div>
      )}

      <div className="field-row">
        <div className="field-group">
          <label>Frequency (MHz)</label>
          <input
            type="number" step="0.001"
            value={vars.radio.freq}
            onChange={e => patchVars({ radio: { ...vars.radio, freq: e.target.value } })}
          />
        </div>
        <div className="field-group">
          <label>Bandwidth (kHz)</label>
          <input
            type="number"
            value={vars.radio.bw}
            onChange={e => patchVars({ radio: { ...vars.radio, bw: e.target.value } })}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>Spreading Factor</label>
          <input
            type="number" min={6} max={12}
            value={vars.radio.sf}
            onChange={e => patchVars({ radio: { ...vars.radio, sf: e.target.value } })}
          />
        </div>
        <div className="field-group">
          <label>Coding Rate</label>
          <input
            type="number" min={5} max={8}
            value={vars.radio.cr}
            onChange={e => patchVars({ radio: { ...vars.radio, cr: e.target.value } })}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>TX Power</label>
          <input type="number" value={vars.tx} onChange={e => patchVars({ tx: Number(e.target.value) })} />
        </div>
        <div className="field-group">
          <label>Duty cycle % (AF = {vars.af})</label>
          <input
            type="number" min={1} max={100}
            value={dutyCycle}
            onChange={e => patchVars({ af: dutyCycleToAf(Number(e.target.value)) })}
          />
        </div>
      </div>
    </div>
  )

  // ── Section: Advertising ─────────────────────────────────────────────────────
  const AdvertSection = (
    <div className="panel">
      <div className="panel-legend">{t('config_section_advert')}</div>

      <div className="field-row">
        <div className="field-group">
          <label>Advert interval (min)</label>
          <input
            type="number" min={0}
            value={vars['advert.interval']}
            onChange={e => patchVars({ 'advert.interval': Number(e.target.value) })}
          />
        </div>
        <div className="field-group">
          <label>Flood advert interval (H)</label>
          <input
            type="number" min={0}
            value={vars['flood.advert.interval']}
            onChange={e => patchVars({ 'flood.advert.interval': Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="field-group">
        <label>Flood max (hops)</label>
        <input
          type="number" min={0}
          value={vars['flood.max']}
          onChange={e => patchVars({ 'flood.max': Number(e.target.value) })}
        />
      </div>
    </div>
  )

  // ── Section: Owner Info ───────────────────────────────────────────────────────
  const ownerBytes = ownerInfoBytes(vars['owner.info'])

  const OwnerSection = (
    <div className="panel">
      <div className="panel-legend">{t('config_section_owner')}</div>

      <div className="field-group">
        <label>Owner info (| = newline on device)</label>
        <textarea
          rows={3}
          value={vars['owner.info']}
          onChange={e => patchVars({ 'owner.info': e.target.value })}
          placeholder="e.g. John Doe|City"
        />
        <div className={`byte-counter${ownerBytes > 64 ? ' over' : ''}`}>
          {ownerBytes}/64 bytes
        </div>
      </div>

      <div className="field-group" style={{ marginTop: '.5rem' }}>
        <label>Public key</label>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input value={device.pubKey} readOnly style={{ flex: 1 }} />
          <button className="btn" onClick={() => setVanityOpen(true)}>✨ Vanity</button>
        </div>
      </div>
    </div>
  )

  // ── Section: Advanced ─────────────────────────────────────────────────────────
  const AdvancedSection = showAdvanced ? (
    <div className="panel">
      <div className="panel-legend">{t('config_section_advanced')}</div>

      <div className="field-row">
        <div className="field-group">
          <label>RX delay (s)</label>
          <input type="number" step="0.1" value={vars.rxdelay} onChange={e => patchVars({ rxdelay: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="field-group">
          <label>TX delay (s)</label>
          <input type="number" step="0.1" value={vars.txdelay} onChange={e => patchVars({ txdelay: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>Direct TX delay (s)</label>
          <input type="number" step="0.1" value={vars['direct.txdelay']} onChange={e => patchVars({ 'direct.txdelay': parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="field-group">
          <label>Int. threshold</label>
          <input type="number" value={vars['int.thresh']} onChange={e => patchVars({ 'int.thresh': Number(e.target.value) })} />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>AGC reset interval (s)</label>
          <input type="number" value={vars['agc.reset.interval']} onChange={e => patchVars({ 'agc.reset.interval': Number(e.target.value) })} />
        </div>
        <div className="field-group">
          <label>Multi ACKs</label>
          <input value={vars['multi.acks']} onChange={e => patchVars({ 'multi.acks': e.target.value })} />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>Path hash mode</label>
          <select value={vars['path.hash.mode']} onChange={e => patchVars({ 'path.hash.mode': e.target.value })}>
            <option value="0">Default (0)</option>
            <option value="1">Mode 1</option>
            <option value="2">Mode 2</option>
          </select>
        </div>
        <div className="field-group">
          <label>Loop detect</label>
          <select value={vars['loop.detect']} onChange={e => patchVars({ 'loop.detect': e.target.value })}>
            <option value="off">Off</option>
            <option value="on">On</option>
            <option value="strict">Strict</option>
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>Flood max unscoped (hops)</label>
          <input type="number" min={0} max={64} value={vars['flood.max.unscoped']} onChange={e => patchVars({ 'flood.max.unscoped': Number(e.target.value) })} />
        </div>
        <div className="field-group">
          <label>Flood max advert (hops)</label>
          <input type="number" min={0} max={64} value={vars['flood.max.advert']} onChange={e => patchVars({ 'flood.max.advert': Number(e.target.value) })} />
        </div>
      </div>

      <label className="check-row">
        <input type="checkbox" checked={vars.cad} onChange={e => patchVars({ cad: e.target.checked })} />
        Channel Activity Detection (CAD)
      </label>

      <label className="check-row">
        <input type="checkbox" checked={vars['radio.rxgain']} onChange={e => patchVars({ 'radio.rxgain': e.target.checked })} />
        Boosted RX gain (radio.rxgain)
      </label>

      <div className="field-group" style={{ marginTop: '.5rem' }}>
        <label>ADC multiplier (battery calibration; 0 = board default)</label>
        <input type="number" step="0.001" min={0} value={vars['adc.multiplier']} onChange={e => patchVars({ 'adc.multiplier': parseFloat(e.target.value) || 0 })} />
      </div>
    </div>
  ) : null

  // ── Section: Packet Filter (Custom DMC firmware only) ────────────────────────
  // Shown when the device responds to the `filter` probe (device.filter is set
  // by useSerialDevice only for filter-capable firmware), independent of its name.
  const FilterPanel = device.filter ? (
    <div className="panel">
      <div className="panel-legend">{t('config_section_filter')}</div>
      <FilterSettingsForm
        value={device.filter}
        onChange={f => onUpdate({ filter: f })}
      />
      <button
        className="btn" style={{ marginTop: '.6rem' }}
        onClick={async () => {
          await onSendCommand('filter reset')
          onUpdate({ filter: defaultFilterSettings(), filterDevice: defaultFilterSettings() })
        }}
      >
        ♻ Reset filter to defaults
      </button>
    </div>
  ) : null

  return (
    <div>
      {busy && (
        <div className="info-banner info" style={{ marginBottom: '.75rem' }}>
          ⏳ {busy}
        </div>
      )}

      {InfoSection}
      {LocationSection}
      {AccessSection}
      {RoomSection}
      {RadioSection}
      {AdvertSection}
      {OwnerSection}

      {device.filter && (
        <button className="btn" onClick={() => setShowDmc(v => !v)} style={{ marginBottom: '.75rem' }}>
          {showDmc ? '▲' : '▼'} {t('config_show_dmc')}
        </button>
      )}
      {showDmc && FilterPanel}

      <button className="btn" onClick={onToggleAdvanced} style={{ marginBottom: '.75rem' }}>
        {showAdvanced ? '▲' : '▼'} {t('config_show_advanced')}
      </button>

      {AdvancedSection}

      <div className="action-bar" style={{ marginTop: '1rem' }}>
        <button className="btn btn-accent" onClick={onSave}>💾 {t('config_save')}</button>
      </div>

      {/* Dialogs */}
      <ConsoleDialog
        open={consoleOpen}
        content=""
        onSend={onSendCommand}
        onClose={() => setConsoleOpen(false)}
      />

      <MapDialog
        open={mapOpen}
        lat={Number(vars.lat) || 52.3}
        lon={Number(vars.lon) || 5.3}
        onSet={(lat, lon) => { patchVars({ lat, lon }); setMapOpen(false) }}
        onCancel={() => setMapOpen(false)}
      />

      <VanityKeyDialog
        open={vanityOpen}
        phase={vanity.phase}
        prefix={vanity.prefix}
        attempts={vanity.attempts}
        progress={vanity.progress}
        elapsed={vanity.elapsed}
        keysPerSec={vanity.keysPerSec}
        estimatedTime={vanity.estimatedTime}
        resultPubKey={vanity.resultPubKey}
        resultPrvKey={vanity.resultPrvKey}
        onPrefixChange={vanity.setPrefix}
        onGenerate={() => vanity.start(vanity.prefix)}
        onCancel={() => { vanity.cancel(); setVanityOpen(false) }}
        onApply={(pub, prv) => {
          onUpdate({ pubKey: pub, prvKey: prv })
          setVanityOpen(false)
          vanity.reset()
        }}
      />
    </div>
  )
}
