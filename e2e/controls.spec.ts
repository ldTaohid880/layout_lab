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

for (const width of [1440, 1100, 900, 800]) {
  test(`left tabs fit without clipping at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    const list = page.getByRole('tablist', { name: 'Left panel' })
    const box = await list.boundingBox()
    if (!box) throw new Error('no tab list')

    for (const name of ['Items', 'Examples', 'Docs', 'Challenges']) {
      const tab = list.getByRole('tab', { name })
      const t = await tab.boundingBox()
      if (!t) throw new Error(`no ${name} tab`)
      expect(t.x, `${name} left edge`).toBeGreaterThanOrEqual(box.x)
      expect(t.x + t.width, `${name} right edge`).toBeLessThanOrEqual(box.x + box.width)
    }
    // Every tab still works by name, whichever labels are shown.
    await list.getByRole('tab', { name: 'Challenges' }).click()
    await expect(page.getByTestId('challenge-list')).toBeVisible()
    await list.getByRole('tab', { name: 'Items' }).click()
    await expect(page.getByRole('tree', { name: 'Elements' })).toBeVisible()
  })
}

test('custom selects work with mouse and keyboard', async ({ page }) => {
  // Mouse: preview background.
  await page.getByRole('combobox', { name: 'Preview background' }).click()
  await page.getByRole('option', { name: 'Dark' }).click()
  const frame = await previewFrame(page)
  await expect(frame.locator('html')).toHaveAttribute('data-ll-bg', 'dark')

  // Keyboard: tag for new elements, then add it.
  const picker = page.getByRole('combobox', { name: 'Tag for new elements' })
  await picker.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('option', { name: /^<section>/ })).toBeVisible()
  await page.getByRole('option', { name: /^<section>/ }).press('Enter')
  await expect(picker).toHaveText('<section>')
  await page.getByRole('treeitem', { name: 'div.box' }).click()
  await page.getByRole('button', { name: 'Add child' }).click()
  await expect(page.getByRole('treeitem', { name: 'section' })).toHaveAttribute('aria-selected', 'true')

  // Inspector tag select disables void tags while the element has children.
  await page.getByRole('treeitem', { name: 'div.box' }).click()
  await page.getByLabel('Tag', { exact: true }).click()
  await expect(page.getByRole('option', { name: 'img' })).toHaveAttribute('aria-disabled', 'true')
  await page.keyboard.press('Escape')
})

test('docs search has its own clear button and Escape clears it', async ({ page }) => {
  await page.getByRole('tab', { name: 'Docs' }).click()
  const search = page.getByRole('searchbox', { name: 'Search properties' })
  await search.fill('gap')
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(search).toHaveValue('')
  await expect(search).toBeFocused()
  await search.fill('flex')
  await search.press('Escape')
  await expect(search).toHaveValue('')
})

test('keyboard help disclosure toggles', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Keyboard' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByText('edit class names')).toBeHidden()
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('edit class names')).toBeVisible()
})
