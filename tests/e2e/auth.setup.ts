import { expect, test as setup } from '@playwright/test'

import { STAFF_EMAIL, STAFF_PASSWORD } from './helpers'

// Logs in exactly ONCE for the whole suite and saves the resulting
// session (the httpOnly refresh cookie) to reuse across every
// viewport project below. The gateway's login rate limit is a strict 5
// requests/minute per source IP (gateway/nginx.conf) - repeating a real
// login per test/per viewport would blow through that budget almost
// immediately, since every project here runs from the same machine/IP.
const authFile = 'tests/e2e/.auth/staff.json'

setup('authenticate as staff', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(STAFF_EMAIL)
  await page.getByLabel('Password').fill(STAFF_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // "Sign in" is itself an <h1>, so merely asserting *a* level-1 heading
  // is visible would pass instantly without waiting for the real
  // async login+redirect - assert the heading actually changed instead.
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Sign in')
  await page.context().storageState({ path: authFile })
})
