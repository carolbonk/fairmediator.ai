import { defineConfig, devices } from '@playwright/test';

// First-pass E2E config. Run `npx playwright install` once to fetch the
// browser binaries. CI should add `--with-deps` on Linux. The webServer
// block starts the Vite dev server automatically for the duration of the
// run, so `npm run e2e` works against a freshly-built copy of the app.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4010',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4010',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
