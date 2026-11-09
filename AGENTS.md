# AGENTS.md — Layout Lab Design Studio

A CSS learning app growing into a CSS-native design tool. React 18/19 + Vite + TypeScript (strict),
Tailwind, Radix (shadcn style), Zustand (UI state), Yjs (documents, from M3), CodeMirror 6, css-tree.
The full plan, spec and task list is docs/PLAN.md. Decisions are in docs/adr/ (written in LL-002). Read both before coding.

## Commands
- Install: npm ci
- Dev server: npm run dev  (http://localhost:5180)
- Type check: npm run typecheck
- Lint: npm run lint  (added in LL-003; until then Prettier is the only formatter check)
- Unit + component tests: npm run test
- E2E against production build: PW_CHANNEL=chromium npm run e2e:prod  (run `npx playwright install chromium` once)
- Challenge reference pictures: npm run references (only when a challenge's tree or solution changes)
- Storybook (from LL-106): npm run storybook

## How to work a task
1. Read the task in docs/PLAN.md (Depends on, Files, Do, Done when, Tests) and the spec sections it cites.
2. Check every dependency is merged. If not, stop and say so.
3. Branch: ll-<id>-<short-slug>, e.g. ll-302-yjs-doc-store.
4. Write or update tests first for pure logic (src/engine/**, mapping, style ops, treeOps).
5. Implement the smallest change that meets "Done when". Do not refactor outside the task's Files list
   unless needed to compile; list any such change in the PR.
6. Run: typecheck, lint, test, and e2e:prod when UI or the preview changed. All must pass.
7. Update CHANGELOG.md (newest first, same style as existing entries) and tick the task in docs/PLAN.md.
8. Open a PR titled "LL-<id>: <task title>" using the PR template.

One task per PR. Do not start the next task until the owner has reviewed and merged the current one.
If the spec and the code disagree, the code is the truth for current behaviour; stop and ask before
changing a spec decision.

## Code conventions
- Prettier: no semicolons, single quotes, width 120, trailing commas. Named exports only.
- Import with the @/ alias. Tests live next to code as *.test.ts(x). E2E specs in e2e/.
- src/engine/** is framework-free TypeScript: no React, no DOM globals except in clearly named adapters.
- UI state in Zustand; document state in Yjs (from M3). Never mirror document data into Zustand.
- Every write to a Y.Doc goes through src/engine/doc ops inside doc.transact(fn, origin).
- Styling of app chrome uses design tokens only. No hex, rgb() or hsl() literals in src/components
  or src/features (lint rule from LL-104). Teaching colours come from domain tokens.
- Accessible by default: every control has a label, keyboard path and visible focus.

## Security invariants (never break these)
- Preview markup is generated only from the typed tree (generateHtml). Never inject an HTML string from a user,
  a paste, a share link or the server. HTML import goes through the sanitise + convert pipeline (LL-313).
- Preview iframes keep sandbox="allow-scripts" WITHOUT allow-same-origin, and the CSP in generateHtml.ts.
  Only add CSP sources through an ADR.
- The frame runtime (src/features/preview/frameRuntime.ts) is serialised with Function.prototype.toString:
  it may only use its own helpers and browser globals; no imports, no module constants, no user input in code.
- Validate all external data with zod before it reaches a store or Y.Doc.
- Never add event-handler attributes, style attributes or generic src to the attribute whitelist.

## Key decisions
The 12 ADRs in docs/PLAN.md ("Key decisions") fix the architecture: real DOM in one sandboxed iframe per
frame, parent-owned input, one CSS text as the style source of truth, Yjs document store, custom canvas,
shapes are HTML elements, primary-class policy (never inline styles), unchanged security, local-first
backend, framework-free src/engine, DTCG tokens, TanStack Router. Do not change one without a written ADR
update approved by the owner.

## Content
Examples, challenges and docs are plain JSON checked by tests. Use the project skills in .claude/skills/
(new-example, new-challenge, new-doc-entry) and the README sections "Adding a new example / doc entry"
and "Adding a challenge". Regenerate reference pictures when a challenge's tree or solution changes.

## Dependencies
- Only add packages named in the task or in docs/PLAN.md "Libraries". Anything else: propose it in the PR
  description with size and licence, do not install.

## When unsure
- If the spec is ambiguous or conflicts with the code, stop and write the question in the PR description
  with two options and your recommendation. Do not invent product behaviour.

## Definition of done (every task)
- All "Done when" items are true and demonstrated by a test or a screenshot in the PR.
- Typecheck, lint, unit tests and (when relevant) E2E pass locally and in CI.
- No new hard-coded colours; new UI uses tokens and existing components.
- Keyboard and screen-reader path checked for new UI; axe has no new violations (from LL-106).
- Analytics event added if the task creates a user-visible feature (event names in LL-008).
- CHANGELOG.md updated; task ticked in docs/PLAN.md; ADR written if a decision changed.
- Bundle size change noted in the PR if over 20 KB gzip.

## Reporting back
When a task is done, give: summary, files changed, test results, anything left for a follow-up task.
For design-heavy tasks (M1, M5 panels), also add or update Storybook stories and attach screenshots of
light and dark themes.
