import { ChevronRight, FilePlus2, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LevelBadge } from '@/components/ui/level-badge'
import { ChipFilter, LevelFilter } from '@/components/ui/level-filter'
import { useExamples, type PathLesson } from '@/content/examples'
import { EXAMPLE_PATH } from '@/content/examples/path'
import { TRACKS, type Level, type Track } from '@/content/types'
import { cn } from '@/lib/utils'
import { useStudio } from '@/store/studioStore'

/**
 * The examples as a numbered learning path (see src/content/examples/path.ts), grouped into
 * tracks. The track and level filters hide rows and empty modules but never renumber, so "6.4"
 * always names the same example.
 */
/** Tracks that have at least one module, in path order. */
const PATH_TRACKS = TRACKS.filter((track) => EXAMPLE_PATH.some((m) => m.track === track))

export function ExamplesPanel() {
  const { EXAMPLE_MODULES } = useExamples()
  // In the store, not local state, so the URL (/learn/$lessonId) can show and restore it.
  const openId = useStudio((s) => s.openLessonId)
  const setOpenId = useStudio((s) => s.openLesson)
  const [filter, setFilter] = useState<Level | 'all'>('all')
  const [track, setTrack] = useState<Track | 'all'>('all')

  const visible = EXAMPLE_MODULES.filter((m) => track === 'all' || m.track === track)
    .map((module) => ({
      module,
      lessons: module.lessons.filter((l) => filter === 'all' || l.example.level === filter),
    }))
    .filter(({ lessons }) => lessons.length > 0)

  return (
    <div className="h-full overflow-auto" data-testid="examples-panel">
      <p className="border-b px-3 py-2 text-2xs text-muted-foreground">
        A path through CSS, from layout to type, colour and motion. Apply an example to load its elements and CSS, then
        experiment. Undo restores your sandbox.
      </p>
      {PATH_TRACKS.length > 1 && (
        <ChipFilter label="Filter by track" values={PATH_TRACKS} value={track} onChange={setTrack} />
      )}
      <LevelFilter value={filter} onChange={setFilter} />
      {visible.map(({ module, lessons }, i) => {
        const headingId = `examples-${module.id}`
        const firstOfTrack = track === 'all' && PATH_TRACKS.length > 1 && visible[i - 1]?.module.track !== module.track
        return (
          <section key={module.id} aria-labelledby={headingId} data-testid="example-module">
            {firstOfTrack && (
              <h2 className="border-b bg-muted/60 px-3 py-2 text-xs font-semibold" data-testid="example-track">
                {module.track}
              </h2>
            )}
            <h3
              id={headingId}
              className="sticky top-0 z-[1] border-b bg-surface px-3 py-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {module.number} · {module.title}
            </h3>
            <p className="border-b px-3 py-1.5 text-2xs text-muted-foreground">{module.blurb}</p>
            <ul>
              {lessons.map((lesson) => (
                <ExampleItem
                  key={lesson.example.id}
                  lesson={lesson}
                  open={openId === lesson.example.id}
                  onToggle={() => setOpenId(openId === lesson.example.id ? null : lesson.example.id)}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function ExampleItem({ lesson, open, onToggle }: { lesson: PathLesson; open: boolean; onToggle: () => void }) {
  const { example, number } = lesson
  const applyExample = useStudio((s) => s.applyExample)
  const focusDoc = useStudio((s) => s.focusDoc)
  const bodyId = `example-${example.id}`
  const itemRef = useRef<HTMLLIElement>(null)

  // An example opened from a link (/learn/$lessonId) may be far down the list.
  useEffect(() => {
    if (open) itemRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [open])

  return (
    <li ref={itemRef} className={cn('border-b', open && 'bg-muted/40')}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
        className="flex w-full items-start gap-1.5 px-3 py-2 text-left hover:bg-muted/60"
      >
        <ChevronRight
          className={cn('mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="w-7 shrink-0 font-mono text-2xs text-muted-foreground" data-testid="lesson-number">
              {number}
            </span>
            <span className="text-xs font-medium">{example.title}</span>
            <LevelBadge level={example.level} />
          </span>
          <span className="mt-0.5 block pl-9 text-2xs text-muted-foreground">{example.summary}</span>
        </span>
      </button>

      {open && (
        <div id={bodyId} className="space-y-3 px-3 pb-3 pl-8 text-xs">
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={() => applyExample(example, 'current')}>
              <Play />
              Apply here
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyExample(example, 'new')}>
              <FilePlus2 />
              Open in new sandbox
            </Button>
          </div>

          <div className="space-y-2 leading-relaxed text-foreground/90">
            {example.explanation.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <div>
            <h4 className="mb-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Try this</h4>
            <ul className="list-disc space-y-0.5 pl-4 text-foreground/90">
              {example.tryThis.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Properties</h4>
            <div className="flex flex-wrap gap-1">
              {example.concepts.map((property) => (
                <button
                  key={property}
                  type="button"
                  onClick={() => focusDoc(property)}
                  aria-label={`Open docs for ${property}`}
                  className="rounded border bg-background px-1.5 py-0.5 font-mono text-2xs text-primary hover:border-primary"
                >
                  {property}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </li>
  )
}
