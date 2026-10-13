import { randomUUID } from 'crypto';
import { expect } from '@playwright/test';
import { HomePage } from '../pages/homePage';
import { PromptLibraryPage, PromptLibrarySection, PromptTitleOrder } from '../pages/promptLibraryPage';
import { Before, After, Given, When, Then } from './fixtures';
import { World } from './world';

interface PromptLibraryState {
  library: PromptLibraryPage;
  categoryTitle: string;
  renamedCategoryTitle: string;
  promptTitle: string;
  editedPromptTitle: string;
  promptContent: string;
  editedPromptContent: string;
  ownedCategories: Set<string>;
  ownedPrompts: Set<string>;
  sortingTitles: string[];
}

const states = new WeakMap<World, PromptLibraryState>();

function state(world: World): PromptLibraryState {
  const current = states.get(world);
  if (!current) {
    throw new Error('Prompt Library scenario state has not been initialised.');
  }
  return current;
}

function section(value: string): PromptLibrarySection {
  if (value === 'Get inspired' || value === 'Pinned Prompts' || value === 'My Categories') {
    return value;
  }
  throw new Error(`Unknown Prompt Library section: ${value}`);
}

function titleOrder(value: string): PromptTitleOrder {
  if (value === 'Title: A -> Z' || value === 'Title: Z -> A') {
    return value;
  }
  throw new Error(`Unknown Prompt Library title order: ${value}`);
}

async function createTestCategory(current: PromptLibraryState): Promise<void> {
  current.ownedCategories.add(current.categoryTitle);
  await current.library.createCategory(current.categoryTitle);
}

async function createTestPrompt(current: PromptLibraryState): Promise<void> {
  current.ownedPrompts.add(current.promptTitle);
  await current.library.createPrompt(current.promptTitle, current.promptContent);
}

Before({ tags: '@prompt-library' }, async function () {
  const id = randomUUID().slice(0, 12);
  states.set(this, {
    library: new PromptLibraryPage(this.page),
    categoryTitle: `QA Category ${id}`,
    renamedCategoryTitle: `QA Renamed ${id}`,
    promptTitle: `QA Prompt ${id}`,
    editedPromptTitle: `QA Edited ${id}`,
    promptContent: `Reply with QA prompt library ${id}.`,
    editedPromptContent: `Reply with updated QA prompt library ${id}.`,
    ownedCategories: new Set(),
    ownedPrompts: new Set(),
    sortingTitles: [],
  });
});

Given('I am on the Prompt Library page', async function () {
  const homePage = new HomePage(this.page);
  await homePage.open();
  await homePage.expectNewChatVisible();
  await homePage.openPromptLibrary();
  await state(this).library.expectSection('My Categories');
});

When('I open the {string} Prompt Library section', async function (value: string) {
  await state(this).library.openSection(section(value));
});

Then('the {string} Prompt Library section is loaded', async function (value: string) {
  const library = state(this).library;
  await library.expectSection(section(value));
  if (value === 'Get inspired') {
    await expect(library.promptTitles.first()).toBeVisible();
    await expect(library.newPromptButton).toBeDisabled();
  }
});

When('I start a new NesGPT chat from the Prompt Library', async function () {
  await state(this).library.startEmptyChat();
});

Then('the new chat input is empty', async function () {
  await expect(new HomePage(this.page).chatInput).toBeEmpty();
});

Given('I create a test category in the Prompt Library', async function () {
  await createTestCategory(state(this));
});

Given('I have a test prompt in its own Prompt Library category', async function () {
  const current = state(this);
  await createTestCategory(current);
  await createTestPrompt(current);
});

When('I create a test prompt in the selected category', async function () {
  await createTestPrompt(state(this));
});

Then('the test category is selected in the Prompt Library', async function () {
  const current = state(this);
  await current.library.expectCategorySelected(current.categoryTitle);
});

When('I rename the test Prompt Library category', async function () {
  const current = state(this);
  current.ownedCategories.add(current.renamedCategoryTitle);
  await current.library.renameCategory(current.categoryTitle, current.renamedCategoryTitle);
});

Then('the renamed test category is selected in the Prompt Library', async function () {
  const current = state(this);
  await current.library.expectCategorySelected(current.renamedCategoryTitle);
  await expect(current.library.categoryLink(current.categoryTitle)).toHaveCount(0);
});

When('I cancel deletion of the test Prompt Library category', async function () {
  const current = state(this);
  await current.library.openCategoryAction(current.categoryTitle, 'Delete');
  await current.library.cancelDialog();
});

When('I delete the test Prompt Library category', async function () {
  const current = state(this);
  await current.library.deleteCategory(current.categoryTitle);
});

Then('the test category is not visible in the Prompt Library', async function () {
  const current = state(this);
  await expect(current.library.categoryLink(current.categoryTitle)).toHaveCount(0);
});

When('I open the General Prompt Library category', async function () {
  await state(this).library.openCategory('General');
});

When('I open the test Prompt Library category', async function () {
  const current = state(this);
  await current.library.openCategory(current.categoryTitle);
});

When('I reload the Prompt Library page', async function () {
  await this.page.reload({ timeout: PromptLibraryPage.NAVIGATION_TIMEOUT });
  await state(this).library.expectLoaded();
});

Then('the test prompt is visible with its saved content', async function () {
  const current = state(this);
  await current.library.expectPrompt(current.promptTitle, current.promptContent);
});

Then('the test prompt is not visible in the Prompt Library', async function () {
  const current = state(this);
  await current.library.expectPromptAbsent(current.promptTitle);
});

When('I cancel creation of a test prompt', async function () {
  const current = state(this);
  current.ownedPrompts.add(current.promptTitle);
  await current.library.openNewPrompt();
  await current.library.fillPrompt(current.promptTitle, current.promptContent);
  await current.library.cancelDialog();
});

When('I edit the test prompt name and content', async function () {
  const current = state(this);
  current.ownedPrompts.add(current.editedPromptTitle);
  await current.library.editPrompt(current.promptTitle, current.editedPromptTitle, current.editedPromptContent);
});

When('I cancel editing the test prompt', async function () {
  const current = state(this);
  current.ownedPrompts.add(current.editedPromptTitle);
  await current.library.openPromptAction(current.promptTitle, 'Edit');
  await current.library.fillPrompt(current.editedPromptTitle, current.editedPromptContent);
  await current.library.cancelDialog();
});

Then('the edited test prompt is visible with its saved content', async function () {
  const current = state(this);
  await current.library.expectPrompt(current.editedPromptTitle, current.editedPromptContent);
});

Then('the original test prompt name is not visible', async function () {
  const current = state(this);
  await current.library.expectPromptAbsent(current.promptTitle);
});

Then('the edited test prompt name is not visible', async function () {
  const current = state(this);
  await current.library.expectPromptAbsent(current.editedPromptTitle);
});

When('I pin the test prompt', async function () {
  const current = state(this);
  await current.library.pinPrompt(current.promptTitle);
});

When('I unpin the test prompt', async function () {
  const current = state(this);
  await current.library.unpinPrompt(current.promptTitle);
});

When('I cancel deletion of the test prompt', async function () {
  const current = state(this);
  await current.library.openPromptAction(current.promptTitle, 'Delete');
  await current.library.cancelDialog();
});

When('I delete the test prompt', async function () {
  const current = state(this);
  await current.library.deletePrompt(current.promptTitle);
});

Given('I have three test prompts in their own Prompt Library category', async function () {
  const current = state(this);
  await createTestCategory(current);
  for (const prefix of ['Zulu', 'Alpha', 'Mike']) {
    const title = `${prefix} ${current.promptTitle}`;
    current.ownedPrompts.add(title);
    current.sortingTitles.push(title);
    await current.library.createPrompt(title, current.promptContent);
  }
});

When('I sort the Prompt Library by {string}', async function (value: string) {
  await state(this).library.sortPrompts(titleOrder(value));
});

Then('the test prompts are displayed in {string} order', async function (value: string) {
  const current = state(this);
  const titles = [...current.sortingTitles].sort();
  if (titleOrder(value) === 'Title: Z -> A') {
    titles.reverse();
  }
  await current.library.expectPromptOrder(titles);
});

When('I start a new chat using the test prompt', async function () {
  const current = state(this);
  await current.library.usePrompt(current.promptTitle);
});

Then('the chat input contains the saved test prompt content', async function () {
  await state(this).library.expectChatPrefilled(state(this).promptContent);
});

After({ tags: '@prompt-library', timeout: 90000 }, async function () {
  const current = state(this);
  try {
    if (current.ownedCategories.size === 0 && current.ownedPrompts.size === 0) {
      return;
    }
    await current.library.open();
    for (const category of current.ownedCategories) {
      if (await current.library.categoryLink(category).count() === 0) {
        continue;
      }
      await current.library.openCategory(category);
      for (const title of current.ownedPrompts) {
        if (await current.library.promptCard(title).count() > 0) {
          await current.library.deletePrompt(title);
        }
      }
      await current.library.deleteCategory(category);
    }
    // Deleting a category moves its prompts to General, including during partial failures.
    await current.library.openCategory('General');
    for (const title of current.ownedPrompts) {
      if (await current.library.promptCard(title).count() > 0) {
        await current.library.deletePrompt(title);
      }
    }
  } finally {
    states.delete(this);
  }
});
