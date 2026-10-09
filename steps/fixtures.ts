import { test as base, createBdd } from 'playwright-bdd';
import { existsSync } from 'fs';
import { AUTH_FILE } from '../playwright.config';
import { World } from './world';
import { LoginPage } from '../pages/loginPage';
import { TEST_USER } from './testUser';

export const test = base.extend<{ world: World }>({
  world: async ({ page }, use, testInfo) => {
    const world = new World(page, testInfo);
    await use(world);
  },
  storageState: async ({ $tags, storageState, browser }, use) => {
    // Apply the saved session only to features/scenarios tagged @auth.
    // Everything else (e.g. login tests) runs unauthenticated.
    if (!$tags.includes('@auth')) {
      storageState = { cookies: [], origins: [] };
      await use(storageState);
      return;
    }

    // If there is no saved session yet (e.g. the login test has not run),
    // authenticate once on the fly and save it for the following tests.
    if (!existsSync(AUTH_FILE)) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      await loginPage.open();
      await loginPage.login(TEST_USER.email, TEST_USER.password);
      await page.getByText('New chat').waitFor({ state: 'visible' });
      await context.storageState({ path: AUTH_FILE });
      await context.close();
    }

    await use(AUTH_FILE);
  },
});

export const { Given, When, Then, Before, After } = createBdd(test, {
  worldFixture: 'world',
});
