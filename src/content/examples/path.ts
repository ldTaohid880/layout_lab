import type { Track } from '../types'

/*
 * The order of the Examples tab: tracks (Layout, Typography…) in TRACKS order, each made of
 * modules going from beginner to hard. Every example id appears exactly once (content.test.ts
 * checks it). Lesson numbers such as "2.3" come from the position here and keep counting across
 * tracks, so reordering is a matter of moving an id.
 */

export interface PathModule {
  id: string
  track: Track
  title: string
  blurb: string
  examples: string[]
}

export const EXAMPLE_PATH: PathModule[] = [
  {
    id: 'box',
    track: 'Layout',
    title: 'Box & sizing',
    blurb: 'How big a box is: padding, borders, max widths and aspect ratios.',
    examples: [
      'box-sizing-compare',
      'fluid-panel',
      'figure-caption',
      'aspect-gallery',
      'float-text-wrap',
      'fixed-table-columns',
    ],
  },
  {
    id: 'flex-basics',
    track: 'Layout',
    title: 'Flexbox basics',
    blurb: 'One axis: line items up, space them, align them.',
    examples: [
      'center-flex',
      'stack-with-gap',
      'navbar',
      'breadcrumbs-gap',
      'align-self-toolbar',
      'chips-wrap',
      'baseline-label-value',
      'reorder-with-order',
    ],
  },
  {
    id: 'flex-sizing',
    track: 'Layout',
    title: 'Flex sizing',
    blurb: 'Who grows, who shrinks, and why content sometimes refuses to.',
    examples: [
      'search-input-group',
      'segmented-control',
      'equal-height-cards',
      'wrapping-cards',
      'sticky-footer',
      'media-object',
      'media-card-responsive',
      'wrapped-rows-align-content',
      'flex-app-frame',
    ],
  },
  {
    id: 'grid-basics',
    track: 'Layout',
    title: 'Grid basics',
    blurb: 'Two axes: tracks, fr units and aligning items in their cells.',
    examples: [
      'center-grid',
      'card-grid',
      'sidebar',
      'grid-featured-span',
      'list-justify-items',
      'settings-rows',
      'grid-column-flow',
    ],
  },
  {
    id: 'grid-placement',
    track: 'Layout',
    title: 'Grid placement',
    blurb: 'Putting items on exact lines, spanning tracks and naming areas.',
    examples: ['calendar-month', 'mosaic-grid', 'holy-grail', 'subgrid-card-rows'],
  },
  {
    id: 'positioning',
    track: 'Layout',
    title: 'Positioning',
    blurb: 'Taking a box out of the flow and pinning it somewhere else.',
    examples: [
      'badge',
      'toast-corner',
      'overlay-dialog',
      'hero-caption-overlay',
      'sticky-header',
      'center-with-translate',
      'tooltip-above',
      'dropdown-menu',
      'timeline-dots',
      'corner-ribbon',
    ],
  },
  {
    id: 'stacking',
    track: 'Layout',
    title: 'Layers & stacking',
    blurb: 'What paints on top, and why z-index sometimes cannot win.',
    examples: ['offset-frame', 'overlapping-avatars', 'stacking-context'],
  },
  {
    id: 'overflow',
    track: 'Layout',
    title: 'Overflow & scrolling',
    blurb: 'Content bigger than its box: clip it, scroll it, keep headers in view.',
    examples: ['scroll-strip', 'code-block-scroll', 'modal-scrolling-body', 'sticky-table-header'],
  },
  {
    id: 'real',
    track: 'Layout',
    title: 'Real layouts',
    blurb: 'Everything combined: whole components and app shells.',
    examples: ['container-query-card', 'pricing-tiers', 'dashboard-shell', 'kanban-board'],
  },
  {
    id: 'type-basics',
    track: 'Typography',
    title: 'Readable text',
    blurb: 'Fonts, sizes, weights and line lengths that make text easy to read.',
    examples: [
      'readable-measure',
      'type-scale',
      'eyebrow-label',
      'inline-text-styles',
      'font-weight-scale',
      'line-height-compare',
      'text-align-options',
      'styled-blockquote',
      'fluid-heading',
    ],
  },
  {
    id: 'type-details',
    track: 'Typography',
    title: 'Typographic details',
    blurb: 'Links, list markers, drop caps and numbers that line up.',
    examples: ['link-underlines', 'styled-ordered-list', 'drop-cap', 'tabular-numbers'],
  },
  {
    id: 'type-overflow',
    track: 'Typography',
    title: 'Taming long text',
    blurb: 'Truncating with an ellipsis and breaking words that will not fit.',
    examples: ['ellipsis-one-line', 'ellipsis-in-flex-row', 'break-long-words', 'hyphenate-narrow-column'],
  },
  {
    id: 'colour',
    track: 'Colour & backgrounds',
    title: 'Colour & backgrounds',
    blurb: 'Text colour, contrast, transparency, gradients and patterns, all without image files.',
    examples: [
      'text-and-background-colour',
      'alpha-vs-opacity',
      'gradient-hero',
      'current-color-icons',
      'css-patterns',
      'layered-backgrounds',
    ],
  },
  {
    id: 'effects',
    track: 'Borders & effects',
    title: 'Borders & effects',
    blurb: 'Borders, rounded shapes, shadows, focus rings and filters.',
    examples: [
      'rounded-shapes',
      'borders-and-dividers',
      'shadow-elevation',
      'outline-vs-border',
      'cursor-gallery',
      'focus-ring',
      'shadow-rings-and-insets',
      'filter-effects',
    ],
  },
  {
    id: 'surfaces',
    track: 'Borders & effects',
    title: 'Shapes & surfaces',
    blurb: 'Gradient borders, frosted glass, clipped shapes, blend modes and shadows that follow a shape.',
    examples: ['gradient-border', 'frosted-glass', 'clip-path-shapes', 'blend-modes', 'speech-bubble-shadow'],
  },
  {
    id: 'cascade',
    track: 'Cascade & variables',
    title: 'Selectors & the cascade',
    blurb: 'Which rule wins, selecting by position and state, inheritance and specificity control.',
    examples: [
      'which-rule-wins',
      'zebra-rows',
      'sibling-spacing',
      'interactive-states',
      'inheritance',
      'low-specificity-where',
    ],
  },
  {
    id: 'selectors',
    track: 'Cascade & variables',
    title: 'Selector toolkit',
    blurb: 'Pseudo-elements, attributes, nth-child formulas, :not(), :has() and form states.',
    examples: [
      'before-after-content',
      'attribute-selectors',
      'nth-child-patterns',
      'not-and-has',
      'focus-within-form',
      'checkbox-toggle',
    ],
  },
  {
    id: 'variables',
    track: 'Cascade & variables',
    title: 'Custom properties',
    blurb: 'Variables in CSS: define once, reuse everywhere, override for themes.',
    examples: ['theme-variables', 'variable-variants', 'spacing-scale-calc'],
  },
  {
    id: 'responsive',
    track: 'Responsive',
    title: 'Responsive design',
    blurb: 'Layouts, spacing and images that adapt to the screen and to their container.',
    examples: [
      'mobile-first-nav',
      'fluid-spacing',
      'full-height-screen',
      'image-crop-position',
      'named-container-widget',
    ],
  },
  {
    id: 'motion',
    track: 'Motion',
    title: 'Transitions & animations',
    blurb: 'Smooth state changes, keyframe animations, loaders, and respecting reduced motion.',
    examples: ['hover-lift', 'timing-functions', 'button-press', 'fade-in-keyframes', 'loaders', 'reduced-motion'],
  },
  {
    id: 'motion-components',
    track: 'Motion',
    title: 'Motion in components',
    blurb: 'Underlines, captions, skeletons, badges, list entrances and a typewriter.',
    examples: [
      'underline-grow',
      'hover-reveal-caption',
      'skeleton-shimmer',
      'pulse-badge',
      'staggered-list',
      'typewriter-steps',
    ],
  },
]
