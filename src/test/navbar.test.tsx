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
})
