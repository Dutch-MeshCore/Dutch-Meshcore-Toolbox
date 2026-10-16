// Reply framing on the plain-text serial console. Pure, so serial-cli.js and the
// tests share one parser.

/**
 * How the device marked its reply:
 * - `arrow`: repeaters, room servers and sensors (CommonCLI) print `  -> <reply>\r\n`.
 * - `plain`: the Meshcomod companion's console (examples/companion_radio/MyMesh.cpp,
 *   checkCLIRescueCmd) prints `  <reply>` ending in `\r\n` or a bare `\n`, with no arrow.
 */
export type ReplyStyle = 'arrow' | 'plain'

export interface ExtractedReply {
  reply: string
  /** Buffer index just past the reply line; everything before it is consumed. */
  consumed: number
  style: ReplyStyle
}

const ARROW = '  -> '

/**
 * Where the echoed command ends. Servers echo `cmd\r\n`; the companion console
 * echoes only the `\r` it was sent (`crlf` false), then prints its reply at once.
 */
function findEcho(buffer: string, command: string): { end: number; crlf: boolean } | null {
  const crlf = buffer.indexOf(command + '\r\n')
  if (crlf !== -1) return { end: crlf + command.length + 2, crlf: true }
  const cr = buffer.indexOf(command + '\r')
  if (cr !== -1) return { end: cr + command.length + 1, crlf: false }
  return null
}

/**
 * Find the single-line reply to `command` in the serial read buffer. Returns null
 * until a complete reply line has arrived. A plain reply only counts when it
 * directly follows a companion-style echo, so server log output is never taken
 * for one. Plain multi-line replies (e.g. `filter help`) come back as their first line.
 */
export function extractReply(buffer: string, command: string): ExtractedReply | null {
  const echo = findEcho(buffer, command)

  const arrow = buffer.indexOf(ARROW, echo?.end ?? 0)
  if (arrow !== -1) {
    const end = buffer.indexOf('\r\n', arrow + ARROW.length)
    if (end === -1) return null
    return { reply: buffer.substring(arrow + ARROW.length, end).trim(), consumed: end + 2, style: 'arrow' }
  }

  if (echo === null || echo.crlf) return null
  const start = echo.end
  if (!buffer.startsWith('  ', start)) return null
  const end = buffer.indexOf('\n', start)
  if (end === -1) return null
  // An arrow reply still arriving ("  -", "  ->") has no line end yet, so it never
  // gets here; once complete, the arrow branch above takes it.
  return { reply: buffer.substring(start + 2, end).trim(), consumed: end + 1, style: 'plain' }
}
