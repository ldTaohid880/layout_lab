import { defineConfig } from '@playwright/test'
import base from './playwright.config'

/*
 * The same E2E suite against the minified production build. This matters because the preview
 * runtime is serialised with Function.prototype.toString: only a real build proves minification
 * kept it self-contained.
 */
const PORT = 5182

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
