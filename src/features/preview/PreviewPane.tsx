import { Box, Crosshair, LayoutGrid, SquareDashed } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { PreviewFrame } from './PreviewFrame'
import { ChallengeBar, TargetFrame } from './TargetFrame'
import { computeFrameLayout } from './usePreviewSize'
import { WidthHandle } from './WidthHandle'
import { Select } from '@/components/ui/select'
import { useChallengesIfLoaded } from '@/content/challenges'
import { Hint } from '@/components/ui/tooltip'
import { useElementSize } from '@/lib/useElementSize'
import { cn } from '@/lib/utils'
import { PREVIEW_WIDTH_PRESETS } from '@/store/defaults'
import { useActiveSandbox, useStudio } from '@/store/studioStore'
import type { OverlayToggles, PreviewBackground } from '@/types/sandbox'

const BG_OPTIONS: { value: PreviewBackground; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'dark', label: 'Dark' },
  { value: 'checker', label: 'Checker' },
]

export function PreviewPane() {
  const sandbox = useActiveSandbox()
  const previewWidth = useStudio((s) => s.ui.previewWidth)
  const previewBg = useStudio((s) => s.ui.previewBg)
  const setUi = useStudio((s) => s.setUi)
  // Challenge content loads on demand; until then a challenge sandbox previews like any other.
  const challenges = useChallengesIfLoaded(Boolean(sandbox.challengeId))
  const challenge = sandbox.challengeId ? challenges?.CHALLENGES_BY_ID.get(sandbox.challengeId) : undefined

  const stageRef = useRef<HTMLDivElement>(null)
  const stage = useElementSize(stageRef)
  // Leave room for the side handles when a fixed width is chosen.
  const gutter = previewWidth === null ? 0 : 32
  const layout = computeFrameLayout(previewWidth, { width: stage.width - gutter, height: stage.height })

  return (
    <section aria-label="Preview" className="flex h-full min-h-0 flex-col">
      <div className="pane-header no-scrollbar justify-between gap-3 overflow-x-auto normal-case tracking-normal">
        <div className="flex items-center gap-2">
          <span className="hidden text-2xs font-medium uppercase tracking-wider xl:inline">Preview</span>
          <OverlayToolbar />
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Preview width presets"
            className="flex items-center rounded-md border bg-background p-0.5"
          >
            <PresetButton active={previewWidth === null} onClick={() => setUi({ previewWidth: null })}>
              Fit
            </PresetButton>
            {PREVIEW_WIDTH_PRESETS.map((w) => (
              <PresetButton key={w} active={previewWidth === w} onClick={() => setUi({ previewWidth: w })}>
                {w}
              </PresetButton>
            ))}
          </div>
          <label className="sr-only" htmlFor="preview-bg">
            Preview background
          </label>
          <Select
            id="preview-bg"
            className="w-[5.5rem]"
            value={previewBg}
            onValueChange={(bg: PreviewBackground) => setUi({ previewBg: bg })}
            options={BG_OPTIONS}
          />
        </div>
      </div>

      {challenge && <ChallengeBar />}

      <div className="relative min-h-0 flex-1 bg-surface">
        <div ref={stageRef} className="absolute inset-0">
          {stage.width > 0 && (
            <div className="flex h-full justify-center">
              <div
                className={cn('relative h-full', previewWidth !== null && 'shadow-[0_0_0_1px_hsl(var(--border))]')}
                style={{ width: layout.width * layout.scale }}
              >
                {previewWidth !== null && (
                  <WidthHandle
                    side="left"
                    width={layout.width}
                    scale={layout.scale}
                    onChange={(w) => setUi({ previewWidth: w })}
                  />
                )}
                <div className="relative h-full overflow-hidden">
                  <PreviewFrame
                    items={sandbox.items}
                    css={sandbox.css}
                    bg={previewBg}
                    width={layout.width}
                    height={layout.height}
                    scale={layout.scale}
                  />
                  {challenge && (
                    <TargetFrame
                      challenge={challenge}
                      bg={previewBg}
                      width={layout.width}
                      height={layout.height}
                      scale={layout.scale}
                    />
                  )}
                </div>
                {previewWidth !== null && (
                  <WidthHandle
                    side="right"
                    width={layout.width}
                    scale={layout.scale}
                    onChange={(w) => setUi({ previewWidth: w })}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-6 shrink-0 items-center justify-between border-t bg-surface px-3 font-mono text-2xs text-muted-foreground">
        <span data-testid="preview-width">
          {Math.round(layout.width)} × {Math.round(layout.height)}
        </span>
        <span>{layout.scale < 1 ? `scaled ${Math.round(layout.scale * 100)}%` : '100%'}</span>
      </div>
    </section>
  )
}

function OverlayToolbar() {
  const inspect = useStudio((s) => s.inspect)
  const overlays = useStudio((s) => s.ui.overlays)
  const setInspect = useStudio((s) => s.setInspect)
  const setUi = useStudio((s) => s.setUi)
  const toggle = (key: keyof OverlayToggles) => setUi({ overlays: { ...overlays, [key]: !overlays[key] } })

  // Escape leaves inspect mode from anywhere in the app (the frame handles it when it has focus).
  useEffect(() => {
    if (!inspect) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspect(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inspect, setInspect])

  return (
    <div role="toolbar" aria-label="Inspection" className="flex items-center gap-0.5">
      <IconToggle
        label={inspect ? 'Stop picking (Esc)' : 'Pick an element in the preview'}
        name="Inspect"
        pressed={inspect}
        onClick={() => setInspect(!inspect)}
      >
        <Crosshair />
      </IconToggle>
      <span aria-hidden className="mx-1 h-4 w-px bg-border" />
      <IconToggle
        label="Box model of the selected element"
        name="Box model"
        pressed={overlays.box}
        onClick={() => toggle('box')}
      >
        <Box />
      </IconToggle>
      <IconToggle
        label="Grid lines or flex items of the selected container"
        name="Flex and grid overlay"
        pressed={overlays.layout}
        onClick={() => toggle('layout')}
      >
        <LayoutGrid />
      </IconToggle>
      <IconToggle
        label="Outline every element"
        name="Outlines"
        pressed={overlays.outlines}
        onClick={() => toggle('outlines')}
      >
        <SquareDashed />
      </IconToggle>
    </div>
  )
}

function IconToggle({
  label,
  name,
  pressed,
  onClick,
  children,
}: {
  label: string
  name: string
  pressed: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Hint label={label}>
      <button
        type="button"
        aria-label={name}
        aria-pressed={pressed}
        onClick={onClick}
        className={cn(
          'flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5',
          pressed && 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary',
        )}
      >
        {children}
      </button>
    </Hint>
  )
}

function PresetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-6 rounded px-1.5 font-mono text-2xs text-muted-foreground transition-colors hover:text-foreground',
        active && 'bg-primary text-primary-foreground hover:text-primary-foreground',
      )}
    >
      {children}
    </button>
  )
}
