import { type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { css, cssLanguage } from '@codemirror/lang-css'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import type { HintContext } from './cssHints'
import { lintCss } from './cssLint'

/** Suggest class names that exist in the item tree when typing a ".selector". */
function classNameCompletion(getClasses: () => string[]) {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\.-?[_a-zA-Z0-9-]*/)
    if (!word || (word.from === word.to && !context.explicit)) return null
    // Only in selector position: not inside a declaration block.
    const before = context.state.sliceDoc(0, word.from)
    if (before.lastIndexOf('{') > before.lastIndexOf('}')) return null
    return {
      from: word.from + 1,
      options: getClasses().map((name) => ({ label: name, type: 'class', detail: 'from tree' })),
      validFor: /^-?[_a-zA-Z0-9-]*$/,
    }
  }
}

const cssLinter = (getContext: () => HintContext) =>
  linter(
    (view): Diagnostic[] =>
      lintCss(view.state.doc.toString(), getContext()).map((d) => ({
        from: d.from,
        to: d.to,
        severity: d.severity,
        message: d.message,
        source: d.code,
      })),
    { delay: 250 },
  )

/** Syntax colours come from CSS variables, so the editor follows the app theme without reconfiguring. */
const highlight = HighlightStyle.define([
  { tag: [t.propertyName], color: 'hsl(var(--cm-property))' },
  { tag: [t.className, t.tagName, t.labelName, t.attributeName], color: 'hsl(var(--cm-selector))' },
  { tag: [t.number, t.unit, t.color, t.atom, t.keyword, t.bool], color: 'hsl(var(--cm-value))' },
  { tag: [t.string, t.special(t.string)], color: 'hsl(var(--cm-string))' },
  { tag: [t.comment], color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' },
  { tag: [t.variableName, t.definition(t.variableName)], color: 'hsl(var(--cm-variable))' },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket], color: 'hsl(var(--muted-foreground))' },
])

const chrome = EditorView.theme({
  '&': { height: '100%', fontSize: '13px', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
  '.cm-content': { caretColor: 'hsl(var(--primary))', padding: '8px 0' },
  '.cm-cursor': { borderLeftColor: 'hsl(var(--primary))', borderLeftWidth: '2px' },
  '.cm-gutters': {
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--muted-foreground) / 0.7)',
    border: 'none',
  },
  '.cm-activeLine': { backgroundColor: 'hsl(var(--muted) / 0.5)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'hsl(var(--foreground))' },
  '&.cm-focused': { outline: 'none' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'hsl(var(--primary) / 0.22) !important',
  },
  '.cm-matchingBracket': { backgroundColor: 'hsl(var(--primary) / 0.18)', outline: 'none' },
  '.cm-tooltip': {
    backgroundColor: 'hsl(var(--popover))',
    color: 'hsl(var(--popover-foreground))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)', fontSize: '12px' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
  },
  '.cm-completionDetail': { fontStyle: 'normal', opacity: '0.6', marginLeft: '8px' },
  '.cm-diagnostic': { fontFamily: 'var(--font-sans)', fontSize: '12px', padding: '4px 8px' },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy hsl(38 92% 50%)',
    textUnderlineOffset: '3px',
  },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy hsl(var(--destructive))',
    textUnderlineOffset: '3px',
  },
  '.cm-lintRange-info': {
    backgroundImage: 'none',
    textDecoration: 'underline dotted hsl(213 80% 55%)',
    textUnderlineOffset: '3px',
  },
  '.cm-panels': { backgroundColor: 'hsl(var(--surface))', color: 'hsl(var(--foreground))' },
})

export function editorExtensions(getContext: () => HintContext) {
  const getClasses = () => [...new Set((getContext().elementClasses ?? []).flat())].sort()
  return [
    css(),
    cssLanguage.data.of({ autocomplete: classNameCompletion(getClasses) }),
    syntaxHighlighting(highlight),
    chrome,
    cssLinter(getContext),
    lintGutter(),
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ 'aria-label': 'CSS editor' }),
  ]
}
