import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, 'public', 'data', 'channels.json')
const port = Number(process.env.PORT || 8080)

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks).toString('utf8')
  return body ? JSON.parse(body) : null
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(body))
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {})
      return
    }

    if (req.url === '/api/status' && req.method === 'GET') {
      sendJson(res, 200, { ok: true })
      return
    }

    if (req.url === '/api/channels' && req.method === 'GET') {
      const data = await readFile(dataPath, 'utf8')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(data)
      return
    }

    if (req.url === '/api/channels' && req.method === 'POST') {
      const data = await readJsonBody(req)
      if (!Array.isArray(data)) {
        sendJson(res, 400, { error: 'Expected an array of channel metadata.' })
        return
      }
      await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
      sendJson(res, 200, { ok: true })
      return
    }

    sendJson(res, 404, { error: 'Not found' })
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Server error' })
  }
})

server.listen(port, () => {
  console.log(`MeshCore toolbox API listening on http://localhost:${port}`)
})
