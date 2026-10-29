import { useEffect, useMemo, useRef } from 'react'

export interface Debounced<A extends unknown[]> {
  (...args: A): void
  /** Run the pending call now, if any. */
  flush: () => void
  cancel: () => void
}

/**
 * Debounce a callback. The latest callback is always used, and a pending call is flushed on
 * unmount so an edit made just before switching sandboxes is never lost.
 */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay: number): Debounced<A> {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const debounced = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let pending: A | undefined

    const run = () => {
      timer = undefined
      if (!pending) return
      const args = pending
      pending = undefined
      fnRef.current(...args)
    }

    const call = ((...args: A) => {
      pending = args
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(run, delay)
    }) as Debounced<A>
    call.flush = () => {
      if (timer !== undefined) clearTimeout(timer)
      run()
    }
    call.cancel = () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      pending = undefined
    }
    return call
  }, [delay])

  useEffect(() => () => debounced.flush(), [debounced])
  return debounced
}
