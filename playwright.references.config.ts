import { defineConfig, devices } from '@playwright/test'

/** Config for `npm run references` (scripts/capture-references.ts). No dev server needed. */
export default defineConfig({
  testDir: './scripts',
  testMatch: 'capture-references.ts',
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL ?? 'chrome' },
})
