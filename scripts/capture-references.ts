import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { loadChallenges } from '../src/content/challenges/node'
import { instantiate } from '../src/content/instantiate'
import { REFERENCE_HEIGHT, referenceFile, referenceKey, type ReferenceManifest } from '../src/content/references'
import { FRAME_RUNTIME } from '../src/features/preview/frameRuntime'
import { buildSrcDoc } from '../src/features/preview/generateHtml'

const CHALLENGES = loadChallenges()

/*
 * `npm run references`: renders every challenge's solution in a real browser at each of its
 * `viewports` widths, and saves the screenshots to public/references/ with a manifest of content hashes.
 * It runs under Playwright's runner only to get TypeScript and the "@/" alias for free.
 */

const OUT = resolve(process.cwd(), 'public/references')

test('capture reference screenshots', async ({ page }) => {
  mkdirSync(OUT, { recursive: true })
  const manifest: ReferenceManifest = {}

  for (const challenge of CHALLENGES) {
    manifest[challenge.id] = {}
    const srcDoc = buildSrcDoc({
      items: instantiate(challenge.items),
      css: challenge.solution,
      bg: 'white',
      runtime: FRAME_RUNTIME,
    })

    for (const width of challenge.viewports) {
      // A fixed viewport height keeps pictures comparable; fullPage still captures taller layouts.
      await page.setViewportSize({ width, height: REFERENCE_HEIGHT })
      await page.setContent(srcDoc, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: resolve(OUT, referenceFile(challenge.id, width)), fullPage: true })
      manifest[challenge.id][String(width)] = referenceKey(challenge, width)
    }
  }

  writeFileSync(resolve(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  expect(Object.keys(manifest)).toHaveLength(CHALLENGES.length)
})
