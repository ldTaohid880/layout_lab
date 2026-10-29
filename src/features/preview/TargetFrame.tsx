import { useMemo } from 'react'
import { FRAME_RUNTIME } from './frameRuntime'
import { buildSrcDoc } from './generateHtml'
import { instantiate } from '@/content/instantiate'
import type { Challenge } from '@/content/types'
import { cn } from '@/lib/utils'
import { useStudio, type CompareMode } from '@/store/studioStore'
import type { PreviewBackground } from '@/types/sandbox'

const MODES: { value: CompareMode; label: string; hint: string }[] = [
  { value: 'yours', label: 'Yours', hint: 'Your layout' },
  { value: 'target', label: 'Target', hint: 'The goal' },
  { value: 'overlay', label: 'Overlay', hint: 'The goal, see-through, over yours' },
  { value: 'diff', label: 'Diff', hint: 'Difference blend: matching pixels turn black' },
]

/** The Yours / Target / Overlay / Diff switch, shown in challenge sandboxes. */
export function ChallengeBar() {
  const compare = useStudio((s) => s.compare)
  const setCompare = useStudio((s) => s.setCompare)

  return (
    <div className="no-scrollbar flex h-8 shrink-0 items-center justify-between gap-2 overflow-x-auto border-b bg-background px-3 text-2xs">
      <span className="shrink-0 font-medium text-muted-foreground">Compare with target</span>
      <div role="radiogroup" aria-label="Compare with target" className="flex items-center rounded-md border p-0.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={compare === m.value}
            title={m.hint}
            onClick={() => setCompare(m.value)}
            className={cn(
              'h-5 rounded px-1.5 text-muted-foreground hover:text-foreground',
              compare === m.value && 'bg-secondary text-foreground',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface TargetFrameProps {
  challenge: Challenge
  bg: PreviewBackground
  width: number
  height: number
  scale: number
}

/** The challenge's solution rendered in the same viewport as the learner's preview, on top of it. */
export function TargetFrame({ challenge, bg, width, height, scale }: TargetFrameProps) {
  const compare = useStudio((s) => s.compare)
  const srcDoc = useMemo(
    () => buildSrcDoc({ items: instantiate(challenge.items), css: challenge.solution, bg, runtime: FRAME_RUNTIME }),
    [challenge, bg],
  )

  return (
    <iframe
      title="Target"
      data-testid="target-frame"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      tabIndex={-1}
      aria-hidden={compare === 'yours'}
      className="pointer-events-none absolute left-0 top-0 block border-0"
      style={{
        width,
        height,
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: 'top left',
        opacity: compare === 'yours' ? 0 : compare === 'overlay' ? 0.5 : 1,
        mixBlendMode: compare === 'diff' ? 'difference' : undefined,
      }}
    />
  )
}
