import type { ExampleNode } from './types'
import { createNode } from '@/features/tree/treeOps'
import type { TagName, TreeNode } from '@/types/tree'

/** Terse builder for example trees: el('div', 'card', 'Text') or el('ul', 'links', [children]). */
export function el(
  tag: TagName,
  cls?: string,
  content?: string | ExampleNode[],
  attrs?: Record<string, string>,
): ExampleNode {
  return {
    tag,
    cls,
    text: typeof content === 'string' ? content : undefined,
    children: Array.isArray(content) ? content : undefined,
    attrs,
  }
}

export function repeat(count: number, make: (i: number) => ExampleNode): ExampleNode[] {
  return Array.from({ length: count }, (_, i) => make(i))
}

/** Turn example nodes into tree nodes with fresh ids. */
export function instantiate(nodes: ExampleNode[]): TreeNode[] {
  return nodes.map((n) =>
    createNode(n.tag, {
      classes: (n.cls ?? '').split(/\s+/).filter(Boolean),
      text: n.text ?? '',
      attrs: { ...n.attrs },
      children: instantiate(n.children ?? []),
    }),
  )
}
