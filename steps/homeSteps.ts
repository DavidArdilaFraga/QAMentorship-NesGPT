import { HomePage } from '../pages/homePage';
import { Given, When, Then } from './fixtures';

Given('I am on the NesGPT homepage', async function () {
  const homePage = new HomePage(this.page);
  await homePage.open();
  await homePage.expectNewChatVisible();
});

When('I open the {string} menu option', async function (menuOption: string) {
  const homePage = new HomePage(this.page);

  switch (menuOption) {
    case 'Prompt Library':
      await homePage.openPromptLibrary();
      break;
    case 'Chat History':
      await homePage.openChatHistory();
      break;
    case 'Discover NesGPT':
      await homePage.openDiscoverNesGPT();
      break;
    case 'Settings':
      await homePage.openSettings();
      break;
    default:
      throw new Error(`Unknown menu option: ${menuOption}`);
  }
});

Then('the {string} page is loaded correctly', async function (menuOption: string) {
  const homePage = new HomePage(this.page);

  switch (menuOption) {
    case 'Prompt Library':
      await homePage.expectPromptLibraryLoaded();
      break;
    case 'Chat History':
      await homePage.expectChatHistoryLoaded();
      break;
    case 'Discover NesGPT':
      await homePage.expectDiscoverNesGPTLoaded();
      break;
    case 'Settings':
      await homePage.expectSettingsLoaded();
      break;
    default:
      throw new Error(`Unknown menu option: ${menuOption}`);
  }
});
