import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FlashOptions from '../components/flasher/FlashOptions'
import type { FlasherDevice, DeviceFirmware, FlasherConfig } from '../types'
import { LangProvider } from '../hooks/useLang'

const config: Pick<FlasherConfig, 'role' | 'notice' | 'staticPath'> = {
  role: { repeater: { icon: 'cell_tower', title: 'Repeater' } },
  notice: {},
  staticPath: '/firmware',
}

const device: FlasherDevice = {
  maker: 'heltec', class: 'ripple', name: 'Heltec V3', type: 'esp32', firmware: [],
}

const firmware: DeviceFirmware = {
  role: 'repeater',
  version: {
    'v1.2': { files: [{ type: 'flash-wipe', name: 'a.bin', title: 'Combined bin' }] },
    'v1.1': { files: [{ type: 'flash-update', name: 'b.bin', title: 'App bin' }] },
  },
}

describe('FlashOptions', () => {
  it('renders version selector with all versions', () => {
    render(
      <LangProvider>
        <FlashOptions
          device={device} firmware={firmware} config={config as FlasherConfig}
          supported={false} onFlash={vi.fn()} onBack={vi.fn()}
        />
      </LangProvider>
    )
    expect(screen.getByText('v1.2')).toBeInTheDocument()
    expect(screen.getByText('v1.1')).toBeInTheDocument()
  })

  it('shows erase checkbox for esp32', () => {
    render(
      <LangProvider>
        <FlashOptions
          device={device} firmware={firmware} config={config as FlasherConfig}
          supported={false} onFlash={vi.fn()} onBack={vi.fn()}
        />
      </LangProvider>
    )
    expect(screen.getByText(/erase device/i)).toBeInTheDocument()
  })

  it('calls onFlash when Flash button clicked', () => {
    const onFlash = vi.fn()
    render(
      <LangProvider>
        <FlashOptions
          device={device} firmware={firmware} config={config as FlasherConfig}
          supported={true} onFlash={onFlash} onBack={vi.fn()}
        />
      </LangProvider>
    )
    fireEvent.click(screen.getByText(/flash!/i))
    expect(onFlash).toHaveBeenCalled()
  })
})
