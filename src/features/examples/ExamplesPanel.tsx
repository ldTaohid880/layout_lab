import { ChevronRight, FilePlus2, Play } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LevelBadge } from '@/components/ui/level-badge'
import { EXAMPLES } from '@/content/examples'
import type { Example, ExampleCategory } from '@/content/types'
import { cn } from '@/lib/utils'
import { useStudio } from '@/store/studioStore'

const CATEGORIES: ExampleCategory[] = ['Flexbox', 'Grid', 'Positioning', 'Sizing & overflow']

export function ExamplesPanel() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="h-full overflow-auto" data-testid="examples-panel">
      <p className="border-b px-3 py-2 text-2xs text-muted-foreground">
        Apply an example to load its elements and CSS, then experiment. Undo restores your sandbox.
      </p>
      {CATEGORIES.map((category) => (
        <section key={category} aria-labelledby={`examples-${category}`}>
          <h3
            id={`examples-${category}`}
            className="sticky top-0 z-[1] border-b bg-surface px-3 py-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {category}
          </h3>
          <ul>
            {EXAMPLES.filter((e) => e.category === category).map((example) => (
              <ExampleItem
                key={example.id}
                example={example}
                open={openId === example.id}
                onToggle={() => setOpenId(openId === example.id ? null : example.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ExampleItem({ example, open, onToggle }: { example: Example; open: boolean; onToggle: () => void }) {
  const applyExample = useStudio((s) => s.applyExample)
  const focusDoc = useStudio((s) => s.focusDoc)
  const bodyId = `example-${example.id}`

  return (
    <li className={cn('border-b', open && 'bg-muted/40')}>
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
            <span className="text-xs font-medium">{example.title}</span>
            <LevelBadge level={example.level} />
          </span>
          <span className="mt-0.5 block text-2xs text-muted-foreground">{example.summary}</span>
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
