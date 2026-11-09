import { expect, test } from '@playwright/test'

/*
 * LL-011: every studio view has a URL. Deep links open the right view, refreshing restores it, and
 * browser back/forward step through tab and content changes.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('a deep link to a lesson opens the Examples tab with that lesson expanded', async ({ page }) => {
  await page.goto('/learn/badge')
  await expect(page.getByRole('tab', { name: 'Examples' })).toHaveAttribute('data-state', 'active')
  const lesson = page.getByRole('button', { name: /Notification badge/ })
  await expect(lesson).toHaveAttribute('aria-expanded', 'true')
  await expect(lesson).toBeInViewport()
  await expect(page).toHaveURL(/\/learn\/badge$/)

  await page.reload()
  await expect(page.getByRole('button', { name: /Notification badge/ })).toHaveAttribute('aria-expanded', 'true')
})

test('a deep link to a challenge shows that challenge', async ({ page }) => {
  await page.goto('/challenges/center-the-card')
  await expect(page.getByRole('tab', { name: 'Challenges' })).toHaveAttribute('data-state', 'active')
  await expect(page.getByRole('heading', { name: 'Center the card' })).toBeVisible()
  await expect(page).toHaveURL(/\/challenges\/center-the-card$/)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Center the card' })).toBeVisible()
})

test('the URL follows tabs and content, and back/forward restore them', async ({ page }) => {
  await expect(page).toHaveURL(/\/play\/[^/?]+$/)
  const sandboxUrl = page.url()

  await page.getByRole('tab', { name: 'Docs' }).click()
  await expect(page).toHaveURL(/\/play\/[^/?]+\?tab=docs$/)

  await page.getByRole('tab', { name: 'Challenges' }).click()
  await page.getByRole('button', { name: /Center the card/ }).click()
  await expect(page).toHaveURL(/\/challenges\/center-the-card$/)

  await page.goBack()
  await expect(page).toHaveURL(/\?tab=challenges$/)
  await expect(page.getByTestId('challenge-list')).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\?tab=docs$/)
  await expect(page.getByRole('tab', { name: 'Docs' })).toHaveAttribute('data-state', 'active')

  await page.goBack()
  await expect(page).toHaveURL(sandboxUrl)
  await expect(page.getByRole('tab', { name: 'Items' })).toHaveAttribute('data-state', 'active')

  await page.goForward()
  await expect(page.getByRole('tab', { name: 'Docs' })).toHaveAttribute('data-state', 'active')
})

test('unknown ids fall back to the current view, and other paths show a page', async ({ page }) => {
  await page.goto('/challenges/no-such-challenge')
  await expect(page).toHaveURL(/\/play\/[^/?]+$/)

  await page.goto('/design/some-file')
  await expect(page.getByRole('heading', { name: 'Design files are coming' })).toBeVisible()

  await page.goto('/no/such/page')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to the studio' }).click()
  await expect(page).toHaveURL(/\/play\/[^/?]+$/)
})
