import { expect, test, type Page } from '@playwright/test'
import { loadChallenges } from '../src/content/challenges/node'
import { LEVEL_LABELS } from '../src/content/types'

const CHALLENGES = loadChallenges()

async function frameOf(page: Page, testId: string) {
  const handle = await page.getByTestId(testId).elementHandle()
  const frame = await handle?.contentFrame()
  if (!frame) throw new Error(`${testId} not found`)
  return frame
}

/** Open a challenge's view from the list. Nothing is created until Start. */
async function openChallenge(page: Page, title: string) {
  await page.getByRole('tab', { name: 'Challenges' }).click()
  await page
    .getByTestId('challenge-list')
    .getByRole('button', { name: new RegExp(title) })
    .click()
  await expect(page.getByTestId('active-challenge')).toBeVisible()
}

async function startChallenge(page: Page, title: string) {
  await openChallenge(page, title)
  await page.getByRole('button', { name: 'Start challenge' }).click()
  await expect(page.getByTestId('active-challenge').getByTestId('in-progress')).toBeVisible()
}

/** Rounded border boxes of every tree element, in document order. */
async function geometry(page: Page, testId: string): Promise<number[][]> {
  const frame = await frameOf(page, testId)
  return frame.evaluate(() =>
    Array.from(document.querySelectorAll('[data-ll-id]')).map((el) => {
      const r = el.getBoundingClientRect()
      return [r.x, r.y, r.width, r.height].map((n) => Math.round(n))
    }),
  )
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

// Content guarantee, in a real browser: for every challenge the pieces fit together.
for (const challenge of CHALLENGES) {
  test(`challenge "${challenge.id}": brief, references and a solution that reproduces the target`, async ({ page }) => {
    await startChallenge(page, challenge.title)
    const active = page.getByTestId('active-challenge')

    await expect(active.getByRole('heading', { name: challenge.title })).toBeVisible()
    await expect(active.locator('[data-level]')).toHaveText(LEVEL_LABELS[challenge.level])
    for (const width of challenge.viewports) {
      await expect(active.getByRole('img', { name: `Target layout at ${width}px` })).toBeVisible()
    }
    await expect
      .poll(() =>
        active
          .getByTestId('reference')
          .locator('img')
          .evaluateAll((imgs) => imgs.filter((i) => !(i as HTMLImageElement).naturalWidth).length),
      )
      .toBe(0)

    // Applying the solution makes the learner's preview match the target frame exactly.
    await page.getByRole('button', { name: 'Show solution' }).click()
    await expect(page.getByTestId('solution')).toContainText(challenge.solutionNotes.slice(0, 40))
    await page.getByRole('button', { name: 'Apply solution' }).click()
    await expect.poll(() => geometry(page, 'preview-frame')).toEqual(await geometry(page, 'target-frame'))
  })
}

test('there is no checklist, check count or Solved banner', async ({ page }) => {
  await startChallenge(page, 'Dashboard grid')
  const active = page.getByTestId('active-challenge')
  await expect(active.getByRole('heading', { name: 'Checks' })).toHaveCount(0)
  await expect(page.getByTestId('checklist')).toHaveCount(0)
  await expect(page.getByTestId('challenge-status')).toHaveCount(0)
  await expect(page.getByText(/checks$|pass$|Solved/)).toHaveCount(0)
  // Only the visible preview and the target: no hidden measuring frames.
  await expect(page.locator('iframe')).toHaveCount(2)
  await expect(page.getByTestId('challenge-checker')).toHaveCount(0)
})

test('hints reveal one at a time, and the compare modes put the target over the preview', async ({ page }) => {
  await startChallenge(page, 'Center the card')

  await page.getByRole('button', { name: 'Show hint 1 of 3' }).click()
  await expect(page.getByText("Centering is the parent's job")).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show hint 2 of 3' })).toBeVisible()

  await expect(page.getByTestId('target-frame')).toHaveCSS('opacity', '0')
  await page.getByRole('radio', { name: 'Overlay' }).click()
  await expect(page.getByTestId('target-frame')).toHaveCSS('opacity', '0.5')
  await page.getByRole('radio', { name: 'Target' }).click()
  await expect(page.getByTestId('target-frame')).toHaveCSS('opacity', '1')
  const target = await frameOf(page, 'target-frame')
  await expect(target.locator('.stage')).toHaveCSS('display', 'grid')
  await page.getByRole('radio', { name: 'Yours' }).click()
})

test('hand-written CSS shows up in the preview and the target stays unchanged', async ({ page }) => {
  await startChallenge(page, 'Center the card')
  const before = await geometry(page, 'target-frame')

  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.insertText('\n.stage { display: flex; justify-content: center; align-items: center }\n')

  // The learner's preview now matches the target; the target never moved.
  await expect.poll(() => geometry(page, 'preview-frame')).toEqual(before)
  expect(await geometry(page, 'target-frame')).toEqual(before)
})

test('challenge sandboxes are separate, resumable and resettable', async ({ page }) => {
  await startChallenge(page, 'Build a toolbar')
  await expect(page.getByRole('tab', { name: /Challenge: Build a toolbar/ })).toBeVisible()

  // Back to the list: the started challenge is marked In progress and reopens the same sandbox.
  await page.getByRole('button', { name: 'All challenges' }).click()
  await expect(
    page.getByTestId('challenge-list').getByRole('button', { name: /Build a toolbar.*In progress/ }),
  ).toBeVisible()
  await page
    .getByTestId('challenge-list')
    .getByRole('button', { name: /Build a toolbar/ })
    .click()
  await expect(page.getByTestId('active-challenge')).toContainText('Build a toolbar')
  await expect(page.getByTestId('active-challenge').getByTestId('in-progress')).toBeVisible()

  // Reset (with confirmation) and Undo.
  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\n.bar { display: flex }')
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Reset to starter' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset' }).click()
  await expect(page.locator('.cm-content')).not.toContainText('.bar { display: flex }')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.locator('.cm-content')).toContainText('.bar { display: flex }')
})

test('level filter narrows the challenge list and badges show the level', async ({ page }) => {
  await page.getByRole('tab', { name: 'Challenges' }).click()
  const list = page.getByTestId('challenge-list')
  const filter = list.getByRole('radiogroup', { name: 'Filter by level' })

  const count = (level: string) => CHALLENGES.filter((c) => c.level === level).length
  await expect(list.locator('li')).toHaveCount(CHALLENGES.length)

  await filter.getByRole('radio', { name: 'Hard' }).click()
  await expect(list.locator('li')).toHaveCount(count('hard'))
  await expect(list.locator('[data-level="beginner"]')).toHaveCount(0)
  await expect(list.getByRole('button', { name: /Dashboard grid/ })).toBeVisible()
  await expect(list.getByRole('button', { name: /Center the card/ })).toHaveCount(0)

  await filter.getByRole('radio', { name: 'Beginner' }).click()
  await expect(list.locator('li')).toHaveCount(count('beginner'))
  await expect(list.getByRole('button', { name: /Center the card/ })).toBeVisible()

  await filter.getByRole('radio', { name: 'All' }).click()
  await expect(list.locator('li')).toHaveCount(CHALLENGES.length)
})

test('kind filter shows only creative challenges, which carry a Creative badge', async ({ page }) => {
  await page.getByRole('tab', { name: 'Challenges' }).click()
  const list = page.getByTestId('challenge-list')
  const kinds = list.getByRole('radiogroup', { name: 'Filter by kind' })
  const creative = CHALLENGES.filter((c) => c.creative).length

  await expect(list.getByTestId('creative-badge')).toHaveCount(creative)

  await kinds.getByRole('radio', { name: 'Creative' }).click()
  await expect(list.locator('li')).toHaveCount(creative)
  await expect(list.getByRole('button', { name: /Sunny day/ })).toBeVisible()
  await expect(list.getByRole('button', { name: /Center the card/ })).toHaveCount(0)

  // Combines with the level filter.
  await list.getByRole('radiogroup', { name: 'Filter by level' }).getByRole('radio', { name: 'Hard' }).click()
  await expect(list.locator('li')).toHaveCount(CHALLENGES.filter((c) => c.creative && c.level === 'hard').length)

  await kinds.getByRole('radio', { name: 'Layout' }).click()
  await expect(list.getByTestId('creative-badge')).toHaveCount(0)
})

test('list thumbnails load; the reference dialog shows each width and returns focus', async ({ page }) => {
  await page.getByRole('tab', { name: 'Challenges' }).click()

  const thumbs = page.getByTestId('challenge-list').locator('img')
  await expect(thumbs).toHaveCount(CHALLENGES.length)
  // Thumbnails are lazy, so the ones far down the list only load once scrolled to.
  for (const thumb of await thumbs.all()) await thumb.scrollIntoViewIfNeeded()
  await expect
    .poll(() => thumbs.evaluateAll((imgs) => imgs.filter((i) => !(i as HTMLImageElement).naturalWidth).length))
    .toBe(0)

  await page
    .getByTestId('challenge-list')
    .getByRole('button', { name: /Dashboard grid/ })
    .click()
  const reference = page.getByTestId('reference')
  await reference.getByRole('button', { name: 'Open the 1024px reference full size' }).click()
  const dialog = page.getByRole('dialog', { name: /Dashboard grid: target layout/ })
  await expect(dialog.getByTestId('reference-full')).toHaveJSProperty('naturalWidth', 1024)
  await dialog.getByRole('radio', { name: '375px' }).click()
  await expect(dialog.getByTestId('reference-full')).toHaveJSProperty('naturalWidth', 375)

  // Esc closes it and returns focus to the thumbnail that opened it.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(reference.getByRole('button', { name: 'Open the 1024px reference full size' })).toBeFocused()
})

test('new tags (aside, h2) appear in the tree for the dashboard', async ({ page }) => {
  await startChallenge(page, 'Dashboard grid')
  await page.getByRole('tab', { name: 'Items' }).click()
  await expect(page.getByRole('treeitem', { name: /^aside\.sidebar/ })).toBeVisible()
  await expect(page.getByRole('treeitem', { name: /^h2, text “Revenue”/ })).toBeVisible()
})

test('Start and Continue live in the challenge view; hints and solution only appear after Start', async ({ page }) => {
  await openChallenge(page, 'Center the card')
  const view = page.getByTestId('active-challenge')

  // Viewing: brief and reference, a Start button in the header, nothing created yet.
  await expect(view.getByRole('button', { name: 'Start challenge' })).toBeVisible()
  await expect(view.getByTestId('reference')).toBeVisible()
  await expect(view.getByTestId('start-note')).toBeVisible()
  await expect(view.getByRole('button', { name: /Show hint/ })).toHaveCount(0)
  await expect(view.getByRole('button', { name: 'Show solution' })).toHaveCount(0)
  await expect(view.getByRole('button', { name: 'Reset to starter' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: /Challenge: Center the card/ })).toHaveCount(0)

  // Start: the sandbox exists, the marker replaces the button, and the help appears.
  await view.getByRole('button', { name: 'Start challenge' }).click()
  await expect(page.getByRole('tab', { name: /Challenge: Center the card/ })).toBeVisible()
  await expect(view.getByTestId('in-progress')).toBeVisible()
  await expect(view.getByRole('button', { name: 'Start challenge' })).toHaveCount(0)
  await expect(view.getByRole('button', { name: 'Show hint 1 of 3' })).toBeVisible()
  await expect(view.getByRole('button', { name: 'Show solution' })).toBeVisible()

  // Leave for another sandbox: the same view now offers Continue, and the help hides again.
  await page.getByRole('button', { name: 'New sandbox' }).click()
  await expect(view.getByRole('button', { name: 'Continue' })).toBeVisible()
  await expect(view.getByRole('button', { name: /Show hint/ })).toHaveCount(0)
  await view.getByRole('button', { name: 'Continue' }).click()
  await expect(view.getByTestId('in-progress')).toBeVisible()
  await expect(view.getByRole('button', { name: 'Show hint 1 of 3' })).toBeVisible()
})
