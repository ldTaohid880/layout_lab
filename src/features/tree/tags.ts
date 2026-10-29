import type { TagName } from '@/types/tree'

/** Tags that cannot contain children or text in the generated markup. */
export const VOID_TAGS: ReadonlySet<TagName> = new Set(['img'])

export function canHaveChildren(tag: TagName): boolean {
  return !VOID_TAGS.has(tag)
}

export const TAG_HINTS: Record<TagName, string> = {
  div: 'Generic block container',
  section: 'Thematic grouping (block)',
  article: 'Self-contained content (block)',
  aside: 'Side content, e.g. a sidebar (block)',
  header: 'Introductory content (block)',
  nav: 'Navigation links (block)',
  main: 'Main content (block)',
  footer: 'Footer (block)',
  h2: 'Section heading (block)',
  h3: 'Sub-heading (block)',
  p: 'Paragraph (block)',
  span: 'Generic inline container',
  button: 'Button (inline-block)',
  a: 'Link (inline)',
  img: 'Image: placeholder, or an https URL (inline, replaced)',
  ul: 'Unordered list (block)',
  li: 'List item (list-item)',
}

/** A valid CSS class identifier (no escapes): what the class-name field accepts. */
export const CLASS_NAME_RE = /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/

export function parseClassList(input: string): { classes: string[]; invalid: string[] } {
  const tokens = input
    .split(/[\s.,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
  const classes: string[] = []
  const invalid: string[] = []
  for (const token of tokens) {
    if (!CLASS_NAME_RE.test(token)) invalid.push(token)
    else if (!classes.includes(token)) classes.push(token)
  }
  return { classes, invalid }
}

/** Attribute names a learner may set. Event handlers, src and style are never accepted. */
const ATTR_NAME_RE = /^(?:id|title|href|alt|role|type|lang|dir|tabindex|hidden|aria-[a-z-]+|data-[a-z0-9-]+)$/

export function isAllowedAttr(name: string): boolean {
  return ATTR_NAME_RE.test(name) && name !== 'data-ll-id'
}
