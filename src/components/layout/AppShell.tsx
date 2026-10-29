import { Code2, Eye, ListTree } from 'lucide-react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { LeftPane } from './LeftPane'
import { ResizeHandle } from './ResizeHandle'
import { TopBar } from './TopBar'
import { ApplyToast } from '@/features/examples/ApplyToast'
import { CssEditor } from '@/features/editor/CssEditor'
import { PreviewPane } from '@/features/preview/PreviewPane'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/utils'
import { useStudio } from '@/store/studioStore'
import type { MobileView } from '@/types/sandbox'

function EditorPane() {
  return (
    <section aria-label="CSS" className="flex h-full min-h-0 flex-col">
      <div className="pane-header">
        <span>styles.css</span>
      </div>
      <div className="min-h-0 flex-1">
        <CssEditor />
      </div>
    </section>
  )
}

export function AppShell() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main className="min-h-0 flex-1">{isDesktop ? <DesktopLayout /> : <MobileLayout />}</main>
      <ApplyToast />
    </div>
  )
}

function DesktopLayout() {
  return (
    <PanelGroup direction="horizontal" autoSaveId="layout-lab:main">
      <Panel defaultSize={24} minSize={16} className="bg-background">
        <LeftPane />
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={34} minSize={20}>
        <EditorPane />
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={42} minSize={20}>
        <PreviewPane />
      </Panel>
    </PanelGroup>
  )
}

const MOBILE_TABS: { view: MobileView; label: string; Icon: typeof Eye }[] = [
  { view: 'tree', label: 'Items', Icon: ListTree },
  { view: 'editor', label: 'CSS', Icon: Code2 },
  { view: 'preview', label: 'Preview', Icon: Eye },
]

function MobileLayout() {
  const view = useStudio((s) => s.ui.mobileView)
  const setUi = useStudio((s) => s.setUi)

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1" id="mobile-view" role="tabpanel" aria-label={view}>
        {view === 'tree' && <LeftPane />}
        {view === 'editor' && <EditorPane />}
        {view === 'preview' && <PreviewPane />}
      </div>
      <nav
        aria-label="Views"
        className="grid shrink-0 grid-cols-3 border-t bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        {MOBILE_TABS.map(({ view: v, label, Icon }) => (
          <button
            key={v}
            type="button"
            aria-current={view === v ? 'page' : undefined}
            onClick={() => setUi({ mobileView: v })}
            className={cn(
              'flex h-14 flex-col items-center justify-center gap-0.5 text-2xs font-medium text-muted-foreground',
              view === v && 'text-primary',
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
