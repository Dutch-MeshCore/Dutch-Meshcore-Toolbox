import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FilterControls from '../components/layout/FilterControls'
import ResultsBar from '../components/layout/ResultsBar'
import type { FilterState } from '../types'

const defaultFilters: FilterState = {
  search: '',
  category: '',
  subcategory: '',
  region: '',
  scope: '',
  country: '',
  onlyScoped: false,
  onlyBare: false,
  minMessages: 0,
}

describe('FilterControls', () => {
  it('does not render editor export buttons', () => {
    render(
      <MemoryRouter>
        <FilterControls
          allChannels={[]}
          filters={defaultFilters}
          setFilter={vi.fn()}
          viewMode="grid"
          setViewMode={vi.fn()}
          categoryMap={{}}
        />
      </MemoryRouter>
    )
    expect(screen.queryByText(/⬇ JSON/i)).toBeNull()
    expect(screen.queryByText(/⬇ TXT/i)).toBeNull()
    expect(screen.queryByText(/⬇ RTfM/i)).toBeNull()
  })
})

describe('ResultsBar', () => {
  it('renders without localEditsCount or serverMode props', () => {
    const { container } = render(
      <MemoryRouter>
        <ResultsBar
          count={5}
          total={10}
          isFiltered={true}
          onClearFilters={vi.fn()}
          pageSize={25}
          onPageSizeChange={vi.fn()}
        />
      </MemoryRouter>
    )
    // Component should render the results-bar div with count info
    expect(container.querySelector('.results-bar')).toBeTruthy()
    expect(container.querySelector('strong')).toBeTruthy()
  })

  it('does not render local edits note', () => {
    render(
      <MemoryRouter>
        <ResultsBar
          count={5}
          total={10}
          isFiltered={false}
          onClearFilters={vi.fn()}
          pageSize={25}
          onPageSizeChange={vi.fn()}
        />
      </MemoryRouter>
    )
    // The local edits badge should never appear (prop removed)
    expect(screen.queryByText(/✏/)).toBeNull()
  })
})
