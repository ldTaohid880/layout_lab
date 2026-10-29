import * as React from 'react'
import { cn } from '@/lib/utils'

/** Multi-line text field matching Input. Grows vertically only. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'block min-h-[3.25rem] w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-xs leading-relaxed placeholder:text-muted-foreground/70 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
