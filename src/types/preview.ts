import type { PreviewBackground } from './sandbox'

/** Every message crossing the iframe boundary carries this tag so stray messages are ignored. */
export const PREVIEW_CHANNEL = 'layout-lab' as const

/** Top, right, bottom, left in CSS px. */
export type Sides = [number, number, number, number]

/** What the overlay layer inside the frame should draw. */
export interface OverlayState {
  selectedId: string | null
  hoveredId: string | null
  /** Pick elements by clicking in the preview; page interaction is paused. */
  inspect: boolean
  /** Margin / border / padding / content of the selected element. */
  box: boolean
  /** Grid lines, track sizes and areas, or flex items, gaps and axis, on a selected container. */
  layout: boolean
  /** Main/cross (flex) or inline/block (grid) axis arrows, drawn with the layout overlay. */
  axes: boolean
  /** Outline every element, coloured by depth. */
  outlines: boolean
}

export type ContainerInfo =
  | {
      kind: 'flex'
      direction: string
      wrap: string
      justifyContent: string
      alignItems: string
      alignContent: string
      rowGap: string
      columnGap: string
      itemCount: number
      /** Text direction is right-to-left, which mirrors row layouts. */
      rtl: boolean
    }
  | {
      kind: 'grid'
      columns: number[]
      rows: number[]
      columnGap: string
      rowGap: string
      areas: string[]
      autoFlow: string
      justifyContent: string
      alignItems: string
      rtl: boolean
    }

export type ItemInfo =
  | { kind: 'flex'; grow: string; shrink: string; basis: string; alignSelf: string; order: string; mainSize: number }
  | { kind: 'grid'; column: string; row: string; area: string | null }

/** Measured layout of the selected element, computed inside the frame by the browser itself. */
export interface InspectInfo {
  id: string
  label: string
  rendered: boolean
  width: number
  height: number
  margin: Sides
  border: Sides
  padding: Sides
  display: string
  position: string
  boxSizing: string
  zIndex: string
  container: ContainerInfo | null
  item: ItemInfo | null
  /** Where absolute/fixed offsets are measured from. */
  containingBlock: { id: string | null; label: string } | null
  stacking: {
    /** Why this element creates a stacking context (empty when it does not). */
    reasons: string[]
    /** The stacking context it paints in. */
    contextId: string | null
    contextLabel: string
  }
  /** How far content spills past the padding box, in px. */
  overflow: { x: number; y: number }
}

export type ParentToFrameMessage =
  | { channel: typeof PREVIEW_CHANNEL; type: 'set-css'; css: string }
  | { channel: typeof PREVIEW_CHANNEL; type: 'set-bg'; bg: PreviewBackground }
  | { channel: typeof PREVIEW_CHANNEL; type: 'set-overlay'; state: OverlayState }

export type FrameToParentMessage =
  | { channel: typeof PREVIEW_CHANNEL; type: 'ready' }
  | { channel: typeof PREVIEW_CHANNEL; type: 'error'; message: string }
  | { channel: typeof PREVIEW_CHANNEL; type: 'hover'; id: string | null }
  | { channel: typeof PREVIEW_CHANNEL; type: 'pick'; id: string }
  | { channel: typeof PREVIEW_CHANNEL; type: 'inspect-exit' }
  | { channel: typeof PREVIEW_CHANNEL; type: 'info'; info: InspectInfo | null }

export function isFrameMessage(data: unknown): data is FrameToParentMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { channel?: unknown }).channel === PREVIEW_CHANNEL &&
    typeof (data as { type?: unknown }).type === 'string'
  )
}
