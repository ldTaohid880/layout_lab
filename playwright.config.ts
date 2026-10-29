import { defineConfig, devices } from '@playwright/test'

const PORT = 5181

export default defineConfig({
  testDir: './e2e',
  // Serial within a file: the latency assertion should not compete with other tests for CPU.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        // Use an installed Chrome by default (no browser download needed). Set PW_CHANNEL=chromium
        // after `npx playwright install chromium` to use Playwright's bundled build instead.
        channel: process.env.PW_CHANNEL ?? 'chrome',
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
