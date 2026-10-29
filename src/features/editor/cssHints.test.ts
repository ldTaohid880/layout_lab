import { describe, expect, it } from 'vitest'
import { lintCss } from './cssLint'
import { upsertDeclaration } from './upsertDeclaration'

const hints = (css: string, elementClasses?: string[][]) =>
  lintCss(css, { elementClasses })
    .filter((d) => d.severity === 'info')
    .map((d) => ({ code: d.code, text: css.slice(d.from, d.to) }))

describe('layout hints', () => {
  it('flags flex/grid container properties without a flex or grid display', () => {
    expect(hints('.a { justify-content: center; }')).toEqual([{ code: 'needs-flex-or-grid', text: 'justify-content: center' }])
    expect(lintCss('.a { display: block; gap: 8px; }')[0]?.message).toMatch(/display is block/)
    expect(hints('.a { display: flex; gap: 8px; align-items: center; }')).toEqual([])
    expect(hints('.a { display: inline-grid; justify-content: end; }')).toEqual([])
  })

  it('finds display in another rule for the same selector, or a co-occurring class', () => {
    expect(hints('.a { gap: 8px } .a { display: grid }')).toEqual([])
    expect(hints('.row { display: flex } .a { gap: 8px }', [['row', 'a']])).toEqual([])
    expect(hints('.row { display: flex } .a { gap: 8px }', [['row'], ['a']])).toHaveLength(1)
  })

  it('does not flag gap in a multi-column layout', () => {
    expect(hints('.a { columns: 3; gap: 8px }')).toEqual([])
  })

  it('separates flex-only and grid-only properties', () => {
    expect(hints('.a { display: grid; flex-direction: column }')[0]?.code).toBe('needs-flex')
    expect(lintCss('.a { display: flex; grid-template-columns: 1fr 1fr }')[0]?.message).toMatch(/flex container/)
  })

  it('flags offsets and z-index on static elements', () => {
    expect(hints('.a { top: 0; z-index: 2 }').map((h) => h.code)).toEqual(['needs-position', 'z-index-static'])
    expect(hints('.a { position: static; left: 4px }')[0]?.code).toBe('needs-position')
    expect(hints('.a { position: absolute; top: 0; z-index: 2 }')).toEqual([])
    expect(hints('.layer { position: absolute } .a { z-index: 3 }', [['layer', 'a']])).toEqual([])
  })

  it('flags sticky without an offset', () => {
    expect(hints('.a { position: sticky }')[0]?.code).toBe('sticky-offset')
    expect(hints('.a { position: sticky; top: 0 }')).toEqual([])
  })

  it('flags width on inline elements', () => {
    expect(hints('.a { display: inline; width: 40px }')[0]?.code).toBe('inline-size')
  })

  it('flags classes no element has, only when the tree is known', () => {
    expect(hints('.box, .ghost:hover { color: red }', [['box']])).toEqual([{ code: 'unknown-class', text: '.ghost' }])
    expect(hints('.ghost { color: red }')).toEqual([])
  })
})

describe('upsertDeclaration', () => {
  it('replaces an existing declaration in place', () => {
    const css = '/* keep */\n.box {\n  display: block;\n  color: red;\n}\n'
    expect(upsertDeclaration(css, '.box', 'display', 'flex')).toBe('/* keep */\n.box {\n  display: flex;\n  color: red;\n}\n')
  })

  it('appends to the rule, adding a missing semicolon', () => {
    expect(upsertDeclaration('.box { color: red }', '.box', 'gap', '8px')).toBe('.box { color: red;\n  gap: 8px;\n}')
    expect(upsertDeclaration('.box {}', '.box', 'gap', '8px')).toBe('.box {\n  gap: 8px;\n}')
  })

  it('edits the last matching top-level rule, not one inside @media', () => {
    const css = '.a { color: red; }\n@media (min-width: 1px) { .a { gap: 1px; } }\n.a { margin: 0; }'
    const out = upsertDeclaration(css, '.a', 'gap', '8px')
    expect(out).toBe('.a { color: red; }\n@media (min-width: 1px) { .a { gap: 1px; } }\n.a { margin: 0;\n  gap: 8px;\n}')
  })

  it('adds a new rule when none matches', () => {
    expect(upsertDeclaration('.a { color: red; }\n', '.b', 'order', '1')).toBe('.a { color: red; }\n\n.b {\n  order: 1;\n}\n')
    expect(upsertDeclaration('', '.b', 'order', '1')).toBe('.b {\n  order: 1;\n}\n')
  })
})
