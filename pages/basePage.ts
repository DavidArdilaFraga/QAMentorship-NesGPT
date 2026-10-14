import { Page, Locator, errors, expect } from '@playwright/test';

export class BasePage {
  static readonly DEFAULT_TIMEOUT = 10000;

  private static readonly walkthroughHandlers = new WeakMap<Page, Promise<void>>();

  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation against the Nestlé environment can be slow (SSO redirects,
  // CDN, WAF): use a generous timeout so page.goto never times out early.
  static readonly NAVIGATION_TIMEOUT = 60000;

  async goto(url: string, waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'load') {
    await this.registerWalkthroughHandler();
    await this.page.goto(url, {
      waitUntil,
      timeout: BasePage.NAVIGATION_TIMEOUT,
    });
  }

  async waitForVisible(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async click(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    await this.registerWalkthroughHandler();
    await locator.click({ timeout });
  }

  async fill(locator: Locator, value: string, timeout = BasePage.DEFAULT_TIMEOUT) {
    await this.registerWalkthroughHandler();
    await locator.fill(value, { timeout });
  }

  async getText(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    await this.waitForVisible(locator, timeout);
    return locator.textContent();
  }

  async isVisible(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch (error) {
      if (error instanceof errors.TimeoutError) {
        return false;
      }
      throw error;
    }
  }

  async expectVisible(locator: Locator, timeout = BasePage.DEFAULT_TIMEOUT) {
    await this.registerWalkthroughHandler();
    await expect(locator).toBeVisible({ timeout });
  }

  protected registerWalkthroughHandler(): Promise<void> {
    let handler = BasePage.walkthroughHandlers.get(this.page);
    if (!handler) {
      handler = this.page.addLocatorHandler(
        this.page.locator('[id^="walkme-balloon"]:visible').first(),
        async () => this.dismissWalkthroughIfPresent(),
      );
      BasePage.walkthroughHandlers.set(this.page, handler);
    }
    return handler;
  }

  async dismissWalkthroughIfPresent(waitForBalloonMs = 0): Promise<void> {
    const balloons = this.page.locator('[id^="walkme-balloon"]:visible');
    const balloon = balloons.first();

    const balloonVisible =
      waitForBalloonMs > 0
        ? await this.isVisible(balloon, waitForBalloonMs)
        : await balloon.isVisible();

    if (!balloonVisible) {
      return;
    }

    const closeButton = this.page.locator('[aria-label="Stop Walk-thru"]:visible').first();
    if (await closeButton.isVisible()) {
      try {
        await closeButton.click({ timeout: 3000 });
      } catch (error) {
        if (!(error instanceof errors.TimeoutError)) {
          throw error;
        }
        console.warn('WalkMe close timed out; removing the visible tour balloons.');
      }
    }

    // Some tours have no close control; remove only their remaining visible balloons.
    await balloons.evaluateAll(elements => elements.forEach(element => element.remove()));
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
