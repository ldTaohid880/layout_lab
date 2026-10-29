import { lexer, parse, walk, type Declaration } from 'css-tree'
import { layoutHints, type HintContext } from './cssHints'

/*
 * Editor-independent CSS diagnostics: syntax and validity (errors/warnings) plus layout hints
 * (info) from cssHints.ts.
 */

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export interface CssDiagnostic {
  from: number
  to: number
  severity: DiagnosticSeverity
  message: string
  code: string
}

/** Brace balance, skipping comments and strings. css-tree silently recovers from these. */
function checkBraces(css: string): CssDiagnostic[] {
  const out: CssDiagnostic[] = []
  const open: number[] = []
  let i = 0
  while (i < css.length) {
    const ch = css[i]
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      if (end === -1) {
        out.push({ from: i, to: css.length, severity: 'error', message: 'Unclosed comment', code: 'unclosed-comment' })
        break
      }
      i = end + 2
      continue
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < css.length && css[j] !== ch && css[j] !== '\n') j += css[j] === '\\' ? 2 : 1
      i = j + 1
      continue
    }
    if (ch === '{') open.push(i)
    else if (ch === '}') {
      if (open.length === 0) {
        out.push({ from: i, to: i + 1, severity: 'error', message: 'Unexpected "}"', code: 'unexpected-brace' })
      } else open.pop()
    }
    i += 1
  }
  for (const at of open) {
    out.push({ from: at, to: at + 1, severity: 'error', message: 'Missing closing "}"', code: 'unclosed-block' })
  }
  return out
}

/** var() is resolved at computed-value time, so the lexer cannot validate such values. */
function usesVar(node: Declaration): boolean {
  let found = false
  walk(node.value, {
    visit: 'Function',
    enter(fn) {
      if (fn.name.toLowerCase() === 'var') found = true
    },
  })
  return found
}

function declarationMessage(node: Declaration, error: Error): string {
  const first = error.message.split('\n')[0] ?? ''
  if (first.startsWith('Unknown property')) return `Unknown property "${node.property}"`
  if (node.value.type === 'Value' && node.value.children.isEmpty) return `Missing value for "${node.property}"`
  return `Invalid value for "${node.property}"`
}

export function lintCss(css: string, context: HintContext = {}): CssDiagnostic[] {
  const diagnostics: CssDiagnostic[] = checkBraces(css)
  const hasBraceErrors = diagnostics.length > 0

  let ast
  try {
    ast = parse(css, {
      positions: true,
      onParseError: (error) => {
        // Brace problems already have a clearer message; avoid a cascade of follow-on errors.
        if (hasBraceErrors) return
        const from = Math.min(Math.max(error.offset, 0), css.length)
        diagnostics.push({
          from,
          to: Math.min(from + 1, css.length),
          severity: 'error',
          message: error.message.split('\n')[0] || 'Syntax error',
          code: 'syntax',
        })
      },
    })
  } catch {
    return diagnostics
  }

  walk(ast, {
    visit: 'Declaration',
    enter(node: Declaration) {
      if (!node.loc || node.property.startsWith('--') || node.value.type === 'Raw') return
      const match = lexer.matchDeclaration(node)
      if (!match.error) return
      const unknown = match.error.message.startsWith('Unknown property')
      if (!unknown && usesVar(node)) return
      diagnostics.push({
        from: node.loc.start.offset,
        to: unknown ? node.loc.start.offset + node.property.length : node.loc.end.offset,
        severity: 'warning',
        message: declarationMessage(node, match.error),
        code: unknown ? 'unknown-property' : 'invalid-value',
      })
    },
  })

  diagnostics.push(...layoutHints(ast, context))
  return diagnostics.sort((a, b) => a.from - b.from)
}
