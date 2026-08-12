import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import FlashOptions from '../components/flasher/FlashOptions'
import type { FlasherDevice, DeviceFirmware, FlasherConfig } from '../types'
import { LangProvider } from '../hooks/useLang'

// FlashOptions' pre-flash modal uses useNavigate, so tests need a Router context.
const wrap = (ui: ReactNode) => <MemoryRouter><LangProvider>{ui}</LangProvider></MemoryRouter>

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
    render(wrap(
      <FlashOptions
        device={device} firmware={firmware} config={config as FlasherConfig}
        supported={false} onFlash={vi.fn()} onBack={vi.fn()}
      />
    ))
    expect(screen.getByText('v1.2')).toBeInTheDocument()
    expect(screen.getByText('v1.1')).toBeInTheDocument()
  })

  it('shows erase checkbox for esp32', () => {
    render(wrap(
      <FlashOptions
        device={device} firmware={firmware} config={config as FlasherConfig}
        supported={false} onFlash={vi.fn()} onBack={vi.fn()}
      />
    ))
    expect(screen.getByText(/erase device/i)).toBeInTheDocument()
  })

  it('opens the backup-reminder modal on Flash, then calls onFlash on confirm', () => {
    const onFlash = vi.fn()
    render(wrap(
      <FlashOptions
        device={device} firmware={firmware} config={config as FlasherConfig}
        supported={true} onFlash={onFlash} onBack={vi.fn()}
      />
    ))
    // Flash button now opens the confirm/backup modal instead of flashing directly.
    fireEvent.click(screen.getByText(/flash!/i))
    expect(onFlash).not.toHaveBeenCalled()
    expect(screen.getByText(/back up before you flash/i)).toBeInTheDocument()
    // Confirming proceeds to the actual flash.
    fireEvent.click(screen.getByText(/i.?ve backed up/i))
    expect(onFlash).toHaveBeenCalledWith({ version: 'v1.2', wipe: false })
  })

  it('warns about the merged image when flashing an observer App-update version', () => {
    const observerAppOnly: DeviceFirmware = {
      role: 'dutchmeshcore_mqtt',
      version: {
        'v1.17.0 — App update': { files: [{ type: 'flash-update', name: 'obs.bin', title: 'App update' }] },
      },
    }
    render(wrap(
      <FlashOptions
        device={device} firmware={observerAppOnly} config={config as FlasherConfig}
        supported={true} onFlash={vi.fn()} onBack={vi.fn()}
      />
    ))
    fireEvent.click(screen.getByText(/flash!/i))
    expect(screen.getByText(/first-time observer install/i)).toBeInTheDocument()
  })

  it('does NOT warn about merged when the observer version is a Full flash (merged)', () => {
    const observerMerged: DeviceFirmware = {
      role: 'dutchmeshcore_mqtt',
      version: {
        'v1.17.0 — Full flash': { files: [{ type: 'flash-wipe', name: 'obs-merged.bin', title: 'Full flash' }] },
      },
    }
    render(wrap(
      <FlashOptions
        device={device} firmware={observerMerged} config={config as FlasherConfig}
        supported={true} onFlash={vi.fn()} onBack={vi.fn()}
      />
    ))
    fireEvent.click(screen.getByText(/flash!/i))
    expect(screen.getByText(/back up before you flash/i)).toBeInTheDocument()
    expect(screen.queryByText(/first-time observer install/i)).not.toBeInTheDocument()
  })

  it('renders a real download link (not a dead button) pointing at the firmware file', () => {
    render(wrap(
      <FlashOptions
        device={device} firmware={firmware} config={config as FlasherConfig}
        supported={false} onFlash={vi.fn()} onBack={vi.fn()}
      />
    ))
    // Default version is the newest (v1.2 -> a.bin / "Combined bin").
    const link = screen.getByRole('link', { name: /download/i })
    expect(link).toHaveAttribute('href', 'https://flasher.dutchmeshcore.nl/firmware/a.bin')
    expect(link).toHaveAttribute('download')
  })

  it('renders custom firmware metadata above the version selector', () => {
    const customFirmware: DeviceFirmware = {
      role: 'custom',
      title: 'Custom Firmware',
      subTitle: 'Heltec_Wireless_Tracker_repeater_observer_mqtt-1.15.0.bin',
      version: {
        custom: { files: [{ type: 'flash-update', name: 'local.bin', title: 'local.bin' }] },
      },
      customFile: true,
    }

    render(wrap(
      <FlashOptions
        device={device} firmware={customFirmware} config={config as FlasherConfig}
        supported={false} onFlash={vi.fn()} onBack={vi.fn()}
      />
    ))

    expect(screen.getByText(/Custom Firmware/)).toBeInTheDocument()
    expect(screen.getByText(/Heltec_Wireless_Tracker/)).toBeInTheDocument()
    expect(screen.getByText('custom')).toBeInTheDocument()
  })
})
