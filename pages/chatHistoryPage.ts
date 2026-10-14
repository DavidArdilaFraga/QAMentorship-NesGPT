import { Locator, Page, Request, expect } from '@playwright/test';
import { BasePage } from './basePage';
import { HomePage } from './homePage';

export class ChatHistoryPage extends BasePage {
  private conversationSearchRequest?: Request;

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

    page.on('request', request => {
      if (request.url() === `${HomePage.URL}api/conversations/search` && request.method() === 'POST') {
        this.conversationSearchRequest = request;
      }
    });

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
      .filter({ has: this.page.getByText(title, { exact: true }) });
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
    const panelClasses = await this.panel().getAttribute('class');
    if (panelClasses?.includes('panelOpen')) {
      return;
    }

    await this.click(this.chatHistoryButton);
    await this.expectVisible(this.page.getByText('Store and manage chats.', { exact: true }), 30000);
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
    await expect(this.chatItem(title)).toBeVisible({ timeout: totalTimeoutMs });
  }

  async openChatOptions(title: string): Promise<void> {
    await this.click(this.optionsButton(title));
  }

  async renameChat(title: string, newTitle: string): Promise<void> {
    await this.openChatOptions(title);
    await this.click(this.renameOption);
    await this.fill(this.renameInput, newTitle);
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
    if (await chip.isVisible()) {
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
    // The toggle button acts as bulk-delete when selection is already active,
    // so selection mode must only be entered when it is OFF (idempotent).
    if (await this.selectedCountButton().isVisible()) {
      return; // already in selection mode: nothing to do
    }
    await this.click(this.selectionModeButton);
    await this.expectVisible(this.selectedCountButton());
  }

  async selectChat(title: string): Promise<void> {
    await this.click(this.chatCheckbox(title));
  }

  async expectSelectedCount(count: number): Promise<void> {
    await expect(this.selectedCountButton()).toHaveText(
      `${count} selected`,
      { timeout: BasePage.DEFAULT_TIMEOUT },
    );
  }

  async deleteSelectedChats(): Promise<void> {
    await this.click(this.selectionModeButton);
    const dialog = this.page.locator('.modal__overlay');
    await this.expectVisible(dialog);
    await this.click(this.acceptButton);
    await expect(dialog).toBeHidden({ timeout: 15000 });
  }

  async exitSelectionMode(): Promise<void> {
    if (!(await this.selectedCountButton().isVisible())) {
      return;
    }
    await this.click(this.selectedCountButton());
    await expect(this.selectedCountButton()).toBeHidden();
  }

  private chatCheckbox(title: string): Locator {
    return this.page
      .getByRole('checkbox', { name: new RegExp(escapeRegExp(title)) })
      .first();
  }

  private selectedCountButton(): Locator {
    return this.page.getByRole('button', { name: /\d+ selected/ });
  }

  async deleteOwnedChats(titles: readonly string[]): Promise<number> {
    if (titles.length === 0) {
      return 0;
    }
    if (!this.conversationSearchRequest) {
      await this.open();
    }
    if (!this.conversationSearchRequest) {
      throw new Error('Chat cleanup requires an authenticated conversation search request.');
    }
    const headers = Object.fromEntries(
      Object.entries(await this.conversationSearchRequest.allHeaders()).filter(([name]) =>
        ['authorization', 'channel', 'version', 'x-fetch-site'].includes(name),
      ),
    );
    if (!headers.authorization) {
      throw new Error('The conversation search request has no authorization header.');
    }
    const ownedTitles = new Set(titles);
    const ids = new Set<string>();
    const search = async (isPinned: boolean): Promise<void> => {
      let continuationToken: string | undefined;
      const seenTokens = new Set<string>();
      do {
        const response = await this.page.request.post(`${HomePage.URL}api/conversations/search`, {
          headers,
          timeout: 30000,
          data: {
            pagination: { count: 100, continuationToken },
            filter: { assistantIds: [], lastUpdateFrom: null, isPinned },
          },
        });
        if (!response.ok()) {
          throw new Error(`Chat cleanup search failed: HTTP ${response.status()}`);
        }
        const payload: unknown = await response.json();
        if (
          !payload || typeof payload !== 'object' ||
          !('conversations' in payload) || !Array.isArray(payload.conversations)
        ) {
          throw new Error('Chat cleanup search returned an invalid conversations payload.');
        }
        const conversations: unknown[] = payload.conversations;
        for (const conversation of conversations) {
          if (
            !conversation || typeof conversation !== 'object' ||
            !('conversationId' in conversation) || typeof conversation.conversationId !== 'string' ||
            !('title' in conversation) || (typeof conversation.title !== 'string' && conversation.title !== null)
          ) {
            throw new Error('Chat cleanup search returned an invalid conversation.');
          }
          if (conversation.title !== null && ownedTitles.has(conversation.title)) {
            ids.add(conversation.conversationId);
          }
        }
        const next = 'continuationToken' in payload ? payload.continuationToken : undefined;
        if (next !== undefined && next !== null && typeof next !== 'string') {
          throw new Error('Chat cleanup search returned an invalid continuation token.');
        }
        continuationToken = next || undefined;
        if (continuationToken) {
          if (seenTokens.has(continuationToken)) {
            throw new Error('Chat cleanup search returned a repeated continuation token.');
          }
          seenTokens.add(continuationToken);
        }
      } while (continuationToken);
    };

    await Promise.all([search(false), search(true)]);
    if (ids.size > 0) {
      const response = await this.page.request.post(`${HomePage.URL}api/conversations/delete`, {
        headers,
        timeout: 30000,
        data: { ids: [...ids] },
      });
      if (!response.ok()) {
        throw new Error(`Chat cleanup deletion failed: HTTP ${response.status()}`);
      }
    }
    return ids.size;
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
