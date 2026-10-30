import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Challenge } from '../types'
import { CHALLENGE_ORDER } from './order'

/*
 * The same list as index.ts for code that runs outside Vite (Playwright specs and
 * scripts/capture-references.ts), where import.meta.glob is not available.
 */
const DIR = dirname(fileURLToPath(import.meta.url))

export function loadChallenges(): Challenge[] {
  const byId = new Map<string, Challenge>()
  for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
    const challenge = JSON.parse(readFileSync(resolve(DIR, file), 'utf8')) as Challenge
    byId.set(challenge.id, challenge)
  }
  return CHALLENGE_ORDER.flatMap((id) => byId.get(id) ?? [])
}
