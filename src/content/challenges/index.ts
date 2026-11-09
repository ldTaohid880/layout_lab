import { use, useEffect, useState } from 'react'
import type * as Data from './data'

/*
 * Challenge content is loaded on demand (LL-013): data.ts and its JSON files are one lazy chunk, fetched
 * the first time something needs them. The ids and their order (order.ts) stay in the main bundle.
 */

export type ChallengeContent = typeof Data

let promise: Promise<ChallengeContent> | undefined
let loaded: ChallengeContent | undefined

export function loadChallenges(): Promise<ChallengeContent> {
  return (promise ??= import('./data').then((data) => (loaded = data)))
}

/** The challenge content; suspends until it has loaded. */
export function useChallenges(): ChallengeContent {
  return use(loadChallenges())
}

/** The challenge content, or undefined while it loads. Never suspends, so it suits always-visible UI. */
export function useChallengesIfLoaded(enabled = true): ChallengeContent | undefined {
  const [content, setContent] = useState(loaded)
  useEffect(() => {
    if (!enabled || content) return
    let current = true
    void loadChallenges().then((data) => current && setContent(data))
    return () => {
      current = false
    }
  }, [enabled, content])
  return content
}
