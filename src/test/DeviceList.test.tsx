import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import DeviceList from '../components/flasher/DeviceList'
import type { FlasherDevice } from '../types'
import { LangProvider } from '../hooks/useLang'

const devices: FlasherDevice[] = [
  { maker: 'dutchmeshcore', class: 'community', name: 'Heltec V3', type: 'esp32', firmware: [] },
  { maker: 'dutchmeshcore', class: 'community', name: 'Heltec V4', type: 'esp32', firmware: [] },
  { maker: 'dutchmeshcore', class: 'community', name: 'RAK 4631', type: 'nrf52', firmware: [] },
]

const makerNames = {
  dutchmeshcore: { name: 'DutchMeshCore MQTT Firmware' },
}

function renderList(onSelect = vi.fn()) {
  return render(
    <LangProvider>
      <DeviceList devices={devices} makerNames={makerNames} onSelect={onSelect} />
    </LangProvider>
  )
}

describe('DeviceList', () => {
  it('renders all device names', () => {
    renderList()
    expect(screen.getByText('Heltec V3')).toBeInTheDocument()
    expect(screen.getByText('Heltec V4')).toBeInTheDocument()
    expect(screen.getByText('RAK 4631')).toBeInTheDocument()
  })

  it('filters devices by search query', () => {
    renderList()
    const input = screen.getByPlaceholderText(/filter/i)
    fireEvent.change(input, { target: { value: 'V4' } })
    expect(screen.queryByText('Heltec V3')).not.toBeInTheDocument()
    expect(screen.getByText('Heltec V4')).toBeInTheDocument()
  })

  it('calls onSelect when a device is clicked', () => {
    const onSelect = vi.fn()
    renderList(onSelect)
    fireEvent.click(screen.getByText('Heltec V3'))
    expect(onSelect).toHaveBeenCalledWith(devices[0])
  })

  it('keeps the selected custom app bin file for direct flashing', () => {
    const onSelect = vi.fn()
    const { container } = renderList(onSelect)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['firmware'], 'Heltec_Wireless_Tracker_repeater_observer_mqtt-1.15.0.bin')

    fireEvent.change(input, { target: { files: [file] } })

    const selected = onSelect.mock.calls[0][0] as FlasherDevice
    const firmware = selected.firmware[0]
    const firmwareFile = selected.firmware[0].version.custom.files[0]
    expect(selected.type).toBe('esp32')
    expect(firmware.title).toBe('Custom Firmware')
    expect(firmware.subTitle).toBe(file.name)
    expect(firmwareFile.type).toBe('flash-update')
    expect(firmwareFile.name).toBe(file.name)
    expect(firmwareFile.file).toBe(file)
  })

  it('marks selected custom merged bins as full flash files', () => {
    const onSelect = vi.fn()
    const { container } = renderList(onSelect)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['firmware'], 'Heltec_Wireless_Tracker_repeater_observer_mqtt-1.15.0-merged.bin')

    fireEvent.change(input, { target: { files: [file] } })

    const selected = onSelect.mock.calls[0][0] as FlasherDevice
    expect(selected.firmware[0].version.custom.files[0].type).toBe('flash-wipe')
  })

  it('shows the board preview image when hovering a mapped device', () => {
    renderList()
    const btn = screen.getByText('Heltec V3').closest('button') as HTMLButtonElement
    fireEvent.mouseEnter(btn)
    const preview = screen.getByTestId('device-preview')
    expect(within(preview).getByRole('img').getAttribute('src')).toBe('/img/heltec_v3.svg')
  })

  it('removes the preview on mouse leave', () => {
    renderList()
    const btn = screen.getByText('Heltec V4').closest('button') as HTMLButtonElement
    fireEvent.mouseEnter(btn)
    expect(screen.getByTestId('device-preview')).toBeInTheDocument()
    fireEvent.mouseLeave(btn)
    expect(screen.queryByTestId('device-preview')).not.toBeInTheDocument()
  })

  it('shows no preview for a device without board art', () => {
    render(
      <LangProvider>
        <DeviceList
          devices={[
            { maker: 'dutchmeshcore', class: 'community', name: 'Meshtiny', type: 'nrf52', firmware: [] },
          ]}
          makerNames={makerNames}
          onSelect={vi.fn()}
        />
      </LangProvider>,
    )
    fireEvent.mouseEnter(screen.getByText('Meshtiny').closest('button') as HTMLButtonElement)
    expect(screen.queryByTestId('device-preview')).not.toBeInTheDocument()
  })
})
