import { AppShell } from '@/components/layout/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useResolvedTheme } from '@/lib/useResolvedTheme'

export function App() {
  useResolvedTheme()
  return (
    <TooltipProvider delayDuration={400}>
      <AppShell />
    </TooltipProvider>
  )
}
