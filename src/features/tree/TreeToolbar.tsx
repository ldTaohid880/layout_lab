import { Copy, CornerDownRight, ListPlus, Trash2 } from 'lucide-react'
import { TAG_HINTS } from './tags'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Hint } from '@/components/ui/tooltip'
import { TAG_NAMES, type TagName } from '@/types/tree'

const TAG_OPTIONS = TAG_NAMES.map((t) => ({ value: t, label: `<${t}>`, hint: TAG_HINTS[t] }))

interface TreeToolbarProps {
  tag: TagName
  onTagChange: (tag: TagName) => void
  hasSelection: boolean
  canAddChild: boolean
  onAddChild: () => void
  onAddSibling: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function TreeToolbar({
  tag,
  onTagChange,
  hasSelection,
  canAddChild,
  onAddChild,
  onAddSibling,
  onDuplicate,
  onDelete,
}: TreeToolbarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-1.5">
      <label htmlFor="new-element-tag" className="sr-only">
        Tag for new elements
      </label>
      <Select
        id="new-element-tag"
        className="w-[5.75rem]"
        mono
        value={tag}
        onValueChange={onTagChange}
        options={TAG_OPTIONS}
      />

      <Hint label={hasSelection ? 'Add inside the selected element' : 'Add at the top level'}>
        <Button variant="secondary" size="sm" onClick={onAddChild} disabled={!canAddChild}>
          <CornerDownRight />
          {hasSelection ? 'Add child' : 'Add'}
        </Button>
      </Hint>
      <Hint label="Add after the selected element">
        <Button variant="ghost" size="sm" onClick={onAddSibling} disabled={!hasSelection}>
          <ListPlus />
          Sibling
        </Button>
      </Hint>

      <div className="ml-auto flex items-center">
        <Hint label="Duplicate (Ctrl+D)">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Duplicate element"
            onClick={onDuplicate}
            disabled={!hasSelection}
          >
            <Copy />
          </Button>
        </Hint>
        <Hint label="Delete (Del)">
          <Button variant="ghost" size="icon" aria-label="Delete element" onClick={onDelete} disabled={!hasSelection}>
            <Trash2 />
          </Button>
        </Hint>
      </div>
    </div>
  )
}
