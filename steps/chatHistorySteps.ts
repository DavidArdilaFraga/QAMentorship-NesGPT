import { randomUUID } from 'crypto';
import { HomePage } from '../pages/homePage';
import { ChatHistoryPage } from '../pages/chatHistoryPage';
import { After, Before, Given, When, Then } from './fixtures';
import { World } from './world';

interface ChatHistoryState {
  history: ChatHistoryPage;
  chatTitle: string;
  chatMessage: string;
  ownedTitles: Set<string>;
}

const states = new WeakMap<World, ChatHistoryState>();

function state(world: World): ChatHistoryState {
  const current = states.get(world);
  if (!current) {
    throw new Error('Chat History scenario state has not been initialised.');
  }
  return current;
}

Before({ tags: '@chat-history' }, async function () {
  // Keep names below the rename dialog's 32-character limit.
  const id = randomUUID().replace(/-/g, '').slice(0, 12);
  states.set(this, {
    history: new ChatHistoryPage(this.page),
    chatTitle: `QA Chat ${id}`,
    chatMessage: `Test chat ${id}`,
    ownedTitles: new Set(),
  });
});

Given('I create a test chat for the Chat History tests', async function () {
  const current = state(this);
  const homePage = new HomePage(this.page);
  await homePage.open();
  await homePage.expectNewChatVisible();
  await homePage.startNewChat();
  current.ownedTitles.add(current.chatMessage);
  await homePage.sendMessage(current.chatMessage);
  await current.history.open();
  await current.history.waitForChat(current.chatMessage);
  current.ownedTitles.add(current.chatTitle);
  await current.history.renameChat(current.chatMessage, current.chatTitle);
});

When('I rename the chat', async function () {
  const current = state(this);
  const renamedTitle = `Renamed ${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  current.ownedTitles.add(renamedTitle);
  await current.history.renameChat(current.chatTitle, renamedTitle);
  current.chatTitle = renamedTitle;
});

When('I pin the chat', async function () {
  const current = state(this);
  await current.history.pinChat(current.chatTitle);
});

When('I unpin the chat', async function () {
  const current = state(this);
  await current.history.unpinChat(current.chatTitle);
});

When('I delete the chat', async function () {
  const current = state(this);
  await current.history.deleteChat(current.chatTitle);
});

Then('the renamed chat is visible in the Chat History', async function () {
  const current = state(this);
  await current.history.expectChatVisible(current.chatTitle);
});

Then('the chat is not visible in the Chat History', async function () {
  const current = state(this);
  await current.history.expectChatNotVisible(current.chatTitle);
});

Then('the chat is pinned', async function () {
  const current = state(this);
  await current.history.expectChatInPinned(current.chatTitle);
});

Then('the chat is not pinned', async function () {
  const current = state(this);
  await current.history.expectChatInAll(current.chatTitle);
});

When('I open the Chat History filters', async function () {
  await state(this).history.openFilters();
});

When('I open the Chat History selection mode', async function () {
  await state(this).history.startSelectionMode();
});

When('I filter the Chat History by date range {string}', async function (dateRange: string) {
  await state(this).history.applyDateRangeFilter(dateRange);
});

When('I clear all Chat History filters', async function () {
  await state(this).history.clearAllFilters();
});

Then('the {string} filter is applied', async function (filterName: string) {
  await state(this).history.expectFilterPressed(filterName);
});

When('I select the chat in the Chat History selection mode', async function () {
  const current = state(this);
  await current.history.selectChat(current.chatTitle);
});

Then('the Chat History shows {int} selected', async function (count: number) {
  await state(this).history.expectSelectedCount(count);
});

When('I delete the selected chats', async function () {
  await state(this).history.deleteSelectedChats();
});

After({ tags: '@chat-history', timeout: 90000 }, async function () {
  const current = states.get(this);
  if (!current) {
    return;
  }
  try {
    const count = await current.history.deleteOwnedChats([...current.ownedTitles]);
    console.info(`Chat History cleanup: removed ${count} scenario-owned chats.`);
  } finally {
    states.delete(this);
  }
});
