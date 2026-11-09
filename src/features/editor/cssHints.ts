import { generate, walk, type CssNode, type Declaration, type Rule } from 'css-tree'
import type { CssDiagnostic } from './cssLint'

/*
 * Layout hints: declarations that are valid CSS but do nothing in context, the mistakes learners
 * actually make. Hints are conservative: a selector's declarations are merged across all rules,
 * and for a plain class selector also with the classes it shares an element with in the tree.
 * A hint only fires when no combination could make the declaration work.
 */

export interface HintContext {
  /** Class lists of every element in the tree, e.g. [['layer', 'a'], ['group']]. */
  elementClasses?: string[][]
}

type Decls = Map<string, Set<string>>

const FLEX_OR_GRID = /^(inline-)?(flex|grid)$/
const FLEX = /^(inline-)?flex$/
const GRID = /^(inline-)?grid$/

/** Container properties for flex or grid (gap is also valid in multi-column layout). */
const FLEX_OR_GRID_PROPS = new Set(['justify-content', 'align-items', 'place-content', 'gap', 'row-gap', 'column-gap'])
const FLEX_ONLY_PROPS = new Set(['flex-direction', 'flex-wrap', 'flex-flow'])
const GRID_ONLY_PROPS = new Set([
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'grid-template',
  'grid-auto-flow',
  'grid-auto-rows',
  'grid-auto-columns',
  'justify-items',
  'place-items',
])
const OFFSET_PROPS = new Set(['top', 'right', 'bottom', 'left', 'inset'])
const SIMPLE_CLASS = /^\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)$/

function selectorsOf(rule: Rule): string[] {
  if (rule.prelude.type !== 'SelectorList') return [generate(rule.prelude)]
  return rule.prelude.children.toArray().map((s) => generate(s))
}

function declsOf(rule: Rule): Declaration[] {
  return rule.block.children.toArray().filter((n): n is Declaration => n.type === 'Declaration')
}

function valueOf(decl: Declaration): string {
  return generate(decl.value).trim().toLowerCase()
}

function addDecls(target: Decls, decls: Declaration[]) {
  for (const d of decls) {
    const prop = d.property.toLowerCase()
    const set = target.get(prop) ?? new Set<string>()
    set.add(valueOf(d))
    target.set(prop, set)
  }
}

function mergeInto(target: Decls, source: Decls | undefined) {
  source?.forEach((values, prop) => {
    const set = target.get(prop) ?? new Set<string>()
    values.forEach((v) => set.add(v))
    target.set(prop, set)
  })
}

const any = (values: Set<string> | undefined, re: RegExp) => [...(values ?? [])].some((v) => re.test(v))

export function layoutHints(ast: CssNode, ctx: HintContext = {}): CssDiagnostic[] {
  const rules: Rule[] = []
  walk(ast, {
    visit: 'Rule',
    enter(rule: Rule) {
      rules.push(rule)
    },
  })

  // selector -> declarations from every rule naming it (alone or in a list)
  const bySelector = new Map<string, Decls>()
  for (const rule of rules) {
    const decls = declsOf(rule)
    for (const sel of selectorsOf(rule)) {
      const entry: Decls = bySelector.get(sel) ?? new Map<string, Set<string>>()
      addDecls(entry, decls)
      bySelector.set(sel, entry)
    }
  }

  const effective = (rule: Rule): Decls => {
    const out: Decls = new Map()
    for (const sel of selectorsOf(rule)) {
      mergeInto(out, bySelector.get(sel))
      const cls = SIMPLE_CLASS.exec(sel)?.[1]
      if (!cls || !ctx.elementClasses) continue
      for (const classes of ctx.elementClasses) {
        if (!classes.includes(cls)) continue
        for (const other of classes) if (other !== cls) mergeInto(out, bySelector.get(`.${other}`))
      }
    }
    return out
  }

  const out: CssDiagnostic[] = []
  const hint = (decl: Declaration, code: string, message: string) => {
    if (!decl.loc) return
    out.push({ from: decl.loc.start.offset, to: decl.loc.end.offset, severity: 'info', code, message })
  }

  for (const rule of rules) {
    const decls = declsOf(rule)
    if (decls.length === 0) continue
    const eff = effective(rule)
    const display = eff.get('display')
    const displayText = display ? [...display].join(' / ') : null
    const position = eff.get('position')
    const positioned = any(position, /^(relative|absolute|fixed|sticky)$/)

    for (const decl of decls) {
      const prop = decl.property.toLowerCase()
      const value = valueOf(decl)

      if (FLEX_OR_GRID_PROPS.has(prop) && !any(display, FLEX_OR_GRID)) {
        const multicol = prop.endsWith('gap') && (eff.has('columns') || eff.has('column-count'))
        if (!multicol) {
          hint(
            decl,
            'needs-flex-or-grid',
            displayText
              ? `${prop} has no effect here: display is ${displayText}. It works on flex and grid containers.`
              : `${prop} only works on flex or grid containers. Add display: flex or display: grid.`,
          )
        }
      } else if (FLEX_ONLY_PROPS.has(prop) && !any(display, FLEX)) {
        hint(
          decl,
          'needs-flex',
          any(display, GRID)
            ? `${prop} has no effect on a grid container.`
            : `${prop} only works on flex containers. Add display: flex.`,
        )
      } else if (GRID_ONLY_PROPS.has(prop) && !any(display, GRID)) {
        hint(
          decl,
          'needs-grid',
          any(display, FLEX)
            ? `${prop} has no effect on a flex container. Use display: grid.`
            : `${prop} only works on grid containers. Add display: grid.`,
        )
      } else if (OFFSET_PROPS.has(prop) && !positioned && value !== 'auto') {
        hint(
          decl,
          'needs-position',
          `${prop} has no effect on a static element. Add position: relative, absolute, fixed or sticky.`,
        )
      } else if (prop === 'z-index' && !positioned && value !== 'auto') {
        hint(
          decl,
          'z-index-static',
          'z-index only applies to positioned elements and flex/grid items. If this is neither, add position: relative.',
        )
      } else if (prop === 'position' && value === 'sticky' && ![...OFFSET_PROPS].some((p) => eff.has(p))) {
        hint(decl, 'sticky-offset', 'position: sticky needs an offset such as top: 0 to know where to stick.')
      } else if ((prop === 'width' || prop === 'height') && display?.size === 1 && display.has('inline')) {
        hint(decl, 'inline-size', `${prop} is ignored on display: inline elements. Try inline-block.`)
      }
    }
  }

  // Selectors that can never match anything in the current tree.
  if (ctx.elementClasses) {
    const known = new Set(ctx.elementClasses.flat())
    for (const rule of rules) {
      walk(rule.prelude, {
        visit: 'ClassSelector',
        enter(node) {
          if (known.has(node.name) || !node.loc) return
          out.push({
            from: node.loc.start.offset,
            to: node.loc.end.offset,
            severity: 'info',
            code: 'unknown-class',
            message: `No element in the tree has the class "${node.name}".`,
          })
        },
      })
    }
  }

  return out
}
