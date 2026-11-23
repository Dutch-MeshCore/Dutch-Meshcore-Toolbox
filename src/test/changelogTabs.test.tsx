import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChangelogPage from '../pages/ChangelogPage'
import { LangProvider } from '../hooks/useLang'

function renderPage() {
  return render(
    <LangProvider>
      <MemoryRouter>
        <ChangelogPage />
      </MemoryRouter>
    </LangProvider>
  )
}

const panels = (container: HTMLElement) =>
  [...container.querySelectorAll('.changelog-page .panel-legend')].map(el => el.textContent ?? '')

describe('ChangelogPage tabs', () => {
  it('shows only the selected tab, also after switching back and forth', () => {
    const { container } = renderPage()
    const [firmwareTab, toolboxTab] = screen.getAllByRole('tab')

    const firmware = panels(container)
    expect(firmware.length).toBeGreaterThan(1)
    // Each entry needs its own identity (date + version + title), or React mixes them up.
    expect(new Set(firmware).size).toBe(firmware.length)

    fireEvent.click(toolboxTab)
    const toolbox = panels(container)
    expect(toolbox.length).toBeGreaterThan(0)
    // No firmware entry may survive the switch (firmware versions start with "v").
    expect(toolbox.filter(l => /^v\d/.test(l))).toEqual([])

    fireEvent.click(firmwareTab)
    expect(panels(container)).toEqual(firmware)
  })
})
