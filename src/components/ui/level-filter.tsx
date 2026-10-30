import { LEVELS, LEVEL_LABELS, type Level } from '@/content/types'
import { cn } from '@/lib/utils'

/** A radio group of chips: one "All" option plus each value. */
export function ChipFilter<T extends string>({
  label,
  values,
  value,
  onChange,
  format = (v) => v,
}: {
  label: string
  values: readonly T[]
  value: T | 'all'
  onChange: (value: T | 'all') => void
  format?: (value: T) => string
}) {
  const options: (T | 'all')[] = ['all', ...values]
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 border-b px-3 py-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'rounded-full border px-2 py-0.5 text-2xs text-muted-foreground hover:text-foreground',
            value === option && 'border-primary bg-primary/10 text-primary hover:text-primary',
          )}
        >
          {option === 'all' ? 'All' : format(option)}
        </button>
      ))}
    </div>
  )
}

/** All / Beginner / Intermediate / Hard. */
export function LevelFilter({ value, onChange }: { value: Level | 'all'; onChange: (value: Level | 'all') => void }) {
  return (
    <ChipFilter
      label="Filter by level"
      values={LEVELS}
      value={value}
      onChange={onChange}
      format={(level) => LEVEL_LABELS[level]}
    />
  )
}
