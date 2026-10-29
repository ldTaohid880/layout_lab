import type { TreeNode } from './tree'

export interface Sandbox {
  id: string
  name: string
  items: TreeNode[]
  css: string
  /** Set when the sandbox is an attempt at a challenge. */
  challengeId?: string
  createdAt: number
  updatedAt: number
}

export type ThemePreference = 'light' | 'dark' | 'system'

export type PreviewBackground = 'white' | 'dark' | 'checker'

export type MobileView = 'tree' | 'editor' | 'preview'

export type LeftTab = 'items' | 'examples' | 'docs' | 'challenges'

export interface OverlayToggles {
  box: boolean
  layout: boolean
  axes: boolean
  outlines: boolean
}

export interface UiState {
  theme: ThemePreference
  /** Viewport width of the preview in CSS px; null means "fit the pane". */
  previewWidth: number | null
  previewBg: PreviewBackground
  mobileView: MobileView
  leftTab: LeftTab
  /** Ids of tree nodes whose children are collapsed in the Items panel. */
  collapsed: Record<string, true>
  /** Which preview overlays are on. */
  overlays: OverlayToggles
}
