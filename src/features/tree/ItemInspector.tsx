import { Plus, X } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { TAG_HINTS, VOID_TAGS, isAllowedAttr, parseClassList } from './tags'
import { findNode } from './treeOps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutReport } from '@/features/inspect/LayoutReport'
import { sanitizeImageSrc } from '@/features/preview/generateHtml'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { cn } from '@/lib/utils'
import { useActiveSandbox, useStudio } from '@/store/studioStore'
import { TAG_NAMES, type TagName, type TreeNode } from '@/types/tree'

export function ItemInspector() {
  const { items } = useActiveSandbox()
  const selectedId = useStudio((s) => s.selectedItemId)
  const node = selectedId ? findNode(items, selectedId) : undefined
  const [tab, setTab] = useState('element')
  const empty = (
    <p className="p-3 text-xs text-muted-foreground">Select an element in the tree, or pick one in the preview.</p>
  )

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex h-full min-h-0 flex-col">
      <TabsList aria-label="Selected element">
        <TabsTrigger value="element">Element</TabsTrigger>
        <TabsTrigger value="layout">Layout</TabsTrigger>
      </TabsList>
      <TabsContent value="element" className="flex flex-col">
        {/* Keyed so local field drafts reset when the selection changes. */}
        {node ? <InspectorFields key={node.id} node={node} /> : empty}
      </TabsContent>
      <TabsContent value="layout" className="overflow-auto">
        {node ? <LayoutReport nodeId={node.id} /> : empty}
      </TabsContent>
    </Tabs>
  )
}

function InspectorFields({ node }: { node: TreeNode }) {
  const updateItem = useStudio((s) => s.updateItem)
  const [classDraft, setClassDraft] = useState(node.classes.join(' '))
  const { invalid } = parseClassList(classDraft)

  // Classes can also change from the tree's inline editor; resync the draft when they diverge.
  const joined = node.classes.join(' ')
  useEffect(() => {
    if (parseClassList(classDraft).classes.join(' ') !== joined) setClassDraft(joined)
  }, [joined]) // classDraft omitted on purpose: only external changes should resync
  const isVoid = VOID_TAGS.has(node.tag)
  const ids = { tag: useId(), classes: useId(), text: useId(), classErr: useId() }

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
      <Field label="Tag" htmlFor={ids.tag} hint={TAG_HINTS[node.tag]}>
        <Select
          id={ids.tag}
          mono
          value={node.tag}
          onValueChange={(tag: TagName) => updateItem(node.id, { tag })}
          options={TAG_NAMES.map((t) => ({
            value: t,
            label: t,
            // A tag that cannot have children is not offered while there are children.
            disabled: VOID_TAGS.has(t) && node.children.length > 0,
          }))}
        />
      </Field>

      <Field label="Classes" htmlFor={ids.classes}>
        <Input
          id={ids.classes}
          data-testid="inspector-classes"
          className="font-mono"
          value={classDraft}
          placeholder="box card--active"
          aria-invalid={invalid.length > 0}
          aria-describedby={invalid.length ? ids.classErr : undefined}
          onChange={(e) => {
            setClassDraft(e.target.value)
            updateItem(node.id, { classes: parseClassList(e.target.value).classes })
          }}
        />
        {invalid.length > 0 && (
          <p id={ids.classErr} className="mt-1 text-2xs text-destructive">
            Not a valid class name: {invalid.join(', ')}
          </p>
        )}
      </Field>

      {node.tag === 'img' && <ImageSourceField node={node} />}

      {!isVoid && (
        <Field label="Text" htmlFor={ids.text}>
          <Textarea
            id={ids.text}
            value={node.text}
            rows={2}
            placeholder="Text content"
            onChange={(e) => updateItem(node.id, { text: e.target.value })}
          />
        </Field>
      )}

      <AttributesEditor node={node} />
    </div>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        {hint && <span className="truncate text-2xs text-muted-foreground/80">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/**
 * The address of an <img>. Only absolute https URLs are accepted (anything else keeps the built-in
 * placeholder), and the value is saved once typing pauses, on Enter, or on blur, so a half-typed
 * address never triggers a stream of image requests.
 */
function ImageSourceField({ node }: { node: TreeNode }) {
  const updateItem = useStudio((s) => s.updateItem)
  const saved = node.attrs.src ?? ''
  const [draft, setDraft] = useState(saved)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')
  const ids = { input: useId(), error: useId() }
  const trimmed = draft.trim()
  const invalid = trimmed !== '' && sanitizeImageSrc(trimmed) === null

  const commit = (value: string) => {
    const next = value.trim()
    const { src: _previous, ...rest } = node.attrs
    if (next === '') {
      if (saved !== '') updateItem(node.id, { attrs: rest })
      return
    }
    const ok = sanitizeImageSrc(next)
    if (ok && ok !== saved) updateItem(node.id, { attrs: { ...rest, src: ok } })
  }
  const commitSoon = useDebouncedCallback(commit, 700)

  // A new committed address starts loading again; an external change (undo, example) resyncs the draft.
  useEffect(() => {
    setStatus('loading')
    if (saved !== (sanitizeImageSrc(draft) ?? draft.trim())) setDraft(saved)
  }, [saved]) // draft omitted on purpose: only external changes should resync

  return (
    <Field label="Image URL" htmlFor={ids.input}>
      <Input
        id={ids.input}
        data-testid="inspector-image-src"
        className="font-mono"
        value={draft}
        placeholder="https://example.com/photo.jpg"
        spellCheck={false}
        autoComplete="off"
        aria-invalid={invalid}
        aria-describedby={invalid ? ids.error : undefined}
        onChange={(e) => {
          setDraft(e.target.value)
          commitSoon(e.target.value)
        }}
        onBlur={() => {
          commitSoon.cancel()
          commit(draft)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitSoon.cancel()
            commit(draft)
          }
        }}
      />
      {invalid && (
        <p id={ids.error} className="mt-1 text-2xs text-destructive">
          Use a full https:// address (http://, relative paths and data: are not loaded).
        </p>
      )}
      {saved === '' ? (
        <p className="mt-1 text-2xs text-muted-foreground">Empty: the built-in placeholder is shown.</p>
      ) : (
        <div className="mt-1.5 flex items-center gap-2">
          <img
            key={saved}
            src={saved}
            alt=""
            referrerPolicy="no-referrer"
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('failed')}
            className={cn('h-10 w-16 shrink-0 rounded border bg-white object-cover', status === 'failed' && 'hidden')}
          />
          <p
            role="status"
            data-testid="image-status"
            className={cn(
              'min-w-0 flex-1 text-2xs',
              status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {status === 'loading' && 'Loading…'}
            {status === 'loaded' && 'Loaded.'}
            {status === 'failed' && "Couldn't load this image. Check the address; some sites block use on other pages."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              commitSoon.cancel()
              setDraft('')
              commit('')
            }}
          >
            Use placeholder
          </Button>
        </div>
      )}
    </Field>
  )
}

function AttributesEditor({ node }: { node: TreeNode }) {
  const updateItem = useStudio((s) => s.updateItem)
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const trimmed = name.trim().toLowerCase()
  const nameError =
    trimmed && !isAllowedAttr(trimmed)
      ? 'Allowed: id, title, href, alt, role, type, lang, dir, tabindex, hidden, aria-*, data-*'
      : null
  const errId = useId()

  const setAttrs = (attrs: Record<string, string>) => updateItem(node.id, { attrs })

  const add = () => {
    if (!trimmed || nameError) return
    setAttrs({ ...node.attrs, [trimmed]: value })
    setName('')
    setValue('')
  }

  return (
    <fieldset>
      <legend className="mb-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Attributes</legend>
      <div className="space-y-1">
        {Object.entries(node.attrs)
          .filter(([key]) => key !== 'src') // edited through the Image URL field, which validates it
          .map(([key, val]) => (
            <div key={key} className="flex items-center gap-1">
              <span className="w-20 shrink-0 truncate font-mono text-2xs text-muted-foreground" title={key}>
                {key}
              </span>
              <Input
                aria-label={`Value of ${key}`}
                value={val}
                onChange={(e) => setAttrs({ ...node.attrs, [key]: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${key}`}
                onClick={() => {
                  const { [key]: _removed, ...rest } = node.attrs
                  setAttrs(rest)
                }}
              >
                <X />
              </Button>
            </div>
          ))}
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <Input
            aria-label="New attribute name"
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? errId : undefined}
            className="w-20 shrink-0 font-mono"
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            aria-label="New attribute value"
            placeholder="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Add attribute"
            disabled={!trimmed || Boolean(nameError)}
          >
            <Plus />
          </Button>
        </form>
        {nameError && (
          <p id={errId} className="text-2xs text-destructive">
            {nameError}
          </p>
        )}
      </div>
    </fieldset>
  )
}
