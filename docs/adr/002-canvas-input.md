# ADR-002: The parent app owns all pointer input on the canvas

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-2

## Context

Frames are sandboxed iframes without `allow-same-origin` (ADR-001, ADR-008). Pointer events inside an iframe stay in
that iframe, so selection, dragging and snapping across several frames cannot be handled by any one frame. The frame
runtime already measures elements and posts the results to the parent.

## Decision

In Design mode the parent handles all pointer input. Frames get `pointer-events: none`. Hit-testing uses the element
geometry the frame runtime reports over `postMessage`.

## Consequences

- One input system for the whole canvas, across all frames.
- Frames stay pure renderers and remain sandboxed; no input handling runs next to user content.
- Hit-testing depends on fresh geometry: the runtime must report after every render, resize and font load.
- Editing text in place is an explicit request from the parent to the frame, not native focus.

## Rejected options

- **Event handling inside each iframe:** splits input across frames, puts more code inside the sandbox and makes
  cross-frame actions (dragging between frames, marquee selection) hard.

## Related tasks

LL-401, LL-405, LL-411.
