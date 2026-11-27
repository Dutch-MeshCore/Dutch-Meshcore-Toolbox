import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DeviceList from '../components/flasher/DeviceList'
import { FIRMWARE_HELP, FIRMWARE_HELP_IDS } from '../components/flasher/firmwareHelpContent'
import type { FlasherDevice } from '../types'
import { LangProvider } from '../hooks/useLang'
import dmc from '../../public/dmc-firmware.json'
import community from '../../public/community-firmware.json'

const LANGS = ['nl', 'en', 'de'] as const

describe('firmware help content', () => {
  it('covers every maker group published in the firmware lists', () => {
    const makers = [...Object.keys(dmc.maker), ...Object.keys(community.maker)]
    for (const m of makers) expect(FIRMWARE_HELP_IDS, `${m} has no help`).toContain(m)
  })

  it('has a title, intro and what/who fields in every language', () => {
    for (const id of FIRMWARE_HELP_IDS) {
      for (const lang of LANGS) {
        const c = FIRMWARE_HELP[id][lang]
        expect(c.title.trim(), `${id}/${lang}`).not.toBe('')
        expect(c.intro.trim(), `${id}/${lang}`).not.toBe('')
        expect(c.fields.length, `${id}/${lang}`).toBeGreaterThanOrEqual(2)
        for (const f of c.fields) expect(f.body.trim(), `${id}/${lang}/${f.label}`).not.toBe('')
      }
    }
  })

  it('contains no em-dash (U+2014)', () => {
    expect(JSON.stringify(FIRMWARE_HELP).includes(String.fromCharCode(0x2014))).toBe(false)
  })
})

describe('firmware help button in the Flasher', () => {
  const devices: FlasherDevice[] = [
    { maker: 'dutchmeshcore_packetlog', class: 'community', name: 'Heltec V3', type: 'esp32', firmware: [] },
    { maker: 'unknown_maker', class: 'community', name: 'RAK 4631', type: 'nrf52', firmware: [] },
  ]
  const makerNames = {
    dutchmeshcore_packetlog: { name: 'DutchMeshCore-PacketLog-Firmware' },
    unknown_maker: { name: 'Some Other Firmware' },
  }

  function renderList() {
    return render(
      <LangProvider>
        <DeviceList devices={devices} makerNames={makerNames} onSelect={() => {}} />
      </LangProvider>,
    )
  }

  it('shows a ? only for groups that have help text', () => {
    renderList()
    expect(screen.getAllByRole('button', { name: /PacketLog/ }).some(b => b.textContent === '?')).toBe(true)
    expect(screen.queryByRole('button', { name: /Some Other Firmware/ })?.textContent).not.toBe('?')
  })

  it('opens the dialog without expanding the group, and closes it again', () => {
    renderList()
    const help = screen.getAllByRole('button', { name: /PacketLog/ }).find(b => b.textContent === '?')!
    fireEvent.click(help)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/RX\/TX/)
    expect(screen.queryByText('Heltec V3')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Close'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Heltec V3')).not.toBeInTheDocument()
  })

  it('opens from the keyboard and closes on Escape', () => {
    renderList()
    const help = screen.getAllByRole('button', { name: /PacketLog/ }).find(b => b.textContent === '?')!
    fireEvent.keyDown(help, { key: 'Enter' })
    // Press Escape inside the dialog (where focus is), so it has to bubble out.
    fireEvent.keyDown(screen.getByLabelText('Close'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('PanelHelp still uses the shared dialog', () => {
  it('opens and closes the panel help', async () => {
    const { default: PanelHelp } = await import('../components/config/PanelHelp')
    render(<LangProvider><PanelHelp id="location" /></LangProvider>)
    fireEvent.click(screen.getByText('?'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
