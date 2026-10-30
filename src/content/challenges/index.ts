import type { Challenge } from '../types'
import { CHALLENGE_ORDER } from './order'

/*
 * One JSON file per challenge: a starter tree and cosmetic CSS, a brief, hints, a solution, and
 * the widths its reference pictures are rendered at (see src/content/references.ts and
 * npm run references). Adding a file here adds it to the Challenges tab once its id is placed in
 * order.ts; the content tests (src/content/content.test.ts) check each one.
 */
const files = import.meta.glob<Challenge>('./*.json', { eager: true, import: 'default' })

const byId = new Map(Object.values(files).map((challenge) => [challenge.id, challenge]))

/** All challenges, in order.ts order. */
export const CHALLENGES: Challenge[] = CHALLENGE_ORDER.flatMap((id) => byId.get(id) ?? [])

export const CHALLENGES_BY_ID: ReadonlyMap<string, Challenge> = new Map(CHALLENGES.map((c) => [c.id, c]))

/** Every challenge file by id, whether or not it is in order.ts. */
export const CHALLENGE_FILES: ReadonlyMap<string, Challenge> = byId
