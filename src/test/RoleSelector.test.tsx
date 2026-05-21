import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RoleSelector from '../components/flasher/RoleSelector'
import type { FlasherDevice, FlasherConfig } from '../types'
import { LangProvider } from '../hooks/useLang'

const config: Pick<FlasherConfig, 'role' | 'notice'> = {
  role: {
    repeater:   { icon: 'cell_tower', title: 'Repeater', tooltip: 'Routes packets' },
    roomServer: { icon: 'forum',      title: 'Room Server' },
  },
  notice: {},
}

const device: FlasherDevice = {
  maker: 'heltec', class: 'ripple', name: 'Heltec V3', type: 'esp32',
  firmware: [
    { role: 'repeater',   version: { 'v1.0': { files: [{ type: 'flash-wipe', name: 'a.bin', title: 'A' }] } } },
    { role: 'roomServer', version: { 'v1.0': { files: [{ type: 'flash-wipe', name: 'b.bin', title: 'B' }] } } },
    { role: 'gui',        version: {} }, // no files — should be hidden
  ],
}

describe('RoleSelector', () => {
  it('renders available roles', () => {
    render(
      <LangProvider>
        <RoleSelector device={device} config={config as FlasherConfig} onSelect={vi.fn()} onBack={vi.fn()} />
      </LangProvider>
    )
    expect(screen.getByText('Repeater')).toBeInTheDocument()
    expect(screen.getByText('Room Server')).toBeInTheDocument()
  })

  it('hides roles with no files', () => {
    render(
      <LangProvider>
        <RoleSelector device={device} config={config as FlasherConfig} onSelect={vi.fn()} onBack={vi.fn()} />
      </LangProvider>
    )
    expect(screen.queryByText('gui')).not.toBeInTheDocument()
  })

  it('calls onSelect with the firmware when role is clicked', () => {
    const onSelect = vi.fn()
    render(
      <LangProvider>
        <RoleSelector device={device} config={config as FlasherConfig} onSelect={onSelect} onBack={vi.fn()} />
      </LangProvider>
    )
    fireEvent.click(screen.getByText('Repeater'))
    expect(onSelect).toHaveBeenCalledWith(device.firmware[0])
  })
})
