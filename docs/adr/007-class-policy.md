# ADR-007: Primary-class policy

- Status: Accepted
- Date: 2026-11-09
- Source: docs/PLAN.md, "Key decisions", row ADR-7

## Context

Visual edits must write CSS somewhere (ADR-003). Inline `style` attributes would be easy, but they produce CSS nobody
would write by hand, and the security invariants in AGENTS.md never allow `style` attributes in the attribute
whitelist (ADR-008).

## Decision

Each styled node has a primary class, and visual edits write to that class's rule. If the class is shared by several
nodes, the panel asks the user to "Edit all N" or "Make unique" (which adds a new class to this node).

## Consequences

- CSS stays reusable and readable, the way it is taught.
- Never inline styles.
- The engine needs helpers to find, create and split primary classes (LL-311).
- Users see a choice whenever an edit would affect other nodes.

## Rejected options

- **Inline styles per node:** unreadable, and not what we teach.

## Related tasks

LL-311, LL-501.
