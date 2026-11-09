# Layout Lab Studio

A playground for mastering CSS layout: build an element tree, write CSS, and see a live,
sandboxed preview. Built for developers who already know JS/TS and want to really understand
flexbox, grid, positioning and stacking contexts.

> Status: **Milestones 1–4** complete (core loop; examples, docs and layout hints; visual
> overlays and inspection; challenges). Sharing and progress tracking are not built yet. See
> [CHANGELOG.md](CHANGELOG.md).

## Setup

Requires Node 20+ (developed on Node 22).

```bash
npm install
npm run dev        # http://localhost:5180
```

| Script              | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Vite dev server on port 5180                                     |
| `npm run build`     | Type-check (`tsc -b`) and production build to `dist/`            |
| `npm run preview`   | Serve the production build                                       |
| `npm run typecheck` | Type-check only                                                  |
| `npm run test`      | Vitest unit + component tests (jsdom)                            |
| `npm run e2e`       | Playwright E2E (starts its own dev server on port 5181)          |
| `npm run e2e:prod`  | The same E2E suite against a production build (port 5182)        |
| `npm run references` | Regenerate the challenge reference pictures in `public/references/` |

**Playwright browser:** the E2E config uses your installed Google Chrome (`channel: 'chrome'`),
so no browser download is needed. To use Playwright's bundled Chromium instead:

```bash
npx playwright install chromium
PW_CHANNEL=chromium npm run e2e
```

## Using it

- **Items (left):** pick a tag, then **Add child** / **Sibling**. Drag rows by the grip to reorder;
  drag right/left while dropping to nest/un-nest. The inspector below edits tag, classes, text and
  attributes. An `<img>` also gets an **Image URL**: paste an `https://` address (see the
  isolation note under Architecture); empty keeps the built-in placeholder. Keyboard (tree focused):
  `↑ ↓ Home End` move · `← →` collapse/expand · `Enter`/`F2` edit class names · `Delete` remove ·
  `Ctrl+D` duplicate · `Alt+↑ ↓` reorder · `Alt+→ ←` nest/un-nest.
- **CSS (middle):** CodeMirror with property/value autocomplete, class-name completion from your
  tree, and inline diagnostics: errors (syntax, unbalanced braces), warnings (unknown properties,
  invalid values) and blue dotted **layout hints** for valid CSS that does nothing here, such as
  `gap` without `display: flex|grid`, `top` or `z-index` on a static element, sticky without an
  offset, `width` on an inline element, or a class no element has.
- **Examples (left tab):** 123 guided examples in a numbered learning path, split into **tracks**:
  Layout (nine modules, from Box & sizing through Flexbox, Grid, Positioning, Stacking and
  Overflow to Real layouts), Typography (readable text, typographic details such as link underlines, list markers,
  drop caps and tabular numbers, taming long text), Colour &
  backgrounds (contrast, transparency, gradients, patterns, layered backgrounds), Borders &
  effects (rounded shapes, dividers, shadows, outlines, cursors, focus rings, filters,
  gradient borders, frosted glass, `clip-path`, blend modes, `drop-shadow`) and Cascade & variables
  (specificity, `:nth-child`, sibling selectors, states, inheritance, `:where()`,
  `::before`/`::after`, attribute selectors, `:not()`, `:has()`, form states, a CSS-only switch,
  custom properties for themes, variants and spacing scales) and Responsive (mobile-first media queries, fluid `clamp()` spacing, `dvh`,
  `object-position` crops, named container queries) and Motion (transitions, timing functions,
  `@keyframes`, loaders, `prefers-reduced-motion`, and motion in components: growing
  underlines, sliding captions, skeleton shimmers, pulsing badges, staggered lists, a `steps()`
  typewriter). Every module goes
  Beginner → Hard and lessons are numbered like `2.3`. Track and level filters above the list hide
  the rest without renumbering. **Apply here** replaces the sandbox's elements and CSS; **Open in new
  sandbox** keeps the current one. The toast's **Undo** restores what was there. Property chips open
  the matching docs entry.
- **Docs (left tab):** searchable reference for 83 CSS properties (layout, typography, colour, borders and effects, responsive, motion) with values, gotchas and
  related links. Select an element with a class in Items, then each value's **Try** button writes
  `property: value` into that class's rule (editing the rule in place if it exists).
- **Preview (right):** `Fit` or a fixed viewport (375 / 768 / 1024 / 1440), drag either edge of
  the frame (or focus it and use arrow keys) for any width. Wide viewports are scaled to fit.
  Background: white, dark or checkerboard.
- **Overlays (preview toolbar):** the selected element is drawn on top of the preview.
  - **Box model**: margin (orange), border (yellow), padding (green), content (blue), with its size.
  - **Flex & grid**: on a grid container, the lines with numbers, track sizes in px, hatched
    gaps and named areas; on a flex container, every item and the hatched gaps.
    Both also draw two labelled **axis arrows** from one corner: blue for the main (flex) or inline
    (grid) axis, teal for the cross or block axis. They point the way each axis runs (so
    `row-reverse`, `wrap-reverse` and `direction: rtl` are visible) and name the properties that work
    along it (`justify-content` on the main axis, `align-items` on the cross axis).
  - **Outlines**: every element outlined, coloured by depth.
  - **Inspect** (crosshair): hover the preview to highlight elements, click to select one. `Esc`
    leaves. Hovering a tree row highlights the element in the preview too.
- **Layout tab (under Items):** the browser's own measurements of the selected element. You get a
  box model diagram and the resolved display/position values. For containers, the resolved flex
  settings or grid tracks, plus an **Axes** list that spells out which way each axis points; for items, their flex sizing or the grid lines they landed on. It also
  shows what an absolute element is positioned against, whether the element creates a stacking
  context (and why), which context it paints in, and how far content overflows.
- **Challenges (left tab):** 36 problems (layout, typography, colour, effects, the cascade and responsive design) ranked **Beginner / Intermediate / Hard**, from
  "center the card" to the holy grail, a stacking-context puzzle and a dashboard grid, plus twelve
  **Creative** ones: CSS art (a sunny day, an emoji face, a traffic light, a night skyline, a
  polaroid wall), type designs (a gig poster, a quote card), recreated UI (a boarding pass, a music
  player, a weather widget, a credit card), and an open remix that turns a plain card into a game card. Filters above the list narrow
  it by kind (Layout / Creative) and by level (Examples carry the same level badges). Clicking a
  row opens the challenge to *read* (brief, level, reference picture). **Start challenge**, top
  right of that view, creates its own sandbox (named `Challenge: …`; your other sandboxes are
  untouched). Hints, the solution and Reset only appear once it is started. If you switch to another
  tab the same view offers **Continue**, and list rows of started challenges are marked
  **In progress**.
  - **Reference picture:** a screenshot of the target layout at each width the design changes at
    (for example desktop and phone), with a thumbnail in the list and in the challenge. Click one
    to see it full size (Esc closes). Build the layout until your preview looks like it.
  - **Help:** hints revealed one at a time, property chips into the docs, and **Show solution**
    with an explanation and **Apply solution**.
  - **Reset to starter:** asks first, and offers Undo.
  - **Compare:** the bar above the preview switches between **Yours**, **Target** (the
    solution), **Overlay** (target at 50% over yours) and **Diff** (difference blend: matching
    pixels turn black).
- **Sandboxes:** each one is a browser-style **tab** in the top bar. Click to switch, **+** for a
  new one, double-click (or `F2`) to rename, drag to reorder, right-click for Rename / Duplicate /
  Close. Closing a tab (× or middle-click or `Delete`) **deletes that sandbox**, with a
  confirmation only if you changed it; the last tab is replaced by a fresh sandbox. Keyboard:
  `← → Home End` move between tabs, `Enter` opens one. Challenge sandboxes show a trophy.
  Right-click a tab and choose **Reset sandbox** to restore its starter layout (it asks first). Everything auto-saves to
  `localStorage`.
- **Mobile:** below 768px the three panes become a bottom tab bar (Items / CSS / Preview).

## Architecture

```
            ┌──────────────────────────── Zustand store (persist → localStorage, zod-validated) ───┐
            │ sandboxes{id → {items: TreeNode[], css}} · activeSandboxId · selectedItemId · ui      │
            └──────┬──────────────────────────────┬───────────────────────────────┬────────────────┘
                   │ tree ops (pure, treeOps.ts)   │ setCss(id, css)               │ items / css
                   │                               │ (150ms debounce)              │
          ┌────────▼────────┐            ┌─────────┴────────┐          ┌───────────▼─────────────┐
          │ features/tree   │            │ features/editor  │          │ features/preview         │
          │ TreePanel (dnd) │            │ CodeMirror + lint│          │ generateHtml(items) ──┐  │
          │ ItemInspector   │            │ (css-tree)       │          │  srcdoc (tree changes)│  │
          └─────────────────┘            └──────────────────┘          │ postMessage set-css ──┤  │
                                                                       └───────────────────────┼──┘
                                                       sandbox="allow-scripts", opaque origin  │
                                                     ┌─────────────────────────────────────────▼─┐
                                                     │ iframe: CSP default-src 'none'             │
                                                     │ <style id="ll-base"> <style id="ll-user-css">│
                                                     │ frameRuntime: swaps style text, blocks nav │
                                                     │ <ll-overlay> shadow root: draws overlays,  │
                                                     │ measures selection → postMessage info      │
                                                     └────────────────────────────────────────────┘
```

Overlay protocol: the parent posts `set-overlay` (selected/hovered id, inspect mode, toggles)
whenever the store changes. The frame redraws on the next animation frame, and also on scroll,
resize and CSS changes. It replies with `info` (an `InspectInfo` measured with
`getComputedStyle`/`getBoundingClientRect`) and, in inspect mode, with `hover`/`pick`.

Key decisions:

- **Markup comes only from the typed tree.** Tags are a fixed union, class and attribute names are
  validated (no `on*`, `style`, generic `src`), `href` is sanitised, an `<img>` `src` must be an
  absolute `https://` URL (no credentials, no http/data/relative) or the placeholder is used, and all text/attribute values are
  escaped. No HTML string from the user is ever injected.
- **The preview is isolated.** `sandbox="allow-scripts"` without `allow-same-origin` gives it an
  opaque origin; a CSP meta allows **only** inline styles, the inline runtime and `img-src data: https:`:
  scripts, fonts, frames and connections stay blocked. Images are the one thing that can load from
  the web, so `background-image: url(https://…)` in user CSS works too; every request is sent with
  `no-referrer`. User
  CSS lives only inside the iframe, so it can never style the app.
- **CSS edits never reload the iframe.** The store change is posted straight to the frame runtime,
  which replaces the `<style>` text. `srcdoc` is rebuilt only when the tree changes. Measured
  keystroke → preview: ~175ms (150ms debounce + ~25ms).
- **Storage is untrusted.** Persisted state is validated with zod on load; malformed data is
  ignored and a fresh state used. New fields are optional in the schema, so older saves still load.
- **The frame runtime is real TypeScript.** [frameRuntime.ts](src/features/preview/frameRuntime.ts)
  is serialised with `Function.prototype.toString`, so it must reference only its own helpers
  and browser globals (the file header lists the rules). Its pure helpers are unit-tested, a
  jsdom test runs the serialised text, and `npm run e2e:prod` proves it survives minification.
- **Overlays are immune to user CSS.** They live in a shadow root whose host has inline
  `!important` styles (`all: initial`, `position: fixed`…). Inline `!important` beats any
  stylesheet rule, and stylesheet selectors cannot reach into a shadow root.

### Folder layout

```
src/
  types/            shared types: tree, sandbox, preview postMessage protocol
  content/          examples/, docs/, challenges/ (one JSON file per entry, plus an order file), references.ts, instantiate.ts,
                    content.test.ts
  store/            Zustand store, zod schema, defaults (starter sandbox)
  lib/              small hooks/utilities (debounce, media query, theme, ids)
  components/ui/    shadcn-style primitives (Radix): button, tabs, tooltip, dropdown, dialog…
  components/layout app chrome: AppShell (desktop panes / mobile tabs), TopBar, SandboxTabs (sortable tabs), RenameInput
  features/
    tree/           TreePanel, TreeRow, TreeToolbar, ItemInspector, treeOps, dndTree, tags
    editor/         CssEditor, CodeMirror extensions, cssLint + cssHints (css-tree), upsertDeclaration
    preview/        PreviewPane, PreviewFrame, WidthHandle, generateHtml, frameRuntime
    challenges/     ChallengesPanel (list, filter, hints, solution), Reference (pictures + dialog)
    inspect/        LayoutReport (Layout tab: box model diagram, computed layout, stacking)
    examples/       ExamplesPanel, ApplyToast
    docs/           DocsPanel
e2e/                Playwright specs
scripts/            capture-references.ts (npm run references)
public/references/  generated challenge reference PNGs + manifest.json (committed)
```

## Adding a new example / doc entry

Both are plain typed data; the types live in [src/content/types.ts](src/content/types.ts). In Claude
Code the project skills `new-example` and `new-doc-entry` (in `.claude/skills/`) walk through this
and run the checks.

**Example:** add a JSON file to [src/content/examples/](src/content/examples/), one per example.
Build the tree with the `el(tag, classes, textOrChildren, attrs)` helper:

```ts
{
  id: 'two-columns',                            // unique, kebab-case
  title: 'Two equal columns',
  category: 'Grid',                             // Flexbox | Grid | Positioning | Sizing & overflow
  level: 'basics',                              // or 'intermediate'
  summary: 'One line for the list.',
  concepts: ['grid-template-columns', 'gap'],   // must exist in docs
  explanation: ['Short paragraph.', 'Another.'],
  tryThis: ['Change 1fr 1fr to 2fr 1fr.'],
  items: [el('div', 'cols', [el('div', 'col', 'A'), el('div', 'col', 'B')])],
  css: `.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }`,
}
```

Then add its id to the right module in [src/content/examples/path.ts](src/content/examples/path.ts),
after the last example of the same level. That list sets the order and numbering of the Examples
tab; a test fails if an example is missing from it or a module's levels go backwards.

**Doc entry:** add `<property>.json` to [src/content/docs/](src/content/docs/) with
`property`, `group`, `appliesTo`, `summary`, `details`, `values` (`{ value, note }`; each gets a
Try button), an optional `gotcha`, and `related` property names. Then list the property under its
group in [src/content/docs/order.ts](src/content/docs/order.ts), which sets the Docs tab order.

Then run `npm run test`. [content.test.ts](src/content/content.test.ts) checks that ids are unique,
every example tree passes the storage schema, every example's CSS has no errors, warnings *or
layout hints*, concepts and related links point at real docs, and every doc value is valid for
its property.

## Adding a challenge

In Claude Code, the project skill `new-challenge` (`.claude/skills/new-challenge/`) follows this recipe
step by step. By hand:

Add `<id>.json` to [src/content/challenges/](src/content/challenges/) and its id to
[src/content/challenges/order.ts](src/content/challenges/order.ts) (the order within each level):

- `id`, `title`, `summary`, and a `level`: `'beginner'`, `'intermediate'` or `'hard'`. Rough guide:
  beginner is one layout idea, intermediate combines two or adds a phone layout, hard needs a
  subtle mechanism (stacking contexts, nested grids, min-content).
- `brief`: the task in short paragraphs, giving the sizes a learner needs (e.g. "a 220px sidebar
  and 16px gaps"), because the reference picture shows the look but not the numbers.
- `items`: the starter tree, as plain nodes (`tag`, `cls`, `text`, `attrs`, `children`).
- `css`: starter CSS with cosmetics only; the layout is the learner's job.
- `hints`: nudge first, near-answer last. `concepts`: properties that must exist in the docs.
- `solution`: the full stylesheet (the starter, a `/* ---- Solution ---- */` line, then the layout
  part) and `solutionNotes` explaining why it works.
- `viewports`: the widths of the reference pictures, widest first, e.g. `[800, 375]` for a
  design that restacks on phones.

If the challenge needs a tag the tree doesn't have yet (e.g. `aside`, `h2`), add it to
`TAG_NAMES` in [src/types/tree.ts](src/types/tree.ts) and `TAG_HINTS` in
[tags.ts](src/features/tree/tags.ts).

Then:
1. `npm run references` renders every solution in Chrome and saves the reference pictures (see
   below). Commit the changed files in `public/references/`.
2. `npm run test` checks the tree against the storage schema, that the starter lints without
   errors, that the solution lints with no diagnostics at all (valid CSS, no no-op
   declarations, only classes that exist), that picture widths are sensible, and that the
   pictures are up to date.
3. `npm run e2e` opens every challenge in a real browser, checks the brief and pictures, and
   proves that **Apply solution** makes your preview match the Target frame element by element.

### Reference pictures

Every challenge shows a screenshot of its solution at each of its `viewports` (thumbnail in
the list, larger in the challenge, full size in a dialog). They are generated, not drawn:
`npm run references` runs [scripts/capture-references.ts](scripts/capture-references.ts), which
renders each solution at each of those widths (600px tall) and writes
`public/references/<id>-<width>.png` and a `manifest.json` with a hash of what each picture was
made from. If you change a challenge's tree or solution and forget to regenerate, `npm run test`
fails with `run "npm run references"`.

## Deployment

The app is a static site hosted on Vercel, configured by [vercel.json](vercel.json).

- **Production:** deploys from `main`. URL: _not connected yet; add it here once the Vercel project exists._
- **Previews:** every pull request gets its own preview deployment; Vercel links it from the PR.
- **One-time setup:** in Vercel, import the GitHub repository. It reads `vercel.json` (Vite, `npm ci`,
  `npm run build`, output `dist/`), so no other settings are needed.
- **Caching:** hashed files in `/assets/` are cached for a year (`immutable`); everything else, including
  `index.html`, is `no-cache`, so a new deploy shows on the next load.
- **Client routes:** any path that is not a file serves `index.html`.
- **Smoke check:** after each successful deployment, the
  [Deploy smoke check](.github/workflows/deploy-smoke.yml) workflow checks the home page and a client route
  return 200 and that hashed assets are immutable. Previews behind Vercel Deployment Protection return 401
  and are skipped with a warning.

## Roadmap

The plan to grow Layout Lab Studio into a CSS-native design tool lives in
[docs/PLAN.md](docs/PLAN.md): vision, 12 key decisions, the document model and design-to-CSS
specs, and 126 numbered tasks (`LL-001` to `LL-920`) across milestones M0–M9. Coding agents follow
[AGENTS.md](AGENTS.md) (Claude Code reads it through [CLAUDE.md](CLAUDE.md)) and build one task per
pull request. [docs/IMPROVEMENT-PLAN.md](docs/IMPROVEMENT-PLAN.md) is the earlier review the plan
was built from (background reading).

## Notes

- If your `C:` drive is full, npm can't write its cache. Point it elsewhere for a single command,
  for example `npm_config_cache=D:/npm-cache npm install`.
