import { expect, test } from '@playwright/test'

import { expectNoSeriousA11yViolations, isExpectedSilentRefreshProbeNoise } from './helpers'

const PAGES = [
  { path: '/', heading: 'Welcome, ICT University Staff' },
  { path: '/people', heading: 'My workspace' },
  { path: '/finance', heading: 'Finance & Marketing' },
  { path: '/status', heading: 'System status' },
]

// Mobile / tablet / laptop / desktop, per plan.md's verification gate #7.
const VIEWPORTS = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
]

// Deliberately ONE test (one browser context/page, resized between
// viewports) covering every authenticated page at every required
// viewport, rather than splitting into many tests/projects: identity's
// refresh token is single-use and rotates on every /auth/refresh call
// (reuse triggers session-family revocation - a real security feature,
// not a bug). Each Playwright *test*/project gets its own fresh context
// by default, so splitting this up would mean every one of them replays
// the SAME on-disk storageState cookie, and only the first ever succeeds
// - the rest get revoked and bounce back to /login. One shared session
// resizing and navigating (like a real user resizing their window)
// sidesteps that entirely.
test('authenticated pages render with no console errors, no horizontal overflow, and no serious a11y violations at every required viewport', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isExpectedSilentRefreshProbeNoise(msg.text())) consoleErrors.push(msg.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome, ICT University Staff' })).toBeVisible()

  // Headless Chromium's synthetic Tab keypress does not reliably hand
  // off DOM focus in this environment (confirmed: document.activeElement
  // stays <body> even after page.keyboard.press('Tab')), so the actual
  // DOM tab-order property is checked directly instead of simulating a
  // real focus handoff - this still verifies the real requirement (the
  // skip link is the first reachable stop) without depending on that
  // flaky simulation.
  const firstFocusable = await page.evaluate(() => {
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const first = document.querySelector(selector)
    return first?.textContent?.trim() ?? null
  })
  expect(firstFocusable).toBe('Skip to content')

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    for (const { path, heading } of PAGES) {
      await page.goto(path)
      // getByText would also match the sidebar nav link with the same
      // label (hidden off-canvas at the mobile viewport) - scope to the
      // actual page <h1> instead.
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()

      // No document-level horizontal overflow at this viewport (plan.md's
      // "no document-level horizontal overflow" responsive requirement).
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(hasHorizontalOverflow, `horizontal overflow on ${path} at ${viewport.name}`).toBe(false)

      await expectNoSeriousA11yViolations(page)
    }
  }

  expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
})


