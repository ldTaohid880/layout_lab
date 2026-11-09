import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  useLocation,
  useRouter,
} from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CHALLENGE_ORDER } from '@/content/challenges/order'
import { EXAMPLE_PATH } from '@/content/examples/path'
import { hrefFor, isLeftTab, locationFor, parseStudioLocation, type StudioLocation } from '@/lib/studioUrl'
import { useResolvedTheme } from '@/lib/useResolvedTheme'
import { useStudio, type StudioState } from '@/store/studioStore'

/*
 * Routes (ADR-012). The studio routes share one layout route, so moving between them never remounts the
 * editor or the preview; the URL and the studio state are kept in step by useStudioUrlSync.
 */

// Ids come from the small, always-loaded order files; the content itself loads on demand (LL-013).
const LESSON_IDS: ReadonlySet<string> = new Set(EXAMPLE_PATH.flatMap((m) => m.examples))
const CHALLENGE_IDS: ReadonlySet<string> = new Set(CHALLENGE_ORDER)

function RootLayout() {
  useResolvedTheme()
  return (
    <TooltipProvider delayDuration={400}>
      <Outlet />
    </TooltipProvider>
  )
}

function StudioLayout() {
  useStudioUrlSync()
  return <AppShell />
}

const rootRoute = createRootRoute({ component: RootLayout, notFoundComponent: NotFound })

const studioRoute = createRoute({ getParentRoute: () => rootRoute, id: 'studio', component: StudioLayout })

const homeRoute = createRoute({ getParentRoute: () => studioRoute, path: '/' })
const learnRoute = createRoute({ getParentRoute: () => studioRoute, path: '/learn/$lessonId' })
const challengeRoute = createRoute({ getParentRoute: () => studioRoute, path: '/challenges/$challengeId' })
const playRoute = createRoute({
  getParentRoute: () => studioRoute,
  path: '/play/$sandboxId',
  validateSearch: (search: Record<string, unknown>): { tab?: string } =>
    isLeftTab(search.tab) && search.tab !== 'items' ? { tab: search.tab } : {},
})

const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/design/$fileId',
  component: () => (
    <Placeholder title="Design files are coming">The design canvas arrives in a later milestone (M4).</Placeholder>
  ),
})

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/s/$payload',
  component: () => (
    <Placeholder title="Share links are coming">
      Opening shared sandboxes from a link arrives soon (LL-209).
    </Placeholder>
  ),
})

const routeTree = rootRoute.addChildren([
  studioRoute.addChildren([homeRoute, learnRoute, challengeRoute, playRoute]),
  designRoute,
  shareRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function currentHref(state: StudioState): string {
  return hrefFor(
    locationFor({
      activeSandboxId: state.activeSandboxId,
      leftTab: state.ui.leftTab,
      openLessonId: state.openLessonId,
      viewingChallengeId: state.viewingChallengeId,
    }),
  )
}

/** True while applyLocation runs, so its intermediate states are not pushed back to the URL. */
let applying = false

/** Make the studio state match a location. Returns false if the location names something that does not exist. */
function applyLocation(location: StudioLocation): boolean {
  applying = true
  try {
    return applyLocationNow(location)
  } finally {
    applying = false
  }
}

function applyLocationNow(location: StudioLocation): boolean {
  const state = useStudio.getState()
  const showTab = (leftTab: StudioState['ui']['leftTab']) => {
    if (state.ui.leftTab !== leftTab || state.ui.mobileView !== 'tree') state.setUi({ leftTab, mobileView: 'tree' })
  }
  switch (location.kind) {
    case 'home':
      return false
    case 'learn':
      if (!LESSON_IDS.has(location.lessonId)) return false
      state.openLesson(location.lessonId)
      showTab('examples')
      return true
    case 'challenge':
      if (!CHALLENGE_IDS.has(location.challengeId)) return false
      state.viewChallenge(location.challengeId)
      showTab('challenges')
      return true
    case 'play':
      if (!state.sandboxes[location.sandboxId]) return false
      if (state.activeSandboxId !== location.sandboxId) state.switchSandbox(location.sandboxId)
      if (location.tab === 'examples') state.openLesson(null)
      if (location.tab === 'challenges') state.viewChallenge(null)
      if (state.ui.leftTab !== location.tab) state.setUi({ leftTab: location.tab })
      return true
  }
}

/**
 * Two-way sync between the URL and the studio state:
 * - URL to state: on load and on every navigation (links, back/forward), the state follows the URL. An unknown
 *   lesson, challenge or sandbox (or "/") is replaced by the URL of the current state.
 * - State to URL: a change made in the UI (tab, sandbox, opening a lesson or challenge) pushes a history entry,
 *   so back and forward step through it.
 */
function useStudioUrlSync() {
  const router = useRouter()
  const pathname = useLocation({ select: (l) => l.pathname })
  const search = useLocation({ select: (l) => l.search as Record<string, unknown> })
  const tab = typeof search.tab === 'string' ? search.tab : undefined

  // URL -> state. Declared first so it runs before the state -> URL effect after a navigation.
  useEffect(() => {
    const location = parseStudioLocation(pathname, { tab })
    if (!location || !applyLocation(location)) {
      void router.navigate({ href: currentHref(useStudio.getState()), replace: true })
    }
  }, [router, pathname, tab])

  // State -> URL. Reads the store and router directly, so it always compares the latest of both.
  useEffect(
    () =>
      useStudio.subscribe((state) => {
        if (applying) return
        const href = currentHref(state)
        const { pathname: path, search: query } = router.state.location
        const location = parseStudioLocation(path, query)
        if (location && hrefFor(location) !== href) void router.navigate({ href })
      }),
    [router],
  )
}

function Placeholder({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
      <Link to="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Back to the studio
      </Link>
    </main>
  )
}

function NotFound() {
  return <Placeholder title="Page not found">There is nothing at this address.</Placeholder>
}
