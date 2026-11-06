import { defineConfig } from 'vite'
import { registerApi } from './src/api.js'

function api() {
  return {
    name: 'ubercastagne-api',
    configureServer(server) {
      registerApi(server.middlewares)
    },
  }
}

export default defineConfig({
  plugins: [api()],
  server: {
    // Requests proxied by the front container arrive with "Host: back".
    allowedHosts: ['back'],
  },
})
