import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // The browser calls /api on the front's origin; Vite forwards it to the back.
    proxy: {
      '/api': process.env.API_URL ?? 'http://localhost:3000',
    },
  },
})
