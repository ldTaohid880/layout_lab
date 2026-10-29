import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TreePanel } from './TreePanel'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useStudio } from '@/store/studioStore'

const renderTree = () =>
  render(
    <TooltipProvider>
      <TreePanel />
    </TooltipProvider>,
  )

const rows = () => within(screen.getByRole('tree', { name: 'Elements' })).getAllByRole('treeitem')
const labels = () => rows().map((r) => r.getAttribute('aria-label'))

describe('TreePanel keyboard', () => {
  beforeEach(() => {
    localStorage.clear()
    const s = useStudio.getState()
    const old = [...s.sandboxOrder]
    s.createSandbox('Test')
    old.forEach((id) => useStudio.getState().deleteSandbox(id))
  })

  it('moves focus with arrows, collapses with ArrowLeft and deletes with Delete', () => {
    renderTree()
    expect(labels()).toEqual([
      'div.page',
      'header.header, text “Layout Lab”',
      'div.box',
      'div.item, text “1”',
      'div.item, text “2”',
      'div.item, text “3”',
    ])

    const tree = screen.getByRole('tree')
    fireEvent.click(rows()[2]!) // div.box
    fireEvent.keyDown(tree, { key: 'ArrowDown' })
    expect(rows()[3]).toHaveAttribute('aria-selected', 'true')
    expect(rows()[3]).toHaveFocus()

    fireEvent.keyDown(tree, { key: 'ArrowLeft' }) // leaf: go to parent
    expect(rows()[2]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(tree, { key: 'ArrowLeft' }) // collapse div.box
    expect(rows()).toHaveLength(3)
    expect(rows()[2]).toHaveAttribute('aria-expanded', 'false')

    fireEvent.keyDown(tree, { key: 'Delete' })
    expect(labels()).toEqual(['div.page', 'header.header, text “Layout Lab”'])
  })

  it('renames class names inline with Enter and reorders with Alt+Arrow', () => {
    renderTree()
    const tree = screen.getByRole('tree')
    fireEvent.click(rows()[5]!) // item 3
    fireEvent.keyDown(tree, { key: 'Enter' })
    const input = screen.getByRole('textbox', { name: 'Class names for div' })
    fireEvent.change(input, { target: { value: 'item last' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(rows()[5]).toHaveAttribute('aria-label', 'div.item.last, text “3”')

    fireEvent.keyDown(tree, { key: 'ArrowUp', altKey: true })
    expect(labels().slice(3)).toEqual(['div.item, text “1”', 'div.item.last, text “3”', 'div.item, text “2”'])

    fireEvent.keyDown(tree, { key: 'ArrowRight', altKey: true }) // nest into item 1
    expect(rows()[4]).toHaveAttribute('aria-level', '4')
  })

  it('adds a child of the chosen tag from the toolbar', () => {
    renderTree()
    fireEvent.click(rows()[2]!) // div.box
    // The tag picker is a custom select: open it from the keyboard and pick an option.
    const picker = screen.getByRole('combobox', { name: 'Tag for new elements' })
    fireEvent.keyDown(picker, { key: 'Enter' })
    fireEvent.keyDown(screen.getByRole('option', { name: /^<button>/ }), { key: 'Enter' })
    expect(picker).toHaveTextContent('<button>')
    fireEvent.click(screen.getByRole('button', { name: /Add child/ }))
    const added = rows()[6]
    expect(added).toHaveAttribute('aria-label', 'button')
    expect(added).toHaveAttribute('aria-level', '3')
    expect(added).toHaveAttribute('aria-selected', 'true')
  })
})
