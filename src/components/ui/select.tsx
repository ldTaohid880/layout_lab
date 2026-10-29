import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption<T extends string> {
  value: T
  label: React.ReactNode
  /** Secondary text shown in the list, right-aligned. */
  hint?: string
  disabled?: boolean
}

interface SelectProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: SelectOption<T>[]
  /** Put on the trigger so a <label htmlFor> can name it. */
  id?: string
  'aria-label'?: string
  className?: string
  /** Monospace trigger and items (tag names, values). */
  mono?: boolean
  'data-testid'?: string
}

/**
 * The app's select: a Radix Select styled like the rest of the UI (no OS-native popup). Keyboard:
 * Space/Enter/arrows open it, type-ahead jumps, Escape closes.
 */
export function Select<T extends string>({
  value,
  onValueChange,
  options,
  id,
  className,
  mono,
  ...rest
}: SelectProps<T>) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => onValueChange(v as T)}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={rest['aria-label']}
        data-testid={rest['data-testid']}
        className={cn(
          'flex h-7 w-full min-w-0 items-center justify-between gap-1 rounded-md border border-input bg-background pl-2 pr-1.5 text-left text-xs transition-colors hover:bg-muted/50 data-[state=open]:border-ring data-[placeholder]:text-muted-foreground',
          mono && 'font-mono',
          className,
        )}
      >
        <span className="truncate">
          <SelectPrimitive.Value />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <SelectPrimitive.ScrollUpButton className="flex h-5 items-center justify-center text-muted-foreground">
            <ChevronUp className="size-3.5" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'relative flex cursor-default select-none items-center gap-3 rounded-sm py-1 pl-6 pr-2 text-xs outline-none focus-visible:ring-0 data-[disabled]:pointer-events-none data-[highlighted]:bg-muted data-[disabled]:opacity-40',
                  mono && 'font-mono',
                )}
              >
                <span className="absolute left-1.5 flex size-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-3.5 text-primary" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                {option.hint && (
                  <span className="ml-auto whitespace-nowrap font-sans text-2xs text-muted-foreground">
                    {option.hint}
                  </span>
                )}
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-5 items-center justify-center text-muted-foreground">
            <ChevronDown className="size-3.5" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
