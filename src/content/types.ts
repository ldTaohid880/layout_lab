import type { TagName } from '@/types/tree'

/*
 * Typed content formats. Examples and docs are plain data checked by tests
 * (src/content/content.test.ts), so a typo fails CI instead of shipping.
 */

/** An element in an example tree. Ids are assigned when the example is applied. */
export interface ExampleNode {
  tag: TagName
  /** Space-separated class names. */
  cls?: string
  text?: string
  attrs?: Record<string, string>
  children?: ExampleNode[]
}

/** Difficulty, shared by examples and challenges. */
export type Level = 'beginner' | 'intermediate' | 'hard'

export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'hard']

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  hard: 'Hard',
}

/** The topic of an example. The Examples tab orders by the learning path (examples/path.ts) instead. */
type ExampleCategory = 'Flexbox' | 'Grid' | 'Positioning' | 'Sizing & overflow' | Exclude<Track, 'Layout'>

/** The broad areas of CSS the examples path is split into, in path order. */
export const TRACKS = [
  'Layout',
  'Typography',
  'Colour & backgrounds',
  'Borders & effects',
  'Cascade & variables',
  'Responsive',
  'Motion',
] as const

export type Track = (typeof TRACKS)[number]

export interface Example {
  /** Stable kebab-case id. */
  id: string
  title: string
  category: ExampleCategory
  level: Level
  /** One line shown in the list. */
  summary: string
  /** Properties this example teaches. Each must exist in the docs. */
  concepts: string[]
  /** Short paragraphs shown when the example is open. */
  explanation: string[]
  /** Small experiments to try after applying. */
  tryThis: string[]
  items: ExampleNode[]
  css: string
}

export type DocGroup =
  | 'Box & display'
  | 'Flex container'
  | 'Flex item'
  | 'Grid container'
  | 'Grid item'
  | 'Positioning'
  | 'Media'
  | 'Responsive'
  | 'Typography'
  | 'Colour & backgrounds'
  | 'Borders & effects'
  | 'Motion'

interface DocValue {
  value: string
  note: string
}

export interface DocEntry {
  property: string
  group: DocGroup
  /** Which element the property goes on. */
  appliesTo: string
  summary: string
  details: string
  /** Each value gets a "Try" button that writes it to the selected element's rule. */
  values: DocValue[]
  /** Common gotcha, shown highlighted. */
  gotcha?: string
  related: string[]
}

export interface Challenge {
  /** Stable kebab-case id. */
  id: string
  title: string
  level: Level
  /** One line shown in the list. */
  summary: string
  /** The task, in short paragraphs. */
  brief: string[]
  /** Properties that help. Each must exist in the docs. */
  concepts: string[]
  /** Revealed one at a time, from a nudge to nearly the answer. */
  hints: string[]
  items: ExampleNode[]
  /** Starter CSS: cosmetics only, the layout is the learner's job. */
  css: string
  /** A complete stylesheet that produces the target layout. */
  solution: string
  /** Why the solution works, shown with it. */
  solutionNotes: string
  /**
   * Viewport widths (px, widest first) of the reference pictures. Use the widths the layout
   * changes at, e.g. [800, 375] for a design that restacks on phones.
   */
  viewports: number[]
  /** A drawing, poster or design rather than a layout drill. Shows a Creative badge and filter. */
  creative?: true
}

export const CHALLENGE_KINDS = ['layout', 'creative'] as const
export type ChallengeKind = (typeof CHALLENGE_KINDS)[number]
export const CHALLENGE_KIND_LABELS: Record<ChallengeKind, string> = { layout: 'Layout', creative: 'Creative' }
