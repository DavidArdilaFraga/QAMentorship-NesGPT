import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './basePage';

export class HomePage extends BasePage {
  static readonly URL = 'https://nesgpt-np.genai.nestle.com/';
  static readonly PROMPT_LIBRARY_URL = `${HomePage.URL}prompt-library`;
  static readonly DISCOVER_NESGPT_URL = `${HomePage.URL}help-center/about/what_is_nesgpt`;

  readonly newChatButton: Locator;
  readonly promptLibraryButton: Locator;
  readonly chatHistoryButton: Locator;
  readonly discoverNesGPTButton: Locator;
  readonly settingsButton: Locator;
  readonly logoutButton: Locator;
  readonly welcomeHeading: Locator;
  readonly chatInput: Locator;
  readonly modelSelectorButton: Locator;
  readonly promptLibraryHeading: Locator;
  readonly chatHistoryPanelText: Locator;
  readonly discoverNesGPTHeading: Locator;
  readonly settingsHeading: Locator;

  constructor(page: Page) {
    super(page);

    this.newChatButton = page.getByRole('button', { name: 'New chat' });
    this.promptLibraryButton = page.getByRole('button', { name: 'Prompt Library' });
    this.chatHistoryButton = page.getByRole('button', { name: 'Chat History' });
    this.discoverNesGPTButton = page.getByRole('button', { name: 'Discover NesGPT' });
    this.settingsButton = page.getByRole('button', { name: 'Settings' });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.welcomeHeading = page.getByRole('heading', {
      name: /How can I assist you today\?/,
    });
    this.chatInput = page.getByRole('textbox', { name: 'editable markdown' });
    this.modelSelectorButton = page.getByRole('button', { name: 'Basic model' });
    this.promptLibraryHeading = page.getByRole('heading', {
      name: 'Prompt Library',
      exact: true,
    });
    this.chatHistoryPanelText = page.getByText('Store and manage chats.');
    this.discoverNesGPTHeading = page.getByRole('heading', {
      name: 'Discover NesGPT',
      exact: true,
    });
    this.settingsHeading = page.getByRole('heading', {
      name: 'Settings',
      exact: true,
    });
  }

  async open(): Promise<void> {
    await this.goto(HomePage.URL);
    // WalkMe tour balloons trigger asynchronously on page load and can
    // cover UI elements (e.g. the sidebar buttons), so dismiss them early
    await this.dismissWalkthroughIfPresent(2000);
  }

  async expectNewChatVisible(): Promise<void> {
    // The app can take a while to render after login under load
    await this.expectVisible(this.newChatButton, 30000);
  }

  async expectWelcomeHeadingVisible(): Promise<void> {
    await this.expectVisible(this.welcomeHeading);
  }

  async expectLogoutVisible(): Promise<void> {
    await this.expectVisible(this.logoutButton);
  }

  async sendMessage(message: string): Promise<void> {
    await this.fill(this.chatInput, message);
    await this.chatInput.press('Enter');

    // Wait until the sent message is rendered in the conversation: this is
    // the signal that the backend actually accepted it and the new chat is
    // being persisted. Without this, the Chat History panel can be opened
    // before the conversation exists.
    await this.expectVisible(
      this.page
        .getByRole('paragraph')
        .filter({ hasText: message })
        .first(),
      30000,
    );
  }

  async startNewChat(): Promise<void> {
    // The "New chat" button stays disabled while the backend is still busy
    // (e.g. generating the reply of a previous conversation): wait for it
    // to become enabled instead of failing the click.
    await this.newChatButton.waitFor({ state: 'visible', timeout: 30000 });
    await this.newChatButton
      .waitFor({ state: 'attached' })
      .then(async () => {
        // Poll until enabled, bounded to 60s
        const deadline = Date.now() + 60000;
        while (Date.now() < deadline) {
          if (await this.newChatButton.isEnabled()) {
            break;
          }
          await this.page.waitForTimeout(1000);
        }
      });
    await this.click(this.newChatButton);
  }

  async openPromptLibrary(): Promise<void> {
    await this.click(this.promptLibraryButton);
  }

  async openChatHistory(): Promise<void> {
    await this.click(this.chatHistoryButton);
  }

  async openDiscoverNesGPT(): Promise<void> {
    await this.click(this.discoverNesGPTButton);
  }

  async openSettings(): Promise<void> {
    await this.click(this.settingsButton);
  }

  async expectPromptLibraryLoaded(): Promise<void> {
    await this.expectVisible(this.promptLibraryHeading);
    await expect(this.page).toHaveURL(/prompt-library/, {
      timeout: BasePage.DEFAULT_TIMEOUT,
    });
  }

  async expectChatHistoryLoaded(): Promise<void> {
    await this.expectVisible(this.chatHistoryPanelText);
  }

  async expectDiscoverNesGPTLoaded(): Promise<void> {
    await this.expectVisible(this.discoverNesGPTHeading);
    await expect(this.page).toHaveURL(/help-center\/about\/what_is_nesgpt/, {
      timeout: BasePage.DEFAULT_TIMEOUT,
    });
  }

  async expectSettingsLoaded(): Promise<void> {
    await this.expectVisible(this.settingsHeading);
  }

  async logout(): Promise<void> {
    await this.click(this.logoutButton);
  }
}
