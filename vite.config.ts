import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

const DEFAULT_API_ORIGIN = 'https://interview-api.memtime-demo.deno.net'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix loads non-VITE_ vars too; they stay server-side and are never bundled.
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.MEMTIME_API_KEY ?? ''

  if (!apiKey) {
    console.warn(
      '[memtime] MEMTIME_API_KEY is not set; API requests will fail with 401.',
    )
  }

  const apiProxy: Record<string, ProxyOptions> = {
    '/api': {
      target: env.MEMTIME_API_ORIGIN || DEFAULT_API_ORIGIN,
      changeOrigin: true,
      headers: { Authorization: `Bearer ${apiKey}` },
    },
  }

  return {
    plugins: [react()],
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
  }
})
