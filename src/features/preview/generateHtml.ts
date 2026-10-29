import { CLASS_NAME_RE, VOID_TAGS, isAllowedAttr } from '@/features/tree/tags'
import type { PreviewBackground } from '@/types/sandbox'
import type { TreeNode } from '@/types/tree'

/*
 * Markup is built only from the typed tree: tags come from a fixed union, class names and
 * attribute names are validated, and every text/attribute value is escaped. No user HTML
 * string is ever injected.
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch)
}

/** Allow only http(s), mailto, fragment and relative links; anything else becomes "#". */
export function sanitizeHref(value: string): string {
  const trimmed = value.trim()
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return '#'
  return trimmed === '' ? '#' : trimmed
}

/**
 * An image address the preview may load: an absolute https URL with a host and no embedded
 * credentials. Anything else (http, data:, javascript:, protocol-relative, relative) is rejected
 * and the placeholder is used instead. Returns the normalised URL, or null.
 */
export function sanitizeImageSrc(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 2000) return null
  // Reject whitespace and control characters outright: URL parsing would silently strip some.
  if (/[\s\u0000-\u001f\u007f]/.test(trimmed)) return null
  // A host must follow "https://" directly: URL parsing would otherwise read "https:///a.png"
  // as host "a.png". Backslashes are treated as slashes by URL parsing, so they are refused too.
  if (!/^https:\/\/[^/\\]/i.test(trimmed) || trimmed.includes('\\')) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' || url.hostname === '' || url.username || url.password) return null
    return url.href
  } catch {
    return null
  }
}

/** Neutral placeholder so <img> elements have intrinsic size without any network request. */
export const PLACEHOLDER_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100">' +
      '<rect width="160" height="100" fill="#d4d4d8"/>' +
      '<path d="M0 100 L56 46 L92 80 L116 60 L160 100 Z" fill="#a1a1aa"/>' +
      '<circle cx="118" cy="30" r="10" fill="#a1a1aa"/></svg>',
  )

export interface HtmlOptions {
  /** Add data-ll-id attributes so the preview can map elements back to tree items. */
  withIds?: boolean
  /** Pretty-print with two-space indentation. */
  pretty?: boolean
}

function renderAttributes(node: TreeNode, withIds: boolean): string {
  const parts: string[] = []
  const classes = node.classes.filter((c) => CLASS_NAME_RE.test(c))
  if (classes.length) parts.push(`class="${escapeHtml(classes.join(' '))}"`)

  for (const [name, raw] of Object.entries(node.attrs)) {
    const key = name.toLowerCase()
    if (!isAllowedAttr(key)) continue
    const value = key === 'href' ? sanitizeHref(raw) : raw
    parts.push(`${key}="${escapeHtml(value)}"`)
  }

  if (node.tag === 'img') {
    // `src` is never copied from attrs generically: it goes through the https-only check here.
    const remote = sanitizeImageSrc(node.attrs.src ?? '')
    parts.push(`src="${escapeHtml(remote ?? PLACEHOLDER_IMG)}"`)
    if (remote) parts.push('referrerpolicy="no-referrer"')
    if (!('alt' in node.attrs)) parts.push('alt=""')
  }
  if (node.tag === 'button' && !('type' in node.attrs)) parts.push('type="button"')
  if (withIds) parts.push(`data-ll-id="${escapeHtml(node.id)}"`)

  return parts.length ? ' ' + parts.join(' ') : ''
}

function renderNode(node: TreeNode, depth: number, opts: Required<HtmlOptions>): string {
  const pad = opts.pretty ? '  '.repeat(depth) : ''
  const nl = opts.pretty ? '\n' : ''
  const open = `<${node.tag}${renderAttributes(node, opts.withIds)}>`
  if (VOID_TAGS.has(node.tag)) return `${pad}${open}`

  const text = escapeHtml(node.text)
  if (node.children.length === 0) return `${pad}${open}${text}</${node.tag}>`

  const inner = node.children.map((child) => renderNode(child, depth + 1, opts)).join(nl)
  const textLine = text ? `${opts.pretty ? '  '.repeat(depth + 1) : ''}${text}${nl}` : ''
  return `${pad}${open}${nl}${textLine}${inner}${nl}${pad}</${node.tag}>`
}

export function generateBodyHtml(items: TreeNode[], options: HtmlOptions = {}): string {
  const opts: Required<HtmlOptions> = { withIds: options.withIds ?? true, pretty: options.pretty ?? true }
  return items.map((node) => renderNode(node, 0, opts)).join(opts.pretty ? '\n' : '')
}

/** Text inside <style> cannot be HTML-escaped, but it must never close the element early. */
export function escapeStyleText(css: string): string {
  return css.replace(/<\/(style)/gi, '<\\/$1')
}

/** Same rule for the runtime script: it must never contain a closing script tag. */
function escapeScriptText(js: string): string {
  return js.replace(/<\/(script)/gi, '<\\/$1')
}

/*
 * Base styles live in their own <style> before the user's, with element-level specificity, so
 * any user rule wins. They only set the preview background chosen in the toolbar.
 */
const BASE_CSS = `
html{background:#fff;color-scheme:light}
html[data-ll-bg="dark"]{background:#18181b;color-scheme:dark}
html[data-ll-bg="checker"]{background:#fff conic-gradient(#ececef 25%,#fff 0 50%,#ececef 0 75%,#fff 0) 0 0/16px 16px}
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
`.trim()

/**
 * The preview document's CSP: only our inline runtime and styles run, and the only thing that may
 * load from outside is an image over https (an <img src>, or `url()` in the learner's CSS).
 * Scripts, fonts, frames, forms and connections stay blocked.
 */
const PREVIEW_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: https:; font-src data:"

export interface SrcDocInput {
  items: TreeNode[]
  css: string
  bg: PreviewBackground
  runtime: string
}

export function buildSrcDoc({ items, css, bg, runtime }: SrcDocInput): string {
  return [
    '<!doctype html>',
    `<html lang="en" data-ll-bg="${escapeHtml(bg)}">`,
    '<head>',
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`,
    // Image hosts should not learn where the request came from.
    '<meta name="referrer" content="no-referrer">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<style id="ll-base">${BASE_CSS}</style>`,
    `<style id="ll-user-css">${escapeStyleText(css)}</style>`,
    '</head>',
    '<body>',
    generateBodyHtml(items),
    `<script>${escapeScriptText(runtime)}</script>`,
    '</body>',
    '</html>',
  ].join('\n')
}
