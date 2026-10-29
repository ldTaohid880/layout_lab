import { lexer, parse } from 'css-tree'
import { describe, expect, it } from 'vitest'
import { CHALLENGES } from './challenges'
import { DOCS, DOCS_BY_PROPERTY, searchDocs } from './docs'
import { EXAMPLES } from './examples'
import { instantiate } from './instantiate'
import manifestRaw from '../../public/references/manifest.json?raw'
import { hashString, referenceKey, type ReferenceManifest } from './references'
import { LEVELS, LEVEL_LABELS } from './types'
import { lintCss } from '@/features/editor/cssLint'
import { collectElementClasses } from '@/features/tree/treeOps'
import { itemsSchema } from '@/store/schema'

describe('examples', () => {
  it('has 51 examples with unique kebab-case ids', () => {
    expect(EXAMPLES).toHaveLength(51)
    const ids = EXAMPLES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/))
  })

  describe.each(EXAMPLES.map((e) => [e.id, e] as const))('%s', (_id, example) => {
    const items = instantiate(example.items)

    it('builds a tree that passes the storage schema', () => {
      expect(itemsSchema.safeParse(items).success).toBe(true)
    })

    it('has CSS with no errors, warnings or layout hints', () => {
      const diagnostics = lintCss(example.css, { elementClasses: collectElementClasses(items) })
      expect(diagnostics.map((d) => `${d.code}: ${d.message}`)).toEqual([])
    })

    it('only names properties that have docs', () => {
      example.concepts.forEach((c) => expect(DOCS_BY_PROPERTY.has(c), c).toBe(true))
    })

    it('has explanation and try-this content', () => {
      expect(example.explanation.length).toBeGreaterThan(0)
      expect(example.tryThis.length).toBeGreaterThan(0)
    })
  })
})

describe('docs', () => {
  it('covers at least 40 unique properties', () => {
    expect(DOCS.length).toBeGreaterThanOrEqual(40)
    expect(DOCS_BY_PROPERTY.size).toBe(DOCS.length)
  })

  it('links related entries that exist', () => {
    for (const doc of DOCS)
      doc.related.forEach((r) => expect(DOCS_BY_PROPERTY.has(r), `${doc.property} → ${r}`).toBe(true))
  })

  it('only offers values the browser accepts for that property', () => {
    for (const doc of DOCS) {
      for (const { value } of doc.values) {
        const decl = parse(`${doc.property}: ${value}`, { context: 'declaration' })
        const match = lexer.matchDeclaration(decl as Parameters<typeof lexer.matchDeclaration>[0])
        expect(match.error?.message ?? null, `${doc.property}: ${value}`).toBeNull()
      }
    }
  })

  it('search ranks exact and prefix matches first', () => {
    expect(searchDocs('gap')[0]?.property).toBe('gap')
    expect(searchDocs('grid-template')[0]?.property).toMatch(/^grid-template/)
    expect(searchDocs('stacking context').map((d) => d.property)).toContain('z-index')
    expect(searchDocs('zzzz')).toEqual([])
    expect(searchDocs('')).toHaveLength(DOCS.length)
  })
})

describe('levels', () => {
  it('are one of Beginner / Intermediate / Hard, for examples and challenges', () => {
    for (const item of [...EXAMPLES, ...CHALLENGES]) expect(LEVELS, item.id).toContain(item.level)
  })

  it('every level has challenges to practise', () => {
    for (const level of LEVELS) {
      expect(CHALLENGES.filter((c) => c.level === level).length, level).toBeGreaterThan(0)
    }
  })

  it('has a label for every level', () => {
    expect(LEVELS.map((l) => LEVEL_LABELS[l])).toEqual(['Beginner', 'Intermediate', 'Hard'])
  })
})

describe('reference screenshots', () => {
  const manifest: ReferenceManifest = JSON.parse(manifestRaw)

  it('hashes deterministically and differently per input', () => {
    expect(hashString('a')).toBe(hashString('a'))
    expect(hashString('a')).not.toBe(hashString('b'))
    expect(hashString('a', 1)).not.toBe(hashString('a', 2))
  })

  it('key changes with the solution, the tree and the width', () => {
    const c = CHALLENGES[0]!
    const key = referenceKey(c, 800)
    expect(referenceKey({ ...c, solution: `${c.solution} ` }, 800)).not.toBe(key)
    expect(referenceKey({ ...c, items: [...c.items, { tag: 'div' }] }, 800)).not.toBe(key)
    expect(referenceKey(c, 375)).not.toBe(key)
  })

  describe.each(CHALLENGES.map((c) => [c.id, c] as const))('%s', (_id, challenge) => {
    it('has an up-to-date picture for every width', () => {
      for (const width of challenge.viewports) {
        expect(
          manifest[challenge.id]?.[String(width)],
          `${challenge.id} @${width}px is missing or stale: run "npm run references"`,
        ).toBe(referenceKey(challenge, width))
      }
    })
  })

  it('has no pictures for challenges that no longer exist', () => {
    const ids = new Set(CHALLENGES.map((c) => c.id))
    for (const id of Object.keys(manifest)) expect(ids.has(id), `${id}: run "npm run references"`).toBe(true)
  })
})

describe('challenges', () => {
  it('has unique ids', () => {
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(11)
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length)
  })

  describe.each(CHALLENGES.map((c) => [c.id, c] as const))('%s', (_id, challenge) => {
    const items = instantiate(challenge.items)
    it('builds a valid starter tree', () => {
      expect(itemsSchema.safeParse(items).success).toBe(true)
    })

    it('has sensible picture widths: unique, widest first, phone-to-desktop', () => {
      const widths = challenge.viewports
      expect(widths.length).toBeGreaterThan(0)
      expect(new Set(widths).size).toBe(widths.length)
      expect([...widths].sort((x, y) => y - x)).toEqual(widths)
      widths.forEach((w) => expect(w).toBeGreaterThanOrEqual(320))
      widths.forEach((w) => expect(w).toBeLessThanOrEqual(1600))
    })

    it('has starter CSS without errors or warnings', () => {
      const context = { elementClasses: collectElementClasses(items) }
      expect(lintCss(challenge.css, context).filter((d) => d.severity !== 'info')).toEqual([])
    })

    it('has a solution with no diagnostics: valid CSS, no no-op declarations, only real classes', () => {
      const context = { elementClasses: collectElementClasses(items) }
      expect(lintCss(challenge.solution, context).map((d) => d.code + ': ' + d.message)).toEqual([])
    })

    it('has a solution that builds on the starter', () => {
      expect(challenge.solution.startsWith(challenge.css.trimEnd())).toBe(true)
      expect(challenge.solution.length).toBeGreaterThan(challenge.css.length)
    })

    it('links concepts to docs and has hints', () => {
      challenge.concepts.forEach((c) => expect(DOCS_BY_PROPERTY.has(c), c).toBe(true))
      expect(challenge.hints.length).toBeGreaterThanOrEqual(2)
    })
  })
})
