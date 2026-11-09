import { forceLinting } from '@codemirror/lint'
import type { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useMemo, useRef, useState } from 'react'
import { editorExtensions } from './extensions'
import { collectElementClasses } from '@/features/tree/treeOps'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { useStudio } from '@/store/studioStore'

const CSS_DEBOUNCE_MS = 150

/** Remount per sandbox so undo history and the debounced write never cross sandboxes. */
export function CssEditor() {
  const sandboxId = useStudio((s) => s.activeSandboxId)
  return <SandboxCssEditor key={sandboxId} sandboxId={sandboxId} />
}

function SandboxCssEditor({ sandboxId }: { sandboxId: string }) {
  const storeCss = useStudio((s) => s.sandboxes[sandboxId]?.css ?? '')
  const items = useStudio((s) => s.sandboxes[sandboxId]?.items)
  const setCss = useStudio((s) => s.setCss)
  const [value, setValue] = useState(storeCss)
  const committed = useRef(storeCss)
  const viewRef = useRef<EditorView | null>(null)

  const commit = useDebouncedCallback((css: string) => {
    committed.current = css
    setCss(sandboxId, css)
  }, CSS_DEBOUNCE_MS)

  // External changes (Reset, applying an example, docs Try-it) replace the editor content.
  useEffect(() => {
    if (storeCss !== committed.current) {
      commit.cancel()
      committed.current = storeCss
      setValue(storeCss)
    }
  }, [storeCss, commit])

  // Hints depend on the tree (e.g. unknown classes), so re-lint when it changes.
  useEffect(() => {
    if (viewRef.current) forceLinting(viewRef.current)
  }, [items])

  const extensions = useMemo(
    () =>
      editorExtensions(() => {
        const sandbox = useStudio.getState().sandboxes[sandboxId]
        return { elementClasses: sandbox ? collectElementClasses(sandbox.items) : [] }
      }),
    [sandboxId],
  )

  return (
    <CodeMirror
      className="h-full"
      height="100%"
      value={value}
      theme="none"
      extensions={extensions}
      onCreateEditor={(view) => {
        viewRef.current = view
      }}
      basicSetup={{
        foldGutter: false,
        highlightActiveLineGutter: true,
        autocompletion: true,
        closeBrackets: true,
        bracketMatching: true,
        tabSize: 2,
      }}
      onChange={(next) => {
        setValue(next)
        commit(next)
      }}
    />
  )
}
