import { HomePage } from '../pages/homePage';
import { ChatHistoryPage } from '../pages/chatHistoryPage';
import { After, Given, When, Then } from './fixtures';
import { appendFileSync } from 'fs';

let homePage: HomePage;
let chatHistoryPage: ChatHistoryPage;

// Unique test chat title for the current run.
// NOTE: the rename modal has maxlength="32", so the final title must stay within 32 chars
// or the app silently truncates it and the locator won't find the chat afterwards.
let testChatTitle = '';

function buildUniqueChatTitle(): string {
  // "QA Chat " (8) + Date.now() (13 chars) = 21 chars < 32, safe margin
  return `QA Chat ${Date.now()}`;
}

/**
 * Unique message to create the test chat. The app derives the auto-generated
 * chat title from the message text (truncated with "..." if long), so the
 * message must be SHORT enough to avoid truncation and unique per scenario.
 */
function buildUniqueChatMessage(): string {
  // "Test chat " (10) + 13 digits = 23 chars, well under any display truncation
  return `Test chat ${Date.now()}`;
}

Given('I create a test chat for the Chat History tests', async function () {
  homePage = new HomePage(this.page);
  chatHistoryPage = new ChatHistoryPage(this.page);

  await homePage.open();
  await homePage.expectNewChatVisible();

  // CRITICAL: if the browser session is inside an existing conversation
  // (possible when a previous scenario failed mid-flow), sending a message
  // would ADD to that conversation instead of creating a new one.
  // Start from a clean "new chat" state.
  await homePage.startNewChat();

  // Sending the first message creates a new conversation.
  // The app auto-generates a unique title from the (unique) message content.
  const chatMessage = buildUniqueChatMessage();
  await homePage.sendMessage(chatMessage);

  testChatTitle = buildUniqueChatTitle();
  await chatHistoryPage.open();
  // The conversation can take a while to appear in the panel (backend latency):
  // wait explicitly for it before renaming.
  await chatHistoryPage.waitForChat(chatMessage);
  await chatHistoryPage.renameChat(chatMessage, testChatTitle);
});

When('I rename the chat', async function () {
  // Build a new title that also respects the app's 32-char limit
  const renamedTitle = `Renamed ${Date.now()}`; // "Renamed " (8) + 13 = 21 chars < 32
  await chatHistoryPage.renameChat(testChatTitle, renamedTitle);
  testChatTitle = renamedTitle;
});

When('I pin the chat', async function () {
  await chatHistoryPage.pinChat(testChatTitle);
});

When('I unpin the chat', async function () {
  await chatHistoryPage.unpinChat(testChatTitle);
});

When('I delete the chat', async function () {
  await chatHistoryPage.deleteChat(testChatTitle);
});

Then('the renamed chat is visible in the Chat History', async function () {
  await chatHistoryPage.expectChatVisible(testChatTitle);
});

Then('the chat is not visible in the Chat History', async function () {
  await chatHistoryPage.expectChatNotVisible(testChatTitle);
});

Then('the chat is pinned', async function () {
  await chatHistoryPage.expectChatInPinned(testChatTitle);
});

Then('the chat is not pinned', async function () {
  await chatHistoryPage.expectChatInAll(testChatTitle);
});

// ------------------------------------------------------------------
// Filters and multi-chat selection
// ------------------------------------------------------------------

When('I open the Chat History filters', async function () {
  await chatHistoryPage.openFilters();
});

When('I open the Chat History selection mode', async function () {
  await chatHistoryPage.startSelectionMode();
});

When('I filter the Chat History by date range {string}', async function (dateRange: string) {
  await chatHistoryPage.applyDateRangeFilter(dateRange);
});

When('I clear all Chat History filters', async function () {
  await chatHistoryPage.clearAllFilters();
});

Then('the {string} filter is applied', async function (filterName: string) {
  await chatHistoryPage.expectFilterPressed(filterName);
});

When('I select the chat in the Chat History selection mode', async function () {
  await chatHistoryPage.selectChat(testChatTitle);
});

Then('the Chat History shows {int} selected', async function (count: number) {
  await chatHistoryPage.expectSelectedCount(count);
});

When('I delete the selected chats', async function () {
  await chatHistoryPage.deleteSelectedChats();
});

// ------------------------------------------------------------------
// Cleanup: remove leftover test chats after every Chat History scenario
// ------------------------------------------------------------------

After({ tags: '@NESGPTAI-5960 or @NESGPTAI-5961 or @NESGPTAI-5962 or @NESGPTAI-5964 or @NESGPTAI-5965', timeout: 90000 }, async function () {
  // NOTE: @NESGPTAI-5963 and @NESGPTAI-5966 delete the chat in the test itself,
  // so cleanup is not needed for them. Cleanup is best-effort: never fail a
  // test because of it.
  const logCleanup = (step: string) => {
    appendFileSync('cleanup-debug.log', `${new Date().toISOString()} [${this.testInfo.title}] ${step}\n`);
  };
  logCleanup('START');

  // If the scenario never got as far as creating/reaching its test chat,
  // there is nothing to clean up.
  if (!testChatTitle) {
    logCleanup('SKIP: no testChatTitle');
    return;
  }

  try {
    // Close any modal left open by a failing step (rename/delete confirmations).
    // NOTE: DOM-dispatched click — the Playwright actionability check on this
    // button was observed hanging for the whole hook budget (45s) while the
    // modal was mid-close animation.
    const cancelButton = this.page.getByTestId('cancel-button');
    if (await cancelButton.isVisible().catch(() => false)) {
      logCleanup('closing modal');
      await cancelButton
        .evaluate((button) => {
          if (button instanceof HTMLElement) button.click();
        })
        .catch(() => undefined);
      await this.page.waitForTimeout(500);
    }

    // Re-open the panel if needed and remove this run's test chat
    const chatHistory = new ChatHistoryPage(this.page);
    logCleanup('opening panel');
    await chatHistory.open();
    logCleanup('panel open, deleting test chats');
    await chatHistory.deleteTestChats();
    logCleanup('DONE');
  } catch (error) {
    logCleanup(`ERROR: ${String(error).split('\n')[0]}`);
    // Cleanup is best-effort: never fail a test because of it
  }
});
