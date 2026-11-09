# ADR-012: TanStack Router

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-12

## Context

Layout Lab has no router today. The plan needs deep links to lessons, challenges, files and shares.

## Decision

Use TanStack Router for type-safe routes and params.

## Consequences

- Every lesson, challenge, file and share gets a linkable URL.
- Route params are typed and checked at compile time.
- Hosting needs an SPA fallback to `index.html` (LL-005).

## Rejected options

- **Hash-only state:** no type safety and awkward deep links.

## Related tasks

LL-005, LL-011.
