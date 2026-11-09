<!-- Exported 2026-11-09 from the Claude Doc "Layout Lab Studio — Improvement Plan" (https://claude.ai/artifact/F6M6vhSce2W9K6NiMKrjEe). Background reading only: every finding here has a task in docs/PLAN.md, which is the plan to build from. -->

# Layout Lab Studio — Improvement Plan

2026-11-08 · @MD ISMAIL HOSSAIN

## Executive summary

Layout Lab Studio is technically excellent but has no reason to come back: it never tells learners they succeeded, never remembers their progress, and never lets them share or take their work elsewhere. The engine (sandboxed preview, overlays, layout hints, 123 examples, 36 challenges, 83 docs) is ahead of most CSS learning tools. What is missing is the loop around it.

The five things holding it back most:

1. **No success signal.** Challenge checking was removed on 2026-10-29. Learners now compare pictures by eye, so a challenge never ends with "you did it".
2. **No progress or identity.** Nothing records completed examples or challenges, there is no streak, no level, no profile. Data lives only in one browser's `localStorage`.
3. **No exit for the work.** No share link (the `lz-string` dependency is installed but unused), no export to HTML, CodePen or a file, no copy-as-code.
4. **Markup is locked to a tree of 36 tags.** Power users cannot paste HTML, type markup, use SVG, `<dialog>`, `<details>`, custom fonts or a little JavaScript. They outgrow the app within a session.
5. **No first-run guidance and no release pipeline.** A new visitor lands in a sandbox with four tabs and no tour. The repo has no CI, no deploy config, no analytics and no error reporting, so nobody knows where users drop off.

Top recommendations, in order:

1. Bring back automatic grading as a pixel-match score plus a structural check, with a clear "Solved" moment.
2. Add progress tracking, a learning-path home screen, and an optional account with cloud sync.
3. Ship share links, export (HTML file, CodePen, ZIP), and a public gallery of solutions.
4. Add a raw HTML mode with import/export, alongside the safe tree.
5. Add a power-user layer: command palette, Emmet, forced `:hover`/`:focus` states, a computed-styles panel, history with undo for every action, Tailwind and SCSS modes.
6. Formalise the existing tokens into a documented design system with Storybook, and set up CI, deployment, analytics and error tracking before any of the above ships.

## What the app is today

A single-page, client-only React app at v0.1.0 (`package.json`), one commit deep in this clone, with roughly 27,000 lines including content. Everything runs in the browser; there is no backend.

| Area | What exists | Where |
|---|---|---|
| Element tree | 36 tags, classes, text, whitelisted attributes, drag-and-drop, keyboard editing | `src/features/tree/`, `src/types/tree.ts` |
| CSS editor | CodeMirror 6, autocomplete, class completion from the tree, lint (css-tree) and layout hints | `src/features/editor/` |
| Preview | Sandboxed iframe, CSP, width presets 375/768/1024/1440, drag handle, 3 backgrounds | `src/features/preview/` |
| Overlays | Box model, flex/grid lines and axes, outlines, inspect mode | `frameRuntime.ts` (786 lines) |
| Layout report | Computed box model, flex/grid tracks, containing block, stacking context | `src/features/inspect/LayoutReport.tsx` |
| Examples | 123 lessons in 7 tracks, numbered path, track and level filters | `src/content/examples/` |
| Docs | 83 property entries with Try buttons | `src/content/docs/` |
| Challenges | 36 (12 creative), reference PNGs, hints, solution, Yours/Target/Overlay/Diff compare | `src/content/challenges/` |
| Sandboxes | Browser-style tabs, rename, duplicate, reorder, reset | `SandboxTabs.tsx` |
| Storage | `localStorage`, validated with zod on load | `src/store/` |
| Tests | 300+ tests (CHANGELOG reports 256 unit/component and 59 E2E), Vitest + Playwright | `src/**/*.test.ts`, `e2e/` |

**Stack:** React 18.3, Vite 6, TypeScript 5.8, Tailwind 3.4, Radix primitives in shadcn style, Zustand 5, zod 3, CodeMirror 6, dnd-kit, css-tree, lucide icons, Geist and JetBrains Mono fonts.

**Strengths worth protecting:** markup is generated only from a typed tree, so the preview cannot run injected HTML; CSS edits never reload the iframe (about 175 ms keystroke to preview); overlays live in a shadow root user CSS cannot touch; content is plain JSON checked by tests; and the README and CHANGELOG are unusually thorough.

## Why users come and lose interest

People arrive because "I want to finally understand flexbox and grid" is a real, common pain, and the app shows layout better than almost anything else. They leave because nothing in the app pulls them to the next step or back the next day. There is no analytics in the repo, so the points below come from reading the product and from research on learner drop-off; they should be confirmed with real data (see Success metrics).

Research points the same way. Learners abandon online coding tutorials when they get bored or frustrated ([Yan, Lee & Ko](https://ar5iv.arxiv.org/html/1707.04291)). Lack of time and motivation are the main reasons people drop programming courses, and those are shaped by how hard the work feels (same paper). In adult programming e-learning, low early scores predicted dropout and reward and recognition mattered for completion ([Dirzyte et al., Heliyon 2023](https://doi.org/10.1016/j.heliyon.2023.e22113)). Duolingo found that users who reached a 10-day streak were less likely to drop off ([case study](https://marishalakhiani.substack.com/p/breaking-down-duolingos-growth-model)).

| Moment | What the learner expects | What happens today | Why they leave | Fix |
|---|---|---|---|---|
| First 30 seconds | "Where do I start?" | Lands in Sandbox 1 with 4 left tabs, 3 panes, an orange-box starter and one comment line | No obvious first step; the tool looks like an IDE, not a course | Welcome screen with 3 doors: Learn (path), Practise (challenges), Play (sandbox), plus a 60-second tour |
| First lesson | Guided steps with a check | Example opens; "Apply here" replaces the sandbox; "Try this" is a passive list | Reading, not doing; no confirmation they got it | Interactive steps: each "Try this" becomes a task the app verifies |
| First challenge | "Did I solve it?" | Compare by eye with Overlay/Diff; no score since grading was removed | No finish line; the dopamine moment never comes | Automatic match score, "Solved" state, confetti-level celebration, next challenge offered |
| Getting stuck | Help that fits the problem | Hints in fixed order, then the full solution | Jump from hint 3 to full answer kills the learning | Faded hints, "show me the property, not the value", a targeted diff of what is still wrong |
| Day 2 | "Pick up where I left off" | Sandboxes restored, but no record of what was learned | No sense of progress, nothing to protect | Progress map, streak with a free miss, "continue" card |
| Different device | Same work | Nothing; `localStorage` only | Work feels disposable | Optional sign-in with cloud sync; export/import file meanwhile |
| Proud of a result | Share it | No share link, no export, no gallery | No social proof, no word of mouth | Share links, image export, public gallery, Open in CodePen |
| After the 36 challenges | More | Content ends; no daily target, no community content | Nothing new | Daily challenge, weekly set, user-made challenges |
| Real project | Use what was learned | Can't paste their own HTML or take CSS out cleanly | Tool stays a toy | HTML mode, import, copy/export, framework snippets |

The common thread is that the app teaches well but never closes a loop. Fixing grading, progress and sharing addresses most rows; the rest is content cadence.

## Code and product issues holding the app back

The code quality is high; the problems are missing layers, not bad code. Seventeen findings from reading the repo, highest impact first.

| # | Issue | Evidence in the repo | Impact | Fix |
|---|---|---|---|---|
| 1 | Challenge grading removed | CHANGELOG "Removed: the challenge checking feature (2026-10-29)"; no `checks` in challenge JSON | No finish line, no score, no reason to retry | Reinstate as pixel-match score in the browser plus optional structural checks (section on missing functionality) |
| 2 | No progress model | `persistedStateSchema` stores sandboxes and UI only | Nothing completed is remembered; "In progress" is the only state | Add `progress: {examples, challenges, streak, xp}` to the schema with a migration |
| 3 | Share links planned but never built | `lz-string` in `package.json`, zero imports in `src/`; schema comment says "share links in Milestone 4" | Dead dependency; no virality | Build `#s=<compressed>` links validated by the existing zod schema |
| 4 | No undo for tree edits | `deleteItem` in `studioStore.ts` removes the node; only example apply has Undo | Deleting a parent with 20 children is unrecoverable | Global history stack (zundo or a patch log) covering tree, CSS and sandbox ops; Ctrl+Z everywhere |
| 5 | Closing a sandbox is permanent | Confirm dialog says it "cannot be undone" | Fear of losing work | Trash with 30-day restore, or Undo toast |
| 6 | Single-browser storage | `localStorage` key `layout-lab-studio`; no quota handling (no `QuotaExceededError` catch) | Work lost on cleared storage, private mode, or a new device; large sandboxes may silently fail to save | IndexedDB (Dexie or idb-keyval), quota warning, JSON export/import, then cloud sync |
| 7 | Markup only through a tree of 36 tags | `TAG_NAMES` in `src/types/tree.ts` | No `svg`, `dialog`, `details`, `select`, `textarea`, `video`, `picture`, `h4`–`h6`, `dl`, `time`, `mark`; slow for experienced users | Raw HTML mode parsed and sanitised into the tree (DOMPurify then convert), wider tag list |
| 8 | Web fonts blocked | Preview CSP `font-src data:` | Typography track cannot use real fonts; designs look generic | Allow a curated font list (self-hosted Fontsource files served as data or same-origin blobs) |
| 9 | No interaction states in the preview | Overlay state has no forced-state field | `:hover`, `:focus`, `:active` lessons need the mouse; Motion track can't be inspected | Force-state toggles like DevTools (add a class and rewrite selectors, or a `ll-force-hover` attribute) |
| 10 | Motion has no challenges | CHANGELOG: "reference pictures are still images and cannot show motion" | A whole track with nothing to practise | Video or frame-strip references, timeline scrubber, timing-curve comparison |
| 11 | Vertical writing modes unsupported in overlays | Comment in `frameRuntime.ts` line 166 | Wrong axes for `writing-mode: vertical-*` | Map axes through `writing-mode` and `direction` |
| 12 | No onboarding or empty states | `AppShell.tsx` renders panes directly | High first-visit bounce | First-run tour, sample tasks, empty-state copy |
| 13 | No code splitting of panels | No `React.lazy` in `src/`; all panels and content load up front | Slower first load as content grows (123 + 36 + 83 JSON files are globbed eagerly) | Lazy-load Docs/Examples/Challenges panels; `import.meta.glob` with `eager: false` |
| 14 | Mobile is a 3-tab squeeze | `MobileLayout` in `AppShell.tsx` | Editing CSS on a phone is painful; most learners browse on phones | Mobile-first "lesson" mode: read, tap property chips, value pickers instead of typing |
| 15 | Theme toggle is the only top-bar control | `TopBar.tsx` | No settings, help, keyboard shortcuts or account entry | Top bar: Learn / Practise / Play, search, settings, help, profile |
| 16 | Dependencies one major version behind | React 18.3, Tailwind 3.4, zod 3, Vite 6 | Missing React 19 features, Tailwind v4 CSS-first tokens | Planned upgrade in Phase 0 (Tailwind v4 was released January 2025 with CSS-first `@theme` config: [source](https://fireup.pro/news/tailwind-css-v4-0-released-lightning-fast-builds-advanced-features-and-simplified-setup)) |
| 17 | No CI, licence or deploy config | No `.github/`, no `LICENSE`, no Netlify/Vercel/Pages config | Tests exist but never run automatically; contributors can't legally reuse; no public URL in the README | GitHub Actions, a licence, and a deploy target (Phase 0) |

## Missing functionality for learners

The biggest gap is a closed practice loop: attempt, get scored, get targeted help, finish, move on. The competing tools each own one piece of that loop. CSSBattle scores how closely the output matches the target image plus how few characters were used ([FAQ](https://cssbattle.dev/faqs)). Frontend Mentor adds community review of submitted solutions and curated learning paths ([guide](https://www.frontendmentor.io/guides/welcome-to-frontend-mentor)). Josh Comeau's course is built on interactive widgets and in-browser exercises ([newsletter](https://joshwcomeau.com/newsletter-issues/007)). Layout Lab can combine all three because it already renders both the learner's page and the target in the browser.

### 1. Automatic grading (bring it back, better)

- **Visual score:** render Yours and Target at each challenge viewport, rasterise both, and compare with [pixelmatch](https://github.com/mapbox/pixelmatch), which detects anti-aliased pixels so text edges don't count as errors. Show "94% match" live.
- **Structural checks (optional per challenge):** a small rule list such as "`.card` is centred within 2px" or "3 columns at 800px, 1 at 375px", measured with `getBoundingClientRect` in the frame runtime that already reports `InspectInfo`.
- **Solved state:** at a threshold (for example 98% plus all checks), mark solved, record the time, show a short celebration and the next challenge.
- **"What's still wrong":** highlight the mismatched region on the Diff view and name the element whose box differs most.

### 2. Progress and the home screen

- A **path map** showing the 7 tracks, modules and lessons with done / in progress / locked states.
- **Per-lesson completion:** an example counts as done after its "Try this" tasks pass (see 3).
- **Streaks** with one free missed day (habit research suggests a single miss shouldn't wipe the streak; [Yu-kai Chou](https://yukaichou.com/gamification-study/master-the-art-of-streak-design-for-short-term-engagement-and-long-term-success/)), XP per lesson, and badges per track.
- A **"Continue" card** that reopens the last lesson or challenge at the exact step.

### 3. Interactive lessons instead of passive examples

- Turn each `tryThis` line into a checked task ("Change `1fr 1fr` to `2fr 1fr`" passes when the computed track sizes are in a 2:1 ratio).
- **Faded guidance:** first lessons in a module give full code, later ones blank out the key declaration, the last asks for it from scratch. Research on worked examples supports fading for novices ([ASU fading study](https://faculty.engineering.asu.edu/mre/wp-content/uploads/sites/31/2020/02/Stat_Adapt_Fad_JEE06.pdf)).
- **Predict-then-reveal quizzes:** "What happens if you add `flex-wrap: wrap`?" with 3 picture choices before the learner tries it.
- **Concept explainers** with sliders (gap, flex-grow, minmax) next to the live preview.

### 4. Better help when stuck

- Hint tiers: concept, then property name, then property and value, then the solution diff for only the rule that is wrong.
- "Explain this CSS": a plain-English description of any selected rule, generated from css-tree and the docs data (no AI needed for a first version).
- Optional AI tutor (later phase) that sees the tree, CSS, diff score and hint history.

### 5. Sharing, exporting, community

- **Share link** with the sandbox compressed into the URL (lz-string is already installed).
- **Export:** single HTML file, ZIP (index.html + styles.css), PNG of the preview, and Open in CodePen via its prefill API, which accepts a POST of JSON with `html` and `css` fields ([CodePen docs](https://blog.codepen.io/docs/api/post-to-prefill-pen/)).
- **Gallery** of solved challenges and creative remixes, with likes and "fork this".
- **User-made challenges:** turn any sandbox into a challenge (the reference picture pipeline already exists in `scripts/capture-references.ts`; move it to the browser).

### 6. Content cadence

- **Daily challenge** and a weekly themed set, the pattern CSSBattle uses with Daily Targets and timed Battles ([FAQ](https://cssbattle.dev/faqs)).
- **Motion challenges** using frame strips or short looping videos as references.
- **Project tracks:** build a full landing page, a dashboard or a blog layout over 5–10 steps.
- **Accessibility track:** focus order, contrast, reduced motion, `:focus-visible`, logical properties.

### 7. Everyday comfort

- Undo/redo for every action, trash for deleted sandboxes, autosave indicator.
- Settings panel: font size, editor theme, tab size, reduced motion, language.
- Keyboard shortcut sheet (`?`) and a searchable help.
- Localisation (the README is English only; Bangla, Spanish, Hindi and Portuguese are large learner markets), using the same approach as Flexbox Froggy's language menu.

## Advanced tools and options for power users

Power users judge the app against browser DevTools and CodePen; today it beats them on layout overlays but loses on speed of input, states and portability. These additions close that gap, grouped by where they live.

### Input speed

- **Command palette** (Ctrl/Cmd+K): add element, apply example, open doc, switch sandbox, toggle overlay, change viewport, export.
- **Emmet** in both CSS and the new HTML mode: `div.card>h2+p*3` expands to markup, `d:f` to `display: flex`. An official CodeMirror 6 plugin exists, sponsored by Replit and CodePen ([emmetio/codemirror6-plugin](https://github.com/emmetio/codemirror6-plugin)).
- **HTML mode:** type or paste markup, round-tripped to the safe tree (sanitise, then map to `TreeNode`). Tree view and code view stay in sync.
- **Vim and Emacs keymaps** as editor options (`@replit/codemirror-vim`).
- **Format on save** with Prettier's standalone CSS/HTML parsers (`.prettierrc` already exists in the repo for the app itself).
- **Multi-cursor, find/replace, fold** (CodeMirror supports these; `foldGutter` is switched off in `CssEditor.tsx`).

### Visual editing

- **Inline value widgets:** colour swatch with picker, `cubic-bezier` curve editor, shadow editor, gradient editor, and drag-to-scrub numbers (hold Alt and drag a `16px`). Chrome DevTools offers shadow and cubic-bezier editors next to values ([overview](https://dev.to/nickbenksim/top-10-chrome-devtools-features-for-debugging-complex-css-2d78)).
- **Grid editor:** draw tracks and areas on the grid overlay and write `grid-template-areas` back.
- **Flex playground panel:** dropdowns for every flex property on the selected container, written into the matching rule.

### Inspection and debugging

- **Force element state:** `:hover`, `:focus`, `:focus-visible`, `:active`, `:checked`, `:disabled` on the selected element, as DevTools does ([egghead](https://egghead.io/lessons/egghead-force-a-dom-element-state-in-chrome-devtools)).
- **Computed styles and cascade view:** every rule that matches the selected element, crossed out where overridden, with specificity shown (the Cascade track needs this).
- **Container query badges** showing which ancestor a `@container` rule resolves against.
- **Emulation:** `prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors`, zoom 200%, and a vision-deficiency filter.
- **Animation timeline:** pause, scrub and slow down transitions and `@keyframes` in the preview.
- **Side-by-side viewports:** 375, 768 and 1440 at once, all live.
- **Contrast checker** on every text element, with the WCAG ratio.

### Language options

- **Preprocessors:** SCSS (via `sass` in a worker), nesting and `@layer` already native.
- **Tailwind mode:** utility classes in the tree with the Tailwind engine compiling in the browser, so learners see what each utility generates in CSS.
- **Browser support info** in autocomplete and the docs, from the `web-features` package, which gives each feature a Baseline status of widely available, newly available or limited ([npm](https://npmjs.com/package/web-features)).
- **Custom properties panel:** list every `--var`, its resolved value and where it is used.

### Workflow

- **Version history** per sandbox with named snapshots and a diff view.
- **Folders and search** across sandboxes; pin, tag and archive.
- **Templates:** start from "landing page", "dashboard", "blog post", "form".
- **Export targets:** HTML file, ZIP, CodePen, GitHub Gist, React component (JSX + CSS module), Tailwind classes.
- **Assets:** upload images to the sandbox (stored as blobs) instead of requiring `https://` URLs.
- **Embeds:** an iframe embed of any sandbox for blogs and teaching material, read-only or editable.
- **Teacher mode:** a classroom code, assigned challenges, and a results table.

## Missing libraries

The app has no router, no history middleware, no persistent database, no HTML sanitiser and no image comparison library; those five unlock most of the roadmap. Everything below is optional until its feature is scheduled. Check each package's current version and licence before adding it.

| Need | Library | Used for | Phase |
|---|---|---|---|
| URLs for pages and shares | TanStack Router or React Router | `/learn`, `/challenge/:id`, `/s/:shareId`, deep links; today the app has a single screen and no routes | 1 |
| Undo / redo | `zundo` (Zustand temporal middleware) | One history for tree, CSS and sandbox actions | 1 |
| Bigger, safer storage | `dexie` or `idb-keyval` | IndexedDB instead of `localStorage`; room for history, assets, progress | 1 |
| Share links | `lz-string` (already installed) | Compress the sandbox into the URL | 1 |
| Grading | `pixelmatch` | Anti-aliasing-aware pixel diff of Yours vs Target ([repo](https://github.com/mapbox/pixelmatch)) | 1 |
| Rasterising the preview | `modern-screenshot` or `html-to-image` | Turn each frame into a canvas for scoring and PNG export; must run inside the sandboxed frame, since the parent cannot read an opaque-origin iframe | 1 |
| Celebrations | `canvas-confetti` | The "Solved" moment; respects reduced motion | 1 |
| First-run tour | `driver.js` | Spotlight tour of panes and first task | 1 |
| HTML import | `dompurify` + the browser's `DOMParser` | Paste or type HTML, sanitise, convert to `TreeNode` | 2 |
| Emmet | `@emmetio/codemirror6-plugin` | Abbreviation expansion in CSS and HTML | 2 |
| Command palette | `cmdk` | Ctrl/Cmd+K actions | 2 |
| Vim keys | `@replit/codemirror-vim` | Optional editor keymap | 2 |
| HTML editor | `@codemirror/lang-html` | The HTML mode editor | 2 |
| Formatting | `prettier/standalone` with CSS and HTML plugins | Format on save | 2 |
| Colour tools | `culori` | Colour picker maths, contrast ratios, OKLCH conversions | 2 |
| Browser support data | `web-features` | Baseline badges in docs and autocomplete ([npm](https://npmjs.com/package/web-features)) | 2 |
| ZIP export | `fflate` | index.html + styles.css download | 2 |
| SCSS | `sass` (Dart Sass compiled to JS) in a Web Worker | Preprocessor mode | 3 |
| Tailwind mode | `@tailwindcss/browser` | Compile utilities in the browser | 3 |
| Accessibility checks | `axe-core` | Learner contrast/ARIA checker, and `@axe-core/playwright` for the app's own tests | 2 |
| Translations | `i18next` + `react-i18next` (or Lingui) | UI and content in several languages | 3 |
| Offline | `vite-plugin-pwa` | Installable app, works without network | 2 |
| Backend client | Supabase JS (or Firebase / PocketBase) | Accounts, cloud sync, gallery, leaderboards | 3 |
| Server data | `@tanstack/react-query` | Caching gallery, profile and leaderboard calls | 3 |
| Product analytics | `posthog-js` | Funnels, retention, feature flags, A/B tests | 0 |
| Error tracking | `@sentry/react` | Crash and frame-runtime error reports | 0 |
| Component workshop | Storybook | Design system documentation and visual tests | 0 |
| Token pipeline | Style Dictionary | One token source, exported to CSS variables, Tailwind and docs | 1 |
| Lint | ESLint with `typescript-eslint` and `eslint-plugin-jsx-a11y`, or Biome | No linter is configured today (only Prettier) | 0 |
| Dead code | `knip` | Would have flagged the unused `lz-string` | 0 |

## Missing tooling

The test suite is strong, but nothing runs it automatically, ships the app, or reports what users do. Set these up first (Phase 0) so every later change is measured.

| Tool | Today | Add | Why |
|---|---|---|---|
| Continuous integration | None (no `.github/`) | GitHub Actions: typecheck, lint, `npm run test`, `npm run e2e:prod`, build, on every pull request | 300+ tests that never run on their own catch nothing |
| Preview deploys | None | Vercel, Netlify or Cloudflare Pages with a preview URL per pull request | Review changes in a browser; share builds with testers |
| Production hosting | No public URL in the README | Static hosting + custom domain + HTTPS; long-cache hashed assets (Vite already splits `codemirror`, `csstree`, `react` chunks) | People can't use what they can't find |
| Linting | Prettier only | ESLint (`typescript-eslint`, `react-hooks`, `jsx-a11y`) or Biome | Catches hook bugs and accessibility mistakes |
| Dependency hygiene | Manual | Renovate or Dependabot, `knip`, `npm audit` in CI | Keeps the security-sensitive preview stack current |
| Visual regression | Reference PNGs for challenges only | Playwright screenshot tests for app chrome, or Chromatic on Storybook | Design-system changes can't silently break screens |
| Accessibility tests | Many ARIA attributes (123 `aria-`/`role=` uses), no automated audit | `@axe-core/playwright` in E2E | Keeps keyboard and screen-reader support honest |
| Performance budget | `chunkSizeWarningLimit: 700` in `vite.config.ts` | Lighthouse CI with budgets (first load, LCP, total JS) | Content grows with every release; JSON is loaded eagerly |
| Product analytics | None | PostHog (or Plausible for page views only), with a consent banner | Measure the funnel in Success metrics; without it the retention problem is a guess |
| Error tracking | None | Sentry, including errors posted from the frame runtime | The iframe fails silently today |
| Feature flags | None | PostHog flags | Ship grading, streaks, AI hints to a share of users first |
| Feedback | None in-app | "Send feedback" button, per-lesson thumbs up/down, a Discord or GitHub Discussions link | The cheapest source of truth about drop-off |
| Release notes | Thorough CHANGELOG.md | Show a "What's new" panel from it | Gives returning users a reason to look around |
| Project docs | README, 3 Claude Code content skills | `LICENSE`, `CONTRIBUTING.md`, issue templates, a content style guide | Opens the door to community examples and challenges |

## Design system

The app already has the seed of a design system (shadcn-style HSL variables, one orange accent, Geist and JetBrains Mono, 13 Radix-based components), but it stops at colour basics and has no documentation. Name it, give it three token layers, document it in Storybook, and move every hard-coded colour onto tokens.

### What exists and what's wrong

| Finding | Evidence | Problem |
|---|---|---|
| Colour tokens cover surfaces only | `src/index.css`: background, surface, foreground, muted, secondary, border, input, primary, accent, destructive, ring | No success, warning, info, or overlay roles |
| `primary` and `accent` are the same orange | Both `22 92% 46%` (light) | Two names, one meaning; nothing left for a second emphasis |
| Hard-coded colours outside tokens | 21 in `frameRuntime.ts`, 10 in `generateHtml.ts`, 8 in `LayoutReport.tsx`, 2 in `extensions.ts` (warning `hsl(38 92% 50%)`, info `hsl(213 80% 55%)`) | Overlay, lint and report colours can't be themed or checked for contrast |
| Level badges use raw Tailwind palette | `level-badge.tsx`: emerald / amber / red 500/700/300 | Status colours are defined in a component, not the system |
| Very small type | Body 13px; `text-2xs` (11px) used 70 times, `text-xs` 23, `text-sm` 3 | Dense, IDE-like; hard to read for beginners and on phones |
| One radius, no spacing, shadow, motion or z-index tokens | `--radius: 0.375rem`; spacing and shadows are ad-hoc Tailwind classes | Inconsistent elevation and timing as the UI grows |
| No component docs | No Storybook; components live in `src/components/ui/` with no usage notes | New features re-invent patterns |
| Missing components | Only button, dialog, confirm-dialog, context-menu, dropdown, input, select, tabs, textarea, tooltip, level badge, chip filter | No toast system (custom `ApplyToast`), progress bar, card, badge, switch, slider, popover, command menu, empty state, skeleton, avatar, kbd |

### Token layers

*(diagram: token layers · primitives to components)*

1. **Primitives:** raw scales, never used directly in components. Neutral 0–1000, orange (brand), blue, teal, green, amber, red, violet in 11 steps each, preferably in OKLCH (Tailwind v4's default colour format). Spacing in a 4px base (0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Type sizes 11, 12, 13, 14, 16, 18, 20, 24, 30, 36. Radius 2, 4, 6, 8, 12, full. Durations 100, 150, 200, 300 ms; easings standard, enter, exit.
2. **Semantic:** what the UI means, themed for light, dark and high contrast. `bg.canvas`, `bg.surface`, `bg.raised`, `fg.default`, `fg.muted`, `border.default`, `border.strong`, `brand`, `focus`, `status.success|warning|danger|info`, `level.beginner|intermediate|hard`, `track.layout|typography|colour|borders|cascade|responsive|motion`.
3. **Domain (Layout Lab only):** the teaching colours, which must stay identical everywhere they appear. `overlay.margin` (orange), `overlay.border` (yellow), `overlay.padding` (green), `overlay.content` (blue), `axis.main` (blue), `axis.cross` (teal), `grid.line`, `grid.gap-hatch`, `lint.error|warning|hint`, `diff.mismatch`, and the five `cm.*` syntax colours already in `index.css`.

The domain layer is the part that makes this a Layout Lab design system rather than a generic one: learners memorise "green is padding", so the box-model colours in the overlay, the Layout tab diagram, the docs and any illustration must come from one place. Because the frame runtime is serialised into the iframe and cannot import modules, inject these tokens into the srcdoc as CSS variables on the overlay host.

### Components to add or formalise

| Tier | Components |
|---|---|
| Primitives (exist, document them) | Button, IconButton, Input, Textarea, Select, Tabs, Tooltip, Dialog, DropdownMenu, ContextMenu |
| New primitives | Switch, Checkbox, Slider, Popover, Toast (replace `ApplyToast`), Kbd, Badge, Avatar, Progress, Skeleton, Separator, ScrollArea |
| Patterns | Card, EmptyState, PaneHeader (today a `.pane-header` utility), FilterChips (exists), LevelBadge (exists), TrackBadge, StreakCounter, ScoreMeter, HintStepper, CommandMenu, ShareDialog |
| Learning-specific | LessonStep, TaskCheck, PredictQuiz, PropertyChip, ValueScrubber, ColourSwatch, BezierEditor, BoxModelDiagram (extract from `LayoutReport.tsx`) |

### Guidelines to write down

- **Type scale and minimums:** UI body 14px, never below 12px for reading text; mono 13px in the editor with a user setting.
- **Colour use:** one brand colour for primary actions; status colours only for status; never colour alone (the level badge already does this right with a text label).
- **Contrast:** WCAG 2.2 AA for text and focus rings in all themes; test the overlay colours against white, dark and checkerboard backgrounds.
- **Motion:** 150–200 ms for UI state, honour `prefers-reduced-motion` (already done globally in `index.css`).
- **Density modes:** Comfortable (default for learners) and Compact (today's look, for power users).
- **Voice:** short, plain, second person, the tone the README already uses.

### How to introduce it

1. Upgrade to Tailwind v4 and move tokens into `@theme` in CSS, which generates utilities straight from the variables.
2. Write tokens once in Style Dictionary (or plain JSON) and generate the CSS variables, the Tailwind theme, and a token page.
3. Add Storybook with one story per component and per theme; add visual tests.
4. Replace hard-coded colours file by file (`frameRuntime.ts` first, since it holds the teaching colours), with a lint rule that bans hex and `hsl(` literals in `src/features` and `src/components`.
5. Publish a "Design" page inside the app that shows tokens and components, so contributors adding examples follow the same look.

## Roadmap

Six phases, each closed by a gate measured in the analytics from Phase 0. Durations are estimates for one or two developers and should be re-planned after Phase 0's baseline.

*(diagram: roadmap · 6 phases, 5 gates)*

Phase 1 is the one that changes retention; Phases 2 to 5 only pay off once learners have a reason to stay.

### Phase 0: Foundations (about 2 weeks)

- [ ] GitHub Actions: typecheck, lint, unit, E2E against the production build, build
- [ ] Preview deploy per pull request; production hosting with a domain; add the live URL to the README
- [ ] ESLint (or Biome), `knip`, Renovate
- [ ] Add a `LICENSE`, `CONTRIBUTING.md` and issue templates
- [ ] PostHog events: `session_start`, `lesson_open`, `task_pass`, `challenge_start`, `hint_reveal`, `solution_show`, `challenge_solved`, `share_create`; consent banner
- [ ] Sentry in the app, plus an `error` message type from the frame runtime
- [ ] Upgrade Tailwind 3.4 to v4 and React 18 to 19; move tokens to three layers (Design system section)
- [ ] Storybook with the 13 existing components

### Phase 1: Close the loop (about 4–6 weeks)

- [ ] Grading: rasterise Yours and Target in the frame, `pixelmatch` score, threshold, "Solved" state, celebration, next challenge
- [ ] Optional structural checks per challenge (centre, column count, gap) in challenge JSON
- [ ] Progress model in the persisted schema with a migration from `STORAGE_VERSION` 1 to 2
- [ ] Home screen: path map, Continue card, streak with one free miss
- [ ] First-run tour and empty states
- [ ] Router with deep links to lessons, challenges and shares
- [ ] Undo/redo for every action (`zundo`); trash for closed sandboxes
- [ ] Move storage to IndexedDB; quota warning; JSON backup export/import
- [ ] Share links (`lz-string`), HTML file and ZIP export, Open in CodePen, PNG export
- [ ] Readability pass: 14px UI body, Comfortable/Compact density

### Phase 2: Power tools (about 4–6 weeks)

- [ ] HTML mode with sanitised import into the tree; wider tag list (`svg`, `dialog`, `details`, `select`, `textarea`, `h4`–`h6`, `dl`, `picture`)
- [ ] Emmet, command palette, Vim keymap, format on save, folding
- [ ] Force element state; cascade and computed-styles panel; container badges
- [ ] Value widgets: colour picker, bezier, shadow, gradient, number scrubbing
- [ ] Baseline badges from `web-features` in docs and autocomplete
- [ ] Emulation: colour scheme, reduced motion, forced colours; contrast checker
- [ ] Side-by-side viewports; offline PWA

### Phase 3: Accounts and community (about 6–8 weeks)

- [ ] Sign-in (GitHub, Google, email) and cloud sync of sandboxes and progress
- [ ] Public gallery with likes and fork; moderation and reporting
- [ ] Daily challenge and weekly set; optional leaderboards per challenge
- [ ] User-made challenges with reference pictures generated in the browser
- [ ] In-app feedback; translations starting with Bangla and Spanish

### Phase 4: Learning depth (ongoing)

- [ ] Turn every `tryThis` into a checked task; faded guidance across each module
- [ ] Predict-then-reveal quizzes and slider explainers
- [ ] Motion challenges with frame-strip references and an animation timeline
- [ ] Project tracks (landing page, dashboard, blog) and an accessibility track
- [ ] Tiered hints that target only the rule still wrong

### Phase 5: Advanced modes (later)

- [ ] Tailwind and SCSS modes
- [ ] AI tutor that sees tree, CSS, score and hint history
- [ ] Teacher mode: classroom code, assignments, results
- [ ] Version history with diffs; asset upload; React component and Gist export; embeddable sandboxes

## Success metrics

There is no baseline yet because the app has no analytics; Phase 0 exists to get one. Measure these from launch of Phase 0, then set targets after two weeks of data.

| Metric | Definition | Answers |
|---|---|---|
| Activation rate | Share of new visitors who finish their first lesson task or challenge in the first session | Does onboarding work? |
| Time to first success | Median minutes from first visit to first "Solved" or passed task | Is the first win fast enough? |
| Day-1 / Day-7 / Day-30 retention | Share of new users who return on that day | Do people come back? |
| Challenge completion rate | Solved ÷ started, per challenge | Which challenges are too hard or broken? |
| Hint and solution use | Hints revealed and solutions shown per started challenge | Where do learners get stuck? |
| Lesson drop-off | Last lesson reached before a user stops for 14 days | Where in the path do people quit? |
| Streak holders | Users with a 3+ and 7+ day streak | Is a habit forming? |
| Shares per active user | Share links created and opened | Is the work worth showing? |
| Sign-up conversion | Accounts ÷ activated users (after Phase 3) | Is sync valued? |
| Power-user adoption | Weekly users of command palette, HTML mode, Emmet, export | Is the advanced layer used? |
| Quality | Error rate from Sentry; p75 load time; preview latency (today about 175 ms) | Is it fast and stable? |

Run every major change (grading, streaks, hint tiers) behind a feature flag and compare activation and Day-7 retention between groups.

## Sources

Repository: [ldTaohid880/layout_lab](https://github.com/ldTaohid880/layout_lab), commit `6db6c41`, read in full for this review (README, CHANGELOG, `src/`, `e2e/`, configs).

- [CSSBattle FAQ](https://cssbattle.dev/faqs): scoring by visual match and character count, Daily Targets, leaderboards
- [Frontend Mentor: Welcome guide](https://www.frontendmentor.io/guides/welcome-to-frontend-mentor): community feedback, learning paths, portfolio
- [Josh Comeau newsletter #7](https://joshwcomeau.com/newsletter-issues/007): interactive widgets and in-browser exercises
- [Yan, Lee & Ko, Predicting Abandonment in Online Coding Tutorials](https://ar5iv.arxiv.org/html/1707.04291)
- [Dirzyte et al., Factors contributing to dropping out of adults' programming e-learning (Heliyon, 2023)](https://doi.org/10.1016/j.heliyon.2023.e22113)
- [Breaking Down Duolingo's Growth Model](https://marishalakhiani.substack.com/p/breaking-down-duolingos-growth-model)
- [Yu-kai Chou, Streak Design](https://yukaichou.com/gamification-study/master-the-art-of-streak-design-for-short-term-engagement-and-long-term-success/)
- [Atkinson et al., fading worked examples (ASU)](https://faculty.engineering.asu.edu/mre/wp-content/uploads/sites/31/2020/02/Stat_Adapt_Fad_JEE06.pdf)
- [mapbox/pixelmatch](https://github.com/mapbox/pixelmatch)
- [emmetio/codemirror6-plugin](https://github.com/emmetio/codemirror6-plugin)
- [web-features on npm](https://npmjs.com/package/web-features)
- [CodePen prefill API](https://blog.codepen.io/docs/api/post-to-prefill-pen/)
- [Force element state in Chrome DevTools (egghead)](https://egghead.io/lessons/egghead-force-a-dom-element-state-in-chrome-devtools)
- [Top 10 Chrome DevTools features for CSS](https://dev.to/nickbenksim/top-10-chrome-devtools-features-for-debugging-complex-css-2d78)
- [Tailwind CSS v4.0 release overview](https://fireup.pro/news/tailwind-css-v4-0-released-lightning-fast-builds-advanced-features-and-simplified-setup)
