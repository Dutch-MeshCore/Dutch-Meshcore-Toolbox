import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSerialDevice } from '../hooks/useSerialDevice'

describe('useSerialDevice', () => {
  it('starts disconnected', () => {
    const { result } = renderHook(() => useSerialDevice())
    expect(result.current.state).toBe('disconnected')
  })

  it('reports unsupported when navigator.serial absent', () => {
    const { result } = renderHook(() => useSerialDevice())
    expect(result.current.supported).toBe(false)
  })

  it('device is null initially', () => {
    const { result } = renderHook(() => useSerialDevice())
    expect(result.current.device).toBeNull()
  })
})
