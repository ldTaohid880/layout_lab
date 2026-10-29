import { PanelResizeHandle } from 'react-resizable-panels'
import { setDragging } from '@/lib/dragging'
import { cn } from '@/lib/utils'

export function ResizeHandle({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) {
  const horizontal = direction === 'horizontal'
  return (
    <PanelResizeHandle
      onDragging={setDragging}
      className={cn(
        'group relative flex shrink-0 items-center justify-center bg-border outline-none',
        horizontal ? 'w-px' : 'h-px',
        'data-[resize-handle-state=drag]:bg-primary data-[resize-handle-state=hover]:bg-primary/60 focus-visible:bg-primary',
      )}
    >
      {/* Wider invisible hit area */}
      <span className={cn('absolute z-10', horizontal ? 'inset-y-0 -left-1 -right-1' : 'inset-x-0 -bottom-1 -top-1')} />
    </PanelResizeHandle>
  )
}
