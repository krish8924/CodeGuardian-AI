import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The backend does not ship CORS middleware, so the browser talks to a
 * same-origin `/api` path and Vite proxies those requests to FastAPI.
 * `VITE_API_BASE_URL` is still the single place that defines the backend URL.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = (env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '')

  const proxy = {
    '/api': {
      target: backendUrl,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      proxy,
    },
    preview: {
      host: 'localhost',
      port: 4173,
      strictPort: true,
      proxy,
    },
  }
})
