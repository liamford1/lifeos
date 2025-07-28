import { defineConfig, devices } from '@playwright/test';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: 'e2e',
  timeout: 30 * 1000,
  workers: 1, // Use single worker to prevent race conditions
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    actionTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run e2e:start',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  globalSetup: require.resolve('./e2e/global-setup.js'),
};

export default config; 