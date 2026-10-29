import { expect, test, type Page } from '@playwright/test'

const tablist = (page: Page) => page.getByRole('tablist', { name: 'Sandboxes' })
const tab = (page: Page, name: string | RegExp) => tablist(page).getByRole('tab', { name })
const names = (page: Page) => tablist(page).getByRole('tab').allInnerTexts()
const addTab = (page: Page) => page.getByRole('button', { name: 'New sandbox' }).click()

async function typeCss(page: Page, css: string) {
  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.insertText(css)
  await page.waitForTimeout(300) // CSS commits after a short debounce
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('starts with one selected tab; + adds tabs and switches between independent sandboxes', async ({ page }) => {
  expect(await names(page)).toEqual(['Sandbox 1'])
  await expect(tab(page, 'Sandbox 1')).toHaveAttribute('aria-selected', 'true')

  await addTab(page)
  await expect(tab(page, 'Sandbox 2')).toHaveAttribute('aria-selected', 'true')
  await expect(tab(page, 'Sandbox 1')).toHaveAttribute('aria-selected', 'false')
  await typeCss(page, '\n.only-in-two { color: red }')

  await tab(page, 'Sandbox 1').click()
  await expect(tab(page, 'Sandbox 1')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.cm-content')).not.toContainText('only-in-two')
  await tab(page, 'Sandbox 2').click()
  await expect(page.locator('.cm-content')).toContainText('only-in-two')
})

test('double-click or F2 renames a tab; Escape cancels', async ({ page }) => {
  await tab(page, 'Sandbox 1').dblclick()
  const input = page.getByRole('textbox', { name: 'Sandbox name' })
  await expect(input).toBeFocused()
  await input.fill('Grid practice')
  await input.press('Enter')
  expect(await names(page)).toEqual(['Grid practice'])

  await tab(page, 'Grid practice').focus()
  await page.keyboard.press('F2')
  await page.getByRole('textbox', { name: 'Sandbox name' }).fill('Ignored')
  await page.keyboard.press('Escape')
  expect(await names(page)).toEqual(['Grid practice'])
  await expect(tab(page, 'Grid practice')).toBeFocused()
})

test('closing an untouched tab is instant; an edited one asks first and then deletes it', async ({ page }) => {
  await addTab(page)
  await page.getByRole('button', { name: 'Close Sandbox 2' }).click()
  expect(await names(page)).toEqual(['Sandbox 1'])
  await expect(page.getByRole('alertdialog')).toHaveCount(0)

  await addTab(page)
  await typeCss(page, '\n.work { color: blue }')
  await page.getByRole('button', { name: 'Close Sandbox 2' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('cannot be undone')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  expect(await names(page)).toEqual(['Sandbox 1', 'Sandbox 2'])

  await page.getByRole('button', { name: 'Close Sandbox 2' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Close and delete' }).click()
  expect(await names(page)).toEqual(['Sandbox 1'])
  await expect(tab(page, 'Sandbox 1')).toHaveAttribute('aria-selected', 'true')
})

test('closing the last tab leaves a fresh sandbox, never zero', async ({ page }) => {
  await page.getByRole('button', { name: 'Close Sandbox 1' }).click()
  expect(await names(page)).toEqual(['Sandbox 1'])
  await expect(page.getByRole('tree', { name: 'Elements' })).toBeVisible()
})

test('middle-click closes a tab', async ({ page }) => {
  await addTab(page)
  await tab(page, 'Sandbox 2').click({ button: 'middle' })
  expect(await names(page)).toEqual(['Sandbox 1'])
})

test('right-click menu: duplicate, rename and close', async ({ page }) => {
  await typeCss(page, '\n.copy-me { color: green }')

  await tab(page, 'Sandbox 1').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Duplicate' }).click()
  expect(await names(page)).toEqual(['Sandbox 1', 'Sandbox 1 copy'])
  await expect(tab(page, 'Sandbox 1 copy')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.cm-content')).toContainText('copy-me')

  await tab(page, 'Sandbox 1 copy').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Rename' }).click()
  await page.getByRole('textbox', { name: 'Sandbox name' }).fill('Copy')
  await page.keyboard.press('Enter')
  expect(await names(page)).toEqual(['Sandbox 1', 'Copy'])

  await tab(page, 'Copy').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Close tab' }).click()
  // A fresh duplicate counts as untouched (its work also lives in the original), so no prompt.
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  expect(await names(page)).toEqual(['Sandbox 1'])
})

test('keyboard: arrows move focus, Enter switches, Delete closes', async ({ page }) => {
  await addTab(page)
  await addTab(page)
  await tab(page, 'Sandbox 3').focus()

  await page.keyboard.press('ArrowLeft')
  await expect(tab(page, 'Sandbox 2')).toBeFocused()
  await page.keyboard.press('Home')
  await expect(tab(page, 'Sandbox 1')).toBeFocused()
  await page.keyboard.press('ArrowLeft') // wraps around
  await expect(tab(page, 'Sandbox 3')).toBeFocused()
  await page.keyboard.press('End')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Enter')
  await expect(tab(page, 'Sandbox 2')).toHaveAttribute('aria-selected', 'true')

  await page.keyboard.press('Delete') // untouched: closes at once
  expect(await names(page)).toEqual(['Sandbox 1', 'Sandbox 3'])
  await expect(tab(page, 'Sandbox 3')).toHaveAttribute('aria-selected', 'true')
})

test('dragging a tab reorders it, and the order survives a reload', async ({ page }) => {
  await addTab(page)
  await addTab(page)
  expect(await names(page)).toEqual(['Sandbox 1', 'Sandbox 2', 'Sandbox 3'])

  const from = await tab(page, 'Sandbox 1').boundingBox()
  const to = await tab(page, 'Sandbox 3').boundingBox()
  if (!from || !to) throw new Error('tabs not laid out')
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 })
  await page.mouse.up()
  await expect.poll(() => names(page)).toEqual(['Sandbox 2', 'Sandbox 3', 'Sandbox 1'])

  await page.waitForTimeout(200)
  await page.reload()
  expect(await names(page)).toEqual(['Sandbox 2', 'Sandbox 3', 'Sandbox 1'])
})

test('challenge sandboxes show a trophy and follow the Challenges panel', async ({ page }) => {
  await page.getByRole('tab', { name: 'Challenges' }).click()
  await page
    .getByTestId('challenge-list')
    .getByRole('button', { name: /Center the card/ })
    .click()
  await page.getByRole('button', { name: 'Start challenge' }).click()

  const challengeTab = tab(page, /Challenge: Center the card/)
  await expect(challengeTab.locator('svg.lucide-trophy')).toBeVisible()
  await expect(tab(page, 'Sandbox 1').locator('svg.lucide-trophy')).toHaveCount(0)

  // Switching to the plain sandbox and back: the challenge view follows the active tab.
  await tab(page, 'Sandbox 1').click()
  await expect(page.getByTestId('active-challenge').getByRole('button', { name: 'Continue' })).toBeVisible()
  await challengeTab.click()
  await expect(page.getByTestId('active-challenge').getByTestId('in-progress')).toBeVisible()
})

test('many tabs scroll inside the strip while + stays visible', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  for (let i = 0; i < 12; i++) await addTab(page)
  const strip = await tablist(page).boundingBox()
  const plus = await page.getByRole('button', { name: 'New sandbox' }).boundingBox()
  if (!strip || !plus) throw new Error('not laid out')
  expect(plus.x).toBeGreaterThanOrEqual(strip.x + strip.width - 1) // sits after the strip, never inside it
  expect(plus.x + plus.width).toBeLessThanOrEqual(900)

  // The active (last) tab was scrolled into view.
  const active = await tab(page, 'Sandbox 13').boundingBox()
  if (!active) throw new Error('active tab missing')
  expect(active.x + active.width).toBeLessThanOrEqual(strip.x + strip.width + 1)
  expect(active.x).toBeGreaterThanOrEqual(strip.x - 1)
})

test('Reset lives in the tab menu: it asks, then restores that sandbox to the starter', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Reset', exact: true })).toHaveCount(0)
  await typeCss(page, '\n.page { outline: 3px solid red }\n')
  await addTab(page)
  await expect(tab(page, /Sandbox 2/)).toHaveAttribute('aria-selected', 'true')

  // Resetting a tab that is not active switches to it.
  await tab(page, /Sandbox 1/).click({ button: 'right' })
  await page.getByRole('menuitem', { name: /Reset sandbox/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(page.locator('.cm-content')).not.toContainText('outline: 3px solid red')
  await tab(page, /Sandbox 1/).click()
  await expect(page.locator('.cm-content')).toContainText('outline: 3px solid red')

  await tab(page, /Sandbox 1/).click({ button: 'right' })
  await page.getByRole('menuitem', { name: /Reset sandbox/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset sandbox' }).click()
  await expect(page.locator('.cm-content')).not.toContainText('outline: 3px solid red')
})
