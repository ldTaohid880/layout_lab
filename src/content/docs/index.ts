import { use } from 'react'
import type * as Data from './data'

/*
 * Docs content is loaded on demand (LL-013): data.ts and its JSON files are one lazy chunk, fetched
 * the first time the Docs tab opens. The property order (order.ts) stays in the main bundle.
 */

export type DocsContent = typeof Data

let promise: Promise<DocsContent> | undefined

export function loadDocs(): Promise<DocsContent> {
  return (promise ??= import('./data'))
}

/** The docs content; suspends until it has loaded. */
export function useDocs(): DocsContent {
  return use(loadDocs())
}
