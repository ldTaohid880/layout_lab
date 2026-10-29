import { expect, test, type Page } from '@playwright/test'

async function previewFrame(page: Page) {
  const handle = await page.getByTestId('preview-frame').elementHandle()
  const frame = await handle?.contentFrame()
  if (!frame) throw new Error('Preview frame not found')
  return frame
}

async function appendCss(page: Page, css: string) {
  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(`\n${css}`)
}

async function applyExample(page: Page, title: RegExp) {
  await page.getByRole('tab', { name: 'Examples' }).click()
  await page.getByRole('button', { name: title }).click()
  await page.getByRole('button', { name: 'Apply here' }).click()
  await page.getByRole('tab', { name: 'Items' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('selecting a flex container draws its items, gaps and box model', async ({ page }) => {
  await appendCss(page, '.box { display: flex; gap: 12px }')
  await page.getByRole('treeitem', { name: 'div.box' }).click()
  const frame = await previewFrame(page)

  // Playwright locators pierce the overlay's open shadow root.
  await expect(frame.locator('ll-overlay .flex-item')).toHaveCount(3)
  await expect(frame.locator('ll-overlay .flex-gap')).toHaveCount(2)
  await expect(frame.locator('ll-overlay .axis-chip')).toHaveCount(2)
  await expect(frame.locator('ll-overlay .ring')).toHaveCount(3)
  await expect(frame.locator('ll-overlay .chip:not(.axis-chip)')).toContainText('div.box')

  // Turning the toggles off removes them.
  await page.getByRole('button', { name: 'Flex and grid overlay' }).click()
  await page.getByRole('button', { name: 'Box model' }).click()
  await expect(frame.locator('ll-overlay .flex-item')).toHaveCount(0)
  await expect(frame.locator('ll-overlay .ring')).toHaveCount(0)
  await expect(frame.locator('ll-overlay .sel')).toHaveCount(1)
})

test('grid overlay shows lines, numbers and track sizes; Layout tab reports the tracks', async ({ page }) => {
  await applyExample(page, /Holy grail with grid areas/)
  await page.getByRole('treeitem', { name: 'div.page' }).click()
  const frame = await previewFrame(page)

  await expect(frame.locator('ll-overlay .grid-box')).toHaveCount(1)
  await expect(frame.locator('ll-overlay .grid-area')).toHaveCount(5)
  await expect(frame.locator('ll-overlay .grid-area', { hasText: 'header' })).toHaveCount(1)
  await expect(frame.locator('ll-overlay .num', { hasText: /^4$/ })).toHaveCount(2) // column line 4 and row line 4
  await expect(frame.locator('ll-overlay .size', { hasText: '140px' })).toHaveCount(2)

  await page.getByRole('tab', { name: 'Layout' }).click()
  const report = page.getByTestId('layout-report')
  await expect(report).toContainText('Grid container · 3 × 3')
  await expect(report).toContainText('"header header header"')

  // A grid item reports where it was placed.
  await page.getByRole('treeitem', { name: /^main\.main/ }).click()
  await expect(report).toContainText('As a grid item')
  await expect(report).toContainText('grid-column2 / 3')
  await expect(report).toContainText('grid-areamain')
})

test('inspect mode picks elements in the preview and syncs hover', async ({ page }) => {
  await page.getByRole('button', { name: 'Inspect' }).click()
  const frame = await previewFrame(page)
  const item = await frame.locator('.item').nth(1).boundingBox()
  if (!item) throw new Error('no box')

  await page.mouse.move(item.x + item.width / 2, item.y + item.height / 2)
  await expect(frame.locator('ll-overlay .hover-chip')).toContainText('div.item')

  await page.mouse.click(item.x + item.width / 2, item.y + item.height / 2)
  await expect(page.getByRole('treeitem', { name: 'div.item, text “2”' })).toHaveAttribute('aria-selected', 'true')

  // Escape leaves inspect mode.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Inspect' })).toHaveAttribute('aria-pressed', 'false')
})

test('Layout tab explains stacking contexts', async ({ page }) => {
  await applyExample(page, /z-index and stacking contexts/)
  await page.getByRole('treeitem', { name: /div\.layer\.b/ }).click()
  await page.getByRole('tab', { name: 'Layout' }).click()
  const report = page.getByTestId('layout-report')

  await expect(report).toContainText('position: absolute with z-index: 999')
  await expect(report).toContainText('Paints inside the stacking context of div.group')
  await expect(report).toContainText('Offsets (top, left…) are measured from div.group')

  await report.getByRole('button', { name: 'div.group' }).first().click()
  await expect(page.getByRole('treeitem', { name: 'div.group' })).toHaveAttribute('aria-selected', 'true')
  await expect(report).toContainText('isolation: isolate')
})

test('user CSS cannot hide or restyle the overlay', async ({ page }) => {
  await appendCss(
    page,
    '.box { display: flex } * { opacity: 0.2 !important; visibility: hidden !important } ll-overlay, :root > :last-child { display: none !important; transform: scale(0) !important; position: static !important }',
  )
  await page.getByRole('treeitem', { name: 'div.box' }).click()
  const frame = await previewFrame(page)
  await expect(frame.locator('ll-overlay .flex-item').first()).toBeVisible()
  const hostStyle = await frame.locator('ll-overlay').evaluate((el) => {
    const cs = getComputedStyle(el)
    return [cs.opacity, cs.visibility, cs.transform, cs.position].join(' ')
  })
  expect(hostStyle).toBe('1 visible none fixed')
})

test('flex and grid axis arrows follow the CSS, and the Layout tab spells them out', async ({ page }) => {
  await appendCss(page, '.box { display: flex }')
  await page.getByRole('treeitem', { name: 'div.box' }).click()
  const frame = await previewFrame(page)
  const main = frame.locator('ll-overlay .axis-line[data-axis="main"]')
  const cross = frame.locator('ll-overlay .axis-line[data-axis="cross"]')

  const axes = async (main_: string, cross_: string) => {
    await expect(main).toHaveAttribute('data-dir', main_)
    await expect(cross).toHaveAttribute('data-dir', cross_)
  }

  await axes('right', 'down')
  await expect(frame.locator('ll-overlay .axis-chip[data-axis="main"]')).toHaveText('main axis · justify-content')
  await expect(frame.locator('ll-overlay .axis-chip[data-axis="cross"]')).toHaveText('cross axis · align-items')

  await appendCss(page, '.box { flex-direction: column }')
  await axes('down', 'right')
  await appendCss(page, '.box { flex-direction: row-reverse }')
  await axes('left', 'down')
  await appendCss(page, '.box { flex-wrap: wrap-reverse }')
  await axes('left', 'up')
  await expect(frame.locator('ll-overlay .axis-chip[data-axis="cross"]')).toHaveText(
    'cross axis · align-items, align-content',
  )

  // The Layout tab says the same in words.
  await page.getByRole('tab', { name: 'Layout' }).click()
  const spelled = page.getByTestId('axes')
  await expect(spelled).toContainText('Main axis')
  await expect(spelled).toContainText('right to left')
  await expect(spelled).toContainText('Cross axis')
  await expect(spelled).toContainText('bottom to top')

  // Grid: inline and block axes, mirrored by direction: rtl.
  await appendCss(page, '.box { display: grid; flex-wrap: nowrap }')
  const inline = frame.locator('ll-overlay .axis-line[data-axis="inline"]')
  const block = frame.locator('ll-overlay .axis-line[data-axis="block"]')
  await expect(inline).toHaveAttribute('data-dir', 'right')
  await expect(block).toHaveAttribute('data-dir', 'down')
  await expect(spelled).toContainText('Inline axis')
  await expect(spelled).toContainText('left to right')
  await appendCss(page, '.box { direction: rtl }')
  await expect(inline).toHaveAttribute('data-dir', 'left')
  await expect(spelled).toContainText('right to left')

  // The arrows belong to the Flex & grid toggle.
  await page.getByRole('button', { name: 'Flex and grid overlay' }).click()
  await expect(frame.locator('ll-overlay .axis-line')).toHaveCount(0)
})

test('axis labels sit on their lines, and the Layout tab can hide the arrows', async ({ page }) => {
  await appendCss(page, '.box { display: flex; height: 200px }')
  await page.getByRole('treeitem', { name: 'div.box' }).click()
  const frame = await previewFrame(page)

  // Each caption is centred on its own line, so the line runs through the label.
  const centre = async (sel: string, axis: 'x' | 'y') => {
    const box = await frame.locator(sel).boundingBox()
    if (!box) throw new Error(`${sel} not found`)
    return axis === 'x' ? box.x + box.width / 2 : box.y + box.height / 2
  }
  const lineY = await centre('ll-overlay .axis-line[data-axis="main"]', 'y')
  const chipY = await centre('ll-overlay .axis-chip[data-axis="main"]', 'y')
  expect(Math.abs(lineY - chipY)).toBeLessThan(3)
  const lineX = await centre('ll-overlay .axis-line[data-axis="cross"]', 'x')
  const chipX = await centre('ll-overlay .axis-chip[data-axis="cross"]', 'x')
  expect(Math.abs(lineX - chipX)).toBeLessThan(3)

  await page.getByRole('tab', { name: 'Layout' }).click()
  const toggle = page.getByTestId('axes-toggle')
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await expect(frame.locator('ll-overlay .axis-line')).toHaveCount(0)
  // The rest of the flex overlay stays.
  await expect(frame.locator('ll-overlay .flex-item')).toHaveCount(3)
  await toggle.click()
  await expect(frame.locator('ll-overlay .axis-line')).toHaveCount(2)
})
