// Maps a flasher device to its board preview image (shown on hover in the device list).
//
// Our device data is auto-generated from firmware filenames and only carries the chip
// `type` (esp32/nrf52), never the board. The board SVGs in public/img/ can't be matched
// to devices automatically (name/slug conventions diverge too much), so the pairing is
// maintained here by hand. Unmapped devices intentionally resolve to `null` — no preview.

// Raw device name (as it appears in the firmware JSON) → SVG basename in public/img/.
// Multiple names may share one image (device families / display-vs-no-display variants).
const DEVICE_IMAGE: Record<string, string> = {
  // GAT562 family
  'GAT562 30S Mesh Kit': 'gatiot_gat562_30s',
  'GAT562 Mesh EVB Pro': 'gatiot_gat562',
  'GAT562 Mesh Tracker Pro': 'gatiot_gat562',
  'GAT562 Mesh Watch 13': 'gatiot_gat562',

  // Heltec
  'Heltec E213': 'heltec_e213',
  'Heltec E290': 'heltec_e290',
  'Heltec Mesh Solar': 'heltec_mesh_solar',
  'Heltec T114': 'heltec_t114',
  'Heltec T114 (No Display)': 'heltec_t114',
  'Heltec Tracker V2': 'heltec_wt2',
  'Heltec V2': 'heltec_v2',
  'Heltec V3': 'heltec_v3',
  'Heltec V4': 'heltec_v4',
  'Heltec V4 Expansion Kit': 'heltec_v4_exp',
  'Heltec V4 TFT': 'heltec_v4',
  'Heltec Wireless Paper': 'heltec_wp',
  'Heltec Wireless Tracker': 'heltec_wt3',
  'Heltec WSL3': 'heltec_wsl3',
  'Mesh pocket': 'heltec_meshpocket',

  // iKoka
  'iKoka Nano NRF 22dBm': 'ikoka_nano',
  'iKoka Nano NRF 30dBm': 'ikoka_nano',
  'iKoka Nano NRF 33dBm': 'ikoka_nano',
  'iKoka Stick NRF 22dBm': 'ikoka_stick',
  'iKoka Stick NRF 30dBm': 'ikoka_stick',
  'iKoka Stick NRF 33dBm': 'ikoka_stick',

  // Keepteen
  'Keepteen LT1': 'keepteen_lt1',

  // LilyGo
  'LilyGo T-Beam 1W': 'lilygo_tbeam',
  'LilyGo T-Deck': 'lilygo_tdeck',
  'LilyGo T-Echo': 'lilygo_techo',
  'LilyGo T-Echo Card': 'lilygo_techo',
  'LilyGo T-Echo Lite': 'lilygo_techo_lite',
  'LilyGo T-Echo-Lite non shell': 'lilygo_techo_lite',
  'LilyGo T-LoRa V2.1.1.6': 'lilygo_tlora_1.6',
  'LilyGo T3S3 SX1262': 'lilygo_t3s3',
  'LilyGo T3S3 sx1276': 'lilygo_t3s3',
  'T-Beam S3 Supreme SX1262': 'lilygo_tbeam_supreme',
  'T-Beam SX1262': 'lilygo_tbeam',
  'T-Beam SX1276': 'lilygo_tbeam',

  // Nano / SenseCAP
  'Nano G2 Ultra': 'nano_g2',
  'SenseCAP Solar': 'sensecap_solar',
  't1000e': 'sensecap_t1000e',

  // Raspberry Pi
  PicoW: 'rpi_picow',

  // RAK
  'RAK 11310': 'rak_11300',
  rak11310: 'rak_11300',
  RAK3112: 'rak_3112',
  RAK4631: 'rak_4631',
  'RAK WisMesh Tag': 'rak_wismesh_tag',

  // Station
  'Station G2': 'station_g2',
  'Station G2 logging': 'station_g2',

  // ThinkNode
  'ThinkNode M1': 'thinknode_m1',
  'ThinkNode M2': 'thinknode_m2',
  'ThinkNode M3': 'thinknode_m3',
  'ThinkNode M5': 'thinknode_m5',
  'ThinkNode M6': 'thinknode_m6',

  // Wio
  WioTrackerL1: 'wio_tracker_l1',
  WioTrackerL1Eink: 'wio_tracker_l1_eink',

  // Xiao
  'Xiao C3': 'xiao_esp32c3',
  'Xiao nrf52': 'xiao_nrf52',
  'Xiao S3': 'xiao_esp32s3',
  'Xiao S3 WIO': 'xiao_esp32s3',
}

// Lowercase and drop every non-alphanumeric character, so spacing/punctuation/case
// differences ("RAK4631" vs "RAK 4631") collapse to the same lookup key.
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const IMAGE_BY_KEY = new Map(
  Object.entries(DEVICE_IMAGE).map(([name, slug]) => [normalize(name), slug]),
)

/** Board preview image URL for a device, or `null` when none is mapped. */
export function deviceImageSrc(device: { name: string }): string | null {
  const slug = IMAGE_BY_KEY.get(normalize(device.name))
  return slug ? `/img/${slug}.svg` : null
}
