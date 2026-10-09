import { HomePage } from '../pages/homePage';
import { LoginPage } from '../pages/loginPage';
import { AUTH_FILE } from '../playwright.config';
import { Given, When, Then } from './fixtures';
import { TEST_USER } from './testUser';

let loginPage: LoginPage;
let homePage: HomePage;

Given('I am on login page', async function () {
  loginPage = new LoginPage(this.page);
  await loginPage.open();
});

When('I complete the login form', async function () {
  await loginPage.login(TEST_USER.email, TEST_USER.password);
});

Then('I see the NesGPT homepage', async function () {
  homePage = new HomePage(this.page);
  await homePage.expectNewChatVisible();

  // Login verified: save the session so @auth tests reuse it
  await this.page.context().storageState({ path: AUTH_FILE });
});

Then('I receive an email', async function () {
  homePage = new HomePage(this.page);
  await homePage.expectLogoutVisible();
})
