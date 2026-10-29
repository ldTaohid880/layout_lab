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

test('add item, write CSS, see the preview change live, and keep it after reload', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  page.on('pageerror', (err) => errors.push(err.message))

  // Add an element inside .box via the toolbar and give it a class with the inline editor.
  await page
    .getByRole('treeitem')
    .filter({ hasText: /^div\.box$/ })
    .click()
  await page.getByRole('button', { name: 'Add child' }).click()
  await page.keyboard.press('Enter')
  await page.getByRole('textbox', { name: /Class names for div/ }).fill('item extra')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('treeitem', { name: /div\.item\.extra/ })).toHaveAttribute('aria-selected', 'true')

  const frame = await previewFrame(page)
  await expect(frame.locator('.box > .extra')).toHaveCount(1)
  await expect(frame.locator('.box')).toHaveCSS('display', 'block')

  // Mark the frame's window: if CSS edits reloaded the iframe, the marker would disappear.
  await frame.evaluate(() => Object.assign(window, { __llMarker: 42 }))

  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+End')
  const typedAt = Date.now()
  await page.keyboard.type('\n.box { display:flex; gap:12px }')

  await expect(frame.locator('.box')).toHaveCSS('display', 'flex', { timeout: 2000 })
  const elapsed = Date.now() - typedAt
  await expect(frame.locator('.box')).toHaveCSS('column-gap', '12px')
  expect(await frame.evaluate(() => (window as unknown as { __llMarker?: number }).__llMarker)).toBe(42)
  // Typing itself takes time; the debounce + postMessage round trip must stay small on top of it.
  expect(elapsed).toBeLessThan(2000)

  // Reload keeps the work.
  await page.waitForTimeout(300)
  await page.reload()
  const reloaded = await previewFrame(page)
  await expect(reloaded.locator('.box')).toHaveCSS('display', 'flex')
  await expect(page.getByRole('treeitem', { name: /div\.item\.extra/ })).toBeVisible()

  expect(errors).toEqual([])
})

test('CSS edits apply within ~200ms of the last keystroke', async ({ page }) => {
  const frame = await previewFrame(page)
  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\n.box { display:gri')
  await page.waitForTimeout(400)

  // Timestamps are taken inside the pages (same wall clock), not by polling from the test.
  await frame.evaluate(() => {
    const style = document.getElementById('ll-user-css')!
    new MutationObserver(() => {
      if (style.textContent?.includes('display:grid')) Object.assign(window, { __appliedAt: Date.now() })
    }).observe(style, { childList: true, characterData: true, subtree: true })
  })
  await page.evaluate(() =>
    window.addEventListener('keydown', () => Object.assign(window, { __keyAt: Date.now() }), { capture: true }),
  )
  await page.keyboard.type('d')
  await expect(frame.locator('.box')).toHaveCSS('display', 'grid')

  const keyAt = await page.evaluate(() => (window as unknown as { __keyAt: number }).__keyAt)
  const appliedAt = await frame.evaluate(() => (window as unknown as { __appliedAt: number }).__appliedAt)
  const latency = appliedAt - keyAt
  console.log(`keystroke → preview style updated: ${latency}ms`)
  expect(latency).toBeGreaterThanOrEqual(140) // debounced, not per keystroke
  expect(latency).toBeLessThan(220)
})

test('preview width presets resize the simulated viewport', async ({ page }) => {
  await page.getByRole('button', { name: '768', exact: true }).click()
  const frame = await previewFrame(page)
  expect(await frame.evaluate(() => window.innerWidth)).toBe(768)
  await expect(page.getByTestId('preview-width')).toContainText('768')
})

test('user CSS never leaks into the app UI', async ({ page }) => {
  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\nbody, * { background: red !important; display: none !important; }')
  await page.waitForTimeout(400)
  await expect(page.getByRole('tree', { name: 'Elements' })).toBeVisible()
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(bg).not.toBe('rgb(255, 0, 0)')
})

test('a selected element can be deselected: click it again, click empty space, or press Escape', async ({ page }) => {
  const row = page.getByRole('treeitem', { name: 'div.box' })
  await row.click()
  await expect(row).toHaveAttribute('aria-selected', 'true')
  await row.click()
  await expect(row).toHaveAttribute('aria-selected', 'false')

  await row.click()
  await expect(row).toHaveAttribute('aria-selected', 'true')
  await page.getByTestId('tree-scroll').click({ position: { x: 100, y: 330 } })
  await expect(row).toHaveAttribute('aria-selected', 'false')

  await row.click()
  await row.press('Escape')
  await expect(row).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByText('Select an element in the tree')).toBeVisible()
})
