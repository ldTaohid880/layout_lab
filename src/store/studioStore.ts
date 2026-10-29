import { arrayMove } from '@dnd-kit/sortable'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_UI, STARTER_CSS, createSandbox, starterItems } from './defaults'
import { persistedStateSchema, type PersistedState } from './schema'
import { instantiate } from '@/content/instantiate'
import type { Example } from '@/content/types'
import { upsertDeclaration } from '@/features/editor/upsertDeclaration'
import {
  createNode,
  duplicateNode,
  findLocation,
  findNode,
  insertNode,
  moveNode,
  pathTo,
  removeNode,
  selectionAfterDelete,
  updateNode,
} from '@/features/tree/treeOps'
import type { Challenge } from '@/content/types'
import type { InspectInfo } from '@/types/preview'
import type { Sandbox, UiState } from '@/types/sandbox'
import type { AddMode, MoveDirection, TagName, TreeNode } from '@/types/tree'

export const STORAGE_KEY = 'layout-lab-studio'
const STORAGE_VERSION = 1

export interface StudioState {
  sandboxes: Record<string, Sandbox>
  sandboxOrder: string[]
  activeSandboxId: string
  /** Not persisted: selection is session-only. */
  selectedItemId: string | null
  ui: UiState
  /** Not persisted: the last example applied, so it can be undone. */
  lastApply: LastApply | null
  /** Not persisted: a docs entry to scroll to and open (set from example concept chips). */
  docsFocus: string | null
  /** Not persisted: element under the pointer in the tree or (in inspect mode) the preview. */
  hoveredItemId: string | null
  /** Not persisted: pick elements by clicking in the preview. */
  inspect: boolean
  /** Not persisted: the browser's measurements of the selected element, from the preview. */
  inspectInfo: InspectInfo | null
  /** Not persisted: what the preview shows in a challenge sandbox. */
  compare: CompareMode

  // Sandboxes
  createSandbox: (name?: string, init?: Pick<Sandbox, 'items' | 'css'> & { challengeId?: string }) => void
  switchSandbox: (id: string) => void
  renameSandbox: (id: string, name: string) => void
  duplicateSandbox: (id: string) => void
  deleteSandbox: (id: string) => void
  /** Move a sandbox tab to another tab's position (drag to reorder). */
  reorderSandboxes: (fromId: string, toId: string) => void
  resetSandbox: () => void

  // Content of the active sandbox
  /** Takes the sandbox id explicitly so a late debounced write can never land in another sandbox. */
  setCss: (sandboxId: string, css: string) => void
  addItem: (tag: TagName, mode: AddMode, targetId: string | null) => string
  updateItem: (id: string, patch: Partial<Omit<TreeNode, 'id' | 'children'>>) => void
  duplicateItem: (id: string) => void
  deleteItem: (id: string) => void
  moveItem: (id: string, direction: MoveDirection) => void
  replaceItems: (items: TreeNode[]) => void
  /** Write one declaration into the rule for selector in the active sandbox (docs Try-it). */
  tryDeclaration: (selector: string, property: string, value: string) => void

  // Examples and docs
  applyExample: (example: Example, target: 'current' | 'new') => void
  undoApply: () => void
  /** Open the sandbox for a challenge, creating it from the starter if needed. */
  startChallenge: (challenge: Challenge) => void
  /** Replace the active sandbox's content, with Undo in the toast. */
  replaceContent: (title: string, content: Pick<Sandbox, 'items' | 'css'>) => void
  setCompare: (mode: CompareMode) => void
  dismissApply: () => void
  focusDoc: (property: string | null) => void

  // Selection and UI
  select: (id: string | null) => void
  /** Select and expand every collapsed ancestor so the row is visible. */
  revealItem: (id: string) => void
  setHovered: (id: string | null) => void
  setInspect: (inspect: boolean) => void
  setInspectInfo: (info: InspectInfo | null) => void
  toggleCollapsed: (id: string, collapsed?: boolean) => void
  setUi: (patch: Partial<UiState>) => void
}

export type CompareMode = 'yours' | 'target' | 'overlay' | 'diff'

export type LastApply =
  | {
      kind: 'current'
      title: string
      sandboxId: string
      previous: Pick<Sandbox, 'items' | 'css'>
    }
  | {
      kind: 'new'
      title: string
      sandboxId: string
      previousSandboxId: string
    }

function initialData(): Pick<StudioState, 'sandboxes' | 'sandboxOrder' | 'activeSandboxId' | 'ui'> {
  const first = createSandbox('Sandbox 1')
  return {
    sandboxes: { [first.id]: first },
    sandboxOrder: [first.id],
    activeSandboxId: first.id,
    ui: DEFAULT_UI,
  }
}

function nextSandboxName(sandboxes: Record<string, Sandbox>, base = 'Sandbox'): string {
  const names = new Set(Object.values(sandboxes).map((s) => s.name))
  let n = Object.keys(sandboxes).length + 1
  while (names.has(`${base} ${n}`)) n += 1
  return `${base} ${n}`
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => {
      /** Apply a change to one sandbox and stamp updatedAt. */
      const patchSandbox = (id: string, fn: (sandbox: Sandbox) => Partial<Sandbox>) =>
        set((state) => {
          const sandbox = state.sandboxes[id]
          if (!sandbox) return state
          const patch = fn(sandbox)
          if (Object.keys(patch).length === 0) return state
          return {
            sandboxes: {
              ...state.sandboxes,
              [id]: { ...sandbox, ...patch, updatedAt: Date.now() },
            },
          }
        })

      const patchActive = (fn: (sandbox: Sandbox) => Partial<Sandbox>) => patchSandbox(get().activeSandboxId, fn)

      const activeItems = () => get().sandboxes[get().activeSandboxId]?.items ?? []

      return {
        ...initialData(),
        selectedItemId: null,
        lastApply: null,
        docsFocus: null,
        hoveredItemId: null,
        inspect: false,
        inspectInfo: null,
        compare: 'yours',

        createSandbox: (name, init) =>
          set((state) => {
            const sandbox = createSandbox(name?.trim() || nextSandboxName(state.sandboxes), init)
            return {
              sandboxes: { ...state.sandboxes, [sandbox.id]: sandbox },
              sandboxOrder: [...state.sandboxOrder, sandbox.id],
              activeSandboxId: sandbox.id,
              selectedItemId: null,
              compare: 'yours',
            }
          }),

        switchSandbox: (id) =>
          set((state) =>
            state.sandboxes[id]
              ? { activeSandboxId: id, selectedItemId: null, lastApply: null, compare: 'yours' }
              : state,
          ),

        renameSandbox: (id, name) =>
          set((state) => {
            const sandbox = state.sandboxes[id]
            const trimmed = name.trim()
            if (!sandbox || !trimmed) return state
            return {
              sandboxes: {
                ...state.sandboxes,
                [id]: { ...sandbox, name: trimmed.slice(0, 120) },
              },
            }
          }),

        duplicateSandbox: (id) =>
          set((state) => {
            const source = state.sandboxes[id]
            if (!source) return state
            const copy = createSandbox(`${source.name} copy`, {
              items: structuredClone(source.items),
              css: source.css,
              challengeId: source.challengeId,
            })
            const index = state.sandboxOrder.indexOf(id)
            const order = [...state.sandboxOrder]
            order.splice(index + 1, 0, copy.id)
            return {
              sandboxes: { ...state.sandboxes, [copy.id]: copy },
              sandboxOrder: order,
              activeSandboxId: copy.id,
              selectedItemId: null,
            }
          }),

        deleteSandbox: (id) =>
          set((state) => {
            if (!state.sandboxes[id]) return state
            const { [id]: _removed, ...rest } = state.sandboxes
            let order = state.sandboxOrder.filter((x) => x !== id)
            let sandboxes = rest
            if (order.length === 0) {
              const fresh = createSandbox('Sandbox 1')
              sandboxes = { [fresh.id]: fresh }
              order = [fresh.id]
            }
            const oldIndex = state.sandboxOrder.indexOf(id)
            const fallback = order[Math.min(oldIndex, order.length - 1)] ?? order[0] ?? ''
            const wasActive = state.activeSandboxId === id
            return {
              sandboxes,
              sandboxOrder: order,
              activeSandboxId: wasActive ? fallback : state.activeSandboxId,
              selectedItemId: wasActive ? null : state.selectedItemId,
              compare: wasActive ? 'yours' : state.compare,
              // An Undo toast for a sandbox that no longer exists would do nothing.
              lastApply: state.lastApply?.sandboxId === id ? null : state.lastApply,
            }
          }),

        reorderSandboxes: (fromId, toId) =>
          set((state) => {
            const from = state.sandboxOrder.indexOf(fromId)
            const to = state.sandboxOrder.indexOf(toId)
            if (from === -1 || to === -1 || from === to) return state
            return { sandboxOrder: arrayMove(state.sandboxOrder, from, to) }
          }),

        resetSandbox: () => {
          patchActive(() => ({ items: starterItems(), css: STARTER_CSS }))
          set({ selectedItemId: null })
        },

        setCss: (sandboxId, css) => patchSandbox(sandboxId, (sandbox) => (sandbox.css === css ? {} : { css })),

        addItem: (tag, mode, targetId) => {
          const node = createNode(tag)
          patchActive((sandbox) => ({
            items: insertNode(sandbox.items, node, mode, targetId),
          }))
          set((state) => {
            // Make sure the new node is visible: expand its parent if it was collapsed.
            const loc = findLocation(activeItems(), node.id)
            if (loc?.parentId && state.ui.collapsed[loc.parentId]) {
              const { [loc.parentId]: _open, ...collapsed } = state.ui.collapsed
              return {
                selectedItemId: node.id,
                ui: { ...state.ui, collapsed },
              }
            }
            return { selectedItemId: node.id }
          })
          return node.id
        },

        updateItem: (id, patch) =>
          patchActive((sandbox) => ({
            items: updateNode(sandbox.items, id, patch),
          })),

        duplicateItem: (id) => {
          const { items, newId } = duplicateNode(activeItems(), id)
          if (!newId) return
          patchActive(() => ({ items }))
          set({ selectedItemId: newId })
        },

        deleteItem: (id) => {
          const items = activeItems()
          if (!findNode(items, id)) return
          const nextSelection = selectionAfterDelete(items, id)
          patchActive(() => ({ items: removeNode(items, id) }))
          set({ selectedItemId: nextSelection })
        },

        moveItem: (id, direction) =>
          patchActive((sandbox) => {
            const items = moveNode(sandbox.items, id, direction)
            return items === sandbox.items ? {} : { items }
          }),

        replaceItems: (items) => patchActive(() => ({ items })),

        tryDeclaration: (selector, property, value) =>
          patchActive((sandbox) => ({
            css: upsertDeclaration(sandbox.css, selector, property, value),
          })),

        applyExample: (example, target) => {
          const content = {
            items: instantiate(example.items),
            css: example.css,
          }
          const before = get()
          if (target === 'new') {
            get().createSandbox(example.title, content)
            set({
              lastApply: {
                kind: 'new',
                title: example.title,
                sandboxId: get().activeSandboxId,
                previousSandboxId: before.activeSandboxId,
              },
            })
            return
          }
          get().replaceContent(example.title, content)
        },

        replaceContent: (title, content) => {
          const current = get().sandboxes[get().activeSandboxId]
          if (!current) return
          patchActive(() => content)
          set({
            selectedItemId: null,
            lastApply: {
              kind: 'current',
              title,
              sandboxId: current.id,
              previous: { items: current.items, css: current.css },
            },
          })
        },

        startChallenge: (challenge) => {
          const state = get()
          const existing = state.sandboxOrder.find((id) => state.sandboxes[id]?.challengeId === challenge.id)
          if (existing) state.switchSandbox(existing)
          else {
            state.createSandbox(`Challenge: ${challenge.title}`, {
              items: instantiate(challenge.items),
              css: challenge.css,
              challengeId: challenge.id,
            })
          }
          set((s) => ({ ui: { ...s.ui, leftTab: 'challenges' } }))
        },

        setCompare: (mode) => set({ compare: mode }),

        undoApply: () => {
          const last = get().lastApply
          if (!last) return
          if (last.kind === 'current') {
            patchSandbox(last.sandboxId, () => last.previous)
            set({ lastApply: null, selectedItemId: null })
          } else {
            get().deleteSandbox(last.sandboxId)
            if (get().sandboxes[last.previousSandboxId]) get().switchSandbox(last.previousSandboxId)
            set({ lastApply: null })
          }
        },

        dismissApply: () => set({ lastApply: null }),

        focusDoc: (property) =>
          set((state) => ({
            docsFocus: property,
            ui: property ? { ...state.ui, leftTab: 'docs', mobileView: 'tree' } : state.ui,
          })),

        select: (id) => set({ selectedItemId: id }),

        revealItem: (id) =>
          set((state) => {
            const ancestors = pathTo(activeItems(), id).slice(0, -1)
            if (ancestors.length === 0 && !findNode(activeItems(), id)) return state
            const collapsed = { ...state.ui.collapsed }
            ancestors.forEach((a) => delete collapsed[a])
            return { selectedItemId: id, ui: { ...state.ui, collapsed } }
          }),

        setHovered: (id) => set((state) => (state.hoveredItemId === id ? state : { hoveredItemId: id })),

        setInspect: (inspect) => set({ inspect, hoveredItemId: null }),

        setInspectInfo: (info) => set({ inspectInfo: info }),

        toggleCollapsed: (id, collapsed) =>
          set((state) => {
            const isCollapsed = Boolean(state.ui.collapsed[id])
            const target = collapsed ?? !isCollapsed
            if (target === isCollapsed) return state
            const next = { ...state.ui.collapsed }
            if (target) next[id] = true
            else delete next[id]
            return { ui: { ...state.ui, collapsed: next } }
          }),

        setUi: (patch) => set((state) => ({ ui: { ...state.ui, ...patch } })),
      }
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({
        sandboxes: state.sandboxes,
        sandboxOrder: state.sandboxOrder,
        activeSandboxId: state.activeSandboxId,
        ui: state.ui,
      }),
      // Never trust storage: validate it, and fall back to a fresh state if it is malformed.
      merge: (persisted, current) => {
        const parsed = persistedStateSchema.safeParse(persisted)
        if (!parsed.success) {
          if (persisted !== undefined) {
            console.warn('[layout-lab] Ignoring invalid saved state', parsed.error.issues.slice(0, 3))
          }
          return current
        }
        return {
          ...current,
          ...parsed.data,
          ui: { ...DEFAULT_UI, ...parsed.data.ui, overlays: { ...DEFAULT_UI.overlays, ...parsed.data.ui.overlays } },
        }
      },
    },
  ),
)

export function useActiveSandbox(): Sandbox {
  return useStudio((state) => {
    const sandbox = state.sandboxes[state.activeSandboxId]
    if (!sandbox) throw new Error('Active sandbox is missing')
    return sandbox
  })
}
