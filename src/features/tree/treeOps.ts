import { canHaveChildren } from './tags'
import { newId } from '@/lib/id'
import type { AddMode, MoveDirection, TagName, TreeNode } from '@/types/tree'

/*
 * Pure, immutable operations on the nested item tree. The store calls these; tests cover them.
 */

export interface NodeLocation {
  parentId: string | null
  index: number
  siblings: TreeNode[]
}

export function createNode(tag: TagName, init: Partial<Omit<TreeNode, 'id' | 'tag'>> = {}): TreeNode {
  return {
    id: newId(),
    tag,
    classes: init.classes ?? [],
    text: init.text ?? '',
    attrs: init.attrs ?? {},
    children: init.children ?? [],
  }
}

export function findNode(items: TreeNode[], id: string): TreeNode | undefined {
  for (const node of items) {
    if (node.id === id) return node
    const hit = findNode(node.children, id)
    if (hit) return hit
  }
  return undefined
}

export function findLocation(items: TreeNode[], id: string, parentId: string | null = null): NodeLocation | null {
  const index = items.findIndex((n) => n.id === id)
  if (index !== -1) return { parentId, index, siblings: items }
  for (const node of items) {
    const hit = findLocation(node.children, id, node.id)
    if (hit) return hit
  }
  return null
}

/** Ids from the root down to (and including) the node. Empty when not found. */
export function pathTo(items: TreeNode[], id: string): string[] {
  for (const node of items) {
    if (node.id === id) return [id]
    const sub = pathTo(node.children, id)
    if (sub.length) return [node.id, ...sub]
  }
  return []
}

/** Replace the sibling list identified by parentId (null = root) with fn(siblings). */
function withSiblings(
  items: TreeNode[],
  parentId: string | null,
  fn: (siblings: TreeNode[]) => TreeNode[],
): TreeNode[] {
  if (parentId === null) return fn(items)
  let changed = false
  const next = items.map((node) => {
    if (node.id === parentId) {
      changed = true
      return { ...node, children: fn(node.children) }
    }
    if (node.children.length === 0) return node
    const children = withSiblings(node.children, parentId, fn)
    if (children === node.children) return node
    changed = true
    return { ...node, children }
  })
  return changed ? next : items
}

export function updateNode(
  items: TreeNode[],
  id: string,
  patch: Partial<Omit<TreeNode, 'id' | 'children'>>,
): TreeNode[] {
  const loc = findLocation(items, id)
  if (!loc) return items
  return withSiblings(items, loc.parentId, (siblings) => siblings.map((n) => (n.id === id ? { ...n, ...patch } : n)))
}

/**
 * Insert `node` relative to `targetId`. Children of void tags are not allowed, so "child" on an
 * <img> falls back to "sibling". Returns the new tree.
 */
export function insertNode(items: TreeNode[], node: TreeNode, mode: AddMode, targetId: string | null): TreeNode[] {
  const target = targetId ? findNode(items, targetId) : undefined
  if (mode === 'root' || !target || !targetId) return [...items, node]
  if (mode === 'child' && canHaveChildren(target.tag)) {
    return withSiblings(items, targetId, (children) => [...children, node])
  }
  const loc = findLocation(items, targetId)
  if (!loc) return [...items, node]
  return withSiblings(items, loc.parentId, (siblings) => [
    ...siblings.slice(0, loc.index + 1),
    node,
    ...siblings.slice(loc.index + 1),
  ])
}

export function removeNode(items: TreeNode[], id: string): TreeNode[] {
  const loc = findLocation(items, id)
  if (!loc) return items
  return withSiblings(items, loc.parentId, (siblings) => siblings.filter((n) => n.id !== id))
}

export function cloneWithNewIds(node: TreeNode): TreeNode {
  return {
    ...node,
    id: newId(),
    classes: [...node.classes],
    attrs: { ...node.attrs },
    children: node.children.map(cloneWithNewIds),
  }
}

export function duplicateNode(items: TreeNode[], id: string): { items: TreeNode[]; newId: string | null } {
  const loc = findLocation(items, id)
  const original = loc?.siblings[loc.index]
  if (!loc || !original) return { items, newId: null }
  const copy = cloneWithNewIds(original)
  const next = withSiblings(items, loc.parentId, (siblings) => [
    ...siblings.slice(0, loc.index + 1),
    copy,
    ...siblings.slice(loc.index + 1),
  ])
  return { items: next, newId: copy.id }
}

/** Keyboard-friendly structural moves. Returns the same array when the move is not possible. */
export function moveNode(items: TreeNode[], id: string, direction: MoveDirection): TreeNode[] {
  const loc = findLocation(items, id)
  const node = loc?.siblings[loc.index]
  if (!loc || !node) return items

  switch (direction) {
    case 'up':
    case 'down': {
      const swapWith = direction === 'up' ? loc.index - 1 : loc.index + 1
      if (swapWith < 0 || swapWith >= loc.siblings.length) return items
      return withSiblings(items, loc.parentId, (siblings) => {
        const next = [...siblings]
        const other = next[swapWith]
        if (!other) return siblings
        next[swapWith] = node
        next[loc.index] = other
        return next
      })
    }
    case 'indent': {
      const newParent = loc.siblings[loc.index - 1]
      if (!newParent || !canHaveChildren(newParent.tag)) return items
      const without = removeNode(items, id)
      return withSiblings(without, newParent.id, (children) => [...children, node])
    }
    case 'outdent': {
      if (loc.parentId === null) return items
      const parentLoc = findLocation(items, loc.parentId)
      if (!parentLoc) return items
      const without = removeNode(items, id)
      return withSiblings(without, parentLoc.parentId, (siblings) => {
        const parentIndex = siblings.findIndex((n) => n.id === loc.parentId)
        return [...siblings.slice(0, parentIndex + 1), node, ...siblings.slice(parentIndex + 1)]
      })
    }
  }
}

/** Which node should be selected after `id` is deleted: next sibling, else previous, else parent. */
export function selectionAfterDelete(items: TreeNode[], id: string): string | null {
  const loc = findLocation(items, id)
  if (!loc) return null
  return loc.siblings[loc.index + 1]?.id ?? loc.siblings[loc.index - 1]?.id ?? loc.parentId
}

export interface VisibleRow {
  node: TreeNode
  depth: number
  parentId: string | null
  /** 1-based position among siblings, plus the sibling count, for aria-posinset/aria-setsize. */
  posInSet: number
  setSize: number
}

/** Depth-first list of rows the Items panel shows (children of collapsed nodes are skipped). */
export function visibleRows(
  items: TreeNode[],
  collapsed: Record<string, true>,
  depth = 0,
  parentId: string | null = null,
  out: VisibleRow[] = [],
): VisibleRow[] {
  items.forEach((node, i) => {
    out.push({ node, depth, parentId, posInSet: i + 1, setSize: items.length })
    if (node.children.length && !collapsed[node.id]) {
      visibleRows(node.children, collapsed, depth + 1, node.id, out)
    }
  })
  return out
}

export function collectClasses(items: TreeNode[], into: Set<string> = new Set()): Set<string> {
  for (const node of items) {
    node.classes.forEach((c) => into.add(c))
    collectClasses(node.children, into)
  }
  return into
}

export function countNodes(items: TreeNode[]): number {
  return items.reduce((sum, n) => sum + 1 + countNodes(n.children), 0)
}

/** Class lists of every element that has at least one class (for lint context). */
export function collectElementClasses(items: TreeNode[], out: string[][] = []): string[][] {
  for (const node of items) {
    if (node.classes.length) out.push(node.classes)
    collectElementClasses(node.children, out)
  }
  return out
}
