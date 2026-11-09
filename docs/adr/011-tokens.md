# ADR-011: DTCG design tokens

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-11

## Context

The app uses Tailwind v3 with a JS config (`tailwind.config.ts`), and some app-chrome colours are hard-coded. User
variables will be exported too, and Figma imports DTCG tokens
([Figma help](https://help.figma.com/hc/en-us/articles/15343816063383)).

## Decision

Store tokens as DTCG-format JSON in `src/design/tokens/`, build them to CSS variables, and consume them through
Tailwind v4 `@theme`.

## Consequences

- One token source for app chrome and for exporting user variables.
- Requires the Tailwind v4 migration (LL-101) and a token build (LL-102).
- A lint rule bans colour literals in `src/components` and `src/features` (LL-104).

## Rejected options

- **Tailwind JS config:** not a portable token format.

## Related tasks

LL-101, LL-102, LL-103, LL-104.
