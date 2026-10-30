import type { DocEntry, DocGroup } from '../types'
import { DOC_ORDER } from './order'

/*
 * One JSON file per property, named after it. Adding a file here adds it to the Docs tab once
 * the property is listed under its group in order.ts; the content tests check each one.
 */
const files = import.meta.glob<DocEntry>('./*.json', { eager: true, import: 'default' })

/** Every doc file by property, whether or not it is in order.ts. */
export const DOC_FILES: ReadonlyMap<string, DocEntry> = new Map(Object.values(files).map((d) => [d.property, d]))

export const DOC_GROUPS: DocGroup[] = [
  'Box & display',
  'Flex container',
  'Flex item',
  'Grid container',
  'Grid item',
  'Positioning',
  'Media',
  'Typography',
  'Colour & backgrounds',
  'Borders & effects',
  'Responsive',
  'Motion',
]

export const DOCS: DocEntry[] = DOC_GROUPS.flatMap((group) =>
  DOC_ORDER[group].flatMap((property) => DOC_FILES.get(property) ?? []),
)

export const DOCS_BY_PROPERTY: ReadonlyMap<string, DocEntry> = new Map(DOCS.map((d) => [d.property, d]))

/** Case-insensitive search over property, group and text; every word must match. */
export function searchDocs(query: string): DocEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return DOCS
  const scored = DOCS.map((doc) => {
    const prop = doc.property.toLowerCase()
    const hay = [prop, doc.group, doc.summary, doc.details, doc.appliesTo, ...doc.values.map((v) => v.value)]
      .join(' ')
      .toLowerCase()
    if (!words.every((w) => hay.includes(w))) return null
    const q = words.join(' ')
    const score = prop === q ? 0 : prop.startsWith(q) ? 1 : prop.includes(q) ? 2 : 3
    return { doc, score }
  }).filter((x): x is { doc: DocEntry; score: number } => x !== null)
  return scored.sort((a, b) => a.score - b.score).map((x) => x.doc)
}
