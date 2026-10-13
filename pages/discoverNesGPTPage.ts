import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './basePage';
import { HomePage } from './homePage';

export const DISCOVER_NESGPT_TOPICS = [
  'What is NesGPT',
  'Essential Knowledge',
  'NesGPT AI Assistants',
  'Prompting',
  'NesGPT in Copilot',
  'FAQ (Frequently Asked Questions)',
  'Changelog',
  'Security and Compliance',
  'Support and Incident Reporting',
] as const;

export type DiscoverNesGPTTopic = typeof DISCOVER_NESGPT_TOPICS[number];

export class DiscoverNesGPTPage extends BasePage {
  static readonly CONTENT_TIMEOUT = 30000;

  private walkthroughHandlerRegistered = false;

  private static readonly TOPIC_CONTENT: Record<
    DiscoverNesGPTTopic,
    { section: 'About' | 'Help'; slug: string; marker: string | RegExp }
  > = {
    'What is NesGPT': {
      section: 'About',
      slug: 'what_is_nesgpt',
      marker: 'internal AI assistant for your everyday tasks',
    },
    'Essential Knowledge': {
      section: 'About',
      slug: 'essential_knowledge',
      marker: 'Essential Knowledge is the foundation',
    },
    'NesGPT AI Assistants': {
      section: 'About',
      slug: 'nesgpt_ai_assistants',
      marker: 'What are NesGPT AI Assistants?',
    },
    'Prompting': {
      section: 'About',
      slug: 'prompting',
      marker: 'What is a Prompt?',
    },
    'NesGPT in Copilot': {
      section: 'About',
      slug: 'nesgpt_in_copilot',
      marker: 'What is the NesGPT Microsoft 365 Copilot Agent?',
    },
    'FAQ (Frequently Asked Questions)': {
      section: 'About',
      slug: 'faq',
      marker: 'Who can use NesGPT?',
    },
    'Changelog': {
      section: 'About',
      slug: 'changelog',
      marker: /v\d+\.\d+\.\d+ \(\d{4}-\d{2}-\d{2}\)/,
    },
    'Security and Compliance': {
      section: 'Help',
      slug: 'security_and_compliance',
      marker: 'Is it safe and compliant to use NesGPT?',
    },
    'Support and Incident Reporting': {
      section: 'Help',
      slug: 'support_and_incident_reporting',
      marker: 'Have a question or need guidance?',
    },
  };

  readonly heading: Locator;
  readonly description: Locator;
  readonly breadcrumb: Locator;
  readonly content: Locator;
  readonly newChatButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = new HomePage(page).discoverNesGPTHeading;
    this.description = page.getByRole('paragraph').filter({
      hasText: 'Everything you need to know about',
    });
    this.breadcrumb = page.getByTestId('breadcrumb');
    this.content = page.locator('.markdown');
    this.newChatButton = page.getByRole('button', { name: 'New NesGPT chat', exact: true });
  }

  async expectLoaded(): Promise<void> {
    await this.expectVisible(this.heading, DiscoverNesGPTPage.CONTENT_TIMEOUT);
    await expect(this.page.getByTestId('loading-skeleton')).toHaveCount(0, {
      timeout: DiscoverNesGPTPage.CONTENT_TIMEOUT,
    });
    await this.expectVisible(this.content, DiscoverNesGPTPage.CONTENT_TIMEOUT);
    await expect(this.content).not.toBeEmpty({ timeout: DiscoverNesGPTPage.CONTENT_TIMEOUT });
  }

  async expectLandingPageVisible(): Promise<void> {
    await expect(this.page).toHaveURL(HomePage.DISCOVER_NESGPT_URL);
    await this.expectLoaded();
    await expect(this.description).toHaveText(
      /Everything you need to know about .*conversational AI solution/,
    );
    for (const section of ['About', 'Help']) {
      await this.expectVisible(this.page.getByRole('heading', { name: section, exact: true }));
    }
    for (const topic of DISCOVER_NESGPT_TOPICS) {
      await this.expectVisible(this.page.getByRole('button', { name: topic, exact: true }));
    }
    await this.expectVisible(this.newChatButton);
  }

  async expectIntroductionVisible(): Promise<void> {
    await this.expectTopicVisible('What is NesGPT');
    await this.expectVisible(this.content.getByText('You can use it to:', { exact: true }));
    for (const capability of [
      'Generate content',
      'Summarize documents',
      'Translate with context',
      'Brainstorm and structure ideas',
      'Interact with your own files',
      'Explore GenAI safely',
    ]) {
      await this.expectVisible(this.content.getByText(capability, { exact: true }));
    }
    await this.expectVisible(
      this.content.getByRole('link', { name: 'Digital Working Hub Sharepoint', exact: true }),
    );
  }

  async openTopic(topic: DiscoverNesGPTTopic): Promise<void> {
    if (!this.walkthroughHandlerRegistered) {
      await this.page.addLocatorHandler(
        this.page.locator('[id^="walkme-balloon"]').first(),
        async () => this.dismissWalkthroughIfPresent(),
      );
      this.walkthroughHandlerRegistered = true;
    }
    await this.expectLoaded();
    await this.click(this.page.getByRole('button', { name: topic, exact: true }));
  }

  async expectTopicVisible(topic: DiscoverNesGPTTopic): Promise<void> {
    const { section, slug, marker } = DiscoverNesGPTPage.TOPIC_CONTENT[topic];
    await expect(this.page).toHaveURL(
      `${HomePage.URL}help-center/${section.toLowerCase()}/${slug}`,
      { timeout: DiscoverNesGPTPage.CONTENT_TIMEOUT },
    );
    await this.expectLoaded();
    await expect(this.breadcrumb).toHaveText(`${section}>${topic}`);
    await expect(this.content).toContainText(marker, {
      timeout: DiscoverNesGPTPage.CONTENT_TIMEOUT,
    });
    for (const heading of await this.content.getByRole('heading').all()) {
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();
      await expect(heading).toBeInViewport();
    }
    for (const link of await this.content.getByRole('link').all()) {
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeVisible();
      await expect(link).toBeInViewport();
      await expect(link).toHaveAttribute('href', /^(https?:\/\/|mailto:)\S+/);
    }
  }
}
