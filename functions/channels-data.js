/**
 * Channels feed proxy — Cloudflare Pages Function.
 *
 * Served same-origin at `/channels-data`. Fetches the meshcore-analyzer.eu feed
 * server-side, caches it on Cloudflare's edge (`cf.cacheTtl`), maps it to the
 * toolbox channel model, and returns JSON. Because the edge cache is shared, the
 * upstream sees at most one request per cache window across all visitors — the
 * browser never calls the analyzer directly.
 *
 * Wired up in src/hooks/useChannelData.ts (`fetch('/channels-data')`).
 */

import { mapAnalyzerResponse } from '../src/utils/analyzerChannels.ts'

const UPSTREAM = 'https://meshcore-analyzer.eu/api/channels'
const EDGE_TTL = 300 // seconds — one upstream hit per 5 min, shared across visitors

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS })
  }

  let channels
  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: EDGE_TTL, cacheEverything: true },
    })
    if (!upstream.ok) throw new Error(`upstream HTTP ${upstream.status}`)
    channels = mapAnalyzerResponse(await upstream.json())
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message || err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }

  return new Response(JSON.stringify(channels), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Let the browser/CDN reuse the response briefly too.
      'Cache-Control': `public, max-age=${EDGE_TTL}`,
      ...CORS,
    },
  })
}
