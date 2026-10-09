import { Page, TestInfo } from '@playwright/test';

/**
 * Centralizes evidence capture for failed tests.
 *
 * Screenshots are attached to the Playwright test result, so they show up in
 * the HTML report and in the Cucumber JSON (used to import evidence into Xray).
 */
export class Evidence {
  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  /**
   * Captures evidence when a test fails:
   * - screenshot (full page) at the moment of the failure
   * - attachment to the test result (visible in reports / Xray)
   * Never throws: evidence is best-effort.
   */
  static async captureOnFailure(page: Page, testInfo: TestInfo): Promise<void> {
    if (testInfo.status !== 'failed' && testInfo.status !== 'timedOut') {
      return;
    }

    // A closed page (e.g. context already destroyed) cannot be captured.
    if (!page || page.isClosed()) {
      return;
    }

    try {
      const evidence = new Evidence(page, testInfo);
      await evidence.screenshot('failure');
    } catch {
      // Evidence is best-effort: never fail a test because of it.
    }
  }

  /**
   * Takes a screenshot and attaches it to the current test result.
   * @param name logical name, e.g. "failure", "before-delete" ...
   */
  async screenshot(name: string): Promise<void> {
    const buffer = await this.page.screenshot({ fullPage: true, type: 'png' });

    // Attach to the Playwright test result; the Cucumber JSON reporter
    // picks it up as an evidence attachment for the step.
    await this.testInfo.attach(`${name}.png`, {
      body: buffer,
      contentType: 'image/png',
    });
  }
}
