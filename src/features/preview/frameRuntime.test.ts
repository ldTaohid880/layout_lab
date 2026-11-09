import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FRAME_RUNTIME,
  areaBounds,
  flexAxes,
  gridAxes,
  growRect,
  parseAreas,
  parseTracks,
  shrinkRect,
  spanOf,
  stackingReasons,
  trackLayout,
} from './frameRuntime'

describe('grid geometry', () => {
  it('parses computed track lists, ignoring line names', () => {
    expect(parseTracks('[a] 100px [b] 200.5px')).toEqual([100, 200.5])
    expect(parseTracks('none')).toEqual([])
    expect(parseTracks('')).toEqual([])
  })

  const starts = (sizes: number[], gap: number, available: number, mode: string) =>
    trackLayout(sizes, gap, available, mode).map((t) => [t.start, t.end])

  it('lays tracks out from the start with gaps', () => {
    expect(starts([100, 100], 10, 400, 'normal')).toEqual([
      [0, 100],
      [110, 210],
    ])
  })

  it('distributes free space like justify-content / align-content', () => {
    // 400 available, 210 used → 190 free
    expect(starts([100, 100], 10, 400, 'center')[0]).toEqual([95, 195])
    expect(starts([100, 100], 10, 400, 'end')[0]).toEqual([190, 290])
    expect(starts([100, 100], 10, 400, 'space-between')).toEqual([
      [0, 100],
      [300, 400],
    ])
    // 200 free over 3 slots: 66.7 before, between and after
    expect(starts([100, 100], 0, 400, 'space-evenly').map((t) => t.map(Math.round))).toEqual([
      [67, 167],
      [233, 333],
    ])
    expect(starts([100], 0, 300, 'safe center')).toEqual([[100, 200]])
  })

  it('does not distribute negative free space', () => {
    expect(starts([300, 300], 0, 400, 'center')[0]).toEqual([0, 300])
  })

  it('parses template areas into rectangles, skipping dots', () => {
    const grid = parseAreas('"header header" "nav main" ". main"')
    expect(grid).toEqual([
      ['header', 'header'],
      ['nav', 'main'],
      ['.', 'main'],
    ])
    expect(areaBounds(grid)).toEqual({
      header: { r0: 0, r1: 1, c0: 0, c1: 2 },
      nav: { r0: 1, r1: 2, c0: 0, c1: 1 },
      main: { r0: 1, r1: 3, c0: 1, c1: 2 },
    })
  })

  it('finds the grid lines an item spans', () => {
    const tracks = trackLayout([100, 100, 100], 10, 320, 'normal')
    expect(spanOf(tracks, 0, 100)).toEqual([1, 2])
    expect(spanOf(tracks, 110, 320)).toEqual([2, 4])
    // centred inside the second cell
    expect(spanOf(tracks, 140, 180)).toEqual([2, 3])
    expect(spanOf(tracks, 400, 420)).toBeNull()
  })

  it('grows and shrinks rects by sides', () => {
    const r = { x: 10, y: 10, w: 100, h: 50 }
    expect(growRect(r, [1, 2, 3, 4])).toEqual({ x: 6, y: 9, w: 106, h: 54 })
    expect(shrinkRect(r, [1, 2, 3, 4])).toEqual({ x: 14, y: 11, w: 94, h: 46 })
  })
})

describe('axes', () => {
  it('flexAxes: every direction, wrap and text direction', () => {
    // [flex-direction, wrap, rtl] → [main, cross]
    const cases: [string, string, boolean, string, string][] = [
      ['row', 'nowrap', false, 'right', 'down'],
      ['row-reverse', 'nowrap', false, 'left', 'down'],
      ['column', 'nowrap', false, 'down', 'right'],
      ['column-reverse', 'nowrap', false, 'up', 'right'],
      ['row', 'wrap', false, 'right', 'down'],
      ['row', 'wrap-reverse', false, 'right', 'up'],
      ['column', 'wrap-reverse', false, 'down', 'left'],
      // rtl mirrors the inline direction: rows start on the right, columns wrap towards the left
      ['row', 'nowrap', true, 'left', 'down'],
      ['row-reverse', 'nowrap', true, 'right', 'down'],
      ['column', 'nowrap', true, 'down', 'left'],
      ['column', 'wrap-reverse', true, 'down', 'right'],
      ['column-reverse', 'wrap-reverse', true, 'up', 'right'],
    ]
    for (const [direction, wrap, rtl, main, cross] of cases) {
      expect(flexAxes(direction, wrap, rtl), `${direction} ${wrap} rtl=${rtl}`).toEqual({ main, cross })
    }
  })

  it('flexAxes: main and cross are always perpendicular', () => {
    const horizontal = (d: string) => d === 'left' || d === 'right'
    for (const direction of ['row', 'row-reverse', 'column', 'column-reverse']) {
      for (const wrap of ['nowrap', 'wrap', 'wrap-reverse']) {
        for (const rtl of [false, true]) {
          const { main, cross } = flexAxes(direction, wrap, rtl)
          expect(horizontal(main)).not.toBe(horizontal(cross))
        }
      }
    }
  })

  it('gridAxes: inline follows the text direction, block goes down', () => {
    expect(gridAxes(false)).toEqual({ inline: 'right', block: 'down' })
    expect(gridAxes(true)).toEqual({ inline: 'left', block: 'down' })
  })
})

describe('stackingReasons', () => {
  const style = (values: Record<string, string>) => (p: string) =>
    values[p] ?? ({ position: 'static', 'z-index': 'auto', opacity: '1' } as Record<string, string>)[p] ?? ''

  it('returns nothing for a plain element', () => {
    expect(stackingReasons(style({}), 'block')).toEqual([])
    expect(stackingReasons(style({ position: 'relative' }), 'block')).toEqual([])
  })

  it('explains each trigger', () => {
    expect(stackingReasons(style({ position: 'absolute', 'z-index': '3' }), 'block')).toEqual([
      'position: absolute with z-index: 3',
    ])
    expect(stackingReasons(style({ 'z-index': '1' }), 'flex')).toEqual(['flex item with z-index: 1'])
    expect(stackingReasons(style({ 'z-index': '1' }), 'block')).toEqual([])
    expect(stackingReasons(style({ position: 'sticky' }), 'block')).toEqual(['position: sticky'])
    expect(stackingReasons(style({ opacity: '0.5', isolation: 'isolate' }), 'block')).toEqual([
      'opacity: 0.5',
      'isolation: isolate',
    ])
    expect(stackingReasons(style({ transform: 'matrix(1, 0, 0, 1, 10, 0)' }), 'block')).toEqual([
      'transform: matrix(1, 0, 0, 1, 10, 0)',
    ])
  })
})

describe('FRAME_RUNTIME', () => {
  afterEach(() => {
    document.documentElement.querySelector('ll-overlay')?.remove()
    vi.unstubAllGlobals()
  })

  it('is self-contained: runs from its serialised text, mounts the overlay host and says ready', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )
    document.body.innerHTML = '<style id="ll-user-css"></style><div data-ll-id="a"></div>'
    const messages: unknown[] = []
    const onMessage = (e: MessageEvent) => messages.push(e.data)
    window.addEventListener('message', onMessage)

    // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call -- runs the serialised runtime the way the frame does
    new Function(FRAME_RUNTIME)()
    await new Promise((r) => setTimeout(r, 0))
    window.removeEventListener('message', onMessage)

    const host = document.documentElement.querySelector('ll-overlay') as HTMLElement
    expect(host).toBeTruthy()
    expect(host.shadowRoot?.getElementById('layer')).toBeTruthy()
    expect(host.style.getPropertyPriority('position')).toBe('important')
    expect(host.style.getPropertyValue('pointer-events')).toBe('none')
    expect(messages).toContainEqual({ type: 'ready', channel: 'layout-lab' })
  })

  it('never contains a closing script tag', () => {
    expect(FRAME_RUNTIME).not.toMatch(/<\/script/i)
  })
})
