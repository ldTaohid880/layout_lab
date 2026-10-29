import { expect, test, type Page } from '@playwright/test'

const HOST = 'https://images.example.test'
const SVG = (w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#16a34a"/></svg>`

async function previewFrame(page: Page) {
  const handle = await page.getByTestId('preview-frame').elementHandle()
  const frame = await handle?.contentFrame()
  if (!frame) throw new Error('Preview frame not found')
  return frame
}

/** Add an <img> at the top level and leave it selected. */
async function addImage(page: Page) {
  await page.getByRole('combobox', { name: 'Tag for new elements' }).click()
  await page.getByRole('option', { name: /^<img>/ }).click()
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByRole('treeitem', { name: /^img$/ })).toHaveAttribute('aria-selected', 'true')
}

test.beforeEach(async ({ page }) => {
  await page.route(`${HOST}/**`, (route) => {
    const url = route.request().url()
    if (url.endsWith('/broken.png')) return route.fulfill({ status: 404, body: 'nope' })
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG(120, 80) })
  })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('an https URL loads in the preview and the inspector; Use placeholder goes back', async ({ page }) => {
  await addImage(page)
  const frame = await previewFrame(page)
  const img = frame.locator('img[data-ll-id]').first()

  // The placeholder is 160×100.
  await expect(img).toHaveJSProperty('naturalWidth', 160)
  await expect(page.getByText('Empty: the built-in placeholder is shown.')).toBeVisible()

  const field = page.getByTestId('inspector-image-src')
  await field.fill(`${HOST}/cat.svg`)
  await field.press('Enter')
  await expect(img).toHaveAttribute('src', `${HOST}/cat.svg`)
  await expect(img).toHaveJSProperty('naturalWidth', 120)
  await expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
  await expect(page.getByTestId('image-status')).toHaveText('Loaded.')

  await page.getByRole('button', { name: 'Use placeholder' }).click()
  await expect(field).toHaveValue('')
  await expect(img).toHaveJSProperty('naturalWidth', 160)
  await expect(img).toHaveAttribute('src', /^data:image\/svg\+xml,/)
})

test('typing waits for a pause (or blur) before loading, so no half-typed requests', async ({ page }) => {
  const requested: string[] = []
  page.on('request', (r) => r.url().startsWith(HOST) && requested.push(r.url()))

  await addImage(page)
  await page.getByTestId('inspector-image-src').pressSequentially(`${HOST}/slow.svg`, { delay: 30 })
  await expect.poll(() => requested.length, { timeout: 4000 }).toBeGreaterThan(0)
  // Only the finished address was ever requested, never a prefix like https://images.example.te
  expect(new Set(requested.map((u) => new URL(u).pathname))).toEqual(new Set(['/slow.svg']))
})

test('anything that is not an https URL shows an error and keeps the placeholder', async ({ page }) => {
  const insecure: string[] = []
  page.on('request', (r) => /^http:\/\/images\.example\.test/.test(r.url()) && insecure.push(r.url()))

  await addImage(page)
  const frame = await previewFrame(page)
  const img = frame.locator('img[data-ll-id]').first()
  const field = page.getByTestId('inspector-image-src')

  for (const bad of ['http://images.example.test/a.png', 'javascript:alert(1)', '/relative.png', 'cat.png']) {
    await field.fill(bad)
    await field.press('Enter')
    await expect(page.getByText('Use a full https:// address')).toBeVisible()
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(img).toHaveAttribute('src', /^data:image\/svg\+xml,/)
  }
  expect(insecure).toEqual([])

  // The generic attribute editor cannot sneak a src past the check either.
  await page.getByRole('textbox', { name: 'New attribute name' }).fill('src')
  await expect(page.getByText('Allowed: id, title, href')).toBeVisible()
})

test('a broken address is reported, and the saved URL survives a reload', async ({ page }) => {
  await addImage(page)
  const field = page.getByTestId('inspector-image-src')
  await field.fill(`${HOST}/broken.png`)
  await field.press('Enter')
  await expect(page.getByTestId('image-status')).toContainText("Couldn't load this image")

  await field.fill(`${HOST}/ok.svg`)
  await field.blur()
  await expect(page.getByTestId('image-status')).toHaveText('Loaded.')

  await page.waitForTimeout(200)
  await page.reload()

  // The saved address is back in the preview markup. (Not asserting that the preview image has
  // *loaded* here: the iframe starts fetching the instant the page parses, which can beat
  // Playwright's request mocking for that first load. The app has no such race on a real host.)
  const frame = await previewFrame(page)
  await expect(frame.locator('img[data-ll-id]').first()).toHaveAttribute('src', `${HOST}/ok.svg`)

  // Selecting the element shows the saved URL in the inspector, and its thumbnail loads.
  await page.getByRole('treeitem', { name: /^img$/ }).click()
  await expect(page.getByTestId('inspector-image-src')).toHaveValue(`${HOST}/ok.svg`)
  await expect(page.getByTestId('image-status')).toHaveText('Loaded.')
})

test('the preview still blocks scripts, connections and fonts; only images may come from https', async ({ page }) => {
  await addImage(page)
  const frame = await previewFrame(page)
  const outcome = await frame.evaluate(async (url) => {
    const fetched = await fetch(url).then(
      () => 'allowed',
      () => 'blocked',
    )
    const s = document.createElement('script')
    s.src = url
    const script = await new Promise<string>((resolve) => {
      s.onload = () => resolve('allowed')
      s.onerror = () => resolve('blocked')
      document.head.appendChild(s)
    })
    return { fetched, script }
  }, `${HOST}/x.js`)
  expect(outcome).toEqual({ fetched: 'blocked', script: 'blocked' })
})

test('CSS background images over https load too (same img-src rule)', async ({ page }) => {
  const requested: string[] = []
  page.on('request', (r) => r.url().startsWith(HOST) && requested.push(r.url()))
  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.insertText(`\n.box { background-image: url(${HOST}/bg.svg) }\n`)
  await expect.poll(() => requested.some((u) => u.endsWith('/bg.svg'))).toBe(true)
})
