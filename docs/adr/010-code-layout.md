# ADR-010: One Vite app with a framework-free engine

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-10

## Context

The design tool adds a lot of logic (document model, style ops, mapping, rendering) that should be testable without a
browser. A server is only needed from M8.

## Decision

Keep one Vite app. New framework-free code goes in `src/engine/`: unit-tested TypeScript with no React and no DOM
globals except in clearly named adapters. Tokens live in `src/design/`. A `server/` package is added through npm
workspaces at M8.

## Consequences

- Engine logic is fast to test and can be reused, for example by the server in M8.
- React binds to the engine only through hooks in `src/engine/react` (LL-305).
- No monorepo tooling until there is a second package.

## Rejected options

- **Monorepo now:** premature with one app.

## Related tasks

LL-301, LL-305, LL-802.
