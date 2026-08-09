import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FlashProgress from '../components/flasher/FlashProgress'
import type { FlasherDevice, DeviceFirmware, FlasherConfig } from '../types'

// The flash log must follow the newest line so users don't scroll manually,
// while still yielding if they scroll up to read earlier output.

function props(log: string) {
  return {
    device: { name: 'HELTEC~1.BIN' } as unknown as FlasherDevice,
    firmware: { role: 'repeater' } as unknown as DeviceFirmware,
    config: { role: {} } as unknown as FlasherConfig,
    percent: 100,
    log,
    error: '',
    onRetry: vi.fn(),
    onClose: vi.fn(),
    onConfigureUsb: vi.fn(),
  }
}

// jsdom has no layout, so drive scroll metrics ourselves and capture scrollTop.
function stub(el: HTMLElement, scrollHeight: number, clientHeight = 280) {
  const state = { top: 0 }
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => scrollHeight })
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight })
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => state.top,
    set: (v: number) => { state.top = v },
  })
  return state
}

describe('FlashProgress log auto-scroll', () => {
  it('pins the log to the newest line as output grows', () => {
    const { rerender, container } = render(
      <MemoryRouter><FlashProgress {...props('line 1\n')} /></MemoryRouter>
    )
    const pre = container.querySelector('.flash-log') as HTMLPreElement
    const s = stub(pre, 1000)

    rerender(<MemoryRouter><FlashProgress {...props('line 1\nline 2\nline 3\n')} /></MemoryRouter>)

    expect(s.top).toBe(1000)
  })

  it('stops auto-scrolling after the user scrolls up', () => {
    const { rerender, container } = render(
      <MemoryRouter><FlashProgress {...props('a\n')} /></MemoryRouter>
    )
    const pre = container.querySelector('.flash-log') as HTMLPreElement
    const s = stub(pre, 1000)

    // User scrolls up, far from the bottom.
    s.top = 0
    pre.dispatchEvent(new Event('scroll'))

    rerender(<MemoryRouter><FlashProgress {...props('a\nlots\nmore\noutput\n')} /></MemoryRouter>)

    expect(s.top).toBe(0)
  })
})
