import { defineConfig, devices } from '@playwright/test';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: 'e2e',
  timeout: 60 * 1000, // Increased timeout for slower operations
  workers: 1, // Use single worker to prevent race conditions
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    actionTimeout: 60000,
    navigationTimeout: 30000,
    // Add better error handling for network requests
    ignoreHTTPSErrors: true,
    // Add retry logic for failed requests
    retryOnNetworkError: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  globalSetup: require.resolve('./e2e/global-setup.js'),
  // Add retry configuration for flaky tests
  retries: process.env.CI ? 2 : 0,
  // Add better error reporting
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
};

export default config; 