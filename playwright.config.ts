import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';

export const AUTH_FILE = 'playwright/.auth/nesgpt-user.json';

const testDir = defineBddConfig({
  features: 'features',
  steps: ['steps/evidenceSteps.ts', 'steps/*.ts'],
});

export default defineConfig({
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  use: {
    trace: 'retain-on-failure',
    screenshot: 'off',
    headless: true, //false to open browser
    actionTimeout: 20000,
  },
  timeout: 180000,
  reporter: [
    ['html', { open: process.env.CI ? 'never' : 'always' }],
    cucumberReporter('html', {
      outputFile: 'cucumber-report/report.html',
      // Store attachments (incl. trace.zip) as external files and embed
      // the Playwright trace viewer in the HTML report.
      externalAttachments: true,
    }),
    cucumberReporter('json', {
      outputFile: 'cucumber-report/xray-results.json',
      skipAttachments: false,
    }),
  ],
  projects: [
    {
      name: 'chromium',
      testDir,
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        headless: false,
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
