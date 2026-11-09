/** Shown while a lazily loaded panel or its content loads (LL-013). */
export function PanelFallback() {
  return (
    <p role="status" className="p-3 text-2xs text-muted-foreground">
      Loading…
    </p>
  )
}
