export const TAG_NAMES = [
  'div',
  'section',
  'article',
  'aside',
  'header',
  'nav',
  'main',
  'footer',
  'h2',
  'h3',
  'p',
  'span',
  'button',
  'a',
  'img',
  'ul',
  'li',
] as const

export type TagName = (typeof TAG_NAMES)[number]

/** One element in the learner's tree. Markup is always generated from this, never from raw HTML. */
export interface TreeItem {
  id: string
  tag: TagName
  classes: string[]
  text: string
  attrs: Record<string, string>
}

export interface TreeNode extends TreeItem {
  children: TreeNode[]
}

export type AddMode = 'child' | 'sibling' | 'root'

export type MoveDirection = 'up' | 'down' | 'indent' | 'outdent'
