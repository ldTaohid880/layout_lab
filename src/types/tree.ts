export const TAG_NAMES = [
  'div',
  'section',
  'article',
  'aside',
  'header',
  'nav',
  'main',
  'footer',
  'h1',
  'h2',
  'h3',
  'p',
  'blockquote',
  'span',
  'strong',
  'em',
  'small',
  'code',
  'button',
  'a',
  'img',
  'hr',
  'ul',
  'ol',
  'li',
  'figure',
  'figcaption',
  'form',
  'label',
  'input',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
] as const

export type TagName = (typeof TAG_NAMES)[number]

/** One element in the learner's tree. Markup is always generated from this, never from raw HTML. */
interface TreeItem {
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
