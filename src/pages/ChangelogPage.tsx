import { useState, type ReactNode } from 'react'
import Navbar from '../components/layout/Navbar'
import { useLang } from '../hooks/useLang'

// Firmware docs live in the MeshCore repo. This points at the published observer
// branch; update the ref here if/when dmc-observer-dev-1-17 is renamed.
const FW_REPO = 'https://github.com/Dutch-MeshCore/MeshCore'
const FW_REF = 'dmc-observer-dev-1-17'
const DOCS = {
  brokerFilter: `${FW_REPO}/blob/${FW_REF}/docs/mqtt_broker_filter_reference.md`,
  neighbours: `${FW_REPO}/blob/${FW_REF}/docs/neighbour_discovery_reference.md`,
  packetFilter: `${FW_REPO}/blob/${FW_REF}/docs/packet_filter_reference.md`,
  cli: `${FW_REPO}/blob/${FW_REF}/docs/cli_commands.md`,
  mqttImpl: `${FW_REPO}/blob/${FW_REF}/MQTT_IMPLEMENTATION.md`,
  branch: `${FW_REPO}/tree/${FW_REF}`,
}

function Doc({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
}

interface Entry {
  version: string
  date: string
  title?: string
  items: ReactNode[]
}

const FIRMWARE: Entry[] = [
  {
    version: 'v1.17.0',
    date: '2026-08-12',
    title: 'MQTT Observer',
    items: [
      <>Rebuilt cleanly on upstream MeshCore <strong>v1.17.0</strong> as a merge of the observer firmware and the DutchMeshCore fork (branding, boards, CI). <Doc href={DOCS.branch}>Branch: dmc-observer-dev-1-17</Doc>.</>,
      <>MQTT observer bridge: up to 6 broker slots, 35 built-in broker presets, and status / packets / raw / TX / RX publishing. <Doc href={DOCS.mqttImpl}>MQTT implementation guide</Doc>.</>,
      <><strong>Per-broker packet filter</strong> — a per-slot allowlist of MeshCore payload types (<code>set mqttN.filter all|none|list</code>), so each broker can receive a different packet mix. <Doc href={DOCS.brokerFilter}>Per-broker filter reference</Doc>.</>,
      <><strong>Neighbour discovery</strong> — publish the zero-hop neighbour table (SNR, last-heard age, region scopes) to the <code>neighbors</code> topic, one-shot (<code>discover.scopes</code>) or periodically (<code>mqtt.neighbors</code>). <Doc href={DOCS.neighbours}>Neighbour discovery reference</Doc>.</>,
      <><strong>Repeater packet filter</strong> (RF) — drop flooded packets by hop count, per-type rate, channel, path-hash size, and malformed group messages. <Doc href={DOCS.packetFilter}>Packet filter reference</Doc>.</>,
      <>On-device <strong>WebConfig</strong> captive-portal, radio watchdog, SNMP agent, and fault alerts.</>,
      <>Pull-based <strong>OTA</strong> pointed at DutchMeshCore releases (<code>ota.dutchmeshcore.nl</code>); default broker slots <code>dutchmeshcore-1</code> / <code>dutchmeshcore-2</code> / <code>meshcore-analyzer-eu</code>, timezone Europe/Amsterdam.</>,
      <>Heltec Wireless Tracker v1.1 fixes (ST7735 HSPI guard, PA-power guard, active-high VEXT) and non-PSRAM board support (3 MQTT slots, tight-heap tuning).</>,
      <>Merged the latest upstream board &amp; radio fixes: Heltec T096 pins, T-Echo Card TCXO, ProMicro pinmap, T-Beam Supreme S3 display recovery, Station G3 external FEM prefs, LR2021 preamble / IRQ-timeout.</>,
      <>Full CLI reference for every command. <Doc href={DOCS.cli}>CLI commands</Doc>.</>,
    ],
  },
]

const TOOLBOX: Entry[] = [
  {
    version: 'USB Setup — full firmware parity',
    date: '2026-08-12',
    items: [
      <>Added the <strong>per-broker packet filter</strong> per slot (All / None + a checkbox per packet type), mirroring the firmware. <Doc href={DOCS.brokerFilter}>Filter reference</Doc>.</>,
      <>Refreshed the broker-preset dropdown to all <strong>35</strong> presets (adds <code>meshcore-analyzer-eu</code> and others).</>,
      <><strong>Neighbour publishing</strong> controls (enable + interval) and the <strong>radio watchdog</strong> setting, shown only on firmware that supports them. <Doc href={DOCS.neighbours}>Neighbour discovery reference</Doc>.</>,
      <>Serial <strong>bridge</strong> (RS232 / ESP-NOW), external <strong>FEM gain</strong> (RX/TX), and LR2021 side-detector SFs — capability-gated to what the connected device reports.</>,
      <><strong>Import / Export</strong> now round-trips all of the above, so a backup restores the complete observer configuration.</>,
    ],
  },
  {
    version: 'Flasher — safer flashing',
    date: '2026-08-12',
    items: [
      <>A pre-flash <strong>backup reminder</strong> that urges exporting the device config first (with a shortcut to USB Setup), because flashing can wipe MQTT / observer settings, per-slot filters, WiFi and alerts.</>,
      <>A <strong>first-time-observer warning</strong>: installing observer firmware as an app-only image is flagged, steering to the merged "Full flash" image so the partition table is written. Works for uploaded observer <code>.bin</code> files too.</>,
      <>Wording is firmware-neutral, so agessaman observer-firmware users are covered as well.</>,
    ],
  },
]

function ChangeList({ entries }: { entries: Entry[] }) {
  return (
    <>
      {entries.map(e => (
        <div className="panel" key={e.version}>
          <div className="panel-legend">
            {e.version}
            {e.title ? ` · ${e.title}` : ''}
            <span className="changelog-date"> — {e.date}</span>
          </div>
          <ul className="changelog-list">
            {e.items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </div>
      ))}
    </>
  )
}

export default function ChangelogPage() {
  const { t } = useLang()
  const [tab, setTab] = useState<'firmware' | 'toolbox'>('firmware')

  return (
    <>
      <Navbar />
      <main className="page changelog-page">
        <div className="device-page-header">
          <h1>📜 {t('changelog_title')}</h1>
        </div>

        <div className="changelog-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'firmware'}
            className={`btn${tab === 'firmware' ? ' btn-accent' : ''}`}
            onClick={() => setTab('firmware')}
          >
            {t('changelog_tab_firmware')}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'toolbox'}
            className={`btn${tab === 'toolbox' ? ' btn-accent' : ''}`}
            onClick={() => setTab('toolbox')}
          >
            {t('changelog_tab_toolbox')}
          </button>
        </div>

        {tab === 'firmware' ? <ChangeList entries={FIRMWARE} /> : <ChangeList entries={TOOLBOX} />}
      </main>
    </>
  )
}
