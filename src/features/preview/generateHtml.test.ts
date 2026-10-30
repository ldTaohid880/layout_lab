import { describe, expect, it } from 'vitest'
import {
  buildSrcDoc,
  escapeHtml,
  escapeStyleText,
  generateBodyHtml,
  sanitizeHref,
  sanitizeImageSrc,
} from './generateHtml'
import type { TreeNode } from '@/types/tree'

const node = (partial: Partial<TreeNode> & Pick<TreeNode, 'id' | 'tag'>): TreeNode => ({
  classes: [],
  text: '',
  attrs: {},
  children: [],
  ...partial,
})

describe('generateBodyHtml', () => {
  it('renders nested elements with classes, text and ids', () => {
    const html = generateBodyHtml(
      [
        node({
          id: 'a',
          tag: 'div',
          classes: ['box'],
          children: [node({ id: 'b', tag: 'p', text: 'Hello' }), node({ id: 'c', tag: 'span' })],
        }),
      ],
      { pretty: true },
    )
    expect(html).toBe(
      [
        '<div class="box" data-ll-id="a">',
        '  <p data-ll-id="b">Hello</p>',
        '  <span data-ll-id="c"></span>',
        '</div>',
      ].join('\n'),
    )
  })

  it('can omit ids and pretty printing', () => {
    expect(generateBodyHtml([node({ id: 'a', tag: 'section', text: 'x' })], { withIds: false, pretty: false })).toBe(
      '<section>x</section>',
    )
  })

  it('escapes text and attribute values', () => {
    const html = generateBodyHtml(
      [node({ id: 'a', tag: 'p', text: '<script>alert(1)</script> & "q"', attrs: { title: '"><img onerror=x>' } })],
      { withIds: false },
    )
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;q&quot;')
    expect(html).toContain('title="&quot;&gt;&lt;img onerror=x&gt;"')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
  })

  it('drops disallowed attributes and invalid class names', () => {
    const html = generateBodyHtml(
      [
        node({
          id: 'a',
          tag: 'div',
          classes: ['ok', 'bad"class', '1bad'],
          attrs: { onclick: 'x()', style: 'color:red', src: 'http://evil', 'data-x': '1', 'aria-label': 'L' },
        }),
      ],
      { withIds: false },
    )
    expect(html).toBe('<div class="ok" data-x="1" aria-label="L"></div>')
  })

  it('neutralises javascript: links', () => {
    const html = generateBodyHtml([node({ id: 'a', tag: 'a', attrs: { href: 'javascript:alert(1)' } })], {
      withIds: false,
    })
    expect(html).toBe('<a href="#"></a>')
  })

  it('renders img as a void element with a data: placeholder and empty alt', () => {
    const html = generateBodyHtml([node({ id: 'a', tag: 'img', text: 'ignored' })], { withIds: false })
    expect(html).toMatch(/^<img src="data:image\/svg\+xml,[^"]+" alt="">$/)
  })

  it('renders input as a void element with its form attributes and no children', () => {
    const html = generateBodyHtml(
      [node({ id: 'a', tag: 'input', text: 'ignored', attrs: { type: 'email', placeholder: 'you@example.com' } })],
      { withIds: false },
    )
    expect(html).toBe('<input type="email" placeholder="you@example.com">')
  })

  it('keeps label, table and cell attributes but drops unknown ones', () => {
    const html = generateBodyHtml(
      [
        node({ id: 'a', tag: 'label', attrs: { for: 'q', onclick: 'x()' }, text: 'Name' }),
        node({ id: 'b', tag: 'td', attrs: { colspan: '2', rowspan: '3' } }),
      ],
      { withIds: false, pretty: false },
    )
    expect(html).toBe('<label for="q">Name</label><td colspan="2" rowspan="3"></td>')
  })

  it('gives buttons type="button" by default', () => {
    expect(generateBodyHtml([node({ id: 'a', tag: 'button', text: 'Go' })], { withIds: false })).toBe(
      '<button type="button">Go</button>',
    )
  })
})

describe('helpers', () => {
  it('escapeHtml covers the five special characters', () => {
    expect(escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;')
  })

  it('sanitizeHref keeps safe links', () => {
    expect(sanitizeHref('https://example.com')).toBe('https://example.com')
    expect(sanitizeHref('#top')).toBe('#top')
    expect(sanitizeHref('/page')).toBe('/page')
    expect(sanitizeHref(' JavaScript:alert(1)')).toBe('#')
    expect(sanitizeHref('data:text/html,x')).toBe('#')
  })

  it('escapeStyleText prevents closing the style element', () => {
    expect(escapeStyleText('a{}</style><script>x</script>')).toBe('a{}<\\/style><script>x</script>')
    expect(escapeStyleText('a{}</STYLE >')).toBe('a{}<\\/STYLE >')
  })
})

describe('buildSrcDoc', () => {
  const doc = buildSrcDoc({
    items: [node({ id: 'a', tag: 'div', classes: ['box'] })],
    css: '.box{display:flex}</style><b>',
    bg: 'checker',
    runtime: 'void 0',
  })

  it('injects user CSS into its own style tag, escaped', () => {
    expect(doc).toContain('<style id="ll-user-css">.box{display:flex}<\\/style><b></style>')
  })

  it('locks the document down with a CSP and sets the background', () => {
    expect(doc).toContain("default-src 'none'")
    expect(doc).toContain('data-ll-bg="checker"')
  })

  it('includes the body markup and the runtime', () => {
    expect(doc).toContain('<div class="box" data-ll-id="a"></div>')
    expect(doc).toContain('<script>void 0</script>')
  })
})

describe('image sources', () => {
  const img = (attrs: Record<string, string>): TreeNode => node({ id: 'i', tag: 'img', attrs })
  const html = (n: TreeNode) => generateBodyHtml([n], { withIds: false })

  it('sanitizeImageSrc accepts absolute https URLs only', () => {
    expect(sanitizeImageSrc('https://example.com/cat.png')).toBe('https://example.com/cat.png')
    expect(sanitizeImageSrc('  HTTPS://Example.com/a b ')).toBeNull() // inner whitespace
    expect(sanitizeImageSrc('  HTTPS://Example.com/a.png  ')).toBe('https://example.com/a.png')
    expect(sanitizeImageSrc('https://cdn.example.com:8443/a.png?x=1#y')).toBe(
      'https://cdn.example.com:8443/a.png?x=1#y',
    )
  })

  it.each([
    ['http://example.com/a.png', 'plain http'],
    ['//example.com/a.png', 'protocol-relative'],
    ['/a.png', 'relative'],
    ['a.png', 'relative'],
    ['javascript:alert(1)', 'javascript:'],
    ['data:image/png;base64,AAAA', 'data:'],
    ['file:///etc/passwd', 'file:'],
    ['blob:https://example.com/x', 'blob:'],
    ['https://user:pass@example.com/a.png', 'credentials'],
    ['https:///a.png', 'no host'],
    ['https:\\example.com/a.png', 'backslashes'],
    ['https://example.com\\a.png', 'backslash in path'],
    ['https://', 'empty'],
    ['https://exa mple.com/a.png', 'whitespace'],
    ['https://example.com/a.png\n', 'newline inside is rejected after trim only if inner'],
    ['', 'empty string'],
    ['   ', 'blank'],
    [`https://example.com/${'a'.repeat(2000)}`, 'too long'],
  ])('sanitizeImageSrc rejects %s (%s)', (value, why) => {
    // A trailing newline is just whitespace and is trimmed, so that one case is accepted.
    if (why.startsWith('newline')) expect(sanitizeImageSrc(value)).toBe('https://example.com/a.png')
    else expect(sanitizeImageSrc(value), why).toBeNull()
  })

  it('uses a valid https src, with no referrer', () => {
    expect(html(img({ src: 'https://example.com/cat.png' }))).toBe(
      '<img src="https://example.com/cat.png" referrerpolicy="no-referrer" alt="">',
    )
  })

  it('falls back to the placeholder for anything else', () => {
    for (const src of ['http://example.com/a.png', 'javascript:alert(1)', '/a.png', '', 'https://']) {
      expect(html(img({ src })), src).toMatch(/^<img src="data:image\/svg\+xml,[^"]+" alt="">$/)
    }
  })

  it('escapes the URL, so it cannot break out of the attribute', () => {
    const out = html(img({ src: 'https://example.com/a.png"onerror="alert(1)' }))
    expect(out).not.toContain('"onerror=')
    expect(out).not.toContain('<script')
  })

  it('does not let any other tag, or the generic attribute path, set src', () => {
    expect(html(node({ id: 'd', tag: 'div', attrs: { src: 'https://example.com/a.png' } }))).toBe('<div></div>')
    expect(html(node({ id: 'a', tag: 'a', attrs: { src: 'https://example.com/a.png' } }))).toBe('<a></a>')
  })

  it('the preview CSP allows images over https and nothing else new', () => {
    const doc = buildSrcDoc({ items: [], css: '', bg: 'white', runtime: '' })
    expect(doc).toContain('img-src data: https:;')
    expect(doc).toContain("default-src 'none'")
    expect(doc).not.toMatch(/img-src[^;]*\shttp:/)
    expect(doc).not.toMatch(/(connect|frame|script|font)-src[^;]*https/)
    expect(doc).toContain('<meta name="referrer" content="no-referrer">')
  })
})
