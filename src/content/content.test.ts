import { lexer, parse } from 'css-tree'
import { describe, expect, it } from 'vitest'
import { CHALLENGES, CHALLENGE_FILES } from './challenges'
import { CHALLENGE_ORDER } from './challenges/order'
import { DOCS, DOCS_BY_PROPERTY, DOC_FILES, DOC_GROUPS, searchDocs } from './docs'
import { DOC_ORDER } from './docs/order'
import { EXAMPLES, EXAMPLES_BY_ID, EXAMPLE_MODULES } from './examples'
import { EXAMPLE_PATH } from './examples/path'
import { instantiate } from './instantiate'
import manifestRaw from '../../public/references/manifest.json?raw'
import { hashString, referenceKey, type ReferenceManifest } from './references'
import { LEVELS, LEVEL_LABELS, TRACKS } from './types'
import { lintCss } from '@/features/editor/cssLint'
import { collectElementClasses } from '@/features/tree/treeOps'
import { itemsSchema } from '@/store/schema'

describe('examples', () => {
  it('has at least 55 examples with unique kebab-case ids', () => {
    expect(EXAMPLES.length).toBeGreaterThanOrEqual(55)
    const ids = EXAMPLES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/))
  })

  describe('learning path', () => {
    const pathIds = EXAMPLE_PATH.flatMap((m) => m.examples)

    it('places every example file exactly once', () => {
      const missing = [...EXAMPLES_BY_ID.keys()].filter((id) => !pathIds.includes(id))
      expect(missing, 'examples not in path.ts').toEqual([])
      const repeated = pathIds.filter((id, i) => pathIds.indexOf(id) !== i)
      expect(repeated, 'examples listed twice').toEqual([])
    })

    it('only names examples that exist', () => {
      pathIds.forEach((id) => expect(EXAMPLES_BY_ID.has(id), id).toBe(true))
    })

    it('keeps each track in one block, in TRACKS order', () => {
      const order = EXAMPLE_PATH.map((m) => TRACKS.indexOf(m.track))
      order.forEach((i, m) => expect(i, EXAMPLE_PATH[m]!.id).toBeGreaterThanOrEqual(0))
      expect(order).toEqual([...order].sort((a, b) => a - b))
    })

    it('has unique module ids and no empty modules', () => {
      expect(new Set(EXAMPLE_PATH.map((m) => m.id)).size).toBe(EXAMPLE_PATH.length)
      EXAMPLE_PATH.forEach((m) => expect(m.examples.length, m.id).toBeGreaterThan(0))
    })

    it('goes from beginner to hard inside each module', () => {
      for (const module of EXAMPLE_MODULES) {
        const ranks = module.lessons.map((l) => LEVELS.indexOf(l.example.level))
        expect(ranks, module.id).toEqual([...ranks].sort((a, b) => a - b))
      }
    })

    it('numbers lessons by module and position', () => {
      expect(EXAMPLE_MODULES[0]!.lessons[0]!.number).toBe('1.1')
      expect(EXAMPLE_MODULES[1]!.lessons[2]!.number).toBe('2.3')
    })
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

  it('lists every doc file exactly once, under its own group', () => {
    const listed = DOC_GROUPS.flatMap((group) => DOC_ORDER[group])
    const missing = [...DOC_FILES.keys()].filter((p) => !listed.includes(p))
    expect(missing, 'docs not in docs/order.ts').toEqual([])
    const repeated = listed.filter((p, i) => listed.indexOf(p) !== i)
    expect(repeated, 'docs listed twice').toEqual([])
    for (const group of DOC_GROUPS)
      for (const property of DOC_ORDER[group]) {
        expect(DOC_FILES.has(property), `docs/order.ts names a missing file: ${property}`).toBe(true)
        expect(DOC_FILES.get(property)?.group, property).toBe(group)
      }
  })

  it('names each file after its property', () => {
    const files = Object.keys(import.meta.glob('./docs/*.json')).map((f) => f.slice('./docs/'.length, -5))
    expect(files.sort()).toEqual(DOCS.map((d) => d.property).sort())
  })

  it('links related entries that exist', () => {
    for (const doc of DOCS)
      doc.related.forEach((r) => expect(DOCS_BY_PROPERTY.has(r), `${doc.property} → ${r}`).toBe(true))
  })

  it('only offers values the browser accepts for that property', () => {
    for (const doc of DOCS) {
      for (const { value } of doc.values) {
        const decl = parse(`${doc.property}: ${value}`, { context: 'declaration' })
        const match = lexer.matchDeclaration(decl)
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
  const manifest = JSON.parse(manifestRaw) as ReferenceManifest

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

  it('lists every challenge file exactly once in order.ts', () => {
    const missing = [...CHALLENGE_FILES.keys()].filter((id) => !CHALLENGE_ORDER.includes(id))
    expect(missing, 'challenges not in challenges/order.ts').toEqual([])
    const repeated = CHALLENGE_ORDER.filter((id, i) => CHALLENGE_ORDER.indexOf(id) !== i)
    expect(repeated, 'challenges listed twice').toEqual([])
    const unknown = CHALLENGE_ORDER.filter((id) => !CHALLENGE_FILES.has(id))
    expect(unknown, 'challenges/order.ts names a missing file').toEqual([])
  })

  it('names each file after its id', () => {
    const files = Object.keys(import.meta.glob('./challenges/*.json')).map((f) => f.slice('./challenges/'.length, -5))
    expect(files.sort()).toEqual(CHALLENGES.map((c) => c.id).sort())
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
