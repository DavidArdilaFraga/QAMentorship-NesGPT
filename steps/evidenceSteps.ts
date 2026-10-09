import { After } from './fixtures';
import { Evidence } from './evidence';

// Runs before any other After hook (explicit load order in playwright.config.ts),
// so the screenshot captures the exact state at the moment of the failure,
// before cleanup hooks close dialogs or delete test data.
After({ timeout: 15000 }, async function () {
  await Evidence.captureOnFailure(this.page, this.testInfo);
});
