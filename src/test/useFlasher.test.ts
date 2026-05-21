import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFlasher } from '../hooks/useFlasher'

describe('useFlasher', () => {
  it('initial state: supported false in jsdom', () => {
    const { result } = renderHook(() => useFlasher())
    expect(result.current.supported).toBe(false)
  })

  it('initial state: not active', () => {
    const { result } = renderHook(() => useFlasher())
    expect(result.current.active).toBe(false)
    expect(result.current.percent).toBe(0)
    expect(result.current.error).toBe('')
  })
})
