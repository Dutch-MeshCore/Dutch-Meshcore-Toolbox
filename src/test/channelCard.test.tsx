import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChannelCard from '../components/channels/ChannelCard'
import { LangProvider } from '../hooks/useLang'
import type { Channel } from '../types'

const mockChannel: Channel = {
  channel: '#test',
  _key: 'aabbccddeeff0011',
  _hasMeta: true,
  _localEdit: false,
  source: 'radio',
}

function renderCard() {
  return render(
    <MemoryRouter>
      <LangProvider>
        <ChannelCard
          channel={mockChannel}
          selected={false}
          onToggleSelect={vi.fn()}
          onCopy={vi.fn()}
          onEdit={vi.fn()}
          onInfo={vi.fn()}
        />
      </LangProvider>
    </MemoryRouter>
  )
}

describe('ChannelCard', () => {
  it('does not render the source field in card metadata', () => {
    renderCard()
    expect(screen.queryByText('radio')).not.toBeInTheDocument()
    expect(screen.queryByText('Source')).not.toBeInTheDocument()
    expect(screen.queryByText('Bron')).not.toBeInTheDocument()
  })
})
