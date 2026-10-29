import { Layers, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useStudio } from '@/store/studioStore'
import { flexAxes, gridAxes, type Dir } from '@/features/preview/frameRuntime'
import type { InspectInfo, Sides } from '@/types/preview'

const DIR_SYMBOL: Record<Dir, string> = { right: '→', left: '←', down: '↓', up: '↑' }
const DIR_TEXT: Record<Dir, string> = {
  right: 'left to right',
  left: 'right to left',
  down: 'top to bottom',
  up: 'bottom to top',
}

/** Which way each axis of a flex or grid container points, and the properties that work along it. */
function AxesRows({ rows }: { rows: { name: string; dir: Dir; property: string }[] }) {
  const shown = useStudio((s) => s.ui.overlays.axes)
  const setUi = useStudio((s) => s.setUi)
  const overlays = useStudio((s) => s.ui.overlays)
  const layoutOn = overlays.layout
  return (
    <div className="mt-2 border-t pt-2">
      <button
        type="button"
        role="switch"
        aria-checked={shown}
        aria-label="Show axes in preview"
        data-testid="axes-toggle"
        onClick={() => setUi({ overlays: { ...overlays, axes: !shown } })}
        className="mb-1.5 flex items-center gap-2 rounded-sm text-2xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className={cn(
            'flex h-3.5 w-6 items-center rounded-full p-0.5 transition-colors',
            shown ? 'bg-primary' : 'bg-border',
          )}
        >
          <span
            className={cn('size-2.5 rounded-full bg-background transition-transform', shown && 'translate-x-2.5')}
          />
        </span>
        Show axes in preview
        {shown && !layoutOn && <span>(turn on the Flex and grid overlay too)</span>}
      </button>
      <dl className="space-y-0.5" aria-label="Axes" data-testid="axes">
        {rows.map(({ name, dir, property }) => (
          <div key={name} className="flex items-baseline gap-2">
            <dt className="shrink-0 text-2xs text-muted-foreground">{name}</dt>
            <dd className="font-mono text-2xs">
              <span aria-hidden className="mr-1 font-sans">
                {DIR_SYMBOL[dir]}
              </span>
              {DIR_TEXT[dir]} <span className="text-muted-foreground">· {property}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** The browser's own measurements of the selected element, explained. */
export function LayoutReport({ nodeId }: { nodeId: string }) {
  const info = useStudio((s) => s.inspectInfo)

  if (!info || info.id !== nodeId) {
    return <Note>Measuring… The preview has to be visible to measure the element.</Note>
  }
  if (!info.rendered) {
    return (
      <Note>
        Not rendered: <code className="font-mono">{info.label}</code> has no box (display: {info.display}). It takes up
        no space and nothing can be measured.
      </Note>
    )
  }

  return (
    <div className="space-y-4 p-3 text-xs" data-testid="layout-report">
      <BoxModel info={info} />

      <Section title="Box">
        <Facts
          rows={[
            ['display', info.display],
            ['position', info.position],
            ['box-sizing', info.boxSizing],
            ['z-index', info.zIndex],
          ]}
        />
      </Section>

      {info.container?.kind === 'flex' && (
        <Section title={`Flex container · ${info.container.itemCount} items`}>
          <Facts
            rows={[
              ['flex-direction', info.container.direction],
              ['flex-wrap', info.container.wrap],
              ['justify-content', info.container.justifyContent],
              ['align-items', info.container.alignItems],
              ['gap', gapText(info.container.rowGap, info.container.columnGap)],
            ]}
          />
          <AxesRows
            rows={(() => {
              const axes = flexAxes(info.container.direction, info.container.wrap, info.container.rtl)
              return [
                { name: 'Main axis', dir: axes.main, property: 'justify-content' },
                { name: 'Cross axis', dir: axes.cross, property: 'align-items' },
              ]
            })()}
          />
        </Section>
      )}

      {info.container?.kind === 'grid' && (
        <Section title={`Grid container · ${info.container.columns.length} × ${info.container.rows.length}`}>
          <Facts
            rows={[
              ['columns', tracksText(info.container.columns)],
              ['rows', tracksText(info.container.rows)],
              ['gap', gapText(info.container.rowGap, info.container.columnGap)],
              ['auto-flow', info.container.autoFlow],
              ['justify-content', info.container.justifyContent],
              ['align-items', info.container.alignItems],
            ]}
          />
          <AxesRows
            rows={(() => {
              const axes = gridAxes(info.container.rtl)
              return [
                { name: 'Inline axis', dir: axes.inline, property: 'justify-items, justify-content' },
                { name: 'Block axis', dir: axes.block, property: 'align-items, align-content' },
              ]
            })()}
          />
          {info.container.areas.length > 0 && (
            <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-2 py-1.5 font-mono text-2xs leading-relaxed">
              {info.container.areas.map((row) => `"${row}"`).join('\n')}
            </pre>
          )}
          <p className="mt-1.5 text-2xs text-muted-foreground">Track sizes are the resolved pixels the browser used.</p>
        </Section>
      )}

      {info.item?.kind === 'flex' && (
        <Section title="As a flex item">
          <Facts
            rows={[
              ['flex', `${info.item.grow} ${info.item.shrink} ${info.item.basis}`],
              ['main size', `${info.item.mainSize}px`],
              ['align-self', info.item.alignSelf],
              ['order', info.item.order],
            ]}
          />
          <p className="mt-1.5 text-2xs text-muted-foreground">
            {flexExplanation(info.item.grow, info.item.shrink, info.item.basis)}
          </p>
        </Section>
      )}

      {info.item?.kind === 'grid' && (
        <Section title="As a grid item">
          <Facts
            rows={[
              ['grid-column', info.item.column],
              ['grid-row', info.item.row],
              ...(info.item.area ? ([['grid-area', info.item.area]] as [string, string][]) : []),
            ]}
          />
          <p className="mt-1.5 text-2xs text-muted-foreground">Line numbers where the browser placed it.</p>
        </Section>
      )}

      {info.containingBlock && (
        <Section title="Positioned against">
          <p>
            Offsets (top, left…) are measured from{' '}
            <ElementLink id={info.containingBlock.id} label={info.containingBlock.label} />.
          </p>
        </Section>
      )}

      <Section title="Stacking">
        {info.stacking.reasons.length > 0 ? (
          <div className="mb-1.5">
            <p className="flex items-center gap-1.5 font-medium">
              <Layers className="size-3.5 text-primary" /> Creates a stacking context because of:
            </p>
            <ul className="mt-1 list-disc pl-5 font-mono text-2xs">
              {info.stacking.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-1 text-2xs text-muted-foreground">
              Its children's z-index values only compete with each other, inside it.
            </p>
          </div>
        ) : null}
        <p>
          Paints inside the stacking context of{' '}
          <ElementLink id={info.stacking.contextId} label={info.stacking.contextLabel} />.
        </p>
      </Section>

      {(info.overflow.x > 0 || info.overflow.y > 0) && (
        <p className="flex gap-1.5 rounded-md border border-primary/30 bg-primary/5 p-2">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            Content overflows this box by{' '}
            {[
              info.overflow.x > 0 && `${Math.round(info.overflow.x)}px horizontally`,
              info.overflow.y > 0 && `${Math.round(info.overflow.y)}px vertically`,
            ]
              .filter(Boolean)
              .join(' and ')}
            . Let it wrap, allow it to shrink (min-width: 0 on flex/grid items), or set overflow.
          </span>
        </p>
      )}
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="p-3 text-xs text-muted-foreground">{children}</p>
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-mono text-2xs text-muted-foreground">{k}</dt>
          <dd className="break-words font-mono text-2xs">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function ElementLink({ id, label }: { id: string | null; label: string }) {
  const revealItem = useStudio((s) => s.revealItem)
  if (!id) return <span className="font-mono">{label}</span>
  return (
    <button
      type="button"
      onClick={() => revealItem(id)}
      className="font-mono text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
    >
      {label}
    </button>
  )
}

const gapText = (row: string, column: string) =>
  row === column
    ? row === 'normal'
      ? '0'
      : row
    : `${row === 'normal' ? '0' : row} / ${column === 'normal' ? '0' : column}`

const tracksText = (tracks: number[]) => (tracks.length ? tracks.map((t) => `${t}px`).join(' ') : 'none')

function flexExplanation(grow: string, shrink: string, basis: string): string {
  const start = basis === 'auto' ? 'its width (or content size)' : basis === '0%' || basis === '0px' ? 'zero' : basis
  const g = parseFloat(grow) > 0 ? `grows with weight ${grow} into free space` : 'does not grow'
  const s = parseFloat(shrink) > 0 ? `shrinks (weight ${shrink}) when space runs out` : 'never shrinks'
  return `Starts from ${start}, ${g}, and ${s}.`
}

// ---- Box model diagram -------------------------------------------------------------------------

const LAYERS = [
  { name: 'margin', className: 'bg-[#f6a452]/25 border-[#f6a452]/60' },
  { name: 'border', className: 'bg-[#fad66b]/30 border-[#e0b43c]/70' },
  { name: 'padding', className: 'bg-[#84c46e]/25 border-[#84c46e]/70' },
] as const

function BoxModel({ info }: { info: InspectInfo }) {
  const sides: Record<(typeof LAYERS)[number]['name'], Sides> = {
    margin: info.margin,
    border: info.border,
    padding: info.padding,
  }
  const contentW = info.width - info.border[1] - info.border[3] - info.padding[1] - info.padding[3]
  const contentH = info.height - info.border[0] - info.border[2] - info.padding[0] - info.padding[2]

  const content = (
    <div
      className="whitespace-nowrap rounded-sm border border-[#60a0e6]/70 bg-[#60a0e6]/25 px-0.5 py-1.5 text-center font-mono text-2xs"
      data-testid="box-content"
    >
      {fmt(contentW)} × {fmt(contentH)}
    </div>
  )

  const diagram = LAYERS.reduceRight<ReactNode>(
    (inner, layer) => (
      <Ring name={layer.name} values={sides[layer.name]} className={layer.className}>
        {inner}
      </Ring>
    ),
    content,
  )

  return (
    <figure aria-label={`Box model of ${info.label}`}>
      {diagram}
      <figcaption className="mt-1 text-center font-mono text-2xs text-muted-foreground">
        {info.label} · border box {fmt(info.width)} × {fmt(info.height)}
      </figcaption>
    </figure>
  )
}

function Ring({
  name,
  values,
  className,
  children,
}: {
  name: string
  values: Sides
  className: string
  children: ReactNode
}) {
  const [t, r, b, l] = values
  return (
    <div className={cn('rounded-sm border border-dashed min-w-0 px-0.5 pb-0.5 font-mono text-2xs', className)}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <span className="text-left text-muted-foreground">{name}</span>
        <span aria-label={`${name} top`}>{side(t)}</span>
        <span />
      </div>
      <div className="flex items-center gap-0.5">
        <span className="w-5 shrink-0 text-center" aria-label={`${name} left`}>
          {side(l)}
        </span>
        <div className="min-w-0 flex-1">{children}</div>
        <span className="w-5 shrink-0 text-center" aria-label={`${name} right`}>
          {side(r)}
        </span>
      </div>
      <div className="text-center" aria-label={`${name} bottom`}>
        {side(b)}
      </div>
    </div>
  )
}

const fmt = (n: number) => String(Math.round(n * 10) / 10)
const side = (n: number) => (n === 0 ? '–' : fmt(n))
