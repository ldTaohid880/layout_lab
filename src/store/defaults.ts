import { createNode } from '@/features/tree/treeOps'
import { newId } from '@/lib/id'
import type { Sandbox, UiState } from '@/types/sandbox'
import type { TreeNode } from '@/types/tree'

export const STARTER_CSS = `/* Try it: add  display: flex; gap: 12px;  to .box */

.page {
  padding: 16px;
}

.header {
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #18181b;
  color: #fafafa;
  border-radius: 6px;
}

.box {
  padding: 12px;
  border: 2px dashed #a1a1aa;
}

.item {
  padding: 16px 20px;
  background: #fed7aa;
  border: 1px solid #f97316;
  border-radius: 4px;
}
`

export function starterItems(): TreeNode[] {
  return [
    createNode('div', {
      classes: ['page'],
      children: [
        createNode('header', { classes: ['header'], text: 'Layout Lab' }),
        createNode('div', {
          classes: ['box'],
          children: ['1', '2', '3'].map((text) => createNode('div', { classes: ['item'], text })),
        }),
      ],
    }),
  ]
}

export function createSandbox(name: string, init?: Partial<Pick<Sandbox, 'items' | 'css' | 'challengeId'>>): Sandbox {
  const now = Date.now()
  return {
    id: newId(),
    name,
    items: init?.items ?? starterItems(),
    css: init?.css ?? STARTER_CSS,
    ...(init?.challengeId ? { challengeId: init.challengeId } : {}),
    createdAt: now,
    updatedAt: now,
  }
}

export const DEFAULT_UI: UiState = {
  theme: 'system',
  previewWidth: null,
  previewBg: 'white',
  mobileView: 'preview',
  leftTab: 'items',
  collapsed: {},
  overlays: { box: true, layout: true, axes: true, outlines: false },
}

export const PREVIEW_WIDTH_PRESETS = [375, 768, 1024, 1440] as const
