# ADR-006: Shapes are HTML elements

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-6

## Context

A design tool has drawing tools (frame, rectangle, ellipse, text, image, line). Layout Lab teaches HTML and CSS, so
whatever the tools create should be code a learner can read.

## Decision

Every shape is an element styled with CSS:

| Shape     | Element                              |
| --------- | ------------------------------------ |
| Frame     | `div` or `section` with a fixed size |
| Rectangle | `div`                                |
| Ellipse   | `div` with `border-radius: 50%`      |
| Text      | `p`, `h1`–`h6` or `span`             |
| Image     | `img`                                |
| Line      | `hr`                                 |

## Consequences

- Everything on the canvas stays HTML + CSS that learners can read and export.
- Shapes go through the typed tree and `generateHtml`, so the security model is unchanged (ADR-008).
- No vector paths or boolean shape operations in v1.

## Rejected options

- **SVG shapes in v1:** deferred; they may come later as sanitised inline `svg`.

## Related tasks

LL-410, LL-411, LL-412.
