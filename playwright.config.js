/* global process */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI and locally (1 retry locally, 2 in CI)
  retries: process.env.CI ? 2 : 1,

  // Worker count configuration
  // CI: Reduced from 6 to 4 to minimize resource contention in CircleCI containers
  // Local: undefined lets Playwright use all available CPU cores
  workers: process.env.CI ? 4 : undefined,

  // Per-test timeout (60 seconds for WebDAV sync and file loading)
  testTimeout: 60 * 1000,

  // Reporter to use (HTML for local, JUnit for CI)
  reporter: process.env.CI
    ? [['junit', { outputFile: 'test-results/junit.xml' }], ['html']]
    : 'html',

  // Shared settings for all tests
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Action timeout (clicks, fills, etc.)
    actionTimeout: 10 * 1000,

    // Navigation timeout (page.goto, etc.)
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/e2e/tests/authenticated/**/*.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: '**/e2e/tests/authenticated/**/*.spec.js',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: '**/e2e/tests/authenticated/**/*.spec.js',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      testIgnore: '**/e2e/tests/authenticated/**/*.spec.js',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      testIgnore: '**/e2e/tests/authenticated/**/*.spec.js',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'chromium-authenticated',
      testMatch: '**/e2e/tests/authenticated/**/*.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'yarn start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
