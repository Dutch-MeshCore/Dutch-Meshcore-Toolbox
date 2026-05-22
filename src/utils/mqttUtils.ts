/**
 * Parses a broker URL and returns the port and audience (hostname).
 * Port defaults to 443 for wss:, 1883 for everything else.
 * Returns empty strings if the URL is invalid or has no hostname.
 */
export function parseServerUrl(url: string): { port: string; audience: string } {
  try {
    const u = new URL(url)
    const audience = u.hostname || ''
    if (!audience) return { port: '', audience: '' }
    const port = u.port || (u.protocol === 'wss:' ? '443' : '1883')
    return { port, audience }
  } catch {
    return { port: '', audience: '' }
  }
}
