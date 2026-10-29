---
name: new-example
description: "Add a new guided example to Layout Lab Studio's Examples tab: a worked layout with an explanation, things to try and linked properties, in src/content/examples.ts. Use this whenever the user wants to add, write or extend an example, demo layout or worked layout to study (not a practice challenge), even if they say 'add an example for X', 'show how a pricing card row works', or 'we need more flexbox/grid/positioning examples'. For practice problems with a brief and solution use new-challenge instead."
---

# Add an example to Layout Lab Studio

An example is a layout the learner **reads and then applies** (to the current sandbox or a new one) so
they can experiment: an explanation, a few "try this" experiments, and chips linking to the docs for
the properties it uses. Unlike a challenge it has no brief to solve, no hints and no solution.

## 1. Agree the target

Ask only what is missing: the **topic** (what idea should the learner walk away with), the
**category** (`Flexbox`, `Grid`, `Positioning` or `Sizing & overflow`) and the **level** (`beginner`,
`intermediate` or `hard`). An example should teach one idea well; if it needs two, make two.

## 2. Read before writing

- `src/content/types.ts`: the `Example` type.
- Two nearby files in `src/content/examples/`: match their tone.
- `src/content/docs.ts`: every property in `concepts` must have a doc entry.
- `src/types/tree.ts`: the allowed tags.

## 3. Write the entry

Create one file per example: `src/content/examples/<id>.json`. The index picks up every file in that
folder, so no other registration is needed. The file name must match `id`.

```json
{
  "id": "kebab-case-unique",
  "title": "Short title",
  "category": "Grid",
  "level": "beginner",
  "summary": "One line for the list.",
  "concepts": ["grid-template-columns", "gap"],
  "explanation": ["What the CSS does.", "The one thing people get wrong."],
  "tryThis": ["Change X to Y and notice Z.", "Remove X: what breaks?"],
  "items": [
    { "tag": "div", "cls": "wrap", "children": [{ "tag": "div", "cls": "cell", "text": "A" }] }
  ],
  "css": ".wrap {\n  display: grid;\n  gap: 12px;\n}\n"
}
```

- **items** are plain nodes: `tag` (one of `src/types/tree.ts`), optional `cls` (space-separated),
  `text`, `attrs` and `children`. JSON has no functions, so write the CSS out in full: there is no
  `BOX` constant. Copy the box look from a nearby file (`background`, `border`, `border-radius`).
- **css** is a JSON string: escape newlines as `\n` and quotes as `\"`.

- **Explanation**: 2 or 3 short paragraphs. Say what each key property does, and name the common
  mistake. Write for someone who knows JS but not CSS layout.
- **tryThis**: concrete experiments that change one thing and name the expected effect.
- **CSS**: the layout *and* enough cosmetics (`BOX`) to see it. It must lint with **zero
  diagnostics**, including the layout hints (no `gap` without flex/grid, no `z-index` on a static
  element) and no selector for a class missing from the tree. Learners see those same hints.
- Keep it offline and deterministic (no remote images, no animation).

## 4. Verify

1. **Update the hard-coded count**: `src/content/content.test.ts` has
   `expect(EXAMPLES).toHaveLength(N)`. Set N to the new total (the number of JSON files).
2. `npm run test`: checks unique ids, a valid tree, zero lint diagnostics, concepts in docs.
3. In the browser (port 5180): Examples tab, open the entry, **Apply here**, see the layout, press
   **Undo** in the toast, and click a concept chip (it should open the docs entry).
4. Update the count in README.md ("N guided layouts") and add a CHANGELOG.md entry.

## Environment notes (this project, Windows)

- The C: drive is full. Before npm/npx set `npm_config_cache=D:/Mine/layout_lab/.cache/npm` and
  `TMP`/`TEMP` to `D:/Mine/layout_lab/.cache/tmp`. Prefer `./node_modules/.bin/vitest|tsc`.
- Prettier: `npx --yes prettier --write <files>`.
- Write the JSON with the Write tool: shell heredocs can mangle the quotes and `\n` escapes.
