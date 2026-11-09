import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, Copy, GripVertical, Plus, Trash2 } from 'lucide-react'
import { forwardRef, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { canHaveChildren, parseClassList } from './tags'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { TreeNode } from '@/types/tree'

export const INDENT_PX = 14

interface TreeRowProps {
  node: TreeNode
  depth: number
  posInSet: number
  setSize: number
  selected: boolean
  /** Hovered here or in the preview: both highlight the same element. */
  hovered: boolean
  focusable: boolean
  expanded: boolean | undefined
  editing: boolean
  dragging: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onToggle: () => void
  onAddChild: () => void
  onDuplicate: () => void
  onDelete: () => void
  onCommitClasses: (classes: string[]) => void
  onCancelEdit: () => void
}

export const TreeRow = forwardRef<HTMLDivElement, TreeRowProps>(function TreeRow(
  {
    node,
    depth,
    posInSet,
    setSize,
    selected,
    hovered,
    focusable,
    expanded,
    editing,
    dragging,
    onSelect,
    onHover,
    onToggle,
    onAddChild,
    onDuplicate,
    onDelete,
    onCommitClasses,
    onCancelEdit,
  },
  ref,
) {
  const { setNodeRef, setActivatorNodeRef, listeners, transform, transition } = useSortable({ id: node.id })

  return (
    // Keyboard selection is handled by the tree's onKeyDown (roving tabindex), not on each row.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      ref={(el) => {
        setNodeRef(el)
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      }}
      role="treeitem"
      aria-label={`${node.tag}${node.classes.map((c) => `.${c}`).join('')}${node.text ? `, text “${node.text}”` : ''}`}
      aria-level={depth + 1}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      aria-selected={selected}
      aria-expanded={expanded}
      data-id={node.id}
      data-testid="tree-row"
      tabIndex={focusable ? 0 : -1}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        transform: CSS.Translate.toString(transform && { ...transform, x: 0 }),
        transition,
        paddingLeft: 4 + depth * INDENT_PX,
      }}
      className={cn(
        'group relative flex h-7 cursor-default select-none items-center gap-0.5 rounded-sm pr-1 font-mono text-xs outline-none',
        'hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-0',
        hovered && !selected && 'bg-muted',
        selected && 'bg-primary/10 hover:bg-primary/15',
        dragging && 'z-10 bg-background opacity-90 shadow-md ring-1 ring-primary',
      )}
    >
      {/* Indent guides make nesting legible at a glance. */}
      {Array.from({ length: depth }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute inset-y-0 w-px bg-border"
          style={{ left: 4 + i * INDENT_PX + 6 }}
        />
      ))}

      <button
        type="button"
        ref={setActivatorNodeRef}
        {...listeners}
        tabIndex={-1}
        aria-hidden
        className="flex h-6 w-4 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/50 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-3" />
      </button>

      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground',
          expanded === undefined && 'invisible',
        )}
      >
        <ChevronRight className={cn('size-3 transition-transform', expanded && 'rotate-90')} />
      </button>

      {editing ? (
        <ClassEditor node={node} onCommit={onCommitClasses} onCancel={onCancelEdit} />
      ) : (
        <span className="flex min-w-0 flex-1 items-baseline gap-0 truncate">
          <span className="text-foreground">{node.tag}</span>
          {node.classes.length > 0 && <span className="truncate text-primary">.{node.classes.join('.')}</span>}
          {node.text && <span className="ml-2 truncate font-sans text-2xs text-muted-foreground">“{node.text}”</span>}
        </span>
      )}

      {!editing && (
        // Mouse shortcuts only, hidden from assistive tech: the toolbar and keyboard cover them.
        <span aria-hidden className="ml-auto hidden shrink-0 items-center group-hover:flex">
          <RowAction label="Add child" disabled={!canHaveChildren(node.tag)} onClick={onAddChild}>
            <Plus />
          </RowAction>
          <RowAction label="Duplicate" onClick={onDuplicate}>
            <Copy />
          </RowAction>
          <RowAction label="Delete" onClick={onDelete}>
            <Trash2 />
          </RowAction>
        </span>
      )}
    </div>
  )
})

function RowAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 [&_svg]:size-3"
    >
      {children}
    </button>
  )
}

function ClassEditor({
  node,
  onCommit,
  onCancel,
}: {
  node: TreeNode
  onCommit: (classes: string[]) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(node.classes.join(' '))
  const inputRef = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  const { invalid } = parseClassList(value)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const commit = () => {
    if (done.current) return
    done.current = true
    onCommit(parseClassList(value).classes)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      done.current = true
      onCancel()
    }
  }

  return (
    <Input
      ref={inputRef}
      aria-label={`Class names for ${node.tag}`}
      aria-invalid={invalid.length > 0}
      value={value}
      placeholder="class names"
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={commit}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        // Inline in a 28px row: shorter than the default field, and the border already shows focus.
        'h-6 w-auto flex-1 rounded-sm border-primary px-1.5 font-mono text-primary focus-visible:ring-0',
        invalid.length > 0 && 'border-destructive',
      )}
    />
  )
}
