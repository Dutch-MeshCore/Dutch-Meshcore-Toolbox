// USB Setup for a v1.18 companion on its plain-text serial console: the official
// firmware in CLI Rescue mode (long-press within 8 s of boot), or meshcomod, which
// answers plain-text commands on ESP32 USB at any time. The companion CLI
// (examples/companion_radio/MyMesh.cpp handleCommand) is a subset of the server CLI:
// the radio settings, board commands, name, PIN, timezone and WiFi.

import type { DeviceVars } from '../../types'
import type { ReplyStyle } from './serialReply'

/**
 * The USB Setup variables a companion can answer. Settings a build lacks (meshcomod
 * has no cad, int.thresh, agc.reset.interval, txdelay or direct.txdelay) answer
 * "Error: unsupported" and are skipped like on any other firmware.
 */
export const COMPANION_VARS: readonly (keyof DeviceVars)[] = [
  'name', 'radio', 'tx', 'af', 'rxdelay', 'txdelay', 'direct.txdelay',
  'int.thresh', 'agc.reset.interval', 'multi.acks', 'path.hash.mode', 'cad', 'radio.rxgain',
]

/** The server CLI marks replies with `  -> `; only the companion console answers without it. */
export function isCompanionConsole(style: ReplyStyle | null | undefined): boolean {
  return style === 'plain'
}
