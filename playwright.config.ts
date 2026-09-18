import { defineConfig, devices } from '@playwright/test'

// 4 required viewports per plan.md's verification gate #7 (mobile,
// tablet, laptop, desktop). Deliberately implemented as ONE project that
// resizes a single shared authenticated page/context between viewports
// (see authenticated.spec.ts's page.setViewportSize() calls), rather
// than 4 separate Playwright projects each with their own browser
// context: identity's refresh token is single-use and rotates on every
// /auth/refresh call (session-family revocation on reuse is a real
// security feature, not a bug) - N independent contexts replaying the
// SAME on-disk storageState cookie would mean only the first one ever
// succeeds. A single "setup" project logs in exactly once and
// authenticated.spec.ts reuses that one session via storageState.
//
// Serial execution (workers: 1) is deliberate too: the gateway's login
// rate limit is a strict 5 requests/minute per source IP, and every
// project here runs from this same machine/IP.
const AUTH_FILE = 'tests/e2e/.auth/staff.json'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:2022',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      // Exercises the login UX itself (real credential submission), so
      // it deliberately runs unauthenticated.
      name: 'login-flow',
      testMatch: /login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // Viewport is set per-check inside the test itself, not here - see
      // the file header comment above. reducedMotion: 'reduce' avoids a
      // real false-positive: axe's color-contrast check ran mid-fade-in
      // (opacity still transitioning) without this, flagging elements
      // that are only briefly low-contrast during their entrance
      // animation, not once actually settled.
      name: 'authenticated',
      testMatch: /authenticated\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE, reducedMotion: 'reduce' },
    },
  ],
})
