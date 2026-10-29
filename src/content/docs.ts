import type { DocEntry, DocGroup } from './types'

export const DOC_GROUPS: DocGroup[] = [
  'Box & display',
  'Flex container',
  'Flex item',
  'Grid container',
  'Grid item',
  'Positioning',
  'Media',
]

export const DOCS: DocEntry[] = [
  // ---- Box & display ------------------------------------------------------------------------
  {
    property: 'display',
    group: 'Box & display',
    appliesTo: 'any element',
    summary: 'Chooses the layout an element takes part in and the one it gives its children.',
    details:
      'The outer type (block, inline) decides how the element sits among its siblings; the inner type (flow, flex, grid) decides how its children are laid out. display: flex is block outside, flex inside.',
    values: [
      { value: 'block', note: 'Full-width box on its own line.' },
      { value: 'inline', note: 'Flows with text; width and height are ignored.' },
      { value: 'inline-block', note: 'Flows with text but respects width and height.' },
      { value: 'flex', note: 'Children become flex items on one axis.' },
      { value: 'grid', note: 'Children are placed on a two-dimensional grid.' },
      { value: 'none', note: 'Removed from layout entirely.' },
    ],
    gotcha: 'Flex and grid properties (gap, justify-content…) do nothing until the parent has display: flex or grid.',
    related: ['box-sizing', 'flex-direction', 'grid-template-columns'],
  },
  {
    property: 'box-sizing',
    group: 'Box & display',
    appliesTo: 'any element',
    summary: 'Whether width and height include padding and border.',
    details:
      'With the default content-box, a 200px box with 20px padding is 240px wide. border-box keeps it at 200px and shrinks the content instead, which is easier to reason about.',
    values: [
      { value: 'border-box', note: 'width includes padding and border.' },
      { value: 'content-box', note: 'Default: width is the content only.' },
    ],
    related: ['width', 'padding'],
  },
  {
    property: 'width',
    group: 'Box & display',
    appliesTo: 'non-inline elements',
    summary: 'The width of the box (content box unless box-sizing says otherwise).',
    details:
      'Blocks default to auto, which fills the container. Percentages resolve against the containing block. Prefer max-width for readable, responsive boxes.',
    values: [
      { value: 'auto', note: 'Default: blocks fill, others shrink to fit.' },
      { value: '50%', note: 'Half the containing block.' },
      { value: '240px', note: 'Fixed width.' },
      { value: 'fit-content', note: 'As wide as the content, up to the container.' },
    ],
    gotcha: 'Ignored on display: inline elements.',
    related: ['min-width', 'max-width', 'box-sizing'],
  },
  {
    property: 'height',
    group: 'Box & display',
    appliesTo: 'non-inline elements',
    summary: 'The height of the box.',
    details:
      'auto means "as tall as the content", which is almost always what you want. A percentage height only works if the parent has a definite height.',
    values: [
      { value: 'auto', note: 'Default: fits the content.' },
      { value: '200px', note: 'Fixed height; content may overflow.' },
      { value: '100%', note: 'Needs a parent with a set height.' },
      { value: '100vh', note: 'Full viewport height.' },
    ],
    related: ['min-height', 'overflow', 'aspect-ratio'],
  },
  {
    property: 'min-width',
    group: 'Box & display',
    appliesTo: 'non-inline elements',
    summary: 'A floor for the width. Also controls how far flex and grid items can shrink.',
    details:
      'Flex and grid items default to min-width: auto, which means "not smaller than my content". Setting min-width: 0 lets them shrink so text can wrap or truncate.',
    values: [
      { value: '0', note: 'Lets flex/grid items shrink below their content.' },
      { value: '200px', note: 'Never narrower than 200px.' },
      { value: 'auto', note: 'Default; content-based minimum for flex/grid items.' },
    ],
    gotcha: 'If a flex child overflows its parent, min-width: 0 on that child is usually the fix.',
    related: ['width', 'max-width', 'flex-shrink'],
  },
  {
    property: 'max-width',
    group: 'Box & display',
    appliesTo: 'non-inline elements',
    summary: 'A ceiling for the width.',
    details: 'max-width with margin-inline: auto is the classic centered, readable column.',
    values: [
      { value: '480px', note: 'Grows up to 480px, then stops.' },
      { value: '65ch', note: 'About 65 characters: a comfortable reading width.' },
      { value: '100%', note: 'Never wider than the container.' },
      { value: 'none', note: 'Default: no ceiling.' },
    ],
    related: ['width', 'min-width', 'margin'],
  },
  {
    property: 'min-height',
    group: 'Box & display',
    appliesTo: 'non-inline elements',
    summary: 'A floor for the height; the box can still grow with content.',
    details: 'Safer than height when you want "at least this tall": content never overflows.',
    values: [
      { value: '100vh', note: 'At least the viewport height.' },
      { value: '320px', note: 'At least 320px.' },
      { value: '0', note: 'Lets flex/grid items in a column shrink.' },
    ],
    related: ['height'],
  },
  {
    property: 'aspect-ratio',
    group: 'Box & display',
    appliesTo: 'any element',
    summary: 'Derives one dimension from the other.',
    details:
      'With only a width set, height follows the ratio. If content is taller than the ratio allows, the box grows unless overflow is set.',
    values: [
      { value: '1 / 1', note: 'Square.' },
      { value: '16 / 9', note: 'Widescreen.' },
      { value: '4 / 3', note: 'Classic photo.' },
      { value: 'auto', note: 'Default: no ratio (images use their own).' },
    ],
    related: ['width', 'height', 'object-fit'],
  },
  {
    property: 'margin',
    group: 'Box & display',
    appliesTo: 'any element',
    summary: 'Space outside the border. auto margins absorb free space.',
    details:
      'Vertical margins between blocks collapse into the larger one. In flex and grid there is no collapsing, and an auto margin pushes the item away from its neighbours.',
    values: [
      { value: '0 auto', note: 'Centers a block that has a width.' },
      { value: '16px', note: 'All four sides.' },
      { value: '0', note: 'Removes margins.' },
      { value: 'auto', note: 'In flex/grid: soaks up free space on all sides.' },
    ],
    gotcha: 'Use margin-left: auto on a flex item to push it (and everything after it) to the end.',
    related: ['padding', 'gap'],
  },
  {
    property: 'padding',
    group: 'Box & display',
    appliesTo: 'any element',
    summary: 'Space inside the border, around the content.',
    details: 'Padding is part of the background area and, with box-sizing: border-box, part of the width.',
    values: [
      { value: '16px', note: 'All four sides.' },
      { value: '8px 16px', note: 'Vertical then horizontal.' },
      { value: '0', note: 'No padding.' },
    ],
    related: ['margin', 'box-sizing'],
  },
  {
    property: 'overflow',
    group: 'Box & display',
    appliesTo: 'block containers, flex and grid containers',
    summary: 'What happens to content that does not fit.',
    details:
      'Anything other than visible creates a scroll container (and a new block formatting context, which also contains floats).',
    values: [
      { value: 'visible', note: 'Default: content spills out.' },
      { value: 'hidden', note: 'Clips; no scrolling.' },
      { value: 'auto', note: 'Scrollbars only when needed.' },
      { value: 'scroll', note: 'Always shows scrollbars.' },
      { value: 'clip', note: 'Clips without becoming a scroll container.' },
    ],
    gotcha: 'overflow: hidden on an ancestor breaks position: sticky inside it. Use clip instead.',
    related: ['height', 'position'],
  },
  // ---- Flex container -----------------------------------------------------------------------
  {
    property: 'flex-direction',
    group: 'Flex container',
    appliesTo: 'flex containers',
    summary: 'Which way the main axis runs.',
    details:
      'justify-content follows the main axis and align-items the cross axis, so switching to column swaps what they do.',
    values: [
      { value: 'row', note: 'Default: left to right (in LTR).' },
      { value: 'column', note: 'Top to bottom.' },
      { value: 'row-reverse', note: 'Right to left; visual only.' },
      { value: 'column-reverse', note: 'Bottom to top; visual only.' },
    ],
    gotcha: 'Reverse values change visual order but not tab order. Keyboard users still go in HTML order.',
    related: ['justify-content', 'align-items', 'flex-wrap'],
  },
  {
    property: 'flex-wrap',
    group: 'Flex container',
    appliesTo: 'flex containers',
    summary: 'Whether items may move onto new lines.',
    details: 'Without wrapping, items shrink (and then overflow) to stay on one line.',
    values: [
      { value: 'nowrap', note: 'Default: one line.' },
      { value: 'wrap', note: 'Extra items start a new line.' },
      { value: 'wrap-reverse', note: 'New lines go above.' },
    ],
    related: ['flex-basis', 'align-content', 'gap'],
  },
  {
    property: 'justify-content',
    group: 'Flex container',
    appliesTo: 'flex and grid containers',
    summary: 'Distributes free space along the main axis.',
    details:
      'Only free space is distributed: if items grow to fill the line (flex: 1), there is none left and justify-content has nothing to do.',
    values: [
      { value: 'flex-start', note: 'Default: packed at the start.' },
      { value: 'center', note: 'Packed in the middle.' },
      { value: 'flex-end', note: 'Packed at the end.' },
      { value: 'space-between', note: 'First and last at the edges, equal gaps between.' },
      { value: 'space-around', note: 'Equal space around each item.' },
      { value: 'space-evenly', note: 'Equal space everywhere, edges included.' },
    ],
    related: ['align-items', 'gap', 'flex-direction'],
  },
  {
    property: 'align-items',
    group: 'Flex container',
    appliesTo: 'flex and grid containers',
    summary: 'Aligns items on the cross axis (in grid: within their row).',
    details:
      'The default, stretch, makes items as tall as the line. Any other value makes them their content height.',
    values: [
      { value: 'stretch', note: 'Default: fill the cross axis.' },
      { value: 'center', note: 'Centered on the cross axis.' },
      { value: 'flex-start', note: 'At the cross start.' },
      { value: 'flex-end', note: 'At the cross end.' },
      { value: 'baseline', note: 'First lines of text line up.' },
    ],
    related: ['align-self', 'justify-content', 'align-content'],
  },
  {
    property: 'align-content',
    group: 'Flex container',
    appliesTo: 'multi-line flex containers, grid containers',
    summary: 'Distributes the lines of a wrapping flex container (or grid tracks) on the cross axis.',
    details: 'With a single line of flex items it has no effect: use align-items for that.',
    values: [
      { value: 'stretch', note: 'Default: lines share the space.' },
      { value: 'flex-start', note: 'Lines packed at the start.' },
      { value: 'center', note: 'Lines packed in the middle.' },
      { value: 'space-between', note: 'Lines spread out.' },
    ],
    related: ['flex-wrap', 'align-items'],
  },
  {
    property: 'gap',
    group: 'Flex container',
    appliesTo: 'flex, grid and multi-column containers',
    summary: 'Space between items, never at the outer edges.',
    details: 'Shorthand for row-gap and column-gap. Replaces the old trick of margins on every child.',
    values: [
      { value: '12px', note: 'Same gap both ways.' },
      { value: '24px 8px', note: 'Row gap, then column gap.' },
      { value: '0', note: 'No gap.' },
    ],
    related: ['margin', 'justify-content'],
  },
  // ---- Flex item ----------------------------------------------------------------------------
  {
    property: 'flex',
    group: 'Flex item',
    appliesTo: 'flex items',
    summary: 'Shorthand for flex-grow, flex-shrink and flex-basis.',
    details:
      'flex: 1 means 1 1 0%: grow, shrink, and start from zero, so siblings with flex: 1 end up equal. flex: auto starts from the content size instead.',
    values: [
      { value: '1', note: 'Grow and shrink; equal shares.' },
      { value: 'auto', note: 'Grow and shrink from content size.' },
      { value: 'none', note: 'Fixed at content size.' },
      { value: '0 0 160px', note: 'Exactly 160px, never grow or shrink.' },
    ],
    related: ['flex-grow', 'flex-shrink', 'flex-basis'],
  },
  {
    property: 'flex-grow',
    group: 'Flex item',
    appliesTo: 'flex items',
    summary: 'How much of the free space the item takes, relative to siblings.',
    details: 'Free space is split in proportion to grow values: 2 gets twice as much extra as 1.',
    values: [
      { value: '0', note: 'Default: do not grow.' },
      { value: '1', note: 'Take a share of free space.' },
      { value: '2', note: 'Take twice the share.' },
    ],
    related: ['flex', 'flex-shrink'],
  },
  {
    property: 'flex-shrink',
    group: 'Flex item',
    appliesTo: 'flex items',
    summary: 'How much the item gives up when space runs short.',
    details: 'Shrinking is weighted by flex-basis, so bigger items shrink more. It never goes below min-width.',
    values: [
      { value: '1', note: 'Default: shrink as needed.' },
      { value: '0', note: 'Never shrink (icons, images).' },
    ],
    related: ['flex', 'min-width'],
  },
  {
    property: 'flex-basis',
    group: 'Flex item',
    appliesTo: 'flex items',
    summary: 'The starting size along the main axis, before growing or shrinking.',
    details: 'auto uses the width (or height in a column), falling back to the content size.',
    values: [
      { value: 'auto', note: 'Default: use width or content.' },
      { value: '0', note: 'Start from nothing; size comes from flex-grow.' },
      { value: '200px', note: 'Start at 200px.' },
      { value: '50%', note: 'Half the container.' },
    ],
    related: ['flex', 'width'],
  },
  {
    property: 'align-self',
    group: 'Flex item',
    appliesTo: 'flex and grid items',
    summary: 'Overrides the parent\'s align-items for this one item.',
    details: 'Useful for a single item that should not stretch, or should sit at the bottom.',
    values: [
      { value: 'auto', note: 'Default: follow align-items.' },
      { value: 'center', note: 'Center on the cross axis.' },
      { value: 'flex-start', note: 'Cross start.' },
      { value: 'flex-end', note: 'Cross end.' },
      { value: 'stretch', note: 'Fill the cross axis.' },
    ],
    related: ['align-items', 'justify-self'],
  },
  {
    property: 'order',
    group: 'Flex item',
    appliesTo: 'flex and grid items',
    summary: 'Changes visual order without changing the HTML.',
    details: 'Items are sorted by order (default 0), then by source order.',
    values: [
      { value: '-1', note: 'Move to the front.' },
      { value: '0', note: 'Default.' },
      { value: '1', note: 'Move after items with 0.' },
    ],
    gotcha: 'Screen readers and the Tab key still follow the HTML order.',
    related: ['flex-direction'],
  },
  // ---- Grid container -----------------------------------------------------------------------
  {
    property: 'grid-template-columns',
    group: 'Grid container',
    appliesTo: 'grid containers',
    summary: 'Defines the column tracks.',
    details:
      'Mix fixed lengths, fr units (shares of free space), minmax() and repeat(). repeat(auto-fill, minmax(140px, 1fr)) gives responsive columns without media queries.',
    values: [
      { value: '1fr 1fr', note: 'Two equal columns.' },
      { value: '200px 1fr', note: 'Fixed sidebar, fluid main.' },
      { value: 'repeat(3, 1fr)', note: 'Three equal columns.' },
      { value: 'repeat(auto-fill, minmax(140px, 1fr))', note: 'As many 140px+ columns as fit.' },
    ],
    gotcha: '1fr has an automatic minimum of its content. Use minmax(0, 1fr) to let a column shrink further.',
    related: ['grid-template-rows', 'gap', 'grid-column'],
  },
  {
    property: 'grid-template-rows',
    group: 'Grid container',
    appliesTo: 'grid containers',
    summary: 'Defines the row tracks.',
    details: 'Rows beyond those listed are created automatically and sized by grid-auto-rows.',
    values: [
      { value: 'auto 1fr auto', note: 'Header, stretchy body, footer.' },
      { value: 'repeat(2, 120px)', note: 'Two 120px rows.' },
      { value: 'none', note: 'Default: all rows implicit.' },
    ],
    related: ['grid-template-columns', 'grid-auto-rows'],
  },
  {
    property: 'grid-template-areas',
    group: 'Grid container',
    appliesTo: 'grid containers',
    summary: 'Names cells with an ASCII-art picture of the layout.',
    details:
      'Each string is a row, each word a cell; repeat a name to span. A dot (.) is an empty cell. Areas must be rectangles.',
    values: [
      { value: '"header header" "nav main"', note: 'Header across two columns.' },
      { value: '"a b" "c d"', note: 'Four named cells.' },
      { value: 'none', note: 'Default.' },
    ],
    related: ['grid-area', 'grid-template-columns'],
  },
  {
    property: 'grid-auto-flow',
    group: 'Grid container',
    appliesTo: 'grid containers',
    summary: 'How items without an explicit position are placed.',
    details: 'dense back-fills holes left by spanning items, at the cost of visual order matching source order.',
    values: [
      { value: 'row', note: 'Default: fill each row, then the next.' },
      { value: 'column', note: 'Fill each column, then the next.' },
      { value: 'row dense', note: 'Back-fill gaps.' },
    ],
    related: ['grid-auto-rows', 'grid-column'],
  },
  {
    property: 'grid-auto-rows',
    group: 'Grid container',
    appliesTo: 'grid containers',
    summary: 'The size of rows the grid creates implicitly.',
    details: 'minmax(100px, auto) gives rows that are at least 100px but grow with content.',
    values: [
      { value: 'auto', note: 'Default: content height.' },
      { value: '100px', note: 'Every implicit row is 100px.' },
      { value: 'minmax(100px, auto)', note: 'At least 100px.' },
    ],
    related: ['grid-template-rows', 'grid-auto-flow'],
  },
  {
    property: 'justify-items',
    group: 'Grid container',
    appliesTo: 'grid containers',
    summary: 'Aligns every item horizontally within its grid cell.',
    details: 'The default stretch makes items fill the cell width.',
    values: [
      { value: 'stretch', note: 'Default: fill the cell.' },
      { value: 'start', note: 'Left of the cell.' },
      { value: 'center', note: 'Centered in the cell.' },
      { value: 'end', note: 'Right of the cell.' },
    ],
    gotcha: 'Has no effect in flexbox: there are no cells. Use justify-content or margins.',
    related: ['justify-self', 'place-items', 'align-items'],
  },
  {
    property: 'place-items',
    group: 'Grid container',
    appliesTo: 'grid containers (align-items part also in flex)',
    summary: 'Shorthand for align-items and justify-items.',
    details: 'place-items: center on a grid is the shortest way to center a child both ways.',
    values: [
      { value: 'center', note: 'Center in both directions.' },
      { value: 'start', note: 'Top-left of each cell.' },
      { value: 'end start', note: 'Bottom-left (block axis first).' },
      { value: 'stretch', note: 'Default.' },
    ],
    related: ['align-items', 'justify-items'],
  },
  // ---- Grid item ----------------------------------------------------------------------------
  {
    property: 'grid-column',
    group: 'Grid item',
    appliesTo: 'grid items',
    summary: 'Which column lines the item starts and ends on.',
    details: 'Lines are numbered from 1; negative numbers count from the end, so 1 / -1 spans the full explicit grid.',
    values: [
      { value: 'span 2', note: 'Two columns wide.' },
      { value: '1 / -1', note: 'Full width.' },
      { value: '2 / 4', note: 'From line 2 to line 4.' },
      { value: 'auto', note: 'Default: auto-placed.' },
    ],
    related: ['grid-row', 'grid-area', 'grid-template-columns'],
  },
  {
    property: 'grid-row',
    group: 'Grid item',
    appliesTo: 'grid items',
    summary: 'Which row lines the item starts and ends on.',
    details: 'Works like grid-column on the other axis.',
    values: [
      { value: 'span 2', note: 'Two rows tall.' },
      { value: '1 / 3', note: 'Rows 1 and 2.' },
      { value: 'auto', note: 'Default.' },
    ],
    related: ['grid-column', 'grid-area'],
  },
  {
    property: 'grid-area',
    group: 'Grid item',
    appliesTo: 'grid items',
    summary: 'Puts the item in a named area (or sets row and column lines at once).',
    details: 'The name must match one in the parent\'s grid-template-areas.',
    values: [
      { value: 'header', note: 'The area named "header".' },
      { value: 'main', note: 'The area named "main".' },
      { value: '1 / 1 / 3 / 3', note: 'row-start / col-start / row-end / col-end.' },
    ],
    related: ['grid-template-areas', 'grid-column'],
  },
  {
    property: 'justify-self',
    group: 'Grid item',
    appliesTo: 'grid items, absolutely positioned boxes',
    summary: 'Horizontal alignment of one item within its cell.',
    details: 'Overrides the container\'s justify-items for this item.',
    values: [
      { value: 'start', note: 'Left of the cell.' },
      { value: 'center', note: 'Centered.' },
      { value: 'end', note: 'Right of the cell.' },
      { value: 'stretch', note: 'Fill the cell.' },
    ],
    related: ['justify-items', 'align-self'],
  },
  // ---- Positioning --------------------------------------------------------------------------
  {
    property: 'position',
    group: 'Positioning',
    appliesTo: 'any element',
    summary: 'How offsets (top, left…) apply and what the box is positioned against.',
    details:
      'relative nudges the box but keeps its space and becomes the anchor for absolute children. absolute leaves the flow and is placed against the nearest positioned ancestor. fixed is placed against the viewport. sticky is normal until scrolled to its offset.',
    values: [
      { value: 'static', note: 'Default: offsets and z-index ignored.' },
      { value: 'relative', note: 'Offset from its normal place; anchor for children.' },
      { value: 'absolute', note: 'Out of flow; placed against positioned ancestor.' },
      { value: 'fixed', note: 'Out of flow; placed against the viewport.' },
      { value: 'sticky', note: 'Sticks at its offset while scrolling.' },
    ],
    gotcha: 'A transform or filter on an ancestor becomes the containing block for fixed children.',
    related: ['top', 'inset', 'z-index'],
  },
  {
    property: 'top',
    group: 'Positioning',
    appliesTo: 'positioned elements',
    summary: 'Offset from the top edge of the containing block (right, bottom and left work the same).',
    details: 'Setting both top and bottom on an absolute element stretches it between them.',
    values: [
      { value: '0', note: 'Flush with the top.' },
      { value: '-6px', note: 'Hangs 6px above.' },
      { value: '50%', note: 'Half way down.' },
      { value: 'auto', note: 'Default.' },
    ],
    gotcha: 'No effect on position: static elements.',
    related: ['position', 'inset'],
  },
  {
    property: 'inset',
    group: 'Positioning',
    appliesTo: 'positioned elements',
    summary: 'Shorthand for top, right, bottom and left.',
    details: 'inset: 0 on an absolute child covers its positioned parent exactly: handy for overlays.',
    values: [
      { value: '0', note: 'Cover the containing block.' },
      { value: '12px', note: '12px in from every edge.' },
      { value: 'auto -6px -6px auto', note: 'Bottom-right corner, hanging out.' },
    ],
    related: ['top', 'position'],
  },
  {
    property: 'z-index',
    group: 'Positioning',
    appliesTo: 'positioned elements, flex and grid items',
    summary: 'Paint order within the current stacking context.',
    details:
      'Higher values paint on top, but only against siblings in the same stacking context. A parent that forms a context (opacity, transform, isolation, or position with a z-index) caps all its children.',
    values: [
      { value: '1', note: 'Above siblings at auto/0.' },
      { value: '10', note: 'Higher.' },
      { value: '-1', note: 'Below siblings, above the context background.' },
      { value: 'auto', note: 'Default: no new context.' },
    ],
    gotcha: 'z-index: 9999 cannot escape a parent stacking context. Fix the parent, not the number.',
    related: ['position', 'isolation'],
  },
  {
    property: 'isolation',
    group: 'Positioning',
    appliesTo: 'any element',
    summary: 'Creates a stacking context without any other side effect.',
    details:
      'Contains the z-index of everything inside, so a component\'s internal layers can never fight the rest of the page.',
    values: [
      { value: 'isolate', note: 'New stacking context.' },
      { value: 'auto', note: 'Default.' },
    ],
    related: ['z-index'],
  },
  // ---- Media --------------------------------------------------------------------------------
  {
    property: 'object-fit',
    group: 'Media',
    appliesTo: 'images and other replaced elements',
    summary: 'How an image fills a box with a different aspect ratio.',
    details: 'Like background-size, but for <img>. object-position chooses which part stays visible.',
    values: [
      { value: 'fill', note: 'Default: stretch, distorting.' },
      { value: 'cover', note: 'Fill the box, crop the rest.' },
      { value: 'contain', note: 'Fit inside, letterboxing.' },
      { value: 'none', note: 'Natural size, cropped.' },
    ],
    related: ['aspect-ratio', 'width'],
  },
  {
    property: 'float',
    group: 'Media',
    appliesTo: 'elements in normal flow',
    summary: 'Pushes a box to one side and lets text wrap around it.',
    details:
      'Floats are for wrapping text around images, not for page layout any more. They are ignored on flex and grid items.',
    values: [
      { value: 'left', note: 'Float to the left; text wraps on the right.' },
      { value: 'right', note: 'Float to the right.' },
      { value: 'none', note: 'Default.' },
    ],
    related: ['display', 'overflow'],
  },
]

export const DOCS_BY_PROPERTY: ReadonlyMap<string, DocEntry> = new Map(DOCS.map((d) => [d.property, d]))

/** Case-insensitive search over property, group and text; every word must match. */
export function searchDocs(query: string): DocEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return DOCS
  const scored = DOCS.map((doc) => {
    const prop = doc.property.toLowerCase()
    const hay = [prop, doc.group, doc.summary, doc.details, doc.appliesTo, ...doc.values.map((v) => v.value)]
      .join(' ')
      .toLowerCase()
    if (!words.every((w) => hay.includes(w))) return null
    const q = words.join(' ')
    const score = prop === q ? 0 : prop.startsWith(q) ? 1 : prop.includes(q) ? 2 : 3
    return { doc, score }
  }).filter((x): x is { doc: DocEntry; score: number } => x !== null)
  return scored.sort((a, b) => a.score - b.score).map((x) => x.doc)
}
