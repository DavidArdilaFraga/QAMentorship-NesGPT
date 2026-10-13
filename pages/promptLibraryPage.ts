import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './basePage';
import { HomePage } from './homePage';

export type PromptLibrarySection = 'Get inspired' | 'Pinned Prompts' | 'My Categories';
export type PromptTitleOrder = 'Title: A -> Z' | 'Title: Z -> A';

export class PromptLibraryPage extends BasePage {
  static readonly UPDATE_TIMEOUT = 30000;

  private walkthroughHandlerRegistered = false;

  readonly heading: Locator;
  readonly categoryContent: Locator;
  readonly breadcrumb: Locator;
  readonly newPromptButton: Locator;
  readonly newCategoryButton: Locator;
  readonly sortBy: Locator;
  readonly promptTitles: Locator;
  readonly dialog: Locator;
  readonly promptNameInput: Locator;
  readonly promptContentInput: Locator;
  readonly categoryNameInput: Locator;
  readonly acceptButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Prompt Library', exact: true });
    this.categoryContent = page.getByTestId('prompt-library-category');
    this.breadcrumb = page.getByTestId('breadcrumb');
    // Empty categories also render a second "New prompt" CTA in the content area.
    this.newPromptButton = page.getByRole('button', { name: 'New prompt', exact: true }).first();
    this.newCategoryButton = page.getByTestId('prompt-library-create-category-button');
    this.sortBy = page.getByRole('combobox', { name: 'Sort by', exact: true });
    this.promptTitles = page.getByTestId('prompt-library-prompt-card-title');
    this.dialog = page.getByRole('dialog');
    this.promptNameInput = this.dialog.getByRole('textbox', {
      name: 'Give a descriptive name for this prompt',
      exact: true,
    });
    this.promptContentInput = this.dialog.getByRole('textbox', {
      name: 'editable markdown',
      exact: true,
    });
    this.categoryNameInput = this.dialog.getByRole('textbox', { name: 'Category Name*', exact: true });
    this.acceptButton = this.dialog.getByTestId('accept-button');
    this.cancelButton = this.dialog.getByTestId('cancel-button');
  }

  async open(): Promise<void> {
    await this.goto(HomePage.PROMPT_LIBRARY_URL);
    await this.expectLoaded();
    await this.dismissWalkthroughIfPresent();
  }

  async expectLoaded(): Promise<void> {
    if (!this.walkthroughHandlerRegistered) {
      await this.page.addLocatorHandler(
        this.page.locator('[id^="walkme-balloon"]').first(),
        async () => this.dismissWalkthroughIfPresent(),
      );
      this.walkthroughHandlerRegistered = true;
    }
    await expect(this.page).toHaveURL(/\/prompt-library(?:\/|$)/);
    await this.expectVisible(this.heading, 30000);
    await this.expectVisible(this.categoryContent, 30000);
    await this.expectVisible(this.categoryLink('General'), 30000);
  }

  async openSection(section: PromptLibrarySection): Promise<void> {
    await this.click(this.page.getByRole('link', { name: section, exact: true }));
    await this.expectSection(section);
  }

  async expectSection(section: PromptLibrarySection): Promise<void> {
    const paths: Record<PromptLibrarySection, string> = {
      'Get inspired': '/prompt-library/get-inspired',
      'Pinned Prompts': '/prompt-library/pinned-prompts',
      'My Categories': '/prompt-library',
    };
    await expect(this.page).toHaveURL(`${HomePage.URL.slice(0, -1)}${paths[section]}`);
    await this.expectLoaded();
    await expect(this.breadcrumb).toContainText(section === 'My Categories' ? 'General' : section);
  }

  categoryLink(title: string): Locator {
    return this.page.getByRole('link', { name: title, exact: true });
  }

  promptCard(title: string): Locator {
    return this.page.getByTestId('prompt-library-prompt-card').filter({
      has: this.page.getByText(title, { exact: true }),
    });
  }

  async openCategory(title: string): Promise<void> {
    await this.click(this.categoryLink(title));
    await this.expectCategorySelected(title);
  }

  async expectCategorySelected(title: string): Promise<void> {
    await this.expectLoaded();
    await expect(this.categoryLink(title)).toHaveAttribute('aria-current', 'page');
    await expect(this.breadcrumb).toContainText(title);
  }

  async createCategory(title: string): Promise<void> {
    await this.click(this.newCategoryButton);
    await this.fill(this.categoryNameInput, title);
    await this.click(this.acceptButton);
    await expect(this.dialog).toBeHidden({ timeout: PromptLibraryPage.UPDATE_TIMEOUT });
    await expect(this.categoryLink(title)).toBeVisible({ timeout: PromptLibraryPage.UPDATE_TIMEOUT });
    await this.openCategory(title);
  }

  async openCategoryAction(title: string, action: 'Rename' | 'Delete'): Promise<void> {
    await this.click(this.categoryLink(title).locator('..').getByTestId('action-menu'));
    await this.click(this.page.getByRole('menuitem', { name: action, exact: true }));
    await this.expectVisible(this.dialog);
  }

  async renameCategory(title: string, newTitle: string): Promise<void> {
    await this.openCategoryAction(title, 'Rename');
    await this.fill(this.categoryNameInput, newTitle);
    await this.click(this.acceptButton);
    await expect(this.dialog).toBeHidden({ timeout: PromptLibraryPage.UPDATE_TIMEOUT });
    await expect(this.categoryLink(newTitle)).toBeVisible({ timeout: PromptLibraryPage.UPDATE_TIMEOUT });
    await expect(this.categoryLink(title)).toHaveCount(0, { timeout: PromptLibraryPage.UPDATE_TIMEOUT });
    await this.openCategory(newTitle);
  }

  async deleteCategory(title: string): Promise<void> {
    await this.openCategoryAction(title, 'Delete');
    await this.confirmDeletion();
    await expect(this.categoryLink(title)).toHaveCount(0, { timeout: PromptLibraryPage.UPDATE_TIMEOUT });
    await this.expectLoaded();
  }

  async openNewPrompt(): Promise<void> {
    await this.click(this.newPromptButton);
    await expect(this.dialog.getByRole('heading', { name: 'New prompt', exact: true })).toBeVisible();
  }

  async fillPrompt(title: string, content: string): Promise<void> {
    await this.fill(this.promptNameInput, title);
    await this.fill(this.promptContentInput, content);
  }

  async savePrompt(): Promise<void> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        response =>
          response.url() === `${HomePage.URL}api/promptlibrary` &&
          response.request().method() === 'POST',
        { timeout: PromptLibraryPage.UPDATE_TIMEOUT },
      ),
      this.click(this.acceptButton),
    ]);
    expect(response.ok(), `Saving the prompt failed: HTTP ${response.status()}`).toBe(true);
    const error = await response.finished();
    if (error) {
      throw error;
    }
    await expect(this.dialog).toBeHidden({ timeout: PromptLibraryPage.UPDATE_TIMEOUT });
  }

  async createPrompt(title: string, content: string): Promise<void> {
    await this.openNewPrompt();
    await this.fillPrompt(title, content);
    await this.savePrompt();
    await this.expectPrompt(title, content);
  }

  async openPromptAction(title: string, action: 'Edit' | 'Delete' | 'Pin prompt' | 'Unpin prompt'): Promise<void> {
    const modifyButton = this.promptCard(title).getByRole('button').filter({
      has: this.page.getByTitle('Modify this prompt', { exact: true }),
    });
    await this.click(modifyButton);
    await this.click(this.page.getByRole('menuitem', { name: action, exact: true }));
  }

  async editPrompt(title: string, newTitle: string, content: string): Promise<void> {
    await this.openPromptAction(title, 'Edit');
    await this.fillPrompt(newTitle, content);
    await this.savePrompt();
    await this.expectPrompt(newTitle, content);
    await this.expectPromptAbsent(title);
  }

  async deletePrompt(title: string): Promise<void> {
    await this.openPromptAction(title, 'Delete');
    await this.confirmDeletion();
    await this.expectPromptAbsent(title);
  }

  async confirmDeletion(): Promise<void> {
    await expect(this.acceptButton).toHaveText('Delete');
    await this.click(this.acceptButton);
    await expect(this.dialog).toBeHidden({ timeout: PromptLibraryPage.UPDATE_TIMEOUT });
  }

  async cancelDialog(): Promise<void> {
    await this.click(this.cancelButton);
    await expect(this.dialog).toBeHidden();
  }

  async pinPrompt(title: string): Promise<void> {
    await this.openPromptAction(title, 'Pin prompt');
    await this.openSection('Pinned Prompts');
    await this.expectVisible(this.promptCard(title), PromptLibraryPage.UPDATE_TIMEOUT);
  }

  async unpinPrompt(title: string): Promise<void> {
    await this.openPromptAction(title, 'Unpin prompt');
    await this.expectPromptAbsent(title);
  }

  async expectPrompt(title: string, content: string): Promise<void> {
    const card = this.promptCard(title);
    await expect(card).toHaveCount(1, { timeout: PromptLibraryPage.UPDATE_TIMEOUT });
    await expect(card.getByTestId('prompt-library-prompt-card-title')).toHaveText(title);
    await expect(card.locator('.markdown')).toHaveText(content);
  }

  async expectPromptAbsent(title: string): Promise<void> {
    await expect(this.promptCard(title)).toHaveCount(0, { timeout: PromptLibraryPage.UPDATE_TIMEOUT });
  }

  async sortPrompts(order: PromptTitleOrder): Promise<void> {
    await this.dismissWalkthroughIfPresent();
    // React Select's dummy input is not pointer-actionable; use its keyboard interface.
    await this.sortBy.press('ArrowDown');
    await this.click(this.page.getByRole('option', { name: order, exact: true }));
    await expect(this.page.getByTestId('prompt-library-sort-by-form')).toContainText(order);
  }

  async expectPromptOrder(titles: string[]): Promise<void> {
    await expect(this.promptTitles).toHaveText(titles);
  }

  async usePrompt(title: string): Promise<void> {
    await this.click(this.promptCard(title).getByTestId('send-prompt'));
    await new HomePage(this.page).expectNewChatVisible();
    await expect(this.page).toHaveURL(HomePage.URL);
  }

  async expectChatPrefilled(content: string): Promise<void> {
    await expect(new HomePage(this.page).chatInput).toHaveText(content);
  }

  async startEmptyChat(): Promise<void> {
    await this.click(this.page.getByRole('button', { name: 'New NesGPT chat', exact: true }));
    const homePage = new HomePage(this.page);
    await homePage.expectNewChatVisible();
    await expect(this.page).toHaveURL(HomePage.URL);
    await expect(homePage.chatInput).toBeEmpty();
  }
}
