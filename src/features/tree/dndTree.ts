import { arrayMove } from '@dnd-kit/sortable'
import { canHaveChildren } from './tags'
import type { TreeNode } from '@/types/tree'

/*
 * Drag-and-drop helpers in the style of the dnd-kit "sortable tree" recipe: the tree is
 * flattened into rows with a depth, the dragged row's horizontal offset picks its new depth,
 * and the flat list is rebuilt into a tree on drop.
 */

export interface FlatNode {
  id: string
  parentId: string | null
  depth: number
  node: TreeNode
}

export function flattenTree(items: TreeNode[], parentId: string | null = null, depth = 0): FlatNode[] {
  return items.flatMap((node) => [
    { id: node.id, parentId, depth, node },
    ...flattenTree(node.children, node.id, depth + 1),
  ])
}

/** Remove the descendants of the given ids (a dragged node carries its subtree with it). */
export function removeDescendantsOf(flat: FlatNode[], ids: string[]): FlatNode[] {
  const excluded = new Set(ids)
  return flat.filter((row) => {
    if (row.parentId && excluded.has(row.parentId)) {
      excluded.add(row.id)
      return false
    }
    return true
  })
}

export interface Projection {
  depth: number
  parentId: string | null
}

export function getProjection(
  flat: FlatNode[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
  indentWidth: number,
): Projection | null {
  const overIndex = flat.findIndex((r) => r.id === overId)
  const activeIndex = flat.findIndex((r) => r.id === activeId)
  const active = flat[activeIndex]
  if (overIndex === -1 || !active) return null

  const moved = arrayMove(flat, activeIndex, overIndex)
  const previous = moved[overIndex - 1]
  const next = moved[overIndex + 1]
  const projected = active.depth + Math.round(dragOffsetX / indentWidth)
  const maxDepth = previous ? previous.depth + (canHaveChildren(previous.node.tag) ? 1 : 0) : 0
  const minDepth = next ? next.depth : 0
  const depth = Math.min(Math.max(projected, minDepth), maxDepth)

  const parentId = (() => {
    if (depth === 0 || !previous) return null
    if (depth === previous.depth) return previous.parentId
    if (depth > previous.depth) return previous.id
    return (
      moved
        .slice(0, overIndex)
        .reverse()
        .find((r) => r.depth === depth)?.parentId ?? null
    )
  })()

  return { depth, parentId }
}

/** Rebuild a nested tree from flat rows. Sibling order follows row order. */
export function buildTree(flat: FlatNode[]): TreeNode[] {
  const byId = new Map<string, TreeNode>()
  for (const row of flat) byId.set(row.id, { ...row.node, children: [] })
  const roots: TreeNode[] = []
  for (const row of flat) {
    const node = byId.get(row.id)
    if (!node) continue
    const parent = row.parentId ? byId.get(row.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

/** Apply a finished drag: move `activeId` to `overId`'s slot with the projected parent. */
export function applyDrop(items: TreeNode[], activeId: string, overId: string, projection: Projection): TreeNode[] {
  const flat = flattenTree(items)
  const activeIndex = flat.findIndex((r) => r.id === activeId)
  const overIndex = flat.findIndex((r) => r.id === overId)
  const active = flat[activeIndex]
  if (!active || overIndex === -1) return items
  const updated = flat.map((r) => (r.id === activeId ? { ...r, ...projection } : r))
  return buildTree(arrayMove(updated, activeIndex, overIndex))
}
