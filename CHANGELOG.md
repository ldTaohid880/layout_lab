# Changelog

## M0 foundations (2026-11-09)

### Added
- **LL-005:** Vercel hosting (`vercel.json`): production from `main`, a preview deployment per pull request,
  `/assets/` cached for a year (`immutable`), everything else `no-cache`, and every non-file path served
  `index.html`. A **Deploy smoke check** workflow runs after each successful deployment and checks the home page,
  a client route and the asset cache header. README has a new **Deployment** section.
- **LL-006:** MIT `LICENSE` (also set in `package.json`), `CONTRIBUTING.md` (setup, how to pick and work a task,
  checks, code style, content, security), the pull request template from the plan's playbook, and issue forms for
  bugs, features and new content (example, challenge or docs entry).
- **LL-007:** dependency hygiene. `knip` (`npm run knip`, `knip.json`) runs in CI and reports nothing; its two
  documented ignores are `lz-string` (used by share links in LL-209) and the shadcn kit in `src/components/ui/`,
  treated as entry points so unused primitives stay available. Renovate (`renovate.json`) opens one grouped PR a
  week for npm minor and patch updates and one for GitHub Actions. CI runs `npm audit --audit-level=high`.
- Removed dead code knip found: the `el()` and `repeat()` example helpers (unused since examples became JSON),
  `collectClasses`, `countNodes` and `dropdown-menu`'s unused export state; 20 symbols used only inside their own
  file are no longer exported. The README's example snippet now shows the JSON format.
- Vitest 3 → 5 (dev only): Vitest 3 has a critical advisory (tinypool) fixed only in Vitest 5.
  `src/content/challenges/node.ts` now references Node's types itself, since Vitest 5 no longer brings them in.

## Continuous integration (2026-11-09)

### Added
- **LL-004:** GitHub Actions CI (`.github/workflows/ci.yml`) on pushes to `main` and on every pull request:
  `npm ci` (npm cache), typecheck, lint, unit tests, build, then Playwright Chromium and the E2E suite against the
  production build. On failure the Playwright HTML report and traces are uploaded as the `playwright-report`
  artifact (kept 14 days). A newer push to the same branch cancels the run in progress.

## ESLint (2026-11-09)

### Added
- **LL-003:** `npm run lint` with an ESLint 9 flat config (`eslint.config.js`): `typescript-eslint` type-aware
  recommended rules, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` and `eslint-config-prettier`. ESLint 9,
  not 10, because `eslint-plugin-jsx-a11y` does not support ESLint 10 yet.

### Changed
- Fixed every lint error: typed the frame runtime's incoming messages, a `JSON.parse` result and a `Map`, and removed
  three unneeded type assertions. Deliberate patterns keep a disable comment with the reason (focusable width
  splitter, roving-tabindex tree, control-character check, running the serialised runtime in a test).
- Three React Compiler rules (`refs`, `immutability`, `set-state-in-effect`) are off, with the reason in the config:
  they flag the latest-value ref and draft-resync patterns the app uses on purpose.

## Architecture decision records (2026-11-09)

### Added
- **LL-002:** the 12 architecture decision records in `docs/adr/` (`001-renderer.md` to `012-routing.md`),
  one per row of the plan's Key decisions table, each with Context, Decision, Consequences, Rejected options
  and related tasks, all "Accepted". `docs/adr/README.md` indexes them and explains how to add or supersede one.

## Agent instructions and build plan (2026-11-09)

### Added
- **LL-001:** `AGENTS.md` (commands, how to work a task, code conventions, security invariants,
  dependencies, definition of done), a one-line `CLAUDE.md` pointing to it, and `docs/PLAN.md`,
  the agent-ready build plan with 126 tasks across milestones M0–M9.
- `docs/IMPROVEMENT-PLAN.md`, the earlier review the plan is based on (background reading).
- A **Roadmap** section in the README linking to the plan.

## Challenges and docs as JSON (2026-10-30)

### Changed
- **Challenges and docs are one JSON file each**, like examples: `src/content/challenges/<id>.json`
  and `src/content/docs/<property>.json` (replacing `challenges.ts` and `docs.ts`). Each folder's
  `index.ts` loads its files with `import.meta.glob`; `order.ts` sets the tab order
  (`CHALLENGE_ORDER`, and `DOC_ORDER` by group). Solutions are written out in full (no `solve()`
  or `BOX`). Content is unchanged, so the reference pictures are still current.
- Playwright code (`e2e/challenges.spec.ts`, `scripts/capture-references.ts`) reads challenges
  through `loadChallenges()` in `src/content/challenges/node.ts`, since `import.meta.glob` is
  Vite-only.
- Content tests check that every file is in its order list exactly once and named after its id.

## More creative challenges (2026-10-30)

### Added
- **Six more creative challenges (36 total, 12 creative):** Traffic light and Quote card
  (beginner), City skyline at night and Weather widget (intermediate), Polaroid wall and Credit
  card (hard). They cover column flex, decorative `::before` marks, flex baselines with gradient
  windows and an inset-shadow crescent, layered icons, rotated overlapping photos with `z-index`,
  and `aspect-ratio` with `isolation` for a blended logo.

## Creative challenges (2026-10-30)

### Added
- **Six creative challenges (30 total)**, marked `creative: true`: Sunny day and Gig poster
  (beginner), Boarding pass and Emoji face (intermediate), Music player and Make it a game card
  (hard). The game card is an open remix: the picture is one possible answer.
- A **Creative** badge on those challenges and a Layout / Creative filter above the challenge list,
  combined with the level filter.

### Fixed
- The thumbnail e2e test scrolls each lazy thumbnail into view, so it keeps working as the list grows.

## 30 more examples (2026-10-30)

### Added
- **Examples (123 total)** across four tracks, with four new modules:
  - **Typography:** font stacks and weights, line height compared, aligning text (Readable
    text); link underlines, styled list markers with `::marker`, a drop cap with
    `::first-letter`, numbers that line up with `font-variant-numeric` (new module "Typographic
    details"); long words with `overflow-wrap` and `hyphens` (Taming long text).
  - **Borders & effects:** outline versus border, cursors (Borders & effects); a gradient
    border, frosted glass with `backdrop-filter`, `clip-path` shapes, blend modes, and a speech
    bubble whose `drop-shadow` follows its tail (new module "Shapes & surfaces").
  - **Cascade & variables:** `::before`/`::after`, attribute selectors, `nth-child` formulas,
    `:not()` and `:has()`, form states (`:focus-within`, `:user-invalid`), a switch made from a
    checkbox (new module "Selector toolkit"); component variants and a `calc()` spacing scale
    with custom properties (Custom properties).
  - **Motion:** a button that presses in (Transitions & animations); a growing underline, a
    sliding caption, a skeleton shimmer, a pulsing badge, a staggered list and a `steps()`
    typewriter (new module "Motion in components").
- Module numbers after each new module shift by one; lesson numbers come from the path.

## Motion track (2026-10-30)

### Added
- **Docs (83 total):** `transition`, `transition-duration`, `transition-timing-function`,
  `animation`, `animation-duration`, `animation-iteration-count`, `animation-delay` (group Motion).
- **Examples (93 total), module 17 "Transitions & animations":** cards that lift on hover,
  timing functions compared side by side, fade-in with `@keyframes` (and the `backwards` fill
  mode), a spinner and staggered bouncing dots, and `prefers-reduced-motion`.
- No challenges: reference pictures are still images and cannot show motion.

This completes the six planned tracks: Typography, Colour & backgrounds, Borders & effects,
Cascade & variables, Responsive and Motion.

## Responsive track (2026-10-30)

### Added
- **Docs (76 total):** `object-position`, `container-name` (group Responsive); `container-type`
  now links to `container-name`.
- **Examples (88 total), module 16 "Responsive design":** mobile-first navigation with one
  `min-width` query, fluid spacing with `clamp()`, a screen-tall hero with `100dvh`, choosing an
  image crop with `object-position`, and a widget that asks a named container (`@container column`).
- **Challenge (24 total):** Responsive header (intermediate), pictured at 800 and 375.

## Cascade & variables track (2026-10-30)

### Added
- **Examples (83 total), modules 14 "Selectors & the cascade" and 15 "Custom properties":** which
  rule wins (specificity, then order), zebra rows with `:nth-child`, dividers with the `+`
  combinator, hover/active/focus/disabled states, inheritance and `inherit`, zero-specificity
  defaults with `:where()`, and light/dark themes with custom properties.
- **Challenges (23 total):** Zebra table (beginner), Theme it with variables (intermediate), Win
  the specificity war (hard: an id selector beats a later class).
- No new doc entries: this track is about selectors and the cascade rather than properties.

## Borders & effects track (2026-10-30)

### Added
- **Docs (74 total):** `border`, `border-radius`, `outline`, `outline-offset`, `box-shadow`,
  `filter`, `cursor` (group Borders & effects).
- **Examples (76 total), module 13 "Borders & effects":** pills, circles and rounded cards (with
  `overflow: hidden` clipping), borders and dividers, a two-layer shadow elevation scale, a
  `:focus-visible` ring with `outline-offset`, spread-shadow rings and inset fields, and filters
  that clear on hover.
- **Challenges (20 total):** Lift the card (beginner), Avatar ring and pill tags (intermediate:
  rings drawn with spread shadows so nothing changes size).

## Colour & backgrounds track (2026-10-30)

### Added
- **Docs (67 total):** `color`, `background-color`, `background-image`, `background-size`,
  `background-position`, `background-repeat`, `opacity` (group Colour & backgrounds).
- **Examples (70 total), module 12 "Colour & backgrounds":** text on a coloured background and
  contrast, `opacity` versus an alpha background, a gradient hero, `currentColor` borders and icons,
  stripes and dots with gradients, and layered backgrounds with per-layer size, position and repeat.
- **Challenges (18 total):** Gradient banner (beginner), Make the caption readable (intermediate:
  a dark fade layered over a busy background).

## Beyond layout: tracks, and the Typography track (2026-10-30)

### Added
- **Tracks** on the Examples path (`track` on each module in `path.ts`, `TRACKS` in `types.ts`):
  Layout today, then Typography, with Colour & backgrounds, Borders & effects, Cascade & variables,
  Responsive and Motion planned. The Examples tab has a track filter above the level filter and a
  heading per track; module numbers keep counting across tracks.
- **Typography docs (60 total):** `font-family`, `font-size`, `font-weight`, `line-height`,
  `letter-spacing`, `text-align`, `text-transform`, `text-decoration`, `white-space`,
  `text-overflow`, `overflow-wrap`. New doc groups for the coming tracks.
- **Typography examples (64 total):** readable line length, a type scale, an uppercase label,
  inline text styles, a pull quote, a fluid heading with `clamp()`, single-line ellipsis, ellipsis
  in a flex row, breaking long URLs.
- **Typography challenges (16 total):** Typeset the article (beginner), Truncate the subjects
  (intermediate).
- **Tags (36 total):** `blockquote`, `strong`, `em`, `small`, `code`, `hr` (void).

### Changed
- `LevelFilter` is built on a generic `ChipFilter` (`components/ui/level-filter.tsx`).
- The examples count test is now a minimum, and a test checks tracks appear in `TRACKS` order.
- Content skills list the new groups and tracks; challenges must be visible in a still picture.

## Examples as a learning path (2026-10-30)

### Changed
- **Examples tab** is a numbered path of nine modules (Box & sizing, Flexbox basics, Flex sizing,
  Grid basics, Grid placement, Positioning, Layers & stacking, Overflow & scrolling, Real layouts),
  each going Beginner → Hard, instead of four categories sorted by file name. Lessons are numbered
  (`2.3`) and each module has a one-line blurb. The order lives in `src/content/examples/path.ts`.
- **Level filter** on the Examples tab (the Challenges one, moved to
  `components/ui/level-filter.tsx`). Filtering hides rows and empty modules but keeps the numbers.
- `category` stays on each example but no longer drives the list.

### Tests
- Content: every example is on the path exactly once, path ids exist, levels never go backwards
  within a module, numbering.
- E2E: module headings and numbers, the Hard filter, and that numbers survive filtering.

## Four modern-layout examples (2026-10-30)

### Added
- **Examples (55 total):** a card that responds to its container (`@container`, `container-type`),
  cards that share rows with `subgrid`, centering with `translate(-50%, -50%)`, and a table with
  fixed columns (`table-layout: fixed`). The first two are `hard`.
- **Docs (49 total):** `table-layout`; `grid-template-rows` gained a `subgrid` value and a gotcha.
- Content test now expects 55 examples.

## Three more challenges (2026-10-30)

### Added
- **Challenges (14 total), all intermediate:** a form layout (labels and fields in a two-column
  grid, `grid-column`, stacking on phones), a chat window (column flex, a scrolling message list,
  `align-self`) and an article with sticky contents (`position: sticky` with `align-items: start`).
  Reference pictures at 800 and 375 (form, article) and 800 (chat).

## Twelve more tags (2026-10-30)

### Added
- **Tags (29 total):** `h1`, `ol`, `figure`, `figcaption`, `form`, `label`, `input`, `table`,
  `thead`, `tbody`, `tr`, `th`, `td`. `input` is a void element like `img`.
- **Attributes:** `placeholder`, `for`, `name`, `value`, `colspan` and `rowspan` are now accepted
  (event handlers, `style` and generic `src` still are not).
- Forms cannot submit: the preview iframe has no `allow-forms`.

### Notes
- Table tags must be nested properly (`table > tr > td`). The browser's parser drops a stray `td`
  inside a `div`, and that element then has no `data-ll-id`, so it cannot be selected.

## Modern layout docs (2026-10-30)

### Added
- **Docs (48 total):** `container-type` (container queries), `max-height`, `row-gap`, `column-gap`,
  `place-content`, `grid-auto-columns` and `transform` (with its stacking-context and
  containing-block side effects).
- `grid-template-columns` gained `repeat(auto-fit, …)`, `minmax(0, 1fr)` and `subgrid` values, plus
  a subgrid gotcha. `gap` and `isolation` now link to the new entries.

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
