# ADR-008: Security invariants stay unchanged

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-8

## Context

The preview is safe today because markup comes only from the typed tree (`generateHtml`), iframes run with
`sandbox="allow-scripts"` and no `allow-same-origin`, and `generateHtml.ts` sets a strict CSP:
`default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: https:; font-src data:`.
The design tool adds images, fonts and prototype behaviour.

## Decision

Keep every invariant: markup only from the typed tree, no user scripts, the CSP unchanged. Images come from IndexedDB
as `data:` URLs (already allowed by `img-src data: https:`). Fonts come as `data:` URLs (already allowed by
`font-src data:`). Prototype behaviour is typed data run by our own frame runtime.

## Consequences

- The preview's safety, the product's foundation, does not change.
- New features must fit inside the existing CSP; adding a CSP source needs a new ADR.
- Images and fonts are inlined as `data:` URLs, which costs memory and srcdoc size.
- Prototype interactions are limited to what the typed data and the runtime support.

## Rejected options

- **Allowing `blob:` URLs:** widens the CSP.
- **User JavaScript:** breaks the no-user-scripts invariant.

## Related tasks

LL-412, LL-511, LL-701.
