# ADR-009: Local-first backend

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-9

## Context

Layout Lab has no server today. Accounts, cloud files and collaboration (M8) need one, but learners and designers
should get value long before that.

## Decision

The app is local-first and works fully without an account. At M8, add Supabase (auth, Postgres, storage) and a Yjs
websocket server (Hocuspocus or y-sweet). The sync server is picked in spike LL-801 and recorded as ADR-013.

## Consequences

- Value ships before any server exists; no backend cost or operations until M8.
- Yjs (ADR-004) pairs local IndexedDB persistence with a network provider, so sync is added rather than rebuilt.
- Existing features must never require signing in.

## Rejected options

- **Server-first architecture:** delays every feature behind backend work.

## Related tasks

LL-304, LL-801, LL-802.
