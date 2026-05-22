import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { LangProvider } from '../hooks/useLang'

function renderNavbar() {
  return render(
    <LangProvider>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </LangProvider>
  )
}

describe('Navbar', () => {
  it('renders brand name', () => {
    renderNavbar()
    expect(screen.getByText(/DutchMeshCore/i)).toBeInTheDocument()
  })

  it('renders Devices nav trigger', () => {
    renderNavbar()
    expect(screen.getByText(/Devices|Apparaten/i)).toBeInTheDocument()
  })

  it('does not render a link to the Local Editor', () => {
    renderNavbar()
    // In English (default in jsdom), nav_editor = 'Local Editor'
    expect(screen.queryByRole('link', { name: /local editor/i })).toBeNull()
  })

  it('does not render a link to the How To page', () => {
    renderNavbar()
    // In English (default in jsdom), nav_howto = 'How To'
    expect(screen.queryByRole('link', { name: /^how to$/i })).toBeNull()
  })
})
