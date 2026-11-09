import { BookOpen, ListTree, Shapes, Trophy } from 'lucide-react'
import { Fragment, Suspense, lazy, useRef, type ReactNode } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { PanelFallback } from './PanelFallback'
import { ResizeHandle } from './ResizeHandle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Hint } from '@/components/ui/tooltip'
import { ItemInspector } from '@/features/tree/ItemInspector'
import { TreePanel } from '@/features/tree/TreePanel'
import { useElementSize } from '@/lib/useElementSize'
import { useStudio } from '@/store/studioStore'
import type { LeftTab } from '@/types/sandbox'

// Loaded on first use (LL-013): each panel and its content is a separate chunk.
const ExamplesPanel = lazy(() =>
  import('@/features/examples/ExamplesPanel').then((m) => ({ default: m.ExamplesPanel })),
)
const DocsPanel = lazy(() => import('@/features/docs/DocsPanel').then((m) => ({ default: m.DocsPanel })))
const ChallengesPanel = lazy(() =>
  import('@/features/challenges/ChallengesPanel').then((m) => ({ default: m.ChallengesPanel })),
)

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PanelFallback />}>{children}</Suspense>
}

const TABS: { value: LeftTab; label: string; Icon: typeof ListTree }[] = [
  { value: 'items', label: 'Items', Icon: ListTree },
  { value: 'examples', label: 'Examples', Icon: Shapes },
  { value: 'docs', label: 'Docs', Icon: BookOpen },
  { value: 'challenges', label: 'Challenges', Icon: Trophy },
]

/*
 * Content widths (px) below which the tab labels stop fitting. Measured: all four labels need
 * 243, icons plus the widest active label 175; the thresholds add headroom. Narrower than that,
 * icons only (with tooltips).
 */
const ALL_LABELS_MIN = 260
const ACTIVE_LABEL_MIN = 190

export function LeftPane() {
  const tab = useStudio((s) => s.ui.leftTab)
  const setUi = useStudio((s) => s.setUi)
  const listRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(listRef)
  const mode = width === 0 || width >= ALL_LABELS_MIN ? 'labels' : width >= ACTIVE_LABEL_MIN ? 'active' : 'icons'

  return (
    <Tabs value={tab} onValueChange={(v) => setUi({ leftTab: v as LeftTab })} className="flex h-full min-h-0 flex-col">
      <TabsList ref={listRef} aria-label="Left panel" data-mode={mode}>
        {TABS.map(({ value, label, Icon }) => {
          const showLabel = mode === 'labels' || (mode === 'active' && value === tab)
          const trigger = (
            <TabsTrigger value={value} aria-label={showLabel ? undefined : label} className="flex items-center gap-1.5">
              {mode !== 'labels' && <Icon aria-hidden className="size-3.5 shrink-0" />}
              {showLabel && <span>{label}</span>}
            </TabsTrigger>
          )
          return showLabel ? (
            <Fragment key={value}>{trigger}</Fragment>
          ) : (
            <Hint key={value} label={label}>
              {trigger}
            </Hint>
          )
        })}
      </TabsList>
      <TabsContent value="items" className="flex flex-col">
        <PanelGroup direction="vertical" autoSaveId="layout-lab:left">
          <Panel defaultSize={62} minSize={25}>
            <TreePanel />
          </Panel>
          <ResizeHandle direction="vertical" />
          <Panel defaultSize={38} minSize={15}>
            <ItemInspector />
          </Panel>
        </PanelGroup>
      </TabsContent>
      <TabsContent value="examples">
        <Lazy>
          <ExamplesPanel />
        </Lazy>
      </TabsContent>
      <TabsContent value="docs">
        <Lazy>
          <DocsPanel />
        </Lazy>
      </TabsContent>
      <TabsContent value="challenges">
        <Lazy>
          <ChallengesPanel />
        </Lazy>
      </TabsContent>
    </Tabs>
  )
}
