import type { Example } from '../types'

/*
 * One JSON file per guided example. Adding a file here adds it to the Examples tab;
 * the content tests (src/content/content.test.ts) check each one.
 * Files load in filename order, which the tab's category filters keep.
 */
const files = import.meta.glob<Example>('./*.json', { eager: true, import: 'default' })

export const EXAMPLES: Example[] = Object.keys(files)
  .sort()
  .map((path) => files[path]!)
