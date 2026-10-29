import { useEffect } from 'react'
import { useMediaQuery } from './useMediaQuery'
import { useStudio } from '@/store/studioStore'

/** Resolve the theme preference and apply it to <html> for the app chrome. */
export function useResolvedTheme(): 'light' | 'dark' {
  const preference = useStudio((s) => s.ui.theme)
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.style.colorScheme = resolved
  }, [resolved])

  return resolved
}
