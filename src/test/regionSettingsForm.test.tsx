import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RegionSettingsForm from '../components/config/RegionSettingsForm'
import RegionGatingForm from '../components/config/RegionGatingForm'
import { defaultRegionSettings } from '../lib/config/regionCommands'

describe('RegionSettingsForm', () => {
  it('renders the wildcard root and adds a child region', () => {
    const onChange = vi.fn()
    render(
      <RegionSettingsForm
        value={defaultRegionSettings()}
        onChange={onChange}
        onSendCommand={async () => ''}
      />,
    )
    expect(screen.getByText('*')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /add child/i }))
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls[0][0]
    expect(next.tree.children).toHaveLength(1)
  })
})

describe('RegionGatingForm', () => {
  it('toggles dc.gate enabled', () => {
    const onChange = vi.fn()
    render(
      <RegionGatingForm
        value={defaultRegionSettings()}
        onChange={onChange}
        onSendCommand={async () => ''}
      />,
    )
    fireEvent.click(screen.getByLabelText(/duty-cycle gating/i))
    const calls = onChange.mock.calls
    expect(calls[calls.length - 1][0].dcGate.enabled).toBe(true)
  })
})
