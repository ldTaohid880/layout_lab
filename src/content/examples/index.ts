import { use } from 'react'
import type * as Data from './data'

/*
 * Example content is loaded on demand (LL-013): data.ts and its JSON files are one lazy chunk, fetched
 * the first time the Examples tab opens. The path of ids (path.ts) stays in the main bundle.
 */

export type { PathLesson } from './data'
export type ExampleContent = typeof Data

let promise: Promise<ExampleContent> | undefined

export function loadExamples(): Promise<ExampleContent> {
  return (promise ??= import('./data'))
}

/** The example content; suspends until it has loaded. */
export function useExamples(): ExampleContent {
  return use(loadExamples())
}
