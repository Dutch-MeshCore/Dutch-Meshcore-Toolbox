import { useState, useEffect, useRef } from 'react'

const LS_KEY = 'meshcore-page-size'
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 0] // 0 = All

export { PAGE_SIZE_OPTIONS }

export function usePagination<T>(items: T[]) {
  const [pageSize, setPageSizeRaw] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem(LS_KEY) || '50', 10)
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 50
  })
  const [page, setPage] = useState(1)

  // Reset to page 1 whenever the items array identity changes (filter applied)
  const prevItems = useRef(items)
  useEffect(() => {
    if (prevItems.current !== items) {
      setPage(1)
      prevItems.current = items
    }
  })

  const setPageSize = (size: number) => {
    setPageSizeRaw(size)
    localStorage.setItem(LS_KEY, String(size))
    setPage(1)
  }

  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(items.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paged      = pageSize === 0 ? items : items.slice((safePage - 1) * pageSize, safePage * pageSize)

  return { page: safePage, setPage, pageSize, setPageSize, totalPages, paged }
}
