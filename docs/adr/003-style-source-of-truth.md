# ADR-003: One CSS text per document is the style source of truth

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-3

## Context

Learners write CSS by hand in the code editor. The design panel will change styles visually. If the two keep
separate models they can disagree, and hand-written CSS (comments, rule order, selectors the panel does not
understand) is lost when one is serialised into the other. `css-tree` is already a dependency.

## Decision

Each document stores one CSS text (`Y.Text`). The design panel edits it through a style-ops module built on
`css-tree` that reads the current rules and applies minimal text edits.

## Consequences

- The code view and the design panel can never disagree; both read the same text.
- Hand-written CSS, comments and rule order survive visual edits.
- The style-ops engine must parse, query and edit CSS precisely, with thorough unit tests (LL-310).
- Visual controls need a mapping between CSS values and control state (LL-501).

## Rejected options

- **Style objects serialised to CSS:** simpler to edit, but loses hand-written CSS and comments.

## Related tasks

LL-310, LL-311, LL-501.
