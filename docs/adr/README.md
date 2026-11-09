# Architecture decision records

These records fix the architecture of Layout Lab Design Studio. They come from the "Key decisions" table in
[docs/PLAN.md](../PLAN.md). Do not change a decision without a written ADR update approved by the owner.

| ADR                                 | Decision                                               | Status   |
| ----------------------------------- | ------------------------------------------------------ | -------- |
| [001](001-renderer.md)              | Real DOM in one sandboxed iframe per frame             | Accepted |
| [002](002-canvas-input.md)          | The parent app owns all pointer input on the canvas    | Accepted |
| [003](003-style-source-of-truth.md) | One CSS text per document is the style source of truth | Accepted |
| [004](004-document-store.md)        | Yjs document store                                     | Accepted |
| [005](005-canvas-engine.md)         | Custom canvas engine                                   | Accepted |
| [006](006-shapes.md)                | Shapes are HTML elements                               | Accepted |
| [007](007-class-policy.md)          | Primary-class policy                                   | Accepted |
| [008](008-security.md)              | Security invariants stay unchanged                     | Accepted |
| [009](009-backend.md)               | Local-first backend                                    | Accepted |
| [010](010-code-layout.md)           | One Vite app with a framework-free engine              | Accepted |
| [011](011-tokens.md)                | DTCG design tokens                                     | Accepted |
| [012](012-routing.md)               | TanStack Router                                        | Accepted |

## Adding or changing an ADR

- Add a new file `NNN-short-title.md` with the next number (ADR-013 is reserved for the sync-server choice in LL-801).
- Use the sections Status, Context, Decision, Consequences and Rejected options.
- To change a decision, write a new ADR that supersedes the old one and set the old one's status to
  "Superseded by ADR-NNN". Update the "Key decisions" table in docs/PLAN.md to match.
