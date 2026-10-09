import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './basePage';

export class ChatHistoryPage extends BasePage {
  readonly chatHistoryButton: Locator;
  readonly renameOption: Locator;
  readonly pinOption: Locator;
  readonly unpinOption: Locator;
  readonly deleteOption: Locator;
  readonly renameInput: Locator;
  readonly acceptButton: Locator;
  readonly filterButton: Locator;
  readonly selectionModeButton: Locator;

  constructor(page: Page) {
    super(page);

    this.chatHistoryButton = page.getByRole('button', { name: 'Chat History' });
    this.renameOption = page.getByRole('menuitem', { name: 'Rename' });
    this.pinOption = page.getByRole('menuitem', { name: 'Pin chat' });
    this.unpinOption = page.getByRole('menuitem', { name: 'Unpin chat' });
    this.deleteOption = page.getByRole('menuitem', { name: 'Delete' });
    this.renameInput = page.locator('input[name="name"]');
    this.acceptButton = page.getByTestId('accept-button');
    // First icon button on the Chat History header (next to "Store and manage chats."),
    // opens the filters menu: Filter by Assistants and Filter by Date Range
    this.filterButton = page.locator(
      'p:has-text("Store and manage chats.") ~ button, ' +
      'div:has(> p:text-is("Store and manage chats.")) button',
    ).first();
    // Icon button that toggles the multi-chat selection mode (trash icon), with DOM id
    this.selectionModeButton = page.locator('#toggle-chat-selection');
  }

  chatItem(title: string): Locator {
    return this.page
      .locator('div.history-item')
      .filter({ hasText: title })
      .first();
  }

  optionsButton(title: string): Locator {
    return this.chatItem(title).locator('button').last();
  }

  pinnedSection(): Locator {
    return this.page
      .getByRole('heading', { name: 'Pinned', exact: true })
      .locator('..');
  }

  allSection(): Locator {
    return this.page
      .getByRole('heading', { name: 'All', exact: true })
      .locator('..');
  }

  chatInPinned(title: string): Locator {
    return this.pinnedSection()
      .locator('.history-item')
      .filter({ hasText: title });
  }

  chatInAll(title: string): Locator {
    return this.allSection()
      .locator('.history-item')
      .filter({ hasText: title });
  }

  async open(): Promise<void> {
    // The Chat History button is a TOGGLE: clicking it with the panel already
    // open would close it. Only click when the panel is closed.
    const panelClasses = await this.panel().getAttribute('class').catch(() => null);
    if (panelClasses?.includes('panelOpen')) {
      await this.dismissWalkthroughIfPresent(1500);
      return;
    }

    await this.click(this.chatHistoryButton);
    // WalkMe balloons trigger asynchronously right after opening the panel,
    // so give them a short window to appear before dismissing (1.5s is
    // enough: they render in under a second)
    await this.dismissWalkthroughIfPresent(1500);
  }

  private panel(): Locator {
    return this.page.locator('.nstl-sidebar__secondary-panel');
  }

  /**
   * Waits until a chat with the given title appears in the panel.
   * The conversation list refreshes asynchronously after the model finishes
   * responding — under load this environment can take well over 30 seconds,
   * hence the generous default budget.
   */
  async waitForChat(title: string, totalTimeoutMs = 90000): Promise<void> {
    const deadline = Date.now() + totalTimeoutMs;
    while (Date.now() < deadline) {
      if (await this.chatItem(title).isVisible().catch(() => false)) {
        return;
      }
      await this.page.waitForTimeout(1000);
    }
    throw new Error(
      `Chat "${title}" did not appear in the Chat History within ${totalTimeoutMs}ms`,
    );
  }

  async openChatOptions(title: string): Promise<void> {
    // The action-menu button (data-testid="action-menu") is always visible in the DOM,
    // no hover is needed to reveal it.
    // WalkMe balloons can appear asynchronously and cover the action-menu button
    await this.dismissWalkthroughIfPresent();
    // Bounded timeout: intercepted clicks must fail fast instead of hanging
    await this.optionsButton(title).click({ timeout: BasePage.DEFAULT_TIMEOUT });
  }

  async renameChat(title: string, newTitle: string): Promise<void> {
    await this.openChatOptions(title);
    await this.click(this.renameOption);
    await this.renameInput.fill(newTitle);
    await this.click(this.acceptButton);
  }

  async pinChat(title: string): Promise<void> {
    await this.openChatOptions(title);
    await this.click(this.pinOption);
  }

  async unpinChat(title: string): Promise<void> {
    await this.openChatOptions(title);
    await this.click(this.unpinOption);
  }

  async deleteChat(title: string): Promise<void> {
    await this.openChatOptions(title);
    await this.click(this.deleteOption);
    await this.click(this.acceptButton);
  }

  async expectChatVisible(title: string): Promise<void> {
    await this.expectVisible(this.chatItem(title));
  }

  async expectChatNotVisible(title: string): Promise<void> {
    await expect(this.chatItem(title)).toBeHidden({
      timeout: BasePage.DEFAULT_TIMEOUT,
    });
  }

  async expectChatInPinned(title: string): Promise<void> {
    await this.expectVisible(this.chatInPinned(title));
  }

  async expectChatInAll(title: string): Promise<void> {
    await this.expectVisible(this.chatInAll(title));
  }

  // ------------------------------------------------------------------
  // Filters menu (first icon button on the panel header)
  // ------------------------------------------------------------------

  async openFilters(): Promise<void> {
    // The filters button is a toggle: only click when the menu is closed,
    // otherwise a second click would close it and the "Apply"/"Clear all"
    // buttons would never be found.
    const chip = this.page.locator('[data-testid="filter-button"]').first();
    if (await chip.isVisible().catch(() => false)) {
      return;
    }
    await this.click(this.filterButton);
  }

  async applyAssistantFilter(assistant: string): Promise<void> {
    await this.openFilters();
    await this.click(
      this.page.locator('[data-testid="filter-button"]', { hasText: assistant }),
    );
    await this.applyFilters();
  }

  async applyDateRangeFilter(dateRange: string): Promise<void> {
    await this.openFilters();
    await this.click(
      this.page.locator('[data-testid="filter-button"]', { hasText: dateRange }),
    );
    await this.applyFilters();
  }

  async clearAllFilters(): Promise<void> {
    await this.openFilters();
    await this.click(this.page.getByRole('button', { name: 'Clear all' }));
  }

  /**
   * Asserts that a filter chip inside the filters menu is in "pressed" state
   * (class btn-secondary-pressed) after applying it.
   */
  async expectFilterPressed(filterName: string): Promise<void> {
    const chip = this.page
      .locator('[data-testid="filter-button"]')
      .filter({ hasText: filterName });
    await expect(chip).toHaveClass(/btn-secondary-pressed/, {
      timeout: BasePage.DEFAULT_TIMEOUT,
    });
  }

  private async applyFilters(): Promise<void> {
    await this.click(this.page.getByRole('button', { name: 'Apply' }));
  }

  async expectChatCount(count: number): Promise<void> {
    await expect(this.chatItemLocator()).toHaveCount(
      count,
      { timeout: BasePage.DEFAULT_TIMEOUT },
    );
  }

  private chatItemLocator(): Locator {
    return this.page.locator('div.history-item');
  }

  // ------------------------------------------------------------------
  // Multi-chat selection mode (#toggle-chat-selection icon button)
  // ------------------------------------------------------------------

  async startSelectionMode(): Promise<void> {
    // WalkMe balloons can cover the selection toggle right after the panel opens
    await this.dismissWalkthroughIfPresent();
    // The toggle button acts as bulk-delete when selection is already active,
    // so selection mode must only be entered when it is OFF (idempotent).
    if (await this.selectedCountButton().isVisible().catch(() => false)) {
      return; // already in selection mode: nothing to do
    }
    await this.selectionModeButton
      .evaluate((button) => {
        if (button instanceof HTMLElement) button.click();
      })
      .catch(() => undefined);
    // Wait until the mode is actually entered (checkboxes render)
    await this.selectedCountButton()
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => undefined);
  }

  async selectChat(title: string): Promise<void> {
    await this.dismissWalkthroughIfPresent();
    await this.click(this.chatCheckbox(title));
  }

  async expectSelectedCount(count: number): Promise<void> {
    await expect(this.selectedCountButton()).toHaveText(
      `${count} selected`,
      { timeout: BasePage.DEFAULT_TIMEOUT },
    );
  }

  async deleteSelectedChats(): Promise<void> {
    // In selection mode the same toggle button acts as the bulk-delete action:
    // with chats selected it opens the delete confirmation dialog.
    // NOTE: DOM-dispatched clicks throughout: the Playwright actionability
    // check on these buttons (often covered by the WalkMe balloon) was
    // observed hanging for the full timeout, eating the hook budget.
    await this.selectionModeButton
      .evaluate((button) => {
        if (button instanceof HTMLElement) button.click();
      })
      .catch(() => undefined);

    // Wait for the confirmation dialog to render before confirming
    const dialog = this.page.locator('.modal__overlay');
    await dialog
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => undefined);

    await this.acceptButton
      .evaluate((button) => {
        if (button instanceof HTMLElement) button.click();
      })
      .catch(() => undefined);

    // Bounded wait for the dialog to close = the delete was confirmed.
    await dialog.waitFor({ state: 'hidden', timeout: 15000 });
  }

  async exitSelectionMode(): Promise<void> {
    // The "N selected" button collapses the selection mode.
    // NOTE: the DOM click is used deliberately: the Playwright actionability
    // check on this animated button can hang for its full timeout (observed
    // live), while the DOM dispatched click always collapses the mode.
    const exited = await this.selectedCountButton()
      .evaluate((button) => {
        if (!(button instanceof HTMLElement)) return false;
        button.click();
        return true;
      })
      .catch(() => false);

    if (!exited) {
      // Button not present: selection mode was already off
      return;
    }

    // Give the UI a moment to re-render out of selection mode
    await this.page.waitForTimeout(500);
  }

  private chatCheckbox(title: string): Locator {
    return this.page
      .getByRole('checkbox', { name: new RegExp(escapeRegExp(title)) })
      .first();
  }

  private selectedCountButton(): Locator {
    return this.page.getByRole('button', { name: /\d+ selected/ });
  }

  /**
   * Cleanup helper: delete every leftover test chat using the app's API
   * (fast and deterministic — the UI selection mode was slow and fragile:
   * walkers, animations and actionability checks made it hang for minutes).
   *
   * API observed from the app's network traffic:
   *   POST /api/conversations/search  → list conversations (with filters)
   *   POST /api/conversations/delete  → bulk delete {"ids": [...]}
   */
  async deleteTestChats(): Promise<void> {
    interface Conversation {
      id?: string;
      title?: string;
    }

    const searchInPage = (isPinned: boolean) =>
      this.page.evaluate(async (pinned) => {
        const response = await fetch('/api/conversations/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pagination: { count: 100 },
            filter: { assistantIds: [], lastUpdateFrom: null, isPinned: pinned },
          }),
        });
        return response.json();
      }, isPinned);

    // Search pinned and unpinned conversations in parallel
    const [unpinned, pinned] = await Promise.all([searchInPage(false), searchInPage(true)]);

    const extract = (payload: unknown): Conversation[] =>
      (payload as { items?: Conversation[] })?.items ?? [];

    const testChatRegex = /QA Chat|Renamed|Test chat|Hello, this is a test message/;
    const idsToDelete = [...extract(unpinned), ...extract(pinned)]
      .filter((c) => c.title && testChatRegex.test(c.title))
      .map((c) => c.id)
      .filter((id): id is string => !!id);

    if (idsToDelete.length === 0) {
      return;
    }

    await this.page.evaluate(async (ids) => {
      await fetch('/api/conversations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    }, idsToDelete);
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
