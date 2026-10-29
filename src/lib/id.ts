import { customAlphabet } from 'nanoid'

/** Short, attribute-safe ids (lowercase alphanumerics, never starting with a digit). */
const tail = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 9)

export function newId(): string {
  return `n${tail()}`
}
