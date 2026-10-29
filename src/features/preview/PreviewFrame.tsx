import { useEffect, useMemo, useRef } from 'react'
import { FRAME_RUNTIME } from './frameRuntime'
import { buildSrcDoc } from './generateHtml'
import { useStudio } from '@/store/studioStore'
import {
  PREVIEW_CHANNEL,
  isFrameMessage,
  type OverlayState,
  type ParentToFrameMessage,
} from '@/types/preview'
import type { PreviewBackground } from '@/types/sandbox'
import type { TreeNode } from '@/types/tree'

type StudioSnapshot = ReturnType<typeof useStudio.getState>

function overlayStateOf(s: StudioSnapshot): OverlayState {
  return {
    selectedId: s.selectedItemId,
    hoveredId: s.hoveredItemId,
    inspect: s.inspect,
    ...s.ui.overlays,
  }
}

const sameOverlay = (a: OverlayState, b: OverlayState) =>
  (Object.keys(a) as (keyof OverlayState)[]).every((k) => a[k] === b[k])

interface PreviewFrameProps {
  items: TreeNode[]
  css: string
  bg: PreviewBackground
  width: number
  height: number
  scale: number
}

/**
 * The sandboxed preview. srcdoc is rebuilt only when the tree changes; CSS and background
 * changes are posted to the runtime inside the frame, which swaps the <style> text in place.
 */
export function PreviewFrame({ items, css, bg, width, height, scale }: PreviewFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const ready = useRef(false)
  const latest = useRef({ css, bg })
  latest.current = { css, bg }

  // Deliberately depends on items only: css/bg are read from the ref when the document is rebuilt.
  const srcDoc = useMemo(() => {
    ready.current = false
    return buildSrcDoc({ items, css: latest.current.css, bg: latest.current.bg, runtime: FRAME_RUNTIME })
  }, [items])

  const post = (message: ParentToFrameMessage) => {
    const target = frameRef.current?.contentWindow
    // The frame has an opaque origin, so "*" is the only possible target origin.
    if (target && ready.current) target.postMessage(message, '*')
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || !isFrameMessage(event.data)) return
      const studio = useStudio.getState()
      const message = event.data
      switch (message.type) {
        case 'ready':
          ready.current = true
          // Anything that changed while the document was loading is applied now.
          post({ channel: PREVIEW_CHANNEL, type: 'set-css', css: latest.current.css })
          post({ channel: PREVIEW_CHANNEL, type: 'set-bg', bg: latest.current.bg })
          post({ channel: PREVIEW_CHANNEL, type: 'set-overlay', state: overlayStateOf(studio) })
          break
        case 'hover':
          studio.setHovered(message.id)
          break
        case 'pick':
          studio.revealItem(message.id)
          break
        case 'inspect-exit':
          studio.setInspect(false)
          break
        case 'info':
          studio.setInspectInfo(message.info)
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      // Measurements are only valid while a preview is showing them.
      useStudio.getState().setInspectInfo(null)
    }
  }, [])

  // Selection, hover, inspect mode and overlay toggles go to the frame's overlay layer.
  useEffect(() => {
    let last = overlayStateOf(useStudio.getState())
    return useStudio.subscribe((s) => {
      const next = overlayStateOf(s)
      if (sameOverlay(next, last)) return
      last = next
      post({ channel: PREVIEW_CHANNEL, type: 'set-overlay', state: next })
    })
  }, [])

  // CSS goes to the frame straight from the store, in the same tick as the edit is committed,
  // instead of waiting for a React render + effect.
  useEffect(
    () =>
      useStudio.subscribe((state) => {
        const next = state.sandboxes[state.activeSandboxId]?.css
        if (next === undefined || next === latest.current.css) return
        latest.current = { ...latest.current, css: next }
        post({ channel: PREVIEW_CHANNEL, type: 'set-css', css: next })
      }),
    [],
  )

  // Covers sandbox switches and anything else that changes the css prop.
  useEffect(() => {
    post({ channel: PREVIEW_CHANNEL, type: 'set-css', css })
  }, [css])

  useEffect(() => {
    post({ channel: PREVIEW_CHANNEL, type: 'set-bg', bg })
  }, [bg])

  return (
    <iframe
      ref={frameRef}
      title="Preview"
      data-testid="preview-frame"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className="block border-0 bg-transparent"
      style={{
        width,
        height,
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    />
  )
}
