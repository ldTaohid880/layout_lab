import type { ExampleNode } from './types'
import { createNode } from '@/features/tree/treeOps'
import type { TreeNode } from '@/types/tree'

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
