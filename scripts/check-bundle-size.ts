import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

/*
 * Size budget for the JavaScript a first visit downloads (LL-013): the entry script plus the chunks
 * index.html preloads, gzipped. Run after `npm run build`; exits 1 when over budget.
 *
 * Before LL-013 the initial JS was 562 KB gzip; lazy panels and content brought it to 437 KB (KB = 1024 bytes).
 * The budget leaves a little headroom above that. Raise it only on purpose, and say why in the PR.
 */
const BUDGET_KB = 460

const dist = resolve(import.meta.dirname, '..', 'dist')
const html = readFileSync(resolve(dist, 'index.html'), 'utf8')
const files = [...new Set([...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]))]

if (files.length === 0) {
  console.error('No /assets/*.js files found in dist/index.html. Run `npm run build` first.')
  process.exit(1)
}

const rows = files.map((file) => ({ file, kb: gzipSync(readFileSync(resolve(dist, file))).length / 1024 }))
const total = rows.reduce((sum, row) => sum + row.kb, 0)

for (const { file, kb } of rows) console.log(`${kb.toFixed(1).padStart(8)} KB  ${file}`)
console.log(`${total.toFixed(1).padStart(8)} KB  initial JS (gzip), budget ${BUDGET_KB} KB`)

if (total > BUDGET_KB) {
  console.error(`Initial JS is ${(total - BUDGET_KB).toFixed(1)} KB over budget.`)
  process.exit(1)
}
