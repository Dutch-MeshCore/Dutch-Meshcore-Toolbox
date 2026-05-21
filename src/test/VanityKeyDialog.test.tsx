import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import VanityKeyDialog from '../components/config/VanityKeyDialog'
import { LangProvider } from '../hooks/useLang'

function renderDialog(phase: 'input' | 'generating' | 'result', extra = {}) {
  const baseProps = {
    open: true,
    phase,
    prefix: 'ab',
    attempts: 0,
    progress: 0,
    elapsed: '0s',
    keysPerSec: '0',
    estimatedTime: '< 1s',
    resultPubKey: '',
    resultPrvKey: '',
    onPrefixChange: vi.fn(),
    onGenerate: vi.fn(),
    onCancel: vi.fn(),
    onApply: vi.fn(),
    ...extra,
  }
  return render(
    <LangProvider><VanityKeyDialog {...baseProps} /></LangProvider>
  )
}

describe('VanityKeyDialog', () => {
  it('renders input phase with generate button', () => {
    renderDialog('input')
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
  })

  it('renders generating phase with stop button', () => {
    renderDialog('generating')
    expect(screen.getByText(/stop/i)).toBeInTheDocument()
  })

  it('renders result phase with use this key button', () => {
    renderDialog('result', { resultPubKey: 'ab1234', resultPrvKey: 'ff00' })
    expect(screen.getByText(/use this key/i)).toBeInTheDocument()
  })
})
