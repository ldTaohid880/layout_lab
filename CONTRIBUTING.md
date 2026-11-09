# Contributing to Layout Lab Studio

Thanks for helping. This guide covers the basics; [AGENTS.md](AGENTS.md) has the full rules (they apply to people
and coding agents alike), and [docs/PLAN.md](docs/PLAN.md) has the roadmap and task list.

## Setup

Requires Node 20+ (developed on Node 22).

```bash
npm ci
npm run dev        # http://localhost:5180
```

For E2E tests, install Playwright's Chromium once: `npx playwright install chromium`.

## Picking something to work on

- Planned work is in [docs/PLAN.md](docs/PLAN.md) as numbered tasks (`LL-001` to `LL-920`). Each lists its
  dependencies, files, what to do, and when it is done. Do not start a task whose dependencies are not merged.
- Found a bug or have an idea outside the plan? Open an issue first, using the bug, feature or content template.

## Making a change

1. Branch from `main` as `ll-<id>-<short-slug>` (for example `ll-302-yjs-doc-store`), or `fix-<slug>` for work
   outside the plan.
2. Write or update tests first for pure logic (`src/engine/**`, mapping, style ops, tree operations).
3. Keep the change to what the task asks; list anything else you had to touch in the pull request.
4. Run the checks:

   ```bash
   npm run typecheck
   npm run lint
   npm run test
   PW_CHANNEL=chromium npm run e2e:prod   # when the UI or the preview changed
   ```

5. Update [CHANGELOG.md](CHANGELOG.md) (newest first) and tick the task in `docs/PLAN.md`.
6. Open a pull request titled `LL-<id>: <task title>` and fill in the template. One task per pull request.

CI runs the same checks on every pull request.

## Code style

- Prettier formats code: no semicolons, single quotes, width 120, trailing commas. Named exports only.
- Import with the `@/` alias. Tests live next to the code as `*.test.ts(x)`; E2E specs live in `e2e/`.
- App chrome uses design tokens, not hard-coded colours.
- Every control needs a label, a keyboard path and a visible focus style.

## Content (examples, challenges, docs)

Examples, challenges and docs are JSON files checked by tests. See the README sections
"Adding a new example / doc entry" and "Adding a challenge". Regenerate reference pictures with
`npm run references` when a challenge's tree or solution changes.

## Security

The preview is a sandboxed iframe that only ever shows markup generated from the typed element tree. Never inject
HTML strings, never add `allow-same-origin` to the sandbox, and never widen the CSP or the attribute whitelist
without an ADR. The full list is in the "Security invariants" section of [AGENTS.md](AGENTS.md).

If you find a security problem, please report it privately to the maintainer instead of opening a public issue.

## Licence

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
