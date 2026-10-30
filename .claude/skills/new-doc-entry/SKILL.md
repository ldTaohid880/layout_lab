---
name: new-doc-entry
description: "Add or extend a CSS property entry in Layout Lab Studio's Docs tab (one JSON file in src/content/docs/): summary, details, values with Try buttons, gotcha and related properties. Use this whenever the user wants to document a property, add a property to the docs, fix or improve a doc entry, or asks which properties are missing from the reference, even if they just say 'add docs for order' or 'document place-content'."
---

# Add a docs entry to Layout Lab Studio

The Docs tab is a searchable reference of layout properties. Each value has a **Try** button that
writes `property: value` into the rule for the selected element's first class, so entries are
interactive, not just text.

## 1. Pick the property and check it is not there

Look for `src/content/docs/<name>.json`. If it exists, edit it instead of adding a duplicate.
Entries are grouped, in this order, under one of: `Box & display`, `Flex container`,
`Flex item`, `Grid container`, `Grid item`, `Positioning`, `Media`, `Typography`,
`Colour & backgrounds`, `Borders & effects`, `Responsive`, `Motion` (`DOC_GROUPS` in
`src/content/docs/index.ts`).

## 2. Write the entry (type: `DocEntry` in `src/content/types.ts`)

Create `src/content/docs/<property>.json` (the file name must match `property`), then add the
property to the end of its group's list in `DOC_ORDER` (`src/content/docs/order.ts`). That list sets
the order of the Docs tab; a test fails if a file is missing from it, listed twice, or listed under
a group other than its own `group`.

```json
{
  "property": "order",
  "group": "Flex item",
  "appliesTo": "flex and grid items",
  "summary": "One sentence: what it controls.",
  "details": "How it behaves, in plain words, including the default.",
  "values": [
    { "value": "-1", "note": "Move to the front." },
    { "value": "1", "note": "Move after items with 0." }
  ],
  "gotcha": "The one mistake people make (optional, shown highlighted).",
  "related": ["flex-direction"]
}
```

- **values**: 3 to 6 that teach the property: the default, the common ones, and one surprising one.
  Each is applied as a **single declaration** `property: value` by Try, so it must make sense on
  its own, and it must be valid for the property (a test parses every one with css-tree).
- **appliesTo**: where the property goes (which element), because the commonest bug is putting a
  container property on an item or the reverse.
- **gotcha**: include one whenever there is a well-known trap (for example `justify-items` does
  nothing in flexbox; `z-index` cannot escape a stacking context).
- **related**: properties that work together, each of which must have its own entry. Add the
  related entry first, or leave the link out.
- Use the real CSS property name: the MDN link is built from it.

## 3. Verify

1. `npm run test`: checks that every value parses for its property, every `related` exists, names are
   unique, and the entry is findable by search.
2. In the browser (port 5180): Docs tab, search for the property (an exact name opens it), select an
   element with a class in the Items tab, press **Try** on a value and watch the preview and the
   editor change. Also check the "Related" chips jump to the right entries.
3. If you added entries, update the count in README.md ("N layout properties"). The test only needs
   at least 40. Add a CHANGELOG.md entry.

## Environment notes (this project, Windows)

- The C: drive is full. Before npm/npx set `npm_config_cache=D:/Mine/layout_lab/.cache/npm` and
  `TMP`/`TEMP` to `D:/Mine/layout_lab/.cache/tmp`. Prefer `./node_modules/.bin/vitest|tsc`.
- Write the JSON with the Write tool: shell heredocs can mangle the quotes and escapes.
