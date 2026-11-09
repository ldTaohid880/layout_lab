import type { LeftTab } from '@/types/sandbox'

/*
 * The studio's URL scheme (LL-011), as pure functions so it can be unit-tested without a router:
 *
 *   /                          home (today: the studio; replaced by the canonical URL below)
 *   /learn/$lessonId           Examples tab with that lesson (example) open
 *   /challenges/$challengeId   Challenges tab showing that challenge
 *   /play/$sandboxId?tab=…     that sandbox, with the left tab (omitted for the default "items")
 */

export type StudioLocation =
  | { kind: 'home' }
  | { kind: 'learn'; lessonId: string }
  | { kind: 'challenge'; challengeId: string }
  | { kind: 'play'; sandboxId: string; tab: LeftTab }

/** The parts of the studio state that the URL shows. */
export interface UrlState {
  activeSandboxId: string
  leftTab: LeftTab
  openLessonId: string | null
  viewingChallengeId: string | null
}

const LEFT_TABS: readonly LeftTab[] = ['items', 'examples', 'docs', 'challenges']

export function isLeftTab(value: unknown): value is LeftTab {
  return typeof value === 'string' && (LEFT_TABS as readonly string[]).includes(value)
}

/** Read a studio location from a pathname and parsed search; null if the path is not a studio route. */
export function parseStudioLocation(pathname: string, search: Record<string, unknown> = {}): StudioLocation | null {
  const parts = pathname.split('/').filter(Boolean).map(safeDecode)
  if (parts.length === 0) return { kind: 'home' }
  if (parts.length !== 2 || !parts[1]) return null
  const [section, id] = parts as [string, string]
  if (section === 'learn') return { kind: 'learn', lessonId: id }
  if (section === 'challenges') return { kind: 'challenge', challengeId: id }
  if (section === 'play') return { kind: 'play', sandboxId: id, tab: isLeftTab(search.tab) ? search.tab : 'items' }
  return null
}

/** The URL for a studio location, in one canonical form (so two equal locations give equal strings). */
export function hrefFor(location: StudioLocation): string {
  switch (location.kind) {
    case 'home':
      return '/'
    case 'learn':
      return `/learn/${encodeURIComponent(location.lessonId)}`
    case 'challenge':
      return `/challenges/${encodeURIComponent(location.challengeId)}`
    case 'play':
      return `/play/${encodeURIComponent(location.sandboxId)}${location.tab === 'items' ? '' : `?tab=${location.tab}`}`
  }
}

/** Where the studio state says the user is: an open lesson or viewed challenge wins over the plain sandbox. */
export function locationFor(state: UrlState): StudioLocation {
  if (state.leftTab === 'examples' && state.openLessonId) return { kind: 'learn', lessonId: state.openLessonId }
  if (state.leftTab === 'challenges' && state.viewingChallengeId) {
    return { kind: 'challenge', challengeId: state.viewingChallengeId }
  }
  return { kind: 'play', sandboxId: state.activeSandboxId, tab: state.leftTab }
}

function safeDecode(part: string): string {
  try {
    return decodeURIComponent(part)
  } catch {
    return part
  }
}
