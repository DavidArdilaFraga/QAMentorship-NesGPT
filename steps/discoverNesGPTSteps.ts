import {
  DISCOVER_NESGPT_TOPICS,
  DiscoverNesGPTPage,
  DiscoverNesGPTTopic,
} from '../pages/discoverNesGPTPage';
import { When, Then } from './fixtures';

function discoverTopic(value: string): DiscoverNesGPTTopic {
  const topic = DISCOVER_NESGPT_TOPICS.find(topic => topic === value);
  if (!topic) {
    throw new Error(`Unknown Discover NesGPT topic: ${value}`);
  }
  return topic;
}

Then('the Discover NesGPT header and navigation are visible', async function () {
  await new DiscoverNesGPTPage(this.page).expectLandingPageVisible();
});

Then('the NesGPT introduction and capabilities are visible', async function () {
  await new DiscoverNesGPTPage(this.page).expectIntroductionVisible();
});

When('I open the {string} Discover NesGPT topic', async function (value: string) {
  await new DiscoverNesGPTPage(this.page).openTopic(discoverTopic(value));
});

Then('the {string} Discover NesGPT content is visible', async function (value: string) {
  await new DiscoverNesGPTPage(this.page).expectTopicVisible(discoverTopic(value));
});
