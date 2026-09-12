import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export const STAFF_EMAIL = 'staff@ictuniversity.example'
export const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD || 'dev-only-demo-password-123'

/** Logs in through the real UI (not an API shortcut) so every a11y/
 * responsive assertion downstream exercises the actual rendered app. */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

/** Fails the test if any WCAG 2.1 A/AA violation of critical or serious
 * impact is found - per plan.md's "Axe critical/serious violations must
 * be zero" gate. Moderate/minor issues are reported but not asserted on
 * here, matching that same gate's wording. */
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const seriousOrWorse = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  expect(seriousOrWorse, JSON.stringify(seriousOrWorse, null, 2)).toEqual([])
}

/** Every browser logs its own "Failed to load resource: ... 401" console
 * entry for AuthContext's silent-refresh probe on any page load without
 * an existing session (see src/services/apiClient.ts/AuthContext.tsx) -
 * that is expected, gracefully-handled behavior (it just means "not
 * logged in yet"), not an application bug, and the app itself never
 * calls console.error for it. Filtering only this exact, well-understood
 * browser-generated line - any other console error still fails the test. */
export function isExpectedSilentRefreshProbeNoise(message: string): boolean {
  return /Failed to load resource: the server responded with a status of 401/.test(message)
}
