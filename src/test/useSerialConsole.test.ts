import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSerialConsole } from '../hooks/useSerialConsole'

describe('useSerialConsole', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useSerialConsole())
    expect(result.current.open_).toBe(false)
  })

  it('open() does not throw synchronously', () => {
    const { result } = renderHook(() => useSerialConsole())
    expect(() => result.current.open()).not.toThrow()
  })
})
