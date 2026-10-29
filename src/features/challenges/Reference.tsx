import { Expand } from 'lucide-react'
import { useRef, useState } from 'react'
import { referenceFile, referenceKey } from '@/content/references'
import type { Challenge } from '@/content/types'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/** Public URL of a reference picture. The hash is a cache-buster so a regenerated picture is never stale. */
export function referenceUrl(challenge: Challenge, width: number): string {
  return `${import.meta.env.BASE_URL}references/${referenceFile(challenge.id, width)}?v=${referenceKey(challenge, width)}`
}

/** Small picture for list rows: the widest layout, decorative (the row text already names it). */
export function ReferenceThumb({ challenge, className }: { challenge: Challenge; className?: string }) {
  const width = challenge.viewports[0] ?? 800
  return (
    <img
      src={referenceUrl(challenge, width)}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn('h-14 w-20 shrink-0 rounded border bg-white object-cover object-top', className)}
    />
  )
}

/** The target layout as a picture per checked width; click one to see it full size. */
export function ReferenceGallery({ challenge }: { challenge: Challenge }) {
  const widths = challenge.viewports
  const [opened, setOpened] = useState<number | null>(null)
  // The thumbnail that opened the dialog, so closing it puts focus back there.
  const opener = useRef<HTMLElement | null>(null)

  return (
    <section aria-labelledby="reference-heading" data-testid="reference">
      <h3
        id="reference-heading"
        className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Reference
      </h3>
      <div className="flex flex-wrap items-start gap-2">
        {widths.map((width) => (
          <button
            key={width}
            type="button"
            onClick={(e) => {
              opener.current = e.currentTarget
              setOpened(width)
            }}
            aria-label={`Open the ${width}px reference full size`}
            className="group relative overflow-hidden rounded-md border bg-white text-left"
            style={{ width: width > 500 ? '100%' : '45%' }}
          >
            <img
              src={referenceUrl(challenge, width)}
              alt={`Target layout at ${width}px`}
              className="block max-h-44 w-full object-cover object-top"
            />
            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-2xs text-white">
              {width}px
            </span>
            <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Expand className="size-3" />
            </span>
          </button>
        ))}
      </div>

      <Dialog
        open={opened !== null}
        onOpenChange={(open) => !open && setOpened(null)}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          opener.current?.focus()
        }}
        title={`${challenge.title}: target layout`}
        description="What your result should look like at each checked width."
      >
        {widths.length > 1 && (
          <div role="radiogroup" aria-label="Viewport width" className="mb-3 flex gap-1">
            {widths.map((width) => (
              <button
                key={width}
                type="button"
                role="radio"
                aria-checked={opened === width}
                onClick={() => setOpened(width)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 font-mono text-2xs text-muted-foreground hover:text-foreground',
                  opened === width && 'border-primary bg-primary/10 text-primary hover:text-primary',
                )}
              >
                {width}px
              </button>
            ))}
          </div>
        )}
        {opened !== null && (
          <img
            src={referenceUrl(challenge, opened)}
            alt={`Target layout at ${opened}px, full size`}
            data-testid="reference-full"
            className="mx-auto block max-w-full rounded border bg-white"
          />
        )}
      </Dialog>
    </section>
  )
}
