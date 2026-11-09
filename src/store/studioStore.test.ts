import { beforeEach, describe, expect, it, vi } from 'vitest'
import { persistedStateSchema } from './schema'
import { STORAGE_KEY, useStudio } from './studioStore'
import { loadExamples } from '@/content/examples'
import { findNode } from '@/features/tree/treeOps'

const { EXAMPLES } = await loadExamples()

const state = () => useStudio.getState()
const active = () => state().sandboxes[state().activeSandboxId]!

describe('studio store', () => {
  beforeEach(() => {
    localStorage.clear()
    // Start every test from a single fresh sandbox.
    const ids = [...state().sandboxOrder]
    state().createSandbox('Fresh')
    ids.forEach((id) => state().deleteSandbox(id))
  })

  it('adds, edits and deletes items in the active sandbox', () => {
    const id = state().addItem('section', 'root', null)
    expect(state().selectedItemId).toBe(id)
    state().updateItem(id, { classes: ['hero'] })
    expect(findNode(active().items, id)?.classes).toEqual(['hero'])
    state().deleteItem(id)
    expect(findNode(active().items, id)).toBeUndefined()
  })

  it('writes CSS only to the sandbox it was typed in', () => {
    const first = state().activeSandboxId
    state().createSandbox('Second')
    state().setCss(first, '.late { color: red }')
    expect(state().sandboxes[first]?.css).toBe('.late { color: red }')
    expect(active().css).not.toContain('.late')
  })

  it('manages multiple named sandboxes', () => {
    state().createSandbox('Grid practice')
    expect(active().name).toBe('Grid practice')
    state().renameSandbox(active().id, '  Flex  ')
    expect(active().name).toBe('Flex')
    state().duplicateSandbox(active().id)
    expect(active().name).toBe('Flex copy')
    expect(state().sandboxOrder).toHaveLength(3)
  })

  it('always keeps at least one sandbox', () => {
    state().deleteSandbox(state().activeSandboxId)
    expect(state().sandboxOrder).toHaveLength(1)
    expect(active()).toBeDefined()
  })

  it('reset restores the starter content of the active sandbox only', () => {
    state().setCss(state().activeSandboxId, '')
    state().resetSandbox()
    expect(active().css).toContain('.box')
    expect(active().items.length).toBeGreaterThan(0)
  })

  it('persists a payload that passes schema validation', () => {
    state().addItem('nav', 'root', null)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const saved = JSON.parse(raw!) as { state: unknown; version: number }
    expect(saved.version).toBe(1)
    expect(persistedStateSchema.safeParse(saved.state).success).toBe(true)
  })

  it('rejects malformed saved state', () => {
    const bad = { sandboxes: {}, sandboxOrder: ['x'], activeSandboxId: 'x', ui: {} }
    expect(persistedStateSchema.safeParse(bad).success).toBe(false)
  })

  it('falls back to defaults when stored data is malformed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { sandboxes: 'nope' }, version: 1 }))
    const before = state().activeSandboxId
    await useStudio.persist.rehydrate()
    expect(state().activeSandboxId).toBe(before)
    expect(active()).toBeDefined()
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})

describe('examples and try-it', () => {
  beforeEach(() => {
    localStorage.clear()
    const ids = [...state().sandboxOrder]
    state().createSandbox('Fresh')
    ids.forEach((id) => state().deleteSandbox(id))
  })

  it('applies an example to the current sandbox and undoes it', () => {
    const before = active()
    const example = EXAMPLES.find((e) => e.id === 'card-grid')!
    state().applyExample(example, 'current')
    expect(active().css).toBe(example.css)
    expect(active().items[0]?.classes).toEqual(['grid'])
    expect(state().lastApply?.title).toBe(example.title)

    state().undoApply()
    expect(active().css).toBe(before.css)
    expect(active().items).toBe(before.items)
    expect(state().lastApply).toBeNull()
  })

  it('opens an example in a new sandbox; undo removes it and goes back', () => {
    const original = state().activeSandboxId
    state().applyExample(EXAMPLES[0]!, 'new')
    expect(state().sandboxOrder).toHaveLength(2)
    expect(active().name).toBe(EXAMPLES[0]!.title)
    state().undoApply()
    expect(state().sandboxOrder).toEqual([original])
    expect(state().activeSandboxId).toBe(original)
  })

  it('switching sandboxes drops the pending undo', () => {
    state().applyExample(EXAMPLES[0]!, 'current')
    state().createSandbox('Other')
    state().switchSandbox(state().sandboxOrder[0]!)
    expect(state().lastApply).toBeNull()
  })

  it('tryDeclaration writes into the rule for the selector', () => {
    state().tryDeclaration('.box', 'justify-content', 'center')
    expect(active().css).toMatch(/\.box \{[^}]*justify-content: center;\n\}/)
  })

  it('focusDoc switches the left pane to docs', () => {
    state().focusDoc('gap')
    expect(state().ui.leftTab).toBe('docs')
    expect(state().docsFocus).toBe('gap')
  })
})

describe('inspection state', () => {
  it('loads state saved before overlays existed, with default overlays', async () => {
    const id = 'nold00001'
    const old = {
      state: {
        sandboxes: { [id]: { id, name: 'Old', items: [], css: '', createdAt: 1, updatedAt: 1 } },
        sandboxOrder: [id],
        activeSandboxId: id,
        ui: {
          theme: 'dark',
          previewWidth: null,
          previewBg: 'white',
          mobileView: 'preview',
          leftTab: 'items',
          collapsed: {},
        },
      },
      version: 1,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(old))
    await useStudio.persist.rehydrate()
    expect(state().activeSandboxId).toBe(id)
    expect(state().ui.theme).toBe('dark')
    expect(state().ui.overlays).toEqual({ box: true, layout: true, axes: true, outlines: false })
  })

  it('revealItem selects a node and expands its collapsed ancestors', () => {
    state().createSandbox('Reveal')
    const page = active().items[0]!
    const box = page.children[1]!
    const item = box.children[0]!
    state().toggleCollapsed(page.id, true)
    state().toggleCollapsed(box.id, true)
    state().revealItem(item.id)
    expect(state().selectedItemId).toBe(item.id)
    expect(state().ui.collapsed[page.id]).toBeUndefined()
    expect(state().ui.collapsed[box.id]).toBeUndefined()
  })

  it('leaving inspect mode clears the hover', () => {
    state().setInspect(true)
    state().setHovered('x')
    state().setInspect(false)
    expect(state().hoveredItemId).toBeNull()
  })
})

describe('sandbox tabs', () => {
  beforeEach(() => {
    localStorage.clear()
    const ids = [...state().sandboxOrder]
    state().createSandbox('A')
    ids.forEach((id) => state().deleteSandbox(id))
    state().createSandbox('B')
    state().createSandbox('C')
  })

  const orderNames = () => state().sandboxOrder.map((id) => state().sandboxes[id]?.name)

  it("reorderSandboxes moves a tab to another tab's position", () => {
    const [a, , c] = state().sandboxOrder as [string, string, string]
    expect(orderNames()).toEqual(['A', 'B', 'C'])
    state().reorderSandboxes(a, c)
    expect(orderNames()).toEqual(['B', 'C', 'A'])
    state().reorderSandboxes(a, state().sandboxOrder[0]!)
    expect(orderNames()).toEqual(['A', 'B', 'C'])
  })

  it('reorderSandboxes ignores unknown ids and no-op moves', () => {
    const before = state().sandboxOrder
    state().reorderSandboxes('nope', before[0]!)
    state().reorderSandboxes(before[0]!, 'nope')
    state().reorderSandboxes(before[1]!, before[1]!)
    expect(state().sandboxOrder).toBe(before)
  })

  it('does not change which sandbox is active', () => {
    const active = state().activeSandboxId
    state().reorderSandboxes(state().sandboxOrder[0]!, state().sandboxOrder[2]!)
    expect(state().activeSandboxId).toBe(active)
  })

  it('deleting the active sandbox activates a neighbour and resets compare', () => {
    state().setCompare('diff')
    state().deleteSandbox(state().activeSandboxId) // C, the last tab
    expect(orderNames()).toEqual(['A', 'B'])
    expect(active().name).toBe('B')
    expect(state().compare).toBe('yours')
  })

  it('deleting a sandbox drops an Undo toast that pointed at it', () => {
    state().applyExample(EXAMPLES[0]!, 'current')
    expect(state().lastApply).not.toBeNull()
    state().deleteSandbox(state().activeSandboxId)
    expect(state().lastApply).toBeNull()
  })

  it('a never-edited sandbox has updatedAt equal to createdAt; editing moves it forward', async () => {
    const sandbox = active()
    expect(sandbox.updatedAt).toBe(sandbox.createdAt)
    await new Promise((r) => setTimeout(r, 5))
    state().setCss(sandbox.id, '.x { color: red }')
    expect(active().updatedAt).toBeGreaterThan(active().createdAt)
  })
})

describe('first visit', () => {
  it('saves the new sandbox straight away, so its URL survives an immediate refresh', async () => {
    localStorage.clear()
    vi.resetModules()
    const { useStudio: fresh, STORAGE_KEY: key } = await import('./studioStore')
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as { state: { activeSandboxId: string } } | null
    expect(saved?.state.activeSandboxId).toBe(fresh.getState().activeSandboxId)
  })
})
