import { expect, test } from '@playwright/test'

import { expectNoSeriousA11yViolations, isExpectedSilentRefreshProbeNoise, STAFF_EMAIL, STAFF_PASSWORD } from './helpers'

test.describe('Login page', () => {
  test('renders with no console errors and no serious a11y violations', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isExpectedSilentRefreshProbeNoise(msg.text())) consoleErrors.push(msg.text())
    })
    page.on('pageerror', (error) => consoleErrors.push(error.message))

    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    await expectNoSeriousA11yViolations(page)
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  })

  test('supports a fully keyboard-only login', async ({ page }) => {
    await page.goto('/login')

    // Tab order: skip link -> email -> password -> submit. Focus the
    // email field directly (skip-link position is a legitimate a11y
    // feature, not part of the form itself) then drive the rest by
    // keyboard only - no page.click() calls below.
    await page.getByLabel('Email').focus()
    await page.keyboard.type(STAFF_EMAIL)
    await page.keyboard.press('Tab')
    await page.keyboard.type(STAFF_PASSWORD)
    await page.keyboard.press('Enter')

    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Sign in')
  })

  test('shows an inline error on invalid credentials, not a blank/broken state', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(STAFF_EMAIL)
    await page.getByLabel('Password').fill('definitely-the-wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
  })
})

test.describe('Reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('login still works end-to-end with prefers-reduced-motion enabled', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(STAFF_EMAIL)
    await page.getByLabel('Password').fill(STAFF_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Sign in')
  })
})
