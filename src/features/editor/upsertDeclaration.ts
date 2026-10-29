import { generate, parse, type Declaration, type Rule } from 'css-tree'

/**
 * Set `property: value` in the top-level rule for `selector`, editing the CSS text in place so
 * the learner's formatting and comments survive. Replaces an existing declaration of the same
 * property, appends to the rule otherwise, and adds a new rule when none matches.
 */
export function upsertDeclaration(css: string, selector: string, property: string, value: string): string {
  const declaration = `${property}: ${value}`
  let rule: Rule | undefined
  try {
    const ast = parse(css, { positions: true })
    if (ast.type === 'StyleSheet') {
      ast.children.forEach((node) => {
        // Last matching rule wins in the cascade, so edit that one.
        if (node.type === 'Rule' && generate(node.prelude) === selector) rule = node
      })
    }
  } catch {
    rule = undefined
  }

  const block = rule?.block
  if (!rule || !block?.loc || css[block.loc.end.offset - 1] !== '}') {
    const base = css.trimEnd()
    return `${base}${base ? '\n\n' : ''}${selector} {\n  ${declaration};\n}\n`
  }

  const existing = block.children
    .toArray()
    .filter((n): n is Declaration => n.type === 'Declaration' && n.property.toLowerCase() === property)
    .pop()
  if (existing?.loc) {
    return css.slice(0, existing.loc.start.offset) + declaration + css.slice(existing.loc.end.offset)
  }

  const close = block.loc.end.offset - 1
  const before = css.slice(0, close).trimEnd()
  const needsSemicolon = !before.endsWith('{') && !before.endsWith(';')
  return `${before}${needsSemicolon ? ';' : ''}\n  ${declaration};\n${css.slice(close)}`
}
