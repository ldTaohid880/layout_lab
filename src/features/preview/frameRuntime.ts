import {
  PREVIEW_CHANNEL,
  type ContainerInfo,
  type InspectInfo,
  type ItemInfo,
  type OverlayState,
  type Sides,
} from '@/types/preview'

/*
 * The only script that runs inside the sandboxed preview. It is real TypeScript, serialised with
 * Function.prototype.toString into the srcdoc (FRAME_RUNTIME at the bottom). Rules for this file:
 *
 * - frameMain and the helpers may only reference each other, their parameters and browser
 *   globals. Never a module-level import or constant: it would not exist inside the frame.
 *   (Type-only imports are fine: they are erased.)
 * - No user input is ever interpolated into the script.
 *
 * The runtime applies CSS/background updates without reloading, blocks navigation, and draws the
 * inspection overlays in an open shadow root whose host is pinned with inline !important styles,
 * so no user selector can hide or restyle it. It also measures the selected element and reports
 * an InspectInfo to the parent.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Track {
  start: number
  end: number
}

// ---- Pure helpers (unit-tested, and shipped into the frame) ---------------------------------

/** "[a] 100px 1fr [b] 200px" (computed: px only) → [100, 200]. */
export function parseTracks(value: string): number[] {
  if (!value || value === 'none') return []
  return value
    .replace(/\[[^\]]*\]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((t) => parseFloat(t))
    .filter((n) => Number.isFinite(n))
}

/**
 * Track positions relative to the content box start, given the container's content
 * distribution (justify-content for columns, align-content for rows).
 */
export function trackLayout(sizes: number[], gap: number, available: number, distribution: string): Track[] {
  const n = sizes.length
  const used = sizes.reduce((sum, s) => sum + s, 0) + gap * Math.max(n - 1, 0)
  const free = available - used
  const mode = distribution.replace(/^(safe|unsafe)\s+/, '')
  let offset = 0
  let extra = 0
  if (free > 0 && n > 0) {
    if (mode === 'center') offset = free / 2
    else if (mode === 'end' || mode === 'flex-end' || mode === 'right') offset = free
    else if (mode === 'space-between') extra = n > 1 ? free / (n - 1) : 0
    else if (mode === 'space-around') {
      extra = free / n
      offset = extra / 2
    } else if (mode === 'space-evenly') {
      extra = free / (n + 1)
      offset = extra
    }
  }
  const tracks: Track[] = []
  let pos = offset
  for (const size of sizes) {
    tracks.push({ start: pos, end: pos + size })
    pos += size + gap + extra
  }
  return tracks
}

/** '"a a" "b c"' → [['a','a'],['b','c']]. */
export function parseAreas(value: string): string[][] {
  if (!value || value === 'none') return []
  const rows: string[][] = []
  const re = /"([^"]*)"/g
  let match = re.exec(value)
  while (match) {
    rows.push((match[1] ?? '').trim().split(/\s+/).filter(Boolean))
    match = re.exec(value)
  }
  return rows
}

/** Named areas → 0-based [start, end) row and column ranges. Dots are empty cells. */
export function areaBounds(grid: string[][]): Record<string, { r0: number; r1: number; c0: number; c1: number }> {
  const out: Record<string, { r0: number; r1: number; c0: number; c1: number }> = {}
  grid.forEach((row, r) =>
    row.forEach((name, c) => {
      if (/^\.+$/.test(name)) return
      const b = out[name]
      if (!b) out[name] = { r0: r, r1: r + 1, c0: c, c1: c + 1 }
      else {
        b.r0 = Math.min(b.r0, r)
        b.r1 = Math.max(b.r1, r + 1)
        b.c0 = Math.min(b.c0, c)
        b.c1 = Math.max(b.c1, c + 1)
      }
    }),
  )
  return out
}

export function growRect(r: Rect, s: Sides): Rect {
  return { x: r.x - s[3], y: r.y - s[0], w: r.w + s[1] + s[3], h: r.h + s[0] + s[2] }
}

export function shrinkRect(r: Rect, s: Sides): Rect {
  return { x: r.x + s[3], y: r.y + s[0], w: r.w - s[1] - s[3], h: r.h - s[0] - s[2] }
}

/** 1-based grid lines [start, end] of the tracks the span [a, b] covers, or null. */
export function spanOf(tracks: Track[], a: number, b: number): [number, number] | null {
  let first = -1
  let last = -1
  tracks.forEach((t, i) => {
    if (first === -1 && t.end > a + 0.5) first = i
    if (t.start < b - 0.5) last = i
  })
  return first === -1 || last < first ? null : [first + 1, last + 2]
}

/** Why an element creates a stacking context (empty list: it does not). */
export function stackingReasons(get: (property: string) => string, parentDisplay: string): string[] {
  const reasons: string[] = []
  const short = (v: string) => (v.length > 32 ? `${v.slice(0, 30)}…` : v)
  const position = get('position')
  const z = get('z-index')
  if (position === 'fixed' || position === 'sticky') reasons.push(`position: ${position}`)
  else if ((position === 'relative' || position === 'absolute') && z !== 'auto' && z !== '') {
    reasons.push(`position: ${position} with z-index: ${z}`)
  } else if (z !== 'auto' && z !== '' && /flex|grid/.test(parentDisplay)) {
    reasons.push(`${/grid/.test(parentDisplay) ? 'grid' : 'flex'} item with z-index: ${z}`)
  }
  const opacity = get('opacity')
  if (opacity !== '' && parseFloat(opacity) < 1) reasons.push(`opacity: ${opacity}`)
  for (const p of ['transform', 'filter', 'backdrop-filter', 'perspective', 'clip-path', 'mask-image']) {
    const v = get(p)
    if (v && v !== 'none') reasons.push(`${p}: ${short(v)}`)
  }
  const blend = get('mix-blend-mode')
  if (blend && blend !== 'normal') reasons.push(`mix-blend-mode: ${blend}`)
  if (get('isolation') === 'isolate') reasons.push('isolation: isolate')
  const willChange = get('will-change')
  if (/transform|opacity|filter|z-index|perspective/.test(willChange)) reasons.push(`will-change: ${willChange}`)
  const contain = get('contain')
  if (/layout|paint|strict|content/.test(contain)) reasons.push(`contain: ${contain}`)
  return reasons
}

/** A physical direction on screen. */
export type Dir = 'right' | 'left' | 'down' | 'up'

/**
 * Where a flex container's main axis (justify-content) and cross axis (align-items) point on
 * screen. Horizontal writing modes only: vertical `writing-mode` would swap rows and columns, and
 * is out of scope. `rtl` mirrors the inline direction, which row layouts follow.
 */
export function flexAxes(direction: string, wrap: string, rtl: boolean): { main: Dir; cross: Dir } {
  const flip = (d: Dir): Dir => (d === 'right' ? 'left' : d === 'left' ? 'right' : d === 'down' ? 'up' : 'down')
  const row = direction.startsWith('row')
  let main: Dir = row ? (rtl ? 'left' : 'right') : 'down'
  let cross: Dir = row ? 'down' : rtl ? 'left' : 'right'
  if (direction.endsWith('reverse')) main = flip(main)
  if (wrap === 'wrap-reverse') cross = flip(cross)
  return { main, cross }
}

/** Grid's inline axis (justify-*) runs along the text direction, the block axis (align-*) down. */
export function gridAxes(rtl: boolean): { inline: Dir; block: Dir } {
  return { inline: rtl ? 'left' : 'right', block: 'down' }
}

// ---- The runtime ------------------------------------------------------------------------------

export function frameMain(CHANNEL: string): void {
  const root = document.documentElement
  const userStyle = document.getElementById('ll-user-css')
  let state: OverlayState = {
    selectedId: null,
    hoveredId: null,
    inspect: false,
    box: true,
    layout: true,
    axes: true,
    outlines: false,
  }
  let pending = 0
  let lastInfo = ''
  let lastHover: string | null = null

  const send = (msg: Record<string, unknown>) => window.parent.postMessage({ ...msg, channel: CHANNEL }, '*')

  // ---- Overlay host ----
  const host = document.createElement('ll-overlay')
  const pin = (property: string, value: string) => host.style.setProperty(property, value, 'important')
  pin('all', 'initial')
  pin('position', 'fixed')
  pin('inset', '0')
  pin('z-index', '2147483647')
  pin('display', 'block')
  pin('pointer-events', 'none')
  pin('contain', 'strict')
  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = `<style>
#layer { position: absolute; inset: 0; font: 11px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
#layer > div { position: absolute; box-sizing: border-box; }
.ring { border-style: solid; }
.sel { border: 2px solid #f97316; }
.hover { border: 1px dashed #f97316; }
.chip { padding: 2px 6px; border-radius: 3px; background: #18181b; color: #fafafa; white-space: nowrap; box-shadow: 0 1px 3px rgb(0 0 0 / .3); }
.chip.hover-chip { background: #52525b; }
.chip.axis-chip { font-weight: 600; }
.chip.axis-chip.v { writing-mode: vertical-rl; padding: 6px 2px; }
.chip.axis-chip.a { background: #2563eb; }
.chip.axis-chip.b { background: #0d9488; }
.num { padding: 0 3px; border-radius: 2px; background: #c026d3; color: #fff; font-size: 10px; white-space: nowrap; }
.size { padding: 0 3px; border-radius: 2px; background: rgb(255 255 255 / .9); color: #86198f; font-size: 10px; white-space: nowrap; }
.grid-box { border: 1.5px solid #c026d3; }
.grid-line-v { border-left: 1px dashed #c026d3; }
.grid-line-h { border-top: 1px dashed #c026d3; }
.grid-gap { background: repeating-linear-gradient(45deg, rgb(192 38 211 / .3) 0 2px, transparent 2px 6px); }
.grid-area { border: 1px solid rgb(192 38 211 / .55); background: rgb(192 38 211 / .06); display: flex; align-items: center; justify-content: center; }
.grid-area > span { padding: 1px 5px; border-radius: 3px; background: #c026d3; color: #fff; font-weight: 600; }
.flex-box { border: 1.5px solid #2563eb; }
.flex-item { border: 1px dashed #2563eb; }
.flex-gap { background: repeating-linear-gradient(45deg, rgb(37 99 235 / .32) 0 2px, transparent 2px 6px); }
.axis-line { border: 0 solid; }
.axis-line.h { border-top-width: 2px; }
.axis-line.v { border-left-width: 2px; }
.axis-line.a { border-color: #2563eb; }
.axis-line.b { border-color: #0d9488; }
.axis-head { font-size: 12px; line-height: 1; }
.axis-head.a { color: #2563eb; }
.axis-head.b { color: #0d9488; }
.outline { border: 1px solid; }
</style><div id="layer"></div>`
  const layer = shadow.getElementById('layer') as HTMLDivElement
  root.appendChild(host)

  // ---- Measuring ----
  type Measured = {
    cs: CSSStyleDeclaration
    margin: Sides
    border: Sides
    padding: Sides
    borderBox: Rect
    marginBox: Rect
    paddingBox: Rect
    contentBox: Rect
    rendered: boolean
  }
  const px = (v: string) => parseFloat(v) || 0
  const round = (n: number) => Math.round(n * 10) / 10
  const sides = (cs: CSSStyleDeclaration, prefix: string, suffix = ''): Sides => [
    px(cs.getPropertyValue(`${prefix}-top${suffix}`)),
    px(cs.getPropertyValue(`${prefix}-right${suffix}`)),
    px(cs.getPropertyValue(`${prefix}-bottom${suffix}`)),
    px(cs.getPropertyValue(`${prefix}-left${suffix}`)),
  ]
  const measure = (el: Element): Measured => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const margin = sides(cs, 'margin')
    const border = sides(cs, 'border', '-width')
    const padding = sides(cs, 'padding')
    const borderBox = { x: r.left, y: r.top, w: r.width, h: r.height }
    const paddingBox = shrinkRect(borderBox, border)
    return {
      cs,
      margin,
      border,
      padding,
      borderBox,
      marginBox: growRect(borderBox, margin),
      paddingBox,
      contentBox: shrinkRect(paddingBox, padding),
      rendered: cs.display !== 'none' && el.getClientRects().length > 0,
    }
  }
  const labelOf = (el: Element) =>
    el.tagName.toLowerCase() +
    Array.from(el.classList)
      .map((c) => `.${c}`)
      .join('')
  const byId = (id: string | null) => (id ? document.querySelector(`[data-ll-id="${CSS.escape(id)}"]`) : null)
  const styleGetter = (cs: CSSStyleDeclaration) => (p: string) => cs.getPropertyValue(p)

  // ---- Drawing ----
  const add = (cls: string, r: Rect | null, styles?: Record<string, string>, text?: string) => {
    const d = document.createElement('div')
    d.className = cls
    if (r) {
      d.style.left = `${r.x}px`
      d.style.top = `${r.y}px`
      d.style.width = `${Math.max(r.w, 0)}px`
      d.style.height = `${Math.max(r.h, 0)}px`
    }
    if (styles) for (const k of Object.keys(styles)) d.style.setProperty(k, styles[k] ?? '')
    if (text !== undefined) d.textContent = text
    layer.appendChild(d)
    return d
  }
  const ring = (outer: Rect, widths: Sides, color: string) =>
    add('ring', outer, { 'border-width': widths.map((n) => `${Math.max(n, 0)}px`).join(' '), 'border-color': color })
  const clampX = (x: number, w: number) => Math.min(Math.max(x, 2), window.innerWidth - w - 2)
  /** A label above the anchor (or inside it, or below it when there is no room). */
  const chip = (text: string, anchor: Rect, cls = '', inside = false) => {
    const d = add(`chip ${cls}`, null, undefined, text)
    const w = d.offsetWidth
    const h = d.offsetHeight
    let y = inside ? anchor.y + 3 : anchor.y - h - 3
    if (y < 2) y = inside ? 2 : anchor.y + anchor.h + 3
    if (y + h > window.innerHeight - 2) y = Math.max(2, anchor.y + 3)
    d.style.left = `${clampX(anchor.x + (inside ? 3 : 0), w)}px`
    d.style.top = `${y}px`
  }
  /** A label centred on a point. */
  const label = (text: string, cx: number, cy: number, cls: string) => {
    const d = add(cls, null, undefined, text)
    d.style.left = `${clampX(cx - d.offsetWidth / 2, d.offsetWidth)}px`
    d.style.top = `${Math.max(cy - d.offsetHeight / 2, 1)}px`
    return d
  }

  /**
   * Two labelled arrows that start at one corner of a container's content box, like coordinate
   * axes: one horizontal, one vertical, each pointing the way its axis runs. `tone` picks the colour
   * (a = main/inline, b = cross/block); `axis` and `dir` are exposed as data attributes.
   */
  type AxisSpec = { dir: Dir; tone: 'a' | 'b'; axis: string; text: string }
  const ARROW_HEAD: Record<Dir, string> = { right: '▶', left: '◀', down: '▼', up: '▲' }
  const drawAxes = (c: Rect, specs: AxisSpec[], inset: { x: number; y: number }) => {
    const horizontal = specs.find((s) => s.dir === 'left' || s.dir === 'right')
    const vertical = specs.find((s) => s.dir === 'up' || s.dir === 'down')
    if (!horizontal || !vertical) return
    const rightward = horizontal.dir === 'right'
    const downward = vertical.dir === 'down'
    // The shared corner both arrows start from: the start side of each axis.
    const ox = rightward ? c.x + inset.x : c.x + c.w - inset.x
    const oy = downward ? c.y + inset.y : c.y + c.h - inset.y
    const hLen = Math.max(c.w - inset.x * 2, 24)
    const vLen = Math.max(c.h - inset.y * 2, 24)

    const tag = (el: HTMLElement, spec: AxisSpec) => {
      el.setAttribute('data-axis', spec.axis)
      el.setAttribute('data-dir', spec.dir)
    }
    tag(add(`axis-line h ${horizontal.tone}`, { x: rightward ? ox : ox - hLen, y: oy, w: hLen, h: 0 }), horizontal)
    tag(add(`axis-line v ${vertical.tone}`, { x: ox, y: downward ? oy : oy - vLen, w: 0, h: vLen }), vertical)
    label(ARROW_HEAD[horizontal.dir], rightward ? ox + hLen : ox - hLen, oy, `axis-head ${horizontal.tone}`)
    label(ARROW_HEAD[vertical.dir], ox, downward ? oy + vLen : oy - vLen, `axis-head ${vertical.tone}`)

    // Each caption sits on its own line, centred along it, so the line runs through the label.
    tag(
      label(horizontal.text, ox + (rightward ? hLen : -hLen) / 2, oy, `chip axis-chip ${horizontal.tone}`),
      horizontal,
    )
    tag(label(vertical.text, ox, oy + (downward ? vLen : -vLen) / 2, `chip axis-chip v ${vertical.tone}`), vertical)
  }

  const drawBox = (m: Measured, strength: number, quietContent: boolean) => {
    ring(m.marginBox, m.margin, `rgb(246 164 82 / ${0.45 * strength})`)
    ring(m.borderBox, m.border, `rgb(250 214 107 / ${0.65 * strength})`)
    ring(m.paddingBox, m.padding, `rgb(132 196 110 / ${0.5 * strength})`)
    add('fill', m.contentBox, { background: `rgb(96 160 230 / ${(quietContent ? 0.12 : 0.4) * strength})` })
  }

  const drawGrid = (el: Element, m: Measured) => {
    const cs = m.cs
    const c = m.contentBox
    const ox = c.x - el.scrollLeft
    const oy = c.y - el.scrollTop
    const X = trackLayout(parseTracks(cs.gridTemplateColumns), px(cs.columnGap), c.w, cs.justifyContent)
    const Y = trackLayout(parseTracks(cs.gridTemplateRows), px(cs.rowGap), c.h, cs.alignContent)
    const firstX = X[0]
    const lastX = X[X.length - 1]
    const firstY = Y[0]
    const lastY = Y[Y.length - 1]
    if (!firstX || !lastX || !firstY || !lastY) return
    const left = ox + firstX.start
    const right = ox + lastX.end
    const top = oy + firstY.start
    const bottom = oy + lastY.end

    add('grid-box', m.borderBox)

    const bounds = areaBounds(parseAreas(cs.gridTemplateAreas))
    for (const name of Object.keys(bounds)) {
      const b = bounds[name]
      const x0 = X[b?.c0 ?? -1]
      const x1 = X[(b?.c1 ?? 0) - 1]
      const y0 = Y[b?.r0 ?? -1]
      const y1 = Y[(b?.r1 ?? 0) - 1]
      if (!x0 || !x1 || !y0 || !y1) continue
      const area = add('grid-area', { x: ox + x0.start, y: oy + y0.start, w: x1.end - x0.start, h: y1.end - y0.start })
      const span = document.createElement('span')
      span.textContent = name
      area.appendChild(span)
    }

    for (let i = 0; i < X.length - 1; i++) {
      const g0 = ox + (X[i]?.end ?? 0)
      const g1 = ox + (X[i + 1]?.start ?? 0)
      if (g1 - g0 > 0.5) add('grid-gap', { x: g0, y: top, w: g1 - g0, h: bottom - top })
    }
    for (let i = 0; i < Y.length - 1; i++) {
      const g0 = oy + (Y[i]?.end ?? 0)
      const g1 = oy + (Y[i + 1]?.start ?? 0)
      if (g1 - g0 > 0.5) add('grid-gap', { x: left, y: g0, w: right - left, h: g1 - g0 })
    }

    const seen = new Set<string>()
    const line = (vertical: boolean, at: number) => {
      const key = `${vertical}:${Math.round(at)}`
      if (seen.has(key)) return
      seen.add(key)
      if (vertical) add('grid-line-v', { x: at, y: top, w: 0, h: bottom - top })
      else add('grid-line-h', { x: left, y: at, w: right - left, h: 0 })
    }
    X.forEach((t) => {
      line(true, ox + t.start)
      line(true, ox + t.end)
    })
    Y.forEach((t) => {
      line(false, oy + t.start)
      line(false, oy + t.end)
    })

    // Line numbers sit on the start of each track, plus one after the last.
    X.forEach((t, i) => label(String(i + 1), ox + t.start, top - 7, 'num'))
    label(String(X.length + 1), right, top - 7, 'num')
    Y.forEach((t, i) => label(String(i + 1), left - 8, oy + t.start, 'num'))
    label(String(Y.length + 1), left - 8, bottom, 'num')

    X.forEach((t) => {
      if (t.end - t.start >= 36) label(`${round(t.end - t.start)}px`, ox + (t.start + t.end) / 2, top + 9, 'size')
    })
    Y.forEach((t) => {
      if (t.end - t.start >= 30) label(`${round(t.end - t.start)}px`, left + 24, oy + (t.start + t.end) / 2, 'size')
    })

    // Inset further than flex's arrows so they clear the track-size labels along the top and left.
    const axes = gridAxes(cs.direction === 'rtl')
    if (state.axes)
      drawAxes(
        c,
        [
          { dir: axes.inline, tone: 'a', axis: 'inline', text: 'inline axis · justify-items, justify-content' },
          { dir: axes.block, tone: 'b', axis: 'block', text: 'block axis · align-items, align-content' },
        ],
        { x: 56, y: 28 },
      )
  }

  const flowChildren = (el: Element) =>
    Array.from(el.children).filter((child) => {
      if (child === host) return false
      const s = getComputedStyle(child)
      return s.display !== 'none' && s.position !== 'absolute' && s.position !== 'fixed'
    })

  const drawFlex = (el: Element, m: Measured) => {
    const cs = m.cs
    const direction = cs.flexDirection
    const isRow = direction.startsWith('row')
    add('flex-box', m.borderBox)

    const boxes = flowChildren(el).map(measure)
    boxes.forEach((b) => add('flex-item', b.borderBox))

    // Hatch the gap after each item, towards its nearest neighbour on the same line.
    const gap = px(isRow ? cs.columnGap : cs.rowGap)
    if (gap > 0) {
      const span = (r: Rect) => (isRow ? [r.x, r.x + r.w, r.y, r.y + r.h] : [r.y, r.y + r.h, r.x, r.x + r.w])
      for (const a of boxes) {
        const [, aEnd = 0, aC0 = 0, aC1 = 0] = span(a.marginBox)
        let best: number | null = null
        let cross: [number, number] = [aC0, aC1]
        for (const b of boxes) {
          if (b === a) continue
          const [bStart = 0, , bC0 = 0, bC1 = 0] = span(b.marginBox)
          if (bC0 >= aC1 || bC1 <= aC0) continue
          const d = bStart - aEnd
          if (d > 0.5 && (best === null || d < best)) {
            best = d
            cross = [Math.min(aC0, bC0), Math.max(aC1, bC1)]
          }
        }
        if (best === null) continue
        const g = Math.min(gap, best)
        add(
          'flex-gap',
          isRow
            ? { x: aEnd, y: cross[0], w: g, h: cross[1] - cross[0] }
            : { x: cross[0], y: aEnd, w: cross[1] - cross[0], h: g },
        )
      }
    }

    const axes = flexAxes(direction, cs.flexWrap, cs.direction === 'rtl')
    const wrapped = cs.flexWrap !== 'nowrap'
    if (state.axes)
      drawAxes(
        m.contentBox,
        [
          { dir: axes.main, tone: 'a', axis: 'main', text: 'main axis · justify-content' },
          {
            dir: axes.cross,
            tone: 'b',
            axis: 'cross',
            text: wrapped ? 'cross axis · align-items, align-content' : 'cross axis · align-items',
          },
        ],
        { x: 10, y: 10 },
      )
  }

  const drawOutlines = () => {
    document.querySelectorAll('[data-ll-id]').forEach((el) => {
      let depth = 0
      for (let p = el.parentElement; p; p = p.parentElement) if (p.hasAttribute('data-ll-id')) depth += 1
      const r = el.getBoundingClientRect()
      if (!r.width && !r.height) return
      add(
        'outline',
        { x: r.left, y: r.top, w: r.width, h: r.height },
        { 'border-color': `hsl(${(depth * 67 + 20) % 360} 75% 48%)` },
      )
    })
  }

  // ---- Inspect info ----
  const stackingContextOf = (el: Element): Element => {
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) {
      const parentDisplay = p.parentElement ? getComputedStyle(p.parentElement).display : ''
      if (stackingReasons(styleGetter(getComputedStyle(p)), parentDisplay).length) return p
    }
    return root
  }

  const describe = (el: Element, m: Measured): InspectInfo => {
    const cs = m.cs
    const parent = el.parentElement
    const pcs = parent ? getComputedStyle(parent) : null
    const parentDisplay = pcs?.display ?? ''
    const outOfFlow = cs.position === 'absolute' || cs.position === 'fixed'

    let container: ContainerInfo | null = null
    if (/flex/.test(cs.display)) {
      container = {
        kind: 'flex',
        direction: cs.flexDirection,
        wrap: cs.flexWrap,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        alignContent: cs.alignContent,
        rowGap: cs.rowGap,
        columnGap: cs.columnGap,
        itemCount: flowChildren(el).length,
        rtl: cs.direction === 'rtl',
      }
    } else if (/grid/.test(cs.display)) {
      container = {
        kind: 'grid',
        columns: parseTracks(cs.gridTemplateColumns).map(round),
        rows: parseTracks(cs.gridTemplateRows).map(round),
        columnGap: cs.columnGap,
        rowGap: cs.rowGap,
        areas: parseAreas(cs.gridTemplateAreas).map((row) => row.join(' ')),
        autoFlow: cs.gridAutoFlow,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        rtl: cs.direction === 'rtl',
      }
    }

    let item: ItemInfo | null = null
    if (parent && pcs && !outOfFlow && /flex/.test(parentDisplay)) {
      item = {
        kind: 'flex',
        grow: cs.flexGrow,
        shrink: cs.flexShrink,
        basis: cs.flexBasis,
        alignSelf: cs.alignSelf,
        order: cs.order,
        mainSize: round(pcs.flexDirection.startsWith('row') ? m.borderBox.w : m.borderBox.h),
      }
    } else if (parent && pcs && !outOfFlow && /grid/.test(parentDisplay)) {
      const pm = measure(parent)
      const pc = pm.contentBox
      const cols = trackLayout(parseTracks(pcs.gridTemplateColumns), px(pcs.columnGap), pc.w, pcs.justifyContent)
      const rows = trackLayout(parseTracks(pcs.gridTemplateRows), px(pcs.rowGap), pc.h, pcs.alignContent)
      const ox = pc.x - parent.scrollLeft
      const oy = pc.y - parent.scrollTop
      const b = m.borderBox
      const col = spanOf(cols, b.x - ox, b.x + b.w - ox)
      const row = spanOf(rows, b.y - oy, b.y + b.h - oy)
      const named = cs.gridRowStart
      item = {
        kind: 'grid',
        column: col ? `${col[0]} / ${col[1]}` : '?',
        row: row ? `${row[0]} / ${row[1]}` : '?',
        area: /^-?[_a-zA-Z][\w-]*$/.test(named) && named !== 'auto' && !named.startsWith('span') ? named : null,
      }
    }

    let containingBlock: InspectInfo['containingBlock'] = null
    if (cs.position === 'fixed') containingBlock = { id: null, label: 'the viewport' }
    else if (cs.position === 'absolute') {
      const op = (el as HTMLElement).offsetParent
      const positioned = op && (op !== document.body || getComputedStyle(op).position !== 'static')
      containingBlock = positioned
        ? { id: op.getAttribute('data-ll-id'), label: labelOf(op) }
        : { id: null, label: 'the page (initial containing block)' }
    }

    const context = stackingContextOf(el)
    const scroller = el as HTMLElement
    const measurable = scroller.clientWidth > 0 || scroller.clientHeight > 0
    return {
      id: el.getAttribute('data-ll-id') ?? '',
      label: labelOf(el),
      rendered: m.rendered,
      width: round(m.borderBox.w),
      height: round(m.borderBox.h),
      margin: m.margin.map(round) as Sides,
      border: m.border.map(round) as Sides,
      padding: m.padding.map(round) as Sides,
      display: cs.display,
      position: cs.position,
      boxSizing: cs.boxSizing,
      zIndex: cs.zIndex,
      container,
      item,
      containingBlock,
      stacking: {
        reasons: stackingReasons(styleGetter(cs), parentDisplay),
        contextId: context.getAttribute('data-ll-id'),
        contextLabel: context === root ? 'the root (html)' : labelOf(context),
      },
      overflow: measurable
        ? {
            x: Math.max(0, scroller.scrollWidth - scroller.clientWidth),
            y: Math.max(0, scroller.scrollHeight - scroller.clientHeight),
          }
        : { x: 0, y: 0 },
    }
  }

  const draw = () => {
    pending = 0
    layer.replaceChildren()
    if (state.outlines) drawOutlines()

    const selected = byId(state.selectedId)
    const sm = selected ? measure(selected) : null
    if (selected && sm?.rendered) {
      const kind = state.layout
        ? /grid/.test(sm.cs.display)
          ? 'grid'
          : /flex/.test(sm.cs.display)
            ? 'flex'
            : null
        : null
      if (state.box) drawBox(sm, 1, kind !== null)
      else add('sel', sm.borderBox)
      if (kind === 'grid') drawGrid(selected, sm)
      else if (kind === 'flex') drawFlex(selected, sm)
      chip(`${labelOf(selected)}  ${round(sm.borderBox.w)} × ${round(sm.borderBox.h)}`, sm.marginBox)
    }

    const hovered = state.hoveredId && state.hoveredId !== state.selectedId ? byId(state.hoveredId) : null
    const hm = hovered ? measure(hovered) : null
    if (hovered && hm?.rendered) {
      if (state.box) drawBox(hm, 0.55, false)
      else add('hover', hm.borderBox)
      chip(`${labelOf(hovered)}  ${round(hm.borderBox.w)} × ${round(hm.borderBox.h)}`, hm.marginBox, 'hover-chip')
    }

    const info = selected && sm ? describe(selected, sm) : null
    const json = JSON.stringify(info)
    if (json !== lastInfo) {
      lastInfo = json
      send({ type: 'info', info })
    }
  }
  const schedule = () => {
    if (!pending) pending = requestAnimationFrame(draw)
  }

  // ---- Inspect mode: the host captures the pointer and picks what is underneath ----
  const pickAt = (x: number, y: number): string | null => {
    for (const el of document.elementsFromPoint(x, y)) {
      if (el === host) continue
      return el.closest('[data-ll-id]')?.getAttribute('data-ll-id') ?? null
    }
    return null
  }
  const setHover = (id: string | null) => {
    if (id === lastHover) return
    lastHover = id
    send({ type: 'hover', id })
  }
  host.addEventListener('pointermove', (e) => setHover(pickAt(e.clientX, e.clientY)))
  host.addEventListener('pointerleave', () => setHover(null))
  host.addEventListener('pointerdown', (e) => e.preventDefault())
  host.addEventListener('click', (e) => {
    e.preventDefault()
    const id = pickAt(e.clientX, e.clientY)
    if (id) send({ type: 'pick', id })
  })
  document.addEventListener('keydown', (e) => {
    if (state.inspect && e.key === 'Escape') send({ type: 'inspect-exit' })
  })

  // ---- Messages from the parent ----
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return
    const data = event.data
    if (!data || data.channel !== CHANNEL) return
    if (data.type === 'set-css' && typeof data.css === 'string') {
      if (userStyle) userStyle.textContent = data.css
      schedule()
    } else if (data.type === 'set-bg' && typeof data.bg === 'string') {
      root.setAttribute('data-ll-bg', data.bg)
    } else if (data.type === 'set-overlay' && data.state && typeof data.state === 'object') {
      state = data.state as OverlayState
      pin('pointer-events', state.inspect ? 'auto' : 'none')
      pin('cursor', state.inspect ? 'crosshair' : 'auto')
      if (!state.inspect) lastHover = null
      schedule()
    }
  })

  // ---- Keep overlays in sync with layout ----
  window.addEventListener('resize', schedule)
  document.addEventListener('scroll', schedule, { capture: true, passive: true })
  document.addEventListener('load', schedule, true)
  document.addEventListener('transitionend', schedule, true)
  if (document.body) new ResizeObserver(schedule).observe(document.body)

  // ---- Page behaviour ----
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target
      if (target instanceof Element && target.closest('a[href]')) event.preventDefault()
    },
    true,
  )
  document.addEventListener('submit', (event) => event.preventDefault(), true)
  window.addEventListener('error', (event) => send({ type: 'error', message: String(event.message) }))

  send({ type: 'ready' })
}

const HELPERS = [
  parseTracks,
  trackLayout,
  parseAreas,
  areaBounds,
  growRect,
  shrinkRect,
  spanOf,
  stackingReasons,
  flexAxes,
  gridAxes,
]

/** The script text injected into the preview document. */
export const FRAME_RUNTIME = `(function () {
'use strict';
${HELPERS.map(String).join('\n')}
(${String(frameMain)})(${JSON.stringify(PREVIEW_CHANNEL)});
})();`
