import { z } from 'zod'
import { TAG_NAMES, type TreeNode } from '@/types/tree'

/*
 * Runtime validation for anything that comes from outside the running app: localStorage today,
 * share links in Milestone 4. Invalid data is rejected wholesale rather than partially trusted.
 */

const MAX_DEPTH = 32

const treeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/),
    tag: z.enum(TAG_NAMES),
    classes: z.array(z.string().max(100)).max(50),
    text: z.string().max(10_000),
    attrs: z.record(z.string().max(64), z.string().max(2_000)),
    children: z.array(treeNodeSchema).max(500),
  }),
)

function depthOf(items: TreeNode[]): number {
  return items.reduce((max, n) => Math.max(max, 1 + depthOf(n.children)), 0)
}

export const itemsSchema = z
  .array(treeNodeSchema)
  .max(500)
  .refine((items) => depthOf(items) <= MAX_DEPTH, `Tree is deeper than ${MAX_DEPTH} levels`)

const sandboxSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().max(120),
  items: itemsSchema,
  css: z.string().max(200_000),
  challengeId: z.string().max(64).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const uiSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  previewWidth: z.number().min(200).max(4000).nullable(),
  previewBg: z.enum(['white', 'dark', 'checker']),
  mobileView: z.enum(['tree', 'editor', 'preview']),
  leftTab: z.enum(['items', 'examples', 'docs', 'challenges']),
  collapsed: z.record(z.literal(true)),
  // Optional: state saved before Milestone 3 has no overlays and must still load.
  overlays: z
    .object({ box: z.boolean(), layout: z.boolean(), axes: z.boolean().optional(), outlines: z.boolean() })
    .optional(),
})

export const persistedStateSchema = z
  .object({
    sandboxes: z.record(sandboxSchema),
    sandboxOrder: z.array(z.string()).min(1),
    activeSandboxId: z.string(),
    ui: uiSchema,
  })
  .refine(
    (s) => s.sandboxOrder.every((id) => id in s.sandboxes) && s.activeSandboxId in s.sandboxes,
    'Sandbox index is inconsistent',
  )

export type PersistedState = z.infer<typeof persistedStateSchema>
