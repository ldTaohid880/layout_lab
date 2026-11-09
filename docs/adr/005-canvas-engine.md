# ADR-005: Custom canvas engine

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-5

## Context

The design canvas shows frames that are iframes (ADR-001) and handles input in the parent (ADR-002). It needs pan,
zoom, selection handles, guides and snapping.

## Decision

Build the canvas in-house: React, CSS transforms on a world layer for the camera, and an SVG overlay for handles and
guides.

## Consequences

- Full control over how iframes, camera and overlays fit together.
- No licence key or commercial licence to manage.
- More code to own: camera, tools, selection, snapping and performance are our work (M4).

## Rejected options

- **tldraw SDK:** does not model frames that are iframes; production needs a licence key and commercial use needs a
  commercial licence ([tldraw](https://tldraw.dev/sdk-features/license-key)).

## Related tasks

LL-401, LL-402, LL-405, LL-415.
