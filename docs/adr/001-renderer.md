# ADR-001: Real DOM in one sandboxed iframe per frame

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-1

## Context

Layout Lab renders the learner's tree and CSS as real HTML in a sandboxed iframe (`PreviewFrame.tsx`,
`generateHtml.ts`). The design tool adds frames (artboards) of different sizes on one canvas. Each frame must show
exactly what a browser would show at that width, including media queries, because the design is the CSS.

## Decision

Render every frame as real DOM in its own sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`), one
iframe per frame, reusing today's `generateHtml` pipeline, CSP and frame runtime.

## Consequences

- Layout, cascade and media queries are the browser's own; nothing is re-implemented.
- Each frame's media queries resolve against that frame's width.
- The existing renderer, CSP and tests carry over.
- Many frames mean many iframes, so the canvas needs a performance budget (LL-415), and frames report geometry to the
  parent instead of being inspected directly (ADR-002).

## Rejected options

- **WebGL or canvas renderer:** would re-implement CSS layout and could never match the browser exactly.
- **One iframe for all frames:** media queries would see a single viewport width for every frame.

## Related tasks

LL-309, LL-402, LL-415.
