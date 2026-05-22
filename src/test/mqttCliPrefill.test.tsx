import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MqttCliPage from '../pages/MqttCliPage'
import { LangProvider } from '../hooks/useLang'

describe('MqttCliPage prefill', () => {
  it('applies router-state prefill to first free slot on mount', async () => {
    render(
      <LangProvider>
        <MemoryRouter
          initialEntries={[{
            pathname: '/mqtt-cli',
            state: {
              prefill: {
                server: 'wss://collector1.dutchmeshcore.nl:443/mqtt',
                port: '443',
                audience: 'collector1.dutchmeshcore.nl',
                authMode: 'jwt' as const,
              }
            }
          }]}
        >
          <MqttCliPage />
        </MemoryRouter>
      </LangProvider>
    )
    // Default slots: ['dutchmeshcore-1', 'dutchmeshcore-2', 'none', 'none', 'none', 'none']
    // First free slot = index 2 (slot 3) → slot-select[2] should become 'custom' after mount
    await waitFor(() => {
      const selects = document.querySelectorAll<HTMLSelectElement>('.slot-select')
      expect(selects[2].value).toBe('custom')
    })
  })
})
