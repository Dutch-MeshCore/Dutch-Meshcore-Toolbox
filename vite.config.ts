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
          const hasFileExtension = path.extname(url) !== ''

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

          if (url === '/channel-browser' || (url.startsWith('/channel-browser/') && !hasFileExtension)) {
            const filePath = path.join(process.cwd(), 'channel-browser.html')
            const html = await server.transformIndexHtml(
              url,
              fs.readFileSync(filePath, 'utf8')
            )
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
            return
          }

          if (url === '/mqtt-cli' || url === '/mqtt-cli/') {
            const filePath = path.join(process.cwd(), 'docs', 'mqtt-cli', 'index.html')
            res.setHeader('Content-Type', 'text/html')
            res.end(fs.readFileSync(filePath))
            return
          }

          next()
        })
      },
    },
    {
      name: 'channel-browser-html-output',
      closeBundle() {
        const outDir = path.join(process.cwd(), 'docs', 'channel-browser')
        const from = path.join(outDir, 'channel-browser.html')
        const to = path.join(outDir, 'index.html')
        if (fs.existsSync(from)) {
          if (fs.existsSync(to)) fs.unlinkSync(to)
          fs.renameSync(from, to)
        }
      },
    },
  ],
  base: './',
  build: {
    outDir: 'docs/channel-browser',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'channel-browser.html'),
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
