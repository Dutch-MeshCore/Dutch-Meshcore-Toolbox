/**
 * Maps the meshcore-analyzer.eu `/api/channels` feed to the toolbox channel model.
 *
 * Dependency-free ESM so it can be imported by the Cloudflare Pages Function
 * (`functions/channels-data.js`) and the Vite dev middleware as well as the app.
 */

import type { ChannelMeta } from '../types'
import { deriveCountries, deriveRegions, isDutchScopes } from './scopeMeta'

/** One record as returned by the analyzer feed. */
export interface AnalyzerChannel {
  key?: string
  name?: string
  hash?: string
  messageCount?: number
  lastActivity?: string
  lastSender?: string
  lastMessage?: string
  encrypted?: boolean
  secretHex?: string
  scopes?: string[]
}

/** Map a single analyzer record to the app's ChannelMeta shape. */
export function mapAnalyzerChannel(raw: AnalyzerChannel): ChannelMeta | null {
  const channel = (raw.name ?? raw.key ?? '').trim()
  if (!channel) return null

  const scopes = Array.isArray(raw.scopes) ? raw.scopes.filter(s => typeof s === 'string') : []
  const countries = deriveCountries(scopes)
  const regions = deriveRegions(scopes)

  return {
    channel,
    channel_hash: typeof raw.secretHex === 'string' ? raw.secretHex : '',
    scopes,
    countries,
    regions,
    country: countries[0] ?? '',
    region: regions[0] ?? '',
    last_seen: typeof raw.lastActivity === 'string' ? raw.lastActivity : null,
    last_sender: typeof raw.lastSender === 'string' ? raw.lastSender : '',
    last_message: typeof raw.lastMessage === 'string' ? raw.lastMessage : '',
    encrypted: !!raw.encrypted,
    message_amount: typeof raw.messageCount === 'number' ? raw.messageCount : 0,
  }
}

/** Validate and map the full `{ channels: [...] }` response; drops malformed records. */
export function mapAnalyzerResponse(json: unknown): ChannelMeta[] {
  const list = (json as { channels?: unknown })?.channels
  if (!Array.isArray(list)) return []
  const out: ChannelMeta[] = []
  for (const raw of list) {
    if (raw && typeof raw === 'object') {
      const mapped = mapAnalyzerChannel(raw as AnalyzerChannel)
      if (mapped) out.push(mapped)
    }
  }
  return out
}

/** True when a channel is Dutch-scoped (used for NL-first ordering). */
export function isDutch(ch: Pick<ChannelMeta, 'scopes'>): boolean {
  return isDutchScopes(ch.scopes)
}
