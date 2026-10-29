import { describe, expect, it } from 'vitest'
import { lintCss } from './cssLint'

const codes = (css: string) => lintCss(css).map((d) => d.code)
/** Validity only: layout hints (info) are covered in cssHints.test.ts. */
const problems = (css: string) => lintCss(css).filter((d) => d.severity !== 'info')

describe('lintCss', () => {
  it('accepts valid modern layout CSS', () => {
    expect(
      problems(`.box { display: flex; gap: 12px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); inset: 0; aspect-ratio: 16 / 9; }
.v { --space: 4px; padding: var(--space); width: calc(100% - 2rem); }`),
    ).toEqual([])
  })

  it('flags unknown properties on the property name only', () => {
    const css = '.a { colr: red; }'
    const [d] = lintCss(css)
    expect(d?.code).toBe('unknown-property')
    expect(css.slice(d!.from, d!.to)).toBe('colr')
  })

  it('flags invalid and missing values', () => {
    expect(lintCss('.a { display: flexx; }')[0]).toMatchObject({ code: 'invalid-value', message: 'Invalid value for "display"' })
    expect(lintCss('.a { color: ; }')[0]).toMatchObject({ code: 'invalid-value', message: 'Missing value for "color"' })
  })

  it('reports unbalanced braces', () => {
    expect(codes('.a { color: red;')).toContain('unclosed-block')
    expect(codes('.a { color: red; } }')).toContain('unexpected-brace')
  })

  it('ignores braces inside comments and strings', () => {
    expect(problems('/* { */ .a::before { content: "}"; }')).toEqual([])
  })

  it('reports an unclosed comment', () => {
    expect(codes('.a {} /* oops')).toContain('unclosed-comment')
  })
})
