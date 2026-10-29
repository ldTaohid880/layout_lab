import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, FileCode2, Pencil, Plus, RotateCcw, Trophy, X } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { RenameInput } from './RenameInput'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Hint } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useStudio } from '@/store/studioStore'
import type { Sandbox } from '@/types/sandbox'

/** A sandbox that was never edited can be closed without asking. */
const isEdited = (sandbox: Sandbox) => sandbox.updatedAt > sandbox.createdAt

/**
 * Sandboxes as browser-style tabs. Click to switch, double-click (or F2) to rename, drag to
 * reorder, middle-click or × to close. Closing deletes the sandbox, with a confirmation only
 * when it has been edited.
 */
export function SandboxTabs() {
  const order = useStudio((s) => s.sandboxOrder)
  const sandboxes = useStudio((s) => s.sandboxes)
  const activeId = useStudio((s) => s.activeSandboxId)
  const {
    switchSandbox,
    createSandbox,
    duplicateSandbox,
    deleteSandbox,
    renameSandbox,
    reorderSandboxes,
    resetSandbox,
  } = useStudio.getState()

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [resetId, setResetId] = useState<string | null>(null)
  const tabRefs = useRef(new Map<string, HTMLElement>())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const closing = closingId ? sandboxes[closingId] : undefined
  const resetting = resetId ? sandboxes[resetId] : undefined

  // Keep the active tab visible when there are more tabs than room.
  useEffect(() => {
    tabRefs.current.get(activeId)?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' })
  }, [activeId])

  /** Focus a tab that already exists, right now (arrow keys must not lag behind fast typing). */
  const focusNow = (id: string | undefined) => {
    if (id) tabRefs.current.get(id)?.focus()
  }

  /** Focus a tab that is about to be (re)rendered, after the DOM has settled. */
  const focusTab = (id: string | undefined) => {
    if (id) requestAnimationFrame(() => tabRefs.current.get(id)?.focus())
  }

  /** Delete now, or ask first if the sandbox has work in it. Returns true if it was deleted. */
  const requestClose = (id: string): boolean => {
    const sandbox = sandboxes[id]
    if (!sandbox) return false
    if (isEdited(sandbox)) {
      setClosingId(id)
      return false
    }
    deleteSandbox(id)
    return true
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, id: string) => {
    const index = order.indexOf(id)
    const move = (to: number) => focusNow(order[(to + order.length) % order.length])
    switch (e.key) {
      case 'ArrowRight':
        move(index + 1)
        break
      case 'ArrowLeft':
        move(index - 1)
        break
      case 'Home':
        move(0)
        break
      case 'End':
        move(order.length - 1)
        break
      case 'F2':
        setRenamingId(id)
        break
      case 'Delete':
        if (requestClose(id)) focusTab(useStudio.getState().activeSandboxId)
        break
      default:
        return
    }
    e.preventDefault()
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) reorderSandboxes(String(active.id), String(over.id))
  }

  return (
    <div className="flex h-[2.3125rem] min-w-0 flex-1 items-end self-end">
      <div
        role="tablist"
        aria-label="Sandboxes"
        className="no-scrollbar flex h-full min-w-0 items-end gap-0.5 overflow-x-auto"
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order} strategy={horizontalListSortingStrategy}>
            {order.map((id) => {
              const sandbox = sandboxes[id]
              if (!sandbox) return null
              return (
                <SandboxTab
                  key={id}
                  sandbox={sandbox}
                  active={id === activeId}
                  renaming={renamingId === id}
                  register={(el) => {
                    if (el) tabRefs.current.set(id, el)
                    else tabRefs.current.delete(id)
                  }}
                  onActivate={() => switchSandbox(id)}
                  onClose={() => {
                    if (requestClose(id)) focusTab(useStudio.getState().activeSandboxId)
                  }}
                  onRename={() => setRenamingId(id)}
                  onRenamed={(name) => {
                    if (name !== null) renameSandbox(id, name)
                    setRenamingId(null)
                    focusTab(id)
                  }}
                  onDuplicate={() => duplicateSandbox(id)}
                  onReset={() => setResetId(id)}
                  onKeyDown={(e) => onKeyDown(e, id)}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </div>

      {/* Outside the scroller so it stays reachable however many tabs there are. */}
      <Hint label="New sandbox">
        <button
          type="button"
          aria-label="New sandbox"
          onClick={() => createSandbox()}
          className="mb-1 ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </Hint>

      <ConfirmDialog
        open={closing !== undefined}
        onOpenChange={(open) => !open && setClosingId(null)}
        title={`Close “${closing?.name ?? ''}”?`}
        description="This sandbox has changes. Closing it deletes it from this browser, and that cannot be undone."
        confirmLabel="Close and delete"
        destructive
        onConfirm={() => closingId && deleteSandbox(closingId)}
      />

      <ConfirmDialog
        open={resetting !== undefined}
        onOpenChange={(open) => !open && setResetId(null)}
        title={`Reset “${resetting?.name ?? ''}”?`}
        description="Its elements and CSS go back to the starter layout. Other sandboxes are not touched."
        confirmLabel="Reset sandbox"
        destructive
        onConfirm={() => {
          // resetSandbox works on the active sandbox, so switch to the one being reset first.
          if (resetId) switchSandbox(resetId)
          resetSandbox()
        }}
      />
    </div>
  )
}

interface SandboxTabProps {
  sandbox: Sandbox
  active: boolean
  renaming: boolean
  register: (el: HTMLElement | null) => void
  onActivate: () => void
  onClose: () => void
  onRename: () => void
  onRenamed: (name: string | null) => void
  onDuplicate: () => void
  onReset: () => void
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void
}

function SandboxTab({
  sandbox,
  active,
  renaming,
  register,
  onActivate,
  onClose,
  onRename,
  onRenamed,
  onDuplicate,
  onReset,
  onKeyDown,
}: SandboxTabProps) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id: sandbox.id })
  const Icon = sandbox.challengeId ? Trophy : FileCode2

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          role="none"
          style={{ transform: CSS.Translate.toString(transform && { ...transform, y: 0 }), transition }}
          className={cn(
            'group relative flex h-full min-w-[4.5rem] max-w-[11.5rem] flex-[0_1_11.5rem] items-center rounded-t-lg border border-b-0 border-transparent',
            active
              ? 'z-10 border-border bg-background text-foreground'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            isDragging && 'z-20 opacity-90 shadow-md',
          )}
        >
          {renaming ? (
            <div className="min-w-0 flex-1 px-1.5">
              <RenameInput initial={sandbox.name} onDone={onRenamed} />
            </div>
          ) : (
            <button
              ref={register}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              title={sandbox.name}
              {...listeners}
              onClick={onActivate}
              onDoubleClick={onRename}
              onKeyDown={onKeyDown}
              onMouseDown={(e) => {
                // Middle-click closes, so keep the browser's autoscroll out of it.
                if (e.button === 1) e.preventDefault()
              }}
              onAuxClick={(e) => {
                if (e.button === 1) onClose()
              }}
              className="flex h-full min-w-0 flex-1 touch-none items-center gap-1.5 rounded-t-lg pl-2.5 pr-1 text-left text-xs focus-visible:ring-inset"
            >
              <Icon aria-hidden className={cn('size-3.5 shrink-0', active && sandbox.challengeId && 'text-primary')} />
              <span className="truncate">{sandbox.name}</span>
            </button>
          )}
          {!renaming && (
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Close ${sandbox.name}`}
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="mr-1 flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onRename}>
          <Pencil /> Rename
        </ContextMenuItem>
        <ContextMenuItem onSelect={onDuplicate}>
          <Copy /> Duplicate
        </ContextMenuItem>
        <ContextMenuItem onSelect={onReset}>
          <RotateCcw /> Reset sandbox…
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onClose}>
          <X /> Close tab
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
