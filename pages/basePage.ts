import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  static readonly DEFAULT_TIMEOUT = 10000;

  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation against the Nestlé environment can be slow (SSO redirects,
  // CDN, WAF): use a generous timeout so page.goto never times out early.
  static readonly NAVIGATION_TIMEOUT = 60000;

  async goto(url: string, waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'load') {
    await this.page.goto(url, {
      waitUntil,
      timeout: BasePage.NAVIGATION_TIMEOUT,
    });
  }

  async waitForVisible(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async click(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    // WalkMe tour balloons appear asynchronously anywhere in the UI and
    // intercept pointer events; clear them before every click so they can
    // never block an interaction.
    await this.dismissWalkthroughIfPresent();
    await this.waitForVisible(locator, timeout);
    // Bounded timeout: Playwright actions default to NO timeout (0);
    // an intercepted click would otherwise hang until the test/hook timeout.
    await locator.click({ timeout });
  }

  async fill(locator: Locator, value: string, timeout = BasePage.DEFAULT_TIMEOUT) {
    await this.waitForVisible(locator, timeout);
    await locator.fill(value);
  }

  async getText(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    await this.waitForVisible(locator, timeout);
    return locator.textContent();
  }

  async isVisible(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async expectVisible(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    await this.waitForVisible(locator, timeout);
    await expect(locator).toBeVisible();
  }

  /**
   * WalkMe product-tour balloons ("NEW! You can now store and manage your chats.")
   * appear asynchronously on top of the UI and intercept pointer events, which
   * breaks clicks in tests (e.g. over the Chat History items).
   * If a balloon is visible, close it so the UI becomes usable again.
   *
   * @param waitForBalloonMs when > 0, waits up to that long for a balloon to
   *   appear (use it right after a page load, which is when WalkMe triggers).
   *   Default 0 = instant check, safe to call before every critical click.
   */
  async dismissWalkthroughIfPresent(waitForBalloonMs = 0): Promise<void> {
    const balloon = this.page.locator('[id^="walkme-balloon"]').first();

    const balloonVisible =
      waitForBalloonMs > 0
        ? await this.isVisible(balloon, waitForBalloonMs)
        : await balloon.isVisible();

    if (!balloonVisible) {
      return;
    }

    // Preferred way: click the balloon's close button (marks the tour as stopped).
    // NOTE: bounded timeout - Playwright actions default to NO timeout (0),
    // an intercepted close click would otherwise hang the whole hook.
    const closeButton = this.page.locator('[aria-label="Stop Walk-thru"]');
    if (await closeButton.isVisible()) {
      await closeButton.click({ timeout: 3000 }).catch(() => undefined);
    }

    // Fallback / safety net: if the balloon is still in the DOM (or had no close
    // button), remove it so it cannot intercept further clicks.
    await balloon
      .evaluate((el) => el.remove())
      .catch(() => undefined);
  }

  async expectTitle(expectedTitle: string | RegExp, timeout = BasePage.DEFAULT_TIMEOUT) {
    await expect(this.page).toHaveTitle(expectedTitle, { timeout });
  }

  async screenshot(name: string, fullPage = false) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage,
    });
  }
}
