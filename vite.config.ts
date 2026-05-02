import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    {
      // Serve docs/data/ at /data/ during dev
      name: 'serve-docs-data',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url?.split('?')[0] ?? '/'

          if (url.startsWith('/data/') || url.startsWith('/channel-browser/data/')) {
            const dataUrl = url.replace(/^\/channel-browser/, '')
            const filePath = path.join(process.cwd(), 'public', dataUrl)
            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath)
              const mime = ext === '.json' ? 'application/json' : 'text/plain'
              res.setHeader('Content-Type', mime)
              res.end(fs.readFileSync(filePath))
              return
            }
          }

          if (url === '/channel-browser' || url === '/channel-browser/') {
            res.statusCode = 302
            res.setHeader('Location', '/#/channel-browser')
            return
          }

          if (url === '/mqtt-cli' || url === '/mqtt-cli/') {
            res.statusCode = 302
            res.setHeader('Location', '/#/mqtt-cli')
            return
          }

          if (url === '/firmware' || url === '/firmware/') {
            res.statusCode = 302
            res.setHeader('Location', '/#/firmware')
            return
          }

          next()
        })
      },
    },
    {
      name: 'legacy-route-shims',
      closeBundle() {
        const outDir = path.join(process.cwd(), 'docs')
        const shims = [
          ['channel-browser', '#/channel-browser'],
          ['mqtt-cli', '#/mqtt-cli'],
          ['firmware', '#/firmware'],
        ]
        for (const [dir, hash] of shims) {
          const routeDir = path.join(outDir, dir)
          fs.mkdirSync(routeDir, { recursive: true })
          fs.writeFileSync(
            path.join(routeDir, 'index.html'),
            `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=../${hash}"><script>location.replace('../${hash}'+location.search)</script></head><body><a href="../${hash}">Continue</a></body></html>`
          )
        }
      },
    },
  ],
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        // Silence "ECONNREFUSED" noise when the local server isn't running.
        // The client already handles the failure gracefully via the AbortSignal timeout.
        configure(proxy) {
          proxy.on('error', () => { /* server not running — expected */ })
        },
      },
    },
  },
})
