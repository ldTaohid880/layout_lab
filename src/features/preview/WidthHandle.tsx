import { useRef } from 'react'
import { MAX_PREVIEW_WIDTH, MIN_PREVIEW_WIDTH } from './usePreviewSize'
import { setDragging } from '@/lib/dragging'
import { cn } from '@/lib/utils'

interface WidthHandleProps {
  width: number
  scale: number
  onChange: (width: number) => void
  side: 'left' | 'right'
}

const clamp = (n: number) => Math.round(Math.min(Math.max(n, MIN_PREVIEW_WIDTH), MAX_PREVIEW_WIDTH))

/**
 * Drag handle on the frame edge. The frame is centred, so dragging one edge by dx changes the
 * width by 2 * dx. Arrow keys nudge by 10px (Shift: 50px).
 */
export function WidthHandle({ width, scale, onChange, side }: WidthHandleProps) {
  const start = useRef<{ x: number; width: number; scale: number } | null>(null)
  const sign = side === 'right' ? 1 : -1

  return (
    // A focusable separator is the ARIA window-splitter widget (arrow keys resize); jsx-a11y treats every
    // separator as non-interactive.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Preview width"
      aria-valuemin={MIN_PREVIEW_WIDTH}
      aria-valuemax={MAX_PREVIEW_WIDTH}
      aria-valuenow={Math.round(width)}
      aria-valuetext={`${Math.round(width)} pixels`}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the splitter must be focusable for arrow keys
      tabIndex={0}
      className={cn(
        'group absolute top-0 z-10 flex h-full w-3 cursor-ew-resize touch-none items-center justify-center',
        side === 'right' ? '-right-3' : '-left-3',
      )}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        start.current = { x: e.clientX, width, scale }
        setDragging(true)
      }}
      onPointerMove={(e) => {
        if (!start.current) return
        const dx = ((e.clientX - start.current.x) * sign * 2) / start.current.scale
        onChange(clamp(start.current.width + dx))
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId)
        start.current = null
        setDragging(false)
      }}
      onPointerCancel={() => {
        start.current = null
        setDragging(false)
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 50 : 10
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          const dir = (e.key === 'ArrowRight' ? 1 : -1) * sign
          onChange(clamp(width + dir * step))
        }
      }}
    >
      <span className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary group-active:bg-primary" />
    </div>
  )
}
