import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronRight } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { applyDrop, getProjection, removeDescendantsOf, type FlatNode } from './dndTree'
import { canHaveChildren } from './tags'
import { TreeRow, INDENT_PX } from './TreeRow'
import { TreeToolbar } from './TreeToolbar'
import { findNode, visibleRows } from './treeOps'
import { setDragging } from '@/lib/dragging'
import { cn } from '@/lib/utils'
import { useActiveSandbox, useStudio } from '@/store/studioStore'
import type { MoveDirection, TagName } from '@/types/tree'

export function TreePanel() {
  const { items } = useActiveSandbox()
  const collapsed = useStudio((s) => s.ui.collapsed)
  const selectedId = useStudio((s) => s.selectedItemId)
  const hoveredId = useStudio((s) => s.hoveredItemId)
  const {
    select,
    setHovered,
    toggleCollapsed,
    addItem,
    duplicateItem,
    deleteItem,
    moveItem,
    updateItem,
    replaceItems,
  } = useStudio.getState()

  const [newTag, setNewTag] = useState<TagName>('div')
  const [editingId, setEditingId] = useState<string | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const focusPending = useRef(false)

  const rows = useMemo(() => visibleRows(items, collapsed), [items, collapsed])
  const selected = selectedId ? findNode(items, selectedId) : undefined

  // ---- Drag and drop -------------------------------------------------------------------------
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [offsetX, setOffsetX] = useState(0)

  const flat = useMemo<FlatNode[]>(
    () => rows.map((r) => ({ id: r.node.id, parentId: r.parentId, depth: r.depth, node: r.node })),
    [rows],
  )
  const sortable = useMemo(() => (activeId ? removeDescendantsOf(flat, [activeId]) : flat), [flat, activeId])
  const projection = activeId && overId ? getProjection(sortable, activeId, overId, offsetX, INDENT_PX) : null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const resetDrag = () => {
    setActiveId(null)
    setOverId(null)
    setOffsetX(0)
    setDragging(false)
  }

  const onDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id)
    setActiveId(id)
    setOverId(id)
    select(id)
    setDragging(true)
  }
  const onDragMove = ({ delta }: DragMoveEvent) => setOffsetX(delta.x)
  const onDragOver = ({ over }: DragOverEvent) => setOverId(over ? String(over.id) : null)
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (projection && over) {
      const next = applyDrop(items, String(active.id), String(over.id), projection)
      replaceItems(next)
      if (projection.parentId) toggleCollapsed(projection.parentId, false)
    }
    resetDrag()
  }

  // ---- Focus management ----------------------------------------------------------------------
  useEffect(() => {
    if (!focusPending.current || !selectedId) return
    focusPending.current = false
    rowRefs.current.get(selectedId)?.focus()
  })

  // Keep the selected row in view when it was picked elsewhere (e.g. in the preview).
  useEffect(() => {
    if (selectedId) rowRefs.current.get(selectedId)?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedId])

  const selectAndFocus = (id: string | null) => {
    focusPending.current = true
    select(id)
  }

  const runMove = (id: string, direction: MoveDirection) => {
    focusPending.current = true
    moveItem(id, direction)
  }

  const onTreeKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editingId) return
    const index = rows.findIndex((r) => r.node.id === selectedId)
    const row = rows[index]
    const mod = e.ctrlKey || e.metaKey

    const handled = (() => {
      if (e.altKey && row) {
        const map: Record<string, MoveDirection> = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowRight: 'indent',
          ArrowLeft: 'outdent',
        }
        const direction = map[e.key]
        if (!direction) return false
        runMove(row.node.id, direction)
        return true
      }
      switch (e.key) {
        case 'ArrowDown': {
          const next = rows[index + 1] ?? (index === -1 ? rows[0] : undefined)
          if (next) selectAndFocus(next.node.id)
          return true
        }
        case 'ArrowUp': {
          const prev = rows[index - 1] ?? (index === -1 ? rows[0] : undefined)
          if (prev) selectAndFocus(prev.node.id)
          return true
        }
        case 'Escape':
          if (!selectedId) return false
          select(null)
          return true
        case 'Home':
          if (rows[0]) selectAndFocus(rows[0].node.id)
          return true
        case 'End': {
          const last = rows[rows.length - 1]
          if (last) selectAndFocus(last.node.id)
          return true
        }
        case 'ArrowRight':
          if (!row || row.node.children.length === 0) return true
          if (collapsed[row.node.id]) toggleCollapsed(row.node.id, false)
          else if (rows[index + 1]) selectAndFocus(rows[index + 1]!.node.id)
          return true
        case 'ArrowLeft':
          if (!row) return true
          if (row.node.children.length > 0 && !collapsed[row.node.id]) toggleCollapsed(row.node.id, true)
          else if (row.parentId) selectAndFocus(row.parentId)
          return true
        case 'Enter':
        case 'F2':
          if (row) setEditingId(row.node.id)
          return true
        case 'Delete':
        case 'Backspace':
          if (row) {
            focusPending.current = true
            deleteItem(row.node.id)
          }
          return true
        case 'd':
        case 'D':
          if (!mod || !row) return false
          focusPending.current = true
          duplicateItem(row.node.id)
          return true
        default:
          return false
      }
    })()

    if (handled) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const add = (mode: 'child' | 'sibling') => {
    focusPending.current = true
    addItem(newTag, selectedId ? mode : 'root', selectedId)
  }

  const focusableId = selectedId && rows.some((r) => r.node.id === selectedId) ? selectedId : rows[0]?.node.id

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TreeToolbar
        tag={newTag}
        onTagChange={setNewTag}
        hasSelection={Boolean(selected)}
        canAddChild={!selected || canHaveChildren(selected.tag)}
        onAddChild={() => add('child')}
        onAddSibling={() => add('sibling')}
        onDuplicate={() => selected && duplicateItem(selected.id)}
        onDelete={() => selected && deleteItem(selected.id)}
      />

      {/* Clicking the empty space is a mouse shortcut; keyboard users clear the selection with Escape in the tree. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="min-h-0 flex-1 overflow-auto p-1.5"
        data-testid="tree-scroll"
        onClick={(e) => {
          // A click on the empty space around the rows clears the selection.
          if (e.target === e.currentTarget) select(null)
        }}
      >
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-xs text-muted-foreground">
            <p>No elements yet.</p>
            <p>
              Pick a tag above and press <span className="font-medium text-foreground">Add</span> to start a tree.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={resetDrag}
          >
            <SortableContext items={sortable.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              {/* Roving tabindex: focus sits on one treeitem, not on the tree itself (ARIA tree pattern). */}
              {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
              <div role="tree" aria-label="Elements" aria-multiselectable={false} onKeyDown={onTreeKeyDown}>
                {sortable.map((flatRow) => {
                  const row = rows.find((r) => r.node.id === flatRow.id)
                  if (!row) return null
                  const { node } = row
                  const isActive = node.id === activeId
                  return (
                    <TreeRow
                      key={node.id}
                      ref={(el) => {
                        if (el) rowRefs.current.set(node.id, el)
                        else rowRefs.current.delete(node.id)
                      }}
                      node={node}
                      depth={isActive && projection ? projection.depth : row.depth}
                      posInSet={row.posInSet}
                      setSize={row.setSize}
                      selected={node.id === selectedId}
                      hovered={node.id === hoveredId}
                      focusable={node.id === focusableId}
                      expanded={node.children.length ? !collapsed[node.id] : undefined}
                      editing={editingId === node.id}
                      dragging={isActive}
                      onSelect={() => select(node.id === selectedId ? null : node.id)}
                      onHover={(on) => setHovered(on ? node.id : null)}
                      onToggle={() => toggleCollapsed(node.id)}
                      onAddChild={() => {
                        focusPending.current = true
                        addItem(newTag, 'child', node.id)
                      }}
                      onDuplicate={() => duplicateItem(node.id)}
                      onDelete={() => deleteItem(node.id)}
                      onCommitClasses={(classes) => {
                        updateItem(node.id, { classes })
                        setEditingId(null)
                        selectAndFocus(node.id)
                      }}
                      onCancelEdit={() => {
                        setEditingId(null)
                        selectAndFocus(node.id)
                      }}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <KeyboardHelp />
    </div>
  )
}

function KeyboardHelp() {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="shrink-0 border-t px-3 py-1.5 text-2xs text-muted-foreground">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-sm hover:text-foreground"
      >
        <ChevronRight aria-hidden className={cn('size-3 transition-transform', open && 'rotate-90')} />
        Keyboard
      </button>
      <dl id={id} hidden={!open} className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 [&[hidden]]:hidden">
        <Key k="↑ ↓ Home End">move focus</Key>
        <Key k="← →">collapse / expand</Key>
        <Key k="Enter, F2">edit class names</Key>
        <Key k="Delete">delete element</Key>
        <Key k="Ctrl+D">duplicate</Key>
        <Key k="Alt+↑ ↓">reorder</Key>
        <Key k="Alt+→ ←">nest / un-nest</Key>
      </dl>
    </div>
  )
}

function Key({ k, children }: { k: string; children: string }) {
  return (
    <>
      <dt className="font-mono text-foreground">{k}</dt>
      <dd>{children}</dd>
    </>
  )
}
