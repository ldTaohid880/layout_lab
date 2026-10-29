import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface RenameInputProps {
  initial: string
  /** The new name, or null when cancelled with Escape. Called once. */
  onDone: (name: string | null) => void
  className?: string
}

/** Inline name editor: Enter or blur saves, Escape cancels. Selects the text on mount. */
export function RenameInput({ initial, onDone, className }: RenameInputProps) {
  const [value, setValue] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)
  const finished = useRef(false)

  useEffect(() => {
    // Wait a frame so a closing menu does not steal focus back.
    const id = requestAnimationFrame(() => {
      ref.current?.focus()
      ref.current?.select()
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const finish = (name: string | null) => {
    if (finished.current) return
    finished.current = true
    onDone(name)
  }

  return (
    <Input
      ref={ref}
      aria-label="Sandbox name"
      value={value}
      maxLength={120}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(value)}
      onKeyDown={(e) => {
        // Keep keys like Delete and the arrows for text editing, not for the tab strip.
        e.stopPropagation()
        if (e.key === 'Enter') finish(value)
        if (e.key === 'Escape') finish(null)
      }}
      className={cn('h-6 w-full border-primary font-medium', className)}
    />
  )
}
