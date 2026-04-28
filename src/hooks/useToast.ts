import { useState, useCallback } from 'react'
import type { ToastMsg, ToastType } from '../types'

let _id = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const toast = useCallback((msg: string, type: ToastType = 'ok', ms = 2500) => {
    const id = ++_id
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ms)
  }, [])

  return { toasts, toast }
}
