import type { Size } from '@/lib/useElementSize'

export const MIN_PREVIEW_WIDTH = 240
export const MAX_PREVIEW_WIDTH = 2560

export interface FrameLayout {
  /** Width of the simulated viewport in CSS px. */
  width: number
  /** Height of the simulated viewport, chosen so the scaled frame fills the stage. */
  height: number
  /** Visual scale applied when the chosen width is wider than the stage. */
  scale: number
}

export function computeFrameLayout(requested: number | null, stage: Size): FrameLayout {
  const available = Math.max(stage.width, 1)
  const width = requested ?? available
  const scale = Math.min(1, available / width)
  return { width, height: Math.max(stage.height, 1) / scale, scale }
}
