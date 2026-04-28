/**
 * Format an ISO datetime string into a human-readable form.
 * Output: "6-4-2026 - 18:12 UTC"  (day-month-year - HH:MM UTC)
 * Returns "—" for null/empty/invalid input.
 */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const day   = d.getUTCDate()
  const month = d.getUTCMonth() + 1
  const year  = d.getUTCFullYear()
  const hh    = String(d.getUTCHours()).padStart(2, '0')
  const mm    = String(d.getUTCMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} - ${hh}:${mm} UTC`
}

/**
 * Format a date-only string (YYYY-MM-DD) or ISO datetime into just a date.
 * Output: "6-4-2026"
 */
export function fmtDateOnly(iso: string | null | undefined): string {
  if (!iso) return '—'
  // Accept both "2026-04-06" and full ISO strings
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso)
  if (isNaN(d.getTime())) return '—'
  return `${d.getUTCDate()}-${d.getUTCMonth() + 1}-${d.getUTCFullYear()}`
}

/**
 * Returns a short relative time string (e.g. "3h ago", "5d ago").
 * Falls back to fmtDate when more than 30 days ago.
 * The original formatted date is suitable as a tooltip (title attribute).
 */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 0) return fmtDate(iso)
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return fmtDateOnly(iso)
}
