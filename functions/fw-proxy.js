/**
 * CORS proxy for GitHub release assets — Cloudflare Pages Function.
 *
 * Served same-origin at `/fw-proxy` on the toolbox domain, so the in-browser
 * flasher can `fetch()` release-hosted firmware. (GitHub release downloads don't
 * send `Access-Control-Allow-Origin`; same-origin means the browser applies no
 * CORS at all — the CORS headers below are belt-and-suspenders.)
 *
 * NOT an open proxy: only `https://github.com/<org>/<repo>/releases/download/...`
 * URLs are allowed.
 *
 * Wired up via `FIRMWARE_CORS_PROXY = '/fw-proxy'` in src/utils/flasherUtils.ts.
 * Usage: GET /fw-proxy?url=<encoded github release download url>
 */

const ALLOW_URL = /^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\/[^?#]+$/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
}

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS })
  }

  const target = new URL(request.url).searchParams.get('url')
  if (!target || !ALLOW_URL.test(target)) {
    return new Response('Forbidden: only GitHub release assets are proxied', {
      status: 403,
      headers: CORS,
    })
  }

  // Follow GitHub's 302 to the signed asset URL server-side (no CORS there).
  const upstream = await fetch(target, {
    method: request.method,
    redirect: 'follow',
    cf: { cacheTtl: 3600, cacheEverything: true },
  })

  const headers = new Headers(upstream.headers)
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v)
  headers.delete('content-disposition') // the flasher wants bytes, not a download

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}
