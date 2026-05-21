import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DeviceList from '../components/flasher/DeviceList'
import type { FlasherDevice } from '../types'
import { LangProvider } from '../hooks/useLang'

const devices: FlasherDevice[] = [
  { maker: 'heltec', class: 'ripple', name: 'Heltec V3', type: 'esp32', firmware: [] },
  { maker: 'heltec', class: 'ripple', name: 'Heltec V4', type: 'esp32', firmware: [] },
  { maker: 'rak',    class: 'community', name: 'RAK 4631', type: 'nrf52', firmware: [] },
]

function renderList(onSelect = vi.fn()) {
  return render(
    <LangProvider>
      <DeviceList devices={devices} onSelect={onSelect} />
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
})
