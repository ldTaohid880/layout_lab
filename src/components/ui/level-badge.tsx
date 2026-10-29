import { LEVEL_LABELS, type Level } from '@/content/types'
import { cn } from '@/lib/utils'

const STYLES: Record<Level, string> = {
  beginner: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  intermediate: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  hard: 'bg-red-500/15 text-red-700 dark:text-red-300',
}

/** Difficulty chip. The label is always text, so colour is never the only signal. */
export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  return (
    <span
      data-level={level}
      className={cn('shrink-0 rounded px-1.5 py-px text-2xs font-medium', STYLES[level], className)}
    >
      {LEVEL_LABELS[level]}
    </span>
  )
}
