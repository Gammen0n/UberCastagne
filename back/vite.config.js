import { defineConfig } from 'vite'

function api() {
  return {
    name: 'ubercastagne-api',
    configureServer(server) {
      server.middlewares.use('/api/health', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ status: 'ok' }))
      })
    },
  }
}

export default defineConfig({
  plugins: [api()],
})
