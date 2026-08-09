import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import IndexPage from '../pages/IndexPage'
import type { ChannelMeta } from '../types'

// Regression: switching pages on the channel browser. The page must not snap
// back to page 1 when it re-renders — a fresh derived `allChannels`/`filtered`
// array each render used to trigger usePagination's reset-to-1 effect.

function makeChannels(n: number): ChannelMeta[] {
  return Array.from({ length: n }, (_, i) => ({
    channel: `#chan${String(i).padStart(3, '0')}`,
    channel_hash: 'a'.repeat(32),
    scopes: ['nl'],
    countries: ['Netherlands'],
    regions: [],
    country: 'Netherlands',
    region: '',
    last_seen: '2026-08-09T00:00:00Z',
    message_amount: n - i,
  }))
}

beforeEach(() => {
  localStorage.clear()
  // Default page size is 50; 60 channels => 2 pages.
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => makeChannels(60),
  })) as unknown as typeof fetch
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('IndexPage pagination', () => {
  it('advances to page 2 when the next button is clicked', async () => {
    render(
      <MemoryRouter>
        <IndexPage />
      </MemoryRouter>
    )

    // Wait for the channel list to render.
    await screen.findAllByText(/#chan/)

    const pagination = document.querySelector('.pagination')
    expect(pagination).not.toBeNull()
    expect(document.querySelector('.pagination .pg-btn.active')?.textContent).toBe('1')

    const btns = pagination!.querySelectorAll('.pg-btn')
    const nextBtn = btns[btns.length - 1] as HTMLElement
    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(document.querySelector('.pagination .pg-btn.active')?.textContent).toBe('2')
    })
  })
})
