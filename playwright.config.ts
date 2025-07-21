import { defineConfig, devices } from '@playwright/test';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: 'e2e',
  timeout: 30 * 1000,
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
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  globalSetup: require.resolve('./e2e/global-setup.js'),
};

export default config; 