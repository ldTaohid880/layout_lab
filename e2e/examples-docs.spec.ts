import { expect, test, type Page } from '@playwright/test'

async function previewFrame(page: Page) {
  const handle = await page.getByTestId('preview-frame').elementHandle()
  const frame = await handle?.contentFrame()
  if (!frame) throw new Error('Preview frame not found')
  return frame
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('apply an example, see it in the preview, then undo', async ({ page }) => {
  await page.getByRole('tab', { name: 'Examples' }).click()
  await page.getByRole('button', { name: /Responsive card grid/ }).click()
  await page.getByRole('button', { name: 'Apply here' }).click()

  const frame = await previewFrame(page)
  await expect(frame.locator('.grid')).toHaveCSS('display', 'grid')
  await expect(frame.locator('.grid > .card')).toHaveCount(7)
  await expect(page.locator('.cm-content')).toContainText('auto-fill')

  await page.getByRole('button', { name: 'Undo' }).click()
  const restored = await previewFrame(page)
  await expect(restored.locator('.box')).toHaveCount(1)
  await expect(restored.locator('.grid')).toHaveCount(0)
  await expect(page.locator('.cm-content')).toContainText('.item')
})

test('concept chips open the docs entry', async ({ page }) => {
  await page.getByRole('tab', { name: 'Examples' }).click()
  await page.getByRole('button', { name: /z-index and stacking contexts/ }).click()
  await page.getByRole('button', { name: 'Open docs for isolation' }).click()
  await expect(page.getByRole('tab', { name: 'Docs' })).toHaveAttribute('data-state', 'active')
  await expect(page.getByRole('button', { name: /^isolation/ })).toHaveAttribute('aria-expanded', 'true')
})

test('docs Try writes the declaration to the selected element and the preview follows', async ({ page }) => {
  // Make .box a flex container first, then select it.
  await page.getByRole('treeitem', { name: 'div.box' }).click()
  await page.getByRole('tab', { name: 'Docs' }).click()
  await expect(page.getByTestId('try-target')).toContainText('.box')

  await page.getByRole('searchbox', { name: 'Search properties' }).fill('display')
  await page.getByRole('button', { name: 'Try display: flex' }).click()
  await page.getByRole('searchbox', { name: 'Search properties' }).fill('justify-content')
  await page.getByRole('button', { name: 'Try justify-content: space-between' }).click()

  const frame = await previewFrame(page)
  await expect(frame.locator('.box')).toHaveCSS('display', 'flex')
  await expect(frame.locator('.box')).toHaveCSS('justify-content', 'space-between')
  await expect(page.locator('.cm-content')).toContainText('justify-content: space-between')
})

test('layout hints explain a declaration that does nothing', async ({ page }) => {
  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\n.item { z-index: 5 ')
  await expect(page.locator('.cm-lintRange-info')).toHaveCount(1, { timeout: 3000 })
  await page.locator('.cm-lintRange-info').hover()
  await expect(page.locator('.cm-tooltip-lint')).toContainText('z-index only applies to positioned elements')
})
