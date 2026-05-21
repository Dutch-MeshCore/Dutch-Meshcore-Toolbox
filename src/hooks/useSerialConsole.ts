import { useRef, useState } from 'react'

export function useSerialConsole() {
  const [open_, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const instanceRef = useRef<unknown>(null)
  const portRef = useRef<SerialPort | null>(null)

  async function open() {
    if (!('serial' in navigator)) return
    try {
      const port = await navigator.serial.requestPort()
      portRef.current = port
      // @ts-ignore
      const { SerialConsole } = await import('../lib/flasher/console.js')
      const con = new SerialConsole(port)
      instanceRef.current = con
      con.onOutput = (text: string) => setContent(c => c + text)
      setOpen(true)
      await con.connect() // runs until disconnect
    } catch {
      setOpen(false)
    }
  }

  async function close() {
    try {
      const con = instanceRef.current as { disconnect: () => Promise<void> } | null
      await con?.disconnect()
    } catch { /* ignore */ }
    setOpen(false)
    setContent('')
    portRef.current = null
    instanceRef.current = null
  }

  async function send(cmd: string) {
    const con = instanceRef.current as { sendCommand: (c: string) => Promise<void> } | null
    await con?.sendCommand(cmd)
  }

  return { open_, content, open, close, send }
}
