import { el, repeat } from './instantiate'
import type { Challenge } from './types'

/*
 * Challenges: a starter tree and cosmetic CSS, a brief, hints, a solution, and the widths its
 * reference pictures are rendered at (see src/content/references.ts and npm run references).
 */

const BOX = `background: #fed7aa;
  border: 1px solid #f97316;
  border-radius: 6px;`

const solve = (starter: string, layout: string) => `${starter}
/* ---- Solution ---- */
${layout}`

const centerCss = `.stage {
  min-height: 320px;
  border: 2px dashed #a1a1aa;
}

.card {
  width: 160px;
  padding: 24px;
  ${BOX}
}
`

const toolbarCss = `.bar {
  padding: 12px 20px;
  background: #18181b;
  color: #fafafa;
}

.logo {
  font-weight: 700;
}

.links {
  margin: 0;
  padding: 0;
  list-style: none;
}

.cta {
  padding: 6px 12px;
  border: 0;
  border-radius: 4px;
  background: #f97316;
  color: #fff;
}
`

const columnsCss = `.cols {
  padding: 12px;
  border: 2px dashed #a1a1aa;
}

.col {
  padding: 16px;
  ${BOX}
}
`

const cardsCss = `.grid {
  padding: 12px;
  border: 2px dashed #a1a1aa;
}

.card {
  height: 80px;
  padding: 12px;
  ${BOX}
}
`

const sidebarCss = `.layout {
  min-height: 300px;
  border: 2px dashed #a1a1aa;
}

.sidebar {
  padding: 12px;
  background: #18181b;
  color: #fafafa;
}

.menu {
  margin: 0;
  padding-left: 16px;
}

.content {
  padding: 12px;
  ${BOX}
}
`

const footerCss = `body {
  margin: 0;
}

.header, .footer {
  padding: 12px 16px;
  background: #18181b;
  color: #fafafa;
}

.main {
  padding: 16px;
}
`

const badgeCss = `.avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 40px;
  border-radius: 12px;
  background: #3f3f46;
  color: #fafafa;
}

.badge {
  min-width: 22px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #f97316;
  color: #fff;
  font-size: 12px;
  text-align: center;
}
`

const stackingCss = `.scene {
  position: relative;
  height: 240px;
  margin: 16px;
}

.layer {
  position: absolute;
  width: 160px;
  height: 100px;
  padding: 8px;
  border: 1px solid #18181b;
  border-radius: 6px;
}

.a {
  top: 0;
  left: 0;
  z-index: 3;
  background: #fed7aa;
}

.group {
  position: relative;
  z-index: 1;
}

.b {
  top: 40px;
  left: 60px;
  z-index: 999;
  background: #bfdbfe;
}
`

const grailCss = `.page {
  min-height: 360px;
}

.header, .nav, .main, .aside, .footer {
  padding: 12px;
  ${BOX}
}
`

const mediaCss = `.media {
  display: flex;
  gap: 16px;
  padding: 12px;
  border: 2px dashed #a1a1aa;
}

.thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

.title {
  margin: 0 0 4px;
  font-weight: 600;
}

.text {
  margin: 0;
}
`

const dashboardCss = `body {
  margin: 0;
}

.topbar {
  padding: 14px 20px;
  background: #18181b;
  color: #fafafa;
  font-weight: 600;
}

.sidebar {
  padding: 16px;
  background: #27272a;
  color: #e4e4e7;
}

.menu {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu li {
  padding: 6px 0;
}

.board {
  padding: 16px;
  background: #f4f4f5;
}

.card {
  padding: 16px;
  ${BOX}
}

.card h2 {
  margin: 0 0 4px;
  font-size: 14px;
}

.card p {
  margin: 0;
  color: #52525b;
}
`

export const CHALLENGES: Challenge[] = [
  {
    id: 'center-the-card',
    title: 'Center the card',
    level: 'beginner',
    summary: 'Put the card dead centre in its stage, both ways.',
    brief: [
      'The card sits in the top-left corner of .stage. Move it to the exact centre, horizontally and vertically.',
    ],
    concepts: ['display', 'justify-content', 'align-items', 'place-items'],
    hints: [
      "Centering is the parent's job: style .stage, not .card.",
      'Make .stage a flex or grid container.',
      'display: flex with justify-content: center and align-items: center. Or display: grid with place-items: center.',
    ],
    items: [el('div', 'stage', [el('div', 'card', 'Center me')])],
    css: centerCss,
    solution: solve(
      centerCss,
      `.stage {
  display: grid;
  place-items: center;
}
`,
    ),
    solutionNotes:
      'place-items: center on a grid container centres the child in its cell on both axes. The flex version needs two properties: justify-content for the main axis and align-items for the cross axis.',
    viewports: [800],
  },
  {
    id: 'toolbar',
    title: 'Build a toolbar',
    level: 'beginner',
    summary: 'Logo, links and a button on one row, with the button pushed right.',
    brief: [
      'Lay the bar out on a single row: the logo on the left, then the links, and the Sign in button against the right edge.',
      'The three links sit side by side, 16px apart.',
    ],
    concepts: ['display', 'gap', 'margin', 'align-items'],
    hints: [
      'The bar and the list both need to lay their children out in a row.',
      'display: flex on .bar and on .links. gap spaces the links.',
      'margin-left: auto on .cta soaks up the free space and pushes it to the end.',
    ],
    items: [
      el('nav', 'bar', [
        el('span', 'logo', 'Brand'),
        el('ul', 'links', [el('li', 'link', 'Docs'), el('li', 'link', 'Pricing'), el('li', 'link', 'Blog')]),
        el('button', 'cta', 'Sign in'),
      ]),
    ],
    css: toolbarCss,
    solution: solve(
      toolbarCss,
      `.bar {
  display: flex;
  align-items: center;
  gap: 24px;
}

.links {
  display: flex;
  gap: 16px;
}

.cta {
  margin-left: auto;
}
`,
    ),
    solutionNotes:
      'Both the bar and the list are flex rows; flex layouts nest freely. An auto margin on a flex item takes all the free space on that side, so margin-left: auto pushes the button to the end.',
    viewports: [800],
  },
  {
    id: 'three-columns',
    title: 'Three equal columns',
    level: 'beginner',
    summary: 'Equal widths, whatever the content, filling the container.',
    brief: [
      'Put the three columns side by side, filling .cols from edge to edge, 16px apart.',
      'They must be exactly the same width even though their text differs.',
    ],
    concepts: ['grid-template-columns', 'flex', 'gap'],
    hints: [
      'Columns sized by their content will not be equal. You need the container to share the space out.',
      'With grid: three 1fr tracks. With flex: flex: 1 on each column.',
      'display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px on .cols.',
    ],
    items: [
      el('div', 'cols', [
        el('div', 'col', 'One'),
        el('div', 'col', 'Two has a little more text in it'),
        el('div', 'col', 'Three'),
      ]),
    ],
    css: columnsCss,
    solution: solve(
      columnsCss,
      `.cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
`,
    ),
    solutionNotes:
      '1fr tracks share the space left after gaps equally. The flex equivalent is flex: 1 (a flex-basis of 0), so content length does not affect the share.',
    viewports: [800],
  },
  {
    id: 'responsive-cards',
    title: 'Responsive card grid',
    level: 'intermediate',
    summary: 'Three columns on a laptop, one on a phone.',
    brief: [
      'At 800px wide the six cards form three equal columns. At 375px they stack in a single column.',
      'Cards are 12px apart in both directions.',
    ],
    concepts: ['grid-template-columns', 'gap'],
    hints: [
      'Test both sizes with the 375 and Fit presets above the preview.',
      'A media query works. So does repeat(auto-fill, minmax(…, 1fr)), with no media query at all.',
      'grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) fits three 220px+ columns at 800px and one at 375px.',
    ],
    items: [
      el(
        'div',
        'grid',
        repeat(6, (i) => el('div', 'card', `Card ${i + 1}`)),
      ),
    ],
    css: cardsCss,
    solution: solve(
      cardsCss,
      `.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
`,
    ),
    solutionNotes:
      'auto-fill makes as many columns as fit at their minimum (220px) and then stretches them equally with 1fr. At 800px three fit; at 375px only one does.',
    viewports: [800, 375],
  },
  {
    id: 'sidebar-layout',
    title: 'Sidebar layout',
    level: 'intermediate',
    summary: 'A 200px sidebar beside fluid content, stacking on phones.',
    brief: [
      'At 800px: a 200px sidebar on the left, the content filling the rest of the row, 16px between them, both the same height.',
      'At 375px the sidebar stacks above the content.',
    ],
    concepts: ['grid-template-columns', 'gap', 'flex'],
    hints: [
      'A fixed track and a flexible one: that is a two-column grid.',
      'grid-template-columns: 200px 1fr. Grid items stretch to the row height by default.',
      'For phones, a media query (max-width: 500px) that switches to a single 1fr column.',
    ],
    items: [
      el('div', 'layout', [
        el('section', 'sidebar', [
          el('ul', 'menu', [el('li', '', 'Overview'), el('li', '', 'Settings'), el('li', '', 'Billing')]),
        ]),
        el('main', 'content', 'The content area takes all the remaining width.'),
      ]),
    ],
    css: sidebarCss,
    solution: solve(
      sidebarCss,
      `.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
}

@media (max-width: 500px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
`,
    ),
    solutionNotes:
      'The fr unit shares out the space left after fixed tracks and gaps. Grid items stretch in their row by default, so both columns are as tall as the taller one.',
    viewports: [800, 375],
  },
  {
    id: 'sticky-footer',
    title: 'Footer at the bottom',
    level: 'intermediate',
    summary: 'Short page, footer still on the bottom edge of the window.',
    brief: [
      'The page has little content, so the footer floats halfway up. Keep the header at the top and the footer on the bottom edge of the window, with main filling the space between.',
    ],
    concepts: ['flex-direction', 'flex', 'min-height'],
    hints: [
      'The page needs to be at least as tall as the window.',
      'Make .page a flex column with min-height: 100vh.',
      'flex: 1 on .main makes it grow into the leftover height.',
    ],
    items: [
      el('div', 'page', [
        el('header', 'header', 'Header'),
        el('main', 'main', 'Not much content here.'),
        el('footer', 'footer', 'Footer'),
      ]),
    ],
    css: footerCss,
    solution: solve(
      footerCss,
      `.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main {
  flex: 1;
}
`,
    ),
    solutionNotes:
      'min-height: 100vh makes the page at least one window tall but lets it grow. In a flex column, flex: 1 on main gives it all the spare height, pushing the footer down.',
    viewports: [800],
  },
  {
    id: 'corner-badge',
    title: 'Badge on the corner',
    level: 'intermediate',
    summary: "Pin the badge so its centre sits on the avatar's top-right corner.",
    brief: [
      "Take the badge out of the avatar's flow and place it so its centre sits exactly on the avatar's top-right corner, whatever the badge's size.",
    ],
    concepts: ['position', 'top', 'inset'],
    hints: [
      'An absolutely positioned element is placed against its nearest positioned ancestor.',
      'position: relative on .avatar, position: absolute with top: 0 and right: 0 on .badge puts the badge in the corner.',
      'To centre it on the corner instead, shift it by half its own size: transform: translate(50%, -50%).',
    ],
    // Text and a child on one node, so built directly rather than with el().
    items: [{ tag: 'div', cls: 'avatar', text: 'AB', children: [el('span', 'badge', '3')] }],
    css: badgeCss,
    solution: solve(
      badgeCss,
      `.avatar {
  position: relative;
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
}
`,
    ),
    solutionNotes:
      "position: relative makes the avatar the containing block without moving it. top: 0; right: 0 lines the badge's corner up with the avatar's; translate(50%, -50%) moves it by half its own width and height, so its centre lands on the corner at any size.",
    viewports: [800],
  },
  {
    id: 'escape-the-stack',
    title: 'Bring B to the front',
    level: 'hard',
    summary: 'z-index: 999 loses to 3. Fix it without touching either number.',
    brief: [
      'B has z-index: 999 and A has z-index: 3, yet A is painted over B.',
      "Make B appear above A where they overlap, but keep A's and B's z-index values exactly as they are.",
    ],
    concepts: ['z-index', 'position', 'isolation'],
    hints: [
      'Select B and open the Layout tab: which stacking context does it paint in?',
      ".group creates a stacking context (position: relative with a z-index). Everything inside it, B included, is painted at the group's level: 1.",
      'Raise the group above A (z-index: 4), or stop it creating a context at all (z-index: auto).',
    ],
    items: [
      el('div', 'scene', [
        el('div', 'layer a', 'A · z-index 3'),
        el('div', 'group', [el('div', 'layer b', 'B · z-index 999')]),
      ]),
    ],
    css: stackingCss,
    solution: solve(
      stackingCss,
      `.group {
  z-index: auto; /* no stacking context: B now competes with A directly */
}
`,
    ),
    solutionNotes:
      "z-index only compares elements inside the same stacking context. .group (relative, z-index 1) formed a context painted at level 1, below A at 3, and B's 999 only counted inside it. Without the group's z-index there is no context, so B's 999 competes with A's 3 directly.",
    viewports: [800],
  },
  {
    id: 'holy-grail',
    title: 'Holy grail',
    level: 'hard',
    summary: 'Header, three columns, footer, and a phone layout that stacks.',
    brief: [
      'At 800px: header and footer span the full width; between them, a 160px nav on the left, a 160px aside on the right and main filling the middle.',
      'At 375px every section stacks in source order.',
    ],
    concepts: ['grid-template-areas', 'grid-area', 'grid-template-columns', 'grid-template-rows'],
    hints: [
      'This is one grid with three rows and three columns.',
      'grid-template-columns: 160px 1fr 160px, and grid-template-areas to draw the layout. Give each section a grid-area.',
      'For 375px, a media query that sets a single column and an areas list with one name per row.',
    ],
    items: [
      el('div', 'page', [
        el('header', 'header', 'Header'),
        el('nav', 'nav', 'Nav'),
        el('main', 'main', 'Main'),
        el('section', 'aside', 'Aside'),
        el('footer', 'footer', 'Footer'),
      ]),
    ],
    css: grailCss,
    solution: solve(
      grailCss,
      `.page {
  display: grid;
  grid-template-columns: 160px 1fr 160px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  gap: 8px;
}

.header { grid-area: header; }
.nav    { grid-area: nav; }
.main   { grid-area: main; }
.aside  { grid-area: aside; }
.footer { grid-area: footer; }

@media (max-width: 500px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-template-areas: "header" "nav" "main" "aside" "footer";
  }
}
`,
    ),
    solutionNotes:
      'Named areas draw the layout as a picture, and each section picks its spot with grid-area. The media query redraws the picture as one column; the HTML never changes.',
    viewports: [800, 375],
  },
  {
    id: 'unbreakable-text',
    title: 'Tame the long word',
    level: 'hard',
    summary: 'A long unbroken string blows the layout out on a phone. Contain it.',
    brief: [
      'At 375px the long identifier in the text pushes past the right edge of .media.',
      'Make everything fit inside .media at 375px, while the thumbnail stays 80px wide next to the text.',
    ],
    concepts: ['min-width', 'flex-shrink', 'overflow'],
    hints: [
      'Set the preview to 375px. Select .media and look at the overflow note in the Layout tab.',
      'Flex items will not shrink below their min-content width, and an unbroken word is very wide min-content.',
      'Allow the word to break with overflow-wrap: anywhere on .body (and min-width: 0 lets the item shrink).',
    ],
    items: [
      el('div', 'media', [
        el('img', 'thumb', undefined, { alt: '' }),
        el('div', 'body', [
          el('p', 'title', 'Build failed'),
          el(
            'p',
            'text',
            'Missing module averyveryverylongidentifier_without_any_break_opportunities_0123456789 in the bundle.',
          ),
        ]),
      ]),
    ],
    css: mediaCss,
    solution: solve(
      mediaCss,
      `.body {
  min-width: 0;
  overflow-wrap: anywhere;
}
`,
    ),
    solutionNotes:
      "A flex item's default min-width: auto is its min-content width, here the whole unbroken identifier. overflow-wrap: anywhere lets the word break (and shrinks its min-content); min-width: 0 is the general fix that lets the item shrink at all.",
    viewports: [375],
  },
  {
    id: 'dashboard-grid',
    title: 'Dashboard grid',
    level: 'hard',
    summary: 'Top bar, sidebar and a board of cards where some span two columns or rows.',
    brief: [
      'At 1024px wide: the top bar spans the full width. Under it, a 220px sidebar sits beside the board, and both reach the bottom of the page.',
      'The board is a grid of three equal columns with 16px between cards. The Revenue card spans two columns; the Activity card spans two rows.',
      'At 375px wide everything stacks in a single column.',
    ],
    concepts: ['grid-template-areas', 'grid-template-columns', 'grid-column', 'grid-row', 'grid-auto-rows', 'gap'],
    hints: [
      'Two grids, one inside the other: .dashboard frames the page (top bar, sidebar, board), and .board lays out the cards.',
      'A card covers more than one track with span: grid-column: span 2 on the wide card, grid-row: span 2 on the tall one.',
      'Rows need a height to span: grid-auto-rows: minmax(120px, auto) on .board. For phones, a media query that sets one column, and resets the spans (grid-column: auto; grid-row: auto).',
    ],
    items: [
      el('div', 'dashboard', [
        el('header', 'topbar', 'Dashboard'),
        el('aside', 'sidebar', [
          el('ul', 'menu', [
            el('li', '', 'Overview'),
            el('li', '', 'Reports'),
            el('li', '', 'Customers'),
            el('li', '', 'Settings'),
          ]),
        ]),
        el('main', 'board', [
          el('section', 'card card--wide', [el('h2', '', 'Revenue'), el('p', '', '$48,200 this month')]),
          el('section', 'card', [el('h2', '', 'Users'), el('p', '', '1,284 active')]),
          el('section', 'card', [el('h2', '', 'Orders'), el('p', '', '312 today')]),
          el('section', 'card card--tall', [el('h2', '', 'Activity'), el('p', '', 'Latest events')]),
          el('section', 'card', [el('h2', '', 'Errors'), el('p', '', '3 open')]),
          el('section', 'card', [el('h2', '', 'Uptime'), el('p', '', '99.98%')]),
        ]),
      ]),
    ],
    css: dashboardCss,
    solution: solve(
      dashboardCss,
      `.dashboard {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "topbar  topbar"
    "sidebar board";
  min-height: 100vh;
}

.topbar  { grid-area: topbar; }
.sidebar { grid-area: sidebar; }

.board {
  grid-area: board;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(120px, auto);
  align-content: start;
  gap: 16px;
}

.card--wide { grid-column: span 2; }
.card--tall { grid-row: span 2; }

@media (max-width: 600px) {
  .dashboard {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-template-areas: "topbar" "sidebar" "board";
  }

  .board {
    grid-template-columns: 1fr;
  }

  .card--wide { grid-column: auto; }
  .card--tall { grid-row: auto; }
}
`,
    ),
    solutionNotes:
      'The page is a two-column grid whose areas are drawn as a picture; the board is a second, independent grid for the cards. span 2 makes an item cover two tracks (the 16px gap between them is included in its size). The spanning cards would create extra implicit tracks on a phone, so the media query resets grid-column and grid-row as well as the column count.',
    viewports: [1024, 375],
  },
]

export const CHALLENGES_BY_ID: ReadonlyMap<string, Challenge> = new Map(CHALLENGES.map((c) => [c.id, c]))
