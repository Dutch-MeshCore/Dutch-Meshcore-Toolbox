import { describe, it, expect } from 'vitest'
import { extractReply } from '../lib/config/serialReply'
import { COMPANION_VARS, isCompanionConsole } from '../lib/config/companionConfig'
// @ts-ignore – plain JS module without type declarations
import { SerialCLI } from '../lib/config/serial-cli.js'

// Transcripts as the firmware writes them. Servers (CommonCLI) echo `cmd\r\n` and
// answer `  -> reply\r\n`. The v1.18 companion console (official CLI Rescue and
// meshcomod, examples/companion_radio/MyMesh.cpp checkCLIRescueCmd) echoes `cmd\r`
// and answers `  reply` with println (`\r\n`) or a printf ending in a bare `\n`.

describe('extractReply – server CLI (arrow)', () => {
  it('reads a repeater reply', () => {
    const buf = 'ver\r\n  -> v1.17.1.01-dutchmeshcore.nl-abc (Build: 11-Sep-2026)\r\n'
    expect(extractReply(buf, 'ver')).toEqual({
      reply: 'v1.17.1.01-dutchmeshcore.nl-abc (Build: 11-Sep-2026)', consumed: buf.length, style: 'arrow',
    })
  })

  it('keeps the inner lines of a multi-line repeater reply', () => {
    const buf = 'filter hops\r\n  -> [TYPE: HOPS]\n00: 8\n05: 32\r\n'
    expect(extractReply(buf, 'filter hops')!.reply).toBe('[TYPE: HOPS]\n00: 8\n05: 32')
  })

  it('waits for a partial arrow reply instead of reading it as a plain one', () => {
    expect(extractReply('get name\r\n  -', 'get name')).toBeNull()
    expect(extractReply('get name\r\n  -> Rep', 'get name')).toBeNull()
    expect(extractReply('get name\r\n  -> > Rep 1\r\n', 'get name')!.style).toBe('arrow')
  })

  it('never reads server log output as a companion reply', () => {
    // A server echoes `cmd\r\n`, so an indented line before the arrow is not a reply.
    expect(extractReply('get name\r\n  [MQTT] connected\r\n', 'get name')).toBeNull()
    expect(extractReply('get name\r\n  [MQTT] connected\r\n  -> > Rep\r\n', 'get name')).toMatchObject({ reply: '> Rep', style: 'arrow' })
    // The `\n` of a server echo can arrive after the `\r`.
    expect(extractReply('get name\r', 'get name')).toBeNull()
  })

  it('leaves later output in the buffer', () => {
    const buf = 'get tx\r\n  -> > 22\r\nnoise'
    const r = extractReply(buf, 'get tx')!
    expect(buf.substring(r.consumed)).toBe('noise')
  })
})

describe('extractReply – companion console (plain)', () => {
  it('reads meshcomod ver, get and error replies', () => {
    expect(extractReply('ver\r  v1.18.0.1-deb2fba8-dmc-filter (Build: 16-Oct-2026)\r\n', 'ver')).toEqual({
      reply: 'v1.18.0.1-deb2fba8-dmc-filter (Build: 16-Oct-2026)',
      consumed: 'ver\r  v1.18.0.1-deb2fba8-dmc-filter (Build: 16-Oct-2026)\r\n'.length,
      style: 'plain',
    })
    expect(extractReply('get name\r  > Pocket\r\n', 'get name')!.reply).toBe('> Pocket')
    expect(extractReply('get role\r  Error: unknown command\r\n', 'get role')!.reply).toBe('Error: unknown command')
    expect(extractReply('get cad\r  Error: unsupported\r\n', 'get cad')!.reply).toBe('Error: unsupported')
  })

  it('accepts a reply ending in a bare newline (printf)', () => {
    expect(extractReply('set pin 123456\r  > pin is now 123456\n', 'set pin 123456')!.reply).toBe('> pin is now 123456')
  })

  it('reads the companion filter status line', () => {
    const buf = 'filter\r  > Filter on: Hidden [ Malformed: 3 | Age: 0 | Path: 12 | Sender: 41 | Text: 7 ]\r\n'
    expect(extractReply(buf, 'filter')!.reply).toBe('> Filter on: Hidden [ Malformed: 3 | Age: 0 | Path: 12 | Sender: 41 | Text: 7 ]')
  })

  it('reads the official firmware in CLI Rescue the same way', () => {
    expect(extractReply('get radio\r  > 869.618,62.5,8,8\r\n', 'get radio')).toMatchObject({ reply: '> 869.618,62.5,8,8', style: 'plain' })
  })

  it('waits until the line is complete', () => {
    expect(extractReply('ver\r  v1.18', 'ver')).toBeNull()
  })

  it('needs the echo, so stray output is never taken for a reply', () => {
    expect(extractReply('  > something\r\n', 'get name')).toBeNull()
    expect(extractReply('get name\rListing files in /\n', 'get name')).toBeNull()
  })
})

describe('companion detection', () => {
  it('treats only a plain reply as a companion console', () => {
    expect(isCompanionConsole('plain')).toBe(true)
    expect(isCompanionConsole('arrow')).toBe(false)
    expect(isCompanionConsole(null)).toBe(false)
  })

  it('reads only settings the companion CLI has', () => {
    expect(COMPANION_VARS).toContain('radio')
    expect(COMPANION_VARS).not.toContain('guest.password')
    expect(COMPANION_VARS).not.toContain('advert.interval')
  })
})

describe('SerialCLI round trip', () => {
  function connected() {
    const cli = new SerialCLI(false)
    const sent: string[] = []
    cli.port = {}
    cli.writer = { write: async (b: Uint8Array) => { sent.push(new TextDecoder().decode(b)) } }
    return { cli, sent }
  }

  it('resolves a repeater reply and records the arrow style', async () => {
    const { cli, sent } = connected()
    const p = cli.sendCommand('get name')
    await Promise.resolve()
    expect(sent).toEqual(['get name\r'])
    cli.processIncomingData('get name\r\n  -> > Repeater 1\r\n')
    expect(await p).toBe('> Repeater 1')
    expect(cli.lastReplyStyle).toBe('arrow')
  })

  it('resolves a companion reply split over chunks and records the plain style', async () => {
    const { cli } = connected()
    const p = cli.sendCommand('ver')
    await Promise.resolve()
    cli.processIncomingData('ve')
    cli.processIncomingData('r\r  v1.18.0 (Build: 15-Oct-2026)')
    cli.processIncomingData('\r\n')
    expect(await p).toBe('v1.18.0 (Build: 15-Oct-2026)')
    expect(cli.lastReplyStyle).toBe('plain')
  })
})
