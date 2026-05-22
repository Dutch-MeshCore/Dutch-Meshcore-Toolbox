import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChannelRow from '../components/channels/ChannelRow'
import type { Channel } from '../types'

vi.mock('../utils/channelHash', () => ({
  computeChannelHash: vi.fn().mockResolvedValue('abcd1234'),
}))

const mockChannel: Channel = {
  channel: '#test',
  _key: 'aabbccddeeff0011',
  _hasMeta: true,
  _localEdit: false,
  source: 'radio',
}

function renderRow() {
  return render(
    <MemoryRouter>
      <table>
        <tbody>
          <ChannelRow
            channel={mockChannel}
            selected={false}
            onToggleSelect={vi.fn()}
            onCopy={vi.fn()}
            onEdit={vi.fn()}
            onInfo={vi.fn()}
          />
        </tbody>
      </table>
    </MemoryRouter>
  )
}

describe('ChannelRow', () => {
  it('does not render the source column cell', () => {
    const { container } = renderRow()
    expect(container.querySelector('.lt-source')).toBeNull()
  })
})
