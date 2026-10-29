import { Monitor, Moon, Sun } from 'lucide-react'
import { SandboxTabs } from './SandboxTabs'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/tooltip'
import { useStudio } from '@/store/studioStore'
import type { ThemePreference } from '@/types/sandbox'

const THEME_CYCLE: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' }
const THEME_ICON = { system: Monitor, light: Sun, dark: Moon }

export function TopBar() {
  const theme = useStudio((s) => s.ui.theme)
  const setUi = useStudio((s) => s.setUi)
  const ThemeIcon = THEME_ICON[theme]

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-surface px-3">
      <div className="flex items-center gap-2 pr-2">
        <Logo />
        <span className="hidden text-xs font-semibold tracking-tight sm:inline">Layout Lab</span>
      </div>
      <SandboxTabs />

      <div className="flex shrink-0 items-center gap-1">
        <Hint label={`Theme: ${theme}`}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Theme: ${theme}. Switch to ${THEME_CYCLE[theme]}`}
            onClick={() => setUi({ theme: THEME_CYCLE[theme] })}
          >
            <ThemeIcon />
          </Button>
        </Hint>
      </div>
    </header>
  )
}

function Logo() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-5">
      <rect x="1.5" y="1.5" width="7" height="17" rx="1.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.6" />
      <rect x="11" y="1.5" width="7.5" height="7.5" rx="1.5" fill="hsl(var(--primary))" />
      <rect
        x="11"
        y="11"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill="none"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="1.6"
      />
    </svg>
  )
}
