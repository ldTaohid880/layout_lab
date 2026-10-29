---
name: new-challenge
description: "Add a new practice challenge (beginner, intermediate or hard) to Layout Lab Studio: starter tree and CSS, brief, hints, solution, reference pictures and tests, in src/content/challenges.ts. Use this whenever the user wants to add, write, draft, extend or review a challenge or practice layout, even if they only say 'add a challenge for pricing cards', 'make a hard one about sticky sidebars', 'another practice layout', or pick something from the challenge backlog (pricing cards, modal over page, form layout, sticky article, chat layout, kanban board)."
---

# Add a challenge to Layout Lab Studio

A challenge is a practice layout. The learner gets a **brief**, a **reference picture** of the target,
optional **hints** and a **solution**, and builds the layout in their own sandbox, comparing with the
Target / Overlay / Diff views. Nothing grades them, so everything the learner needs has to be in the
brief, the picture and the hints. Content is plain typed data checked by tests, so mistakes fail CI
instead of shipping.

## 1. Agree the target (ask only what is missing)

Settle three things before writing: the **topic**, the **level**, and a **one-line goal**. Skip any
the user already gave. Levels:

- **beginner**: one layout idea (centering, a row, equal columns).
- **intermediate**: two ideas combined, or a phone layout, or a positioning trick.
- **hard**: needs a subtle mechanism (stacking contexts, nested grids, min-content, spanning).

## 2. Read before writing

- `src/content/types.ts`: the `Challenge` type (every field is documented there).
- Two existing challenges of a similar level in `src/content/challenges.ts` (and its `solve()`
  helper and `BOX` constant at the top). Copy their shape, not their content.
- README.md, section "Adding a challenge".
- `src/types/tree.ts`: `TAG_NAMES`, the only tags a tree may use.

## 3. Design it

- **Tree (`items`)**: build with `el(tag, classes, textOrChildren, attrs)` from `./instantiate`. A node
  that needs both text and children is an object literal: `{ tag, cls, text, children }`. If the layout
  truly needs a tag that is missing, add it to `TAG_NAMES` (src/types/tree.ts) and `TAG_HINTS`
  (src/features/tree/tags.ts); say so in your summary. Class names must be valid CSS identifiers.
- **Starter CSS (`css`)**: cosmetics only (colours, padding, borders, fonts). Anything that *is* the
  lesson (`display`, `position`, `grid-*`, `flex-*`, `gap`, `z-index`) belongs in the solution.
  Reuse `BOX` for coloured boxes. Add `body { margin: 0 }` when the layout uses viewport heights, or
  the default 8px body margin skews every measurement.
- **Solution**: `solution: solve(starterCss, layoutCss)`. The helper appends the layout under a
  `/* ---- Solution ---- */` marker, and the panel splits on that marker to show only the new part.
- **Brief**: states every number the picture cannot show: sizes, gaps, the width where the layout
  changes, which items span. The picture shows the look but not the numbers.
- **Hints** (at least 2, aim for 3): nudge, then the mechanism, then nearly the answer (name the
  properties). **Concepts**: properties that exist in `src/content/docs.ts`.
- **`viewports`**: widths of the reference pictures, widest first, each 320 to 1600. Typical:
  `[800]`, `[800, 375]`, `[1024, 375]`. Use phone media queries at 600px or less, so the 375 picture
  shows the phone layout and the wider one the desktop layout.
- **`solutionNotes`**: why it works, including the gotcha that makes it hard.
- Keep it deterministic and offline: no remote image URLs, no animation, no randomness. The
  reference pictures are generated from the solution and must reproduce exactly.

## 4. Rules the tests enforce (and why they matter)

- The solution must lint with **zero diagnostics**: valid CSS, no declaration that does nothing
  (`gap` without flex or grid, `z-index` on a static element), and no selector for a class that is not
  in the tree. Learners see the same hints in the editor, so a solution that trips them teaches the
  wrong lesson.
- The starter must have no errors or warnings.
- Concepts must exist in the docs; picture widths must be sane; ids are unique kebab-case.
- Known traps: `flex-basis`/`width` plus padding overflows with the default `content-box` (add
  `box-sizing: border-box`); a spanning item on a one-column phone grid creates an extra implicit
  column unless the media query resets `grid-column`/`grid-row`; unbreakable text needs
  `min-width: 0` or `overflow-wrap`.

## 5. Generate and verify

Run in this order; every step must pass before the next.

1. `npm run references`: renders the solution at each width into `public/references/` and writes
   `manifest.json`. Look at the PNGs (use the Read tool on them): they should look like the brief.
2. `npm run test`: content tests, including "reference pictures are up to date".
3. `./node_modules/.bin/playwright test e2e/challenges.spec.ts`: a per-challenge test is generated
   automatically. It opens the challenge, checks the pictures load, applies the solution and requires
   the learner's preview to match the Target frame element by element.
4. Look at it in the browser (port 5180): the list row (thumbnail, level badge), the challenge view
   (brief, picture, **Start challenge**, hints, Show/Apply solution) and the Diff compare after Apply
   (it should turn black where layouts match).

## 6. Finish

Update the count in README.md ("N layout problems") and add a CHANGELOG.md entry. Report what you
added: title, level, tags added (if any), and the widths. Keep the summary short.

## Environment notes (this project, Windows)

- The C: drive is full. Before any npm/npx command set `npm_config_cache=D:/Mine/layout_lab/.cache/npm`
  and `TMP`/`TEMP` to `D:/Mine/layout_lab/.cache/tmp`. Prefer `./node_modules/.bin/tsc|vitest|playwright`.
- Prettier is not a dependency: `npx --yes prettier --write <files>` (config in `.prettierrc`).
- Edit content files with the Edit/Write tools. Shell heredocs and `node -e` mangle backticks and
  `${...}`, which these files are full of.
- Dev server: port 5180 (`.claude/launch.json`). E2E starts its own on 5181 using installed Chrome.
