import type { Example, Track } from '../types'
import { EXAMPLE_PATH } from './path'

/*
 * One JSON file per guided example. Adding a file here adds it to the Examples tab once its id
 * is placed in path.ts; the content tests (src/content/content.test.ts) check each one and
 * that every example is on the path exactly once.
 */
const files = import.meta.glob<Example>('./*.json', { eager: true, import: 'default' })

/** Every example file, by id, whether or not it is on the path. */
export const EXAMPLES_BY_ID: ReadonlyMap<string, Example> = new Map(
  Object.values(files).map((example) => [example.id, example]),
)

export interface PathLesson {
  example: Example
  /** "module.position", e.g. "2.3". */
  number: string
}

export interface ResolvedModule {
  id: string
  track: Track
  number: number
  title: string
  blurb: string
  lessons: PathLesson[]
}

export const EXAMPLE_MODULES: ResolvedModule[] = EXAMPLE_PATH.map((module, m) => ({
  id: module.id,
  track: module.track,
  number: m + 1,
  title: module.title,
  blurb: module.blurb,
  lessons: module.examples.flatMap((id, i) => {
    const example = EXAMPLES_BY_ID.get(id)
    return example ? [{ example, number: `${m + 1}.${i + 1}` }] : []
  }),
}))

/** All examples on the path, in learning order. */
export const EXAMPLES: Example[] = EXAMPLE_MODULES.flatMap((module) => module.lessons.map((l) => l.example))
