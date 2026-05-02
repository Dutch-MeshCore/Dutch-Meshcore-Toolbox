import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'

type FirmwareDevice = {
  id: string
  label: string
  repeaterObserverEnv?: string
  roomServerEnv?: string
}

type FirmwareVariant = {
  id: string
  label: string
  releasePrefix?: string
  envKey?: keyof Pick<FirmwareDevice, 'repeaterObserverEnv' | 'roomServerEnv'>
  experimental?: boolean
}

const FIRMWARE_REPO = 'https://github.com/Dutch-MeshCore/Dutch-MeshCore-MQTT'

const FIRMWARE_DEVICES: FirmwareDevice[] = [
  { id: 'heltec-tracker-v2', label: 'Heltec Tracker V2', repeaterObserverEnv: 'heltec_tracker_v2_repeater_observer_mqtt', roomServerEnv: 'heltec_tracker_v2_room_server_observer_mqtt' },
  { id: 'heltec-v2', label: 'Heltec V2', repeaterObserverEnv: 'Heltec_v2_repeater_observer_mqtt', roomServerEnv: 'Heltec_v2_room_server_observer_mqtt' },
  { id: 'heltec-v3', label: 'Heltec V3', repeaterObserverEnv: 'Heltec_v3_repeater_observer_mqtt', roomServerEnv: 'Heltec_v3_room_server_observer_mqtt' },
  { id: 'heltec-v4', label: 'Heltec V4', repeaterObserverEnv: 'heltec_v4_repeater_observer_mqtt', roomServerEnv: 'heltec_v4_room_server_observer_mqtt' },
  { id: 'heltec-v4-expansion-kit', label: 'Heltec V4 Expansion Kit', repeaterObserverEnv: 'heltec_v4_expansionkit_repeater_observer_mqtt', roomServerEnv: 'heltec_v4_expansionkit_room_server_observer_mqtt' },
  { id: 'heltec-wireless-paper', label: 'Heltec Wireless Paper', repeaterObserverEnv: 'Heltec_Wireless_Paper_repeater_observer_mqtt', roomServerEnv: 'Heltec_Wireless_Paper_room_server_observer_mqtt' },
  { id: 'heltec-wireless-tracker', label: 'Heltec Wireless Tracker', repeaterObserverEnv: 'Heltec_Wireless_Tracker_repeater_observer_mqtt', roomServerEnv: 'Heltec_Wireless_Tracker_room_server_observer_mqtt' },
  { id: 'heltec-wsl3', label: 'Heltec WSL3', repeaterObserverEnv: 'Heltec_WSL3_repeater_observer_mqtt' },
  { id: 'lilygo-t3s3-sx1262', label: 'LilyGO T3S3 SX1262', repeaterObserverEnv: 'LilyGo_T3S3_sx1262_repeater_observer_mqtt', roomServerEnv: 'LilyGo_T3S3_sx1262_room_server_observer_mqtt' },
  { id: 'lilygo-tdeck', label: 'LilyGO T-Deck', repeaterObserverEnv: 'LilyGo_TDeck_repeater_observer_mqtt' },
  { id: 'lilygo-tlora-c6', label: 'LilyGO T-LoRa C6', repeaterObserverEnv: 'LilyGo_Tlora_C6_repeater_observer_mqtt', roomServerEnv: 'LilyGo_Tlora_C6_room_server_observer_mqtt' },
  { id: 'm5stack-unit-c6l', label: 'M5Stack Unit C6L', repeaterObserverEnv: 'M5Stack_Unit_C6L_repeater_observer_mqtt', roomServerEnv: 'M5Stack_Unit_C6L_room_server_observer_mqtt' },
  { id: 'meshadventurer-sx1262', label: 'Meshadventurer SX1262', repeaterObserverEnv: 'Meshadventurer_sx1262_repeater_observer_mqtt', roomServerEnv: 'Meshadventurer_sx1262_room_server_observer_mqtt' },
  { id: 'rak-3112', label: 'RAK3112', repeaterObserverEnv: 'RAK_3112_repeater_observer_mqtt', roomServerEnv: 'RAK_3112_room_server_observer_mqtt' },
  { id: 'station-g2', label: 'Station G2', repeaterObserverEnv: 'Station_G2_repeater_observer_mqtt', roomServerEnv: 'Station_G2_room_server_observer_mqtt' },
  { id: 't-beam-s3-supreme-sx1262', label: 'T-Beam S3 Supreme SX1262', repeaterObserverEnv: 'T_Beam_S3_Supreme_SX1262_repeater_observer_mqtt', roomServerEnv: 'T_Beam_S3_Supreme_SX1262_room_server_observer_mqtt' },
  { id: 'tbeam-sx1262', label: 'T-Beam SX1262', repeaterObserverEnv: 'Tbeam_SX1262_repeater_observer_mqtt', roomServerEnv: 'Tbeam_SX1262_room_server_observer_mqtt' },
  { id: 'tbeam-sx1276', label: 'T-Beam SX1276', repeaterObserverEnv: 'Tbeam_SX1276_repeater_observer_mqtt', roomServerEnv: 'Tbeam_SX1276_room_server_observer_mqtt' },
  { id: 'xiao-s3-wio', label: 'Xiao S3 WIO', repeaterObserverEnv: 'Xiao_S3_WIO_repeater_observer_mqtt', roomServerEnv: 'Xiao_S3_WIO_room_server_observer_mqtt' },
  { id: 'xiao-c6', label: 'Xiao C6', repeaterObserverEnv: 'Xiao_C6_repeater_observer_mqtt' },
]

const FIRMWARE_VARIANTS: FirmwareVariant[] = [
  { id: 'repeater-mqtt', label: 'Repeater / Observer + MQTT', releasePrefix: 'repeater-mqtt', envKey: 'repeaterObserverEnv' },
  { id: 'roomserver-mqtt', label: 'Room Server + MQTT', releasePrefix: 'room-server-mqtt', envKey: 'roomServerEnv' },
]

function releaseSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function getFirmwareRelease(device: FirmwareDevice, variant: FirmwareVariant) {
  if (!variant.releasePrefix || !variant.envKey) return null
  const env = device[variant.envKey]
  if (!env) return null
  const tag = `latest-${releaseSlug(`${variant.releasePrefix}-${env}`)}`
  const releaseUrl = `${FIRMWARE_REPO}/releases/tag/${tag}`
  return {
    env,
    releaseUrl,
    binUrl: `${FIRMWARE_REPO}/releases/download/${tag}/${env}.bin`,
    mergedBinUrl: `${FIRMWARE_REPO}/releases/download/${tag}/${env}.merged.bin`,
  }
}

const copy = {
  nl: {
    title: 'Firmware',
    subtitle: 'Kies een apparaat en download direct een succesvolle DutchMeshCore MQTT release-build.',
    picker: 'Firmware kiezen',
    pickerSub: 'Deze lijst toont alleen combinaties die nu als succesvolle release-build beschikbaar zijn; flash daarna via de MeshCore webflasher.',
    device: 'Apparaat',
    variant: 'Variant',
    selected: 'Geselecteerd',
    releases: 'Release',
    allReleases: 'Alle releases',
    downloadBin: 'Download .bin',
    downloadMerged: 'Download merged .bin',
    flash: 'Open flasher',
    note: 'Deze knoppen gebruiken de stabiele per-device releases uit de firmware-repo. Ze wijzen altijd naar de nieuwste gepubliceerde build voor deze combinatie.',
    unavailable: 'Voor deze apparaat/variant-combinatie is nog geen directe release-build gekoppeld. Gebruik de releases-pagina of kies een andere variant.',
    downloadTitle: 'Directe release-links',
    stepRelease: 'Kies apparaat en variant.',
    stepBuild: 'Gebruik de normale .bin voor upgrades waarbij instellingen behouden blijven, zoals pubkey en configuratie. Gebruik merged .bin alleen voor een helemaal schone ESP32-flash of een nieuw/leeg apparaat.',
    stepExtract: 'Open flasher.meshcore.io en selecteer het gedownloade bestand.',
    stepFlash: 'Bij twijfel: open de release-pagina en controleer de assets voor je apparaat.',
    env: 'Build environment',
    footer: 'Community tools voor MeshCore NL - 2026',
  },
  en: {
    title: 'Firmware',
    subtitle: 'Choose a device and directly download a successful DutchMeshCore MQTT release build.',
    picker: 'Choose firmware',
    pickerSub: 'This list only shows combinations currently available as successful release builds; then flash with the MeshCore web flasher.',
    device: 'Device',
    variant: 'Variant',
    selected: 'Selected',
    releases: 'Release',
    allReleases: 'All releases',
    downloadBin: 'Download .bin',
    downloadMerged: 'Download merged .bin',
    flash: 'Open flasher',
    note: 'These buttons use the stable per-device releases from the firmware repo. They always point at the latest published build for this combination.',
    unavailable: 'No direct release build is mapped for this device/variant combination yet. Use the releases page or choose another variant.',
    downloadTitle: 'Direct release links',
    stepRelease: 'Choose your device and variant.',
    stepBuild: 'Use the normal .bin for upgrades that keep settings such as pubkey and configuration. Use merged .bin only for a fully clean ESP32 flash or a new/empty device.',
    stepExtract: 'Open flasher.meshcore.io and select the downloaded file.',
    stepFlash: 'When unsure: open the release page and verify the assets for your device.',
    env: 'Build environment',
    footer: 'Community tools for MeshCore NL - 2026',
  },
}

export default function FirmwarePage() {
  const { lang } = useLang()
  const c = copy[lang]
  const [firmwareDevice, setFirmwareDevice] = useState(FIRMWARE_DEVICES[0].id)
  const [firmwareVariant, setFirmwareVariant] = useState(FIRMWARE_VARIANTS[0].id)
  const selectedVariant = useMemo(
    () => FIRMWARE_VARIANTS.find(variant => variant.id === firmwareVariant) ?? FIRMWARE_VARIANTS[0],
    [firmwareVariant],
  )
  const availableDevices = useMemo(
    () => selectedVariant.envKey
      ? FIRMWARE_DEVICES.filter(device => Boolean(device[selectedVariant.envKey as keyof FirmwareDevice]))
      : FIRMWARE_DEVICES,
    [selectedVariant],
  )
  const selectedDevice = useMemo(
    () => availableDevices.find(device => device.id === firmwareDevice) ?? availableDevices[0] ?? FIRMWARE_DEVICES[0],
    [availableDevices, firmwareDevice],
  )
  const firmwareRelease = useMemo(
    () => getFirmwareRelease(selectedDevice, selectedVariant),
    [selectedDevice, selectedVariant],
  )

  useEffect(() => {
    if (!availableDevices.some(device => device.id === firmwareDevice) && availableDevices[0]) {
      setFirmwareDevice(availableDevices[0].id)
    }
  }, [availableDevices, firmwareDevice])

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

        <section className="firmware-panel">
          <div className="firmware-panel-head">
            <div>
              <h2>{c.picker}</h2>
              <p>{c.pickerSub}</p>
            </div>
            <span className="tool-badge">GitHub Releases</span>
          </div>

          <div className="firmware-form">
            <label>
              <span>{c.device}</span>
              <select value={firmwareDevice} onChange={event => setFirmwareDevice(event.target.value)}>
                {availableDevices.map(device => (
                  <option key={device.id} value={device.id}>{device.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>{c.variant}</span>
              <select value={firmwareVariant} onChange={event => setFirmwareVariant(event.target.value)}>
                {FIRMWARE_VARIANTS.map(variant => (
                  <option key={variant.id} value={variant.id}>{variant.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="firmware-result">
            <div>
              <span>{c.selected}</span>
              <strong>{selectedDevice.label} - {selectedVariant.label}</strong>
              <p>{firmwareRelease ? c.note : c.unavailable}</p>
            </div>
            <div className="firmware-actions">
              {firmwareRelease && (
                <>
                  <a className="btn btn-accent" href={firmwareRelease.binUrl}>{c.downloadBin}</a>
                  <a className="btn" href={firmwareRelease.mergedBinUrl}>{c.downloadMerged}</a>
                  <a className="btn" href={firmwareRelease.releaseUrl} target="_blank" rel="noopener noreferrer">{c.releases}</a>
                </>
              )}
              <a className="btn" href={`${FIRMWARE_REPO}/releases`} target="_blank" rel="noopener noreferrer">{c.allReleases}</a>
              <a className="btn" href="https://flasher.meshcore.io" target="_blank" rel="noopener noreferrer">{c.flash}</a>
            </div>
          </div>

          <div className="firmware-download">
            <h3>{c.downloadTitle}</h3>
            <ol>
              <li>{c.stepRelease}</li>
              <li>{c.stepBuild}</li>
              <li>{c.stepExtract}</li>
              <li>{c.stepFlash}</li>
            </ol>
            {firmwareRelease && (
              <p>
                {c.env}:{' '}
                <code>{firmwareRelease.env}</code>
              </p>
            )}
          </div>
        </section>

        <footer className="site-footer">
          <a href="https://github.com/Dutch-MeshCore" target="_blank" rel="noopener noreferrer">Dutch-MeshCore</a>
          {' '}— {c.footer}
        </footer>
      </main>
    </>
  )
}
