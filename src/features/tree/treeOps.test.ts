import { describe, expect, it } from 'vitest'
import { applyDrop, flattenTree, getProjection, removeDescendantsOf } from './dndTree'
import { parseClassList } from './tags'
import {
  createNode,
  duplicateNode,
  findLocation,
  findNode,
  insertNode,
  moveNode,
  removeNode,
  selectionAfterDelete,
  updateNode,
  visibleRows,
} from './treeOps'
import type { TagName, TreeNode } from '@/types/tree'

const n = (id: string, children: TreeNode[] = [], tag: TagName = 'div'): TreeNode => ({
  id,
  tag,
  classes: [],
  text: '',
  attrs: {},
  children,
})

/** Compact shape for assertions: "a(b,c(d))". */
const shape = (items: TreeNode[]): string =>
  items.map((x) => (x.children.length ? `${x.id}(${shape(x.children)})` : x.id)).join(',')

const tree = () => [n('a', [n('b'), n('c', [n('d')])]), n('e')]

describe('insertNode', () => {
  it('adds a child, a sibling and a root node', () => {
    expect(shape(insertNode(tree(), n('x'), 'child', 'c'))).toBe('a(b,c(d,x)),e')
    expect(shape(insertNode(tree(), n('x'), 'sibling', 'b'))).toBe('a(b,x,c(d)),e')
    expect(shape(insertNode(tree(), n('x'), 'root', null))).toBe('a(b,c(d)),e,x')
  })

  it('falls back to a sibling when the target cannot have children', () => {
    const items = [n('img', [], 'img')]
    expect(shape(insertNode(items, n('x'), 'child', 'img'))).toBe('img,x')
  })
})

describe('update / remove / duplicate', () => {
  it('updates a nested node immutably', () => {
    const before = tree()
    const after = updateNode(before, 'd', { text: 'hi' })
    expect(findNode(after, 'd')?.text).toBe('hi')
    expect(findNode(before, 'd')?.text).toBe('')
    expect(after[1]).toBe(before[1]) // untouched branch is shared
  })

  it('removes a node with its subtree', () => {
    expect(shape(removeNode(tree(), 'c'))).toBe('a(b),e')
  })

  it('duplicates a subtree with fresh ids right after the original', () => {
    const { items, newId } = duplicateNode(tree(), 'c')
    expect(newId).not.toBe('c')
    const loc = findLocation(items, newId!)
    expect(loc?.parentId).toBe('a')
    expect(loc?.index).toBe(2)
    const copy = findNode(items, newId!)
    expect(copy?.children).toHaveLength(1)
    expect(copy?.children[0]?.id).not.toBe('d')
  })

  it('picks the next, previous, then parent node after delete', () => {
    expect(selectionAfterDelete(tree(), 'b')).toBe('c')
    expect(selectionAfterDelete(tree(), 'c')).toBe('b')
    expect(selectionAfterDelete(tree(), 'd')).toBe('c')
    expect(selectionAfterDelete(tree(), 'a')).toBe('e')
  })
})

describe('moveNode', () => {
  it('reorders among siblings', () => {
    expect(shape(moveNode(tree(), 'c', 'up'))).toBe('a(c(d),b),e')
    expect(shape(moveNode(tree(), 'a', 'down'))).toBe('e,a(b,c(d))')
  })

  it('returns the same array when the move is impossible', () => {
    const items = tree()
    expect(moveNode(items, 'b', 'up')).toBe(items)
    expect(moveNode(items, 'a', 'outdent')).toBe(items)
    expect(moveNode(items, 'b', 'indent')).toBe(items)
  })

  it('indents into the previous sibling and outdents after the parent', () => {
    expect(shape(moveNode(tree(), 'c', 'indent'))).toBe('a(b(c(d))),e')
    expect(shape(moveNode(tree(), 'd', 'outdent'))).toBe('a(b,c,d),e')
  })

  it('does not indent into a void element', () => {
    const items = [n('img', [], 'img'), n('x')]
    expect(moveNode(items, 'x', 'indent')).toBe(items)
  })
})

describe('visibleRows', () => {
  it('lists rows depth-first and hides collapsed children', () => {
    expect(visibleRows(tree(), {}).map((r) => `${r.node.id}@${r.depth}`)).toEqual(['a@0', 'b@1', 'c@1', 'd@2', 'e@0'])
    expect(visibleRows(tree(), { c: true }).map((r) => r.node.id)).toEqual(['a', 'b', 'c', 'e'])
  })
})

describe('drag and drop projection', () => {
  it('moves a node to the root level after another node', () => {
    const items = tree()
    const flat = removeDescendantsOf(flattenTree(items), ['b'])
    const projection = getProjection(flat, 'b', 'e', -100, 14)
    expect(projection).toEqual({ depth: 0, parentId: null })
    expect(shape(applyDrop(items, 'b', 'e', projection!))).toBe('a(c(d)),e,b')
  })

  it('nests under the previous row when dragged right', () => {
    const items = [n('a'), n('b')]
    const projection = getProjection(flattenTree(items), 'b', 'b', 20, 14)
    expect(projection).toEqual({ depth: 1, parentId: 'a' })
    expect(shape(applyDrop(items, 'b', 'b', projection!))).toBe('a(b)')
  })

  it('carries the dragged subtree along', () => {
    const items = tree()
    const flat = removeDescendantsOf(flattenTree(items), ['c'])
    expect(flat.map((r) => r.id)).toEqual(['a', 'b', 'c', 'e'])
    const projection = getProjection(flat, 'c', 'e', -14, 14)
    expect(shape(applyDrop(items, 'c', 'e', projection!))).toBe('a(b),e,c(d)')
  })

  it('never nests under a void element', () => {
    const items = [n('img', [], 'img'), n('b')]
    expect(getProjection(flattenTree(items), 'b', 'b', 40, 14)).toEqual({ depth: 0, parentId: null })
  })
})

describe('parseClassList', () => {
  it('splits on whitespace, dots and commas, dedupes and reports invalid names', () => {
    expect(parseClassList(' .card  card--active, 2col card ')).toEqual({
      classes: ['card', 'card--active'],
      invalid: ['2col'],
    })
  })
})

describe('createNode', () => {
  it('creates attribute-safe unique ids', () => {
    const a = createNode('div')
    const b = createNode('div')
    expect(a.id).toMatch(/^n[0-9a-z]{9}$/)
    expect(a.id).not.toBe(b.id)
  })
})
