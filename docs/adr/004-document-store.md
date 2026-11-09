# ADR-004: Yjs document store

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-4

## Context

Today the sandbox state (`items` + `css`) lives in a Zustand store persisted to `localStorage`. The design tool needs
undo everywhere, offline storage of many files and, later, real-time collaboration.

## Decision

Store each document in Yjs. Nodes live in a `Y.Map` keyed by id; each node stores its `parentId` and a fractional
`index`. `Y.UndoManager` provides undo and `y-indexeddb` offline storage; a websocket provider comes later (M8).
Zustand keeps only UI and session state. Every write goes through `src/engine/doc` ops inside
`doc.transact(fn, origin)`.

## Consequences

- Undo, offline storage and multiplayer come from one model.
- Storing the parent on the child means a node can never have two parents. Figma's multiplayer design does the same
  ([Figma multiplayer post, archived](https://madebyevan.com/figma/)).
- Moves need a cycle check, and ordering uses fractional indexes.
- Document data is never mirrored into Zustand.
- Existing learner data needs a lossless migration (LL-303, LL-304).

## Rejected options

- **Zustand + zundo:** gives undo but no path to collaboration.
- **Automerge:** no first-class CodeMirror binding.

## Related tasks

LL-302, LL-303, LL-304, LL-307.
