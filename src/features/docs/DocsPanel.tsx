import { ChevronRight, ExternalLink, Search, TriangleAlert, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useDocs } from '@/content/docs'
import type { DocEntry } from '@/content/types'
import { findNode } from '@/features/tree/treeOps'
import { cn } from '@/lib/utils'
import { useActiveSandbox, useStudio } from '@/store/studioStore'

/** The selector Try-it writes to: the selected element's first class. */
function useTryTarget(): { selector: string | null; reason: string } {
  const { items } = useActiveSandbox()
  const selectedId = useStudio((s) => s.selectedItemId)
  const node = selectedId ? findNode(items, selectedId) : undefined
  if (!node) return { selector: null, reason: 'Select an element in Items to use Try.' }
  const cls = node.classes[0]
  if (!cls) return { selector: null, reason: `The selected <${node.tag}> has no class. Give it one to use Try.` }
  return { selector: `.${cls}`, reason: '' }
}

export function DocsPanel() {
  const { DOCS_BY_PROPERTY, DOC_GROUPS, searchDocs } = useDocs()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [announcement, setAnnouncement] = useState('')
  const docsFocus = useStudio((s) => s.docsFocus)
  const focusDoc = useStudio((s) => s.focusDoc)
  const target = useTryTarget()
  const entryRefs = useRef(new Map<string, HTMLElement>())

  const results = useMemo(() => searchDocs(query), [searchDocs, query])

  // Jump to an entry requested from an example's property chips or a related link.
  useEffect(() => {
    if (!docsFocus || !DOCS_BY_PROPERTY.has(docsFocus)) return
    setQuery('')
    setOpen((prev) => new Set(prev).add(docsFocus))
    const property = docsFocus
    focusDoc(null)
    requestAnimationFrame(() => {
      const el = entryRefs.current.get(property)
      el?.scrollIntoView({ block: 'start' })
      el?.querySelector('button')?.focus()
    })
  }, [DOCS_BY_PROPERTY, docsFocus, focusDoc])

  const toggle = (property: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(property)) next.delete(property)
      else next.add(property)
      return next
    })

  const renderEntry = (doc: DocEntry) => (
    <DocItem
      key={doc.property}
      itemRef={(el) => {
        if (el) entryRefs.current.set(doc.property, el)
        else entryRefs.current.delete(doc.property)
      }}
      doc={doc}
      // An exact name match (or the only match) opens by itself.
      open={
        open.has(doc.property) || query.trim().toLowerCase() === doc.property || (query !== '' && results.length === 1)
      }
      onToggle={() => toggle(doc.property)}
      selector={target.selector}
      onTried={(value) => setAnnouncement(`Set ${doc.property}: ${value} on ${target.selector}`)}
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="docs-panel">
      <div className="shrink-0 space-y-1.5 border-b p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            aria-label="Search properties"
            placeholder="Search 40+ properties…"
            className="pl-7 pr-7"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.preventDefault()
                setQuery('')
              }
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
              className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <p className="text-2xs text-muted-foreground" data-testid="try-target">
          {target.selector ? (
            <>
              Try writes to <code className="font-mono text-primary">{target.selector}</code>
            </>
          ) : (
            target.reason
          )}
        </p>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {results.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">No property matches “{query}”.</p>
        ) : query ? (
          <ul>{results.map(renderEntry)}</ul>
        ) : (
          DOC_GROUPS.map((group) => (
            <section key={group} aria-labelledby={`docs-${group}`}>
              <h3
                id={`docs-${group}`}
                className="sticky top-0 z-[1] border-b bg-surface px-3 py-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {group}
              </h3>
              <ul>{results.filter((d) => d.group === group).map(renderEntry)}</ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

interface DocItemProps {
  doc: DocEntry
  open: boolean
  onToggle: () => void
  selector: string | null
  onTried: (value: string) => void
  itemRef: (el: HTMLLIElement | null) => void
}

function DocItem({ doc, open, onToggle, selector, onTried, itemRef }: DocItemProps) {
  const tryDeclaration = useStudio((s) => s.tryDeclaration)
  const focusDoc = useStudio((s) => s.focusDoc)
  const bodyId = `doc-${doc.property}`

  return (
    <li ref={itemRef} className={cn('scroll-mt-8 border-b', open && 'bg-muted/40')} data-property={doc.property}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
        className="flex w-full items-start gap-1.5 px-3 py-2 text-left hover:bg-muted/60"
      >
        <ChevronRight
          className={cn('mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
        />
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-xs text-primary">{doc.property}</span>
          <span className="mt-0.5 block text-2xs text-muted-foreground">{doc.summary}</span>
        </span>
      </button>

      {open && (
        <div id={bodyId} className="space-y-2.5 px-3 pb-3 pl-8 text-xs">
          <p className="text-2xs text-muted-foreground">
            Applies to: <span className="text-foreground">{doc.appliesTo}</span>
          </p>
          <p className="leading-relaxed text-foreground/90">{doc.details}</p>

          {doc.gotcha && (
            <p className="flex gap-1.5 rounded-md border border-primary/30 bg-primary/5 p-2 leading-relaxed">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{doc.gotcha}</span>
            </p>
          )}

          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Values of {doc.property}</caption>
            <tbody>
              {doc.values.map((v) => (
                <tr key={v.value} className="border-t first:border-t-0">
                  <th scope="row" className="py-1 pr-2 align-top font-mono text-2xs font-normal">
                    {v.value}
                  </th>
                  <td className="py-1 pr-2 align-top text-2xs text-muted-foreground">{v.note}</td>
                  <td className="w-0 py-1 align-top">
                    <button
                      type="button"
                      disabled={!selector}
                      aria-label={`Try ${doc.property}: ${v.value}`}
                      title={selector ? `Set ${doc.property}: ${v.value} on ${selector}` : undefined}
                      onClick={() => {
                        if (!selector) return
                        tryDeclaration(selector, doc.property, v.value)
                        onTried(v.value)
                      }}
                      className="rounded border px-1.5 py-0.5 text-2xs font-medium hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-inherit"
                    >
                      Try
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center gap-1">
            {doc.related.length > 0 && <span className="text-2xs text-muted-foreground">Related:</span>}
            {doc.related.map((property) => (
              <button
                key={property}
                type="button"
                onClick={() => focusDoc(property)}
                className="rounded border bg-background px-1.5 py-0.5 font-mono text-2xs hover:border-primary"
              >
                {property}
              </button>
            ))}
            <a
              href={`https://developer.mozilla.org/en-US/docs/Web/CSS/${doc.property}`}
              target="_blank"
              rel="noreferrer noopener"
              className="ml-auto inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground"
            >
              MDN <ExternalLink className="size-3" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
      )}
    </li>
  )
}
