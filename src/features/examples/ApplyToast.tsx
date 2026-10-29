import { Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStudio } from '@/store/studioStore'

/** Shown after an example is applied; stays until undone, dismissed, or the sandbox changes. */
export function ApplyToast() {
  const last = useStudio((s) => s.lastApply)
  const undoApply = useStudio((s) => s.undoApply)
  const dismissApply = useStudio((s) => s.dismissApply)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6"
    >
      {last && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border bg-popover py-1.5 pl-3 pr-1.5 text-xs shadow-lg animate-in fade-in-0 slide-in-from-bottom-2">
          <span>
            {last.kind === 'current' ? 'Applied' : 'Opened'} <span className="font-medium">“{last.title}”</span>
            {last.kind === 'new' && ' in a new sandbox'}
          </span>
          <Button size="sm" variant="secondary" onClick={undoApply}>
            <Undo2 />
            Undo
          </Button>
          <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={dismissApply}>
            <X />
          </Button>
        </div>
      )}
    </div>
  )
}
