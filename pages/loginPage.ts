import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export class LoginPage extends BasePage {
  static readonly URL = 'https://nesgpt-np.genai.nestle.com/';

  readonly loginButton: Locator;
  readonly emailInput: Locator;
  readonly nextButton: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly staySignedInButton: Locator;

  constructor(page: Page) {
    super(page);

    this.loginButton = page.getByRole('button', { name: 'Log in' });
    this.emailInput = page.getByRole('textbox', {
      name: 'Enter your email, phone, or',
    });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.passwordInput = page.getByRole('textbox', {
      name: 'Enter the password for',
    });
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.staySignedInButton = page.getByRole('button', { name: 'Yes' });
  }

  async open(): Promise<void> {
    await this.goto(LoginPage.URL);
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginWithCredentials({ email, password });
  }

  async loginWithCredentials({ email, password }: LoginCredentials): Promise<void> {
    // The Microsoft SSO pages can be slow to render in the test environment,
    // so use a more generous timeout than the default.
    const SSO_TIMEOUT = 30000;
    await this.click(this.loginButton, SSO_TIMEOUT);
    await this.fill(this.emailInput, email, SSO_TIMEOUT);
    await this.clickScrolled(this.nextButton, SSO_TIMEOUT);
    await this.fill(this.passwordInput, password, SSO_TIMEOUT);
    await this.clickScrolled(this.signInButton, SSO_TIMEOUT);
    await this.clickScrolled(this.staySignedInButton, SSO_TIMEOUT);
  }

  /**
   * Microsoft sometimes injects a tall banner on the SSO pages that pushes
   * the form buttons outside of the viewport, which makes regular clicks
   * fail with "element is outside of the viewport". Scrolling the element
   * into the center of the view first makes the click reliable.
   */
  private async clickScrolled(locator: Locator, timeout: number): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
    await locator
      .scrollIntoViewIfNeeded({ timeout })
      .catch(() => undefined);
    await locator.click({ timeout });
  }
}
