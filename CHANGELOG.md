# Changelog

## Ten more examples (2026-10-29)

### Added
- **Examples (51 total):** a featured card spanning the row (`grid-column: 1 / -1`), column-first
  grid flow (`grid-auto-flow: column`), a segmented control (`flex: 1`), breadcrumbs with gap,
  baseline-aligned text (`align-items: baseline`), packed wrapped rows (`align-content`),
  content-box versus border-box, a code block that scrolls sideways, an offset photo frame, and a
  dropdown menu.
- Content test now expects 51 examples.

## Four more examples: justify-items, toast, responsive card, hero caption (2026-10-29)

### Added
- **Examples (41 total):** aligning grid items inside their cells (`justify-items`,
  `align-items`), a toast pinned to a corner (`inset`), a card that stacks on phones
  (`flex-direction` in a media query), and a caption over a hero image.
- Content test now expects 41 examples.

## Four more examples: calendar, chips, app frame, corner ribbon (2026-10-29)

### Added
- **Examples (37 total):** a calendar month grid (`grid-column` for the first weekday), wrapping
  centred chips (`flex-wrap`, `justify-content`), a flex-only app frame, and a corner ribbon
  (`position` with `overflow: hidden`).
- Content test now expects 37 examples.

## Four more examples: dialog, timeline, figure, sticky table (2026-10-29)

### Added
- **Examples (33 total):** a dialog with a scrolling body (`min-height: 0`), a timeline with
  positioned dots, an image caption that fits its frame (`aspect-ratio`, `object-fit`), and a
  scrolling table with a sticky header.
- Content test now expects 33 examples.

## Three complex examples (2026-10-29)

### Added
- **Examples (29 total), all `hard`:** a dashboard shell with named grid areas and a sticky sidebar,
  pricing tiers with auto-fit columns and a lifted featured plan, and a kanban board with
  horizontally scrolling, independently scrolling columns.
- Content test now expects 29 examples.

## Four more guided examples (2026-10-29)

### Added
- **Examples (26 total):** vertical stack with `gap`, a search bar with a growing field
  (`flex-grow`, `flex-shrink`), an overlapping avatar stack (negative margins with `z-index`), and a
  tooltip above a button (`position: absolute` with `top`).
- Content test now expects 26 examples.

## Examples as JSON, four more guided layouts (2026-10-29)

### Changed
- **Examples are one JSON file each** in `src/content/examples/` (replacing the single
  `examples.ts`). `index.ts` loads every file in the folder with `import.meta.glob`, so a new
  example is a new file. Items are plain nodes, so the CSS is written out in full (no `BOX`
  constant).

### Added
- **Examples (22 total):** dialog over a backdrop (`position` + `inset`), equal-height cards
  (`align-items: stretch` and `margin-top: auto`), a mosaic with spanning tiles (`grid-column`,
  `grid-row`, `grid-auto-flow: dense`), a fluid panel with a max width (`box-sizing`), one item with
  its own alignment (`align-self`), reordering with `order`, a settings grid with `justify-self`,
  and text wrapping around a `float`.
- Content test now expects 22 examples.

## Axis labels, deselecting and Reset in the tab menu (2026-10-29)

- **Axis arrows:** each caption now sits on its own line (the vertical one reads top to bottom), so
  nothing floats beside the arrows. **Layout tab:** a "Show axes in preview" switch turns the arrows
  on or off without touching the rest of the Flex & grid overlay (saved in `ui.overlays.axes`).
- **Deselect:** click the selected element again, click empty space in the tree, or press `Escape`.
- **Reset** moved from the top bar into the tab's right-click menu ("Reset sandbox…", asks first;
  it switches to that tab).
- Totals: 256 unit/component and 59 E2E, on both the dev server and the production build.

## Sandbox tabs, image URLs, axis arrows, Start/Continue and content skills (2026-10-29)

### Added
- **Sandboxes as browser-style tabs** in the top bar (replacing the dropdown): click to switch,
  **+** for a new one, double-click or `F2` to rename, drag to reorder, right-click for Rename /
  Duplicate / Close, middle-click or `Delete` to close. **Closing deletes the sandbox**, with a
  confirmation only when it was edited; closing the last tab leaves a fresh sandbox. Roving
  tabindex with `← → Home End`, `role="tablist"`, a trophy icon for challenge sandboxes, and the
  active tab scrolls into view. New: `reorderSandboxes` in the store, a context-menu component
  (`@radix-ui/react-context-menu`).
- **Axis arrows** on the Flex & grid overlay: two labelled arrows from one corner of the container,
  blue for main (flex) or inline (grid), teal for cross or block. They follow `flex-direction`,
  `flex-wrap: wrap-reverse` and `direction: rtl`, and name the properties that work along each
  axis. The Layout tab has a matching **Axes** list in words. Writing modes other than horizontal
  are not handled (noted in the code).
- **`<img>` `src`**: an **Image URL** field in the inspector. Only absolute `https://` URLs load
  (no credentials, http, data:, relative or protocol-relative), otherwise the placeholder stays. It
  saves on Enter, blur or after a 700ms pause, so half-typed addresses never trigger requests, and
  shows a thumbnail, a loaded/failed status and **Use placeholder**.
- **Content skills** for Claude Code in `.claude/skills/`: `new-challenge`, `new-example` and
  `new-doc-entry`, each with the file format, the rules the tests enforce and the verify steps.

### Changed
- **Start / Continue moved into the challenge view** (top right). Clicking a list row now only opens
  the challenge to read; hints, the solution and Reset appear after **Start challenge**. List rows
  of started challenges show **In progress** instead of a Start/Continue label.
- **Preview CSP** is now `img-src data: https:` (was `data:`), plus `<meta name="referrer"
  content="no-referrer">` and `referrerpolicy` on remote images. Scripts, fonts, frames and
  connections stay blocked. `background-image: url(https://…)` in a learner's CSS now loads too.
- Deleting the active sandbox resets the compare mode and drops an Undo toast that pointed at it.
- The frame runtime exports `flexAxes` / `gridAxes` (shipped into the frame, unit-tested).

### Fixed
- `sanitizeImageSrc` first accepted `https:///a.png` and treated `a.png` as the host; a host must now
  follow `https://` directly, and backslashes are refused.
- Tab arrow keys moved focus a frame late, so fast typing could act on the previous tab.

### Tests
- Unit: axes for every direction × wrap × text direction, `sanitizeImageSrc` (accepts and 18
  rejections), the srcdoc output and CSP, `reorderSandboxes`.
- E2E: `sandbox-tabs.spec.ts`, `images.spec.ts` (mocked https host), the axes test in
  `overlays.spec.ts`, and Start/Continue in `challenges.spec.ts`.
- Totals: 256 unit/component and 56 E2E, on both the dev server and the production build.

## Removed: the challenge checking feature (2026-10-29)

Challenges no longer grade your layout. You work from the brief, the reference picture, hints and
the Target / Overlay / Diff compare, and can always reveal the solution. Entries below that
mention checks, the checklist, the `spans` check or `1024` measuring describe what existed before
this change.

### Removed
- The **checklist** under each challenge (pass/fail list, "5/13 checks" chip in the preview bar,
  "Solved" banner, "Measured at…" note).
- The **check engine** (`features/challenges/checks.ts` and its tests), the hidden measuring
  frames (`ChallengeChecker`), the `checkResults` store state, and the `LayoutSnapshot` /
  `snapshot` message the preview frame answered with.
- Every challenge's `checks` list. The challenge content type no longer has `checks`.

### Changed
- Challenges now carry `viewports` (e.g. `[1024, 375]`): the widths of their reference pictures.
  Existing pictures are unchanged (same widths, same content hashes).
- The preview bar above a challenge shows "Compare with target" with the Yours / Target /
  Overlay / Diff switch.
- The challenge list text says to match the reference picture instead of passing checks.
- **Tests**: the old "starter fails, solution passes" proof is replaced by "Apply solution makes
  your preview match the Target frame, element by element". It runs for all 11 challenges in a real
  browser. Content tests now also require every solution to lint with zero diagnostics (valid
  CSS, no no-op declarations, only real classes) and to build on its starter. Totals: 223
  unit/component and 38 E2E tests.

## Ranked challenges, reference pictures and the Dashboard grid (2026-10-29)

### Added
- **Levels: Beginner / Intermediate / Hard** for challenges and examples, shown as a coloured
  badge (always with a text label) and a level filter above the challenge list. Existing
  challenges are re-levelled: 3 beginner, 4 intermediate, 4 hard.
- **Reference pictures for every challenge**, including the existing ten. `npm run references`
  renders each solution in Chrome at every checked width and saves PNGs to `public/references/`
  with a manifest of content hashes. They show as thumbnails in the list, as a gallery in the
  challenge, and full size in a dialog (width switcher, Esc closes and returns focus to the
  thumbnail). A unit test fails with `run "npm run references"` if a challenge changed without
  regenerating its pictures.
- **New challenge: Dashboard grid (Hard).** Top bar, 220px sidebar and a board of cards in
  three equal columns; Revenue spans two columns and Activity two rows. It is measured at 1024px
  and at 375px, where everything stacks. 13 checks, 3 hints and 2 alternative solutions in E2E
  (explicit line numbers; a flex page frame).
- **`spans` check**: an item covers N grid tracks (`N × unit + (N − 1) × gap`), with failures
  like "It spans 1 column (240px), expected 2 (496px)". 1024px is now a supported measurement
  width, and the panel's "Measured at…" line lists the real widths.
- **New tags**: `article`, `aside`, `h2`, `h3` (needed by the dashboard).
- A general `Dialog` component (`@radix-ui/react-dialog`, now an explicit dependency).
- **Tests**: 226 unit/component and 43 E2E. The E2E additions: dashboard starter fails and
  solution passes, both alternatives, the level filter, reference images load, dialog and focus.

### Fixed
- The reference dialog first lost keyboard focus on close (Radix restores it only to a
  `Trigger`, and this dialog is controlled). It now returns to the thumbnail that opened it.

## UI fixes (2026-10-29)

### Fixed
- **Left tabs were clipped** in narrow panes ("ITEMS" scrolled out of view). The tab strip now
  adapts to its measured width: all labels when they fit, icons plus the active tab's label when
  narrower, icons only (with tooltips) when very narrow. Tabs never scroll or clip.

### Changed
- **No native form controls left.**
  - **Selects:** the three `<select>`s (tag for new elements, inspector tag, preview background)
    are now a themed Radix Select. The tag lists show each tag's hint, and void tags are disabled
    when the element has children.
  - **Text field:** the inspector's text field uses a shared `Textarea`.
  - **Search:** docs search hides the browser's clear button, shows its own, and Esc clears it.
  - **Keyboard help:** the `<details>` disclosure is now a button with `aria-expanded`.
  - **Other inputs:** sandbox rename and the inline class editor use the shared `Input`.
- Added `@radix-ui/react-select`. `useElementSize` moved to `src/lib`.
- **Tests:** tabs checked for clipping at 1440/1100/900/800px, plus custom selects by mouse and
  keyboard, search clear, and the disclosure. 200 unit, 37 E2E.

## Milestone 4: challenges (2026-10-29)

Sharing and progress tracking are out of scope for now.

### Added
- **10 challenges**, from basics to advanced: center the card, toolbar, three equal columns,
  responsive card grid, sidebar layout, sticky footer, corner badge, a stacking-context puzzle
  ("Bring B to the front"), holy grail, and taming a long unbroken word.
- Each challenge opens in its own sandbox (`Challenge: …`) built from a starter tree and
  cosmetic CSS; starting it again continues that sandbox.
- **Live checks**: measured in hidden frames at 800px (and 375px where the challenge is
  responsive), independent of the visible preview. They are re-run 300ms after each edit. The
  checklist explains failures with measurements ("Found a 12px gap, expected 16px").
- **Check engine** (`features/challenges/checks.ts`): 12 outcome-based check kinds over a
  `LayoutSnapshot` the frame runtime now reports (box, content box, display, position, z-index,
  overflow, and what is painted on top at each element's centre).
- **Hints** revealed one at a time, property chips into the docs, **Show solution** with an
  explanation and **Apply solution**, and **Reset to starter** with confirmation and Undo.
- **Compare with target** above the preview: Yours, Target, Overlay (50%) and Diff (difference
  blend).
- **Tests**: check engine unit tests, content validation (selectors exist in the starter tree,
  starter and solution CSS lint clean, concepts link to docs), and 17 Playwright tests.
  - **Every challenge, in a real browser:** the starter fails and the solution passes.
  - **5 alternative solutions:** e.g. flex instead of grid, or `translate` instead of offsets;
    they pass too.
  - **The UI flow:** hand fix, hints, compare modes, resume, reset and undo.
  - **Totals:** 200 unit/component tests and 30 E2E tests (dev and production build).

### Changed
- Left pane tabs: Items, Examples, Docs, **Challenges**. Tab strips and toolbars that overflow
  scroll without showing native scrollbars.
- `replaceContent` in the store backs Apply example, Apply solution and Reset, all with the same
  Undo toast.

## Milestone 3: visual overlays and inspection (2026-10-28)

### Added
- **Overlays** drawn inside the preview for the selected element, toggled from the preview
  toolbar and remembered:
  - **Box model**: margin, border, padding and content, with a size label.
  - **Grid**: lines with numbers, resolved track sizes, hatched gaps and named areas. It takes
    `justify-content` / `align-content` distribution into account.
  - **Flex**: item outlines, hatched gaps and the main-axis direction, labelled `flex · row` etc.
  - **Outlines**: every element outlined, coloured by depth.
- **Inspect mode**: hover the preview to highlight an element, click to select it. The tree
  expands and scrolls to the row; `Esc` leaves. Hovering a tree row highlights it in the preview.
- **Layout tab** in the inspector, from the browser's own measurements: a box model diagram,
  resolved display/position/box-sizing/z-index, and the flex or grid container settings (grid
  tracks in px, areas). It also reports flex item sizing with a plain-language explanation,
  which grid lines an item was placed on, and what an absolute or fixed element is positioned
  against. Finally it shows whether the element creates a stacking context and why, which
  context it paints in (click to select it), and any overflow.
- `npm run e2e:prod`: the whole E2E suite against the minified production build.
- `.prettierrc` matching the project style (no semicolons, single quotes, 120 columns).
- **Tests**: overlay geometry helpers (tracks, distribution, areas, spans, stacking reasons), a
  jsdom run of the serialised runtime, migration of state saved before this milestone, and 5
  Playwright tests: flex and grid overlays, inspect pick and hover, the stacking report, and
  overlays surviving hostile user CSS. Totals: 139 unit/component, 13 E2E (both against dev and
  the production build).

### Changed
- The frame runtime is now typed TypeScript serialised into the preview, instead of a hand-written
  string.
- The inspector has **Element** and **Layout** tabs.

### Fixed
- `studioStore.ts` had been reformatted with semicolons by a Prettier run without config; it
  matches the rest of the codebase again.

## Milestone 2: examples, docs and layout hints (2026-10-28)

### Added
- **Examples library**: 14 guided layouts across flexbox, grid, positioning and sizing, each with
  an explanation, things to try and links to the properties it teaches. Apply to the current
  sandbox or open in a new one; a toast offers Undo.
- **Property docs**: 41 layout properties with summary, details, values, gotchas, related entries
  and MDN links, plus ranked search. Each value's **Try** button writes the declaration into the
  selected element's class rule, editing existing CSS text in place so comments and formatting survive.
- **Layout hints** in the CSS editor (info severity): flex/grid container properties without a
  flex or grid display, flex-only vs grid-only properties, offsets and z-index on static elements,
  sticky without an offset, width/height on inline elements, and classes no element has. Hints
  merge declarations across rules and across classes that share an element, so they stay quiet
  when another rule makes the declaration work.
- **Tests**: content validation for every example and doc value, hint rules, `upsertDeclaration`,
  apply/undo in the store, and 4 more Playwright tests (apply + undo, concept chip → docs,
  Try → preview, hint tooltip). Totals: 125 unit/component, 8 E2E.

### Changed
- `lintCss(css, context)` takes the tree's class lists; the editor re-lints when the tree changes.

## Milestone 1: core loop (2026-10-28)

### Added
- Project setup: Vite + React 18 + TypeScript (strict, `noUncheckedIndexedAccess`), Tailwind with
  shadcn-style Radix primitives, Geist + JetBrains Mono, light/dark/system theme.
- **Items tree**: add child / sibling / top-level, inline class rename (Enter/F2), duplicate,
  delete, drag-and-drop reorder and nesting (@dnd-kit, horizontal offset picks depth), collapse.
  Full keyboard support with a roving tabindex and ARIA tree semantics. Inspector for tag, classes,
  text and an allow-listed set of attributes.
- **CSS editor**: CodeMirror 6 with CSS highlighting, property/value autocomplete, class-name
  completion from the tree, and css-tree diagnostics (syntax, braces, unknown properties, invalid
  values). Edits commit with a 150ms debounce.
- **Preview**: sandboxed iframe (`allow-scripts` only, CSP `default-src 'none'`) built from the
  typed tree with escaping. CSS updates go to the frame by postMessage without reloading it.
  Width presets (Fit/375/768/1024/1440), draggable and keyboard-adjustable edges, scale-to-fit,
  configurable background.
- **Persistence**: auto-save to localStorage, zod validation on load, multiple named sandboxes
  (new, rename, duplicate, delete), Reset to starter.
- **Layout**: three resizable panes on desktop (sizes remembered), bottom tab bar on mobile.
- **Tests**: 47 unit/component tests (HTML generation and escaping, tree operations and drag
  projection, lint, store/persistence, tree keyboard behaviour) and 4 Playwright tests (core loop
  with reload, measured edit latency, width presets, CSS isolation).
