import { hrefFor, locationFor, parseStudioLocation, type UrlState } from './studioUrl'

const base: UrlState = { activeSandboxId: 'sb1', leftTab: 'items', openLessonId: null, viewingChallengeId: null }

describe('parseStudioLocation', () => {
  it('reads every studio route', () => {
    expect(parseStudioLocation('/')).toEqual({ kind: 'home' })
    expect(parseStudioLocation('/learn/badge')).toEqual({ kind: 'learn', lessonId: 'badge' })
    expect(parseStudioLocation('/challenges/center-the-card')).toEqual({
      kind: 'challenge',
      challengeId: 'center-the-card',
    })
    expect(parseStudioLocation('/play/sb1', { tab: 'docs' })).toEqual({ kind: 'play', sandboxId: 'sb1', tab: 'docs' })
  })

  it('defaults a missing or unknown tab to items', () => {
    expect(parseStudioLocation('/play/sb1')).toEqual({ kind: 'play', sandboxId: 'sb1', tab: 'items' })
    expect(parseStudioLocation('/play/sb1', { tab: 'nope' })).toEqual({ kind: 'play', sandboxId: 'sb1', tab: 'items' })
    expect(parseStudioLocation('/play/sb1', { tab: 3 })).toEqual({ kind: 'play', sandboxId: 'sb1', tab: 'items' })
  })

  it('returns null for paths that are not studio routes', () => {
    expect(parseStudioLocation('/design/f1')).toBeNull()
    expect(parseStudioLocation('/learn')).toBeNull()
    expect(parseStudioLocation('/learn/a/b')).toBeNull()
  })

  it('decodes path parts, and keeps malformed ones as they are', () => {
    expect(parseStudioLocation('/learn/a%20b')).toEqual({ kind: 'learn', lessonId: 'a b' })
    expect(parseStudioLocation('/learn/%E0%A4')).toEqual({ kind: 'learn', lessonId: '%E0%A4' })
  })
})

describe('hrefFor', () => {
  it('omits the default tab and encodes ids', () => {
    expect(hrefFor({ kind: 'play', sandboxId: 'sb1', tab: 'items' })).toBe('/play/sb1')
    expect(hrefFor({ kind: 'play', sandboxId: 'sb1', tab: 'challenges' })).toBe('/play/sb1?tab=challenges')
    expect(hrefFor({ kind: 'learn', lessonId: 'a b' })).toBe('/learn/a%20b')
  })

  it('round-trips with parseStudioLocation', () => {
    for (const href of ['/', '/learn/badge', '/challenges/center-the-card', '/play/sb1', '/play/sb1?tab=docs']) {
      const [pathname = '', query] = href.split('?')
      const search = Object.fromEntries(new URLSearchParams(query))
      const parsed = parseStudioLocation(pathname, search)
      expect(parsed && hrefFor(parsed)).toBe(href)
    }
  })
})

describe('locationFor', () => {
  it('shows the sandbox and left tab by default', () => {
    expect(hrefFor(locationFor(base))).toBe('/play/sb1')
    expect(hrefFor(locationFor({ ...base, leftTab: 'docs' }))).toBe('/play/sb1?tab=docs')
  })

  it('shows an open lesson only while the Examples tab is active', () => {
    const state = { ...base, openLessonId: 'badge' }
    expect(hrefFor(locationFor({ ...state, leftTab: 'examples' }))).toBe('/learn/badge')
    expect(hrefFor(locationFor(state))).toBe('/play/sb1')
  })

  it('shows a viewed challenge only while the Challenges tab is active', () => {
    const state = { ...base, viewingChallengeId: 'center-the-card' }
    expect(hrefFor(locationFor({ ...state, leftTab: 'challenges' }))).toBe('/challenges/center-the-card')
    expect(hrefFor(locationFor({ ...state, leftTab: 'docs' }))).toBe('/play/sb1?tab=docs')
  })
})
